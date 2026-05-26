/**
 * Manual mock for react-native to avoid Flow parsing in Jest.
 * Provides the minimum API surface needed by components.
 */
const React = require('react')

const RN = {
  // Core components
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Image: 'Image',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  Modal: 'Modal',
  FlatList: 'FlatList',
  Switch: 'Switch',
  ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  SafeAreaView: 'SafeAreaView',
  RefreshControl: 'RefreshControl',

  // Animated
  Animated: {
    Value: function (v) {
      this._value = v
      this.setValue = jest.fn()
      this.interpolate = jest.fn(() => ({ __interpolate: true }))
      this.addListener = jest.fn()
      this.removeListener = jest.fn()
    },
    timing: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    decay: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
    parallel: jest.fn(() => ({ start: jest.fn() })),
    delay: jest.fn(() => ({ start: jest.fn() })),
    event: jest.fn(),
    createAnimatedComponent: jest.fn((c) => c),
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
  },

  // StyleSheet
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    compose: (a, b) => [a, b],
    absoluteFill: {},
    absoluteFillObject: {},
    hairlineWidth: 1,
  },

  // Platform
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
    Version: 17,
  },

  // Dimensions
  Dimensions: {
    get: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
    set: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },

  // Appearance
  Appearance: {
    getColorScheme: jest.fn(() => 'dark'),
    addChangeListener: jest.fn(),
    removeChangeListener: jest.fn(),
  },

  // Interaction
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn(), canOpenURL: jest.fn(() => Promise.resolve(true)) },
  Keyboard: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
    dismiss: jest.fn(),
  },

  // Utilities
  PixelRatio: { get: jest.fn(() => 3), getPixelSizeForLayoutSize: jest.fn((s) => s * 3), roundToNearestPixel: jest.fn((s) => s) },
  StatusBar: { currentHeight: 44 },

  // NativeModules stub
  NativeModules: {},
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    removeAllListeners: jest.fn(),
  })),

  // TurboModuleRegistry
  TurboModuleRegistry: {
    get: jest.fn(),
    getEnforcing: jest.fn(),
  },
}

// Make all string component names renderable as React elements for testing
const proxyHandler = {
  get(target, prop) {
    if (prop === '__esModule') return false
    if (prop === 'default') return target
    if (typeof prop === 'symbol') return target[prop]
    return target[prop]
  },
}

module.exports = new Proxy(RN, proxyHandler)
module.exports.default = module.exports
