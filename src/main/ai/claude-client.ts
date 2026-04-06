import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { buildPrompt } from './prompt-builder'
import { secureStore } from '../storage/secure-store'
import type { ResponseMode, TranscriptEntry, ContextDocument } from '../ipc/channels'

interface SuggestionRequest {
  mode: ResponseMode
  customPrompt?: string
  resume: ContextDocument | null
  jobDescription: ContextDocument | null
  transcript: TranscriptEntry[]
  model: string
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

class GeminiClient {
  private abortController: AbortController | null = null
  private isStreaming = false

  async requestSuggestion(opts: SuggestionRequest): Promise<void> {
    // Cancel any in-flight request
    this.cancel()

    const { geminiApiKey } = secureStore.getKeys()
    if (!geminiApiKey) {
      opts.onError(new Error('Gemini API key not configured. Open Settings to add your key.'))
      return
    }

    this.abortController = new AbortController()
    this.isStreaming = true

    const { system, user } = buildPrompt({
      mode: opts.mode,
      transcript: opts.transcript,
      resume: opts.resume,
      jobDescription: opts.jobDescription,
      customPrompt: opts.customPrompt
    })

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({
        model: opts.model,
        systemInstruction: system,
        // Relax safety settings — interview content is benign but may trigger false positives
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
        ]
      })

      const result = await model.generateContentStream(
        { contents: [{ role: 'user', parts: [{ text: user }] }] },
        { signal: this.abortController.signal }
      )

      for await (const chunk of result.stream) {
        if (this.abortController?.signal.aborted) break
        const text = chunk.text()
        if (text) opts.onChunk(text)
      }

      if (!this.abortController?.signal.aborted) {
        opts.onDone()
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
        return
      }
      opts.onError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      this.isStreaming = false
      this.abortController = null
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.isStreaming = false
  }

  get streaming(): boolean {
    return this.isStreaming
  }
}

// Export with the same name so handlers.ts import is unchanged
export const claudeClient = new GeminiClient()
