/**
 * Manages automatic AI suggestion triggering when the interviewer finishes speaking.
 * Implements debouncing to avoid triggering mid-sentence.
 */
import { ipcMain } from 'electron'
import { IPC } from '../ipc/channels'
import { configStore } from '../storage/config-store'

class AiTrigger {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  scheduleAutoTrigger(): void {
    const settings = configStore.get()
    if (!settings.autoTrigger) return

    // Clear any existing pending trigger
    this.cancelTimer()

    // Schedule trigger after debounce period
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      // Fire the AI request with 'suggest' mode via the IPC system
      ipcMain.emit(IPC.AI_REQUEST, null, { mode: 'suggest' })
    }, settings.autoTriggerDebounceMs)
  }

  cancel(): void {
    this.cancelTimer()
  }

  private cancelTimer(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }
}

export const aiTrigger = new AiTrigger()
