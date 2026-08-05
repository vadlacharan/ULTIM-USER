import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { IconButton } from './buttons';

interface HeaderProps {
  onNotificationPress: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNotificationPress }) => {
  const { currentLocation, notifications, isDark, toggleTheme, colors } = useApp();
  const insets = useSafeAreaInsets();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 12) + 6,
          backgroundColor: colors.surface,
          borderBottomColor: colors.surfaceHigh,
        },
      ]}
    >
      {/* LEFT — location pill */}
      <View style={styles.leftCol}>
        <View
          style={[
            styles.locationContainer,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.surfaceHigh,
            },
          ]}
        >
          <Ionicons name="location-sharp" size={14} color={colors.primary} />
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

      {/* RIGHT — theme toggle + notification icon */}
      <View style={styles.rightCol}>
        <View style={styles.notificationWrapper}>
          <IconButton
            icon="notifications-outline"
            onPress={onNotificationPress}
            size={36}
            iconSize={20}
            iconColor={colors.onSurface}
            backgroundColor={colors.surfaceContainer}
            borderColor={colors.surfaceHigh}
          />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  leftCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontFamily: FONTS.black,
    letterSpacing: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    maxWidth: 130,
    borderWidth: 1,
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
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: FONTS.extraBold,
  },
});
