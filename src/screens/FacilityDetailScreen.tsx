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
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { NoticeBanner } from '../components/NoticeBanner';
import { StatusBadge } from '../components/StatusBadge';
import { CreditIcon } from '../components/CreditIcon';
import { IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
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
      {/* Floating Back Button */}
      <IconButton
        icon="arrow-back"
        size={40}
        iconSize={22}
        iconColor="#FFF"
        backgroundColor="rgba(19, 19, 18, 0.75)"
        borderColor={COLORS.surfaceHigh}
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
              <Ionicons name="fitness-outline" size={54} color={COLORS.primary} />
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
            style={[styles.locationCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}
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
                  <View key={am.id} style={[styles.amenityChip, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}>
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
            <View style={[styles.emptyPlansCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}>
              <Ionicons name="card-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyPlansText, { color: colors.textMuted }]}>No active membership plans listed online.</Text>
            </View>
          ) : (
            facilityPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}
                onPress={() =>
                  navigation.navigate('PlanDetail', {
                    plan,
                    facilityName: facility.name,
                  })
                }
                activeOpacity={0.88}
              >
                <View style={styles.planCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.onSurface }]}>{plan.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={styles.planCredits}>{plan.creditsGranted}</Text>
                      <CreditIcon size={20} />
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>
                    {isNaN(Number(plan.price)) ? plan.price : `₹${plan.price}`}
                  </Text>
                </View>

                <View style={[styles.planFooter, { borderTopColor: colors.surfaceHigh }]}>
                  <Text style={[styles.planDuration, { color: colors.textMuted }]}>Valid {plan.durationDays} Days</Text>
                  <View style={styles.viewPlanBtn}>
                    <Text style={styles.viewPlanBtnText}>VIEW DETAILS</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
    backgroundColor: COLORS.surfaceLow,
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
    backgroundColor: 'rgba(19, 19, 18, 0.35)',
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
    backgroundColor: COLORS.surfaceLow,
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
    backgroundColor: 'rgba(19, 19, 18, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
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
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  amenityText: {
    fontSize: 11,
    color: COLORS.onSurface,
    marginLeft: 6,
    fontFamily: FONTS.semiBold,
  },
  emptyPlansCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  emptyPlansText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  planCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
  },
  planCredits: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceHigh,
  },
  planDuration: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  viewPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewPlanBtnText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginRight: 2,
  },
});
