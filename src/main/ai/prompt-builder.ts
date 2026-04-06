import type { TranscriptEntry, ResponseMode, ContextDocument } from '../ipc/channels'
import { RESPONSE_MODES } from './response-modes'

const MAX_TRANSCRIPT_TURNS = 15

interface BuildPromptOptions {
  mode: ResponseMode
  transcript: TranscriptEntry[]
  resume: ContextDocument | null
  jobDescription: ContextDocument | null
  customPrompt?: string
}

interface BuiltPrompt {
  system: string
  user: string
}

export function buildPrompt(opts: BuildPromptOptions): BuiltPrompt {
  const { mode, transcript, resume, jobDescription, customPrompt } = opts
  const modeConfig = RESPONSE_MODES[mode]

  // ── System prompt ──────────────────────────────────────────────────────────
  const systemParts: string[] = [
    `You are an expert interview coach providing real-time assistance to a job candidate during a live interview. You have access to the candidate's resume and the job description. Your role is to provide concise, actionable, high-quality guidance that the candidate can immediately act on.

IMPORTANT: Responses are displayed in a small overlay window. Be concise and formatted for quick reading. Use markdown formatting (bold, bullets, numbered lists) for clarity.`,

    resume
      ? `CANDIDATE RESUME:\n${resume.text}`
      : 'CANDIDATE RESUME: [Not uploaded — encourage candidate to upload their resume for better assistance]',

    jobDescription
      ? `JOB DESCRIPTION:\n${jobDescription.text}`
      : 'JOB DESCRIPTION: [Not uploaded — encourage candidate to upload the job description for better assistance]',

    modeConfig.systemSuffix
  ]

  const system = systemParts.join('\n\n---\n\n')

  // ── User message (conversation + task) ────────────────────────────────────
  const recent = transcript.filter((e) => e.isFinal).slice(-MAX_TRANSCRIPT_TURNS)

  let userMessage = ''

  if (recent.length > 0) {
    const transcriptText = recent
      .map((e) => `[${e.speaker === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}]: ${e.text}`)
      .join('\n')
    userMessage += `LIVE INTERVIEW TRANSCRIPT (most recent ${recent.length} exchanges):\n${transcriptText}\n\n`
  } else {
    userMessage += 'LIVE INTERVIEW TRANSCRIPT: [No transcript yet — the interview may just be starting]\n\n'
  }

  if (customPrompt) {
    userMessage += `CANDIDATE QUESTION: ${customPrompt}\n\n`
  }

  userMessage += `Please provide ${modeConfig.label} assistance based on the above.`

  return { system, user: userMessage }
}

/**
 * Estimate token count for budget management.
 * Rough approximation: 1 token ≈ 4 chars
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
