import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { BlurHeader, useBlurBackHeaderLayout } from '../components/Blur';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { IconButton } from '../components/buttons';

interface NotificationScreenProps {
  navigation: any;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { notifications, markNotificationAsRead, colors } = useApp();
  const { top: headerTop, height: headerHeight } = useBlurBackHeaderLayout();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>You're all caught up</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Booking updates and credit activity will appear here.
            </Text>
          </View>
        )}
        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.notifCard,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              !n.isRead && [styles.unreadCard, { borderLeftColor: colors.primary }],
            ]}
            onPress={() => markNotificationAsRead(n.id)}
            activeOpacity={0.8}
          >
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: colors.glassHigh }]}>
                <Ionicons
                  name={
                    n.type === 'BOOKING'
                      ? 'calendar-sharp'
                      : n.type === 'CREDIT'
                      ? 'wallet-sharp'
                      : 'information-circle-sharp'
                  }
                  size={20}
                  color={n.type === 'BOOKING' ? colors.primary : colors.secondary}
                />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, { color: colors.onSurface }]}>{n.title}</Text>
                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>{n.timestamp}</Text>
                </View>
                <Text style={[styles.notifMsg, { color: colors.textMuted }]}>{n.message}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating blur header — list scrolls behind it */}
      <BlurHeader
        height={headerHeight}
        contentStyle={{
          paddingTop: headerTop,
          paddingHorizontal: SPACING.containerPadding,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          icon="arrow-back"
          size={40}
          iconSize={22}
          iconColor={colors.onSurface}
          backgroundColor={colors.glassHigh}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>Notification Center</Text>
        <View style={{ width: 40 }} />
      </BlurHeader>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  scrollContent: {
    padding: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  notifCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  notifTime: {
    fontSize: 10,
  },
  notifMsg: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
});
