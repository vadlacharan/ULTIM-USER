import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { DetailTopBar, SectionHead } from '../components/ArenaUI';
import { api } from '../services/api';
import { adaptMembershipPlan } from '../services/adapters';
import { MembershipPlan } from '../types';

interface PlanDetailScreenProps {
  route: any;
  navigation: any;
}

const formatPrice = (price: string) => (isNaN(Number(price)) ? price : `₹${price}`);

export const PlanDetailScreen: React.FC<PlanDetailScreenProps> = ({ route, navigation }) => {
  const { planId, plan: passedPlan, facilityName: passedFacilityName } = route.params || {};
  const { plans, facilities, colors } = useApp();
  const insets = useSafeAreaInsets();

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
          setPlan(adaptMembershipPlan(res, facility?.name || passedFacilityName));
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
    if (
      (lat === undefined || lng === undefined) &&
      facility?.rawLocation &&
      Array.isArray(facility.rawLocation) &&
      facility.rawLocation.length >= 2
    ) {
      lng = facility.rawLocation[0];
      lat = facility.rawLocation[1];
    }

    let url: string;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const label = encodeURIComponent(facility?.name || plan?.facilityName || 'Center');
      url =
        Platform.select({
          ios: `maps:0,0?q=${label}@${lat},${lng}`,
          android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
          web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = encodeURIComponent(
        `${facility?.name || plan?.facilityName || 'Center'}, ${facility?.address || 'Hyderabad'}`
      );
      url =
        Platform.select({
          ios: `maps:0,0?q=${query}`,
          android: `geo:0,0?q=${query}`,
          web: `https://www.google.com/maps/search/?api=1&query=${query}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    Linking.openURL(url).catch(() => {
      const query = encodeURIComponent(
        `${facility?.name || plan?.facilityName || 'Center'}, ${facility?.address || 'Hyderabad'}`
      );
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  if (!plan) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AppBackground />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const primaryIcon = getActivityIcon(plan.validActivities?.[0] || 'gym');
  const priceDisplay = formatPrice(plan.price);
  const savings =
    plan.hasDiscount && plan.originalPrice
      ? Math.max(0, Number(plan.originalPrice) - Number(plan.price))
      : 0;
  const resolvedFacilityName = passedFacilityName || plan.facilityName || facility?.name || 'Partner Center';

  const activationSteps = [
    {
      step: '01',
      title: 'Visit center reception desk',
      sub: `Walk into ${resolvedFacilityName} and ask for this ULTIM pass.`,
      icon: 'walk-outline' as const,
    },
    {
      step: '02',
      title: 'Share your registered number',
      sub: 'Staff links the membership to your ULTIM phone or email on the spot.',
      icon: 'phone-portrait-outline' as const,
    },
    {
      step: '03',
      title: 'Credits load instantly',
      sub: `${plan.creditsGranted} credits appear in your Access tab — swipe to book any slot.`,
      icon: 'flash-outline' as const,
    },
  ];

  const terms = [
    `Valid for ${plan.durationDays} days from activation.`,
    'One credit covers one hour of court or studio time.',
    'Available at all participating ULTIM venues.',
    'Credits are non-transferable and non-refundable.',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DetailTopBar label="Membership" onBack={() => navigation.goBack()} />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(40).duration(340).damping(24)}>
              <View style={[styles.passHero, { borderColor: 'rgba(255,106,26,0.5)' }]}>
                <View style={styles.passTopline}>
                  <View style={styles.passTag}>
                    <Text style={styles.passTagText}>
                      {savings > 0 ? `SAVE ₹${savings}` : 'ACTIVATE AT DESK'}
                    </Text>
                  </View>
                  <Text style={styles.passBrand}>ULTIM</Text>
                </View>

                <View style={styles.venueRow}>
                  <MaterialCommunityIcons name={primaryIcon} size={14} color={COLORS.primary} />
                  <Text style={styles.venueText} numberOfLines={1}>
                    {resolvedFacilityName.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.passName}>{plan.title}</Text>
                {!!plan.description && <Text style={styles.passPitch}>{plan.description}</Text>}

                <View style={styles.passStats}>
                  <View style={styles.passStat}>
                    <Text style={styles.passValue}>{plan.creditsGranted}</Text>
                    <Text style={styles.passLabel}>CREDITS</Text>
                  </View>
                  <View style={styles.passStat}>
                    <Text style={styles.passValue}>{plan.durationDays}</Text>
                    <Text style={styles.passLabel}>DAYS</Text>
                  </View>
                  <View style={styles.passStat}>
                    <Text style={styles.passValue}>{plan.validActivities?.length || 1}</Text>
                    <Text style={styles.passLabel}>ACTIVITIES</Text>
                  </View>
                </View>

                <View style={styles.passFooter}>
                  <View>
                    <Text style={styles.passFooterLabel}>PAY AT RECEPTION</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.passPrice}>{priceDisplay}</Text>
                      {savings > 0 && plan.originalPrice && (
                        <Text style={styles.priceStrike}>₹{plan.originalPrice}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.passValidity}>ONE-TIME · {plan.durationDays} DAYS</Text>
                </View>
              </View>
            </Animated.View>

            {plan.validActivities && plan.validActivities.length > 0 && (
              <Animated.View entering={FadeInDown.delay(130).duration(340).damping(24)} style={styles.section}>
                <SectionHead
                  eyebrow="Everything inside"
                  title="Included activities"
                  meta={`${plan.validActivities.length} included`}
                />
                <View style={styles.benefitList}>
                  {plan.validActivities.map((act: string, idx: number) => (
                    <View key={`${act}-${idx}`} style={styles.benefitRow}>
                      <View style={styles.benefitIcon}>
                        <MaterialCommunityIcons name={getActivityIcon(act)} size={14} color={COLORS.primary} />
                      </View>
                      <View style={styles.benefitCopy}>
                        <Text style={styles.benefitName}>{act}</Text>
                        <Text style={styles.benefitNote}>Included in this pass</Text>
                      </View>
                      <Ionicons name="checkmark" size={16} color={COLORS.success} />
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {(() => {
              const perkFeatures = (plan.features || []).filter(
                (f: string) => !/credits granted/i.test(f) && !/^valid for:/i.test(f)
              );
              if (perkFeatures.length === 0) return null;
              return (
                <Animated.View entering={FadeInDown.delay(170).duration(340).damping(24)} style={styles.section}>
                  <SectionHead eyebrow="A little extra" title="Plan perks" meta="PASS PERKS" />
                  <View style={styles.benefitList}>
                    {perkFeatures.map((feature: string, idx: number) => (
                      <View key={`${feature}-${idx}`} style={styles.benefitRow}>
                        <View style={styles.benefitIcon}>
                          <Ionicons name="checkmark" size={14} color={COLORS.primary} />
                        </View>
                        <View style={styles.benefitCopy}>
                          <Text style={styles.benefitName}>{feature}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              );
            })()}

            <Animated.View entering={FadeInDown.delay(210).duration(340).damping(24)} style={styles.section}>
              <SectionHead eyebrow="How it works" title="Activate your pass" meta="3 STEPS" />
              <View style={styles.timeline}>
                {activationSteps.map((item, idx) => {
                  const last = idx === activationSteps.length - 1;
                  return (
                    <View key={item.step} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View style={styles.timelineIcon}>
                          <Ionicons name={item.icon} size={15} color={COLORS.primary} />
                        </View>
                        {!last && <View style={styles.timelineConnector} />}
                      </View>
                      <View style={[styles.timelineCopy, !last && { paddingBottom: 16 }]}>
                        <Text style={styles.timelineStep}>STEP {item.step}</Text>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineSub}>{item.sub}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(340).damping(24)} style={styles.section}>
              <SectionHead eyebrow="The details" title="Good to know" />
              <View style={styles.termsCard}>
                <Text style={styles.termsTitle}>Credits and validity</Text>
                {terms.map((term, idx) => (
                  <View key={idx} style={styles.termRow}>
                    <View style={styles.termDot} />
                    <Text style={styles.termText}>{term}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.dockPriceCol}>
          <Text style={styles.dockPriceLabel}>PAY AT RECEPTION</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.dockPriceVal}>{priceDisplay}</Text>
            {savings > 0 && plan.originalPrice && (
              <Text style={styles.dockPriceStrike}>₹{plan.originalPrice}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.directionsPill}
          onPress={handleGetCenterDirections}
          activeOpacity={0.88}
        >
          <Ionicons name="navigate-outline" size={15} color={COLORS.onPrimary} />
          <Text style={styles.directionsPillText}>GET DIRECTIONS</Text>
        </TouchableOpacity>
      </View>
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
  passHero: {
    gap: 12,
    padding: 20,
    borderWidth: 1,
    borderRadius: RADIUS.panel,
    backgroundColor: '#17110D',
  },
  passTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  passTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
  },
  passTagText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.7,
  },
  passBrand: {
    color: COLORS.muted,
    fontFamily: FONTS.display,
    fontSize: 15,
    lineHeight: 16,
    letterSpacing: 2.2,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueText: {
    flex: 1,
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 1.1,
  },
  passName: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 52,
    lineHeight: 46,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  passPitch: {
    maxWidth: 300,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  passStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  passStat: {
    flex: 1,
    gap: 3,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  passValue: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 27,
    letterSpacing: 0.3,
  },
  passLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 0.6,
  },
  passFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  passFooterLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 2,
  },
  passPrice: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 31,
    letterSpacing: 0.3,
  },
  priceStrike: {
    color: COLORS.meta,
    fontFamily: FONTS.medium,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  passValidity: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 9,
    letterSpacing: 0.4,
    textAlign: 'right',
  },

  section: {
    marginTop: 28,
  },
  benefitList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted,
  },
  benefitCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  benefitName: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 19,
    textTransform: 'capitalize',
  },
  benefitNote: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  timeline: {
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceBright,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  timelineConnector: {
    flex: 1,
    width: 1,
    backgroundColor: COLORS.line,
    marginVertical: 4,
  },
  timelineCopy: {
    flex: 1,
    paddingTop: 1,
  },
  timelineStep: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1,
  },
  timelineTitle: {
    marginTop: 2,
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  timelineSub: {
    marginTop: 3,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  termsCard: {
    gap: 7,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  termsTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  termDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 7,
  },
  termText: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 11,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  dockPriceCol: {
    gap: 1,
  },
  dockPriceLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 1,
  },
  dockPriceVal: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  dockPriceStrike: {
    color: COLORS.meta,
    fontFamily: FONTS.medium,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  directionsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  directionsPillText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
