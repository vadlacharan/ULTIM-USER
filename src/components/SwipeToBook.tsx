import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { FONTS, MOTION, RADIUS } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { CreditIcon } from './CreditIcon';

interface SwipeToBookProps {
  onSwipeComplete: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  requiredCredits: number;
  /** Message shown on the track while disabled. Defaults to "INSUFFICIENT CREDITS" for backwards compatibility. */
  disabledReason?: string;
}

const HANDLE = 52;
const PADDING = 4;

/**
 * Crash-hardened swipe-to-confirm:
 * - The Pan gesture is created ONCE (useMemo, empty deps) and never swapped
 *   mid-flight. Recreating the gesture on every render (e.g. when
 *   `isSubmitting` flips right after completion) was crashing the native
 *   gesture handler on Android.
 * - Enable/disable, track width and the completion callback all flow through
 *   shared values / a ref, so worklets never capture stale JS closures.
 * - A `completed` guard stops double-fires; the handle stays pinned while
 *   `isSubmitting` and re-arms on the next touch.
 * - The whole track is the touch area (not just the 52px knob).
 */
export const SwipeToBook: React.FC<SwipeToBookProps> = ({
  onSwipeComplete,
  disabled = false,
  isSubmitting = false,
  requiredCredits,
  disabledReason = 'INSUFFICIENT CREDITS',
}) => {
  const { colors } = useApp();
  const [containerWidth, setContainerWidth] = useState(300);

  const dragX = useSharedValue(0);
  const maxDragSV = useSharedValue(240);
  const enabledSV = useSharedValue(true);
  const completedSV = useSharedValue(false);

  // Always call the latest callback — the memoized gesture's worklet would
  // otherwise capture the first render's closure forever.
  const onCompleteRef = useRef(onSwipeComplete);
  onCompleteRef.current = onSwipeComplete;

  const isInteractionDisabled = disabled || isSubmitting;
  const maxDrag = Math.max(containerWidth - HANDLE - PADDING * 2, 1);

  // Mirror JS state into worklet-land without recreating the gesture.
  useEffect(() => {
    enabledSV.value = !isInteractionDisabled;
  }, [isInteractionDisabled, enabledSV]);

  useEffect(() => {
    maxDragSV.value = maxDrag;
  }, [maxDrag, maxDragSV]);

  // When the control becomes unusable (not submitting), glide home and re-arm.
  useEffect(() => {
    if (disabled && !isSubmitting) {
      completedSV.value = false;
      dragX.value = withSpring(0, MOTION.springSnappy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, isSubmitting]);

  const fireComplete = () => {
    onCompleteRef.current();
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-12, 12])
        .onBegin(() => {
          if (!enabledSV.value) return;
          // Re-arm: a previously completed swipe starts over from zero.
          if (completedSV.value) {
            completedSV.value = false;
            dragX.value = 0;
          }
        })
        .onUpdate((e) => {
          if (!enabledSV.value || completedSV.value) return;
          const cap = maxDragSV.value;
          dragX.value = Math.max(0, Math.min(e.translationX, cap));
        })
        .onEnd((e) => {
          if (!enabledSV.value || completedSV.value) return;
          const cap = maxDragSV.value;
          if (e.translationX >= cap * 0.7) {
            completedSV.value = true;
            dragX.value = withDelay(
              60,
              withTiming(cap, { duration: MOTION.durationFast }, (finished) => {
                if (finished) runOnJS(fireComplete)();
              })
            );
          } else {
            dragX.value = withSpring(0, MOTION.springSnappy);
          }
        })
        .onFinalize(() => {
          // Finger lifted without completing — make sure we never stick.
          if (!completedSV.value && enabledSV.value && dragX.value > 0) {
            dragX.value = withSpring(0, MOTION.springSnappy);
          }
        }),
    // Intentionally static: everything dynamic flows via shared values/ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: dragX.value + HANDLE + PADDING,
    opacity: interpolate(dragX.value, [0, Math.max(maxDragSV.value, 1)], [1, 0.9], Extrapolation.CLAMP),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      dragX.value,
      [0, Math.max(maxDragSV.value, 1)],
      [0.35, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
        isInteractionDisabled && styles.disabledContainer,
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.backgroundFill, fillStyle]} />
      <Animated.View style={[styles.glowFill, glowStyle]} />

      {/* Full-track touch area — grabbing anywhere on the track works. */}
      <GestureDetector gesture={pan}>
        <Animated.View style={StyleSheet.absoluteFill} />
      </GestureDetector>

      <View style={styles.textWrapper} pointerEvents="none">
        {isSubmitting ? (
          <Text style={[styles.swipeText, { color: colors.onSurface }]}>CONFIRMING BOOKING...</Text>
        ) : disabled ? (
          <Text style={[styles.swipeText, { color: colors.onSurface }]}>{disabledReason}</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text style={[styles.swipeTextInline, { color: colors.onSurface }]}>
              SWIPE TO BOOK ({requiredCredits}
            </Text>
            <CreditIcon size={20} />
            <Text style={[styles.swipeTextInline, { color: colors.onSurface }]}>)</Text>
          </View>
        )}
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.handle, { backgroundColor: colors.primary }, handleStyle]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Ionicons name="arrow-forward-sharp" size={24} color="#FFF" />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  backgroundFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 90, 31, 0.4)',
    borderRadius: RADIUS.full,
  },
  glowFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,90,31,0.08)',
    borderRadius: RADIUS.full,
  },
  textWrapper: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  swipeText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  swipeTextInline: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  handle: {
    width: HANDLE,
    height: HANDLE,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 4,
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});
