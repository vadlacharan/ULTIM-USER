export type CategoryType = 'Fitness' | 'Sports' | 'Sport' | 'Health' | 'All';

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface TenantCourt {
  id: string;
  name: string;
}

export interface TenantActivity {
  id: string;
  activity: string;
  category: string;
  creditsPer60Minutes: number;
  active: boolean;
  capacityPerCourt?: number;
  courts?: TenantCourt[];
}

export interface Facility {
  id: string;
  name: string;
  location: string;
  distance: string;
  distanceKm?: number;
  rating: number;
  reviewsCount: number;
  imageUrl?: string;
  images?: string[];
  category: CategoryType;
  sportTags: string[];
  amenities: Amenity[];
  operatingHours: string;
  /** Short marketing description provided by the center (Payload: tenants.description). */
  description: string;
  address: string;
  activities?: TenantActivity[];
  rawLocation?: [number, number]; // [lng, lat]
  latitude?: number;
  longitude?: number;
}

export interface MembershipPlanTimeSlot {
  id: string;
  slotStartTime: string;
}

export interface MembershipPlan {
  id: string;
  facilityId: string;
  facilityName: string;
  title: string;
  creditsGranted: number;
  validActivities: string[];
  durationDays: number;
  /** Selling price (discountedPrice when an offer exists, otherwise the actual price). */
  price: string;
  /** Actual/list price before the offer — shown struck through when a discount exists. */
  originalPrice?: string;
  /** True when the plan currently has a discounted price. */
  hasDiscount?: boolean;
  description: string;
  features: string[];
  timeSlots?: MembershipPlanTimeSlot[];
}

export interface UserMembership {
  id: string;
  facilityId: string;
  facilityName: string;
  planTitle: string;
  totalCredits: number;
  remainingCredits: number;
  expiryDate: string;
  activatedDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  validActivities?: string[];
  timeSlots?: MembershipPlanTimeSlot[];
  tenant?: Facility;
}

export interface ZoneCourt {
  id: string;
  name: string;
  type: string;
  available: boolean;
}

export interface TimeSlot {
  id: string;
  timeLabel: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  sportType: string;
  courtName: string;
  dateStr: string;
  timeSlotLabel: string;
  durationMins: 60 | 120;
  creditsSpent: number;
  qrCodePayload: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  createdAt: string;
  facilityImage?: string;
  successfulCheckedInTime?: string | null;
  successfulCheckedOutTime?: string | null;
  qrMode?: 'CHECK_IN' | 'CHECK_OUT';
}

export interface CreditTransaction {
  id: string;
  type: 'EARNED_OFFLINE' | 'SPENT_BOOKING';
  credits: number;
  description: string;
  date: string;
  facilityName: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'BOOKING' | 'CREDIT' | 'MEMBERSHIP';
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  avatarUrl?: string;
}
