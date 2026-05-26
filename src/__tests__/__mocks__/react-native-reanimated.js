/**
 * Manual mock for react-native-reanimated in Jest.
 */
module.exports = {
  default: {
    call: () => {},
    Value: function (v) { this._value = v },
    timing: () => ({ start: () => {} }),
    spring: () => ({ start: () => {} }),
    event: () => {},
    createAnimatedComponent: (c) => c,
    View: 'Animated.View',
    Text: 'Animated.Text',
  },
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => fn(),
  withTiming: (v) => v,
  withSpring: (v) => v,
  withDelay: (_, v) => v,
  withSequence: (...v) => v[0],
  withRepeat: (v) => v,
  useDerivedValue: (fn) => ({ value: fn() }),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: () => ({}),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  interpolate: (v) => v,
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    in: (t) => t,
    out: (t) => t,
    inOut: (t) => t,
  },
}
