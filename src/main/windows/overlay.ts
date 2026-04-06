import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export async function createOverlayWindow(): Promise<BrowserWindow> {
  const { width } = screen.getPrimaryDisplay().workAreaSize

  const win = new BrowserWindow({
    // Size — narrow panel on the right side of screen
    width: 380,
    height: 640,
    // Position — right edge, vertically centered
    x: width - 400,
    y: 80,

    // Transparency & frameless
    transparent: true,
    frame: false,
    vibrancy: undefined,
    backgroundColor: '#00000000',

    // Always on top at the highest level
    alwaysOnTop: true,

    // Hide from taskbar / dock
    skipTaskbar: true,

    // Allow resizing for user convenience
    resizable: true,
    minimizable: false,
    maximizable: false,

    // No shadow (avoids visual artifacts with transparent windows)
    hasShadow: false,

    // Show on all desktops / spaces
    visibleOnAllWorkspaces: true,
    fullscreenable: false,

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,        // needed for preload to use contextBridge properly
      webSecurity: true
    }
  })

  // ── CORE INVISIBILITY ──────────────────────────────────────────────────────
  // macOS: sets NSWindow.sharingType = NSWindowSharingNone
  // Windows: sets SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)
  // This makes the window invisible to screen sharing and screenshots.
  win.setContentProtection(true)

  // Stay above fullscreen apps on macOS
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // ── Load URL ───────────────────────────────────────────────────────────────
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // Don't open devtools for overlay — use separate devtools window
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
