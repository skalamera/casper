import { safeStorage } from 'electron'
import { JsonStore } from './json-store'

// Stores encrypted blobs — actual values are never stored in plaintext.
const store = new JsonStore<Record<string, string>>('casper-secure', {})

class SecureStore {
  setKey(key: string, value: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      store.set(key, value)
      return
    }
    const encrypted = safeStorage.encryptString(value)
    store.set(key, encrypted.toString('base64'))
  }

  getKey(key: string): string | null {
    const raw = store.get(key)
    if (!raw) return null
    if (!safeStorage.isEncryptionAvailable()) return raw
    try {
      const buf = Buffer.from(raw, 'base64')
      return safeStorage.decryptString(buf)
    } catch {
      return null
    }
  }

  getKeys(): { deepgramApiKey: string; geminiApiKey: string } {
    return {
      deepgramApiKey: this.getKey('deepgramApiKey') ?? '',
      geminiApiKey: this.getKey('geminiApiKey') ?? ''
    }
  }

  hasKey(key: string): boolean {
    return !!this.getKey(key)
  }

  deleteKey(key: string): void {
    store.delete(key)
  }
}

export const secureStore = new SecureStore()
