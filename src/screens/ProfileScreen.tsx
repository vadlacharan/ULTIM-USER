import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { SUPPORT_EMAIL } from './LegalScreen';
import { BlurTitleHeader, useBlurHeaderLayout } from '../components/Blur';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton, OutlineButton, IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    user,
    isAuthenticated,
    logout,
    transactions,
    userMemberships,
    totalActiveCredits,
    refreshData,
    deleteAccount,
    colors,
  } = useApp();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { height: headerHeight } = useBlurHeaderLayout();
  const tabBarClearance = useTabBarClearance();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your ULTIM account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'LOG OUT',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your profile, credits, memberships and booking history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE MY ACCOUNT',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccount();
            if (!res.success) {
              Alert.alert('Deletion failed', res.error || 'Please try again later.');
            }
          },
        },
      ]
    );
  };

  const openLegal = (type: 'privacy' | 'terms') => navigation.navigate('Legal', { type });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 24, paddingBottom: tabBarClearance + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            progressViewOffset={headerHeight}
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!isAuthenticated ? (
          /* Sign In State */
          <View
            style={[
              styles.unauthCard,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
            ]}
          >
            <Ionicons name="person-circle-outline" size={54} color={colors.primary} />
            <Text style={[styles.unauthTitle, { color: colors.onSurface }]}>Sign In Required</Text>
            <Text style={[styles.unauthSub, { color: colors.textMuted }]}>
              Sign in or create an account to view your athlete stats, credit ledger, and settings.
            </Text>
            <GradientButton
              label="SIGN IN / REGISTER"
              onPress={() => navigation.navigate('SignIn')}
              style={styles.signInBtn}
            />
          </View>
        ) : (
          <>
            {/* User Profile Card */}
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              ]}
            >
              <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>

              <View style={styles.profileDetails}>
                <Text style={[styles.userName, { color: colors.onSurface }]}>
                  {user?.name || 'Athlete'}
                </Text>
                <Text style={[styles.userPhone, { color: colors.textMuted }]}>
                  {user?.phone || 'No phone linked'}
                </Text>

              </View>

              <IconButton
                icon="log-out-outline"
                onPress={handleLogoutPress}
                backgroundColor="transparent"
                iconColor={colors.error}
                size={36}
                iconSize={20}
              />
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statBox,
                  { backgroundColor: colors.emberPanel, borderColor: colors.emberBorder },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.statVal, { color: colors.primary }]}>{totalActiveCredits}</Text>
                  <CreditIcon size={26} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>ACTIVE CREDITS</Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                ]}
              >
                <Text style={[styles.statVal, { color: colors.secondary }]}>
                  {userMemberships.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>CENTER PASSES</Text>
              </View>
            </View>

            {/* Transactions — single link row, full ledger lives on its own screen */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                TRANSACTIONS
              </Text>
            </View>

            <View style={[styles.settingsCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => navigation.navigate('Transactions')}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsIcon, { backgroundColor: colors.goldPanel }]}>
                  <Ionicons name="receipt-outline" size={16} color={colors.secondary} />
                </View>
                <View style={styles.settingsTextCol}>
                  <Text style={[styles.settingsLabel, { flex: 0, color: colors.onSurface }]}>
                    Credit Transactions
                  </Text>
                  <Text style={[styles.settingsSub, { color: colors.textMuted }]}>
                    {totalActiveCredits} credits available · view full ledger
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            </View>

            {/* Account & Privacy */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                ACCOUNT & PRIVACY
              </Text>
            </View>

            <View style={[styles.settingsCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <TouchableOpacity style={styles.settingsRow} onPress={() => openLegal('privacy')} activeOpacity={0.7}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.glassHigh }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.onSurface }]}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>

              <View style={[styles.settingsDivider, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />

              <TouchableOpacity style={styles.settingsRow} onPress={() => openLegal('terms')} activeOpacity={0.7}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.glassHigh }]}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.onSurface }]}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>

              <View style={[styles.settingsDivider, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsIcon, { backgroundColor: colors.glassHigh }]}>
                  <Ionicons name="mail-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.onSurface }]}>Contact Support</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>

              <View style={[styles.settingsDivider, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />

              <TouchableOpacity style={styles.settingsRow} onPress={handleDeleteAccountPress} activeOpacity={0.7}>
                <View style={[styles.settingsIcon, { backgroundColor: 'rgba(243,114,127,0.12)' }]}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.error }]}>Delete Account</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(243,114,127,0.5)" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.versionText, { color: 'rgba(255,255,255,0.30)' }]}>
              ULTIM v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>

            {/* Log Out Button */}
            <OutlineButton
              label="LOG OUT"
              icon="log-out-outline"
              onPress={handleLogoutPress}
              color={colors.error}
              style={styles.logoutBtn}
            />
          </>
        )}
      </ScrollView>

      {/* Floating blur header — screens scroll behind it */}
      <BlurTitleHeader
        title={<>Athlete <Text style={{ color: colors.primary }}>Profile</Text></>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  seeAllText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
  },
  settingsCard: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTextCol: {
    flex: 1,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONTS.semiBold,
  },
  settingsSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  settingsDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10.5,
    fontFamily: FONTS.medium,
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 4,
  },
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  scrollContent: {
    padding: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  unauthCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
    borderWidth: 1,
  },
  unauthTitle: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginTop: 10,
  },
  unauthSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  signInBtn: {
    marginTop: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: FONTS.extraBold,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  userPhone: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
    lineHeight: 18,
  },
  userEmail: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
    lineHeight: 15,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 0.48,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statVal: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  themeCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  themeIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  themeSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
    lineHeight: 15,
  },

  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.2,
    lineHeight: 20,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    lineHeight: 17,
  },
  txFacility: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
    lineHeight: 15,
  },
  txDate: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    marginTop: 2,
    lineHeight: 13,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
  },
  logoutBtn: {
    marginTop: SPACING.lg,
  },
});
