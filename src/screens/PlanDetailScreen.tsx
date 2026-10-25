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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
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
      if (lat !== undefined && lng !== undefined) {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      } else {
        const query = encodeURIComponent(
          `${facility?.name || plan?.facilityName || 'Center'}, ${facility?.address || 'Hyderabad'}`
        );
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

  const primaryIcon = getActivityIcon(plan.validActivities?.[0] || 'gym');
  const priceDisplay = isNaN(Number(plan.price)) ? plan.price : `₹${plan.price}`;
  const savings =
    plan.hasDiscount && plan.originalPrice
      ? Math.max(0, Number(plan.originalPrice) - Number(plan.price))
      : 0;
  const resolvedFacilityName = passedFacilityName || plan.facilityName || facility?.name || 'Partner Center';

  const activationSteps = [
    {
      step: '01',
      title: 'Visit Center Reception Desk',
      sub: `Walk into ${resolvedFacilityName} and ask for this ULTIM pass.`,
      icon: 'walk-outline' as const,
    },
    {
      step: '02',
      title: 'Share Your Registered Number',
      sub: 'Staff links the membership to your ULTIM phone or email on the spot.',
      icon: 'phone-portrait-outline' as const,
    },
    {
      step: '03',
      title: 'Credits Load Instantly',
      sub: `${plan.creditsGranted} credits appear in your Access tab — swipe to book any slot.`,
      icon: 'flash-outline' as const,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      {/* ── Top Header Bar ── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <IconButton
          icon="arrow-back"
          size={38}
          iconSize={20}
          iconColor="#FFFFFF"
          backgroundColor="#1F1F1F"
          borderColor="rgba(255,255,255,0.08)"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.topBarTitle}>MEMBERSHIP PASS</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* ── 1. FOIL PASS HERO CARD (Archetype: Metal Pass) ── */}
            <Animated.View entering={FadeInDown.delay(40).duration(340).damping(24)}>
              <View style={[styles.passShadow, SHADOWS.float]}>
                <LinearGradient
                  colors={['#2E1609', '#191413', '#131316']}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.passHeroCard}
                >
                  {/* Top glowing foil edge */}
                  <LinearGradient
                    colors={[
                      'rgba(255,90,31,0)',
                      'rgba(255,122,61,0.85)',
                      'rgba(233,181,76,0.55)',
                      'rgba(255,90,31,0)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topEdgeGlow}
                  />

                  <MaterialCommunityIcons
                    name={primaryIcon}
                    size={165}
                    color="rgba(255,90,31,0.07)"
                    style={styles.heroDecorIcon}
                  />

                  <View style={styles.passHeroBody}>
                    {/* Chip + Badge row */}
                    <View style={styles.passHeroTopRow}>
                      <LinearGradient
                        colors={['#F2C05F', '#C98A27']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.foilChip}
                      >
                        <MaterialCommunityIcons name={primaryIcon} size={16} color="#1E1710" />
                      </LinearGradient>

                      <View style={styles.deskOnlyPill}>
                        <View style={styles.deskOnlyDot} />
                        <Text style={styles.deskOnlyText}>ACTIVATE AT DESK</Text>
                      </View>
                    </View>

                    {/* Venue pill + Plan Title */}
                    <View style={styles.venueRow}>
                      <Ionicons name="business-outline" size={12} color={COLORS.secondary} />
                      <Text style={styles.venueText} numberOfLines={1}>
                        {resolvedFacilityName.toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.heroPlanTitle}>{plan.title}</Text>

                    {!!plan.description && (
                      <Text style={styles.heroPlanDesc}>{plan.description}</Text>
                    )}
                  </View>

                  {/* Perforated ticket divider */}
                  <View style={styles.perforation}>
                    <View style={[styles.notch, styles.notchLeft]} />
                    <View style={styles.dashedLine} />
                    <View style={[styles.notch, styles.notchRight]} />
                  </View>

                  {/* Bottom Price + Credits Strip */}
                  <View style={styles.passHeroFooter}>
                    <View>
                      <Text style={styles.footerLabel}>CREDITS INCLUDED</Text>
                      <View style={styles.footerCreditRow}>
                        <Text style={styles.footerCreditNum}>{plan.creditsGranted}</Text>
                        <CreditIcon size={24} />
                      </View>
                    </View>

                    <View style={styles.footerPriceCol}>
                      <View style={styles.priceLabelRow}>
                        {savings > 0 && (
                          <View style={styles.saveBadge}>
                            <Text style={styles.saveBadgeText}>SAVE ₹{savings}</Text>
                          </View>
                        )}
                        <Text style={styles.footerLabel}>CENTER RATE</Text>
                      </View>
                      <View style={styles.priceValueRow}>
                        {savings > 0 && plan.originalPrice && (
                          <Text style={styles.priceStrike}>₹{plan.originalPrice}</Text>
                        )}
                        <Text style={styles.priceBig}>{priceDisplay}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* ── 2. 3-TILE STAT BENTO ROW (Archetype: Solid #181818 Stat Tiles) ── */}
            <Animated.View entering={FadeInDown.delay(90).duration(340).damping(24)}>
              <View style={styles.bentoRow}>
                <View style={styles.bentoTile}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255,90,31,0.14)' }]}>
                    <Ionicons name="flash" size={15} color={COLORS.primary} />
                  </View>
                  <Text style={styles.bentoVal}>{plan.creditsGranted}</Text>
                  <Text style={styles.bentoLabel}>TOTAL CREDITS</Text>
                </View>

                <View style={styles.bentoTile}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(233,181,76,0.14)' }]}>
                    <Ionicons name="calendar" size={15} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.bentoVal}>{plan.durationDays}</Text>
                  <Text style={styles.bentoLabel}>DAYS VALIDITY</Text>
                </View>

                <View style={styles.bentoTile}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(52,211,153,0.14)' }]}>
                    <Ionicons name="trophy" size={15} color={COLORS.success} />
                  </View>
                  <Text style={styles.bentoVal}>{plan.validActivities?.length || 1}</Text>
                  <Text style={styles.bentoLabel}>SPORTS ACCESS</Text>
                </View>
              </View>
            </Animated.View>

            {/* ── 3. ELIGIBLE ACTIVITIES GRID (Archetype: 2-Col Sport Tiles) ── */}
            {plan.validActivities && plan.validActivities.length > 0 && (
              <Animated.View entering={FadeInDown.delay(140).duration(340).damping(24)}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>ELIGIBLE SPORTS & ZONES</Text>
                  <Text style={styles.sectionCount}>{plan.validActivities.length} INCLUDED</Text>
                </View>

                <View style={styles.sportGrid}>
                  {plan.validActivities.map((act: string, idx: number) => (
                    <View key={`${act}-${idx}`} style={styles.sportTile}>
                      <View style={styles.sportIconCircle}>
                        <MaterialCommunityIcons
                          name={getActivityIcon(act)}
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sportTileTitle} numberOfLines={1}>
                          {act.toUpperCase()}
                        </Text>
                        <Text style={styles.sportTileSub}>Included in pass</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── 4. PLAN INCLUSIONS (Archetype: Spotify Tracklist Card) ── */}
            <Animated.View entering={FadeInDown.delay(190).duration(340).damping(24)}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>WHAT YOU GET</Text>
                <Text style={styles.sectionCount}>PASS PERKS</Text>
              </View>

              <View style={styles.tracklistCard}>
                {plan.features.map((feature: string, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.trackRow,
                      idx < plan.features.length - 1 && styles.trackRowBorder,
                    ]}
                  >
                    <Text style={styles.trackIndex}>
                      {String(idx + 1).padStart(2, '0')}
                    </Text>
                    <Text style={styles.trackText}>{feature}</Text>
                    <View style={styles.trackCheck}>
                      <Ionicons name="checkmark" size={12} color={COLORS.onPrimary} />
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ── 5. HOW TO ACTIVATE TIMELINE (Archetype: Stepper Card) ── */}
            <Animated.View entering={FadeInDown.delay(240).duration(340).damping(24)}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>HOW TO ACTIVATE</Text>
                <Text style={styles.sectionCount}>3 EASY STEPS</Text>
              </View>

              <View style={styles.timelineCard}>
                {activationSteps.map((item, idx) => {
                  const isLast = idx === activationSteps.length - 1;
                  return (
                    <View key={item.step} style={styles.timelineRow}>
                      <View style={styles.timelineLeftCol}>
                        <View style={styles.timelineIconCircle}>
                          <Ionicons name={item.icon} size={16} color={COLORS.primary} />
                        </View>
                        {!isLast && <View style={styles.timelineConnector} />}
                      </View>
                      <View style={[styles.timelineTextCol, !isLast && { paddingBottom: 16 }]}>
                        <Text style={styles.timelineStepTag}>STEP {item.step}</Text>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineSub}>{item.sub}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Directions Bar ── */}
      <View
        style={[
          styles.bottomDock,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
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
          style={[styles.directionsPill, SHADOWS.ember]}
          onPress={handleGetCenterDirections}
          activeOpacity={0.88}
        >
          <Ionicons name="navigate" size={15} color={COLORS.onPrimary} />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
  },
  topBarTitle: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.8,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 6,
  },

  // ── 1. Foil Pass Hero Card ──
  passShadow: {
    borderRadius: 20,
  },
  passHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,122,61,0.35)',
    overflow: 'hidden',
  },
  topEdgeGlow: {
    height: 2.5,
    width: '100%',
  },
  heroDecorIcon: {
    position: 'absolute',
    right: -28,
    top: 22,
    transform: [{ rotate: '-14deg' }],
  },
  passHeroBody: {
    padding: 20,
    paddingBottom: 16,
  },
  passHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  foilChip: {
    width: 38,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deskOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(233,181,76,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(233,181,76,0.38)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  deskOnlyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  deskOnlyText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  venueText: {
    fontSize: 10.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.secondary,
    letterSpacing: 1.3,
  },
  heroPlanTitle: {
    fontSize: 26,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 31,
    marginTop: 4,
  },
  heroPlanDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginTop: 6,
  },

  // Perforation
  perforation: {
    position: 'relative',
    justifyContent: 'center',
    height: 18,
  },
  dashedLine: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: 16,
  },
  notch: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background,
  },
  notchLeft: {
    left: -9,
  },
  notchRight: {
    right: -9,
  },

  passHeroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: 'rgba(10,10,12,0.5)',
  },
  footerLabel: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.3,
  },
  footerCreditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  footerCreditNum: {
    fontSize: 32,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  footerPriceCol: {
    alignItems: 'flex-end',
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  saveBadgeText: {
    fontSize: 8,
    fontFamily: FONTS.extraBold,
    color: COLORS.onPrimary,
    letterSpacing: 0.8,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 3,
  },
  priceStrike: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  priceBig: {
    fontSize: 28,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },

  // ── 2. Bento Row ──
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  bentoTile: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'flex-start',
  },
  bentoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bentoVal: {
    fontSize: 22,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  bentoLabel: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.1,
    marginTop: 2,
  },

  // ── Section Headers ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  sectionCount: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 1,
  },

  // ── 3. Eligible Sports Grid ──
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  sportTile: {
    width: '48.3%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242428',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportTileTitle: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  sportTileSub: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ── 4. Tracklist Inclusions Card ──
  tracklistCard: {
    backgroundColor: '#181818',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  trackRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  trackIndex: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    width: 22,
  },
  trackText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  trackCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 5. Timeline Activation Card ──
  timelineCard: {
    backgroundColor: '#181818',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeftCol: {
    alignItems: 'center',
  },
  timelineIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,90,31,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,31,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    flex: 1,
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 4,
  },
  timelineTextCol: {
    flex: 1,
    paddingTop: 1,
  },
  timelineStepTag: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  timelineTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  timelineSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginTop: 3,
  },

  // ── Bottom Dock ──
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 12,
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  dockPriceCol: {
    gap: 1,
  },
  dockPriceLabel: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  dockPriceVal: {
    fontSize: 22,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  dockPriceStrike: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  directionsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    height: 46,
    borderRadius: RADIUS.full,
  },
  directionsPillText: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.onPrimary,
    letterSpacing: 1.5,
  },
});
