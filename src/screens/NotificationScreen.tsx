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
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { IconButton } from '../components/buttons';

interface NotificationScreenProps {
  navigation: any;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { notifications, markNotificationAsRead, colors } = useApp();
  const insets = useSafeAreaInsets();

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
        <IconButton
          icon="arrow-back"
          size={40}
          iconSize={22}
          iconColor={colors.onSurface}
          backgroundColor={colors.surfaceLow}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>Notification Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.notifCard,
              { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
              !n.isRead && [styles.unreadCard, { borderLeftColor: colors.primary }],
            ]}
            onPress={() => markNotificationAsRead(n.id)}
            activeOpacity={0.8}
          >
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceLow }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
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
