import React, { useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS } from '../theme/theme';
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

export const SwipeToBook: React.FC<SwipeToBookProps> = ({
  onSwipeComplete,
  disabled = false,
  isSubmitting = false,
  requiredCredits,
  disabledReason = 'INSUFFICIENT CREDITS',
}) => {
  const { colors } = useApp();
  const [dragX] = useState(new Animated.Value(0));
  const [containerWidth, setContainerWidth] = useState(300);
  const handleWidth = 60;

  const isInteractionDisabled = disabled || isSubmitting;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isInteractionDisabled,
    onMoveShouldSetPanResponder: () => !isInteractionDisabled,
    onPanResponderMove: (_, gestureState) => {
      if (isInteractionDisabled) return;
      const maxDrag = containerWidth - handleWidth;
      const newX = Math.max(0, Math.min(gestureState.dx, maxDrag));
      dragX.setValue(newX);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (isInteractionDisabled) return;
      const maxDrag = containerWidth - handleWidth;
      if (gestureState.dx >= maxDrag * 0.7) {
        Animated.timing(dragX, {
          toValue: maxDrag,
          duration: 150,
          useNativeDriver: false,
        }).start(() => {
          onSwipeComplete();
          setTimeout(() => {
            Animated.timing(dragX, { toValue: 0, duration: 200, useNativeDriver: false }).start();
          }, 1500);
        });
      } else {
        Animated.spring(dragX, {
          toValue: 0,
          bounciness: 8,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
        isInteractionDisabled && styles.disabledContainer,
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.backgroundFill, { width: Animated.add(dragX, handleWidth) }]} />

      <View style={styles.textWrapper}>
        {isSubmitting ? (
          <Text style={[styles.swipeText, { color: colors.onSurface }]}>CONFIRMING BOOKING...</Text>
        ) : disabled ? (
          <Text style={[styles.swipeText, { color: colors.onSurface }]}>{disabledReason}</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text style={[styles.swipeTextInline, { color: colors.onSurface }]}>SWIPE TO BOOK ({requiredCredits}</Text>
            <CreditIcon size={20} />
            <Text style={[styles.swipeTextInline, { color: colors.onSurface }]}>)</Text>
          </View>
        )}
      </View>

      <Animated.View
        style={[styles.handle, { backgroundColor: colors.primary, transform: [{ translateX: dragX }] }]}
        {...panResponder.panHandlers}
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
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 4,
  },
});
