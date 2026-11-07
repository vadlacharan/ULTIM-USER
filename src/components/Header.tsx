import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { BlurHeader } from './Blur';
import { ArenaBrand } from './ArenaUI';

interface HeaderProps {
  onNotificationPress: () => void;
  onCreditsPress?: () => void;
  onSignInPress?: () => void;
}

const ROW_HEIGHT = 48;
const FADE_HEIGHT = 18;

/** Header row + top padding, used by HomeScreen to inset its scroll content. */
export const useHeaderLayout = () => {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 10);
  return { top, height: top + ROW_HEIGHT + 8, total: top + ROW_HEIGHT + 8 + FADE_HEIGHT };
};

const HeaderComponent: React.FC<HeaderProps> = ({
  onNotificationPress,
  onCreditsPress,
  onSignInPress,
}) => {
  const { notifications, totalActiveCredits, isAuthenticated } = useApp();
  const { top, height } = useHeaderLayout();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <BlurHeader height={height} fadeHeight={FADE_HEIGHT} intensity={26}>
      <View style={[styles.headerContainer, { paddingTop: top }]}>
        <ArenaBrand compact />

        <View style={styles.rightCluster}>
          <Pressable
            onPress={onNotificationPress}
            accessibilityLabel="Notifications"
            style={({ pressed }) => [styles.bell, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="notifications-outline" size={18} color={COLORS.paper} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>

          {isAuthenticated ? (
            <Pressable
              onPress={onCreditsPress}
              accessibilityRole="button"
              accessibilityLabel={`Active credits, ${totalActiveCredits}. Open credits.`}
              style={({ pressed }) => [styles.creditsChip, pressed && { opacity: 0.82 }]}
            >
              <View style={styles.creditIcon}>
                <Ionicons name="wallet" size={17} color={COLORS.onPrimary} />
              </View>
              <View style={styles.creditsCopy}>
                <Text style={styles.creditsLabel}>ACTIVE CREDITS</Text>
                <Text style={styles.creditsAmount}>{totalActiveCredits}</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={onSignInPress}
              style={({ pressed }) => [styles.signInChip, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.signInText}>SIGN IN</Text>
              <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </BlurHeader>
  );
};

export const Header = React.memo(HeaderComponent);

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: COLORS.onPrimary,
    fontSize: 8,
    fontFamily: FONTS.extraBold,
    lineHeight: 10,
  },
  creditsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingLeft: 5,
    paddingRight: 11,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  creditIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsCopy: {
    justifyContent: 'center',
    gap: 1,
  },
  creditsLabel: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 10,
    letterSpacing: 0.8,
  },
  creditsAmount: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 19,
    lineHeight: 19,
    letterSpacing: 0.3,
  },
  signInChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
  },
  signInText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
