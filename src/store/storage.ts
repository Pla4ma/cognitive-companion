import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({ id: 'intent-store' })

export const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name)
    return value ?? null
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value)
  },
  removeItem: (name: string): void => {
    storage.delete(name)
  },
}
