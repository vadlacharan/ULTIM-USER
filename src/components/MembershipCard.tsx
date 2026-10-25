import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { UserMembership } from '../types';
import { CreditIcon } from './CreditIcon';

interface MembershipCardProps {
  membership: UserMembership;
  onBookSession: () => void;
  index?: number;
}

const getCreditTier = (percent: number): { solid: string; label: string } => {
  if (percent > 60) return { solid: COLORS.secondary, label: 'HEALTHY' };
  if (percent > 25) return { solid: COLORS.primary, label: 'LOW CREDITS' };
  return { solid: COLORS.error, label: 'CRITICAL' };
};

/**
 * Member Pass Card — Apple Wallet / Amex Metal archetype:
 * - Warm titanium-ember gradient body for active passes (`#2B160B` → `#171211` → `#121214`)
 *   with a glowing ember top hairline and a metallic chip mark.
 * - Split middle band: oversized credit numeral on the left, facility + plan
 *   identity on the right.
 * -Segmented 10-tick credit gauge + smooth bar so usage reads like a physical
 *   fuel/audio meter.
 * - Full-width `#141416` bottom action bar with expiry on the left and a
 *   solid ember `BOOK SESSION` pill on the right.
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  onBookSession,
  index = 0,
}) => {
  const isActive = membership.status === 'ACTIVE';
  const amountDue = Math.max(0, Number(membership.amountDue ?? 0));

  const percentRemaining =
    membership.totalCredits > 0
      ? Math.max(0, Math.min(100, (membership.remainingCredits / membership.totalCredits) * 100))
      : 0;
  const tier = getCreditTier(percentRemaining);
  const activityIcon = getActivityIcon(membership.validActivities?.[0] || membership.planTitle);
  const activitiesList = (membership.validActivities || []).slice(0, 4);

  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      120,
      withTiming(percentRemaining, { duration: 750, easing: Easing.out(Easing.cubic) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentRemaining]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 60).duration(340).damping(24)}>
      <View style={[styles.wrapper, isActive ? SHADOWS.float : SHADOWS.card]}>
        <LinearGradient
          colors={
            isActive
              ? ['#2A150A', '#191413', '#141417']
              : ['#1C1C20', '#161619', '#141416']
          }
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            isActive ? styles.cardActive : styles.cardMuted,
          ]}
        >
          {/* Top metallic edge highlight */}
          <LinearGradient
            colors={
              isActive
                ? ['rgba(255,90,31,0.0)', 'rgba(255,122,61,0.75)', 'rgba(233,181,76,0.45)', 'rgba(255,90,31,0.0)']
                : ['transparent', 'rgba(255,255,255,0.12)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topEdgeGlow}
          />

          {/* Watermark sport glyph */}
          <MaterialCommunityIcons
            name={activityIcon}
            size={150}
            color={isActive ? 'rgba(255,90,31,0.06)' : 'rgba(255,255,255,0.03)'}
            style={styles.decorGlyph}
          />

          <View style={styles.bodyPad}>
            {/* ── Row 1: Metallic pass chip + status badge ── */}
            <View style={styles.topBar}>
              <View style={styles.passBrandRow}>
                <LinearGradient
                  colors={isActive ? ['#F2C05F', '#C98A27'] : ['#3A3A40', '#27272C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.metalChip}
                >
                  <MaterialCommunityIcons
                    name={activityIcon}
                    size={15}
                    color={isActive ? '#1E1710' : '#B3B3B3'}
                  />
                </LinearGradient>
                <View>
                  <Text style={styles.passIssuer}>ULTIM MEMBER PASS</Text>
                  <Text style={styles.passSerial}>#{String(membership.id).slice(-6).toUpperCase()}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isActive ? styles.statusBadgeActive : styles.statusBadgeMuted,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? COLORS.primary : COLORS.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isActive ? '#FFFFFF' : COLORS.textMuted },
                  ]}
                >
                  {membership.status}
                </Text>
              </View>
            </View>

            {/* ── Row 2: Facility Identity + Plan ── */}
            <View style={styles.identityBlock}>
              <Text style={styles.facilityName} numberOfLines={1}>
                {membership.facilityName}
              </Text>
              <Text style={styles.planTitle} numberOfLines={1}>
                {membership.planTitle}
              </Text>
            </View>

            {/* ── Row 3: Recessed Credit Vault Panel ── */}
            <View style={styles.vaultPanel}>
              <View style={styles.vaultTopRow}>
                <View>
                  <Text style={styles.vaultLabel}>AVAILABLE BALANCE</Text>
                  <View style={styles.creditsNumRow}>
                    <Text style={styles.creditsNum}>{membership.remainingCredits}</Text>
                    <CreditIcon size={24} />
                    <Text style={styles.creditsTotal}>/ {membership.totalCredits}</Text>
                  </View>
                </View>

                <View style={styles.tierCol}>
                  {amountDue > 0 ? (
                    <View style={styles.duePill}>
                      <Ionicons name="alert-circle" size={11} color={COLORS.secondary} />
                      <Text style={styles.duePillText}>₹{amountDue} DUE</Text>
                    </View>
                  ) : (
                    <View style={styles.tierBadge}>
                      <Text style={[styles.tierText, { color: tier.solid }]}>{tier.label}</Text>
                    </View>
                  )}
                  <Text style={styles.percentText}>{Math.round(percentRemaining)}% LEFT</Text>
                </View>
              </View>

              {isActive && (
                <View style={styles.meterTrack}>
                  <Animated.View
                    style={[
                      styles.meterFill,
                      fillStyle,
                      { backgroundColor: tier.solid },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* ── Row 4: Supported sport pills ── */}
            {activitiesList.length > 0 && (
              <View style={styles.activitiesRow}>
                {activitiesList.map((act, i) => (
                  <View key={`${act}-${i}`} style={styles.actPill}>
                    <MaterialCommunityIcons
                      name={getActivityIcon(act)}
                      size={11}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.actPillText}>{act.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Docked Bottom Action Bar ── */}
          <View style={styles.dockBar}>
            <View style={styles.expiryCol}>
              <Text style={styles.expiryLabel}>VALID UNTIL</Text>
              <Text style={styles.expiryValue}>{membership.expiryDate}</Text>
            </View>

            {isActive ? (
              <Pressable
                onPress={onBookSession}
                style={({ pressed }) => [
                  styles.bookCta,
                  SHADOWS.ember,
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <Text style={styles.bookCtaText}>BOOK SESSION</Text>
                <View style={styles.bookCtaCircle}>
                  <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
                </View>
              </Pressable>
            ) : (
              <View style={styles.inactiveTag}>
                <Text style={styles.inactiveTagText}>VISIT DESK TO RENEW</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.cardGap + 2,
    borderRadius: 18,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardActive: {
    borderColor: 'rgba(255,122,61,0.32)',
  },
  cardMuted: {
    borderColor: 'rgba(255,255,255,0.08)',
    opacity: 0.78,
  },
  topEdgeGlow: {
    height: 2,
    width: '100%',
  },
  decorGlyph: {
    position: 'absolute',
    right: -24,
    top: 28,
    transform: [{ rotate: '-14deg' }],
  },
  bodyPad: {
    padding: 18,
    paddingBottom: 14,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metalChip: {
    width: 34,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passIssuer: {
    fontSize: 9.5,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.4,
  },
  passSerial: {
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(255,90,31,0.16)',
    borderColor: 'rgba(255,90,31,0.45)',
  },
  statusBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    letterSpacing: 1.2,
  },

  // ── Identity ──
  identityBlock: {
    marginTop: 14,
  },
  facilityName: {
    fontSize: 22,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  planTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.secondary,
    marginTop: 2,
  },

  // ── Recessed Vault Panel ──
  vaultPanel: {
    marginTop: 14,
    backgroundColor: 'rgba(10,10,12,0.58)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  vaultTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  vaultLabel: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
  },
  creditsNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  creditsNum: {
    fontSize: 34,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 38,
  },
  creditsTotal: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },
  tierCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tierText: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    letterSpacing: 1.1,
  },
  percentText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(233,181,76,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(233,181,76,0.45)',
  },
  duePillText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    color: COLORS.secondary,
    letterSpacing: 0.8,
  },
  meterTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 10,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  // ── Activities ──
  activitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  actPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  actPillText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#CBCBCB',
    letterSpacing: 0.8,
  },

  // ── Docked Bottom Bar ──
  dockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,10,12,0.75)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  expiryCol: {
    gap: 1,
  },
  expiryLabel: {
    fontSize: 8,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.3,
  },
  expiryValue: {
    fontSize: 12.5,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingLeft: 16,
    paddingRight: 6,
    height: 38,
    borderRadius: RADIUS.full,
  },
  bookCtaText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: COLORS.onPrimary,
    letterSpacing: 1.3,
  },
  bookCtaCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0A0503',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inactiveTagText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
});
