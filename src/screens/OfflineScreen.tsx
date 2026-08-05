import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton } from '../components/buttons';

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
      if (onRetry) {
        await onRetry();
      } else {
        await refreshData();
      }
    } catch (e) {
      console.log('[Offline Retry Error]', e);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
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
        <Text style={[styles.brandText, { color: colors.onSurface }]}>
          ULTIM<Text style={{ color: colors.primary }}>.</Text>
        </Text>
        <View style={styles.offlineBadge}>
          <View style={[styles.offlineDot, { backgroundColor: colors.error }]} />
          <Text style={styles.offlineBadgeText}>OFFLINE</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Main Offline Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh },
          ]}
        >
          {/* Icon Ring */}
          <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceLow }]}>
            <Ionicons name="cloud-offline-sharp" size={46} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>No Internet Connection</Text>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            We can't connect to ULTIM servers right now. Please check your Wi-Fi or mobile data network and try again.
          </Text>

          {/* Cached User Summary if available */}
          {user && (
            <View
              style={[
                styles.cachedUserBox,
                { backgroundColor: colors.surfaceLow, borderColor: colors.surfaceHigh },
              ]}
            >
              <View style={styles.cachedUserRow}>
                <Ionicons name="person-circle-sharp" size={24} color={colors.primary} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[styles.cachedName, { color: colors.onSurface }]}>
                    Signed in as {user.name}
                  </Text>
                  <Text style={[styles.cachedSub, { color: colors.textMuted }]}>
                    {userMemberships.length} Active Pass(es) Saved Locally
                  </Text>
                </View>
                {totalActiveCredits > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.creditsVal, { color: colors.secondary }]}>
                      {totalActiveCredits}
                    </Text>
                    <CreditIcon size={18} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Retry Button */}
          <GradientButton
            label="RETRY CONNECTION"
            icon="refresh-sharp"
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
  },
  brandText: {
    fontSize: 20,
    fontFamily: FONTS.black,
    letterSpacing: 0.5,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginRight: 6,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#EF4444',
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
    padding: SPACING.containerPadding,
    justifyContent: 'center',
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  cachedUserBox: {
    width: '100%',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  cachedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cachedName: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  cachedSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    marginTop: 2,
  },
  creditsVal: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
  },
});
