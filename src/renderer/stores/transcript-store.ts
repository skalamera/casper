import { create } from 'zustand'
import type { TranscriptEntry } from '../../main/ipc/channels'

interface TranscriptStore {
  entries: TranscriptEntry[]
  addOrUpdate: (entry: TranscriptEntry) => void
  clear: () => void
}

export const useTranscriptStore = create<TranscriptStore>((set) => ({
  entries: [],

  addOrUpdate: (entry: TranscriptEntry) =>
    set((state) => {
      const idx = state.entries.findIndex((e) => e.id === entry.id)
      if (idx === -1) {
        return { entries: [...state.entries, entry] }
      }
      const updated = [...state.entries]
      updated[idx] = entry
      return { entries: updated }
    }),

  clear: () => set({ entries: [] })
}))
