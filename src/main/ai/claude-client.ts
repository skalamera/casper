import Anthropic from '@anthropic-ai/sdk'
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

class ClaudeClient {
  private abortController: AbortController | null = null
  private isStreaming = false

  async requestSuggestion(opts: SuggestionRequest): Promise<void> {
    // Cancel any in-flight request
    this.cancel()

    const { anthropicApiKey } = secureStore.getKeys()
    if (!anthropicApiKey) {
      opts.onError(new Error('Anthropic API key not configured. Open Settings to add your key.'))
      return
    }

    const client = new Anthropic({ apiKey: anthropicApiKey })
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
      const stream = client.messages.stream(
        {
          model: opts.model,
          max_tokens: 1024,
          system,
          messages: [{ role: 'user', content: user }]
        },
        { signal: this.abortController.signal }
      )

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          opts.onChunk(event.delta.text)
        }
      }

      opts.onDone()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Normal cancellation — don't report as error
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

export const claudeClient = new ClaudeClient()
