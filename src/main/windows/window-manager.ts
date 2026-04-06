import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { createOverlayWindow } from './overlay'
import { createSettingsWindow } from './settings'

class WindowManager {
  private overlayWindow: BrowserWindow | null = null
  private settingsWindow: BrowserWindow | null = null
  private overlayVisible = true

  async createAll(): Promise<void> {
    this.overlayWindow = await createOverlayWindow()
    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null
    })
  }

  getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindow
  }

  toggleOverlay(): void {
    if (!this.overlayWindow) return
    if (this.overlayVisible) {
      this.overlayWindow.hide()
      this.overlayVisible = false
    } else {
      this.overlayWindow.show()
      this.overlayVisible = true
    }
  }

  minimizeOverlay(): void {
    // Handled inside renderer (toggle between collapsed/expanded state)
    this.overlayWindow?.webContents.send('window:minimize')
  }

  panicHide(): void {
    if (!this.overlayWindow) return
    this.overlayWindow.hide()
    this.overlayVisible = false
  }

  openSettings(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus()
      return
    }
    this.settingsWindow = createSettingsWindow()
    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null
    })
  }

  sendToOverlay(channel: string, ...args: unknown[]): void {
    this.overlayWindow?.webContents.send(channel, ...args)
  }
}

export const windowManager = new WindowManager()
