// Mock for react-native-mmkv
const mockStorage = new Map()

class MMKV {
  constructor(options) {
    this.id = options?.id || 'default'
    this._store = new Map()
  }

  getString(key) {
    return this._store.get(key) ?? undefined
  }

  set(key, value) {
    this._store.set(key, value)
  }

  delete(key) {
    this._store.delete(key)
  }

  contains(key) {
    return this._store.has(key)
  }

  getAllKeys() {
    return Array.from(this._store.keys())
  }

  clearAll() {
    this._store.clear()
  }

  addEventListener() {
    return { remove: jest.fn() }
  }

  removeEventListener() {}
}

module.exports = { MMKV }
