import { create } from 'zustand'
import type { ResponseMode } from '../../main/ipc/channels'

type SuggestionState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

interface SuggestionStore {
  state: SuggestionState
  mode: ResponseMode
  text: string
  error: string | null

  setMode: (mode: ResponseMode) => void
  startStreaming: () => void
  appendChunk: (chunk: string) => void
  setDone: () => void
  setError: (error: string) => void
  clear: () => void
}

export const useSuggestionStore = create<SuggestionStore>((set) => ({
  state: 'idle',
  mode: 'suggest',
  text: '',
  error: null,

  setMode: (mode) => set({ mode }),
  startStreaming: () => set({ state: 'streaming', text: '', error: null }),
  appendChunk: (chunk) => set((s) => ({ text: s.text + chunk })),
  setDone: () => set({ state: 'done' }),
  setError: (error) => set({ state: 'error', error }),
  clear: () => set({ state: 'idle', text: '', error: null })
}))
