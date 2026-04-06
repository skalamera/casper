import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC, AiRequest, Settings } from './channels'
import { audioManager } from '../audio/audio-manager'
import { transcriptStore } from '../transcription/transcript-store'
import { claudeClient } from '../ai/claude-client'
import { contextStore } from '../context/context-store'
import { configStore } from '../storage/config-store'
import { secureStore } from '../storage/secure-store'
import { windowManager } from '../windows/window-manager'

export function registerIpcHandlers(): void {
  // ── Audio ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.AUDIO_START, async () => {
    return audioManager.start()
  })

  ipcMain.handle(IPC.AUDIO_STOP, async () => {
    return audioManager.stop()
  })

  ipcMain.handle(IPC.AUDIO_GET_DEVICES, async () => {
    return audioManager.getDevices()
  })

  ipcMain.handle(IPC.AUDIO_SET_DEVICE, async (_event, deviceId: string) => {
    return audioManager.setMicDevice(deviceId)
  })

  // ── Transcription ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TRANSCRIPT_GET_ALL, async () => {
    return transcriptStore.getAll()
  })

  ipcMain.handle(IPC.TRANSCRIPT_CLEAR, async () => {
    transcriptStore.clear()
  })

  // ── AI ────────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.AI_REQUEST, async (_event, request: AiRequest) => {
    const overlay = windowManager.getOverlayWindow()
    if (!overlay) return { error: 'No overlay window' }

    const resume = contextStore.getResume()
    const jobDescription = contextStore.getJobDescription()
    const transcript = transcriptStore.getAll()
    const settings = configStore.get()

    await claudeClient.requestSuggestion({
      mode: request.mode,
      customPrompt: request.customPrompt,
      resume,
      jobDescription,
      transcript,
      model: settings.model,
      onChunk: (chunk) => overlay.webContents.send(IPC.AI_CHUNK, chunk),
      onDone: () => overlay.webContents.send(IPC.AI_DONE),
      onError: (err) => overlay.webContents.send(IPC.AI_ERROR, err.message)
    })
  })

  ipcMain.handle(IPC.AI_CANCEL, async () => {
    claudeClient.cancel()
  })

  // ── Context ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.CONTEXT_UPLOAD, async (_event, filePath: string, type: 'resume' | 'jobDescription') => {
    return contextStore.loadFile(filePath, type)
  })

  ipcMain.handle(IPC.CONTEXT_GET, async () => {
    return {
      resume: contextStore.getResume(),
      jobDescription: contextStore.getJobDescription()
    }
  })

  ipcMain.handle(IPC.CONTEXT_CLEAR, async (_event, type: 'resume' | 'jobDescription') => {
    contextStore.clear(type)
  })

  // ── Settings ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SETTINGS_GET, async () => {
    return configStore.get()
  })

  ipcMain.handle(IPC.SETTINGS_SET, async (_event, settings: Partial<Settings>) => {
    configStore.set(settings)
  })

  ipcMain.handle(IPC.SETTINGS_GET_KEYS, async () => {
    return secureStore.getKeys()
  })

  ipcMain.handle(IPC.SETTINGS_SET_KEY, async (_event, key: string, value: string) => {
    secureStore.setKey(key, value)
  })

  // ── Window ────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.WINDOW_TOGGLE_OVERLAY, async () => {
    windowManager.toggleOverlay()
  })

  ipcMain.handle(IPC.WINDOW_MINIMIZE, async () => {
    windowManager.minimizeOverlay()
  })

  ipcMain.handle(IPC.WINDOW_OPEN_SETTINGS, async () => {
    windowManager.openSettings()
  })

  // ── Session ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SESSION_GET_STATUS, async () => {
    return {
      isRecording: audioManager.isCapturing(),
      startedAt: audioManager.getStartedAt(),
      transcriptEntryCount: transcriptStore.getAll().length,
      hasResume: !!contextStore.getResume(),
      hasJobDescription: !!contextStore.getJobDescription()
    }
  })

  // ── Dialog ────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.DIALOG_OPEN_FILE, async (_event, filters: Electron.FileFilter[]) => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC.SESSION_EXPORT, async (_event, format: 'markdown' | 'text') => {
    const overlay = BrowserWindow.getAllWindows()[0]
    if (!overlay) return

    const { filePath } = await dialog.showSaveDialog(overlay, {
      title: 'Export Transcript',
      defaultPath: `casper-transcript-${Date.now()}`,
      filters:
        format === 'markdown'
          ? [{ name: 'Markdown', extensions: ['md'] }]
          : [{ name: 'Text', extensions: ['txt'] }]
    })

    if (!filePath) return { cancelled: true }

    const entries = transcriptStore.getAll()
    const fs = await import('fs/promises')
    const content = entries
      .map((e) => `[${e.speaker === 'interviewer' ? 'Interviewer' : 'You'}] ${e.text}`)
      .join('\n\n')

    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true, filePath }
  })
}
