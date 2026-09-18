import { Facility, MembershipPlan, UserMembership, Booking, CreditTransaction, CategoryType } from '../types';
import { calculateHaversineDistanceKm, formatCalculatedDistance } from '../utils/distance';
import { isSessionPast } from '../utils/bookingStatus';

/**
 * Adapter helper to transform Payload Tenant API response to UI Facility model
 */
export const adaptTenantToFacility = (
  tenant: any,
  userCoords?: { latitude: number; longitude: number }
): Facility => {
  const images: string[] = [];
  if (Array.isArray(tenant.facilityImages)) {
    tenant.facilityImages.forEach((imgObj: any) => {
      const url = imgObj?.facilityImage?.url || imgObj?.url;
      if (url) {
        images.push(url.startsWith('http') ? url : `https://ultim-server.vercel.app${url}`);
      }
    });
  }

  const rawImageUrl = images[0] || tenant.facilityImages?.[0]?.facilityImage?.url;
  const imageUrl = rawImageUrl
    ? rawImageUrl.startsWith('http')
      ? rawImageUrl
      : `https://ultim-server.vercel.app${rawImageUrl}`
    : undefined;

  const sportsTags = tenant.activities && Array.isArray(tenant.activities)
    ? tenant.activities.map((a: any) => typeof a === 'string' ? a : a.activity ? a.activity.charAt(0).toUpperCase() + a.activity.slice(1) : '')
        .filter(Boolean)
    : [];

  const firstCat = tenant.activities?.[0]?.category?.toLowerCase();
  const category: CategoryType =
    firstCat === 'fitness'
      ? 'Fitness'
      : firstCat === 'health'
      ? 'Health'
      : 'Sports';

  // Calculate dynamic distance if coordinates are present
  let computedDistance = tenant.distance || 'Distance N/A';
  let distanceKm: number | undefined = undefined;

  const tenantLng = tenant.location?.[0];
  const tenantLat = tenant.location?.[1];

  if (
    userCoords &&
    typeof userCoords.latitude === 'number' &&
    typeof userCoords.longitude === 'number' &&
    typeof tenantLat === 'number' &&
    typeof tenantLng === 'number'
  ) {
    distanceKm = calculateHaversineDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      tenantLat,
      tenantLng
    );
    computedDistance = formatCalculatedDistance(distanceKm);
  }

  return {
    id: String(tenant.id),
    name: tenant.Facility || 'Sports Facility',
    location: tenant.city || 'Location N/A',
    distance: computedDistance,
    distanceKm,
    rating: tenant.rating || 0,
    reviewsCount: tenant.reviewsCount || 0,
    imageUrl,
    images,
    category,
    sportTags: sportsTags,
    operatingHours: tenant.operatingHours || 'Hours N/A',
    description: tenant.description || `Sports and fitness center located in ${tenant.city || 'your area'}.`,
    address: tenant.city ? `${tenant.Facility}, ${tenant.city}` : tenant.Facility || 'Facility Address',
    amenities: Array.isArray(tenant.amenities)
      ? tenant.amenities
      : [],
    activities: Array.isArray(tenant.activities) ? tenant.activities : [],
    rawLocation: tenant.location,
    latitude: typeof tenantLat === 'number' ? tenantLat : undefined,
    longitude: typeof tenantLng === 'number' ? tenantLng : undefined,
  };
};

/**
 * Adapter helper to transform Payload Membership Plan response to UI Plan model
 */
export const adaptMembershipPlan = (plan: any, facilityName?: string): MembershipPlan => {
  const actualPrice = Number(plan.planPrice) > 0 ? Number(plan.planPrice) : undefined;
  const discounted = Number(plan.discountedPrice) > 0 ? Number(plan.discountedPrice) : undefined;
  const hasDiscount = !!discounted && !!actualPrice && discounted < actualPrice;
  const sellingPrice = hasDiscount ? discounted : actualPrice;

  return {
    id: String(plan.id),
    facilityId: String(plan.tenant?.id || plan.tenant || '1'),
    facilityName: facilityName || plan.tenant?.Facility || 'Center',
    title: plan.planName || 'Membership Plan',
    creditsGranted: plan.creditsOffered || 0,
    validActivities: plan.supportedActivities || [],
    durationDays: (parseInt(plan.Duration || '1', 10) || 1) * 30,
    price: sellingPrice ? String(sellingPrice) : 'Price on Request',
    originalPrice: hasDiscount ? String(actualPrice) : undefined,
    hasDiscount,
    description: plan.description || 'Access membership plan for facility activities.',
    features: [
      plan.creditsOffered ? `${plan.creditsOffered} Credits Granted` : 'Credit Allocated On-Site',
      plan.supportedActivities?.length ? `Valid for: ${plan.supportedActivities.join(', ')}` : 'Center Access',
      'Visit Center Desk to Register & Activate',
    ],
  };
};

/**
 * Adapter helper to transform Payload Membership response to UI UserMembership model
 */
export const adaptMembership = (m: any): UserMembership => {
  const isExpired = m.endDate ? new Date() > new Date(m.endDate) : false;
  return {
    id: String(m.id),
    facilityId: String(m.tenant?.id || m.tenant || '1'),
    facilityName: m.tenant?.Facility || m.membershipPlanName || 'Partner Facility',
    planTitle: m.membershipPlanName || m.membershipPlan?.planName || 'Active Pass',
    totalCredits: m.membershipPlan?.creditsOffered || m.availableCredits || 0,
    remainingCredits: m.availableCredits ?? 0,
    expiryDate: m.endDate ? m.endDate.split('T')[0] : 'N/A',
    activatedDate: m.startDate ? m.startDate.split('T')[0] : 'N/A',
    status: isExpired ? 'EXPIRED' : 'ACTIVE',
    validActivities: (() => {
      const supported = m.membershipPlan?.supportedActivities || m.supportedActivities;
      if (Array.isArray(supported) && supported.length > 0) {
        return supported.map((a: any) => (typeof a === 'string' ? a.toLowerCase() : String(a)));
      }
      return ['gym', 'swimming', 'badminton', 'pickleball'];
    })(),
    timeSlots: Array.isArray(m.membershipPlan?.timeSlots) ? m.membershipPlan.timeSlots : [],
  };
};

/**
 * Adapter helper to transform Payload Booking response to UI Booking model
 */
export const adaptBooking = (b: any): Booking => {
  const sessionDateStr = b.sessionDate ? b.sessionDate.split('T')[0] : 'N/A';
  const isToday = sessionDateStr === new Date().toISOString().split('T')[0];

  const rawImage = b.tenant?.facilityImages?.[0]?.facilityImage?.url;
  const facilityImage = rawImage
    ? rawImage.startsWith('http')
      ? rawImage
      : `https://ultim-server.vercel.app${rawImage}`
    : undefined;

  const dateStr = isToday ? 'Today' : sessionDateStr;
  const timeSlotLabel = b.sessionTime === 'GYM_ALL_DAY' ? 'Open Access (All Day)' : `${b.sessionTime || 'N/A'} (${b.duration || 60}m)`;
  const durationMins = (b.duration as 60 | 120) || 60;

  // Classify by the session's actual end time (day-granular — a booking
  // only becomes PAST once its calendar day has fully elapsed), instead of
  // the previous naive "not today = PAST" check which incorrectly marked
  // future-dated bookings as past.
  const status: Booking['status'] = b.status === 'cancelled'
    ? 'CANCELLED'
    : isSessionPast(dateStr, timeSlotLabel, durationMins)
    ? 'PAST'
    : 'UPCOMING';

  return {
    id: String(b.id),
    facilityId: String(b.tenant?.id || b.tenant || '1'),
    facilityName: b.tenant?.Facility || 'Facility',
    facilityAddress: b.tenant?.city ? `${b.tenant.Facility}, ${b.tenant.city}` : 'Facility Address N/A',
    sportType: b.activity ? b.activity.toUpperCase() : 'SESSION',
    courtName: b.court || 'Main Floor',
    dateStr,
    timeSlotLabel,
    durationMins,
    creditsSpent: b.creditsSpent || b.credits || (b.duration ? Math.ceil(b.duration / 60) * 100 : 100),
    qrCodePayload: b.qrCode || `ULTIM-QR-${b.id}`,
    status,
    createdAt: b.createdAt || new Date().toISOString(),
    facilityImage,
    successfulCheckedInTime: b.successfulCheckedInTime || b.successfulCheckInTime || b.checkedInAt || null,
    successfulCheckedOutTime: b.successfulCheckedOutTime || b.successfulCheckOutTime || b.checkedOutAt || null,
  };
};

/**
 * Adapter helper to transform Payload Transaction response to UI CreditTransaction model
 */
export const adaptTransaction = (tx: any): CreditTransaction => {
  return {
    id: String(tx.id),
    type: 'SPENT_BOOKING',
    credits: tx.transactionAmount ? -Math.round(tx.transactionAmount) : 0,
    description: `Transaction (${tx.paymentMethod?.toUpperCase() || 'OFFLINE'})`,
    date: tx.transactionDate ? tx.transactionDate.replace('T', ' ').slice(0, 16) : 'N/A',
    facilityName: tx.membershipPlan?.planName || 'Facility Service',
  };
};
