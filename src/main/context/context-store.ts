import { parsePdf, parseTxt } from './pdf-parser'
import { estimateTokens } from '../ai/prompt-builder'
import { JsonStore } from '../storage/json-store'
import type { ContextDocument } from '../ipc/channels'
import { extname, basename } from 'path'

const store = new JsonStore<{
  resume: ContextDocument | null
  jobDescription: ContextDocument | null
}>('casper-context', {
  resume: null,
  jobDescription: null
})

class ContextStore {
  async loadFile(
    filePath: string,
    type: 'resume' | 'jobDescription'
  ): Promise<{ success: boolean; doc?: ContextDocument; error?: string }> {
    try {
      const ext = extname(filePath).toLowerCase()
      let parsed: { text: string; pages: number }

      if (ext === '.pdf') {
        parsed = await parsePdf(filePath)
      } else if (ext === '.txt' || ext === '.md') {
        parsed = await parseTxt(filePath)
      } else {
        return { success: false, error: `Unsupported file type: ${ext}. Use PDF or TXT.` }
      }

      const doc: ContextDocument = {
        type,
        filename: basename(filePath),
        text: parsed.text,
        uploadedAt: Date.now(),
        tokenEstimate: estimateTokens(parsed.text)
      }

      store.set(type, doc)
      return { success: true, doc }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }

  getResume(): ContextDocument | null {
    return store.get('resume')
  }

  getJobDescription(): ContextDocument | null {
    return store.get('jobDescription')
  }

  clear(type: 'resume' | 'jobDescription'): void {
    store.set(type, null)
  }

  clearAll(): void {
    store.set('resume', null)
    store.set('jobDescription', null)
  }
}

export const contextStore = new ContextStore()
