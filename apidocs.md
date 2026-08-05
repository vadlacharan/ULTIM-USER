Let me read all the collection files thoroughly before writing the docs.

I now have everything I need. Here is the complete API documentation.

---

# ULTIM Backend — API Documentation

**Base URL:** `https://ultim-server.vercel.app/api`

All requests that require authentication must include:

```
Authorization: Bearer <token>
```

All request/response bodies are `application/json`.

---

## Authentication

Payload issues a **JWT token** (30-day expiry). Store it and send it in every authenticated request.

---

### 1. Send OTP

Sends a 4-digit OTP via SMS. Creates the user if they don't exist yet.

```
POST /api/users/send-otp
```

**Body:**
```json
{ "phone": "+919876543210" }
```

**Response `200`:**
```json
{ "success": true }
```

**Errors:**
| Status | Message |
|--------|---------|
| 400 | `"Phone required"` |

---

### 2. Verify OTP & Login

Verifies the OTP. Returns the user object and auth token.

```
POST /api/users/verify-otp
```

**Body:**
```json
{
  "phone": "+919876543210",
  "otp": "4821"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "+919876543210@otp.local",
    "phone": "+919876543210",
    "fullName": "Rahul Kumar",
    "role": "member",
    "isPhoneVerified": true,
    "tenant": null
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 400 | `"Phone and OTP required"` |
| 400 | `"OTP expired"` |
| 400 | `"Invalid OTP"` |
| 404 | `"User not found"` |
| 429 | `"Too many attempts. Try again later."` |

---

### 3. Email & Password Login (Standard Payload Auth)

```
POST /api/users/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Rahul Kumar",
    "role": "member"
  }
}
```

---

### 4. Get Current User (Token Verify + Profile)

```
GET /api/users/me
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Rahul Kumar",
    "phone": "+919876543210",
    "role": "member",
    "isPhoneVerified": true,
    "tenant": null
  }
}
```

---

### 5. Update Profile

Members can only update their own profile.

```
PATCH /api/users/:id
Authorization: Bearer <token>
```

**Body (any subset):**
```json
{
  "fullName": "Rahul Kumar"
}
```

> `role` and `tenant` can only be updated by admin.

---

### 6. Logout

Payload uses stateless JWT, so logout is client-side. Delete the stored token.

> No server endpoint required. The token expires in 30 days.

---

### 7. Register FCM Push Token

Call this immediately after login (or after FCM token refresh).

```
POST /api/users/register-push-token
Authorization: Bearer <token>
```

**Body:**
```json
{
  "token": "FCM_DEVICE_TOKEN_HERE",
  "platform": "android",
  "deviceId": "optional-unique-device-id"
}
```

`platform` must be `"android"` or `"ios"`.

**Response `200`:**
```json
{ "success": true }
```

---

### 8. Unregister FCM Push Token

Call this on logout or when FCM token is revoked.

```
POST /api/users/unregister-push-token
Authorization: Bearer <token>
```

**Body:**
```json
{ "token": "FCM_DEVICE_TOKEN_HERE" }
```

or by device ID:

```json
{ "deviceId": "optional-unique-device-id" }
```

**Response `200`:**
```json
{ "success": true }
```

---

## Tenants (Facilities)

Publicly readable. No auth required to browse facilities.

---

### 9. List All Tenants / Facilities

```
GET /api/tenants
```

**Query params:**
| Param | Example | Description |
|-------|---------|-------------|
| `limit` | `10` | Page size |
| `page` | `1` | Page number |
| `where[city][equals]` | `Hyderabad` | Filter by city |

**Response `200`:**
```json
{
  "docs": [
    {
      "id": 1,
      "Facility": "ABC Sports Arena",
      "city": "Hyderabad",
      "location": [78.4867, 17.385],
      "facilityImages": [
        { "facilityImage": { "url": "https://..." } }
      ],
      "activities": [
        {
          "activity": "gym",
          "category": "fitness",
          "creditsPer60Minutes": 1,
          "active": true
        },
        {
          "activity": "swimming",
          "category": "fitness",
          "creditsPer60Minutes": 2,
          "active": true
        }
      ]
    }
  ],
  "totalDocs": 12,
  "limit": 10,
  "page": 1,
  "totalPages": 2
}
```

---

### 10. Nearby Tenants (Location Based)

Uses the Payload `near` operator on the `location` point field.

```
GET /api/tenants?where[location][near]=78.4867,17.385,5000&limit=20
```

`near` format: `longitude,latitude,maxDistanceInMeters`

This returns tenants sorted by nearest first.

---

### 11. Filter by Activity Category

```
GET /api/tenants?where[activities.category][equals]=fitness
```

Or filter by specific activity type. Because `activities` is an array, use nested field filtering:

```
GET /api/tenants?where[activities.activity][equals]=swimming
```

---

### 12. Get Single Tenant

```
GET /api/tenants/:id
```

**Response `200`:**
```json
{
  "id": 1,
  "Facility": "ABC Sports Arena",
  "city": "Hyderabad",
  "location": [78.4867, 17.385],
  "activities": [...]
}
```

---

## Membership Plans

Publicly readable. No auth required.

---

### 13. List Membership Plans for a Tenant

```
GET /api/membership-plans?where[tenant][equals]=<tenantId>&where[active][equals]=true
```

**Response `200`:**
```json
{
  "docs": [
    {
      "id": 1,
      "planName": "Hybrid Fitness Plan",
      "description": "Gym + Swimming access",
      "category": "fitness",
      "supportedActivities": ["gym", "swimming"],
      "creditsOffered": 100,
      "planPrice": 1999,
      "Duration": "1",
      "active": true,
      "numberOfMinutesPerDay": 120
    }
  ]
}
```

**Key fields:**
| Field | Type | Description |
|-------|------|-------------|
| `supportedActivities` | `string[]` | Activities allowed: `gym`, `swimming`, `badminton`, `pickleball`, `cricket` |
| `creditsOffered` | `number` | Total shared credits granted on activation |
| `planPrice` | `number` | Price in INR (display only, payment is offline) |
| `Duration` | `"1"/"3"/"6"/"12"` | Duration in months |
| `numberOfMinutesPerDay` | `number` | Optional daily time limit per activity |

---

### 14. Get Single Membership Plan

```
GET /api/membership-plans/:id
```

---

## Memberships (Active Passes)

Requires auth. Members can only see their own.

---

### 15. Get My Active Memberships

```
GET /api/memberships?where[member][equals]=<userId>&depth=2
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "docs": [
    {
      "id": 1,
      "membershipPlanName": "Hybrid Fitness Plan",
      "membershipPlan": {
        "id": 1,
        "planName": "Hybrid Fitness Plan",
        "supportedActivities": ["gym", "swimming"],
        "creditsOffered": 100
      },
      "tenant": {
        "id": 1,
        "Facility": "ABC Sports Arena"
      },
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-02-01T00:00:00.000Z",
      "availableCredits": 73,
      "amountPaid": 1999,
      "amountDue": 0,
      "discountOffered": 0
    }
  ]
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `availableCredits` | Remaining shared credits to spend on bookings |
| `amountPaid` | Sum of linked transactions |
| `amountDue` | `planPrice - amountPaid - discountOffered` |
| `startDate` / `endDate` | Membership validity window |

---

### 16. Get Membership QR Token

Used for membership-level QR (not booking QR). Returns a short-lived JWT.

```
GET /api/memberships/:id/generate-qr
Authorization: Bearer <token>
```

**Response `200`:**
```json
{ "token": "eyJhbGci..." }
```

> Token is valid for **15 minutes** and contains `startDate` and `endDate`.

---

## Bookings

Requires auth. Members can create; they can only read their own bookings.

---

### 17. Create Booking (Book a Session)

This is the core booking flow. Credits are deducted automatically on success.

```
POST /api/bookings
Authorization: Bearer <token>
```

**Body:**
```json
{
  "membership": 1,
  "activity": "swimming",
  "sessionDate": "2026-07-30",
  "sessionTime": "18:00",
  "duration": 60
}
```

For court-based activities (`badminton`, `pickleball`, `cricket`), also include:
```json
{
  "membership": 1,
  "activity": "badminton",
  "sessionDate": "2026-07-30",
  "sessionTime": "18:00",
  "duration": 60,
  "court": "Court 1"
}
```

For gym, `sessionTime` is optional (defaults to all-day):
```json
{
  "membership": 1,
  "activity": "gym",
  "sessionDate": "2026-07-30",
  "duration": 60
}
```

**Field reference:**
| Field | Required | Values |
|-------|----------|--------|
| `membership` | ✅ | Membership ID |
| `activity` | ✅ | `gym`, `swimming`, `badminton`, `pickleball`, `cricket` |
| `sessionDate` | ✅ | ISO date `YYYY-MM-DD` |
| `sessionTime` | ✅ except gym | `05:00` to `22:00` |
| `duration` | ✅ | `60` or `120` (minutes) |
| `court` | ✅ for court sports | Court name string from tenant config |

**Response `201`:**
```json
{
  "id": 42,
  "activity": "swimming",
  "sessionDate": "2026-07-30T00:00:00.000Z",
  "sessionTime": "18:00",
  "duration": 60,
  "qrCode": "A3F2BC1D4E5F6A7B",
  "qrGeneratedAt": "2026-07-30T09:00:00.000Z",
  "member": 1,
  "membership": 1,
  "tenant": 1
}
```

**Validation errors:**
| Status | Message |
|--------|---------|
| 404 | `"Membership not found"` |
| 400 | `"Activity is required"` |
| 403 | `"This activity is not included in your membership plan"` |
| 403 | `"This activity is not available at this tenant"` |
| 400 | `"Session time is required for this activity"` |
| 400 | `"Court / lane is required for this activity"` |
| 400 | `"Court / lane is not available for this activity"` |
| 403 | `"Court / lane is fully booked for this slot"` |
| 403 | `"Maximum booking limit for the day reached"` (max 2/day) |
| 403 | `"Daily booking time quota exceeded. You have X minutes remaining..."` |
| 400 | `"Not enough available credits"` |
| 400 | `"Plan does not cover selected date"` |

---

### 18. Get My Bookings

```
GET /api/bookings?where[member][equals]=<userId>&depth=1&sort=-sessionDate
Authorization: Bearer <token>
```

Filter upcoming:
```
GET /api/bookings?where[member][equals]=<userId>&where[sessionDate][greater_than_equal]=2026-07-30
```

Filter past:
```
GET /api/bookings?where[member][equals]=<userId>&where[sessionDate][less_than]=2026-07-30
```

**Response `200`:**
```json
{
  "docs": [
    {
      "id": 42,
      "activity": "swimming",
      "sessionDate": "2026-07-30T00:00:00.000Z",
      "sessionTime": "18:00",
      "duration": 60,
      "court": null,
      "qrCode": "A3F2BC1D4E5F6A7B",
      "tenant": { "id": 1, "Facility": "ABC Sports Arena" },
      "membership": { "id": 1 },
      "lastGateScanAt": null,
      "lastGateOpenedAt": null
    }
  ]
}
```

---

### 19. Generate Booking QR Code

Generates/refreshes the dynamic QR code for a specific booking.

```
POST /api/bookings/:id/generate-qr
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "token": "A3F2BC1D4E5F6A7B",
  "bookingId": 42
}
```

> The QR value is a 16-character hex string. The member shows this at the reception desk.

---

### 20. Check Time Slot Availability

To show booked/available slots in the UI, query existing bookings for a court/date/activity:

```
GET /api/bookings?where[activity][equals]=badminton&where[sessionDate][equals]=2026-07-30&where[court][equals]=Court 1
```

Count the results per `sessionTime` and compare against `capacityPerCourt` from the tenant's activity config.

---

### 21. Cancel Booking

There is no dedicated cancel endpoint yet. Use the standard PATCH:

```
PATCH /api/bookings/:id
Authorization: Bearer <token>
```

**Body:**
```json
{ "status": "cancelled" }
```

> ⚠️ Credit refund on cancellation is not yet automated. This needs a backend hook to restore `availableCredits` on the membership when `status` is set to `cancelled`.

---

## Transactions

Readable by partner/consultant only. Members cannot read transactions directly.

---

### 22. Get Transactions for a Member

```
GET /api/transactions?where[member][equals]=<userId>&depth=1
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "docs": [
    {
      "id": 1,
      "transactionDate": "2026-07-01T00:00:00.000Z",
      "transactionAmount": 1999,
      "paymentMethod": "upi",
      "membershipPlan": { "id": 1, "planName": "Hybrid Fitness Plan" },
      "member": { "id": 1 }
    }
  ]
}
```

**Payment methods:** `cash`, `card`, `cheque`, `bankTransfer`, `upi`

---

## Standard Payload Query Reference

All collection list endpoints support these query params:

| Param | Example | Description |
|-------|---------|-------------|
| `limit` | `10` | Results per page (default 10) |
| `page` | `2` | Page number |
| `sort` | `-createdAt` | Sort field (prefix `-` for descending) |
| `depth` | `1` | Relationship populate depth |
| `where[field][operator]` | `where[city][equals]=Hyderabad` | Filter |

**Operators:**
| Operator | Example |
|----------|---------|
| `equals` | `where[role][equals]=member` |
| `not_equals` | `where[status][not_equals]=cancelled` |
| `contains` | `where[planName][contains]=hybrid` |
| `in` | `where[activity][in]=gym,swimming` |
| `greater_than` | `where[sessionDate][greater_than]=2026-07-01` |
| `less_than` | `where[sessionDate][less_than]=2026-08-01` |
| `exists` | `where[qrCode][exists]=true` |
| `near` | `where[location][near]=78.48,17.38,5000` |

---

## Complete Endpoint Index

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/users/send-otp` | ❌ | Send OTP to phone |
| `POST` | `/api/users/verify-otp` | ❌ | Verify OTP, get token |
| `POST` | `/api/users/login` | ❌ | Email/password login |
| `GET` | `/api/users/me` | ✅ | Get current user |
| `PATCH` | `/api/users/:id` | ✅ | Update profile |
| `POST` | `/api/users/register-push-token` | ✅ | Register FCM token |
| `POST` | `/api/users/unregister-push-token` | ✅ | Unregister FCM token |
| `GET` | `/api/tenants` | ❌ | List facilities |
| `GET` | `/api/tenants/:id` | ❌ | Get facility details |
| `GET` | `/api/membership-plans` | ❌ | List plans (filter by tenant) |
| `GET` | `/api/membership-plans/:id` | ❌ | Get single plan |
| `GET` | `/api/memberships` | ✅ | Get my memberships |
| `GET` | `/api/memberships/:id/generate-qr` | ✅ | Membership QR token |
| `GET` | `/api/bookings` | ✅ | Get my bookings |
| `POST` | `/api/bookings` | ✅ | Create booking (deducts credits) |
| `POST` | `/api/bookings/:id/generate-qr` | ✅ | Booking check-in QR |
| `PATCH` | `/api/bookings/:id` | ✅ | Update booking (e.g. cancel) |
| `GET` | `/api/transactions` | ✅ Partner | List transactions |

---

## Frontend Integration Notes

### Auth header
```js
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

### Membership active check
A membership is active if:
```js
new Date() >= new Date(membership.startDate) &&
new Date() <= new Date(membership.endDate) &&
membership.availableCredits > 0
```

### Credit cost calculation before booking
```js
const credits = Math.ceil(duration / 60) * tenantActivity.creditsPer60Minutes
```

Get `creditsPer60Minutes` from `tenant.activities[].creditsPer60Minutes` matching the selected activity.

### Session time slots
Times are stored as `"HH:MM"` strings. Available values: `05:00` through `22:00` (hourly).

### Gym all-day slot
When `sessionTime === "GYM_ALL_DAY"` it means a gym booking with no fixed time. Do not display this value; treat it as "Open Access".

### Location format
`tenant.location` is `[longitude, latitude]`. For map display, reverse to `[latitude, longitude]`.

---

## Missing Features to Note

These are in the app spec but not yet backend-implemented:

| Feature | Status |
|---------|--------|
| Credit refund on booking cancel | ❌ Not automated |
| Notifications collection | ❌ Not implemented |
| Ratings on facilities | ❌ Not in schema |
| Operating hours on tenant | ❌ Not in schema |
| Amenities (WiFi, lockers etc.) | ❌ Not in schema |
