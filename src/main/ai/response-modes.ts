import type { ResponseMode } from '../ipc/channels'

export interface ModeConfig {
  label: string
  shortLabel: string
  description: string
  systemSuffix: string
  emoji: string
}

export const RESPONSE_MODES: Record<ResponseMode, ModeConfig> = {
  suggest: {
    label: 'Suggest Answer',
    shortLabel: 'Suggest',
    description: 'Get a structured answer to the current question',
    emoji: '💡',
    systemSuffix: `
Generate a strong, concise answer to the most recent interview question.
Guidelines:
- Use the STAR method (Situation, Task, Action, Result) for behavioral questions
- For technical questions, structure: explain the concept, give an example, mention trade-offs
- Reference specific experience from the resume where relevant
- Keep the answer to 2-4 minutes of speaking time (roughly 300-500 words)
- Use natural, conversational language — not robotic or overly formal
- Bold the most important phrases the candidate should emphasize
- Start with a direct answer before elaborating

Format as: **Core answer** followed by supporting details.`
  },

  assist: {
    label: 'Assist',
    shortLabel: 'Assist',
    description: 'Get talking points and context for the current topic',
    emoji: '🧠',
    systemSuffix: `
Provide helpful talking points, context, and insights to support the candidate in the current conversation.
Guidelines:
- Identify the underlying topic or concern being discussed
- Provide 3-5 specific, actionable talking points
- Include any relevant data points, metrics, or industry context
- Reference relevant parts of the candidate's background
- Flag any potential follow-up questions the interviewer might ask
- Keep it concise — bullet points preferred

Format as a brief intro sentence followed by bullet points.`
  },

  followup: {
    label: 'Follow-up Questions',
    shortLabel: 'Follow-up',
    description: 'Suggest questions to ask the interviewer',
    emoji: '🔍',
    systemSuffix: `
Suggest 3-5 thoughtful questions the candidate should ask the interviewer based on the conversation so far and the job description.
Guidelines:
- Questions should show genuine curiosity and strategic thinking
- Avoid questions whose answers are obvious from the JD or public information
- Mix tactical questions (day-to-day realities) and strategic questions (company direction)
- Tailor questions to what's been discussed in this conversation
- Each question should have a brief note on WHY it's a good question to ask

Format: Numbered list, each with the question and a one-line rationale in italics.`
  },

  recap: {
    label: 'Recap',
    shortLabel: 'Recap',
    description: 'Summarize the conversation and identify gaps',
    emoji: '📋',
    systemSuffix: `
Provide a concise summary of this interview conversation.
Include:
1. **Topics Covered**: Key subjects discussed and main points made
2. **Questions Asked**: Each interviewer question and a brief summary of the answer given
3. **Strengths Demonstrated**: What went well based on the transcript
4. **Gaps**: Any requirements from the job description that haven't been addressed yet
5. **Next Moves**: 1-2 suggestions for redirecting the conversation

Keep the total summary under 400 words. Use clear headers.`
  }
}
