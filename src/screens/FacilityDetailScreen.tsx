import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { NoticeBanner } from '../components/NoticeBanner';
import { StatusBadge } from '../components/StatusBadge';
import { IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { api } from '../services/api';
import { adaptMembershipPlan, adaptTenantToFacility } from '../services/adapters';
import { MembershipPlan, Facility } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Google Maps' brand red — used for the "Get Directions" affordance so it reads
// as the recognizable Google Maps action rather than the app's own accent color.
const GOOGLE_MAPS_RED = '#EA4335';

interface FacilityDetailScreenProps {
  route: any;
  navigation: any;
}

export const FacilityDetailScreen: React.FC<FacilityDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { facilityId } = route.params || {};
  const { facilities, plans: defaultPlans, colors } = useApp();
  const insets = useSafeAreaInsets();

  const [facility, setFacility] = useState<Facility>(
    facilities.find((f) => String(f.id) === String(facilityId)) || facilities[0]
  );
  const [loadingFacility, setLoadingFacility] = useState<boolean>(false);

  const [facilityPlans, setFacilityPlans] = useState<MembershipPlan[]>(
    defaultPlans.filter((p) => String(p.facilityId) === String(facility?.id))
  );
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Fetch full facility details if not available locally
  useEffect(() => {
    const fetchFacilityData = async () => {
      if (!facilityId) return;
      try {
        setLoadingFacility(true);
        const tenantData = await api.getTenantDetails(facilityId);
        if (tenantData?.id) {
          setFacility(adaptTenantToFacility(tenantData));
        }
      } catch (e) {
        console.log('[FacilityDetail] Using existing facility state:', e);
      } finally {
        setLoadingFacility(false);
      }
    };

    fetchFacilityData();
  }, [facilityId]);

  // Fetch live plans for this facility
  useEffect(() => {
    const loadLivePlans = async () => {
      if (!facility?.id) return;
      try {
        setLoadingPlans(true);
        const res = await api.getMembershipPlans(facility.id);
        if (res?.docs && res.docs.length > 0) {
          const adapted = res.docs.map((p) => adaptMembershipPlan(p, facility.name));
          setFacilityPlans(adapted);
        }
      } catch (e) {
        console.log('[FacilityDetail] Using default plan state:', e);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadLivePlans();
  }, [facility?.id]);

  const handleOpenGoogleMaps = () => {
    if (!facility) return;

    let lat = facility.latitude;
    let lng = facility.longitude;
    if ((lat === undefined || lng === undefined) && facility.rawLocation && Array.isArray(facility.rawLocation) && facility.rawLocation.length >= 2) {
      lng = facility.rawLocation[0];
      lat = facility.rawLocation[1];
    }

    let url: string;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const label = encodeURIComponent(facility.name || 'Facility');
      url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = encodeURIComponent(`${facility.name}, ${facility.address}`);
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
        const query = encodeURIComponent(`${facility.name}, ${facility.address}`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      }
    });
  };

  const images = facility?.images && facility.images.length > 0
    ? facility.images
    : facility?.imageUrl
      ? [facility.imageUrl]
      : [];

  if (loadingFacility && !facility) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      {/* Floating Back Button */}
      <IconButton
        icon="arrow-back"
        size={40}
        iconSize={22}
        iconColor="#FFF"
        backgroundColor="rgba(19, 19, 18, 0.75)"
        borderColor={'rgba(255,255,255,0.10)'}
        onPress={() => navigation.goBack()}
        style={[styles.floatingBackBtn, { top: Math.max(insets.top, 12) + 6 }]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Photo Carousel */}
        <View style={styles.heroContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const contentOffset = e.nativeEvent.contentOffset.x;
                  const viewSize = e.nativeEvent.layoutMeasurement.width;
                  const pageNum = Math.floor(contentOffset / (viewSize || 1));
                  if (pageNum !== activeImageIdx) {
                    setActiveImageIdx(pageNum);
                  }
                }}
                scrollEventThrottle={16}
              >
                {images.map((imgUri, index) => (
                  <View key={`${imgUri}-${index}`} style={styles.carouselSlide}>
                    <Image source={{ uri: imgUri }} style={styles.heroImage} resizeMode="cover" />
                    <View style={styles.heroGradient} />
                  </View>
                ))}
              </ScrollView>

              {/* Dots indicator */}
              {images.length > 1 && (
                <View style={styles.dotsContainer}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[styles.dot, activeImageIdx === idx && styles.activeDot]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderHero}>
              <Ionicons name="barbell-outline" size={54} color={COLORS.primary} />
              <Text style={styles.placeholderHeroText}>NO FACILITY PHOTOS LISTED</Text>
            </View>
          )}

          <View style={styles.heroBadgeRow}>
            <StatusBadge label={facility.category} type="active" />
            {facility.rating > 0 && (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingVal}>{facility.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Title & Location */}
          <Text style={[styles.title, { color: colors.onSurface }]}>{facility.name}</Text>

          {/* Location / Get Directions Card */}
          <TouchableOpacity
            style={[styles.locationCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={handleOpenGoogleMaps}
            activeOpacity={0.85}
          >
            <View style={styles.locationIconBox}>
              <MaterialCommunityIcons name="google-maps" size={20} color={GOOGLE_MAPS_RED} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={[styles.addressText, { color: colors.onSurface }]} numberOfLines={2}>
                {facility.address}
              </Text>
              <Text style={styles.directionsHint}>GET DIRECTIONS</Text>
            </View>
            <View style={styles.mapArrowBtn}>
              <Ionicons name="navigate" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Operating Hours */}




          {/* Description */}
          <Text style={[styles.description, { color: colors.textMuted }]}>{facility.description}</Text>

          {/* Amenities Grid */}
          {facility.amenities && facility.amenities.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>CENTER AMENITIES</Text>
              <View style={styles.amenitiesGrid}>
                {facility.amenities.map((am) => (
                  <View key={am.id} style={[styles.amenityChip, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.tertiary} />
                    <Text style={[styles.amenityText, { color: colors.onSurface }]}>{am.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Physical Center Activation Notice */}
          <View style={{ marginTop: SPACING.md }}>
            <NoticeBanner message="Visit center reception desk to activate membership pass & get credits loaded onto your account." />
          </View>

          {/* Membership Plans List */}
          <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>MEMBERSHIP PLANS ({facilityPlans.length})</Text>

          {loadingPlans ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : facilityPlans.length === 0 ? (
            <View style={[styles.emptyPlansCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Ionicons name="card-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyPlansText, { color: colors.textMuted }]}>No active membership plans listed online.</Text>
            </View>
          ) : (
            facilityPlans.map((plan) => {
              const planIcon = getActivityIcon(plan.validActivities?.[0] || facility.category);
              const subline =
                plan.description?.trim() ||
                (plan.validActivities?.length
                  ? plan.validActivities.slice(0, 3).join(' · ')
                  : `Valid ${plan.durationDays} days`);
              const priceText = isNaN(Number(plan.price)) ? plan.price : `₹${plan.price}`;
              const savings =
                plan.hasDiscount && plan.originalPrice
                  ? Math.max(0, Number(plan.originalPrice) - Number(plan.price))
                  : 0;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.passWrapper, SHADOWS.card]}
                  onPress={() =>
                    navigation.navigate('PlanDetail', {
                      plan,
                      facilityName: facility.name,
                    })
                  }
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.passCard,
                      { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                    ]}
                  >
                    {/* Frosty sheen */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0.2, y: 0.9 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <MaterialCommunityIcons
                      name={planIcon}
                      size={132}
                      color="rgba(255,255,255,0.05)"
                      style={styles.passDecor}
                    />

                    <View style={styles.passHeader}>
                      <View style={styles.passMark}>
                        <MaterialCommunityIcons name={planIcon} size={19} color={COLORS.secondary} />
                      </View>
                      <View style={styles.passCreditsCol}>
                        <View style={styles.passCreditsRow}>
                          <Text style={styles.passCreditsNum}>{plan.creditsGranted}</Text>
                          <Text style={styles.passCreditsWord}>credits</Text>
                        </View>
                        <Text style={styles.passCreditsOf}>{plan.durationDays} DAY PASS</Text>
                      </View>
                    </View>

                    <Text style={styles.passTitle} numberOfLines={2}>
                      {plan.title}
                    </Text>
                    <Text style={styles.passSub} numberOfLines={1}>
                      {subline}
                    </Text>

                    <View style={styles.passFooter}>
                      <View>
                        <View style={styles.priceLabelRow}>
                          <Text style={styles.passPriceLabel}>OFFLINE RATE</Text>
                          {savings > 0 && (
                            <View style={styles.saveChip}>
                              <Text style={styles.saveChipText}>SAVE ₹{savings}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.passPrice}>{priceText}</Text>
                          {savings > 0 && (
                            <Text style={styles.passPriceStrike}>{`₹${plan.originalPrice}`}</Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.passBtn, SHADOWS.ember]}>
                        <Text style={styles.passBtnText}>VIEW DETAILS</Text>
                        <Ionicons name="chevron-forward" size={13} color={COLORS.onPrimary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  floatingBackBtn: {
    position: 'absolute',
    left: SPACING.containerPadding,
    zIndex: 100,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  heroContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.glassHigh,
  },
  carouselSlide: {
    width: SCREEN_WIDTH,
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 6, 0.30)',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
  placeholderHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassHigh,
  },
  placeholderHeroText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 12,
    right: SPACING.containerPadding,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 15, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  ratingVal: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  mainContent: {
    padding: SPACING.containerPadding,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 30,
    color: COLORS.onSurface,
  },
  addressText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  locationIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(234,67,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextCol: {
    flex: 1,
    gap: 3,
  },
  directionsHint: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: GOOGLE_MAPS_RED,
    letterSpacing: 0.4,
  },
  mapArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: GOOGLE_MAPS_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hoursText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  amenityText: {
    fontSize: 11,
    color: COLORS.onSurface,
    marginLeft: 6,
    fontFamily: FONTS.semiBold,
  },
  emptyPlansCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  emptyPlansText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  passWrapper: {
    marginTop: 12,
    borderRadius: 22,
  },
  passCard: {
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  passDecor: {
    position: 'absolute',
    right: -24,
    bottom: -30,
    transform: [{ rotate: '-12deg' }],
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  passMark: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.glassBorder,
  },
  passCreditsCol: {
    alignItems: 'flex-end',
  },
  passCreditsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  passCreditsNum: {
    fontSize: 25,
    fontFamily: FONTS.black,
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  passCreditsWord: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    color: COLORS.textMuted,
  },
  passCreditsOf: {
    fontSize: 8.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.3,
    marginTop: 3,
    color: 'rgba(255,255,255,0.42)',
  },
  passTitle: {
    fontSize: 25,
    fontFamily: FONTS.black,
    letterSpacing: -0.7,
    lineHeight: 29,
    color: '#FFFFFF',
  },
  passSub: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    marginTop: 4,
    color: COLORS.textMuted,
  },
  passFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  saveChip: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldPanel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.goldBorder,
  },
  saveChipText: {
    fontSize: 7.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    color: COLORS.secondary,
  },
  passPriceStrike: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  passPriceLabel: {
    fontSize: 8.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.3,
    color: 'rgba(255,255,255,0.42)',
  },
  passPrice: {
    fontSize: 20,
    fontFamily: FONTS.black,
    letterSpacing: -0.4,
    marginTop: 2,
    color: '#FFFFFF',
  },
  passBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  passBtnText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    color: COLORS.onPrimary,
  },
});
