import { UserProfile, Facility, MembershipPlan, UserMembership, Booking, CreditTransaction } from '../types';

export const API_BASE_URL = 'https://ultim-server.vercel.app/api';

class ApiService {
  private token: string | null = null;

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data?.message || data?.errors?.[0]?.message || `Request failed with status ${response.status}`;
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const firstErr = data.errors[0];
          if (firstErr.message && firstErr.path) {
            errorMsg = `${firstErr.message} on [${firstErr.path}]`;
          } else if (firstErr.message) {
            errorMsg = firstErr.message;
          }
        }
        const errorObj: any = new Error(errorMsg);
        errorObj.data = data;
        errorObj.status = response.status;
        throw errorObj;
      }

      return data as T;
    } catch (err: any) {
      console.warn(`[API Error] ${endpoint}:`, err.message || err);
      throw err;
    }
  }

  // --- AUTH ENDPOINTS ---

  public async sendOtp(phone: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean }>('/users/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, role: 'member' }),
    });
  }

  public async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; token: string; user: any }> {
    const res = await this.request<{ success: boolean; token: string; user: any }>('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, role: 'member' }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async loginEmail(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await this.request<{ token: string; user: any }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async registerWithEmail(email: string, password: string, fullName?: string): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role: 'member' }),
    });
  }

  public async updateUserFullName(userId: string | number, fullName: string): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fullName }),
    });
  }

  public async getMe(): Promise<{ user: any }> {
    return this.request<{ user: any }>('/users/me');
  }

  public async updateProfile(userId: string | number, data: Partial<UserProfile>): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, role: 'member' }),
    });
  }

  public async registerPushToken(token: string, platform: 'ios' | 'android', deviceId?: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>('/users/register-push-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform, deviceId }),
      });
    } catch (err) {
      return { success: false };
    }
  }

  public async unregisterPushToken(token: string, deviceId?: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>('/users/unregister-push-token', {
        method: 'POST',
        body: JSON.stringify({ token, deviceId }),
      });
    } catch (err) {
      return { success: false };
    }
  }

  // --- TENANTS / FACILITIES ---

  public async getTenants(params?: {
    city?: string;
    category?: string;
    nearLngLat?: string; // format: "lng,lat"
    limit?: number;
    page?: number;
  }): Promise<{ docs: any[]; totalDocs: number; limit: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.city) queryParams.append('where[city][equals]', params.city);
    if (params?.category && params.category !== 'All') {
      let cat = params.category.toLowerCase().trim();
      if (cat === 'sport') cat = 'sports';
      queryParams.append('where[activities.category][equals]', cat);
    }
    if (params?.nearLngLat) {
      queryParams.append('where[location][near]', params.nearLngLat);
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/tenants${queryString}`);
  }

  public async getTenantDetails(id: string | number): Promise<any> {
    return this.request(`/tenants/${id}`);
  }

  // --- MEMBERSHIP PLANS ---

  public async getMembershipPlans(tenantId: string | number): Promise<{ docs: any[] }> {
    return this.request(`/membership-plans?where[tenant][equals]=${tenantId}&where[active][equals]=true`);
  }

  public async getMembershipPlanDetails(id: string | number): Promise<any> {
    return this.request(`/membership-plans/${id}`);
  }

  // --- MEMBERSHIPS (ACTIVE USER PASSES) ---

  public async getMyMemberships(userId: string | number): Promise<{ docs: any[] }> {
    return this.request(`/memberships?where[member][equals]=${userId}&depth=2`);
  }

  public async generateMembershipQrToken(membershipId: string | number): Promise<{ token: string }> {
    return this.request<{ token: string }>(`/memberships/${membershipId}/generate-qr`);
  }

  // --- BOOKINGS ---

  public async createBooking(data: {
    membership: string | number;
    activity: string;
    sessionDate: string; // YYYY-MM-DD
    sessionTime?: string; // HH:MM
    duration: number; // 60 or 120;
    court?: string;
  }): Promise<any> {
    const formattedData = {
      ...data,
      membership:
        typeof data.membership === 'string' && !isNaN(Number(data.membership))
          ? Number(data.membership)
          : data.membership,
    };
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });
  }

  public async getMyBookings(userId: string | number, filter?: 'upcoming' | 'past'): Promise<{ docs: any[] }> {
    let query = `?where[member][equals]=${userId}&depth=1&sort=-sessionDate`;
    const todayISO = new Date().toISOString().split('T')[0];

    if (filter === 'upcoming') {
      query += `&where[sessionDate][greater_than_equal]=${todayISO}`;
    } else if (filter === 'past') {
      query += `&where[sessionDate][less_than]=${todayISO}`;
    }

    return this.request(`/bookings${query}`);
  }

  public async generateBookingQr(bookingId: string | number): Promise<{ success: boolean; token: string; bookingId: number }> {
    return this.request<{ success: boolean; token: string; bookingId: number }>(`/bookings/${bookingId}/generate-qr`, {
      method: 'POST',
    });
  }

  public async cancelBooking(bookingId: string | number): Promise<any> {
    return this.request(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  }

  // --- TRANSACTIONS ---

  public async getMyTransactions(userId: string | number): Promise<{ docs: any[] }> {
    try {
      return await this.request(`/transactions?where[member][equals]=${userId}&depth=1`);
    } catch (err) {
      // Member role is restricted from reading /transactions
      return { docs: [] };
    }
  }
}

export const api = new ApiService();
