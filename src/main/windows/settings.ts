import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export function createSettingsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    title: 'Casper Settings',
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    resizable: false,
    minimizable: true,
    maximizable: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Settings window is NOT content-protected — it should be visible normally
  win.setContentProtection(false)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#settings`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'settings' })
  }

  return win
}
