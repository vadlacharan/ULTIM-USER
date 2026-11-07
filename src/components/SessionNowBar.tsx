import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { IconButton } from './buttons';
import { Booking } from '../types';
import { formatClock, formatDateShort } from '../utils/display';
import { TAB_BAR_HEIGHT, useTabBarBottomOffset } from '../navigation/BlurTabBar';

interface SessionNowBarProps {
  booking: Booking;
  onQrPress: () => void;
  /** True while the QR token is being fetched. */
  loading?: boolean;
}

/**
 * Floating "next session" dock. It keeps the original behaviour — always
 * hovering above the tab bar, opening the entry pass — but now uses the arena
 * surface language: flat charcoal, hairline border, orange marker and a small
 * uppercase eyebrow.
 */
const SessionNowBarComponent: React.FC<SessionNowBarProps> = ({ booking, onQrPress, loading = false }) => {
  const { colors } = useApp();
  const tabBarBottom = useTabBarBottomOffset();

  return (
    <Animated.View
      entering={SlideInDown.delay(160).duration(360).damping(26).stiffness(240)}
      exiting={SlideOutDown.duration(200)}
      style={[styles.shell, { bottom: TAB_BAR_HEIGHT + tabBarBottom + 10 }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, SHADOWS.float]}>
        <View style={styles.liveMark}>
          <Ionicons name="flash" size={17} color={COLORS.onPrimary} />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            NEXT SESSION · {formatDateShort(booking.dateStr)} ·{' '}
            {(booking.timeSlotLabel || '').match(/^\d{1,2}:\d{2}/)
              ? formatClock((booking.timeSlotLabel || '').slice(0, 5))
              : booking.timeSlotLabel}
          </Text>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {booking.facilityName}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingChip}>
            <ActivityIndicator size="small" color={COLORS.onPrimary} />
          </View>
        ) : (
          <IconButton
            icon="qr-code-outline"
            onPress={onQrPress}
            size={40}
            iconSize={19}
            iconColor={COLORS.onPrimary}
            backgroundColor={COLORS.primary}
            borderColor={COLORS.primary}
          />
        )}
      </View>
    </Animated.View>
  );
};

export const SessionNowBar = React.memo(SessionNowBarComponent);

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    zIndex: 11,
  },
  bar: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  liveMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  loadingChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
});
