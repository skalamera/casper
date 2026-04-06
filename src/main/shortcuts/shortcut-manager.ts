import { globalShortcut } from 'electron'
import { windowManager } from '../windows/window-manager'
import { audioManager } from '../audio/audio-manager'
import { IPC } from '../ipc/channels'

const SHORTCUTS = {
  TOGGLE_OVERLAY: 'CommandOrControl+\\',
  TRIGGER_AI: 'CommandOrControl+Return',
  MODE_SUGGEST: 'CommandOrControl+Shift+1',
  MODE_ASSIST: 'CommandOrControl+Shift+2',
  MODE_FOLLOWUP: 'CommandOrControl+Shift+3',
  MODE_RECAP: 'CommandOrControl+Shift+4',
  TOGGLE_RECORD: 'CommandOrControl+Shift+R',
  PANIC_HIDE: 'CommandOrControl+Escape',
  OPEN_SETTINGS: 'CommandOrControl+,'
} as const

export function registerShortcuts(): void {
  // Toggle overlay visibility
  globalShortcut.register(SHORTCUTS.TOGGLE_OVERLAY, () => {
    windowManager.toggleOverlay()
  })

  // Trigger AI suggestion (manual)
  globalShortcut.register(SHORTCUTS.TRIGGER_AI, () => {
    windowManager.sendToOverlay('shortcut:trigger-ai', { mode: 'suggest' })
  })

  // Switch modes
  globalShortcut.register(SHORTCUTS.MODE_SUGGEST, () => {
    windowManager.sendToOverlay('shortcut:set-mode', 'suggest')
  })

  globalShortcut.register(SHORTCUTS.MODE_ASSIST, () => {
    windowManager.sendToOverlay('shortcut:set-mode', 'assist')
  })

  globalShortcut.register(SHORTCUTS.MODE_FOLLOWUP, () => {
    windowManager.sendToOverlay('shortcut:set-mode', 'followup')
  })

  globalShortcut.register(SHORTCUTS.MODE_RECAP, () => {
    windowManager.sendToOverlay('shortcut:set-mode', 'recap')
  })

  // Toggle recording
  globalShortcut.register(SHORTCUTS.TOGGLE_RECORD, () => {
    if (audioManager.isCapturing()) {
      audioManager.stop()
    } else {
      audioManager.start()
    }
  })

  // PANIC: instant hide
  globalShortcut.register(SHORTCUTS.PANIC_HIDE, () => {
    windowManager.panicHide()
  })

  // Open settings
  globalShortcut.register(SHORTCUTS.OPEN_SETTINGS, () => {
    windowManager.openSettings()
  })
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll()
}
