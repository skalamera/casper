import { create } from 'zustand'
import type { ContextDocument } from '../../main/ipc/channels'

interface ContextStore {
  resume: ContextDocument | null
  jobDescription: ContextDocument | null
  setResume: (doc: ContextDocument | null) => void
  setJobDescription: (doc: ContextDocument | null) => void
}

export const useContextStore = create<ContextStore>((set) => ({
  resume: null,
  jobDescription: null,
  setResume: (doc) => set({ resume: doc }),
  setJobDescription: (doc) => set({ jobDescription: doc })
}))
