import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { IconButton } from './buttons';
import { BlurHeader } from './Blur';

interface HeaderProps {
  onNotificationPress: () => void;
}

const ROW_HEIGHT = 32;
const FADE_HEIGHT = 22;

/** Header row + top padding, used by HomeScreen to inset its scroll content. */
export const useHeaderLayout = () => {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 10) + 2;
  return { top, height: top + ROW_HEIGHT + 8, total: top + ROW_HEIGHT + 8 + FADE_HEIGHT };
};

export const Header: React.FC<HeaderProps> = ({ onNotificationPress }) => {
  const { currentLocation, notifications, colors } = useApp();
  const { top, height } = useHeaderLayout();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <BlurHeader height={height} fadeHeight={FADE_HEIGHT} intensity={44}>
      <View style={[styles.headerContainer, { paddingTop: top }]}>
        {/* LEFT — location pill */}
        <View style={styles.leftCol}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={13} color={colors.primary} />
            <Text
              style={[styles.locationValue, { color: colors.onSurface }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentLocation}
            </Text>
          </View>
        </View>

        {/* CENTER — brand, always exactly centered */}
        <View style={styles.brandContainer}>
          <Text style={[styles.brandText, { color: colors.onSurface }]}>
            ULTIM<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>

        {/* RIGHT — notification icon */}
        <View style={styles.rightCol}>
          <View style={styles.notificationWrapper}>
            <IconButton
              icon="notifications-outline"
              onPress={onNotificationPress}
              size={ROW_HEIGHT}
              iconSize={17}
              iconColor={colors.onSurface}
              backgroundColor="rgba(255,255,255,0.06)"
              borderColor="rgba(255,255,255,0.10)"
            />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </BlurHeader>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 8,
  },
  leftCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    fontFamily: FONTS.black,
    letterSpacing: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: ROW_HEIGHT,
    borderRadius: RADIUS.full,
    maxWidth: 130,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  locationValue: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    flexShrink: 1,
  },
  notificationWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: RADIUS.full,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
  },
});
