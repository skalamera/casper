/**
 * Dead-simple JSON file store — no third-party deps, no ESM/CJS issues.
 * Reads/writes a single JSON file under app.getPath('userData').
 * Synchronous on read (startup), async-safe on write (all calls are sync).
 */
import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export class JsonStore<T extends Record<string, unknown>> {
  private path: string
  private data: T

  constructor(name: string, defaults: T) {
    const dir = app.getPath('userData')
    mkdirSync(dir, { recursive: true })
    this.path = join(dir, `${name}.json`)
    this.data = this.load(defaults)
  }

  private load(defaults: T): T {
    try {
      if (!existsSync(this.path)) return { ...defaults }
      const raw = readFileSync(this.path, 'utf-8')
      return { ...defaults, ...JSON.parse(raw) }
    } catch {
      return { ...defaults }
    }
  }

  private save(): void {
    try {
      writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('[JsonStore] Failed to save:', this.path, err)
    }
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
    this.save()
  }

  setAll(partial: Partial<T>): void {
    this.data = { ...this.data, ...partial }
    this.save()
  }

  delete<K extends keyof T>(key: K): void {
    delete this.data[key]
    this.save()
  }
}
