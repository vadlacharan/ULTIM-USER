import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, GRADIENTS, RADIUS } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { GlassBlur, IS_EXPO_GO } from './Blur';
import { IconButton } from './buttons';
import { Booking } from '../types';
import { TAB_BAR_HEIGHT, useTabBarBottomOffset } from '../navigation/BlurTabBar';

interface SessionNowBarProps {
  booking: Booking;
  onQrPress: () => void;
  /** True while the QR token is being fetched. */
  loading?: boolean;
}

/**
 * "Now playing" bar for the next session — same glass language as the tab
 * bar, floating above it. Tap the QR chip for the check-in pass.
 */
export const SessionNowBar: React.FC<SessionNowBarProps> = ({ booking, onQrPress, loading = false }) => {
  const { colors } = useApp();
  const tabBarBottom = useTabBarBottomOffset();

  return (
    <View
      style={[styles.shell, { bottom: TAB_BAR_HEIGHT + tabBarBottom + 10 }]}
      pointerEvents="box-none"
    >
      <View style={styles.shadowLayer}>
        <View style={styles.bar}>
          <GlassBlur style={StyleSheet.absoluteFill} blurAmount={50} />
          <LinearGradient
            colors={
              IS_EXPO_GO
                ? ['rgba(16,16,18,0.80)', 'rgba(6,6,8,0.92)']
                : ['rgba(14,14,16,0.10)', 'rgba(5,5,6,0.20)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={[...GRADIENTS.primaryButton]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chip}
          >
            <Ionicons name="flash-sharp" size={17} color={COLORS.onPrimary} />
          </LinearGradient>

          <View style={styles.textCol}>
            <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
              {booking.facilityName}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {booking.dateStr} · {booking.timeSlotLabel} · {booking.creditsSpent} cr
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingChip}>
              <ActivityIndicator size="small" color={COLORS.onPrimary} />
            </View>
          ) : (
            <IconButton
              icon="qr-code-sharp"
              onPress={onQrPress}
              size={40}
              iconSize={20}
              gradientColors={[...GRADIENTS.primaryButton]}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    zIndex: 11,
  },
  shadowLayer: {
    // No drop shadow here: with a transparent container iOS derives the
    // shadow from each child's alpha, which casts a fuzzy glow around the
    // icons. The glass border + blur carry the elevation instead.
  },
  bar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 9,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth + 0.7,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingChip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
});
