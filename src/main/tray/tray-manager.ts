import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { windowManager } from '../windows/window-manager'
import { audioManager } from '../audio/audio-manager'

let tray: Tray | null = null

export function createTray(): void {
  // Use a template image for macOS (auto dark/light mode)
  const iconPath = join(__dirname, '../../resources/trayTemplate.png')
  let icon: Electron.NativeImage

  try {
    icon = nativeImage.createFromPath(iconPath)
  } catch {
    // Fallback to empty icon if resource not found yet
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Casper — AI Interview Assistant')
  updateTrayMenu()
}

export function updateTrayMenu(): void {
  if (!tray) return

  const isRecording = audioManager.isCapturing()

  const menu = Menu.buildFromTemplate([
    {
      label: 'Casper',
      enabled: false
    },
    { type: 'separator' },
    {
      label: isRecording ? '⏹ Stop Recording' : '⏺ Start Recording',
      click: () => {
        if (isRecording) {
          audioManager.stop()
        } else {
          audioManager.start()
        }
        updateTrayMenu()
      }
    },
    {
      label: 'Show/Hide Overlay',
      accelerator: 'CommandOrControl+\\',
      click: () => windowManager.toggleOverlay()
    },
    { type: 'separator' },
    {
      label: 'Settings',
      accelerator: 'CommandOrControl+,',
      click: () => windowManager.openSettings()
    },
    { type: 'separator' },
    {
      label: 'Quit Casper',
      accelerator: 'CommandOrControl+Q',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(menu)
}
