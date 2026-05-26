// ══════════════════════════════════════════════════════════════
// INTENT — Custom Hooks
// ══════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useCallback } from 'react'
import { Animated, Easing } from 'react-native'

// ── Fade In ────────────────────────────────────────────────

export function useFadeIn(delay = 0, duration = 600) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start()
  }, [])

  return opacity
}

// ── Slide Up ───────────────────────────────────────────────

export function useSlideUp(delay = 0, duration = 600, distance = 30) {
  const translateY = useRef(new Animated.Value(distance)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return { opacity, transform: [{ translateY }] }
}

// ── Pulse ──────────────────────────────────────────────────

export function usePulse(minScale = 1, maxScale = 1.05, duration = 2000) {
  const scale = useRef(new Animated.Value(minScale)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return scale
}

// ── Stagger ────────────────────────────────────────────────

export function useStagger(count: number, staggerDelay = 100, initialDelay = 0) {
  const animRefs = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current

  useEffect(() => {
    animRefs.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 600,
          delay: initialDelay + index * staggerDelay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 600,
          delay: initialDelay + index * staggerDelay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    })
  }, [count])

  return animRefs
}

// ── Floating ───────────────────────────────────────────────

export function useFloat(duration = 3000) {
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return translateY
}

// ── Debounce ───────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// ── Previous Value ─────────────────────────────────────────

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

// ── Interval ───────────────────────────────────────────────

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// ── Mount Status ───────────────────────────────────────────

export function useIsMounted() {
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return isMounted
}
