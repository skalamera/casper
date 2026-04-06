/**
 * System audio loopback capture using Electron's built-in ScreenCaptureKit support.
 *
 * On macOS 13.2+, Chromium exposes system audio loopback via desktopCapturer
 * with special source IDs. We use the "electron-audio-loopback" approach:
 * capture a desktop source with audio-only, strip the video track.
 *
 * The actual capture runs in the renderer process. This module provides
 * the source ID discovery in the main process.
 */
import { desktopCapturer, systemPreferences } from 'electron'

export async function checkScreenRecordingPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') return true

  const status = systemPreferences.getMediaAccessStatus('screen')
  return status === 'granted'
}

export async function requestScreenRecordingPermission(): Promise<boolean> {
  // On macOS, we can't programmatically request screen recording permission.
  // We open System Preferences to guide the user.
  const { shell } = await import('electron')
  await shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
  )
  return false
}

/**
 * Get the source ID for loopback audio capture.
 * Returns the "Entire Screen" source which on macOS 13.2+ with Chromium flags
 * enabled will include system audio.
 */
export async function getLoopbackSourceId(): Promise<string | null> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 0, height: 0 }
    })
    // Use the first screen source (primary display)
    return sources[0]?.id ?? null
  } catch (err) {
    console.error('[Loopback] Failed to get sources:', err)
    return null
  }
}
