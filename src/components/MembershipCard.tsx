import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS } from '../theme/theme';
import { UserMembership } from '../types';
import { CreditIcon } from './CreditIcon';

interface MembershipCardProps {
  membership: UserMembership;
  onBookSession: () => void;
  index?: number;
}

/**
 * Membership card — the reference's flat charcoal pass. Identity is set in
 * Barlow Condensed, credits are tracked with a single orange gauge, and the
 * booking action is a solid 44px arena block.
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  onBookSession,
  index = 0,
}) => {
  const isActive = membership.status === 'ACTIVE';
  const amountDue = Math.max(0, Number(membership.amountDue ?? 0));
  const total = Math.max(membership.totalCredits, 1);
  const remaining = Math.max(0, membership.remainingCredits);
  const used = Math.max(0, membership.totalCredits - remaining);
  const usedPercent = Math.max(0, Math.min(100, (used / total) * 100));
  const activitiesList = (membership.validActivities || []).slice(0, 3);
  const canBook = isActive && remaining > 0;

  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      100,
      withTiming(usedPercent, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedPercent]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 60).duration(340).damping(24)}>
      <View
        style={[
          styles.card,
          isActive ? styles.cardActive : styles.cardExpired,
        ]}
      >
        <View style={styles.head}>
          <View style={styles.heading}>
            <Text style={styles.kicker}>
              {isActive ? membership.facilityName : 'Past membership'}
            </Text>
            <Text style={styles.name} numberOfLines={2}>
              {membership.planTitle}
            </Text>
          </View>
          <View style={[styles.status, isActive ? styles.statusActive : styles.statusExpired]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? COLORS.success : COLORS.meta }]} />
            <Text style={[styles.statusText, { color: isActive ? COLORS.success : COLORS.muted }]}>
              {isActive ? 'ACTIVE' : 'EXPIRED'}
            </Text>
          </View>
        </View>

        <Text style={styles.includes} numberOfLines={2}>
          {activitiesList.length > 0
            ? `Includes ${activitiesList.join(', ')}`
            : `Includes access at ${membership.facilityName}`}
        </Text>

        <View style={styles.tracker}>
          <View style={styles.trackerHead}>
            <Text style={styles.trackerLabel}>
              {used} OF {membership.totalCredits} CREDITS USED
            </Text>
            <View style={styles.remainingRow}>
              <Text style={styles.remainingValue}>{remaining}</Text>
              <CreditIcon size={13} />
              <Text style={styles.remainingLabel}>LEFT</Text>
            </View>
          </View>
          <View style={styles.progress}>
            <Animated.View
              style={[
                styles.progressFill,
                fillStyle,
                { backgroundColor: isActive ? COLORS.primary : COLORS.meta },
              ]}
            />
          </View>
        </View>

        {amountDue > 0 && (
          <View style={styles.dueRow}>
            <Ionicons name="alert-circle-outline" size={13} color={COLORS.primary} />
            <Text style={styles.dueText}>₹{amountDue} due at reception</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.validity}>
            <Text style={styles.validityLabel}>{isActive ? 'VALID UNTIL' : 'EXPIRED ON'}</Text>
            <Text style={styles.validityValue}>{membership.expiryDate}</Text>
          </View>

          <Pressable
            onPress={onBookSession}
            disabled={!canBook}
            accessibilityRole="button"
            accessibilityLabel={`Book a session with ${membership.planTitle}`}
            style={({ pressed }) => [
              styles.book,
              canBook ? styles.bookEnabled : styles.bookDisabled,
              pressed && canBook && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.bookText, !canBook && { color: COLORS.meta }]}>
              {isActive ? (remaining > 0 ? 'BOOK' : 'NO CREDITS') : 'EXPIRED'}
            </Text>
            {canBook && <Ionicons name="arrow-forward" size={14} color={COLORS.onPrimary} />}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 13,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  cardActive: {
    borderColor: 'rgba(255,106,26,0.48)',
    backgroundColor: '#17110D',
  },
  cardExpired: {
    borderColor: COLORS.lineSoft,
    backgroundColor: '#0E0F11',
    opacity: 0.9,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 29,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusActive: {
    backgroundColor: 'rgba(123,217,154,0.10)',
  },
  statusExpired: {
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.6,
  },
  includes: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  tracker: {
    gap: 8,
  },
  trackerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  trackerLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.5,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  remainingValue: {
    color: COLORS.paper,
    fontFamily: FONTS.extraBold,
    fontSize: 12,
  },
  remainingLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  progress: {
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: COLORS.line,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dueText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 1,
  },
  validity: {
    gap: 2,
    flex: 1,
  },
  validityLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 0.7,
  },
  validityValue: {
    color: COLORS.paperDim,
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  book: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 104,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  bookEnabled: {
    backgroundColor: COLORS.primary,
  },
  bookDisabled: {
    backgroundColor: COLORS.surfaceBright,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  bookText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.7,
  },
});
