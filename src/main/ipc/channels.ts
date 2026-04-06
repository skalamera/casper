// ─────────────────────────────────────────────────────────────────────────────
// IPC Channel Definitions — the typed contract between Main and Renderer
// ALL inter-process communication must go through these typed channels.
// ─────────────────────────────────────────────────────────────────────────────

export const IPC = {
  // ── Audio ──────────────────────────────────────────────────────────────────
  AUDIO_START: 'audio:start',
  AUDIO_STOP: 'audio:stop',
  AUDIO_STATUS: 'audio:status',                 // main → renderer (push)
  AUDIO_GET_DEVICES: 'audio:get-devices',
  AUDIO_SET_DEVICE: 'audio:set-device',

  // ── Transcription ──────────────────────────────────────────────────────────
  TRANSCRIPT_ENTRY: 'transcript:entry',          // main → renderer (push)
  TRANSCRIPT_CLEAR: 'transcript:clear',
  TRANSCRIPT_GET_ALL: 'transcript:get-all',

  // ── AI ─────────────────────────────────────────────────────────────────────
  AI_REQUEST: 'ai:request',
  AI_CHUNK: 'ai:chunk',                          // main → renderer (push, streaming)
  AI_DONE: 'ai:done',                            // main → renderer (push)
  AI_ERROR: 'ai:error',                          // main → renderer (push)
  AI_CANCEL: 'ai:cancel',

  // ── Context (Resume / JD) ──────────────────────────────────────────────────
  CONTEXT_UPLOAD: 'context:upload',
  CONTEXT_GET: 'context:get',
  CONTEXT_CLEAR: 'context:clear',

  // ── Settings / Config ──────────────────────────────────────────────────────
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_KEYS: 'settings:get-keys',
  SETTINGS_SET_KEY: 'settings:set-key',

  // ── Window / UI ────────────────────────────────────────────────────────────
  WINDOW_TOGGLE_OVERLAY: 'window:toggle-overlay',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_OPEN_SETTINGS: 'window:open-settings',

  // ── Session ────────────────────────────────────────────────────────────────
  SESSION_EXPORT: 'session:export',
  SESSION_GET_STATUS: 'session:get-status',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]

// ─────────────────────────────────────────────────────────────────────────────
// Shared type definitions used in IPC messages
// ─────────────────────────────────────────────────────────────────────────────

export type Speaker = 'interviewer' | 'candidate'

export type ResponseMode = 'suggest' | 'assist' | 'followup' | 'recap'

export interface TranscriptEntry {
  id: string
  speaker: Speaker
  text: string
  isFinal: boolean
  timestamp: number
}

export interface AudioDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

export interface AudioStatus {
  isCapturing: boolean
  micConnected: boolean
  systemAudioConnected: boolean
  deepgramInterviewerConnected: boolean
  deepgramCandidateConnected: boolean
  error?: string
}

export interface ContextDocument {
  type: 'resume' | 'jobDescription'
  filename: string
  text: string
  uploadedAt: number
  tokenEstimate: number
}

export interface Settings {
  overlayOpacity: number
  overlayPosition: { x: number; y: number }
  model: 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514'
  autoTrigger: boolean
  autoTriggerDebounceMs: number
  micDeviceId: string | null
  theme: 'dark' | 'light'
}

export interface SecureKeys {
  deepgramApiKey: string
  anthropicApiKey: string
}

export interface AiRequest {
  mode: ResponseMode
  customPrompt?: string
}

export interface SessionStatus {
  isRecording: boolean
  startedAt: number | null
  transcriptEntryCount: number
  hasResume: boolean
  hasJobDescription: boolean
}
