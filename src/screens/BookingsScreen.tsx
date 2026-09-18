import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { BlurHeader, useBlurHeaderLayout } from '../components/Blur';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { QRCodeModal } from '../components/QRCodeModal';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { api } from '../services/api';
import { Booking } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BookingTab = 'UPCOMING' | 'PAST';
const TABS: BookingTab[] = ['UPCOMING', 'PAST'];

export const BookingsScreen: React.FC = () => {
  const { bookings, refreshData, colors } = useApp();
  // 44 extra = 8px gap + ~36px sub-tab row floating inside the blur header
  const { top: headerTop, height: headerHeight } = useBlurHeaderLayout(44);
  const tabBarClearance = useTabBarClearance();

  const [activeSubTab, setActiveSubTab] = useState<BookingTab>('UPCOMING');
  const [selectedBookingForQR, setSelectedBookingForQR] = useState<Booking | null>(null);
  const [loadingQRId, setLoadingQRId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const pagerRef = useRef<ScrollView>(null);
  // Drives the sliding tab-pill indicator directly off the native scroll
  // position (native driver) so it tracks the finger 1:1 while dragging,
  // instead of only updating once the swipe settles.
  const scrollX = useRef(new Animated.Value(0)).current;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const hasValue = (value?: string | null) => !!String(value || '').trim();

  const getBookingDateISO = (booking: Booking) => {
    if (booking.dateStr === 'Today') {
      return new Date().toISOString().split('T')[0];
    }
    return booking.dateStr;
  };

  const getBookingQrMode = (booking: Booking): 'CHECK_IN' | 'CHECK_OUT' => {
    return hasValue(booking.successfulCheckedInTime) ? 'CHECK_OUT' : 'CHECK_IN';
  };

  const getBookingTab = (booking: Booking): BookingTab => {
    if (booking.status === 'CANCELLED') return 'PAST';

    const todayISO = new Date().toISOString().split('T')[0];
    const bookingDateISO = getBookingDateISO(booking);
    const hasCheckedIn = hasValue(booking.successfulCheckedInTime);
    const hasCheckedOut = hasValue(booking.successfulCheckedOutTime);

    if (bookingDateISO < todayISO) return 'PAST';
    if (bookingDateISO > todayISO) return 'UPCOMING';
    if (hasCheckedIn && hasCheckedOut) return 'PAST';
    return 'UPCOMING';
  };

  const upcomingBookings = bookings.filter((b) => getBookingTab(b) === 'UPCOMING');
  const pastBookings = bookings.filter((b) => getBookingTab(b) === 'PAST');

  const goToTab = (tab: BookingTab, animated: boolean = true) => {
    setActiveSubTab(tab);
    pagerRef.current?.scrollTo({ x: TABS.indexOf(tab) * SCREEN_WIDTH, animated });
  };

  // Fires continuously while dragging (not just on release) so the active
  // tab's text color flips in sync with the pill crossing the midpoint.
  const handlePagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const tab = TABS[page] ?? TABS[0];
    setActiveSubTab((prev) => (prev === tab ? prev : tab));
  };

  const pillWidth = (SCREEN_WIDTH - SPACING.containerPadding * 2) / TABS.length;
  const pillTranslate = scrollX.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [0, pillWidth],
    extrapolate: 'clamp',
  });

  const handleOpenQR = async (booking: Booking, qrMode: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      setLoadingQRId(`${booking.id}-${qrMode}`);
      const res = await api.generateBookingQr(booking.id);
      if (res?.token) {
        setSelectedBookingForQR({
          ...booking,
          qrCodePayload: res.token,
          qrMode,
        });
        return;
      }
    } catch (e) {
      console.log('[QR Generator] Using booking QR payload:', e);
    } finally {
      setLoadingQRId(null);
    }
    setSelectedBookingForQR({
      ...booking,
      qrMode,
    });
  };

  const renderBookingCard = (booking: Booking) => {
    const qrMode = getBookingQrMode(booking);
    const isUpcoming = getBookingTab(booking) === 'UPCOMING';

    return (
      <View
        key={booking.id}
        style={[
          styles.bookingCard,
          { backgroundColor: colors.glass, borderColor: colors.glassBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerDetails}>
            <Text style={[styles.facilityName, { color: colors.onSurface }]} numberOfLines={1}>
              {booking.facilityName}
            </Text>
            <Text style={[styles.sportCourt, { color: colors.textMuted }]}>
              {booking.sportType} • {booking.courtName}
            </Text>
          </View>
        </View>

        <View style={[styles.slotDetailRow, { backgroundColor: colors.glassHigh }]}>
          <View style={styles.slotCol}>
            <Text style={[styles.slotDetailText, { color: colors.onSurface }]}>{booking.dateStr}</Text>
          </View>

          <View style={styles.slotCol}>
            <Text style={[styles.slotDetailText, { color: colors.onSurface }]}>{booking.timeSlotLabel}</Text>
          </View>

          <View style={styles.slotCol}>
            <CreditIcon size={20} />
            <Text style={[styles.slotDetailText, { color: colors.onSurface, marginLeft: 4 }]}>
              {booking.creditsSpent}
            </Text>
          </View>
        </View>

        {isUpcoming && (
          <View style={styles.cardActions}>
            <GradientButton
              label={qrMode === 'CHECK_OUT' ? 'VIEW CHECK-OUT QR' : 'VIEW CHECK-IN QR'}
              icon="qr-code-sharp"
              variant={qrMode === 'CHECK_OUT' ? 'success' : 'primary'}
              onPress={() => handleOpenQR(booking, qrMode)}
              loading={loadingQRId === `${booking.id}-${qrMode}`}
              fullWidth
            />
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = (tab: BookingTab) => (
    <View style={[styles.emptyCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No {tab === 'UPCOMING' ? 'upcoming' : 'past'} bookings
      </Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        {tab === 'UPCOMING'
          ? 'Book a court or gym slot using your active center credits from the Access tab.'
          : 'Your completed and cancelled sessions will show up here.'}
      </Text>
    </View>
  );

  const renderPage = (tab: BookingTab) => {
    const list = tab === 'UPCOMING' ? upcomingBookings : pastBookings;
    return (
      <View style={[styles.pagerPage, { width: SCREEN_WIDTH }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerHeight + 24, paddingBottom: tabBarClearance + 16 },
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
          {list.length === 0 ? renderEmptyState(tab) : list.map(renderBookingCard)}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      {/* Swipeable pager — switch tabs with a horizontal swipe gesture */}
      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handlePagerScroll }
        )}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {TABS.map((tab) => (
          <React.Fragment key={tab}>{renderPage(tab)}</React.Fragment>
        ))}
      </Animated.ScrollView>

      {/* Floating blur header (title + sub-tabs) — pages scroll behind it */}
      <BlurHeader height={headerHeight} contentStyle={{ paddingTop: headerTop, paddingHorizontal: SPACING.containerPadding }}>
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>
          My Sessions & <Text style={{ color: colors.primary }}>QR Passes</Text>
        </Text>

        {/* Sub-Navigation Tabs — a sliding underline tracks the pager 1:1 while dragging */}
        <View style={[styles.subTabNav, { marginTop: 8 }]}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} style={styles.subTabBtn} onPress={() => goToTab(tab)} activeOpacity={0.7}>
              <Text
                style={[
                  styles.subTabBtnText,
                  { color: activeSubTab === tab ? colors.primary : colors.textMuted },
                  activeSubTab === tab && styles.subTabBtnTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[
              styles.subTabIndicator,
              {
                width: pillWidth,
                backgroundColor: colors.primary,
                transform: [{ translateX: pillTranslate }],
              },
            ]}
          />
        </View>
      </BlurHeader>

      {/* Dynamic QR Modal */}
      <QRCodeModal
        key={selectedBookingForQR ? selectedBookingForQR.id : 'qr-modal-closed'}
        visible={!!selectedBookingForQR}
        booking={selectedBookingForQR}
        onClose={() => setSelectedBookingForQR(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,10,14,0.88)',
  },
  topBarTitle: {
    fontSize: 21,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
    lineHeight: 26,
    color: COLORS.onSurface,
  },
  subTabNav: {
    flexDirection: 'row',
    position: 'relative',
  },
  subTabIndicator: {
    position: 'absolute',
    left: 0,
    bottom: -1,
    height: 3,
    borderRadius: RADIUS.full,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subTabBtnText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  subTabBtnTextActive: {
    fontFamily: FONTS.extraBold,
  },
  pager: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  bookingCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.cardGap,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDetails: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
  },
  sportCourt: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glassHigh,
    borderRadius: RADIUS.lg,
    padding: 10,
    marginTop: SPACING.sm,
  },
  slotCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotDetailText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.onSurface,
    marginLeft: 4,
  },
  cardActions: {
    marginTop: SPACING.sm,
  },
  emptyCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
