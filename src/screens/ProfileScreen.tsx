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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { SUPPORT_EMAIL } from './LegalScreen';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton, IconButton, OutlineButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { PageHead } from '../components/ArenaUI';

interface ProfileScreenProps {
  navigation: any;
}

type MenuRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  note?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
};

const MenuRow: React.FC<MenuRowProps> = ({ icon, title, note, onPress, danger, last }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
    style={[styles.menuRow, !last && styles.menuRowBorder]}
  >
    <Ionicons name={icon} size={18} color={danger ? COLORS.error : COLORS.primary} />
    <View style={styles.menuCopy}>
      <Text style={[styles.menuTitle, danger && { color: COLORS.error }]}>{title}</Text>
      {!!note && <Text style={styles.menuNote}>{note}</Text>}
    </View>
    {!!onPress && (
      <Ionicons name="chevron-forward" size={17} color={danger ? 'rgba(243,114,127,0.45)' : COLORS.meta} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    user,
    isAuthenticated,
    logout,
    userMemberships,
    totalActiveCredits,
    refreshData,
    deleteAccount,
    colors,
  } = useApp();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const tabBarClearance = useTabBarClearance();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your ULTIM account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'LOG OUT', style: 'destructive', onPress: () => logout() },
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
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    : 'U';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12) + 26,
            paddingBottom: tabBarClearance + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            progressViewOffset={insets.top + 20}
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!isAuthenticated ? (
          <Animated.View entering={FadeInDown.duration(320)}>
            <PageHead
              eyebrow="Account"
              title="Your"
              accent=" profile"
              sub="Sign in to view your athlete stats, credit ledger and settings."
            />
            <View style={styles.signInPanel}>
              <View style={styles.signInIcon}>
                <Ionicons name="person-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.signInTitle}>Sign in required</Text>
              <Text style={styles.signInSub}>
                Sign in or create an account to keep your passes, bookings and credits in one place.
              </Text>
              <GradientButton
                label="Sign in / register"
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
                eyebrow="Account"
                title="Your"
                accent=" profile"
                sub="Your ULTIM identity, access and reminders."
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(60).duration(340).damping(24)}>
              <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.profileCopy}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {user?.name || 'Athlete'}
                  </Text>
                  <Text style={styles.profileMeta} numberOfLines={2}>
                    {user?.phone || 'No phone linked'}
                    {user?.email ? ` · ${user.email}` : ''}
                  </Text>
                  <Text style={styles.profileLocation}>{user?.location || 'Location not set'}</Text>
                </View>
                <IconButton
                  icon="log-out-outline"
                  onPress={handleLogoutPress}
                  backgroundColor="transparent"
                  borderColor={COLORS.line}
                  iconColor={COLORS.error}
                  size={40}
                  iconSize={19}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(110).duration(340).damping(24)}>
              <View style={styles.statsRow}>
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>ACTIVE CREDITS</Text>
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{totalActiveCredits}</Text>
                    <CreditIcon size={20} />
                  </View>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>CENTER PASSES</Text>
                  <Text style={styles.statValue}>{userMemberships.length}</Text>
                </View>
              </View>
            </Animated.View>

            <Text style={styles.sectionLabel}>TRANSACTIONS</Text>
            <View style={styles.menu}>
              <MenuRow
                icon="receipt-outline"
                title="Credit transactions"
                note={`${totalActiveCredits} credits available · view full ledger`}
                onPress={() => navigation.navigate('Transactions')}
                last
              />
            </View>

            <Text style={styles.sectionLabel}>ACCOUNT & PRIVACY</Text>
            <View style={styles.menu}>
              <MenuRow
                icon="ticket-outline"
                title="Membership & credits"
                note="Wallet, passes and validity"
                onPress={() => navigation.navigate('AccessTab')}
              />
              <MenuRow
                icon="location-outline"
                title="Home area"
                note={user?.location || 'Location not set'}
              />
              <MenuRow
                icon="shield-checkmark-outline"
                title="Privacy policy"
                onPress={() => openLegal('privacy')}
              />
              <MenuRow
                icon="document-text-outline"
                title="Terms of service"
                onPress={() => openLegal('terms')}
              />
              <MenuRow
                icon="mail-outline"
                title="Contact support"
                note={SUPPORT_EMAIL}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              />
              <MenuRow
                icon="trash-outline"
                title="Delete account"
                onPress={handleDeleteAccountPress}
                danger
                last
              />
            </View>

            <Text style={styles.versionText}>
              ULTIM v{Constants.expoConfig?.version ?? '1.0.0'}
              {Constants.nativeBuildVersion ? ` (${Constants.nativeBuildVersion})` : ''}
            </Text>

            <View style={styles.logoutWrap}>
              <OutlineButton
                label="Log out"
                icon="log-out-outline"
                onPress={handleLogoutPress}
                color={COLORS.error}
                fullWidth
              />
            </View>
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
    width: 54,
    height: 54,
    borderRadius: 27,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,106,26,0.5)',
    backgroundColor: COLORS.surfaceBright,
  },
  avatarText: {
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  profileName: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 29,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  profileMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    lineHeight: 16,
  },
  profileLocation: {
    color: COLORS.meta,
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    gap: 7,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  statLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 10,
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  menuTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  menuNote: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  versionText: {
    marginTop: 22,
    color: COLORS.meta,
    fontFamily: FONTS.medium,
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  logoutWrap: {
    marginTop: 14,
  },
});
