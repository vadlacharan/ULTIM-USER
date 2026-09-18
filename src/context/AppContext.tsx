import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import {
  Facility,
  MembershipPlan,
  UserMembership,
  Booking,
  CreditTransaction,
  NotificationItem,
  UserProfile,
} from '../types';
import { api } from '../services/api';
import {
  adaptTenantToFacility,
  adaptMembershipPlan,
  adaptMembership,
  adaptBooking,
  adaptTransaction,
} from '../services/adapters';

import { COLORS } from '../theme/theme';

interface AppContextType {
  // Theme — single theme-agnostic "Ember on Black" system
  colors: typeof COLORS;

  // Auth
  isAuthenticated: boolean;
  /** Browsing without an account — main tabs are open, actions prompt sign-in. */
  isGuest: boolean;
  continueAsGuest: () => void;
  /** Store-compliance: irreversibly deletes the account server-side + locally. */
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  user: UserProfile | null;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; error?: string; needsName?: boolean; pendingUserId?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, fullName?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateFullName: (userId: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Location
  currentLocation: string;
  setCurrentLocation: (loc: string, nearLngLat?: string, coords?: { latitude: number; longitude: number }) => void;
  userCoords?: { latitude: number; longitude: number };
  nearLngLat?: string;

  // Data Collections
  facilities: Facility[];
  plans: MembershipPlan[];
  userMemberships: UserMembership[];
  bookings: Booking[];
  transactions: CreditTransaction[];
  notifications: NotificationItem[];

  // State flags & errors
  totalActiveCredits: number;
  isLoading: boolean;
  isBootstrapping: boolean;
  isOffline: boolean;
  facilityError: string | null;
  membershipError: string | null;

  // Actions
  bookSession: (params: {
    facilityId: string;
    facilityName: string;
    facilityAddress: string;
    sportType: string;
    courtName: string;
    dateStr: string;
    timeSlotLabel: string;
    durationMins: 60 | 120;
    creditsSpent: number;
    facilityImage?: string;
  }) => Promise<{ success: boolean; error?: string; booking?: Booking }>;

  cancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationAsRead: (id: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SECURE_TOKEN_KEY = 'ultim_auth_token';
const SECURE_USER_KEY = 'ultim_auth_user';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [currentLocation, setCurrentLocationState] = useState<string>('Hyderabad');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  // Total active credits sum
  const totalActiveCredits = userMemberships
    .filter((m) => m.status === 'ACTIVE')
    .reduce((sum, m) => sum + m.remainingCredits, 0);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [nearLngLat, setNearLngLat] = useState<string | undefined>(undefined);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Fetch facilities from Backend API
  const fetchFacilitiesFromBackend = async (
    city?: string,
    near?: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    try {
      setIsLoading(true);
      setFacilityError(null);

      const activeCoords = coords || userCoords;
      const activeNear = near || nearLngLat;
      const activeCity = city || currentLocation;

      if (coords) setUserCoords(coords);
      if (near) setNearLngLat(near);

      // Try fetching with nearLngLat first if available
      let res = await api.getTenants({
        city: activeNear ? undefined : activeCity,
        nearLngLat: activeNear,
        limit: 20,
      }).catch((e) => {
        console.log('[AppContext] getTenants near error:', e);
        return null;
      });

      // Fallback to city search if near query returned 0 results
      if (!res?.docs || res.docs.length === 0) {
        res = await api.getTenants({
          city: activeCity,
          limit: 20,
        }).catch((e) => {
          console.log('[AppContext] getTenants city error:', e);
          return null;
        });
      }

      if (res?.docs && Array.isArray(res.docs)) {
        let adaptedFacilities = res.docs.map((t) => adaptTenantToFacility(t, activeCoords));
        // Sort by nearest distance if calculated
        if (activeCoords) {
          adaptedFacilities = adaptedFacilities.sort((a, b) => {
            if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
              return a.distanceKm - b.distanceKm;
            }
            return 0;
          });
        }
        setFacilities(adaptedFacilities);
        setIsOffline(false);

        if (res.docs.length > 0) {
          const plansRes = await api.getMembershipPlans(res.docs[0].id).catch(() => null);
          if (plansRes?.docs && Array.isArray(plansRes.docs)) {
            const adaptedPlans = plansRes.docs.map((p) => adaptMembershipPlan(p, res.docs[0].Facility));
            setPlans(adaptedPlans);
          }
        } else {
          setPlans([]);
        }
      } else {
        if (facilities.length === 0) {
          setIsOffline(true);
        }
      }
    } catch (e: any) {
      console.log('[AppContext] Facility API error:', e?.message || e);
      setIsOffline(true);
      if (facilities.length === 0) {
        setFacilityError(e?.message || 'Unable to fetch facilities from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profile and data from Backend API
  const fetchUserDataFromBackend = async (userId: string | number) => {
    try {
      setIsLoading(true);
      setMembershipError(null);

      // Verify me token
      const meRes = await api.getMe().catch(() => null);
      if (meRes?.user) {
        setUser({
          id: String(meRes.user.id),
          name: meRes.user.fullName || 'Member',
          phone: meRes.user.phone || '',
          email: meRes.user.email || '',
          location: currentLocation,
        });
        setIsOffline(false);
      }

      // Memberships
      const memRes = await api.getMyMemberships(userId).catch(() => null);
      if (memRes?.docs && Array.isArray(memRes.docs)) {
        setUserMemberships(memRes.docs.map(adaptMembership));
      }

      // Bookings
      const bkRes = await api.getMyBookings(userId).catch(() => null);
      if (bkRes?.docs && Array.isArray(bkRes.docs)) {
        setBookings(bkRes.docs.map(adaptBooking));
      }

      // Transactions
      const txRes = await api.getMyTransactions(userId).catch(() => null);
      if (txRes?.docs && Array.isArray(txRes.docs)) {
        setTransactions(txRes.docs.map(adaptTransaction));
      }
    } catch (e: any) {
      console.log('[AppContext] User Data API error:', e?.message || e);
      setMembershipError(e?.message || 'Unable to load member account data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Restore persisted session then boot the app
    const bootstrapSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
        const storedUserRaw = await SecureStore.getItemAsync(SECURE_USER_KEY);

        if (storedToken && storedUserRaw) {
          api.setToken(storedToken);

          try {
            // Validate the token with server
            const meRes = await api.getMe();
            if (meRes?.user) {
              const restoredUser: UserProfile = {
                id: String(meRes.user.id),
                name: meRes.user.fullName || 'Member',
                phone: meRes.user.phone || '',
                email: meRes.user.email || '',
                location: currentLocation,
              };
              setUser(restoredUser);
              setIsAuthenticated(true);
              setIsGuest(false);
              await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(restoredUser));
              fetchUserDataFromBackend(restoredUser.id);
            }
          } catch (netErr: any) {
            console.log('[Auth Bootstrap Server Check Warning]', netErr?.message || netErr);
            // Network connection offline or server temporary error — RESTORE SESSION FROM CACHE
            try {
              const cachedUser: UserProfile = JSON.parse(storedUserRaw);
              setUser(cachedUser);
              setIsAuthenticated(true);
              setIsGuest(false);
              setIsOffline(true);
            } catch (pErr) {
              console.log('[Auth Cache Restore Error]', pErr);
            }
          }
        }
      } catch (e) {
        console.log('[Auth Bootstrap Error]', e);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapSession();
    fetchFacilitiesFromBackend();

    const initGpsLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (pos?.coords) {
            const { latitude, longitude } = pos.coords;
            const nearStr = `${longitude},${latitude}`;
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => null);
            if (geocode && geocode.length > 0) {
              const place = geocode[0];
              const detectedCity = place.city || place.subregion || place.district || `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
              setCurrentLocation(detectedCity, nearStr, { latitude, longitude });
            } else {
              setCurrentLocation(`${latitude.toFixed(2)},${longitude.toFixed(2)}`, nearStr, { latitude, longitude });
            }
          }
        }
      } catch (e) {
        console.log('[GPS Auto Init Error]', e);
      }
    };

    initGpsLocation();
  }, []);

  const setCurrentLocation = (
    loc: string,
    near?: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    setCurrentLocationState(loc);
    if (near) setNearLngLat(near);
    if (coords) setUserCoords(coords);
    fetchFacilitiesFromBackend(loc, near, coords);
  };

  const refreshData = async () => {
    // Re-acquire fresh GPS coordinates on pull-to-refresh if permitted
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
        if (pos?.coords) {
          const { latitude, longitude } = pos.coords;
          const nearStr = `${longitude},${latitude}`;
          setUserCoords({ latitude, longitude });
          setNearLngLat(nearStr);
          await fetchFacilitiesFromBackend(currentLocation, nearStr, { latitude, longitude });
          if (user?.id) {
            await fetchUserDataFromBackend(user.id);
          }
          return;
        }
      }
    } catch (e) {
      console.log('[Refresh Location Error]', e);
    }

    await fetchFacilitiesFromBackend(currentLocation, nearLngLat, userCoords);
    if (user?.id) {
      await fetchUserDataFromBackend(user.id);
    }
  };

  const sendPhoneOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await api.sendOtp(phone);
      if (res?.success) {
        return { success: true };
      }
      return { success: false, error: res?.message || 'Failed to send OTP' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'OTP API Call failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<{ success: boolean; error?: string; needsName?: boolean; pendingUserId?: string }> => {
    try {
      setIsLoading(true);
      const res = await api.verifyOtp(phone, otp);
      if (res?.token && res?.user) {
        const hasName = !!(res.user.fullName && String(res.user.fullName).trim().length > 0);

        if (!hasName) {
          // New user — token already set inside verifyOtp, persist it but don't authenticate yet
          await SecureStore.setItemAsync(SECURE_TOKEN_KEY, res.token);
          return { success: true, needsName: true, pendingUserId: String(res.user.id) };
        }

        const loggedUser: UserProfile = {
          id: String(res.user.id),
          name: res.user.fullName,
          phone: res.user.phone || phone,
          email: res.user.email || `${phone}@otp.local`,
          location: currentLocation,
        };
        setUser(loggedUser);
        setIsAuthenticated(true);
              setIsGuest(false);
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, res.token);
        await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(loggedUser));
        api.registerPushToken(`fcm-${loggedUser.id}-${Date.now()}`, 'android').catch(() => {});
        await fetchUserDataFromBackend(loggedUser.id);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'OTP verification failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (emailStr: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await api.loginEmail(emailStr, pass);
      if (res?.token && res?.user) {
        const loggedUser: UserProfile = {
          id: String(res.user.id),
          name: res.user.fullName || 'Member',
          phone: res.user.phone || '',
          email: res.user.email || emailStr,
          location: currentLocation,
        };
        setUser(loggedUser);
        setIsAuthenticated(true);
              setIsGuest(false);

        // Persist token and user to SecureStore for auto-login on next launch
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, res.token);
        await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(loggedUser));

        await fetchUserDataFromBackend(loggedUser.id);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Email login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (emailStr: string, pass: string, fullName?: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      setIsLoading(true);
      await api.registerWithEmail(emailStr, pass, fullName);
      return {
        success: true,
        message: 'Account created! Check your email inbox to verify your account, then log in.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateFullName = async (userId: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      await api.updateUserFullName(userId, fullName);
      const meRes = await api.getMe().catch(() => null);
      const resolvedName = meRes?.user?.fullName || fullName;
      const loggedUser: UserProfile = {
        id: userId,
        name: resolvedName,
        phone: meRes?.user?.phone || '',
        email: meRes?.user?.email || '',
        location: currentLocation,
      };
      setUser(loggedUser);
      setIsAuthenticated(true);
              setIsGuest(false);
      await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(loggedUser));
      api.registerPushToken(`fcm-${userId}-${Date.now()}`, 'android').catch(() => {});
      await fetchUserDataFromBackend(userId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save your name.' };
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.id) {
        await api.deleteAccount(user.id);
      }
    } catch (e) {
      console.log('[AppContext] Account deletion error:', e);
      return {
        success: false,
        error: 'We could not complete the deletion. Please contact support@ultim.app and we will remove your data.',
      };
    }
    logout();
    setIsGuest(false);
    return { success: true };
  };

  const logout = () => {
    if (user?.id) {
      api.unregisterPushToken(`fcm-${user.id}`).catch(() => {});
    }
    api.setToken(null);
    // Clear persisted session so next launch shows login
    SecureStore.deleteItemAsync(SECURE_TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(SECURE_USER_KEY).catch(() => {});
    setIsAuthenticated(false);
    setIsGuest(false);
    setUser(null);
    setUserMemberships([]);
    setBookings([]);
    setTransactions([]);
    setNotifications([]);
  };

  const bookSession = async ({
    facilityId,
    facilityName,
    facilityAddress,
    sportType,
    courtName,
    dateStr,
    timeSlotLabel,
    durationMins,
    creditsSpent,
    facilityImage,
  }: {
    facilityId: string;
    facilityName: string;
    facilityAddress: string;
    sportType: string;
    courtName: string;
    dateStr: string;
    timeSlotLabel: string;
    durationMins: 60 | 120;
    creditsSpent: number;
    facilityImage?: string;
  }) => {
    const activeM = userMemberships.find((m) => String(m.facilityId) === String(facilityId) && m.status === 'ACTIVE')
      || userMemberships.find((m) => m.status === 'ACTIVE')
      || userMemberships[0];

    if (!activeM) {
      return { success: false, error: 'No active membership pass found for this center.' };
    }

    if (activeM.remainingCredits < creditsSpent) {
      return { success: false, error: `Insufficient credits. Required: ${creditsSpent}, Available: ${activeM.remainingCredits}` };
    }

    const now = new Date();
    const formattedDate = dateStr === 'Today'
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      : dateStr === 'Tomorrow'
      ? (() => { const d = new Date(now); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()
      : dateStr === 'Day 3'
      ? (() => { const d = new Date(now); d.setDate(d.getDate() + 2); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()
      : dateStr;

    try {
      const membershipId = isNaN(Number(activeM.id)) ? activeM.id : Number(activeM.id);
      const apiBookingRes = await api.createBooking({
        membership: membershipId,
        activity: sportType.toLowerCase(),
        sessionDate: formattedDate,
        sessionTime: timeSlotLabel.split(' ')[0] || '18:00',
        duration: durationMins,
        court: courtName,
      });

      const bookingData = apiBookingRes?.doc || apiBookingRes;
      if (bookingData && (bookingData.id || bookingData._id || apiBookingRes?.message)) {
        const newBooking = adaptBooking(bookingData);
        setBookings([newBooking, ...bookings]);
        setUserMemberships((prev) =>
          prev.map((m) => (m.id === activeM.id ? { ...m, remainingCredits: m.remainingCredits - creditsSpent } : m))
        );
        return { success: true, booking: newBooking };
      }
      return { success: false, error: apiBookingRes?.message || 'Server could not complete booking request.' };
    } catch (e: any) {
      console.log('[bookSession API Exception]:', e);
      const rawError = e?.message || e?.data?.errors?.[0]?.message || String(e);

      // Unique index violation on (session_date, member_id, session_time)
      if (
        rawError.includes('session_date') ||
        rawError.includes('member_id') ||
        rawError.includes('session_time') ||
        rawError.includes('Value must be unique') ||
        rawError.includes('unique')
      ) {
        return {
          success: false,
          error: `You already have a booking for ${timeSlotLabel} on ${formattedDate}. Please select a different time slot or date.`,
        };
      }

      return { success: false, error: rawError || 'Booking API call failed.' };
    }
  };

  const cancelBooking = async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.cancelBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b)));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to cancel booking.' };
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        colors: COLORS,
        isAuthenticated,
        isGuest,
        continueAsGuest,
        deleteAccount,
        user,
        sendPhoneOtp,
        loginWithPhone,
        loginWithEmail,
        registerWithEmail,
        updateFullName,
        logout,
        currentLocation,
        userCoords,
        nearLngLat,
        setCurrentLocation,
        facilities,
        plans,
        userMemberships,
        bookings,
        transactions,
        notifications,
        totalActiveCredits,
        isLoading,
        isBootstrapping,
        isOffline,
        facilityError,
        membershipError,
        bookSession,
        cancelBooking,
        markNotificationAsRead,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
