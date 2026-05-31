// ══════════════════════════════════════════════════════════════
// INTENT — Accessibility Helpers
// Shared utilities for consistent a11y across every screen.
// ══════════════════════════════════════════════════════════════

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { AccessibilityInfo, findNodeHandle, Platform } from 'react-native';

// ── withAccessibility HOC ────────────────────────────────

/**
 * Wraps a component with default accessibility props.
 *
 * Usage:
 *   const SafeChip = withAccessibility(Chip, {
 *     accessibilityRole: 'button',
 *   });
 *
 * Props explicitly set by the consumer always win over defaults.
 */
export function withAccessibility<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  defaults: {
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityState?: Record<string, unknown>;
    accessibilityValue?: Record<string, unknown>;
  },
) {
  const WithA11y = (props: P, ref: React.Ref<unknown>) => {
    const merged: Record<string, unknown> = { ...defaults };

    // Explicit props override defaults
    if ((props as Record<string, unknown>).accessibilityLabel !== undefined) {
      merged.accessibilityLabel = (props as Record<string, unknown>).accessibilityLabel;
    }
    if ((props as Record<string, unknown>).accessibilityHint !== undefined) {
      merged.accessibilityHint = (props as Record<string, unknown>).accessibilityHint;
    }
    if ((props as Record<string, unknown>).accessibilityRole !== undefined) {
      merged.accessibilityRole = (props as Record<string, unknown>).accessibilityRole;
    }
    if ((props as Record<string, unknown>).accessibilityState !== undefined) {
      merged.accessibilityState = {
        ...defaults.accessibilityState,
        ...((props as Record<string, unknown>).accessibilityState as Record<string, unknown>),
      };
    }
    if ((props as Record<string, unknown>).accessibilityValue !== undefined) {
      merged.accessibilityValue = (props as Record<string, unknown>).accessibilityValue;
    }

    return <WrappedComponent ref={ref} {...(merged as P)} {...(props as P)} />;
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithA11y.displayName = `withAccessibility(${displayName})`;

  return forwardRef(WithA11y);
}

// ── AccessibilityAnnouncer ───────────────────────────────

interface AccessibilityAnnouncerProps {
  /** The message to announce. Re-announces when the value changes. */
  message: string;
  /** Delay (ms) before the announcement fires. Default 100. */
  delay?: number;
}

/**
 * Invisible component that announces `message` to screen readers
 * on mount and whenever `message` changes.
 *
 * Usage:
 *   <AccessibilityAnnouncer message="3 missions completed" />
 */
export function AccessibilityAnnouncer({ message, delay = 100 }: AccessibilityAnnouncerProps) {
  const announced = useRef<string>('');

  useEffect(() => {
    if (!message || message === announced.current) return;

    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
      announced.current = message;
    }, delay);

    return () => clearTimeout(timer);
  }, [message, delay]);

  return null;
}

// ── useAccessibilityFocus ────────────────────────────────

interface AccessibilityFocusReturn<T> {
  /** Attach to the component you want to focus programmatically. */
  ref: React.RefObject<T>;
  /** Call to move VoiceOver / TalkBack focus to the ref'd component. */
  focus: () => void;
}

/**
 * Returns a ref + focus() pair for programmatic accessibility focus.
 *
 * Usage:
 *   const { ref, focus } = useAccessibilityFocus<View>();
 *   useEffect(() => { if (shouldFocus) focus(); }, [shouldFocus]);
 *   return <View ref={ref} />;
 */
export function useAccessibilityFocus<T = unknown>(): AccessibilityFocusReturn<T> {
  const ref = useRef<T>(null);

  const focus = useCallback(() => {
    const node = findNodeHandle(ref.current as React.Component);
    if (node != null) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, []);

  return { ref, focus };
}
