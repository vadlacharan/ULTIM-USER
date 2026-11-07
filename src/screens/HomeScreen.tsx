import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { Header, useHeaderLayout } from '../components/Header';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { FacilityCard } from '../components/FacilityCard';
import { CreditIcon } from '../components/CreditIcon';
import { SessionNowBar } from '../components/SessionNowBar';
import { QRCodeModal } from '../components/QRCodeModal';
import { api } from '../services/api';
import { NoticeBanner } from '../components/NoticeBanner';
import { GradientButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { ArenaEmptyState, SectionHead } from '../components/ArenaUI';
import { Booking, CategoryType, Facility } from '../types';

const RAIL_CARD_WIDTH = Math.min(252, Math.round(Dimensions.get('window').width * 0.646));

const ACTIVITY_FALLBACKS: Record<string, any> = {
  Fitness: require('../../assets/arena/category-fitness.jpg'),
  Sports: require('../../assets/arena/category-sports.jpg'),
  Sport: require('../../assets/arena/category-sports.jpg'),
  Health: require('../../assets/arena/category-health.jpg'),
};

const ACTIVITY_IMAGES: Array<{ match: RegExp; image: any }> = [
  { match: /badminton/i, image: require('../../assets/arena/activity-badminton.jpg') },
  { match: /cricket/i, image: require('../../assets/arena/activity-cricket.jpg') },
  { match: /pickleball/i, image: require('../../assets/arena/activity-pickleball.jpg') },
  { match: /football|soccer|turf/i, image: require('../../assets/arena/facility-football.jpg') },
  { match: /yoga|recovery|stretch/i, image: require('../../assets/arena/facility-yoga.jpg') },
  { match: /gym|fitness|strength/i, image: require('../../assets/arena/category-fitness.jpg') },
];

interface HomeScreenProps {
  navigation: any;
}

type CategoryCard = { label: CategoryType; title: string; note: string; image: any };

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    facilities,
    bookings,
    currentLocation,
    isAuthenticated,
    user,
    isLoading,
    isOffline,
    facilityError,
    refreshData,
    colors,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { height: headerHeight } = useHeaderLayout();
  const tabBarClearance = useTabBarClearance();
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [loadingQrId, setLoadingQrId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  // Filter and sort facilities strictly by distance ascending (top 5 closest)
  const nearestFacilities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = facilities.filter((f) => {
      if (selectedCategory !== 'All') {
        const catA = (f.category || '').toLowerCase();
        const catB = selectedCategory.toLowerCase();
        const catOk =
          catA.startsWith('sport') && catB.startsWith('sport') ? true : catA === catB;
        if (!catOk) return false;
      }
      if (q) {
        return (
          f.name.toLowerCase().includes(q) ||
          (f.address || '').toLowerCase().includes(q) ||
          (f.category || '').toLowerCase().includes(q) ||
          (f.sportTags || []).join(' ').toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list]
      .sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999))
      .slice(0, 5);
  }, [facilities, selectedCategory, searchQuery]);

  const todayBookings = useMemo(
    () => bookings.filter((b) => b.status === 'UPCOMING'),
    [bookings]
  );

  const featuredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return facilities
      .filter((f) => {
        if (!q) return true;
        const haystack = [f.name, f.category, ...(f.sportTags || [])].join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 4)
      .map((f) => ({
        facility: f,
        title: (f.sportTags && f.sportTags[0]) || f.category || 'Arena session',
        kicker: `${f.category || 'Arena'} / ${(f.sportTags && f.sportTags[0]) || 'Play'}`,
      }));
  }, [facilities, searchQuery]);

  // Open the check-in/check-out QR pass straight from the floating session bar.
  const openBookingQr = useCallback(
    async (booking: Booking) => {
      const qrMode: 'CHECK_IN' | 'CHECK_OUT' = booking.successfulCheckedInTime
        ? 'CHECK_OUT'
        : 'CHECK_IN';
      try {
        setLoadingQrId(booking.id);
        const res = await api.generateBookingQr(booking.id);
        if (res?.token) {
          setQrBooking({ ...booking, qrCodePayload: res.token, qrMode });
          return;
        }
      } catch (e) {
        console.log('[Home QR] Falling back to stored booking payload:', e);
      } finally {
        setLoadingQrId(null);
      }
      setQrBooking({ ...booking, qrMode });
    },
    []
  );

  const categoryCards: CategoryCard[] = useMemo(
    () => [
      { label: 'Fitness', title: 'FITNESS', note: 'TRAIN', image: require('../../assets/arena/category-fitness.jpg') },
      { label: 'Sports', title: 'SPORTS', note: 'PLAY', image: require('../../assets/arena/category-sports.jpg') },
      { label: 'Health', title: 'HEALTH', note: 'RECOVER', image: require('../../assets/arena/category-health.jpg') },
    ],
    []
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of facilities) {
      const cat = (f.category || '').toLowerCase();
      for (const c of categoryCards) {
        const key = c.label.toLowerCase();
        if (cat === key || (key === 'sports' && cat.startsWith('sport'))) {
          counts[c.label] = (counts[c.label] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [facilities, categoryCards]);

  const openFacility = useCallback(
    (id: string) => navigation.navigate('FacilityDetail', { facilityId: id }),
    [navigation]
  );

  const openCategory = useCallback(
    (cat: CategoryCard) =>
      navigation.navigate('CategoryFacilities', {
        category: cat.label,
        categoryTitle: cat.title,
      }),
    [navigation]
  );

  const renderRailItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Facility>) => (
      <FacilityCard
        facility={item}
        width={RAIL_CARD_WIDTH}
        index={index}
        onPress={() => openFacility(item.id)}
      />
    ),
    [openFacility]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + 4,
            paddingBottom: tabBarClearance + (todayBookings.length > 0 ? 82 : 12),
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            progressViewOffset={headerHeight}
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── HERO ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(320)}>
          <View style={styles.hero}>
            <View style={styles.locationLine}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {currentLocation || 'Koramangala, Bengaluru'}
              </Text>
            </View>
            {isAuthenticated && user?.name ? (
              <>
                <Text style={styles.heroTitle}>
                  Welcome,{'\n'}
                  <Text style={styles.heroAccent}>
                    {user.name.trim().split(/\s+/)[0]}.
                  </Text>
                </Text>
                <Text style={styles.heroSub}>Ready when you are — pick your next game.</Text>
              </>
            ) : (
              <>
                <Text style={styles.heroTitle}>
                  Find your{'\n'}
                  <Text style={styles.heroAccent}>next game.</Text>
                </Text>
                <Text style={styles.heroSub}>Book turfs, courts and studios around you.</Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* ── SEARCH ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).duration(320).damping(24)}>
          <View style={[styles.searchShell, searchFocused && styles.searchShellFocused]}>
            <Ionicons name="search" size={19} color={COLORS.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search turf, court or class"
              placeholderTextColor={COLORS.meta}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12} style={styles.clearBtn}>
                <Ionicons name="close" size={17} color={COLORS.muted} />
              </TouchableOpacity>
            )}
            <View style={styles.searchSubmit}>
              <Ionicons name="arrow-forward" size={19} color={COLORS.onPrimary} />
            </View>
          </View>
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchFeedback}>
              <Text style={styles.searchFeedbackText}>
                <Text style={styles.searchFeedbackStrong}>{nearestFacilities.length}</Text>{' '}
                {nearestFacilities.length === 1 ? 'arena' : 'arenas'} match “{searchQuery.trim()}”
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={styles.feedbackClear}>CLEAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {isOffline && (
          <NoticeBanner message="NO INTERNET: Showing saved cached data. Pull down to retry connection." />
        )}

        {!isAuthenticated && (
          <Animated.View entering={FadeInDown.delay(80).duration(320).damping(24)}>
            <Pressable
              onPress={() => navigation.navigate('SignIn')}
              style={({ pressed }) => [styles.signInBanner, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.signInIcon}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.signInCopy}>
                <Text style={styles.signInTitle}>Sign in to ULTIM</Text>
                <Text style={styles.signInSub}>Access member passes and book sessions.</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── CATEGORIES ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(340).damping(24)}>
          <View style={styles.section}>
            <SectionHead
              eyebrow="Train. Play. Recover."
              title="Choose your arena"
              meta={`${facilities.length} ${facilities.length === 1 ? 'center' : 'centers'}`}
            />
            <View style={styles.categoryGrid}>
              {categoryCards.map((cat) => (
                <Pressable
                  key={cat.label}
                  onPress={() => openCategory(cat)}
                  style={({ pressed }) => [styles.categoryCard, pressed && { opacity: 0.86 }]}
                >
                  <View style={styles.categoryMedia}>
                    <Image
                      source={cat.image}
                      style={styles.categoryImage}
                      contentFit="cover"
                      transition={220}
                      cachePolicy="memory-disk"
                    />
                  </View>
                  <View style={styles.categoryCopy}>
                    <Text style={styles.categoryName}>{cat.title}</Text>
                    <Text style={styles.categoryNote}>
                      {cat.note} · {categoryCounts[cat.label] ?? 0}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── NEARBY ARENAS ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(150).duration(340).damping(24)}>
          <View style={styles.section}>
            <SectionHead
              eyebrow="Around you"
              title={selectedCategory === 'All' ? 'Nearby arenas' : `Nearby ${selectedCategory}`}
              meta={`${nearestFacilities.length} ${nearestFacilities.length === 1 ? 'place' : 'places'}`}
            />

            {facilityError ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={26} color={COLORS.error} />
                <Text style={styles.errorTitle}>Facility data error</Text>
                <Text style={styles.errorSub}>{facilityError}</Text>
                <GradientButton
                  label="Retry API fetch"
                  icon="refresh"
                  onPress={refreshData}
                  style={styles.retryBtn}
                  compact
                />
              </View>
            ) : isLoading && !refreshing ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 36 }} />
            ) : nearestFacilities.length === 0 ? (
              <ArenaEmptyState
                icon="business-outline"
                title="No arenas found"
                copy={
                  searchQuery
                    ? `Nothing matches “${searchQuery}” nearby. Try another search.`
                    : 'No sports or fitness centers found near your current location.'
                }
                action={
                  (searchQuery || selectedCategory !== 'All') && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      style={{ marginTop: 4 }}
                    >
                      <Text style={styles.resetLink}>RESET FILTERS</Text>
                    </TouchableOpacity>
                  )
                }
              />
            ) : (
              <FlatList
                data={nearestFacilities}
                keyExtractor={(item) => item.id}
                renderItem={renderRailItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={RAIL_CARD_WIDTH + 12}
                decelerationRate="fast"
                snapToAlignment="start"
                contentContainerStyle={styles.railContent}
                style={styles.facilitiesRail}
                removeClippedSubviews
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
                getItemLayout={(_, index) => ({
                  length: RAIL_CARD_WIDTH + 12,
                  offset: (RAIL_CARD_WIDTH + 12) * index,
                  index,
                })}
              />
            )}

            {nearestFacilities.length > 0 && (
              <Pressable
                onPress={() =>
                  navigation.navigate('CategoryFacilities', {
                    category: selectedCategory,
                    categoryTitle:
                      selectedCategory === 'All' ? 'All Centers' : selectedCategory.toUpperCase(),
                  })
                }
                style={({ pressed }) => [styles.viewAllRow, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.viewAllText}>VIEW ALL CENTERS</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── FEATURED ACTIVITIES ──────────────────────────────── */}
        {featuredActivities.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(340).damping(24)}>
            <View style={styles.section}>
              <SectionHead
                eyebrow="Worth a slot"
                title="Featured activities"
                meta={`${featuredActivities.length} ${featuredActivities.length === 1 ? 'pick' : 'picks'}`}
              />
              <View style={styles.activitiesGrid}>
                {featuredActivities.map(({ facility, title, kicker }) => {
                  const uri =
                    (facility.images && facility.images[0]) || facility.imageUrl || '';
                  const activityArt =
                    ACTIVITY_IMAGES.find((entry) => entry.match.test(title))?.image;
                  return (
                    <Pressable
                      key={`${facility.id}-activity`}
                      onPress={() => openFacility(facility.id)}
                      style={({ pressed }) => [
                        styles.activityCard,
                        featuredActivities.length === 1 && { width: '100%' },
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <View style={styles.activityMedia}>
                        <Image
                          source={
                            activityArt ||
                            (uri
                              ? { uri }
                              : ACTIVITY_FALLBACKS[facility.category] || ACTIVITY_FALLBACKS.Sports)
                          }
                          style={styles.activityImage}
                          contentFit="cover"
                          transition={220}
                          cachePolicy="memory-disk"
                        />
                      </View>
                      <View style={styles.activityBody}>
                        <Text style={styles.activityKicker}>{kicker}</Text>
                        <Text style={styles.activityName} numberOfLines={2}>
                          {title}
                        </Text>
                        <Text style={styles.activityMeta} numberOfLines={1}>
                          {facility.name}
                        </Text>
                        <View style={styles.activityFooter}>
                          <Text style={styles.activityDistance}>
                            {facility.distance && facility.distance !== 'Distance N/A'
                              ? facility.distance
                              : 'Nearby'}
                          </Text>
                          <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Next session — floating "now playing" bar above the tab bar */}
      {isAuthenticated && todayBookings.length > 0 && (
        <SessionNowBar
          booking={todayBookings[0]}
          loading={loadingQrId === todayBookings[0].id}
          onQrPress={() => openBookingQr(todayBookings[0])}
        />
      )}

      {/* QR pass for the next session */}
      <QRCodeModal
        key={qrBooking ? qrBooking.id : 'home-qr-closed'}
        visible={!!qrBooking}
        booking={qrBooking}
        onClose={() => setQrBooking(null)}
      />

      {/* Floating arena header — screens scroll behind it */}
      <Header
        onNotificationPress={() => navigation.navigate('Notifications')}
        onCreditsPress={() => navigation.navigate('AccessTab')}
        onSignInPress={() => navigation.navigate('SignIn')}
      />
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
  hero: {
    paddingTop: 26,
    paddingBottom: 0,
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flexShrink: 1,
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 53,
    lineHeight: 48,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroAccent: {
    color: COLORS.primary,
  },
  heroSub: {
    maxWidth: 300,
    marginTop: 12,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 60,
    marginTop: 24,
    paddingLeft: 16,
    paddingRight: 7,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  searchShellFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    fontSize: 15,
    lineHeight: 20,
  },
  clearBtn: {
    padding: 6,
  },
  searchSubmit: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  searchFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
    paddingTop: 7,
  },
  searchFeedbackText: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  searchFeedbackStrong: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
  },
  feedbackClear: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  signInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  signInIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInCopy: {
    flex: 1,
  },
  signInTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  signInSub: {
    marginTop: 1,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    marginTop: 32,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: 0,
  },
  categoryMedia: {
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceBright,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryCopy: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  categoryName: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 21,
    lineHeight: 22,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  categoryNote: {
    marginTop: 2,
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  facilitiesRail: {
    marginHorizontal: -SPACING.containerPadding,
    overflow: 'visible',
  },
  railContent: {
    paddingLeft: SPACING.containerPadding,
    paddingRight: SPACING.containerPadding,
    paddingBottom: 4,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 10,
  },
  viewAllText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: '48.2%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  activityMedia: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.surfaceBright,
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activityBody: {
    flex: 1,
    padding: 12,
  },
  activityKicker: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activityName: {
    marginTop: 3,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 21,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  activityMeta: {
    marginTop: 3,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  activityDistance: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorCard: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.default,
    backgroundColor: 'rgba(243,114,127,0.05)',
  },
  errorTitle: {
    marginTop: 8,
    color: COLORS.error,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  errorSub: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
  },
  resetLink: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
});
