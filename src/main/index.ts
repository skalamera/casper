import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { windowManager } from './windows/window-manager'
import { registerIpcHandlers } from './ipc/handlers'
import { registerShortcuts, unregisterShortcuts } from './shortcuts/shortcut-manager'
import { createTray } from './tray/tray-manager'
// Import audioManager to initialize its IPC handlers
import './audio/audio-manager'

// ── App lifecycle ───────────────────────────────────────────────────────────

// macOS: keep app running without windows
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(async () => {
  // Set app user model id for Windows notifications
  electronApp.setAppUserModelId('com.casper.app')

  // Optimize for Electron's security model in dev
  app.on('browser-window-created', (_, window) => {
    optimizer.watchShortcuts(window)
  })

  // Register all IPC handlers before creating windows
  registerIpcHandlers()

  // Create overlay window (main UI)
  await windowManager.createAll()

  // Register global keyboard shortcuts
  registerShortcuts()

  // Create system tray icon
  createTray()

  // macOS: re-create window on dock icon click
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await windowManager.createAll()
    }
  })
})

app.on('will-quit', () => {
  unregisterShortcuts()
})

// Handle certificate errors in development
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})
