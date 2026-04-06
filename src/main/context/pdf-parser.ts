import { readFile } from 'fs/promises'

interface ParseResult {
  text: string
  pages: number
}

export async function parsePdf(filePath: string): Promise<ParseResult> {
  // Dynamic import to avoid issues with electron packaging
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const buffer = await readFile(filePath)
  const result = await pdfParse(buffer)
  return {
    text: cleanText(result.text),
    pages: result.numpages
  }
}

export async function parseTxt(filePath: string): Promise<ParseResult> {
  const text = await readFile(filePath, 'utf-8')
  return { text: cleanText(text), pages: 1 }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')         // normalize line endings
    .replace(/\n{3,}/g, '\n\n')     // collapse excessive blank lines
    .replace(/[ \t]+\n/g, '\n')     // trim trailing spaces
    .replace(/^\s+|\s+$/g, '')      // trim document
}
