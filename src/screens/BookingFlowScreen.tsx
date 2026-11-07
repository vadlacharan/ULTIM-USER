import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { SwipeToBook } from '../components/SwipeToBook';
import { CreditIcon } from '../components/CreditIcon';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { DetailTopBar, Eyebrow } from '../components/ArenaUI';
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
  const { facilityId, membershipId } = route.params || {};
  const { facilities, userMemberships, bookings, bookSession, refreshBookingsAndPasses, colors } =
    useApp();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hideFull, setHideFull] = useState<boolean>(false);
  // Two-step wizard: 1 = date & sport, 2 = time, court & confirm.
  const [step, setStep] = useState<1 | 2>(1);
  const scrollRef = useRef<ScrollView>(null);

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

  // Active membership — an explicitly chosen pass (BOOK on a pass card) wins,
  // otherwise fall back to the best pass for this facility.
  const explicitMembership = membershipId
    ? userMemberships.find((m) => String(m.id) === String(membershipId))
    : undefined;
  const activeMembership =
    explicitMembership ||
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

  // Back to top whenever the wizard step changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

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
        membershipId: activeMembership ? String(activeMembership.id) : undefined,
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

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <DetailTopBar
          label="Session booking"
          onBack={() => navigation.goBack()}
          right={
            <TouchableOpacity style={styles.liveChip} onPress={loadAvailability} activeOpacity={0.8}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: loadingAvailability ? COLORS.meta : COLORS.success },
                ]}
              />
              <Text style={styles.liveText}>{loadingAvailability ? 'SYNC' : 'LIVE'}</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 14) + 196 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(30).duration(320).damping(24)}>
          <View style={styles.sessionHero}>
            <Eyebrow>Book a session</Eyebrow>
            <Text style={styles.sessionTitle}>Pick your game.</Text>
            {activeMembership && (
              <View style={styles.planChip}>
                <View style={styles.planDot} />
                <View style={styles.planChipCopy}>
                  <Text style={styles.planChipName} numberOfLines={1}>
                    {activeMembership.planTitle}
                  </Text>
                  <Text style={styles.planChipMeta}>
                    {userCreditBalance} credits available · exp {activeMembership.expiryDate}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320).damping(24)}>
          <View style={styles.venueCard}>
            {thumbUri ? (
              <Image
                source={{ uri: thumbUri }}
                style={styles.venueThumb}
                contentFit="cover"
                transition={180}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.venueThumb, styles.venueThumbFallback]}>
                <Ionicons name="barbell-outline" size={21} color={COLORS.primary} />
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
              <View style={styles.balanceBadgeRow}>
                <Text
                  style={[
                    styles.balanceBadgeVal,
                    { color: isBalanceSufficient ? COLORS.paper : COLORS.error },
                  ]}
                >
                  {userCreditBalance}
                </Text>
                <CreditIcon size={14} />
              </View>
            </View>
          </View>
        </Animated.View>

        {step === 1 && (
          <Animated.View key="booking-step-1" entering={SlideInRight.duration(300).damping(26)}>
            <View style={styles.stepProgress}>
              <View style={styles.stepProgressRow}>
                <Text style={styles.stepProgressStep}>STEP 1 OF 2</Text>
                <Text style={styles.stepProgressLabel}>DATE & SPORT</Text>
              </View>
              <View style={styles.stepProgressTrack}>
                <View style={[styles.stepProgressFill, { width: '50%' }]} />
              </View>
            </View>

        {/* 01 — DATE */}
        <Animated.View entering={FadeInDown.delay(90).duration(320).damping(24)}>
          <View style={styles.sessionStep}>
            <View style={styles.stepHead}>
              <Text style={styles.stepNumber}>01</Text>
              <Text style={styles.stepTitle}>Pick a date</Text>
              <Text style={styles.stepMeta}>3-DAY WINDOW</Text>
            </View>

            <View style={styles.dateGrid}>
              {dates.map((d) => {
                const isSelected = selectedDate === d.label;
                const [dayNum, mon] = d.dateSub.split(' ');
                return (
                  <TouchableOpacity
                    key={d.label}
                    style={[styles.dateOption, isSelected && styles.optionSelected]}
                    onPress={() => setSelectedDate(d.label)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dateOptionLabel, isSelected && { color: COLORS.primary }]}>
                      {d.dayName}
                    </Text>
                    <Text style={styles.dateOptionDate}>
                      {dayNum} <Text style={styles.dateOptionMonth}>{(mon || '').toUpperCase()}</Text>
                    </Text>
                    <View style={[styles.optionCheck, isSelected && styles.optionCheckActive]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color={COLORS.onPrimary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* 02 — ACTIVITY & DURATION */}
        <Animated.View entering={FadeInDown.delay(120).duration(320).damping(24)}>
          <View style={styles.sessionStep}>
            <View style={styles.stepHead}>
              <Text style={styles.stepNumber}>02</Text>
              <Text style={styles.stepTitle}>Choose an activity</Text>
              {!isGym ? (
                <View style={styles.durationSwitch}>
                  {([60, 120] as const).map((mins) => {
                    const active = duration === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        style={[styles.durationPill, active && styles.durationPillActive]}
                        onPress={() => setDuration(mins)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.durationText, active && styles.durationTextActive]}>
                          {mins}M
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.stepMeta}>HOURLY RATE</Text>
              )}
            </View>

            <View style={styles.activityGrid}>
              {availableActivities.map((act) => {
                const isSelected = selectedActivity?.activityKey === act.activityKey;
                return (
                  <TouchableOpacity
                    key={act.activityKey}
                    style={[styles.activityOption, isSelected && styles.optionSelected]}
                    onPress={() => setSelectedActivity(act)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.activityOptionTop}>
                      <MaterialCommunityIcons
                        name={getActivityIcon(act.activityKey || act.sportLabel)}
                        size={16}
                        color={isSelected ? COLORS.primary : COLORS.muted}
                      />
                      <View style={[styles.optionCheck, isSelected && styles.optionCheckActive]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color={COLORS.onPrimary} />}
                      </View>
                    </View>
                    <View>
                      <Text style={styles.activityOptionName} numberOfLines={1}>
                        {act.sportLabel}
                      </Text>
                      <View style={styles.activityPriceRow}>
                        <Text style={styles.activityPrice}>{act.creditsPer60Mins}</Text>
                        <CreditIcon size={12} />
                        <Text style={styles.activityPriceUnit}>/ HR</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="booking-step-2" entering={SlideInRight.duration(300).damping(26)}>
            <View style={styles.stepProgress}>
              <View style={styles.stepProgressRow}>
                <Text style={styles.stepProgressStep}>STEP 2 OF 2</Text>
                <Text style={styles.stepProgressLabel}>TIME & COURT</Text>
              </View>
              <View style={styles.stepProgressTrack}>
                <View style={[styles.stepProgressFill, { width: '100%' }]} />
              </View>
            </View>

            {/* Big, unmissable way back to step 1 */}
            <TouchableOpacity
              style={styles.bigBackBtn}
              onPress={() => setStep(1)}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.onPrimary} />
              <View style={styles.bigBackCopy}>
                <Text style={styles.bigBackText}>BACK · DATE & SPORT</Text>
                <Text style={styles.bigBackSub} numberOfLines={1}>
                  {selectedDateObj.dateSub} · {selectedActivity?.sportLabel || 'Activity'}
                </Text>
              </View>
            </TouchableOpacity>

        {/* 03 — TIME */}
        <Animated.View entering={FadeInDown.delay(150).duration(320).damping(24)}>
          <View style={styles.sessionStep}>
            <View style={styles.stepHead}>
              <Text style={styles.stepNumber}>03</Text>
              <Text style={styles.stepTitle}>Pick a time</Text>
              <TouchableOpacity
                style={[styles.hideFullBtn, hideFull && styles.hideFullBtnActive]}
                onPress={() => setHideFull((v) => !v)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={hideFull ? 'checkmark-circle' : 'filter-outline'}
                  size={12}
                  color={hideFull ? COLORS.primary : COLORS.muted}
                />
                <Text style={[styles.hideFullText, hideFull && { color: COLORS.primary }]}>
                  AVAILABLE
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.periodTabs}>
              {(['MORNING', 'AFTERNOON', 'EVENING'] as SlotPeriod[]).map((period) => {
                const count = periodBuckets[period]?.length || 0;
                const isSelected = activePeriod === period;
                return (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodTab,
                      isSelected && styles.periodTabActive,
                      count === 0 && { opacity: 0.35 },
                    ]}
                    onPress={() => setActivePeriod(period)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.periodTabText, isSelected && styles.periodTabTextActive]}>
                      {PERIOD_META[period].short}
                    </Text>
                    <Text style={[styles.periodTabCount, isSelected && styles.periodTabCountActive]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {currentPeriodSlots.length === 0 ? (
              <View style={styles.emptyPeriod}>
                <Ionicons name="time-outline" size={22} color={COLORS.meta} />
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
                        styles.timeSlot,
                        isSelected && styles.timeSlotSelected,
                        !slot.available && styles.timeSlotDisabled,
                      ]}
                      onPress={() => slot.available && setSelectedSlot(slot)}
                      disabled={!slot.available}
                      activeOpacity={0.85}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.onPrimary} />}
                      <Text
                        style={[
                          styles.timeSlotClock,
                          isSelected && { color: COLORS.onPrimary },
                          !slot.available && styles.timeSlotClockDisabled,
                        ]}
                      >
                        {slot.time}
                      </Text>
                      <View
                        style={[
                          styles.timeSlotDot,
                          {
                            backgroundColor: isSelected
                              ? COLORS.onPrimary
                              : !slot.available
                                ? COLORS.error
                                : COLORS.success,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.timeSlotSub,
                          isSelected && { color: 'rgba(10,11,13,0.65)' },
                          !slot.available && { color: COLORS.meta },
                        ]}
                      >
                        {statusLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>

        {/* 04 — COURT */}
        <Animated.View entering={FadeInDown.delay(180).duration(320).damping(24)}>
          <View style={styles.sessionStep}>
            <View style={styles.stepHead}>
              <Text style={styles.stepNumber}>04</Text>
              <Text style={styles.stepTitle}>Choose a court</Text>
              <Text style={styles.stepMeta}>AT {activeSlot.time}</Text>
            </View>

            <View style={styles.courtList}>
              {(selectedActivity?.courts || []).map((court) => {
                const isSelected = selectedCourt?.id === court.id;
                const booked = bookedCountFor(court.name, activeSlot.rawTime);
                const freeSpots = Math.max(0, courtCapacity - booked);
                const isFull = freeSpots === 0;

                return (
                  <TouchableOpacity
                    key={court.id}
                    style={[
                      styles.courtOption,
                      isSelected && styles.optionSelected,
                      isFull && styles.courtOptionFull,
                    ]}
                    onPress={() => !isFull && setSelectedCourt(court)}
                    disabled={isFull}
                    activeOpacity={0.85}
                  >
                    <View style={styles.courtCopy}>
                      <Text style={[styles.courtName, isFull && { color: COLORS.muted }]} numberOfLines={1}>
                        {court.name}
                      </Text>
                      <Text style={styles.courtMeta}>
                        {courtCapacity === 1 ? 'Hourly slot' : `Capacity ${courtCapacity} players`}
                      </Text>
                    </View>
                    <Text style={[styles.courtSlots, isFull && { color: COLORS.meta }]}>
                      {isFull ? 'FULL' : courtCapacity === 1 ? 'AVAILABLE' : `${freeSpots} FREE`}
                    </Text>
                    <View style={[styles.optionCheck, styles.courtCheck, isSelected && styles.optionCheckActive]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color={COLORS.onPrimary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* SUMMARY */}
        <Animated.View entering={FadeInDown.delay(210).duration(320).damping(24)}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>Your session</Text>
              <View
                style={[
                  styles.summaryStatus,
                  isBookingAllowed && styles.summaryStatusReady,
                ]}
              >
                <Text
                  style={[
                    styles.summaryStatusText,
                    isBookingAllowed && { color: COLORS.success },
                  ]}
                >
                  {isBookingAllowed ? 'READY' : 'NOT READY'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Activity</Text>
                <Text style={styles.summaryValue}>{selectedActivity?.sportLabel || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Court</Text>
                <Text style={styles.summaryValue}>{selectedCourt?.name || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Date & time</Text>
                <Text style={styles.summaryValue}>
                  {selectedDateObj.dateSub} · {activeSlot.time}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Duration</Text>
                <Text style={styles.summaryValue}>{effectiveDuration} min</Text>
              </View>
            </View>

            <View style={styles.priceRows}>
              <View style={styles.priceRow}>
                <Text style={styles.priceKey}>Credits required</Text>
                <View style={styles.priceValueRow}>
                  <Text style={styles.priceValue}>{requiredCredits}</Text>
                  <CreditIcon size={13} />
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceKey}>Available balance</Text>
                <View style={styles.priceValueRow}>
                  <Text style={styles.priceValue}>{userCreditBalance}</Text>
                  <CreditIcon size={13} />
                </View>
              </View>
              <View style={[styles.priceRow, styles.priceRowTotal]}>
                <Text style={styles.priceTotalKey}>Balance after booking</Text>
                <View style={styles.priceValueRow}>
                  <Text style={styles.priceTotalValue}>
                    {Math.max(0, userCreditBalance - requiredCredits)}
                  </Text>
                  <CreditIcon size={15} />
                </View>
              </View>
            </View>

            {!isActivityIncluded && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                <Text style={styles.warningText}>
                  {selectedActivity?.sportLabel} is not covered by your current pass. Visit reception to upgrade.
                </Text>
              </View>
            )}

            {!isBalanceSufficient && isActivityIncluded && (
              <View style={styles.warningBanner}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                <Text style={styles.warningText}>
                  Insufficient credits ({userCreditBalance} available, {requiredCredits} required). Top up at reception.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Sticky bottom action bar — always visible, never scrolls away. */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {step === 1 ? (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => setStep(2)}
            activeOpacity={0.88}
          >
            <Text style={styles.continueText}>CONTINUE · TIME & COURT</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.onPrimary} />
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.swipeHint}>
              {isBookingAllowed
                ? 'Review your session, then swipe to confirm.'
                : bookingBlockedReason
                  ? bookingBlockedReason.replace(/_/g, ' ').toLowerCase()
                  : 'Choose a court and time to continue.'}
            </Text>
            <SwipeToBook
              onSwipeComplete={handleConfirmSwipe}
              disabled={!isBookingAllowed}
              isSubmitting={isSubmitting}
              requiredCredits={requiredCredits}
              disabledReason={bookingBlockedReason}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SPACING.containerPadding,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    color: COLORS.paper,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 4,
  },
  sessionHero: {
    paddingTop: 4,
  },
  sessionTitle: {
    marginTop: 6,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 42,
    lineHeight: 39,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  planDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  planChipCopy: {
    minWidth: 0,
    gap: 1,
  },
  planChipName: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 14,
  },
  planChipMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  venueThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceBright,
  },
  venueThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  venueName: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  venueAddr: {
    marginTop: 2,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    lineHeight: 14,
  },
  balanceBadge: {
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceBright,
  },
  balanceBadgeLabel: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
  },
  balanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  balanceBadgeVal: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 18,
  },
  sessionStep: {
    marginTop: 26,
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stepNumber: {
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  stepTitle: {
    flex: 1,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 23,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  stepMeta: {
    color: COLORS.meta,
    fontFamily: FONTS.bold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dateOption: {
    flex: 1,
    gap: 3,
    minHeight: 70,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 30,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#17110D',
  },
  dateOptionLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dateOptionDate: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 23,
    lineHeight: 23,
    letterSpacing: 0.3,
  },
  dateOptionMonth: {
    fontSize: 16,
    color: COLORS.muted,
  },
  optionCheck: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  durationSwitch: {
    flexDirection: 'row',
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  durationPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  durationPillActive: {
    backgroundColor: COLORS.primary,
  },
  durationText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  durationTextActive: {
    color: COLORS.onPrimary,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityOption: {
    width: '48.5%',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 84,
    padding: 12,
    paddingRight: 34,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  activityOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityOptionName: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  activityPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  activityPrice: {
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: 21,
    lineHeight: 21,
  },
  activityPriceUnit: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 8.5,
  },
  hideFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
  },
  hideFullBtnActive: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryMuted,
  },
  hideFullText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  periodTabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginBottom: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
  },
  periodTabText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  periodTabTextActive: {
    color: COLORS.onPrimary,
  },
  periodTabCount: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 8,
  },
  periodTabCountActive: {
    color: 'rgba(10,11,13,0.6)',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '31.5%',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  timeSlotSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  timeSlotDisabled: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    opacity: 0.65,
  },
  timeSlotClock: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    lineHeight: 15,
  },
  timeSlotClockDisabled: {
    color: COLORS.meta,
    textDecorationLine: 'line-through',
  },
  timeSlotDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  timeSlotSub: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 7.5,
    lineHeight: 9,
    letterSpacing: 0.4,
  },
  emptyPeriod: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 22,
  },
  emptyPeriodText: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  courtList: {
    gap: 8,
  },
  courtOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 66,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  courtOptionFull: {
    borderColor: COLORS.lineSoft,
    backgroundColor: 'transparent',
  },
  courtCheck: {
    position: 'relative',
    top: undefined,
    right: undefined,
    marginLeft: 2,
  },
  courtCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  courtName: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  courtMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 14,
  },
  courtSlots: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryCard: {
    gap: 12,
    marginTop: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.panel,
    backgroundColor: COLORS.surface,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 23,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  summaryStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
  },
  summaryStatusReady: {
    borderColor: 'rgba(123,217,154,0.28)',
    backgroundColor: 'rgba(123,217,154,0.08)',
  },
  summaryStatusText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  summaryRows: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  summaryKey: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    lineHeight: 14,
  },
  summaryValue: {
    flexShrink: 1,
    color: COLORS.paperDim,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  priceRows: {
    gap: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceRowTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  priceKey: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    color: COLORS.paperDim,
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  priceTotalKey: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  priceTotalValue: {
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 27,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(243,114,127,0.3)',
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(243,114,127,0.08)',
  },
  warningText: {
    flex: 1,
    color: COLORS.error,
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    lineHeight: 16,
  },
  stepProgress: {
    gap: 8,
    marginTop: 18,
    marginBottom: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepProgressStep: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1,
  },
  stepProgressLabel: {
    color: COLORS.meta,
    fontFamily: FONTS.bold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.7,
  },
  stepProgressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: COLORS.line,
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  bigBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.primary,
  },
  bigBackCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  bigBackText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.extraBold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.7,
  },
  bigBackSub: {
    color: 'rgba(10,11,13,0.65)',
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    zIndex: 100,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  continueText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.extraBold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.6,
  },
  swipeHint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
