import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ResponseMode,
  AudioStatus,
  TranscriptEntry,
  ContextDocument,
  Settings,
  SecureKeys,
  SessionStatus
} from '../main/ipc/channels'
import { IPC } from '../main/ipc/channels'

// ── Typed API exposed to renderer via window.electronAPI ─────────────────────

const casperAPI = {
  // ── Audio ─────────────────────────────────────────────────────────────────
  audio: {
    start: () => ipcRenderer.invoke(IPC.AUDIO_START),
    stop: () => ipcRenderer.invoke(IPC.AUDIO_STOP),
    getDevices: () => ipcRenderer.invoke(IPC.AUDIO_GET_DEVICES),
    setDevice: (deviceId: string) => ipcRenderer.invoke(IPC.AUDIO_SET_DEVICE, deviceId),

    // Renderer → Main: send raw PCM chunks for transcription
    sendInterviewerChunk: (chunk: Buffer) =>
      ipcRenderer.send('audio-internal:interviewer-chunk', chunk),
    sendCandidateChunk: (chunk: Buffer) =>
      ipcRenderer.send('audio-internal:candidate-chunk', chunk),
    reportReady: () => ipcRenderer.send('audio-internal:capture-ready'),
    reportError: (error: string) => ipcRenderer.send('audio-internal:capture-error', error),

    // Events from main
    onStatus: (cb: (status: Partial<AudioStatus>) => void) => {
      const handler = (_: unknown, status: Partial<AudioStatus>) => cb(status)
      ipcRenderer.on(IPC.AUDIO_STATUS, handler)
      return () => ipcRenderer.removeListener(IPC.AUDIO_STATUS, handler)
    },
    onStartCapture: (cb: () => void) => {
      ipcRenderer.on('audio-internal:start-capture', cb)
      return () => ipcRenderer.removeListener('audio-internal:start-capture', cb)
    },
    onStopCapture: (cb: () => void) => {
      ipcRenderer.on('audio-internal:stop-capture', cb)
      return () => ipcRenderer.removeListener('audio-internal:stop-capture', cb)
    },
    onSetMicDevice: (cb: (deviceId: string) => void) => {
      const handler = (_: unknown, id: string) => cb(id)
      ipcRenderer.on('audio-internal:set-mic-device', handler)
      return () => ipcRenderer.removeListener('audio-internal:set-mic-device', handler)
    }
  },

  // ── Transcript ────────────────────────────────────────────────────────────
  transcript: {
    getAll: (): Promise<TranscriptEntry[]> => ipcRenderer.invoke(IPC.TRANSCRIPT_GET_ALL),
    clear: () => ipcRenderer.invoke(IPC.TRANSCRIPT_CLEAR),
    onEntry: (cb: (entry: TranscriptEntry) => void) => {
      const handler = (_: unknown, entry: TranscriptEntry) => cb(entry)
      ipcRenderer.on(IPC.TRANSCRIPT_ENTRY, handler)
      return () => ipcRenderer.removeListener(IPC.TRANSCRIPT_ENTRY, handler)
    }
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  ai: {
    request: (mode: ResponseMode, customPrompt?: string) =>
      ipcRenderer.invoke(IPC.AI_REQUEST, { mode, customPrompt }),
    cancel: () => ipcRenderer.invoke(IPC.AI_CANCEL),
    onChunk: (cb: (chunk: string) => void) => {
      const handler = (_: unknown, chunk: string) => cb(chunk)
      ipcRenderer.on(IPC.AI_CHUNK, handler)
      return () => ipcRenderer.removeListener(IPC.AI_CHUNK, handler)
    },
    onDone: (cb: () => void) => {
      ipcRenderer.on(IPC.AI_DONE, cb)
      return () => ipcRenderer.removeListener(IPC.AI_DONE, cb)
    },
    onError: (cb: (error: string) => void) => {
      const handler = (_: unknown, err: string) => cb(err)
      ipcRenderer.on(IPC.AI_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC.AI_ERROR, handler)
    }
  },

  // ── Context ───────────────────────────────────────────────────────────────
  context: {
    upload: (filePath: string, type: 'resume' | 'jobDescription') =>
      ipcRenderer.invoke(IPC.CONTEXT_UPLOAD, filePath, type),
    get: (): Promise<{ resume: ContextDocument | null; jobDescription: ContextDocument | null }> =>
      ipcRenderer.invoke(IPC.CONTEXT_GET),
    clear: (type: 'resume' | 'jobDescription') => ipcRenderer.invoke(IPC.CONTEXT_CLEAR, type)
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
    set: (settings: Partial<Settings>) => ipcRenderer.invoke(IPC.SETTINGS_SET, settings),
    getKeys: (): Promise<SecureKeys> => ipcRenderer.invoke(IPC.SETTINGS_GET_KEYS),
    setKey: (key: string, value: string) => ipcRenderer.invoke(IPC.SETTINGS_SET_KEY, key, value)
  },

  // ── Window ────────────────────────────────────────────────────────────────
  window: {
    toggleOverlay: () => ipcRenderer.invoke(IPC.WINDOW_TOGGLE_OVERLAY),
    minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
    openSettings: () => ipcRenderer.invoke(IPC.WINDOW_OPEN_SETTINGS),
    onMinimize: (cb: () => void) => {
      ipcRenderer.on('window:minimize', cb)
      return () => ipcRenderer.removeListener('window:minimize', cb)
    }
  },

  // ── Session ───────────────────────────────────────────────────────────────
  session: {
    getStatus: (): Promise<SessionStatus> => ipcRenderer.invoke(IPC.SESSION_GET_STATUS),
    export: (format: 'markdown' | 'text') => ipcRenderer.invoke(IPC.SESSION_EXPORT, format)
  },

  // ── Dialog ────────────────────────────────────────────────────────────────
  dialog: {
    openFile: (filters: { name: string; extensions: string[] }[]): Promise<string | null> =>
      ipcRenderer.invoke(IPC.DIALOG_OPEN_FILE, filters)
  },

  // ── Shortcuts (from main to renderer) ─────────────────────────────────────
  shortcuts: {
    onTriggerAi: (cb: (data: { mode: ResponseMode }) => void) => {
      const handler = (_: unknown, data: { mode: ResponseMode }) => cb(data)
      ipcRenderer.on('shortcut:trigger-ai', handler)
      return () => ipcRenderer.removeListener('shortcut:trigger-ai', handler)
    },
    onSetMode: (cb: (mode: ResponseMode) => void) => {
      const handler = (_: unknown, mode: ResponseMode) => cb(mode)
      ipcRenderer.on('shortcut:set-mode', handler)
      return () => ipcRenderer.removeListener('shortcut:set-mode', handler)
    }
  }
}

// Expose to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('casper', casperAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore
  window.casper = casperAPI
}

// Export type for use in renderer
export type CasperAPI = typeof casperAPI
