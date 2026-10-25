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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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
import { Booking, CategoryType, Facility } from '../types';

// Near You rail cards: big, but leave a deliberate "peek" of the next card
// at the trailing edge so the scrollability is discoverable.
const RAIL_CARD_WIDTH = Math.round(Dimensions.get('window').width - 104);

interface HomeScreenProps {
  navigation: any;
}

type CategoryCard = { label: CategoryType; title: string; image: any };

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    facilities,
    bookings,
    totalActiveCredits,
    isAuthenticated,
    isLoading,
    isOffline,
    facilityError,
    refreshData,
    colors,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
          (f.category || '').toLowerCase().includes(q)
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
      { label: 'Fitness', title: 'FITNESS', image: require('../../assets/fitness.png') },
      { label: 'Sports', title: 'SPORTS', image: require('../../assets/sports.png') },
      { label: 'Health', title: 'HEALTH', image: require('../../assets/health2.png') },
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

  const renderCategoryItem = useCallback(
    ({ item: cat, index }: ListRenderItemInfo<CategoryCard>) => {
      const isSelected = selectedCategory === cat.label;
      const count = categoryCounts[cat.label] ?? 0;
      return (
        <Animated.View entering={FadeInDown.delay(90 + index * 60).duration(340).damping(24)}>
          <TouchableOpacity
            style={[styles.catCard, isSelected && styles.selectedCatCard]}
            onPress={() => openCategory(cat)}
            activeOpacity={0.88}
          >
            <Image
              source={cat.image}
              style={styles.catImage}
              contentFit="cover"
              transition={180}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['rgba(8,8,10,0)', 'rgba(8,8,10,0.55)', 'rgba(8,8,10,0.92)']}
              locations={[0.3, 0.65, 1]}
              style={styles.catScrim}
            />
            <View style={styles.catTopRow}>
              <View style={styles.catCountPill}>
                <Text style={styles.catCountText}>{count}</Text>
              </View>
            </View>
            <View style={styles.catContent}>
              <Text style={styles.catTitle}>{cat.title}</Text>
              <Text style={styles.catSub}>
                {count === 1 ? '1 CENTER' : `${count} CENTERS`}
              </Text>
            </View>
            {isSelected && <View style={styles.catSelectedRim} pointerEvents="none" />}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [selectedCategory, openCategory, categoryCounts]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + 18,
            paddingBottom: tabBarClearance + (todayBookings.length > 0 ? 88 : 16),
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
        {/* ── SEARCH PILL (Spotify 500px radius) ── */}
        <Animated.View entering={FadeIn.duration(300)}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="What do you want to train?"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.onSurface }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12}>
                <Ionicons name="close-circle" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {isOffline && (
          <NoticeBanner message="NO INTERNET: Showing saved cached data. Pull down to retry connection." />
        )}

        {/* ── CREDIT BANNER ── */}
        {isAuthenticated ? (
          <Animated.View entering={FadeInDown.delay(60).duration(340).damping(24)}>
            <TouchableOpacity
              style={styles.creditSummaryBanner}
              onPress={() => navigation.navigate('AccessTab')}
              activeOpacity={0.85}
            >
              <View style={styles.creditIconBox}>
                <CreditIcon size={26} />
              </View>
              <View style={styles.creditTextCol}>
                <Text style={styles.creditTitle}>ACTIVE CREDITS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <Text style={[styles.creditVal, { color: colors.onSurface }]}>
                    {totalActiveCredits}
                  </Text>
                  <CreditIcon size={20} />
                </View>
              </View>
              <GradientButton
                label="BOOK NOW"
                onPress={() => navigation.navigate('AccessTab')}
                compact
              />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={[styles.authBanner, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-circle" size={24} color={colors.secondary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.authBannerTitle, { color: colors.onSurface }]}>Sign In to ULTIM</Text>
              <Text style={[styles.authBannerSub, { color: colors.textMuted }]}>
                Access active membership passes & session bookings
              </Text>
            </View>
            <GradientButton label="SIGN IN" onPress={() => navigation.navigate('SignIn')} compact />
          </TouchableOpacity>
        )}

        {/* ── CATEGORY CARDS ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>EXPLORE CATEGORIES</Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity onPress={() => setSelectedCategory('All')}>
              <Text style={styles.resetCatText}>SHOW ALL ({facilities.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={categoryCards}
          keyExtractor={(c) => c.label}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
          removeClippedSubviews
          initialNumToRender={3}
          windowSize={3}
          renderItem={renderCategoryItem}
        />

        {/* ── NEAR YOU HEADER ── */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All'
              ? searchQuery
                ? 'RESULTS'
                : 'NEAR YOU'
              : `${selectedCategory.toUpperCase()} CENTERS`}
          </Text>
          <Text style={styles.countText}>{nearestFacilities.length} closest</Text>
        </View>

        {facilityError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
            <Text style={styles.errorTitle}>Facility Data Error</Text>
            <Text style={styles.errorSub}>{facilityError}</Text>
            <GradientButton
              label="RETRY API FETCH"
              icon="refresh"
              onPress={refreshData}
              style={styles.retryBtn}
              compact
            />
          </View>
        ) : isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
        ) : nearestFacilities.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Ionicons name="business-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Facilities Available</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {searchQuery
                ? `Nothing matches "${searchQuery}" nearby. Try another search.`
                : 'No sports or fitness centers found near your current location.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={nearestFacilities}
            keyExtractor={(item) => item.id}
            renderItem={renderRailItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={RAIL_CARD_WIDTH + 14}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={styles.railContent}
            style={styles.facilitiesRail}
            removeClippedSubviews
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            getItemLayout={(_, index) => ({
              length: RAIL_CARD_WIDTH + 14,
              offset: (RAIL_CARD_WIDTH + 14) * index,
              index,
            })}
          />
        )}

        {nearestFacilities.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllRow}
            onPress={() =>
              navigation.navigate('CategoryFacilities', {
                category: selectedCategory,
                categoryTitle:
                  selectedCategory === 'All' ? 'All Centers' : selectedCategory.toUpperCase(),
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>VIEW ALL CENTERS</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
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

      {/* Floating blur header — screens scroll behind it */}
      <Header onNotificationPress={() => navigation.navigate('Notifications')} />
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
  // ── Search pill (Spotify: 500px radius, icon-aware padding) ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },
  // ── Credit banner ──
  creditSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,90,31,0.06)',
    borderRadius: RADIUS.default,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,90,31,0.18)',
    marginBottom: 20,
  },
  creditIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  creditTextCol: {
    flex: 1,
  },
  creditTitle: {
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 1.6,
  },
  creditVal: {
    fontSize: 18,
    fontFamily: FONTS.black,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  // ── Auth banner ──
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  authBannerTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  authBannerSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  // ── Section headers (Spotify: 12px uppercase, silver, wide tracking) ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.6,
  },
  resetCatText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  countText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  // ── Category cards ──
  catCard: {
    width: 148,
    height: 190,
    borderRadius: RADIUS.card,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#1A1A1E',
  },
  selectedCatCard: {},
  catSelectedRim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.card,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  catTopRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  catCountPill: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: 'rgba(8,8,10,0.66)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCountText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
  },
  catContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  catTitle: {
    fontSize: 20,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  catSub: {
    fontSize: 9.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 1.4,
    marginTop: 3,
  },
  // ── Facilities rail (peek next card) ──
  facilitiesRail: {
    marginTop: 2,
    marginHorizontal: -SPACING.containerPadding,
    overflow: 'visible',
  },
  railContent: {
    paddingLeft: SPACING.containerPadding,
    paddingRight: SPACING.containerPadding,
    paddingTop: 4,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 10,
  },
  viewAllText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 1.4,
  },
  // ── Error / Empty / Loading ──
  errorCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    marginTop: 6,
  },
  errorSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 12,
  },
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
