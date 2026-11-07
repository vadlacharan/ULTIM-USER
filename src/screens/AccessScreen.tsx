import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MembershipCard } from '../components/MembershipCard';
import { NoticeBanner } from '../components/NoticeBanner';
import { GradientButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { ArenaEmptyState, PageHead, SectionHead } from '../components/ArenaUI';

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
  const expiredPasses = userMemberships.filter((m) => m.status !== 'ACTIVE');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const tabBarClearance = useTabBarClearance();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12) + 26,
            paddingBottom: tabBarClearance + 12,
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            progressViewOffset={insets.top + 20}
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {!isAuthenticated ? (
          <Animated.View entering={FadeInDown.duration(320)}>
            <PageHead
              eyebrow="Membership & credits"
              title="Your"
              accent=" access"
              sub="One balance for courts, turfs and studios across the ULTIM network."
            />
            <View style={styles.signInPanel}>
              <View style={styles.signInIcon}>
                <Ionicons name="lock-closed-outline" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.signInTitle}>Sign in required</Text>
              <Text style={styles.signInSub}>
                Sign in to view your activated center memberships and total credit balance.
              </Text>
              <GradientButton
                label="Sign in / create account"
                onPress={() => navigation.navigate('SignIn')}
                fullWidth
                style={styles.signInBtn}
              />
            </View>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(300)}>
              <PageHead
                eyebrow="Membership & credits"
                title="Your"
                accent=" access"
                sub="One balance for courts, turfs and studios across the ULTIM network."
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(60).duration(340).damping(24)}>
              <Pressable
                onPress={() => navigation.navigate('Transactions', { from: 'access' })}
                style={({ pressed }) => [styles.walletCard, pressed && { opacity: 0.86 }]}
              >
                <View style={styles.walletIcon}>
                  <Ionicons name="wallet" size={22} color={COLORS.onPrimary} />
                </View>
                <View style={styles.walletCopy}>
                  <Text style={styles.walletLabel}>AVAILABLE CREDITS</Text>
                  <Text style={styles.walletAmount}>{totalActiveCredits}</Text>
                  <Text style={styles.walletNote}>Applied automatically at checkout</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.meta} />
              </Pressable>
            </Animated.View>

            <Text style={styles.accessNote}>
              Every pass works across participating ULTIM venues. Credits are deducted when you book.
            </Text>

            <NoticeBanner message="Visit a center reception desk to activate a membership pass and load credits onto your account." />

            {membershipError ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={28} color={COLORS.error} />
                <Text style={styles.errorTitle}>Error loading passes</Text>
                <Text style={styles.errorSub}>{membershipError}</Text>
                <GradientButton label="Retry" onPress={refreshData} compact style={styles.retryBtn} />
              </View>
            ) : isLoading && !refreshing ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
            ) : userMemberships.length === 0 ? (
              <ArenaEmptyState
                icon="wallet-outline"
                title="No active memberships found"
                copy="Visit any partner center reception desk to register for a plan and activate your credited balance."
                action={
                  <Pressable onPress={() => navigation.navigate('HomeTab')} style={{ marginTop: 4 }}>
                    <Text style={styles.exploreLink}>EXPLORE NEARBY CENTERS</Text>
                  </Pressable>
                }
              />
            ) : (
              <>
                <View style={styles.section}>
                  <SectionHead
                    eyebrow="Ready to play"
                    title="Active memberships"
                    meta={`${activePasses.length} active`}
                  />
                  {activePasses.length > 0 ? (
                    activePasses.map((membership, idx) => (
                      <MembershipCard
                        key={membership.id}
                        membership={membership}
                        index={idx}
                        onBookSession={() =>
                          navigation.navigate('BookingFlow', {
                            facilityId: membership.facilityId,
                            membershipId: membership.id,
                          })
                        }
                      />
                    ))
                  ) : (
                    <ArenaEmptyState
                      title="No active memberships yet"
                      copy="Choose a plan from an arena to get started."
                    />
                  )}
                </View>

                <View style={styles.section}>
                  <SectionHead
                    eyebrow="History"
                    title="Expired memberships"
                    meta={`${expiredPasses.length} expired`}
                  />
                  {expiredPasses.length > 0 ? (
                    expiredPasses.map((membership, idx) => (
                      <MembershipCard
                        key={membership.id}
                        membership={membership}
                        index={idx}
                        onBookSession={() => {}}
                      />
                    ))
                  ) : (
                    <ArenaEmptyState
                      title="No expired memberships"
                      copy="Your membership history will appear here."
                    />
                  )}
                </View>
              </>
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
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
  },
  signInPanel: {
    alignItems: 'flex-start',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.panel,
    backgroundColor: COLORS.surface,
  },
  signInIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted,
  },
  signInTitle: {
    marginTop: 16,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 27,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  signInSub: {
    marginTop: 6,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  signInBtn: {
    marginTop: 20,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 88,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.panel,
    backgroundColor: COLORS.surface,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  walletCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  walletLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.1,
  },
  walletAmount: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 31,
    letterSpacing: 0.3,
  },
  walletNote: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 14,
  },
  accessNote: {
    marginTop: 12,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginTop: 30,
  },
  exploreLink: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  errorCard: {
    alignItems: 'center',
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.default,
  },
  errorTitle: {
    marginTop: 8,
    color: COLORS.error,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  errorSub: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
  },
});
