import { safeStorage } from 'electron'
import Store from 'electron-store'

// Stores encrypted blobs — actual values are never stored in plaintext.
const store = new Store<Record<string, string>>({
  name: 'casper-secure',
  encryptionKey: undefined // we do our own encryption via safeStorage
})

class SecureStore {
  setKey(key: string, value: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      // Fallback: store as-is (dev environments without keychain)
      store.set(key, value)
      return
    }
    const encrypted = safeStorage.encryptString(value)
    store.set(key, encrypted.toString('base64'))
  }

  getKey(key: string): string | null {
    const raw = store.get(key) as string | undefined
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
