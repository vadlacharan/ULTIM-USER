import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Filter and sort facilities strictly by distance ascending (top 5 closest)
  const nearestFacilities = useMemo(() => {
    let list = facilities.filter((f) => {
      if (selectedCategory === 'All') return true;
      const catA = (f.category || '').toLowerCase();
      const catB = selectedCategory.toLowerCase();
      if (catA.startsWith('sport') && catB.startsWith('sport')) return true;
      return catA === catB;
    });

    list = list.sort((a, b) => {
      const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
      const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
      return distA - distB;
    });

    return list.slice(0, 5);
  }, [facilities, selectedCategory]);

  const todayBookings = bookings.filter((b) => b.status === 'UPCOMING');

  // Open the check-in/check-out QR pass straight from the floating session bar.
  const openBookingQr = async (booking: Booking) => {
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
  };

  const categoryCards: { label: CategoryType; title: string; image: any }[] = [
    {
      label: 'Fitness',
      title: 'FITNESS',
      image: require('../../assets/fitness.png'),
    },
    {
      label: 'Sports',
      title: 'SPORTS',
      image: require('../../assets/sports.png'),
    },
    {
      label: 'Health',
      title: 'HEALTH',
      image: require('../../assets/health2.png'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 26, paddingBottom: tabBarClearance + (todayBookings.length > 0 ? 88 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
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
        {/* Search Bar */}


        {/* Offline Notice Banner */}
        {isOffline && (
          <NoticeBanner message="NO INTERNET: Showing saved cached data. Pull down to retry connection." />
        )}

        {/* Auth / Credits Summary Banner */}
        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.creditSummaryBanner}
            onPress={() => navigation.navigate('AccessTab')}
            activeOpacity={0.85}
          >
            <View style={styles.creditIconBox}>
              <CreditIcon size={28} />
            </View>
            <View style={styles.creditTextCol}>
              <Text style={styles.creditTitle}>ACTIVE CREDITS</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Text style={[styles.creditVal, { color: colors.onSurface }]}>{totalActiveCredits}</Text>
                <CreditIcon size={22} />
              </View>
            </View>
            <GradientButton
              label="BOOK NOW"
              onPress={() => navigation.navigate('AccessTab')}
              compact
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.authBanner, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-circle" size={24} color={colors.secondary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.authBannerTitle, { color: colors.onSurface }]}>Sign In to ULTIM</Text>
              <Text style={[styles.authBannerSub, { color: colors.textMuted }]}>Access active membership passes & session bookings</Text>
            </View>
            <GradientButton
              label="SIGN IN"
              onPress={() => navigation.navigate('Auth')}
              compact
            />
          </TouchableOpacity>
        )}

        {/* RICH VISUAL CATEGORY IMAGE CARDS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>EXPLORE CATEGORIES</Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity onPress={() => setSelectedCategory('All')}>
              <Text style={styles.resetCatText}>SHOW ALL ({facilities.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryCardRow}>
          {categoryCards.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.catCard, isSelected && styles.selectedCatCard]}
                onPress={() => navigation.navigate('CategoryFacilities', { category: cat.label, categoryTitle: cat.title })}
                activeOpacity={0.88}
              >
                <ImageBackground
                  source={cat.image}
                  style={styles.catImage}
                  imageStyle={{ borderRadius: RADIUS.lg }}
                  resizeMode="cover"
                >
                  <View style={[styles.catGradient, isSelected && styles.selectedCatGradient]} />
                  <View style={styles.catContent}>
                    <Text style={[styles.catTitle, isSelected && styles.selectedCatTitle]}>
                      {cat.title}
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Facilities Near Me - Top 5 Nearest (horizontal rail) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'NEAR YOU' : `${selectedCategory.toUpperCase()} CENTERS`}
          </Text>
          <Text style={styles.countText}>{nearestFacilities.length} closest</Text>
        </View>

        {/* Facility API Error / Loading / Empty States */}
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
              No sports or fitness centers found near your current location.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.facilitiesRail}
            contentContainerStyle={styles.railContent}
          >
            {nearestFacilities.map((facility: Facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                width={RAIL_CARD_WIDTH}
                onPress={() => navigation.navigate('FacilityDetail', { facilityId: facility.id })}
              />
            ))}
          </ScrollView>
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
    paddingTop: 12,
    paddingBottom: SPACING.xl,
    gap: 0,
  },
  // ── Credit banner ──
  creditSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,90,31,0.06)',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,90,31,0.18)',
    marginBottom: 20,
  },
  creditIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creditTextCol: {
    flex: 1,
  },
  creditTitle: {
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  creditVal: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.onSurface,
    marginTop: 1,
  },
  // ── Auth banner ──
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 20,
  },
  authBannerTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.onSurface,
  },
  authBannerSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // ── Section headers ──
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
    letterSpacing: 1.5,
  },
  seeAllText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  resetCatText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  countText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  subText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // ── Category cards ──
  categoryCardRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  catCard: {
    width: 148,
    height: 197,
    borderRadius: RADIUS.xl,
    marginRight: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedCatCard: {},
  catImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  catGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,6,0.26)',
  },
  selectedCatGradient: {
    backgroundColor: 'rgba(255,90,31,0.4)',
  },
  catContent: {
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
  selectedCatTitle: {
    color: '#FFFFFF',
  },
  // ── Facilities rail ──
  facilitiesRail: {
    marginTop: 2,
    // Bleed the rail to the screen edges so the last card peeks out.
    marginHorizontal: -SPACING.containerPadding,
  },
  railContent: {
    paddingLeft: SPACING.containerPadding,
    paddingRight: SPACING.containerPadding,
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
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginTop: 8,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  // ── Unused search styles (kept for TS safety) ──
  searchSection: { marginBottom: 0 },
  searchBar: { flexDirection: 'row' },
  searchInput: { flex: 1 },
});
