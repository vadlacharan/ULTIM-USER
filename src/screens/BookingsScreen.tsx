import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { BlurHeader, useBlurHeaderLayout } from '../components/Blur';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { QRCodeModal } from '../components/QRCodeModal';
import { CreditIcon } from '../components/CreditIcon';
import { GradientButton, OutlineButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { api } from '../services/api';
import { Booking } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BookingTab = 'UPCOMING' | 'PAST';
const TABS: BookingTab[] = ['UPCOMING', 'PAST'];

export const BookingsScreen: React.FC = () => {
  const { bookings, refreshData, refreshBookingsAndPasses, colors } = useApp();
  // 44 extra = 8px gap + ~36px sub-tab row floating inside the blur header
  const { top: headerTop, height: headerHeight } = useBlurHeaderLayout(44);
  const tabBarClearance = useTabBarClearance();

  const [activeSubTab, setActiveSubTab] = useState<BookingTab>('UPCOMING');
  const [selectedBookingForQR, setSelectedBookingForQR] = useState<Booking | null>(null);
  const [loadingQRId, setLoadingQRId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
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

  // Fires once per settle (not per-frame) — per-frame setState here
  // re-rendered the whole pager at 60fps and dropped frames on Android.
  const handlePagerMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel session',
      `Cancel ${booking.sportType} at ${booking.facilityName} on ${booking.dateStr}? The credits will be refunded to your pass.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'CANCEL SESSION',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(booking.id);
              const res = await api.cancelBooking(booking.id);
              await refreshBookingsAndPasses();
              Alert.alert(
                'Booking cancelled',
                res?.refundedCredits
                  ? `${res.refundedCredits} credits have been refunded to your pass.`
                  : 'Your session has been cancelled.',
              );
            } catch (e: any) {
              Alert.alert(
                'Could not cancel',
                e?.message || 'Please try again or ask the center reception desk.',
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

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

  const renderBookingCard = (booking: Booking, index = 0) => {
    const qrMode = getBookingQrMode(booking);
    const isUpcoming = getBookingTab(booking) === 'UPCOMING';
    const isCancelled = booking.status === 'CANCELLED';
    const checkedIn = !!String(booking.successfulCheckedInTime || '').trim();

    return (
      <Reanimated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(340).damping(24)}>
      <View
        key={booking.id}
        style={[
          styles.bookingCard,
          isCancelled && styles.bookingCardCancelled,
        ]}
      >
        {/* ── Top row: status + credits ── */}
        <View style={styles.ticketTopRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isCancelled
                  ? 'rgba(255,255,255,0.06)'
                  : checkedIn
                    ? 'rgba(52,211,153,0.12)'
                    : 'rgba(255,90,31,0.12)',
                borderColor: isCancelled
                  ? 'rgba(255,255,255,0.12)'
                  : checkedIn
                    ? 'rgba(52,211,153,0.35)'
                    : 'rgba(255,90,31,0.35)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isCancelled
                    ? colors.textMuted
                    : checkedIn
                      ? COLORS.success
                      : colors.primary,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isCancelled
                    ? colors.textMuted
                    : checkedIn
                      ? COLORS.success
                      : colors.primary,
                },
              ]}
            >
              {isCancelled ? 'CANCELLED' : checkedIn ? 'CHECKED IN' : 'UPCOMING'}
            </Text>
          </View>
          <View style={styles.creditsPill}>
            <CreditIcon size={15} />
            <Text style={[styles.creditsPillText, { color: colors.secondary }]}>
              {booking.creditsSpent}
            </Text>
          </View>
        </View>

        {/* ── Identity ── */}
        <Text style={[styles.facilityName, { color: colors.onSurface }]} numberOfLines={1}>
          {booking.facilityName}
        </Text>
        <Text style={[styles.sportCourt, { color: colors.textMuted }]} numberOfLines={1}>
          {(booking.sportType || '').toUpperCase()} • {booking.courtName}
        </Text>

        {/* ── Perforation divider ── */}
        <View style={styles.perforation}>
          <View style={[styles.notch, styles.notchLeft, { backgroundColor: colors.background }]} />
          <View style={styles.dashedLine} />
          <View style={[styles.notch, styles.notchRight, { backgroundColor: colors.background }]} />
        </View>

        {/* ── Slot strip ── */}
        <View style={styles.slotStrip}>
          <View style={styles.slotCell}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={[styles.slotDetailText, { color: colors.onSurface }]}>{booking.dateStr}</Text>
          </View>
          <View style={styles.slotCell}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={[styles.slotDetailText, { color: colors.onSurface }]}>{booking.timeSlotLabel}</Text>
          </View>
        </View>

        {isUpcoming && (
          <View style={[styles.cardActions, styles.cardActionsStack]}>
            <GradientButton
              label={qrMode === 'CHECK_OUT' ? 'VIEW CHECK-OUT QR' : 'VIEW CHECK-IN QR'}
              icon="qr-code-sharp"
              variant={qrMode === 'CHECK_OUT' ? 'success' : 'primary'}
              onPress={() => handleOpenQR(booking, qrMode)}
              loading={loadingQRId === `${booking.id}-${qrMode}`}
              fullWidth
            />
            {!booking.successfulCheckedInTime && (
              <OutlineButton
                label={cancellingId === booking.id ? 'CANCELLING…' : 'CANCEL SESSION'}
                icon="close-circle-outline"
                color={COLORS.error}
                onPress={() => handleCancelBooking(booking)}
                disabled={cancellingId === booking.id}
                fullWidth
                compact
              />
            )}
          </View>
        )}
      </View>
      </Reanimated.View>
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
          {list.length === 0 ? renderEmptyState(tab) : list.map((b, i) => renderBookingCard(b, i))}
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
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handlePagerMomentumEnd}
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
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.cardGap,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  bookingCardCancelled: {
    opacity: 0.72,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    letterSpacing: 1.2,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(233,181,76,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(233,181,76,0.30)',
  },
  creditsPillText: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
  },
  perforation: {
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 12,
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  dashedLine: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  notch: {
    position: 'absolute',
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  notchLeft: {
    left: -SPACING.md - 9,
  },
  notchRight: {
    right: -SPACING.md - 9,
  },
  slotStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  slotCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222226',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
  cardActionsStack: {
    gap: 10,
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
