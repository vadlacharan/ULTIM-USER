import React, { useState, useMemo, useEffect } from 'react';
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
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { StatusBadge } from '../components/StatusBadge';
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

export const BookingFlowScreen: React.FC<BookingFlowScreenProps> = ({ route, navigation }) => {
  const { facilityId } = route.params || {};
  const { facilities, userMemberships, bookings, bookSession, refreshData, colors } = useApp();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic Facility loader: Find in current facilities or fetch directly by ID
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
  const activeMembership = userMemberships.find(
    (m) => String(m.facilityId) === String(facility?.id) && m.status === 'ACTIVE'
  ) || userMemberships.find((m) => m.status === 'ACTIVE') || userMemberships[0];

  // Parse activities available at this facility
  const availableActivities = useMemo(() => {
    const list: {
      activityKey: string;
      sportLabel: string;
      creditsPer60Mins: number;
      isIncludedInPlan: boolean;
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

        const courtsList = act.courts && Array.isArray(act.courts) && act.courts.length > 0
          ? act.courts.map((c) => ({ id: c.id, name: c.name.trim() }))
          : [{ id: `floor-${actKey}`, name: `${sportLabel} Open Access` }];

        list.push({
          activityKey: actKey,
          sportLabel,
          creditsPer60Mins: creditsRate,
          isIncludedInPlan: true,
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
        courts: [{ id: 'gym-main', name: 'Main Gym Floor' }],
      });
    }

    return list;
  }, [facility, activeMembership]);

  // Selected Activity State
  const [selectedActivity, setSelectedActivity] = useState(availableActivities[0]);

  useEffect(() => {
    if (availableActivities.length > 0) {
      const firstIncluded = availableActivities.find((a) => a.isIncludedInPlan) || availableActivities[0];
      setSelectedActivity(firstIncluded);
    }
  }, [availableActivities]);

  // Selected Court for the chosen activity
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

    const formatDateSub = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    const toISODate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return [
      { label: 'Today', dayName: 'TODAY', dateSub: formatDateSub(today), isoDate: toISODate(today) },
      { label: 'Tomorrow', dayName: 'TOMORROW', dateSub: formatDateSub(tomorrow), isoDate: toISODate(tomorrow) },
      { label: 'Day 3', dayName: d3DayName(day3), dateSub: formatDateSub(day3), isoDate: toISODate(day3) },
    ];
  }, []);

  function d3DayName(d: Date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()].toUpperCase();
  }

  const [selectedDate, setSelectedDate] = useState<string>('Today');
  const [duration, setDuration] = useState<60 | 120>(60);

  // Dynamic Time Slots - ONLY Start Time (e.g. 05:00 AM)
  const timeSlots = useMemo(() => {
    if (activeMembership?.timeSlots && Array.isArray(activeMembership.timeSlots) && activeMembership.timeSlots.length > 0) {
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
          isAvailable: true,
        };
      });
    }

    return [
      { id: 's1', time: '05:00 AM', rawTime: '05:00', isAvailable: true },
      { id: 's2', time: '06:00 AM', rawTime: '06:00', isAvailable: true },
      { id: 's3', time: '07:00 AM', rawTime: '07:00', isAvailable: true },
      { id: 's4', time: '08:00 AM', rawTime: '08:00', isAvailable: true },
      { id: 's5', time: '05:00 PM', rawTime: '17:00', isAvailable: true },
      { id: 's6', time: '06:00 PM', rawTime: '18:00', isAvailable: true },
    ];
  }, [activeMembership]);

  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);

  useEffect(() => {
    if (timeSlots.length > 0) {
      setSelectedSlot(timeSlots[0]);
    }
  }, [timeSlots]);

  // Check if user already booked this specific slot
  const isAlreadyBookedForSelectedSlot = useMemo(() => {
    const selectedDateObj = dates.find((d) => d.label === selectedDate) || dates[0];
    const targetISODate = selectedDateObj.isoDate;
    const targetTime = selectedSlot?.rawTime || selectedSlot?.time;

    // A booking's dateStr can be the literal string "Today" rather than an
    // ISO date, so normalize it before comparing against the target date.
    const normalizeDateStr = (dateStr: string): string => {
      if (dateStr === 'Today') {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return dateStr.split('T')[0];
    };

    return bookings.some((b) => {
      if (b.status === 'CANCELLED') return false;
      const bDate = b.dateStr ? normalizeDateStr(b.dateStr) : '';
      const bTime = b.timeSlotLabel ? b.timeSlotLabel.split(' ')[0] : '';
      const isSameDate = bDate === targetISODate;
      const isSameTime = bTime === targetTime || b.timeSlotLabel === selectedSlot?.time;
      return isSameDate && isSameTime;
    });
  }, [bookings, dates, selectedDate, selectedSlot]);

  // Credit calculation
  const requiredCredits = (duration / 60) * (selectedActivity?.creditsPer60Mins || 100);
  const userCreditBalance = activeMembership ? activeMembership.remainingCredits : 0;
  const isBalanceSufficient = userCreditBalance >= requiredCredits;
  const isActivityIncluded = selectedActivity?.isIncludedInPlan !== false;
  const isBookingAllowed = isBalanceSufficient && isActivityIncluded && !isAlreadyBookedForSelectedSlot && !isSubmitting;

  // Surface the *actual* reason booking is blocked, instead of always
  // showing "INSUFFICIENT CREDITS" regardless of the real cause.
  const bookingBlockedReason = isAlreadyBookedForSelectedSlot
    ? 'SLOT ALREADY BOOKED'
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
        `You already have an active booking for ${selectedSlot?.time} on ${selectedDate}. Please select another time slot or date.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedDateObj = dates.find((d) => d.label === selectedDate) || dates[0];

      const res = await bookSession({
        facilityId: facility.id,
        facilityName: facility.name,
        facilityAddress: facility.address,
        sportType: selectedActivity.activityKey,
        courtName: selectedCourt?.name || 'Main Floor',
        dateStr: selectedDateObj.isoDate,
        timeSlotLabel: selectedSlot?.rawTime || selectedSlot?.time,
        durationMins: duration,
        creditsSpent: requiredCredits,
        facilityImage: facility.imageUrl,
      });

      await refreshData();

      if (res.success) {
        Alert.alert(
          'Session Booked!',
          `Your slot for ${selectedActivity.sportLabel} (${selectedCourt?.name}, ${selectedSlot.time}) is confirmed! Check your Bookings tab for entry QR code.`,
          [
            {
              text: 'VIEW BOOKING & QR',
              onPress: () =>
                navigation.navigate('MainTabs', { screen: 'BookingsTab' }),
            },
          ]
        );
      } else {
        const isPlanError = res.error?.includes('membership plan') || res.error?.includes('not included');
        Alert.alert(
          isPlanError ? 'Activity Not Included' : 'Booking Rejected',
          isPlanError
            ? `This activity (${selectedActivity?.sportLabel}) is not included in your active membership plan (${activeMembership?.planTitle || 'Current Plan'}). Please check your pass details or upgrade at reception.`
            : (res.error || `Unable to book ${selectedActivity.sportLabel}. Check your membership active status or credit balance.`)
        );
      }
    } catch (e: any) {
      Alert.alert('Booking Error', e?.message || 'An unexpected error occurred while confirming booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingFacility && !facility) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20), justifyContent: 'center' }]}>
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!facility) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20) }]}>
        <AppBackground />
        <Text style={{ color: colors.onSurface, textAlign: 'center', marginTop: 40 }}>Facility not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      {/* Top Header with Safe Area Inset */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 6,
            backgroundColor: 'rgba(10,10,14,0.88)',
            borderBottomColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <IconButton
          icon="arrow-back"
          size={38}
          iconSize={20}
          iconColor={colors.onSurface}
          backgroundColor={colors.glassHigh}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>Reserve Session Slot</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Facility & Plan Summary Header */}
        <View
          style={[
            styles.facilityHeaderCard,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
        >
          <View style={styles.facilityMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.facilityName, { color: colors.onSurface }]}>{facility.name}</Text>
              <Text style={[styles.facilityAddress, { color: colors.textMuted }]}>{facility.address}</Text>
            </View>
            {facility.category && (
              <View style={[styles.catBadge, { backgroundColor: colors.glassHigh, borderColor: colors.glassBorder }]}>
                <Text style={[styles.catBadgeText, { color: colors.primary }]}>{facility.category.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {activeMembership && (
            <View style={[styles.activePlanRow, { borderTopColor: 'rgba(255,255,255,0.10)' }]}>
              <View style={styles.planPillLeft}>
                <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
                <Text style={[styles.activePlanTitle, { color: colors.onSurface }]}>
                  {activeMembership.planTitle}
                </Text>
              </View>

            </View>
          )}
        </View>

        {/* Date Selector */}
        <View style={styles.stepHeaderRow}>
          <Text style={[styles.stepTitle, { color: colors.onSurface }]}>SELECT DATE</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>3-Day Window</Text>
        </View>

        <View style={styles.dateRow}>
          {dates.map((d) => {
            const isSelected = selectedDate === d.label;
            return (
              <TouchableOpacity
                key={d.label}
                style={[
                  styles.dateChip,
                  { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                  isSelected && [styles.selectedDateChip, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setSelectedDate(d.label)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dateChipName,
                    { color: colors.textMuted },
                    isSelected && styles.selectedDateText,
                  ]}
                >
                  {d.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateChipSub,
                    { color: colors.textMuted },
                    isSelected && styles.selectedDateSubText,
                  ]}
                >
                  {d.dateSub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Activity Selector */}
        <View style={styles.stepHeaderRow}>
          <Text style={[styles.stepTitle, { color: colors.onSurface }]}>SPORT / ACTIVITY</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll} contentContainerStyle={{ paddingRight: 4 }}>
          {availableActivities.map((act) => {
            const isSelected = selectedActivity?.activityKey === act.activityKey;
            return (
              <TouchableOpacity
                key={act.activityKey}
                style={[
                  styles.zoneChip,
                  { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                  isSelected && [styles.selectedZoneChip, { borderColor: colors.primary, backgroundColor: colors.glassHigh }],
                  !act.isIncludedInPlan && styles.unsupportedZoneChip,
                ]}
                onPress={() => setSelectedActivity(act)}
                activeOpacity={0.8}
              >
                <View style={styles.zoneTopRow}>
                  <MaterialCommunityIcons
                    name={getActivityIcon(act.activityKey || act.sportLabel)}
                    size={14}
                    color={isSelected ? colors.primary : colors.secondary}
                  />
                  <Text
                    style={[
                      styles.zoneName,
                      { color: colors.onSurface },
                      isSelected && { color: colors.primary },
                    ]}
                  >
                    {act.sportLabel}
                  </Text>
                </View>
                <View style={styles.zoneRateRow}>
                  <Text style={[styles.zoneRateVal, { color: isSelected ? colors.primary : colors.onSurface }]}>
                    {act.creditsPer60Mins}
                  </Text>
                  <CreditIcon size={14} />
                  <Text style={[styles.zoneRateSub, { color: colors.textMuted }]}>/ HOUR</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Court / Floor Selector */}
        <View style={styles.stepHeaderRow}>
          <Text style={[styles.stepTitle, { color: colors.onSurface }]}>COURT / FLOOR</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            {selectedActivity?.courts?.length || 0} Available
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll} contentContainerStyle={{ paddingRight: 4 }}>
          {selectedActivity?.courts.map((court) => {
            const isSelected = selectedCourt?.id === court.id;
            return (
              <TouchableOpacity
                key={court.id}
                style={[
                  styles.courtChip,
                  { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                  isSelected && [styles.selectedCourtChip, { borderColor: colors.primary, backgroundColor: colors.glassHigh }],
                ]}
                onPress={() => setSelectedCourt(court)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="navigate-circle-outline"
                  size={16}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.courtName,
                    { color: colors.onSurface },
                    isSelected && { color: colors.primary },
                  ]}
                >
                  {court.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Duration Selector */}
        <View style={styles.stepHeaderRow}>
          <Text style={[styles.stepTitle, { color: colors.onSurface }]}>SESSION DURATION</Text>
        </View>

        <View style={styles.durationRow}>
          <TouchableOpacity
            style={[
              styles.durationBtn,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              duration === 60 && [styles.activeDurationBtn, { backgroundColor: colors.primary, borderColor: colors.primary }],
            ]}
            onPress={() => setDuration(60)}
            activeOpacity={0.8}
          >
            <Text style={[styles.durationTitle, { color: colors.textMuted }, duration === 60 && styles.activeDurationTitle]}>
              60 MINS
            </Text>
            <Text style={[styles.durationSub, { color: colors.textMuted }, duration === 60 && styles.activeDurationSub]}>
              Standard 1 Hr
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.durationBtn,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              duration === 120 && [styles.activeDurationBtn, { backgroundColor: colors.primary, borderColor: colors.primary }],
            ]}
            onPress={() => setDuration(120)}
            activeOpacity={0.8}
          >
            <Text style={[styles.durationTitle, { color: colors.textMuted }, duration === 120 && styles.activeDurationTitle]}>
              120 MINS
            </Text>
            <Text style={[styles.durationSub, { color: colors.textMuted }, duration === 120 && styles.activeDurationSub]}>
              Extended 2 Hrs (2x Credits)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Slots */}
        <View style={styles.stepHeaderRow}>
          <Text style={[styles.stepTitle, { color: colors.onSurface }]}>AVAILABLE TIME SLOTS</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            {timeSlots.length} Slots
          </Text>
        </View>

        <View style={styles.slotGrid}>
          {timeSlots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotChip,
                  { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                  isSelected && [styles.selectedSlotChip, { borderColor: colors.primary, backgroundColor: colors.glassHigh }],
                  !slot.isAvailable && [styles.disabledSlotChip, { backgroundColor: colors.glassHigh }],
                ]}
                onPress={() => slot.isAvailable && setSelectedSlot(slot)}
                disabled={!slot.isAvailable}
                activeOpacity={0.8}
              >
                <View style={styles.slotTimeRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.slotTimeText,
                      { color: colors.onSurface },
                      isSelected && { color: colors.primary },
                      !slot.isAvailable && { color: colors.textMuted },
                    ]}
                  >
                    {slot.time}
                  </Text>
                </View>
                {!slot.isAvailable && <Text style={[styles.bookedTag, { color: colors.error }]}>FULL</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ticket-Style Summary Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.emberPanel, borderColor: colors.emberBorder },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: colors.onSurface }]}>BOOKING SUMMARY</Text>
            <StatusBadge label={selectedActivity?.sportLabel || 'SESSION'} type="active" />
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Date & Start Time</Text>
            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
              {selectedDate} • {selectedSlot?.time} ({duration}m)
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Selected Court</Text>
            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
              {selectedCourt?.name || 'Main Court'}
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />

          {/* Credits Calculation */}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Required Credits</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.creditsReqVal, { color: colors.onSurface }]}>{requiredCredits}</Text>
              <CreditIcon size={18} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Your Pass Balance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={[
                  styles.creditsBalVal,
                  { color: isBalanceSufficient ? colors.secondary : colors.error },
                ]}
              >
                {userCreditBalance}
              </Text>
              <CreditIcon size={18} />
            </View>
          </View>

          {!isActivityIncluded && (
            <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                {selectedActivity?.sportLabel} is not covered in your current plan ({activeMembership?.planTitle || 'Active Plan'}). Please upgrade at center reception desk.
              </Text>
            </View>
          )}

          {!isBalanceSufficient && isActivityIncluded && (
            <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                Insufficient credit balance ({userCreditBalance} available vs {requiredCredits} required). Please visit reception desk to top up.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Fixed Bottom Footer Container (Z-Axis / Floating Above Screen) */}
      <View
        style={[
          styles.fixedFooter,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: 'rgba(10,10,14,0.88)',
            borderTopColor: 'rgba(255,255,255,0.10)',
          },
        ]}
      >
        <View style={styles.fixedFooterSummary}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.fixedCostLabel, { color: colors.textMuted }]}>Cost:</Text>
            <Text style={[styles.fixedCostVal, { color: colors.onSurface }]}>{requiredCredits}</Text>
            <CreditIcon size={16} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.fixedCostLabel, { color: colors.textMuted }]}>Balance:</Text>
            <Text
              style={[
                styles.fixedCostVal,
                { color: isBalanceSufficient ? colors.secondary : colors.error },
              ]}
            >
              {userCreditBalance}
            </Text>
            <CreditIcon size={16} />
          </View>
        </View>

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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },

  topBarTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  scrollContent: {
    padding: SPACING.containerPadding,
    paddingBottom: 170, // Extra bottom padding so scroll content doesn't get covered by fixed footer
  },
  facilityHeaderCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  facilityMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  facilityName: {
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  facilityAddress: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 17,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginLeft: 8,
  },
  catBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  planPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePlanTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  planCreditsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceVal: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginLeft: 2,
  },
  // Step headers
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  stepTitle: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  // Date selector
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  dateChip: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  selectedDateChip: {
    elevation: 2,
  },
  dateChipName: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  dateChipSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  selectedDateText: {
    color: '#FFF',
  },
  selectedDateSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  // Scrollable chips (Activities / Courts)
  zoneScroll: {
    marginBottom: 4,
  },
  zoneChip: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1.5,
    minWidth: 110,
  },
  selectedZoneChip: {},
  unsupportedZoneChip: {
    opacity: 0.5,
  },
  zoneTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoneName: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  zoneRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  zoneRateVal: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
  },
  zoneRateSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  courtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1.5,
  },
  selectedCourtChip: {},
  courtName: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  // Duration selector
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  activeDurationBtn: {},
  durationTitle: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  durationSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  activeDurationTitle: {
    color: '#FFF',
  },
  activeDurationSub: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  // Slot Grid
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  slotChip: {
    width: '48.5%',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  selectedSlotChip: {},
  disabledSlotChip: {
    opacity: 0.45,
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTimeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  bookedTag: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // Summary Ticket Box
  summaryCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  creditsReqVal: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
  },
  creditsBalVal: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.medium,
    lineHeight: 16,
  },
  // Fixed Footer (Z-Index / Floating)
  fixedFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 10,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 100,
  },
  fixedFooterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  fixedCostLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  fixedCostVal: {
    fontSize: 13,
    fontFamily: FONTS.extraBold,
  },
});
