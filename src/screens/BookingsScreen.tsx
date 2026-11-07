import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useTabBarClearance } from '../navigation/BlurTabBar';
import { QRCodeModal } from '../components/QRCodeModal';
import { CreditIcon } from '../components/CreditIcon';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { ArenaEmptyState, PageHead } from '../components/ArenaUI';
import { api } from '../services/api';
import { Booking } from '../types';
import { formatClock } from '../utils/display';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BookingTab = 'UPCOMING' | 'PAST';
const TABS: BookingTab[] = ['UPCOMING', 'PAST'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const dateParts = (dateStr: string) => {
  const source = dateStr === 'Today' ? new Date() : new Date(dateStr);
  if (isNaN(source.getTime())) {
    return { month: 'DATE', day: '--', weekday: '' };
  }
  return {
    month: MONTHS[source.getMonth()],
    day: String(source.getDate()).padStart(2, '0'),
    weekday: WEEKDAYS[source.getDay()],
  };
};

export const BookingsScreen: React.FC = () => {
  const { bookings, refreshData, refreshBookingsAndPasses, colors } = useApp();
  const insets = useSafeAreaInsets();
  const tabBarClearance = useTabBarClearance();

  const [activeSubTab, setActiveSubTab] = useState<BookingTab>('UPCOMING');
  const [selectedBookingForQR, setSelectedBookingForQR] = useState<Booking | null>(null);
  const [loadingQRId, setLoadingQRId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const pagerRef = useRef<ScrollView>(null);

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

  const handlePagerMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const tab = TABS[page] ?? TABS[0];
    setActiveSubTab((prev) => (prev === tab ? prev : tab));
  };

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
        setSelectedBookingForQR({ ...booking, qrCodePayload: res.token, qrMode });
        return;
      }
    } catch (e) {
      console.log('[QR Generator] Using booking QR payload:', e);
    } finally {
      setLoadingQRId(null);
    }
    setSelectedBookingForQR({ ...booking, qrMode });
  };

  const renderBookingCard = (booking: Booking, index = 0) => {
    const qrMode = getBookingQrMode(booking);
    const isUpcoming = getBookingTab(booking) === 'UPCOMING';
    const isCancelled = booking.status === 'CANCELLED';
    const checkedIn = !!String(booking.successfulCheckedInTime || '').trim();
    const parts = dateParts(booking.dateStr);
    const statusLabel = isCancelled ? 'CANCELLED' : checkedIn ? 'CHECKED IN' : isUpcoming ? 'CONFIRMED' : 'PAST';
    const statusColor = isCancelled ? COLORS.meta : checkedIn ? COLORS.success : isUpcoming ? COLORS.success : COLORS.meta;
    const qrLoading = loadingQRId === `${booking.id}-${qrMode}`;

    return (
      <Reanimated.View
        key={booking.id}
        entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(320).damping(24)}
      >
        <View style={[styles.bookingCard, !isUpcoming && styles.bookingCardExpired]}>
          <View style={[styles.dateRail, !isUpcoming && styles.dateRailExpired]}>
            <Text style={[styles.dateMonth, !isUpcoming && { color: COLORS.meta }]}>{parts.month}</Text>
            <Text style={[styles.dateDay, !isUpcoming && { color: COLORS.muted }]}>{parts.day}</Text>
            <Text style={[styles.dateWeekday, !isUpcoming && { color: COLORS.meta }]}>{parts.weekday}</Text>
          </View>

          <View style={styles.bookingInfo}>
            <View style={styles.bookingTopRow}>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              <View style={styles.creditsPill}>
                <CreditIcon size={13} />
                <Text style={styles.creditsPillText}>{booking.creditsSpent}</Text>
              </View>
            </View>

            <Text style={styles.bookingTitle} numberOfLines={1}>
              {booking.facilityName}
            </Text>
            <Text style={styles.bookingMeta} numberOfLines={1}>
              {(booking.sportType || '').toUpperCase()} · {booking.courtName}
            </Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={13} color={COLORS.primary} />
              <Text style={styles.timeText}>
                {(booking.timeSlotLabel || '').match(/^\d{1,2}:\d{2}/)
                  ? formatClock((booking.timeSlotLabel || '').slice(0, 5))
                  : booking.timeSlotLabel}
              </Text>
              <Text style={styles.dotSeparator}>·</Text>
              <Text style={styles.durationText}>{booking.durationMins} MIN</Text>
            </View>

            {isUpcoming && (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleOpenQR(booking, qrMode)}
                  disabled={qrLoading}
                  activeOpacity={0.82}
                  style={[styles.qrPrimaryBtn, qrLoading && { opacity: 0.7 }]}
                >
                  <Ionicons name="qr-code-outline" size={16} color={COLORS.onPrimary} />
                  <Text style={styles.qrPrimaryText}>
                    {qrLoading ? 'LOADING…' : qrMode === 'CHECK_OUT' ? 'CHECK-OUT QR' : 'CHECK-IN QR'}
                  </Text>
                </TouchableOpacity>

                {!checkedIn && (
                  <TouchableOpacity
                    onPress={() => handleCancelBooking(booking)}
                    disabled={cancellingId === booking.id}
                    activeOpacity={0.7}
                    style={styles.cancelBtn}
                  >
                    <Ionicons name="close-outline" size={14} color={COLORS.meta} />
                    <Text style={styles.cancelText}>
                      {cancellingId === booking.id ? 'CANCELLING…' : 'CANCEL'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Reanimated.View>
    );
  };

  const renderEmptyState = (tab: BookingTab) => (
    <ArenaEmptyState
      icon="calendar-outline"
      title={`No ${tab === 'UPCOMING' ? 'upcoming' : 'past'} bookings`}
      copy={
        tab === 'UPCOMING'
          ? 'Book a court or gym slot using your active center credits from the Access tab.'
          : 'Your completed and cancelled sessions will show up here.'
      }
    />
  );

  const renderList = (tab: BookingTab) => {
    const list = tab === 'UPCOMING' ? upcomingBookings : pastBookings;
    return (
      <View style={[styles.pagerPage, { width: SCREEN_WIDTH }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarClearance + 16 },
          ]}
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
          {list.length === 0 ? renderEmptyState(tab) : list.map((b, i) => renderBookingCard(b, i))}

          {tab === 'UPCOMING' && list.length > 0 && (
            <View style={styles.footerAction}>
              <TouchableOpacity
                onPress={() => goToTab('PAST')}
                activeOpacity={0.7}
                style={styles.viewPastRow}
              >
                <Text style={styles.viewPastText}>VIEW PAST SESSIONS</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      {/* Sticky header — stays fixed while only the lists swipe underneath. */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 26 }]}>
        <PageHead
          eyebrow="Your next game"
          title="Your"
          accent=" bookings"
          sub="Your reserved courts, classes and game nights."
        />

        <View style={styles.subTabNav}>
          {TABS.map((item) => {
            const active = activeSubTab === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => goToTab(item)}
                activeOpacity={0.7}
                style={styles.subTabBtn}
              >
                <Text style={[styles.subTabText, active && styles.subTabTextActive]}>{item}</Text>
                <View style={[styles.subTabLine, active && styles.subTabLineActive]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerMomentumEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {TABS.map((tab) => (
          <React.Fragment key={tab}>{renderList(tab)}</React.Fragment>
        ))}
      </ScrollView>

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
  header: {
    paddingHorizontal: SPACING.containerPadding,
  },
  pager: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
  },
  subTabNav: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  subTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  subTabText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  subTabTextActive: {
    color: COLORS.paper,
  },
  subTabLine: {
    position: 'absolute',
    bottom: -1,
    width: 26,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  subTabLineActive: {
    backgroundColor: COLORS.primary,
  },
  bookingCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  bookingCardExpired: {
    borderColor: COLORS.lineSoft,
    backgroundColor: '#0E0F11',
  },
  dateRail: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.line,
    backgroundColor: '#17120E',
  },
  dateRailExpired: {
    borderRightColor: COLORS.lineSoft,
    backgroundColor: '#111214',
  },
  dateMonth: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.1,
  },
  dateDay: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 38,
    lineHeight: 35,
    letterSpacing: 0.5,
  },
  dateWeekday: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.8,
  },
  bookingInfo: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 5,
  },
  bookingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 0.5,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  creditsPillText: {
    color: COLORS.secondary,
    fontFamily: FONTS.extraBold,
    fontSize: 11,
  },
  bookingTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  bookingMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: COLORS.paperDim,
    fontFamily: FONTS.semiBold,
    fontSize: 11,
  },
  dotSeparator: {
    color: COLORS.meta,
    fontSize: 11,
  },
  durationText: {
    color: COLORS.meta,
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  qrPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  qrPrimaryText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.extraBold,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.7,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
  },
  cancelText: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.7,
  },
  footerAction: {
    marginTop: 10,
  },
  viewPastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
  },
  viewPastText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 1,
  },
});
