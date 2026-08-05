import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { UserMembership } from '../types';
import { StatusBadge } from './StatusBadge';
import { CreditIcon } from './CreditIcon';
import { GradientButton } from './buttons';
import { useApp } from '../context/AppContext';

interface MembershipCardProps {
  membership: UserMembership;
  onBookSession: () => void;
}

// Credit-health tiers — the meter's gradient + label react to how many
// credits are left (like a battery indicator) instead of a flat static bar.
const getCreditTier = (percent: number): { gradient: [string, string]; solid: string; label: string } => {
  if (percent > 60) {
    return { gradient: ['#34D399', '#059669'], solid: '#10B981', label: 'HEALTHY' };
  }
  if (percent > 25) {
    return { gradient: ['#FBBF24', '#F59E0B'], solid: '#F59E0B', label: 'RUNNING LOW' };
  }
  return { gradient: ['#FB7185', '#E11D48'], solid: '#F43F5E', label: 'CRITICAL' };
};

export const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  onBookSession,
}) => {
  const { colors } = useApp();
  const percentRemaining =
    membership.totalCredits > 0
      ? Math.max(0, Math.min(100, (membership.remainingCredits / membership.totalCredits) * 100))
      : 0;

  const tier = getCreditTier(percentRemaining);
  const isActive = membership.status === 'ACTIVE';

  // Fill-in animation — the bar grows from 0 to its real value on mount
  // instead of just snapping into place.
  const fillAnim = useRef(new Animated.Value(0)).current;
  // Looping shimmer sweep across the filled portion for a "premium" feel.
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    fillAnim.setValue(0);
    Animated.timing(fillAnim, {
      toValue: percentRemaining,
      duration: 1000,
      delay: 150,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [percentRemaining]);

  useEffect(() => {
    if (!trackWidth) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [trackWidth]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, trackWidth + 60],
  });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
      ]}
    >
      {/* Decorative corner sheen — subtle "premium card" feel */}
      <LinearGradient
        colors={isActive ? (['rgba(255,87,34,0.14)', 'transparent'] as const) : (['rgba(120,120,120,0.10)', 'transparent'] as const)}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.25, y: 1 }}
        style={styles.cornerGlow}
        pointerEvents="none"
      />

      <View style={styles.cardHeader}>
        <View style={styles.identityRow}>
          <LinearGradient
            colors={isActive ? (['#FF8A50', '#FF5722'] as const) : ([colors.surfaceHigh, colors.surfaceHigh] as const)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chipIcon}
          >
            <Ionicons name="card" size={18} color={isActive ? '#FFF' : colors.textMuted} />
          </LinearGradient>
          <View style={styles.identityTextCol}>
            <Text style={[styles.facilityName, { color: colors.onSurface }]} numberOfLines={1}>
              {membership.facilityName}
            </Text>
            <Text style={[styles.planTitle, { color: colors.primary }]} numberOfLines={1}>
              {membership.planTitle}
            </Text>
          </View>
        </View>
        <StatusBadge
          label={membership.status}
          type={membership.status === 'ACTIVE' ? 'active' : 'past'}
        />
      </View>

      {/* Credit Progress Meter */}
      <View style={[styles.creditMeterContainer, { backgroundColor: colors.surfaceLow }]}>
        <View style={styles.creditMeterHeader}>
          <View style={styles.creditMeterValueRow}>
            <Text style={[styles.creditsNum, { color: colors.onSurface }]}>
              {membership.remainingCredits}
            </Text>
            <Text style={[styles.creditMeterVal, { color: colors.textMuted }]}>
              / {membership.totalCredits}
            </Text>
            <CreditIcon size={18} />
          </View>

        </View>

        <View
          style={[styles.progressBarTrack, { backgroundColor: colors.surfaceHigh }]}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.progressBarFill, { width: fillWidth }]}>
            <LinearGradient
              colors={tier.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {trackWidth > 0 && (
              <Animated.View
                style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.65)', 'transparent'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </View>

      <View style={styles.dateValidityRow}>
        <View style={styles.dateCol}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Expires: {membership.expiryDate}
          </Text>
        </View>

        {isActive && (
          <GradientButton
            label="BOOK SESSION"
            icon="flash-sharp"
            onPress={onBookSession}
            compact
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.cardGap,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cornerGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 150,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chipIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  facilityName: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.2,
  },
  planTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  creditMeterContainer: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  creditMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  creditMeterValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creditMeterVal: {
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  creditsNum: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierPillText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.3,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
  dateValidityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    marginLeft: 4,
  },
});
