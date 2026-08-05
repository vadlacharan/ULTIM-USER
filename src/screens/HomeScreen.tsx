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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { Header } from '../components/Header';
import { FacilityCard } from '../components/FacilityCard';
import { StatusBadge } from '../components/StatusBadge';
import { CreditIcon } from '../components/CreditIcon';
import { NoticeBanner } from '../components/NoticeBanner';
import { GradientButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { CategoryType, Facility } from '../types';

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

  const formatSessionDate = (dateStr: string): string => {
    if (dateStr === 'Today' || dateStr === 'Tomorrow') return dateStr;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parsed.getDate()} ${months[parsed.getMonth()]}`;
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
      <Header onNotificationPress={() => navigation.navigate('Notifications')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
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
            style={[styles.authBanner, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}
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

        {/* Today's Active Session Banner if any */}
        {isAuthenticated && todayBookings.length > 0 && (
          <View style={styles.todaySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>UPCOMING SESSION</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingsTab')}>
                <Text style={styles.seeAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.todayCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}
              onPress={() => navigation.navigate('BookingsTab')}
              activeOpacity={0.92}
            >
              {/* Left accent bar */}
              <View style={styles.todayAccentBar} />

              <View style={styles.todayInner}>
                {/* Top row: sport badge + date/time */}
                <View style={styles.todayTopRow}>
                  <StatusBadge label={todayBookings[0].sportType} type="active" />
                  <View style={styles.todayTimePill}>
                    <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.todayTimeText}>
                      {formatSessionDate(todayBookings[0].dateStr)} · {todayBookings[0].timeSlotLabel}
                    </Text>
                  </View>
                </View>

                {/* Facility identity row: thumbnail + name/address */}
                <View style={styles.todayBodyRow}>
                  <View style={styles.todayInfoCol}>
                    <Text style={[styles.todayFacility, { color: colors.onSurface }]} numberOfLines={1}>
                      {todayBookings[0].facilityName}
                    </Text>
                    <View style={styles.todayCourtRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={[styles.todayCourt, { color: colors.textMuted }]} numberOfLines={1}>
                        {todayBookings[0].courtName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom CTA */}
                <View style={[styles.todayActionRow, { borderTopColor: colors.surfaceHigh }]}>
                  <View style={styles.todayCreditsChip}>
                    <CreditIcon size={13} />
                    <Text style={styles.todayCreditsText}>{todayBookings[0].creditsSpent} credits</Text>
                  </View>
                  <GradientButton
                    label="Check-In QR"
                    icon="qr-code-outline"
                    onPress={() => navigation.navigate('BookingsTab')}
                    compact
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Facilities Near Me - Top 5 Nearest */}
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
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}>
            <Ionicons name="business-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Facilities Available</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              No sports or fitness centers found near your current location.
            </Text>
          </View>
        ) : (
          nearestFacilities.map((facility: Facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onPress={() => navigation.navigate('FacilityDetail', { facilityId: facility.id })}
            />
          ))
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
    backgroundColor: 'rgba(255,87,34,0.06)',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,87,34,0.18)',
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
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
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
    backgroundColor: 'rgba(19,19,18,0.22)',
  },
  selectedCatGradient: {
    backgroundColor: 'rgba(255,87,34,0.4)',
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
  // ── Upcoming session card ──
  todaySection: {
    marginBottom: 20,
  },
  todayCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  todayAccentBar: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.xl,
    borderBottomLeftRadius: RADIUS.xl,
  },
  todayInner: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  todayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,87,34,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,87,34,0.25)',
  },
  todayTimeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  todayBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayThumb: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLow,
  },
  todayThumbFallback: {
    backgroundColor: 'rgba(255,87,34,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayInfoCol: {
    flex: 1,
    gap: 4,
  },
  todayFacility: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  todayCourtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayCourt: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  todayActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceHigh,
  },
  todayCreditsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  todayCreditsText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },
  // ── Facilities section ──
  facilitiesSection: {
    marginTop: 4,
  },
  // ── Error / Empty / Loading ──
  errorCard: {
    backgroundColor: COLORS.surfaceContainer,
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
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
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
