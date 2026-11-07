import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { NoticeBanner } from '../components/NoticeBanner';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { ArenaEmptyState, DetailTopBar, Eyebrow, SectionHead } from '../components/ArenaUI';
import { api } from '../services/api';
import { adaptMembershipPlan, adaptTenantToFacility } from '../services/adapters';
import { MembershipPlan, Facility } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_WIDTH = SCREEN_WIDTH - SPACING.containerPadding * 2;

interface FacilityDetailScreenProps {
  route: any;
  navigation: any;
}

const formatPrice = (price: string) => (isNaN(Number(price)) ? price : `₹${price}`);

export const FacilityDetailScreen: React.FC<FacilityDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { facilityId } = route.params || {};
  const { facilities, plans: defaultPlans, colors } = useApp();
  const insets = useSafeAreaInsets();
  const galleryRef = useRef<FlatList<string>>(null);

  const [facility, setFacility] = useState<Facility>(
    facilities.find((f) => String(f.id) === String(facilityId)) || facilities[0]
  );
  const [loadingFacility, setLoadingFacility] = useState<boolean>(false);
  const [facilityPlans, setFacilityPlans] = useState<MembershipPlan[]>(
    defaultPlans.filter((p) => String(p.facilityId) === String(facility?.id))
  );
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [routeOpen, setRouteOpen] = useState<boolean>(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedValidity, setSelectedValidity] = useState<string[]>([]);

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

  // Reset per-facility UI (filters, route panel, gallery) when the venue changes.
  useEffect(() => {
    setSelectedSports([]);
    setSelectedValidity([]);
    setRouteOpen(false);
    setActiveImageIdx(0);
  }, [facility?.id]);

  const handleOpenGoogleMaps = () => {
    if (!facility) return;

    let lat = facility.latitude;
    let lng = facility.longitude;
    if (
      (lat === undefined || lng === undefined) &&
      facility.rawLocation &&
      Array.isArray(facility.rawLocation) &&
      facility.rawLocation.length >= 2
    ) {
      lng = facility.rawLocation[0];
      lat = facility.rawLocation[1];
    }

    let url: string;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const label = encodeURIComponent(facility.name || 'Facility');
      url =
        Platform.select({
          ios: `maps:0,0?q=${label}@${lat},${lng}`,
          android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
          web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = encodeURIComponent(`${facility.name}, ${facility.address}`);
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
        const query = encodeURIComponent(`${facility.name}, ${facility.address}`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      }
    });
  };

  const images =
    facility?.images && facility.images.length > 0
      ? facility.images
      : facility?.imageUrl
        ? [facility.imageUrl]
        : [];
  const thumbs = images.slice(0, 3);

  const onHeroMomentumEnd = useCallback((e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / (GALLERY_WIDTH || 1));
    setActiveImageIdx((prev) => (prev === page ? prev : page));
  }, []);

  const renderHeroItem = useCallback(
    ({ item: imgUri }: { item: string }) => (
      <View style={styles.carouselSlide}>
        <Image
          source={{ uri: imgUri }}
          style={styles.heroImage}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
        />
      </View>
    ),
    []
  );

  if (loadingFacility && !facility) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), justifyContent: 'center' }]}>
        <AppBackground />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!facility) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        <AppBackground />
        <Text style={{ color: COLORS.paper, textAlign: 'center', marginTop: 48 }}>Facility not found.</Text>
      </View>
    );
  }

  const activityCount = facility.activities?.length ?? facility.sportTags?.length ?? 0;
  const distanceKm = facility.distanceKm ?? 1.2;
  const driveTime = `${Math.max(3, Math.round(distanceKm * 3))} min`;
  const walkTime = `${Math.max(5, Math.round(distanceKm * 13))} min`;

  // Real map coordinates (facility point). rawLocation is [lng, lat].
  let mapLat = facility.latitude;
  let mapLng = facility.longitude;
  if (
    (mapLat === undefined || mapLng === undefined) &&
    facility.rawLocation &&
    Array.isArray(facility.rawLocation) &&
    facility.rawLocation.length >= 2
  ) {
    mapLng = facility.rawLocation[0];
    mapLat = facility.rawLocation[1];
  }
  const hasCoords =
    typeof mapLat === 'number' &&
    typeof mapLng === 'number' &&
    !isNaN(mapLat) &&
    !isNaN(mapLng);

  // Live Leaflet embed (OpenStreetMap tiles) rendered in a WebView. The map
  // itself is non-interactive so it never fights the parent ScrollView —
  // tapping anywhere opens the full Google Maps app.
  const leafletHtml =
    hasCoords && mapLat !== undefined && mapLng !== undefined
      ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><style>html,body{margin:0;padding:0;height:100%;}#map{height:100%;width:100%;background:#101410;}.leaflet-control-attribution{font-size:8px;background:rgba(10,11,13,.55)!important;color:#8c8881!important;}.leaflet-control-attribution a{color:#8c8881!important;}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>var map=L.map('map',{zoomControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false,boxZoom:false,keyboard:false}).setView([${mapLat},${mapLng}],15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);L.circleMarker([${mapLat},${mapLng}],{radius:9,color:'#0A0B0D',weight:3,fillColor:'#FF6A1A',fillOpacity:1}).addTo(map);</script></body></html>`
      : null;

  const toggleSport = (sport: string) =>
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  const toggleValidity = (bucket: string) =>
    setSelectedValidity((prev) =>
      prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]
    );

  const validityBucketOf = (days: number): string => {
    if (days <= 31) return 'upto1m';
    if (days <= 93) return '1to3m';
    if (days <= 186) return '3to6m';
    return '6plus';
  };

  const sportOptions = [...new Set(
    facilityPlans.flatMap((p) => (p.validActivities || []).map((a) => String(a).toLowerCase()))
  )].sort();

  const filteredPlans = facilityPlans.filter((p) => {
    const sportsOk =
      selectedSports.length === 0 ||
      (p.validActivities || []).some((a) => selectedSports.includes(String(a).toLowerCase()));
    const validityOk =
      selectedValidity.length === 0 ||
      selectedValidity.includes(validityBucketOf(Number(p.durationDays) || 0));
    return sportsOk && validityOk;
  });
  const hasPlanFilters = selectedSports.length > 0 || selectedValidity.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: Math.max(insets.top, 12) + 4 }}>
          <DetailTopBar
            label="Arena"
            onBack={() => navigation.goBack()}
            right={
              <View style={styles.openChip}>
                <View style={styles.openDot} />
                <Text style={styles.openChipText}>OPEN</Text>
              </View>
            }
          />
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={styles.gallery}>
          <View style={styles.galleryFrame}>
            {images.length > 0 ? (
              <FlatList
                ref={galleryRef}
                data={images}
                keyExtractor={(uri, index) => `${uri}-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                removeClippedSubviews
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                getItemLayout={(_, index) => ({
                  length: GALLERY_WIDTH,
                  offset: GALLERY_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={onHeroMomentumEnd}
                renderItem={renderHeroItem}
              />
            ) : (
              <View style={styles.placeholderHero}>
                <Ionicons name="barbell-outline" size={46} color={COLORS.primary} />
                <Text style={styles.placeholderHeroText}>NO FACILITY PHOTOS LISTED</Text>
              </View>
            )}

            <View style={styles.galleryCount}>
              <Text style={styles.galleryCountText}>
                {Math.min(activeImageIdx + 1, Math.max(images.length, 1))} / {Math.max(images.length, 1)}
              </Text>
            </View>

            {images.length > 1 && (
              <>
                <Pressable
                  style={[styles.galleryArrow, { left: 10 }]}
                  onPress={() => {
                    const next = Math.max(0, activeImageIdx - 1);
                    setActiveImageIdx(next);
                    galleryRef.current?.scrollToIndex({ index: next, animated: true });
                  }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.paper} />
                </Pressable>
                <Pressable
                  style={[styles.galleryArrow, { right: 10 }]}
                  onPress={() => {
                    const next = Math.min(images.length - 1, activeImageIdx + 1);
                    setActiveImageIdx(next);
                    galleryRef.current?.scrollToIndex({ index: next, animated: true });
                  }}
                >
                  <Ionicons name="chevron-forward" size={18} color={COLORS.paper} />
                </Pressable>
              </>
            )}
          </View>

          {thumbs.length > 1 && (
            <View style={styles.thumbRow}>
              {thumbs.map((thumb, idx) => (
                <Pressable
                  key={`${thumb}-thumb-${idx}`}
                  onPress={() => {
                    setActiveImageIdx(idx);
                    galleryRef.current?.scrollToIndex({ index: idx, animated: true });
                  }}
                  style={[styles.thumb, activeImageIdx === idx && styles.thumbActive]}
                >
                  <Image source={{ uri: thumb }} style={styles.thumbImage} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).duration(340).damping(24)} style={styles.venueBlock}>
          <Eyebrow>
            {facility.category || 'Arena'}
            {facility.sportTags?.[0] ? ` / ${facility.sportTags[0]}` : ''}
          </Eyebrow>
          <View style={styles.venueHeadingRow}>
            <Text style={styles.venueName}>{facility.name}</Text>
            {facility.rating > 0 && (
              <View style={styles.venueRating}>
                <Ionicons name="star" size={13} color={COLORS.primary} />
                <Text style={styles.venueRatingText}>{facility.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} style={{ marginTop: 2 }} />
            <Text style={styles.addressText}>{facility.address}</Text>
          </View>

          <View style={styles.factsRow}>
            <View style={styles.factPill}>
              <View style={styles.openDot} />
              <Text style={styles.factText}>{facility.operatingHours || 'Open today'}</Text>
            </View>
            {facility.distance && facility.distance !== 'Distance N/A' && (
              <View style={styles.factPill}>
                <Text style={styles.factText}>{facility.distance} away</Text>
              </View>
            )}
            {activityCount > 0 && (
              <View style={styles.factPill}>
                <Text style={styles.factText}>{activityCount} activities</Text>
              </View>
            )}
          </View>

          {!!facility.description && <Text style={styles.description}>{facility.description}</Text>}

          {facility.amenities && facility.amenities.length > 0 && (
            <View style={styles.amenityList}>
              {facility.amenities.map((am) => (
                <View key={am.id} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{am.name}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(340).damping(24)} style={styles.section}>
          <SectionHead
            eyebrow="Find it"
            title="Location"
            meta={facility.distance || 'Nearby'}
          />
          <View style={styles.mapCard}>
            <View style={styles.mapCanvas}>
              {leafletHtml ? (
                <>
                  <WebView
                    source={{ html: leafletHtml }}
                    style={styles.mapWebview}
                    scrollEnabled={false}
                    javaScriptEnabled
                    domStorageEnabled={false}
                    originWhitelist={['*']}
                    pointerEvents="none"
                    androidLayerType="hardware"
                  />
                  <Pressable
                    onPress={handleOpenGoogleMaps}
                    style={StyleSheet.absoluteFill}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${facility.name} in Maps`}
                  />
                </>
              ) : (
                <View style={styles.mapFallback}>
                  <Ionicons name="location-outline" size={26} color={COLORS.primary} />
                  <Text style={styles.mapFallbackText} numberOfLines={2}>
                    {facility.address}
                  </Text>
                  <Text style={styles.mapFallbackHint}>Tap “Open in Maps” for the live location</Text>
                </View>
              )}
            </View>

            <View style={styles.locationBody}>
              <Text style={styles.locationAddress}>{facility.address}</Text>
              <TouchableOpacity
                onPress={() => setRouteOpen((v) => !v)}
                activeOpacity={0.7}
                style={styles.directionsToggle}
              >
                <Text style={styles.directionsToggleText}>Directions</Text>
                <Ionicons
                  name={routeOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {routeOpen && (
              <View style={styles.routePanel}>
                <View style={styles.routeStat}>
                  <Text style={styles.routeValue}>{driveTime}</Text>
                  <Text style={styles.routeLabel}>Drive</Text>
                </View>
                <View style={styles.routeStat}>
                  <Text style={styles.routeValue}>{walkTime}</Text>
                  <Text style={styles.routeLabel}>Walk</Text>
                </View>
                <View style={styles.routeStat}>
                  <Text style={styles.routeValue}>{facility.distance || `${distanceKm} km`}</Text>
                  <Text style={styles.routeLabel}>Distance</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.8}
              style={styles.openMapsRow}
            >
              <MaterialCommunityIcons name="google-maps" size={16} color={COLORS.primary} />
              <Text style={styles.openMapsText}>OPEN IN MAPS</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).duration(340).damping(24)} style={styles.section}>
          <SectionHead
            eyebrow="Go more often"
            title="Membership plans"
            meta={`${filteredPlans.length} option${filteredPlans.length === 1 ? '' : 's'}`}
          />

          <NoticeBanner message="Visit the center reception desk to activate a membership pass and get credits loaded onto your account." />

          {facilityPlans.length > 1 && (
            <View style={styles.filterPanel}>
              {sportOptions.length > 0 && (
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>SPORT</Text>
                  <View style={styles.chipRow}>
                    {sportOptions.map((sport) => {
                      const isActive = selectedSports.includes(sport);
                      return (
                        <Pressable
                          key={sport}
                          onPress={() => toggleSport(sport)}
                          style={[styles.filterChip, isActive && styles.filterChipActive]}
                        >
                          <MaterialCommunityIcons
                            name={getActivityIcon(sport)}
                            size={13}
                            color={isActive ? COLORS.onPrimary : COLORS.primary}
                          />
                          <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                            {sport.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>VALIDITY</Text>
                <View style={styles.chipRow}>
                  {([
                    { key: 'upto1m', label: 'UP TO 1 MO' },
                    { key: '1to3m', label: '1–3 MO' },
                    { key: '3to6m', label: '3–6 MO' },
                    { key: '6plus', label: '6+ MO' },
                  ] as const).map((opt) => {
                    const isActive = selectedValidity.includes(opt.key);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => toggleValidity(opt.key)}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                      >
                        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {hasPlanFilters && (
                <Pressable
                  onPress={() => {
                    setSelectedSports([]);
                    setSelectedValidity([]);
                  }}
                  style={styles.filterClearRow}
                >
                  <Text style={styles.filterClearText}>CLEAR FILTERS</Text>
                  <Ionicons name="close" size={13} color={COLORS.primary} />
                </Pressable>
              )}
            </View>
          )}

          {loadingPlans ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
          ) : facilityPlans.length === 0 ? (
            <ArenaEmptyState
              icon="card-outline"
              title="No plans listed online"
              copy="This arena has no active membership plans right now. Check back soon or ask at reception."
            />
          ) : filteredPlans.length === 0 ? (
            <ArenaEmptyState
              icon="filter-outline"
              title="No plans match those filters"
              copy="Try a different sport or validity range."
              action={
                <Pressable
                  onPress={() => {
                    setSelectedSports([]);
                    setSelectedValidity([]);
                  }}
                  style={{ marginTop: 4 }}
                >
                  <Text style={styles.clearLink}>CLEAR FILTERS</Text>
                </Pressable>
              }
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.planRail}
              style={styles.planRailScroll}
            >
              {filteredPlans.map((plan, index) => {
                const planIcon = getActivityIcon(plan.validActivities?.[0] || facility.category);
                const subline =
                  plan.description?.trim() ||
                  (plan.validActivities?.length
                    ? plan.validActivities.slice(0, 3).join(' · ')
                    : `Valid ${plan.durationDays} days`);
                const savings =
                  plan.hasDiscount && plan.originalPrice
                    ? Math.max(0, Number(plan.originalPrice) - Number(plan.price))
                    : 0;
                const featured = index === 0;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => navigation.navigate('PlanDetail', { plan, facilityName: facility.name })}
                    activeOpacity={0.9}
                    style={[styles.planCard, featured && styles.planCardFeatured]}
                  >
                    <View style={styles.planHead}>
                      <View
                        style={[
                          styles.planTag,
                          featured && {
                            backgroundColor: COLORS.primaryMuted,
                            borderColor: COLORS.primaryBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.planTagText, featured && { color: COLORS.primary }]}>
                          {savings > 0 ? `SAVE ₹${savings}` : featured ? 'MOST POPULAR' : 'MEMBERSHIP'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={planIcon}
                        size={18}
                        color={featured ? COLORS.primary : COLORS.meta}
                      />
                    </View>

                    <Text style={styles.planName} numberOfLines={2}>
                      {plan.title}
                    </Text>
                    <Text style={styles.planSummary} numberOfLines={2}>
                      {subline}
                    </Text>

                    <View style={styles.planCreditLine}>
                      <Text style={styles.planCreditValue}>{plan.creditsGranted}</Text>
                      <Text style={styles.planCreditLabel}>CREDITS</Text>
                    </View>

                    <View style={styles.planMeta}>
                      <Text style={styles.planMetaText}>{plan.durationDays} days</Text>
                      <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
                    </View>

                    <View style={[styles.planView, featured && styles.planViewFeatured]}>
                      <Text style={[styles.planViewText, featured && { color: COLORS.onPrimary }]}>
                        VIEW PASS
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={featured ? COLORS.onPrimary : COLORS.paper}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.accessNote}>
            Plans work across participating ULTIM venues. Credits are deducted at booking.
          </Text>
        </Animated.View>
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
  openChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  openChipText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  gallery: {
    gap: 8,
  },
  galleryFrame: {
    width: GALLERY_WIDTH,
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    borderRadius: RADIUS.panel,
    backgroundColor: COLORS.surfaceBright,
  },
  carouselSlide: {
    width: GALLERY_WIDTH,
    height: GALLERY_WIDTH * 0.75,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderHeroText: {
    color: COLORS.meta,
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  galleryCount: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(10,11,13,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  galleryCountText: {
    color: COLORS.paper,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  galleryArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,11,13,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    flex: 1,
    aspectRatio: 16 / 10,
    overflow: 'hidden',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surfaceBright,
  },
  thumbActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  venueBlock: {
    marginTop: 22,
  },
  venueHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  venueName: {
    flex: 1,
    marginTop: 5,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 37,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
  },
  venueRatingText: {
    color: COLORS.paper,
    fontFamily: FONTS.extraBold,
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  addressText: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  factPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
  },
  factText: {
    color: COLORS.paperDim,
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
  },
  description: {
    marginTop: 16,
    color: COLORS.paperDim,
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  amenityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  amenityText: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    lineHeight: 13,
  },
  section: {
    marginTop: 30,
  },
  mapCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.panel,
    backgroundColor: COLORS.surface,
  },
  mapCanvas: {
    height: 150,
    backgroundColor: '#101410',
  },
  mapWebview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#101410',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  mapFallbackText: {
    color: COLORS.paperDim,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  mapFallbackHint: {
    color: COLORS.meta,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  filterPanel: {
    gap: 12,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.9,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceBright,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: COLORS.onPrimary,
  },
  filterClearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    minHeight: 32,
  },
  filterClearText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  clearLink: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  locationBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  locationAddress: {
    color: COLORS.paperDim,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  directionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  directionsToggleText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  routePanel: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  routeStat: {
    flex: 1,
    gap: 3,
    padding: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceBright,
  },
  routeValue: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 23,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  routeLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  openMapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  openMapsText: {
    flex: 1,
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  planRailScroll: {
    marginHorizontal: -SPACING.containerPadding,
  },
  planRail: {
    gap: 12,
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 4,
  },
  planCard: {
    width: 284,
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  planCardFeatured: {
    borderColor: 'rgba(255,106,26,0.64)',
    backgroundColor: '#17110D',
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
  },
  planTagText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 10,
    letterSpacing: 0.7,
  },
  planName: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 29,
    lineHeight: 27,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  planSummary: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  planCreditLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  planCreditValue: {
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 38,
    letterSpacing: 0.3,
  },
  planCreditLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planMetaText: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 10,
  },
  planPrice: {
    color: COLORS.paper,
    fontFamily: FONTS.extraBold,
    fontSize: 14,
  },
  planView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    marginTop: 2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
  },
  planViewFeatured: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  planViewText: {
    color: COLORS.paper,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  accessNote: {
    marginTop: 12,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
});
