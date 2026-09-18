import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { NoticeBanner } from '../components/NoticeBanner';
import { StatusBadge } from '../components/StatusBadge';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton, IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { api } from '../services/api';
import { adaptMembershipPlan } from '../services/adapters';
import { MembershipPlan } from '../types';

interface PlanDetailScreenProps {
  route: any;
  navigation: any;
}

export const PlanDetailScreen: React.FC<PlanDetailScreenProps> = ({ route, navigation }) => {
  const { planId, plan: passedPlan } = route.params || {};
  const { plans, facilities, colors } = useApp();
  const insets = useSafeAreaInsets();

  // Prefer the full plan passed directly (from FacilityDetailScreen).
  // Fall back to context lookup by planId, then first plan in context.
  const initialPlan: MembershipPlan | undefined =
    passedPlan ?? plans.find((p) => String(p.id) === String(planId)) ?? plans[0];

  const [plan, setPlan] = useState<MembershipPlan | undefined>(initialPlan);
  const [loading, setLoading] = useState<boolean>(false);

  const facility = plan ? facilities.find((f) => String(f.id) === String(plan.facilityId)) : undefined;

  useEffect(() => {
    const fetchLivePlan = async () => {
      if (!planId) return;
      try {
        setLoading(true);
        const res = await api.getMembershipPlanDetails(planId);
        if (res?.id) {
          setPlan(adaptMembershipPlan(res, facility?.name));
        }
      } catch (e) {
        console.log('[PlanDetail] Using default plan state:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLivePlan();
  }, [planId]);

  const handleGetCenterDirections = () => {
    let lat = facility?.latitude;
    let lng = facility?.longitude;
    if ((lat === undefined || lng === undefined) && facility?.rawLocation && Array.isArray(facility.rawLocation) && facility.rawLocation.length >= 2) {
      lng = facility.rawLocation[0];
      lat = facility.rawLocation[1];
    }

    let url: string;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const label = encodeURIComponent(facility?.name || plan?.facilityName || 'Center');
      url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = encodeURIComponent(`${facility?.name || plan?.facilityName || 'Center'}, ${facility?.address || 'Hyderabad'}`);
      url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
        web: `https://www.google.com/maps/search/?api=1&query=${query}`,
      }) || `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    Linking.openURL(url).catch(() => {
      if (lat !== undefined && lng !== undefined) {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      } else {
        const query = encodeURIComponent(`${facility?.name || plan?.facilityName || 'Center'}, ${facility?.address || 'Hyderabad'}`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      }
    });
  };

  if (!plan) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      {/* Top Bar with Safe Area Inset */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 6,
            backgroundColor: 'rgba(10,10,14,0.88)',
            borderBottomColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <IconButton
          icon="arrow-back"
          size={40}
          iconSize={22}
          iconColor={colors.onSurface}
          backgroundColor={colors.glassHigh}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>Plan Overview</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Main Plan Card */}
            <View
              style={[
                styles.heroCard,
                { backgroundColor: colors.emberPanel, borderColor: colors.emberBorder },
              ]}
            >
              <StatusBadge label="OFFLINE REGISTRATION ONLY" type="notice" />
              <Text style={[styles.planTitle, { color: colors.onSurface }]}>{plan.title}</Text>
              <Text style={[styles.facilityName, { color: colors.primary }]}>{plan.facilityName}</Text>
              {!!plan.description && (
                <Text style={[styles.planDescription, { color: colors.textMuted }]}>
                  {plan.description}
                </Text>
              )}

              <View style={[styles.creditHighlightRow, { borderTopColor: 'rgba(255,255,255,0.10)' }]}>
                <View style={styles.creditBigBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.creditVal}>{plan.creditsGranted}</Text>
                    <CreditIcon size={34} />
                  </View>
                  <Text style={styles.creditLabel}>MONTHLY CREDITS</Text>
                </View>

                <View style={styles.priceCol}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { color: colors.onSurface }]}>
                      {isNaN(Number(plan.price)) ? plan.price : `₹${plan.price}`}
                    </Text>
                    {plan.hasDiscount && plan.originalPrice && (
                      <Text style={styles.priceStrike}>{`₹${plan.originalPrice}`}</Text>
                    )}
                  </View>
                  {plan.hasDiscount && plan.originalPrice && (
                    <View style={styles.saveChip}>
                      <Text style={styles.saveChipText}>
                        SAVE ₹{Math.max(0, Number(plan.originalPrice) - Number(plan.price))}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.validityText, { color: colors.textMuted }]}>
                    {plan.durationDays} Days Validity
                  </Text>
                </View>
              </View>
            </View>

            {/* Mandatory Offline Activation Banner */}
            <NoticeBanner message="NOTICE: Memberships cannot be purchased inside the app. Visit the center reception desk to register and receive your credited balance." />

            {/* Plan Breakdown */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>
                PLAN INCLUSIONS & PERKS
              </Text>
              {plan.features.map((feature: string, idx: number) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle-sharp" size={18} color={colors.tertiary} />
                  <Text style={[styles.featureText, { color: colors.onSurface }]}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Valid Activities */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>
                ELIGIBLE ACTIVITIES & ZONES
              </Text>
              <View style={styles.activitiesRow}>
                {plan.validActivities.map((act: string, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.activityChip,
                      { backgroundColor: colors.glassHigh, borderColor: colors.glassBorder },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getActivityIcon(act)}
                      size={14}
                      color={colors.secondary}
                    />
                    <Text style={[styles.activityText, { color: colors.onSurface }]}>{act.toLocaleUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Center Directions CTA */}
            <GradientButton
              label="SHOW IN GOOGLE MAPS"
              icon="map-sharp"
              onPress={handleGetCenterDirections}
              fullWidth
              style={{ marginTop: SPACING.lg }}
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
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,10,14,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
  },
  scrollContent: {
    padding: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  heroCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  planTitle: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 30,
    color: COLORS.onSurface,
    marginTop: 10,
  },
  facilityName: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  creditHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  creditBigBox: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.4)',
    alignItems: 'center',
  },
  creditVal: {
    fontSize: 28,
    fontFamily: FONTS.black,
    color: COLORS.primary,
  },
  creditLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  priceStrike: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  saveChip: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldPanel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.goldBorder,
  },
  saveChipText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    color: COLORS.secondary,
  },
  planDescription: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginTop: 6,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 27,
    color: COLORS.onSurface,
  },
  validityText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.onSurface,
    marginLeft: 8,
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  activitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  activityText: {
    fontSize: 12,
    color: COLORS.onSurface,
    marginLeft: 6,
    fontFamily: FONTS.semiBold,
  },
});
