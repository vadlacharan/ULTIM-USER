import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { ArenaEmptyState, DetailTopBar, PageHead } from '../components/ArenaUI';

interface NotificationScreenProps {
  navigation: any;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { notifications, markNotificationAsRead, colors } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DetailTopBar label="Notification center" onBack={() => navigation.goBack()} />
        <PageHead
          eyebrow="Updates"
          title="Your"
          accent=" updates"
          sub="Booking confirmations, credit activity and arena news."
        />

        {notifications.length === 0 && (
          <ArenaEmptyState
            icon="notifications-off-outline"
            title="You're all caught up"
            copy="Booking updates and credit activity will appear here."
          />
        )}

        {notifications.map((n, index) => {
          const icon =
            n.type === 'BOOKING'
              ? 'calendar-outline'
              : n.type === 'CREDIT'
                ? 'wallet-outline'
                : 'information-circle-outline';
          return (
            <Animated.View
              key={n.id}
              entering={FadeInDown.delay(Math.min(index, 6) * 45).duration(320).damping(24)}
            >
              <TouchableOpacity
                style={[styles.notifCard, !n.isRead && styles.unreadCard]}
                onPress={() => markNotificationAsRead(n.id)}
                activeOpacity={0.8}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.notifTime}>{n.timestamp}</Text>
                  </View>
                  <Text style={styles.notifMsg}>{n.message}</Text>
                </View>
                {!n.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
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
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  unreadCard: {
    borderColor: COLORS.line,
    backgroundColor: '#17120E',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  notifTitle: {
    flex: 1,
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  notifTime: {
    color: COLORS.meta,
    fontFamily: FONTS.medium,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  notifMsg: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    lineHeight: 17,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    backgroundColor: COLORS.primary,
  },
});
