import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton, OutlineButton, IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';

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
    themeMode,
    isDark,
    toggleTheme,
    colors,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
          Athlete <Text style={{ color: colors.primary }}>Profile</Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
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
              { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
            ]}
          >
            <Ionicons name="person-circle-outline" size={54} color={colors.primary} />
            <Text style={[styles.unauthTitle, { color: colors.onSurface }]}>Sign In Required</Text>
            <Text style={[styles.unauthSub, { color: colors.textMuted }]}>
              Sign in or create an account to view your athlete stats, credit ledger, and settings.
            </Text>
            <GradientButton
              label="SIGN IN / REGISTER"
              onPress={() => navigation.navigate('Auth')}
              style={styles.signInBtn}
            />
          </View>
        ) : (
          <>
            {/* User Profile Card */}
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
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
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
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
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
                ]}
              >
                <Text style={[styles.statVal, { color: colors.secondary }]}>
                  {userMemberships.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>CENTER PASSES</Text>
              </View>
            </View>

            {/* Theme Preference Switcher Card */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                APPEARANCE & THEME
              </Text>
            </View>

            <View
              style={[
                styles.themeCard,
                { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
              ]}
            >
              <View style={styles.themeInfoRow}>
                <View style={[styles.themeIconBox, { backgroundColor: isDark ? '#2A2A29' : '#FFF3E0' }]}>
                  <Ionicons
                    name={isDark ? 'moon-sharp' : 'sunny-sharp'}
                    size={22}
                    color={isDark ? colors.secondary : colors.primary}
                  />
                </View>
                <View style={styles.themeTextCol}>
                  <Text style={[styles.themeTitle, { color: colors.onSurface }]}>
                    {isDark ? 'Dark Theme' : 'Light Theme'}
                  </Text>
                  <Text style={[styles.themeSub, { color: colors.textMuted }]}>
                    {isDark ? 'Sleek dark interface for night & OLED' : 'Bright high-contrast theme for daytime'}
                  </Text>
                </View>
              </View>

              <GradientButton
                label={`SWITCH TO ${isDark ? 'LIGHT' : 'DARK'}`}
                icon={isDark ? 'sunny-outline' : 'moon-outline'}
                onPress={toggleTheme}
              />
            </View>

            {/* Transaction Ledger */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                TRANSACTIONS LEDGER
              </Text>
            </View>

            {transactions.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
                ]}
              >
                <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                  No Transactions Recorded
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Your credit additions from center desk activations and session deductions will appear here.
                </Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.txCard,
                    { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
                  ]}
                >
                  <View style={[styles.txIconBox, { backgroundColor: colors.surfaceLow }]}>
                    <Ionicons
                      name={tx.credits > 0 ? 'add-circle-sharp' : 'remove-circle-sharp'}
                      size={20}
                      color={tx.credits > 0 ? colors.secondary : colors.primary}
                    />
                  </View>

                  <View style={styles.txDetails}>
                    <Text style={[styles.txTitle, { color: colors.onSurface }]}>{tx.description}</Text>
                    <Text style={[styles.txFacility, { color: colors.textMuted }]}>{tx.facilityName}</Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>{tx.date}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.credits > 0 ? colors.secondary : colors.primary },
                      ]}
                    >
                      {`${tx.credits}`}
                    </Text>

                  </View>
                </View>
              ))
            )}

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
    </View>
  );
};

const styles = StyleSheet.create({
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
