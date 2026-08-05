import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { MembershipCard } from '../components/MembershipCard';
import { NoticeBanner } from '../components/NoticeBanner';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton, OutlineButton } from '../components/buttons';
import { useApp } from '../context/AppContext';

interface AccessScreenProps {
  navigation: any;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({ navigation }) => {
  const {
    userMemberships,
    totalActiveCredits,
    isAuthenticated,
    isLoading,
    membershipError,
    refreshData,
    colors,
  } = useApp();

  const insets = useSafeAreaInsets();
  const activePasses = userMemberships.filter((m) => m.status === 'ACTIVE');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Safe Area Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 6,
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceHigh,
          },
        ]}
      >
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>
          Active Access & <Text style={{ color: colors.primary }}>Credits</Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {!isAuthenticated ? (
          /* Sign In Required State */
          <View style={styles.unauthCard}>
            <Ionicons name="lock-closed-outline" size={44} color={COLORS.primary} />
            <Text style={styles.unauthTitle}>Sign In Required</Text>
            <Text style={styles.unauthSub}>
              Please sign in to view your activated center memberships and total credit balance.
            </Text>
            <GradientButton
              label="SIGN IN / CREATE ACCOUNT"
              onPress={() => navigation.navigate('Auth')}
              style={styles.signInBtn}
            />
          </View>
        ) : (
          <>
            {/* Credit Ledger Summary Header */}

            {/* Offline Activation Notice Banner */}

            {/* Active Passes Section */}


            {membershipError ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
                <Text style={styles.errorTitle}>Error Loading Passes</Text>
                <Text style={styles.errorSub}>{membershipError}</Text>
                <GradientButton label="RETRY" onPress={refreshData} compact style={styles.retryBtn} />
              </View>
            ) : isLoading && !refreshing ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : userMemberships.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="wallet-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Active Memberships Found</Text>
                <Text style={styles.emptySub}>
                  Visit any partner center reception desk to register for a plan and activate your credited balance.
                </Text>
                <OutlineButton
                  label="EXPLORE NEARBY CENTERS"
                  onPress={() => navigation.navigate('HomeTab')}
                  color={COLORS.primary}
                  style={styles.exploreBtn}
                />
              </View>
            ) : (
              userMemberships.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  membership={membership}
                  onBookSession={() =>
                    navigation.navigate('BookingFlow', { facilityId: membership.facilityId })
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceHigh,
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 28,
    color: COLORS.onSurface,
  },
  scrollContent: {
    padding: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  unauthCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  unauthTitle: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.2,
    lineHeight: 22,
    color: COLORS.onSurface,
    marginTop: 10,
  },
  unauthSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  signInBtn: {
    marginTop: SPACING.md,
  },
  ledgerSummaryCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 36,
    fontFamily: FONTS.black,
    color: COLORS.primary,
    marginTop: 2,
  },
  passesBadge: {
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  passesBadgeVal: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
  },
  passesBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  summaryNote: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  sectionHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginTop: 10,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: SPACING.md,
  },
  errorCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    marginTop: 6,
  },
  errorSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 12,
  },
});
