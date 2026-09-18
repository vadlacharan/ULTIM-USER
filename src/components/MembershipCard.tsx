import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { UserMembership } from '../types';
import { useApp } from '../context/AppContext';

interface MembershipCardProps {
  membership: UserMembership;
  onBookSession: () => void;
}

// Credit-health tiers — used on the muted (non-active) card variant.
const getCreditTier = (percent: number): { solid: string; label: string } => {
  if (percent > 60) return { solid: COLORS.secondary, label: 'HEALTHY' };
  if (percent > 25) return { solid: COLORS.primary, label: 'RUNNING LOW' };
  return { solid: COLORS.error, label: 'CRITICAL' };
};

/**
 * Member pass card — a bold accent-coloured pass for active memberships
 * (logo mark, live credit count, big facility name, usage meter, expiry and
 * a dark "book" pill), and a muted glass variant for expired passes.
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({ membership, onBookSession }) => {
  const { colors } = useApp();
  const isActive = membership.status === 'ACTIVE';

  const percentRemaining =
    membership.totalCredits > 0
      ? Math.max(0, Math.min(100, (membership.remainingCredits / membership.totalCredits) * 100))
      : 0;
  const usedPercent = Math.round(100 - percentRemaining);
  const tier = getCreditTier(percentRemaining);
  const activityIcon = getActivityIcon(membership.validActivities?.[0] || membership.planTitle);

  // Fill-in animation — the meter grows to its real value on mount.
  const fillAnim = useRef(new Animated.Value(0)).current;
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
        Animated.delay(600),
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

  // ── Palette ───────────────────────────────────────────────────────────────
  const text = colors.onSurface;
  const textSoft = colors.textMuted;
  const textFaint = 'rgba(255,255,255,0.42)';
  const trackColor = 'rgba(255,255,255,0.10)';
  const fillColor = isActive ? COLORS.secondary : tier.solid;
  const shimmerColor = 'rgba(255,255,255,0.45)';
  const markBg = colors.glassHigh;
  const markBorder = colors.glassBorder;
  const markIcon = isActive ? COLORS.secondary : colors.textMuted;
  const tierBg = colors.glassHigh;
  const tierBorder = colors.glassBorder;
  const btnBg = isActive ? COLORS.primary : 'transparent';
  const btnText = isActive ? COLORS.onPrimary : colors.primary;

  const card = (
    <>
      {/* Decorative sport glyph bleeding off the corner */}
      <MaterialCommunityIcons
        name={activityIcon}
        size={150}
        color="rgba(255,255,255,0.05)"
        style={styles.decorGlyph}
      />

      {/* ── Header: mark + credit count ── */}
      <View style={[styles.headerRow, !isActive && styles.headerRowCompact]}>
        <View style={[styles.mark, { backgroundColor: markBg, borderColor: markBorder }]}>
          <MaterialCommunityIcons name={activityIcon} size={20} color={markIcon} />
        </View>

        <View style={styles.creditsCol}>
          <View style={styles.creditsRow}>
            <Text style={[styles.creditsNum, { color: text }]}>{membership.remainingCredits}</Text>
            <Text style={[styles.creditsWord, { color: textSoft }]}>credits</Text>
          </View>
          <Text style={[styles.creditsOf, { color: textFaint }]}>
            OF {membership.totalCredits} THIS CYCLE
          </Text>
        </View>
      </View>

      {/* ── Identity ── */}
      <Text
        style={[
          styles.facilityName,
          !isActive && styles.facilityNameCompact,
          { color: text },
        ]}
        numberOfLines={isActive ? 2 : 1}
      >
        {membership.facilityName}
      </Text>
      <Text style={[styles.planTitle, { color: textSoft }]} numberOfLines={1}>
        {membership.planTitle}
      </Text>

      {/* ── Usage meter (active passes only) ── */}
      {isActive && (
      <View style={styles.meterBlock}>
        <View style={styles.meterHeader}>
          <Text style={[styles.meterLabel, { color: textFaint }]}>USED {usedPercent}%</Text>
          <View style={[styles.tierChip, { backgroundColor: tierBg, borderColor: tierBorder }]}>
            <View
              style={[
                styles.tierDot,
                { backgroundColor: isActive ? COLORS.secondary : tier.solid },
              ]}
            />
            <Text style={[styles.tierText, { color: textSoft }]}>
              {membership.status}
            </Text>
          </View>
        </View>

        <View
          style={[styles.track, { backgroundColor: trackColor }]}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: fillColor }]}>
            {trackWidth > 0 && (
              <Animated.View
                style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
              >
                <LinearGradient
                  colors={['transparent', shimmerColor, 'transparent'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </View>
      )}

      {/* ── Footer: expiry + action ── */}
      <View style={[styles.footerRow, !isActive && styles.footerRowCompact]}>
        <View style={styles.expiryCol}>
          <Ionicons name="calendar-outline" size={13} color={textSoft} />
          <Text style={[styles.expiryText, { color: textSoft }]}>Expires {membership.expiryDate}</Text>
        </View>

        {isActive && (
          <Pressable
            onPress={onBookSession}
            style={({ pressed }) => [
              styles.bookBtn,
              SHADOWS.ember,
              { backgroundColor: btnBg, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="flash-sharp" size={13} color={btnText} />
            <Text style={[styles.bookBtnText, { color: btnText }]}>BOOK SESSION</Text>
          </Pressable>
        )}
      </View>
    </>
  );

  if (isActive) {
    return (
      <View style={[styles.wrapper, SHADOWS.card]}>
        <View
          style={[
            styles.card,
            styles.activeCard,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 0.9 }}
            style={StyleSheet.absoluteFill}
          />
          {card}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        styles.card,
        styles.cardCompact,
        SHADOWS.card,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 },
      ]}
    >
      {card}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.cardGap,
    borderRadius: 22,
  },
  card: {
    borderRadius: 22,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  activeCard: {
    borderWidth: 1,
  },
  cardCompact: {
    padding: 14,
  },
  decorGlyph: {
    position: 'absolute',
    right: -26,
    bottom: -34,
    transform: [{ rotate: '-12deg' }],
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerRowCompact: {
    marginBottom: 12,
  },
  facilityNameCompact: {
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.4,
  },
  footerRowCompact: {
    marginTop: 10,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  creditsCol: {
    alignItems: 'flex-end',
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  creditsNum: {
    fontSize: 26,
    fontFamily: FONTS.black,
    letterSpacing: -0.8,
  },
  creditsWord: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  creditsOf: {
    fontSize: 8.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.3,
    marginTop: 3,
  },

  // ── Identity ──
  facilityName: {
    fontSize: 26,
    fontFamily: FONTS.black,
    letterSpacing: -0.7,
    lineHeight: 30,
  },
  planTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.semiBold,
    marginTop: 4,
  },

  // ── Meter ──
  meterBlock: {
    marginTop: 20,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  meterLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 1.4,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tierDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tierText: {
    fontSize: 8.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.1,
  },
  track: {
    height: 7,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
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

  // ── Footer ──
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  expiryCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  expiryText: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: RADIUS.full,
  },
  bookBtnText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
  },
});
