import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton } from '../components/buttons';
import { ArenaBrand } from '../components/ArenaUI';

interface OfflineScreenProps {
  onRetry?: () => void;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
  const { colors, refreshData, user, userMemberships, totalActiveCredits } = useApp();
  const insets = useSafeAreaInsets();
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      if (onRetry) await onRetry();
      else await refreshData();
    } catch (e) {
      console.log('[Offline Retry Error]', e);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, 12) + 6 },
        ]}
      >
        <ArenaBrand />
        <View style={styles.offlineBadge}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineBadgeText}>OFFLINE</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Ionicons name="cloud-offline-outline" size={36} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>No internet connection</Text>
          <Text style={styles.subtitle}>
            We can't connect to ULTIM servers right now. Check your Wi-Fi or mobile data and try again.
          </Text>

          {user && (
            <View style={styles.cachedUserBox}>
              <View style={styles.cachedUserRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                <View style={{ marginLeft: 9, flex: 1 }}>
                  <Text style={styles.cachedName}>Signed in as {user.name}</Text>
                  <Text style={styles.cachedSub}>
                    {userMemberships.length} active pass(es) saved locally
                  </Text>
                </View>
                {totalActiveCredits > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.creditsVal}>{totalActiveCredits}</Text>
                    <CreditIcon size={16} />
                  </View>
                )}
              </View>
            </View>
          )}

          <GradientButton
            label="Retry connection"
            icon="refresh"
            onPress={handleRetry}
            loading={isRetrying}
            fullWidth
          />
        </View>
      </View>
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
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.background,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(243,114,127,0.3)',
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(243,114,127,0.10)',
  },
  offlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  offlineBadgeText: {
    color: COLORS.error,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  content: {
    flex: 1,
    padding: SPACING.containerPadding,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'flex-start',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.panel,
    backgroundColor: COLORS.surface,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryMuted,
    marginBottom: 18,
  },
  title: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 33,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  cachedUserBox: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surfaceBright,
  },
  cachedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cachedName: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  cachedSub: {
    marginTop: 2,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    lineHeight: 14,
  },
  creditsVal: {
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 18,
  },
});
