import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { SwipeToBook } from '../components/SwipeToBook';
import { CreditIcon } from '../components/CreditIcon';
import { IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { api } from '../services/api';
import { adaptTenantToFacility } from '../services/adapters';
import { getActivityIcon } from '../utils/activityIcons';
import { Facility } from '../types';

interface BookingFlowScreenProps {
  route: any;
  navigation: any;
}

type SlotPeriod = 'MORNING' | 'AFTERNOON' | 'EVENING';

const PERIOD_META: Record<
  SlotPeriod,
  { title: string; short: string; icon: 'sunny-outline' | 'partly-sunny-outline' | 'moon-outline' }
> = {
  MORNING: { title: 'MORNING', short: 'AM', icon: 'sunny-outline' },
  AFTERNOON: { title: 'AFTERNOON', short: 'NOON', icon: 'partly-sunny-outline' },
  EVENING: { title: 'EVENING', short: 'PM', icon: 'moon-outline' },
};

const slotPeriod = (rawTime?: string): SlotPeriod => {
  const h = parseInt((rawTime || '06:00').split(':')[0], 10) || 0;
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
};

interface SlotItem {
  id: string;
  time: string;
  rawTime: string;
}

export const BookingFlowScreen: React.FC<BookingFlowScreenProps> = ({ route, navigation }) => {
  const { facilityId } = route.params || {};
  const { facilities, userMemberships, bookings, bookSession, refreshBookingsAndPasses, colors } =
    useApp();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hideFull, setHideFull] = useState<boolean>(false);

  // Dynamic Facility loader
  const [facility, setFacility] = useState<Facility | null>(
    facilities.find((f) => String(f.id) === String(facilityId)) || null
  );
  const [loadingFacility, setLoadingFacility] = useState<boolean>(!facility);

  useEffect(() => {
    const fetchTargetFacility = async () => {
      if (!facilityId) {
        if (!facility && facilities.length > 0) setFacility(facilities[0]);
        return;
      }
      const found = facilities.find((f) => String(f.id) === String(facilityId));
      if (found) {
        setFacility(found);
        setLoadingFacility(false);
        return;
      }

      try {
        setLoadingFacility(true);
        const tenantData = await api.getTenantDetails(facilityId);
        if (tenantData?.id) {
          setFacility(adaptTenantToFacility(tenantData));
        }
      } catch (e) {
        console.log('[BookingFlow] Using fallback facility:', e);
        if (facilities.length > 0) setFacility(facilities[0]);
      } finally {
        setLoadingFacility(false);
      }
    };

    fetchTargetFacility();
  }, [facilityId, facilities]);

  // Active membership for this facility
  const activeMembership =
    userMemberships.find(
      (m) => String(m.facilityId) === String(facility?.id) && m.status === 'ACTIVE'
    ) ||
    userMemberships.find((m) => m.status === 'ACTIVE') ||
    userMemberships.find(
      (m) => String(m.facilityId) === String(facility?.id) && m.status === 'PENDING'
    ) ||
    userMemberships.find((m) => m.status === 'PENDING') ||
    userMemberships[0];

  // Parse activities available at this facility
  const availableActivities = useMemo(() => {
    const list: {
      activityKey: string;
      sportLabel: string;
      creditsPer60Mins: number;
      isIncludedInPlan: boolean;
      capacityPerCourt: number;
      courts: { id: string; name: string }[];
    }[] = [];

    const allowedActivities = activeMembership?.validActivities
      ? activeMembership.validActivities.map((a) => a.toLowerCase())
      : null;

    if (facility?.activities && Array.isArray(facility.activities)) {
      facility.activities.forEach((act) => {
        if (act.active === false) return;

        const actKey = act.activity ? act.activity.toLowerCase() : '';
        const isIncluded = allowedActivities ? allowedActivities.includes(actKey) : true;
        if (!isIncluded) return;

        const creditsRate = act.creditsPer60Minutes || 100;
        const sportLabel = act.activity ? act.activity.toUpperCase() : 'SESSION';

        const courtsList =
          act.courts && Array.isArray(act.courts) && act.courts.length > 0
            ? act.courts.map((c) => ({ id: c.id, name: c.name.trim() }))
            : [{ id: `floor-${actKey}`, name: `${sportLabel} Open Access` }];

        list.push({
          activityKey: actKey,
          sportLabel,
          creditsPer60Mins: creditsRate,
          isIncludedInPlan: true,
          capacityPerCourt:
            Number(act.capacityPerCourt) > 0
              ? Number(act.capacityPerCourt)
              : actKey === 'badminton'
                ? 6
                : 1,
          courts: courtsList,
        });
      });
    }

    if (list.length === 0) {
      list.push({
        activityKey: 'gym',
        sportLabel: 'GYM',
        creditsPer60Mins: 100,
        isIncludedInPlan: true,
        capacityPerCourt: 1,
        courts: [{ id: 'gym-main', name: 'Main Gym Floor' }],
      });
    }

    return list;
  }, [facility, activeMembership]);

  const [selectedActivity, setSelectedActivity] = useState(availableActivities[0]);

  useEffect(() => {
    if (availableActivities.length > 0) {
      const firstIncluded =
        availableActivities.find((a) => a.isIncludedInPlan) || availableActivities[0];
      setSelectedActivity(firstIncluded);
    }
  }, [availableActivities]);

  const [selectedCourt, setSelectedCourt] = useState(selectedActivity?.courts[0]);

  useEffect(() => {
    if (selectedActivity && selectedActivity.courts.length > 0) {
      setSelectedCourt(selectedActivity.courts[0]);
    }
  }, [selectedActivity]);

  // 3-Day Rolling Window Setup
  const dates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const day3 = new Date(today);
    day3.setDate(today.getDate() + 2);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formatDateSub = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
    const toISODate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return [
      {
        label: 'Today',
        dayName: 'TODAY',
        weekday: days[today.getDay()].toUpperCase(),
        dateSub: formatDateSub(today),
        isoDate: toISODate(today),
      },
      {
        label: 'Tomorrow',
        dayName: 'TOMORROW',
        weekday: days[tomorrow.getDay()].toUpperCase(),
        dateSub: formatDateSub(tomorrow),
        isoDate: toISODate(tomorrow),
      },
      {
        label: 'Day 3',
        dayName: days[day3.getDay()].toUpperCase(),
        weekday: days[day3.getDay()].toUpperCase(),
        dateSub: formatDateSub(day3),
        isoDate: toISODate(day3),
      },
    ];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>('Today');
  const [duration, setDuration] = useState<60 | 120>(60);

  const isGym = selectedActivity?.activityKey === 'gym';
  const effectiveDuration = isGym ? 60 : duration;

  // Live court availability
  const [courtAvailability, setCourtAvailability] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const selectedDateObj = dates.find((d) => d.label === selectedDate) || dates[0];
  const targetISODate = selectedDateObj?.isoDate;

  const loadAvailability = useCallback(async () => {
    if (!facility?.id || !targetISODate) return;
    try {
      setLoadingAvailability(true);
      const res = await api.getCourtAvailability(facility.id, targetISODate);
      setCourtAvailability(res?.courts || {});
    } catch (e) {
      console.log('[BookingFlow] Availability fetch error:', e);
    } finally {
      setLoadingAvailability(false);
    }
  }, [facility?.id, targetISODate]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const courtCapacity = selectedActivity?.capacityPerCourt || 1;

  const bookedCountFor = useCallback(
    (courtName?: string, rawTime?: string) => {
      if (!courtName || !rawTime) return 0;
      const normalized = rawTime.slice(0, 5);
      return courtAvailability[courtName.trim()]?.[normalized] ?? 0;
    },
    [courtAvailability]
  );

  const isCourtFullAt = useCallback(
    (courtName?: string, rawTime?: string) => bookedCountFor(courtName, rawTime) >= courtCapacity,
    [bookedCountFor, courtCapacity]
  );

  const freeCourtsAt = useCallback(
    (rawTime?: string) =>
      (selectedActivity?.courts || []).filter((c) => !isCourtFullAt(c.name, rawTime)).length,
    [selectedActivity, isCourtFullAt]
  );

  // Time Slots
  const timeSlots: SlotItem[] = useMemo(() => {
    if (
      activeMembership?.timeSlots &&
      Array.isArray(activeMembership.timeSlots) &&
      activeMembership.timeSlots.length > 0
    ) {
      return activeMembership.timeSlots.map((ts, idx) => {
        const rawTime = ts.slotStartTime || '06:00';
        const hour = parseInt(rawTime.split(':')[0], 10) || 6;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        const label = `${pad(displayHour)}:00 ${ampm}`;

        return {
          id: ts.id || `ts-${idx}`,
          time: label,
          rawTime,
        };
      });
    }

    return [
      { id: 's1', time: '05:00 AM', rawTime: '05:00' },
      { id: 's2', time: '06:00 AM', rawTime: '06:00' },
      { id: 's3', time: '07:00 AM', rawTime: '07:00' },
      { id: 's4', time: '08:00 AM', rawTime: '08:00' },
      { id: 's5', time: '05:00 PM', rawTime: '17:00' },
      { id: 's6', time: '06:00 PM', rawTime: '18:00' },
    ];
  }, [activeMembership]);

  const [selectedSlot, setSelectedSlot] = useState<SlotItem | undefined>(timeSlots[0]);
  const [activePeriod, setActivePeriod] = useState<SlotPeriod>(() =>
    slotPeriod(timeSlots[0]?.rawTime)
  );

  useEffect(() => {
    if (timeSlots.length > 0) {
      setSelectedSlot(timeSlots[0]);
      setActivePeriod(slotPeriod(timeSlots[0].rawTime));
    }
  }, [timeSlots]);

  // Time-first auto-selection: keep chosen time, switch to a free court if needed
  useEffect(() => {
    if (!selectedSlot) return;
    const courts = selectedActivity?.courts || [];
    if (!isCourtFullAt(selectedCourt?.name, selectedSlot.rawTime)) return;
    const firstFree = courts.find((c) => !isCourtFullAt(c.name, selectedSlot.rawTime));
    if (firstFree) {
      if (firstFree.id !== selectedCourt?.id) setSelectedCourt(firstFree);
      return;
    }
    const next = timeSlots.find((slot) => freeCourtsAt(slot.rawTime) > 0);
    if (next && next.id !== selectedSlot.id) {
      setSelectedSlot(next);
      setActivePeriod(slotPeriod(next.rawTime));
      const firstFreeNext = courts.find((c) => !isCourtFullAt(c.name, next.rawTime));
      if (firstFreeNext) setSelectedCourt(firstFreeNext);
    }
  }, [
    courtAvailability,
    selectedCourt,
    selectedSlot,
    selectedActivity,
    timeSlots,
    isCourtFullAt,
    freeCourtsAt,
  ]);

  const activeSlot: SlotItem = selectedSlot ?? timeSlots[0];

  // Bucket slots by period for the tabbed Time Deck Card
  const periodBuckets = useMemo(() => {
    const buckets: Record<SlotPeriod, (SlotItem & { free: number; available: boolean })[]> = {
      MORNING: [],
      AFTERNOON: [],
      EVENING: [],
    };
    for (const slot of timeSlots) {
      const free = freeCourtsAt(slot.rawTime);
      const available = free > 0;
      if (hideFull && !available) continue;
      buckets[slotPeriod(slot.rawTime)].push({ ...slot, free, available });
    }
    return buckets;
  }, [timeSlots, freeCourtsAt, hideFull]);

  const availablePeriods = useMemo(
    () => (['MORNING', 'AFTERNOON', 'EVENING'] as SlotPeriod[]).filter((p) => periodBuckets[p].length > 0),
    [periodBuckets]
  );

  // Ensure activePeriod always points to a non-empty period tab if possible
  useEffect(() => {
    if (periodBuckets[activePeriod]?.length === 0 && availablePeriods.length > 0) {
      setActivePeriod(availablePeriods[0]);
    }
  }, [periodBuckets, activePeriod, availablePeriods]);

  const currentPeriodSlots = periodBuckets[activePeriod] || [];

  // Check if user already booked this specific slot
  const isAlreadyBookedForSelectedSlot = useMemo(() => {
    const targetDate = dates.find((d) => d.label === selectedDate) || dates[0];
    const targetISODateStr = targetDate.isoDate;
    const targetTime = selectedSlot?.rawTime || selectedSlot?.time;

    const normalizeDateStr = (dateStr: string): string => {
      if (dateStr === 'Today') {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
      }
      return dateStr.split('T')[0];
    };

    return bookings.some((b) => {
      if (b.status === 'CANCELLED') return false;
      const bDate = b.dateStr ? normalizeDateStr(b.dateStr) : '';
      const bTime = b.timeSlotLabel ? b.timeSlotLabel.split(' ')[0] : '';
      const isSameDate = bDate === targetISODateStr;
      const isSameTime = bTime === targetTime || b.timeSlotLabel === selectedSlot?.time;
      return isSameDate && isSameTime;
    });
  }, [bookings, dates, selectedDate, selectedSlot]);

  // Credit calculation
  const requiredCredits = (effectiveDuration / 60) * (selectedActivity?.creditsPer60Mins || 100);
  const userCreditBalance = activeMembership ? activeMembership.remainingCredits : 0;
  const isBalanceSufficient = userCreditBalance >= requiredCredits;
  const isActivityIncluded = selectedActivity?.isIncludedInPlan !== false;
  const isSelectedCourtFull = isCourtFullAt(selectedCourt?.name, activeSlot?.rawTime);
  const isBookingAllowed =
    isBalanceSufficient &&
    isActivityIncluded &&
    !isAlreadyBookedForSelectedSlot &&
    !isSelectedCourtFull &&
    !isSubmitting;

  const bookingBlockedReason = isAlreadyBookedForSelectedSlot
    ? 'SLOT ALREADY BOOKED'
    : isSelectedCourtFull
      ? 'SELECTED COURT IS FULL'
      : !isActivityIncluded
        ? 'ACTIVITY NOT INCLUDED'
        : !isBalanceSufficient
          ? 'INSUFFICIENT CREDITS'
          : undefined;

  const handleConfirmSwipe = async () => {
    if (!facility) {
      Alert.alert('Facility Error', 'No facility selected.');
      return;
    }

    if (!isActivityIncluded) {
      Alert.alert(
        'Activity Not Included',
        `This activity (${selectedActivity?.sportLabel}) is not included in your active membership plan (${activeMembership?.planTitle || 'Current Plan'}).\n\nPlease select an included activity or visit the reception desk to upgrade your plan.`
      );
      return;
    }

    if (isAlreadyBookedForSelectedSlot) {
      Alert.alert(
        'Slot Already Booked',
        `You already have an active booking for ${activeSlot.time} on ${selectedDate}. Please select another time slot or date.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const dateObj = dates.find((d) => d.label === selectedDate) || dates[0];

      const res = await bookSession({
        facilityId: facility.id,
        facilityName: facility.name,
        facilityAddress: facility.address,
        sportType: selectedActivity.activityKey,
        courtName: selectedCourt?.name || 'Main Floor',
        dateStr: dateObj.isoDate,
        timeSlotLabel: activeSlot.rawTime,
        durationMins: effectiveDuration,
        creditsSpent: requiredCredits,
        facilityImage: facility.imageUrl,
      });

      await refreshBookingsAndPasses();

      if (res.success) {
        Alert.alert(
          'Session Booked!',
          `Your slot for ${selectedActivity.sportLabel} (${selectedCourt?.name}, ${activeSlot.time}) is confirmed! Check your Bookings tab for entry QR code.`,
          [
            {
              text: 'VIEW BOOKING & QR',
              onPress: () => navigation.navigate('MainTabs', { screen: 'BookingsTab' }),
            },
          ]
        );
      } else {
        const isPlanError =
          res.error?.includes('membership plan') || res.error?.includes('not included');
        Alert.alert(
          isPlanError ? 'Activity Not Included' : 'Booking Rejected',
          isPlanError
            ? `This activity (${selectedActivity?.sportLabel}) is not included in your active membership plan (${activeMembership?.planTitle || 'Active Plan'}). Please check your pass details or upgrade at reception.`
            : res.error ||
                `Unable to book ${selectedActivity.sportLabel}. Check your membership active status or credit balance.`
        );
      }
    } catch (e: any) {
      Alert.alert(
        'Booking Error',
        e?.message || 'An unexpected error occurred while confirming booking.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingFacility && !facility) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Math.max(insets.top, 20),
            justifyContent: 'center',
          },
        ]}
      >
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!facility) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20) },
        ]}
      >
        <AppBackground />
        <Text style={{ color: colors.onSurface, textAlign: 'center', marginTop: 40 }}>
          Facility not found.
        </Text>
      </View>
    );
  }

  const thumbUri = facility.images?.[0] || facility.imageUrl || '';
  const totalCourtsCount = (selectedActivity?.courts || []).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <IconButton
          icon="arrow-back"
          size={38}
          iconSize={20}
          iconColor="#FFFFFF"
          backgroundColor="#1F1F1F"
          borderColor="rgba(255,255,255,0.08)"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.topBarTitle}>BOOK A SESSION</Text>
        <TouchableOpacity style={styles.liveChip} onPress={loadAvailability} activeOpacity={0.8}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: loadingAvailability ? COLORS.textMuted : COLORS.success },
            ]}
          />
          <Text style={styles.liveText}>{loadingAvailability ? 'SYNC' : 'LIVE'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 14) + 145 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── VENUE & PASS MEDIA BANNER (Archetype: Compact Solid #181818 Media Card) ── */}
        <Animated.View entering={FadeInDown.delay(30).duration(320).damping(24)}>
          <View style={styles.venueBannerCard}>
            <View style={styles.venueTopRow}>
              {thumbUri ? (
                <Image
                  source={{ uri: thumbUri }}
                  style={styles.venueThumb}
                  contentFit="cover"
                  transition={160}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.venueThumb, styles.venueThumbFallback]}>
                  <Ionicons name="barbell-outline" size={22} color={COLORS.primary} />
                </View>
              )}

              <View style={styles.venueMetaCol}>
                <Text style={styles.venueName} numberOfLines={1}>
                  {facility.name}
                </Text>
                <Text style={styles.venueAddr} numberOfLines={1}>
                  {facility.address}
                </Text>
              </View>

              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeLabel}>BALANCE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text
                    style={[
                      styles.balanceBadgeVal,
                      { color: isBalanceSufficient ? '#FFFFFF' : COLORS.error },
                    ]}
                  >
                    {userCreditBalance}
                  </Text>
                  <CreditIcon size={15} />
                </View>
              </View>
            </View>

            {activeMembership && (
              <View style={styles.passInlineBar}>
                <View style={styles.passInlineLeft}>
                  <Ionicons name="shield-checkmark" size={13} color={COLORS.secondary} />
                  <Text style={styles.passInlineText} numberOfLines={1}>
                    {activeMembership.planTitle}
                  </Text>
                </View>
                <Text style={styles.passInlineExp}>EXP {activeMembership.expiryDate}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── STEP 01: DATE (Archetype: Segmented Calendar Dock) ── */}
        <Animated.View entering={FadeInDown.delay(70).duration(320).damping(24)}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepLabelRow}>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>01</Text>
              </View>
              <Text style={styles.sectionTitle}>CHOOSE DAY</Text>
            </View>
            <Text style={styles.sectionRightMeta}>3-DAY WINDOW</Text>
          </View>

          <View style={styles.dateDock}>
            {dates.map((d) => {
              const isSelected = selectedDate === d.label;
              const [dayNum, mon] = d.dateSub.split(' ');
              return (
                <TouchableOpacity
                  key={d.label}
                  style={[styles.dateTile, isSelected && styles.dateTileActive]}
                  onPress={() => setSelectedDate(d.label)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dateDayTag, isSelected && styles.dateDayTagActive]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{dayNum}</Text>
                  <Text style={[styles.dateMon, isSelected && styles.dateMonActive]}>
                    {(mon || '').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── STEP 02: SPORT & DURATION (Archetype: Horizontal Medallion Cards + Pill Switch) ── */}
        <Animated.View entering={FadeInDown.delay(110).duration(320).damping(24)}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepLabelRow}>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>02</Text>
              </View>
              <Text style={styles.sectionTitle}>ACTIVITY & DURATION</Text>
            </View>

            {!isGym && (
              <View style={styles.durationMiniSwitch}>
                {([60, 120] as const).map((mins) => {
                  const active = duration === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.durationMiniPill, active && styles.durationMiniPillActive]}
                      onPress={() => setDuration(mins)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.durationMiniText,
                          active && styles.durationMiniTextActive,
                        ]}
                      >
                        {mins === 60 ? '60M' : '120M'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportScroll}
          >
            {availableActivities.map((act) => {
              const isSelected = selectedActivity?.activityKey === act.activityKey;
              return (
                <TouchableOpacity
                  key={act.activityKey}
                  style={[styles.sportCard, isSelected && styles.sportCardActive]}
                  onPress={() => setSelectedActivity(act)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.sportMedallion,
                      isSelected && styles.sportMedallionActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getActivityIcon(act.activityKey || act.sportLabel)}
                      size={18}
                      color={isSelected ? COLORS.onPrimary : COLORS.secondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.sportCardName, isSelected && { color: '#FFFFFF' }]}
                      numberOfLines={1}
                    >
                      {act.sportLabel}
                    </Text>
                    <View style={styles.sportRateRow}>
                      <Text
                        style={[
                          styles.sportRateNum,
                          { color: isSelected ? COLORS.primary : COLORS.textMuted },
                        ]}
                      >
                        {act.creditsPer60Mins}
                      </Text>
                      <CreditIcon size={12} />
                      <Text style={styles.sportRateUnit}>/ HR</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── STEP 03: TIME SLOT (Archetype: Period-Tabbed 3-Column Time Deck Card) ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(320).damping(24)}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepLabelRow}>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>03</Text>
              </View>
              <Text style={styles.sectionTitle}>PICK START TIME</Text>
            </View>

            <TouchableOpacity
              style={[styles.hideFullBtn, hideFull && styles.hideFullBtnActive]}
              onPress={() => setHideFull((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hideFull ? 'checkmark-circle' : 'filter-outline'}
                size={12}
                color={hideFull ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.hideFullBtnText,
                  { color: hideFull ? COLORS.primary : COLORS.textMuted },
                ]}
              >
                AVAILABLE ONLY
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeDeckCard}>
            {/* Period Tabs (Morning / Afternoon / Evening) */}
            <View style={styles.periodTabBar}>
              {(['MORNING', 'AFTERNOON', 'EVENING'] as SlotPeriod[]).map((period) => {
                const count = periodBuckets[period]?.length || 0;
                const isSelected = activePeriod === period;
                return (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodTab,
                      isSelected && styles.periodTabActive,
                      count === 0 && { opacity: 0.4 },
                    ]}
                    onPress={() => setActivePeriod(period)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={PERIOD_META[period].icon}
                      size={13}
                      color={isSelected ? COLORS.onPrimary : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.periodTabText,
                        isSelected && styles.periodTabTextActive,
                      ]}
                    >
                      {PERIOD_META[period].title}
                    </Text>
                    <View
                      style={[
                        styles.periodCountBadge,
                        isSelected && styles.periodCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodCountText,
                          isSelected && styles.periodCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3-Column Compact Time Grid for the active period */}
            {currentPeriodSlots.length === 0 ? (
              <View style={styles.emptyPeriodBox}>
                <Ionicons name="time-outline" size={24} color={COLORS.textMuted} />
                <Text style={styles.emptyPeriodText}>
                  No {PERIOD_META[activePeriod].title.toLowerCase()} slots available.
                </Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {currentPeriodSlots.map((slot) => {
                  const isSelected = activeSlot.id === slot.id;
                  const statusLabel = !slot.available
                    ? 'FULL'
                    : isGym
                      ? 'OPEN'
                      : slot.free === 1
                        ? '1 COURT'
                        : `${slot.free} COURTS`;

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeTile,
                        isSelected && styles.timeTileSelected,
                        !slot.available && styles.timeTileDisabled,
                      ]}
                      onPress={() => slot.available && setSelectedSlot(slot)}
                      disabled={!slot.available}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.timeTileClock,
                          isSelected && styles.timeTileClockSelected,
                          !slot.available && styles.timeTileClockDisabled,
                        ]}
                      >
                        {slot.time}
                      </Text>
                      <View style={styles.timeTileSubRow}>
                        <View
                          style={[
                            styles.timeTileDot,
                            {
                              backgroundColor: isSelected
                                ? COLORS.onPrimary
                                : !slot.available
                                  ? COLORS.error
                                  : slot.free <= 1 && totalCourtsCount > 1
                                    ? COLORS.secondary
                                    : COLORS.success,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.timeTileSub,
                            isSelected && styles.timeTileSubSelected,
                            !slot.available && { color: COLORS.error },
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── STEP 04: COURT / FLOOR (Archetype: 2-Column Capacity Meter Cards) ── */}
        <Animated.View entering={FadeInDown.delay(190).duration(320).damping(24)}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepLabelRow}>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>04</Text>
              </View>
              <Text style={styles.sectionTitle}>SELECT COURT / FLOOR</Text>
            </View>

            <View style={styles.atTimeBadge}>
              <Ionicons name="time" size={11} color={COLORS.primary} />
              <Text style={styles.atTimeBadgeText}>AT {activeSlot.time}</Text>
            </View>
          </View>

          <View style={styles.courtGrid}>
            {(selectedActivity?.courts || []).map((court) => {
              const isSelected = selectedCourt?.id === court.id;
              const booked = bookedCountFor(court.name, activeSlot.rawTime);
              const freeSpots = Math.max(0, courtCapacity - booked);
              const isFull = freeSpots === 0;
              const fillRatio =
                courtCapacity > 0 ? Math.min(100, (freeSpots / courtCapacity) * 100) : 0;
              const barColor = isFull
                ? COLORS.error
                : freeSpots <= Math.ceil(courtCapacity * 0.34)
                  ? COLORS.secondary
                  : COLORS.success;

              return (
                <TouchableOpacity
                  key={court.id}
                  style={[
                    styles.courtTile,
                    isSelected && styles.courtTileSelected,
                    isFull && styles.courtTileFull,
                  ]}
                  onPress={() => !isFull && setSelectedCourt(court)}
                  activeOpacity={0.85}
                >
                  <View style={styles.courtTileTop}>
                    <Text
                      style={[
                        styles.courtTileName,
                        isSelected && { color: '#FFFFFF' },
                        isFull && { color: COLORS.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {court.name}
                    </Text>
                    <View
                      style={[
                        styles.courtRadio,
                        isSelected && styles.courtRadioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.courtRadioInner} />}
                    </View>
                  </View>

                  <View style={styles.courtCapRow}>
                    <Text style={[styles.courtCapText, { color: barColor }]}>
                      {isFull
                        ? 'FULLY BOOKED'
                        : courtCapacity === 1
                          ? 'AVAILABLE'
                          : `${freeSpots} OF ${courtCapacity} SPOTS FREE`}
                    </Text>
                  </View>

                  <View style={styles.courtMeterTrack}>
                    <View
                      style={[
                        styles.courtMeterFill,
                        { width: `${fillRatio}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── BOARDING-PASS SUMMARY TICKET (Archetype: Perforated Stub Ticket) ── */}
        <Animated.View entering={FadeInDown.delay(230).duration(320).damping(24)}>
          <View style={styles.ticketCard}>
            <LinearGradient
              colors={['#25150C', '#181515']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ticketTopStub}
            >
              <View style={styles.ticketHeaderRow}>
                <View>
                  <Text style={styles.ticketPassLabel}>SESSION RESERVATION TICKET</Text>
                  <Text style={styles.ticketSportTitle}>
                    {selectedActivity?.sportLabel} · {selectedCourt?.name}
                  </Text>
                </View>
                <View style={styles.ticketDurationBadge}>
                  <Text style={styles.ticketDurationText}>{effectiveDuration} MIN</Text>
                </View>
              </View>

              <View style={styles.ticketMetaGrid}>
                <View style={styles.ticketMetaCell}>
                  <Text style={styles.ticketMetaKey}>DATE</Text>
                  <Text style={styles.ticketMetaVal}>{selectedDateObj.dateSub}</Text>
                </View>
                <View style={styles.ticketMetaDivider} />
                <View style={styles.ticketMetaCell}>
                  <Text style={styles.ticketMetaKey}>START TIME</Text>
                  <Text style={styles.ticketMetaVal}>{activeSlot.time}</Text>
                </View>
                <View style={styles.ticketMetaDivider} />
                <View style={styles.ticketMetaCell}>
                  <Text style={styles.ticketMetaKey}>CREDITS</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={[styles.ticketMetaVal, { color: COLORS.primary, marginTop: 0 }]}>
                      {requiredCredits}
                    </Text>
                    <CreditIcon size={14} />
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Perforation */}
            <View style={styles.ticketPerforation}>
              <View style={[styles.notch, styles.notchLeft]} />
              <View style={styles.dashedLine} />
              <View style={[styles.notch, styles.notchRight]} />
            </View>

            {/* Bottom Ledger */}
            <View style={styles.ticketBottomStub}>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Balance after booking</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={[
                      styles.ledgerVal,
                      {
                        color: isBalanceSufficient ? COLORS.secondary : COLORS.error,
                      },
                    ]}
                  >
                    {Math.max(0, userCreditBalance - requiredCredits)}
                  </Text>
                  <CreditIcon size={15} />
                </View>
              </View>

              {!isActivityIncluded && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={15} color={COLORS.error} />
                  <Text style={styles.warningText}>
                    {selectedActivity?.sportLabel} is not covered in your current pass. Visit reception to upgrade.
                  </Text>
                </View>
              )}

              {!isBalanceSufficient && isActivityIncluded && (
                <View style={styles.warningBanner}>
                  <Ionicons name="alert-circle" size={15} color={COLORS.error} />
                  <Text style={styles.warningText}>
                    Insufficient credits ({userCreditBalance} available, {requiredCredits} required). Top up at reception.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Sticky Bottom Swipe Dock ── */}
      <View
        style={[
          styles.fixedFooter,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <SwipeToBook
          onSwipeComplete={handleConfirmSwipe}
          disabled={!isBookingAllowed}
          isSubmitting={isSubmitting}
          requiredCredits={requiredCredits}
          disabledReason={bookingBlockedReason}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 10,
  },
  topBarTitle: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.8,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 4,
  },

  // ── Venue & Pass Banner Card ──
  venueBannerCard: {
    backgroundColor: '#181818',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    ...SHADOWS.card,
  },
  venueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#252528',
  },
  venueThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueMetaCol: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  venueAddr: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  balanceBadge: {
    backgroundColor: '#222226',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  balanceBadgeLabel: {
    fontSize: 8,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.1,
  },
  balanceBadgeVal: {
    fontSize: 16,
    fontFamily: FONTS.black,
    marginTop: 1,
  },
  passInlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  passInlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  passInlineText: {
    fontSize: 11.5,
    fontFamily: FONTS.semiBold,
    color: COLORS.secondary,
  },
  passInlineExp: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },

  // ── Section Headers ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepPill: {
    backgroundColor: 'rgba(255,90,31,0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,90,31,0.45)',
  },
  stepPillText: {
    fontSize: 9.5,
    fontFamily: FONTS.black,
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    letterSpacing: 1.3,
  },
  sectionRightMeta: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // ── Step 01: Date Dock ──
  dateDock: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#181818',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dateTile: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dateTileActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.ember,
  },
  dateDayTag: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.1,
  },
  dateDayTagActive: {
    color: 'rgba(10,5,3,0.75)',
  },
  dateNum: {
    fontSize: 22,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  dateNumActive: {
    color: COLORS.onPrimary,
  },
  dateMon: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  dateMonActive: {
    color: 'rgba(10,5,3,0.75)',
  },

  // ── Step 02: Sport & Duration ──
  durationMiniSwitch: {
    flexDirection: 'row',
    backgroundColor: '#181818',
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  durationMiniPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  durationMiniPillActive: {
    backgroundColor: COLORS.primary,
  },
  durationMiniText: {
    fontSize: 9.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  durationMiniTextActive: {
    color: COLORS.onPrimary,
  },
  sportScroll: {
    gap: 10,
    paddingRight: 4,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#181818',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 148,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sportCardActive: {
    backgroundColor: '#24150E',
    borderColor: COLORS.primary,
  },
  sportMedallion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252529',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportMedallionActive: {
    backgroundColor: COLORS.primary,
  },
  sportCardName: {
    fontSize: 12.5,
    fontFamily: FONTS.extraBold,
    color: '#CBCBCB',
    letterSpacing: 0.5,
  },
  sportRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  sportRateNum: {
    fontSize: 12,
    fontFamily: FONTS.black,
  },
  sportRateUnit: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },

  // ── Step 03: Time Deck Card (Period Tabs + 3-Col Grid) ──
  hideFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hideFullBtnActive: {
    backgroundColor: 'rgba(255,90,31,0.14)',
    borderColor: 'rgba(255,90,31,0.45)',
  },
  hideFullBtnText: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.9,
  },
  timeDeckCard: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  periodTabBar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#121214',
    padding: 4,
    borderRadius: 11,
    marginBottom: 12,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
  },
  periodTabText: {
    fontSize: 9.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 0.7,
  },
  periodTabTextActive: {
    color: COLORS.onPrimary,
  },
  periodCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  periodCountBadgeActive: {
    backgroundColor: 'rgba(10,5,3,0.22)',
  },
  periodCountText: {
    fontSize: 8.5,
    fontFamily: FONTS.black,
    color: COLORS.textMuted,
  },
  periodCountTextActive: {
    color: COLORS.onPrimary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeTile: {
    width: '31.4%',
    backgroundColor: '#222226',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  timeTileSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.ember,
  },
  timeTileDisabled: {
    opacity: 0.35,
  },
  timeTileClock: {
    fontSize: 12.5,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  timeTileClockSelected: {
    color: COLORS.onPrimary,
  },
  timeTileClockDisabled: {
    color: COLORS.textMuted,
  },
  timeTileSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeTileDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  timeTileSub: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  timeTileSubSelected: {
    color: 'rgba(10,5,3,0.8)',
  },
  emptyPeriodBox: {
    paddingVertical: 22,
    alignItems: 'center',
    gap: 6,
  },
  emptyPeriodText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  // ── Step 04: Court Grid ──
  atTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,90,31,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,90,31,0.45)',
  },
  atTimeBadgeText: {
    fontSize: 9.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  courtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  courtTile: {
    width: '48.3%',
    backgroundColor: '#181818',
    borderRadius: 13,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  courtTileSelected: {
    backgroundColor: '#24150E',
    borderColor: COLORS.primary,
  },
  courtTileFull: {
    opacity: 0.45,
  },
  courtTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  courtTileName: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    color: '#CBCBCB',
  },
  courtRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtRadioSelected: {
    borderColor: COLORS.primary,
  },
  courtRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  courtCapRow: {
    marginTop: 8,
  },
  courtCapText: {
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.8,
  },
  courtMeterTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
    overflow: 'hidden',
  },
  courtMeterFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Boarding-Pass Summary Ticket ──
  ticketCard: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255,122,61,0.28)',
    overflow: 'hidden',
  },
  ticketTopStub: {
    padding: 16,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  ticketPassLabel: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    color: COLORS.secondary,
    letterSpacing: 1.4,
  },
  ticketSportTitle: {
    fontSize: 17,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  ticketDurationBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  ticketDurationText: {
    fontSize: 9.5,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  ticketMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(10,10,12,0.45)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ticketMetaCell: {
    flex: 1,
  },
  ticketMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
  },
  ticketMetaKey: {
    fontSize: 8,
    fontFamily: FONTS.extraBold,
    color: COLORS.textMuted,
    letterSpacing: 1.1,
  },
  ticketMetaVal: {
    fontSize: 12.5,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  ticketPerforation: {
    position: 'relative',
    justifyContent: 'center',
    height: 16,
    backgroundColor: '#161618',
  },
  dashedLine: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 14,
  },
  notch: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  notchLeft: {
    left: -8,
  },
  notchRight: {
    right: -8,
  },
  ticketBottomStub: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#151518',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ledgerLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  ledgerVal: {
    fontSize: 15,
    fontFamily: FONTS.black,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    backgroundColor: 'rgba(243,114,127,0.10)',
    borderColor: 'rgba(243,114,127,0.30)',
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    lineHeight: 16,
  },

  // ── Fixed Footer ──
  fixedFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 10,
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    zIndex: 100,
  },
});
