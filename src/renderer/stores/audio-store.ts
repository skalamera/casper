import { create } from 'zustand'
import type { AudioStatus } from '../../main/ipc/channels'

interface AudioStore extends AudioStatus {
  update: (partial: Partial<AudioStatus>) => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  isCapturing: false,
  micConnected: false,
  systemAudioConnected: false,
  deepgramInterviewerConnected: false,
  deepgramCandidateConnected: false,
  error: undefined,
  update: (partial) => set((state) => ({ ...state, ...partial }))
}))
