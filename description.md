Design a clean, modern, and mobile-first UI for a local fitness and sports membership app. 
Here is a clear, concise overview of your app’s core functionality, business model, and operational flow:

---

## 🏋️ Application Overview

This application is a **hyper-local sports, fitness, and health aggregator platform** that bridges digital discovery with offline facility access through a credit-based session booking system.

---

## 🔄 Core User Flow & Functionality

### 1. Discovery & Exploration (Digital)

* **Phone Authentication:** Users log in quickly using their phone number via OTP.
* **Browse Nearby Facilities:** Users can explore gyms, badminton courts, pickleball centers, or health/fitness facilities near their location.
* **Category Filtering:** Facilities are categorized into **Fitness**, **Sport**, and **Health** for quick search.
* **Membership Information:** Users can view detailed membership plans offered by each facility, including plan perks, credit allocations, and pricing.

---

### 2. Membership Activation (Offline / In-Person)

* **No Direct In-App Purchases:** Users **cannot** buy or activate memberships directly inside the app.
* **Physical Registration:** The app directs users with a note: *"Visit the center to get access."*
* **On-Site Activation:** The user physically visits the facility center and registers. The facility admin/desk registers the user on-site and grants them membership access.

---

### 3. Credit Allocation & Session Booking (Digital)

* **Credit Balance:** Once a membership is activated at the center, the user receives an allocated amount of **credits** in their app account for that specific facility.
* **Access Tab:** The user can view all their active memberships and remaining credit balances.
* **Booking Sessions:** Users spend their credits to reserve sessions or court time (e.g., Gym slot, Badminton court, Pickleball court).
* **Booking Constraints:**
* **Date Selector:** Bookings are strictly restricted to a **3-day rolling window** (Today, Tomorrow, and Day After).
* **Duration:** Flexible selection between **60 minutes** or **120 minutes**.
* **Slot & Court Selection:** Choose specific time slots and designated courts or zones.
* **Swipe to Book:** Quick action to confirm the booking and deduct credits.



---

### 4. Check-In & Verification (Offline)

* **Dynamic QR Generation:** Once a slot is booked, the app generates a unique **QR Code** for that specific booking.
* **Tab Tracking:** Bookings are categorized under **Upcoming**, **Ongoing**, and **Past** tabs.
* **Seamless Entry:** Upon arriving at the venue, the user presents the QR code at the reception/turnstile for scanning and instant check-in verification.

---

### 5. Profile & History Management

* **Active Memberships Indicator:** Clear visual indicators showing active plans and total remaining credits.
* **Transaction History:** Detailed ledger showing credit additions (from offline center registrations) and credit deductions (from booked sessions).
* **Notifications & Account Management:** Updates regarding upcoming bookings, slot reminders, and profile settings.



### Design & Visual Direction:
- **Style:** Sporty, active, sleek, and high-energy.
- **Color Palette:** Warm dark/light neutral base with vibrant Orange as the primary accent color. Use secondary sporty accents (like neon lime, energetic teal, or bold red) for status tags and category chips.
- **Visual Elements:** 
  - Rich imagery: High-quality visual thumbnails for facility cards, sport banners, and category hero images.
  - Iconography: Clean line/solid icons for navigation, facilities, sports types (gym, badminton, pickleball), dates, and QR codes.
  - Micro-interactions: Swipeable controls for bookings, distinct status badges, and clear call-to-action (CTA) buttons.

---

### App Architecture & Key Screens:

#### Bottom Navigation Bar (4 Core Tabs):
1. **Home**
2. **Access**
3. **Bookings**
4. **Profile**

---

### Detailed Screen Breakdown:

#### 1. Home Tab & Flow
- **Top Header:** Location selector (e.g., "Current Location: Downtown"), notification bell icon, search bar.
- **Hero Section:** Swipeable promotional banner carousel.
- **Categories Section:** Interactive visual cards/chips for quick filtering: *Fitness*, *Sports*, and *Health*.
- **Today's Bookings:** Horizontal scroll card showing active/upcoming sessions for the current day with quick view options.
- **Facilities Near Me:** Scrollable card list showing local centers with thumbnail images, ratings, distance, and tags (e.g., "Badminton", "Gym").
- **Flow Screens:**
  - **Category Listing Page:** Grid/list of facilities filtered by the selected category.
  - **Facility Details Page:** Hero banner image, facility overview, amenities icons, operating hours, location map preview, and a list of available **Membership Plans**.
  - **Plan Details Page:** Complete breakdown of a specific membership plan (credits granted, valid activities, duration, price) with a prominent banner: *"Visit center to get access & activate membership"*.

#### 2. Access Tab & Flow
- **Active Memberships List:** Cards displaying all user-activated memberships, remaining credit balance indicator, and a prominent **"Book Session"** button per plan.
- **Booking Flow Screen:**
  - **Date Selector:** Calendar strip constrained strictly to 3 days (Today, Tomorrow, Day 3).
  - **Activity/Court Selector:** Dropdown or horizontal selector for courts/zones (e.g., Court 1, Court 2, Gym Floor).
  - **Duration Picker:** Toggle/selector for 60 mins or 120 mins.
  - **Time Slot Selector:** Grid of available hourly slots with visual indicators for available vs. booked slots.
  - **Credit Summary:** Display required credits vs. user's current balance.
  - **Action CTA:** Interactive "Swipe to Book" slider at the bottom to confirm booking.

#### 3. Bookings Tab
- **Sub-Navigation Tabs:** *Upcoming*, *Ongoing*, and *Past*.
- **Booking Card Elements:** Facility thumbnail, sport icon, date/time slot, duration, status tag (Confirmed, Checked-in, Completed).
- **QR Code View Page:** Tapping any booking card or "View QR" button opens a modal/screen displaying a dynamic Check-In QR Code with booking details, facility address, and a "Get Directions" button.

#### 4. Profile Tab
- **User Header:** Avatar image, user name, phone number, and overall active credits summary.
- **Membership Indicators:** Visual cards showing active vs. expired memberships.
- **Transaction History:** List view of credit earnings, membership activations, and session bookings.
- **Settings & Support:** Links to notifications, help center, terms, and logout.

#### 5. Ancillary Screens
- **Authentication:** Minimalist Phone Number entry screen with OTP verification inputs and sporty background branding.
- **Notification Center:** List of session reminders, membership updates, and credit alerts.

---

### Deliverables:
Provide full screen layouts, component states (active, disabled, pressed), card designs with thumbnail image placeholders, and an intuitive component layout ready for mobile responsiveness.

# 2. Information Architecture & Navigation
The app follows a 4-tab bottom navigation structure optimized for thumb-reach.

### Core Navigation (Bottom Tab Bar)
1. **Home:** Discovery, promotion, and quick access.
2. **Access:** Membership management and session initiation.
3. **Bookings:** Calendar management and check-in QR codes.
4. **Profile:** Account stats, history, and settings.

## 3. Core User Flows

### A. Authentication Flow
- **Entry:** Branded splash screen logic.
- **Process:** Mobile Number entry -> OTP Verification.
- **Success:** Redirects to Home Dashboard.
- **Target Screen:** {{DATA:SCREEN:SCREEN_14}}

### B. Discovery to Membership Flow
1. **Home Dashboard:** Swipeable hero banners, categories (Fitness, Sports, Health), and "Facilities Near Me".
2. **Category Listing:** Filtered list of facilities based on sport/activity type.
3. **Facility Profile:** Detailed view with amenities icons (Wi-Fi, Parking, etc.) and tiered membership plans.
4. **Plan Breakdown:** Detailed credits, sessions, and a mandatory "Visit Center for Activation" notice.
- **Key Screens:** {{DATA:SCREEN:SCREEN_18}}, {{DATA:SCREEN:SCREEN_10}}, {{DATA:SCREEN:SCREEN_5}}, {{DATA:SCREEN:SCREEN_3}}

### C. Booking & Access Flow
1. **Active Access:** View current credits and "Book Session" triggers.
2. **Selection:** Focused 3-day calendar strip -> Zone Selection -> Duration Picker -> Time Slot.
3. **Confirmation:** Tactical "Swipe to Confirm" interaction.
4. **Fulfillment:** Booking appears in "Upcoming" tab with dynamic QR code for entry.
- **Key Screens:** {{DATA:SCREEN:SCREEN_7}}, {{DATA:SCREEN:SCREEN_8}}, {{DATA:SCREEN:SCREEN_16}}, {{DATA:SCREEN:SCREEN_17}}

## 4. Component Library Standards

### A. Headers & Navigation
- **Top Bar:** Location selector (left), Brand Logo (center), Notifications (right).
- **Bottom Bar:** 4-tab fixed navigation with active state highlighters in primary orange.

### B. Cards & Interaction
- **Facility Cards:** High-quality image, overlay rating (star + value), distance (km), and sport tags.
- **Status Badges:** Rounded pills with high contrast (e.g., "ACTIVE" in Lime on Dark).
- **CTA Buttons:** Full-width or focused buttons using primary orange with uppercase bold text.
- **Swiper Control:** Specialized slider for high-intent actions (Booking confirmation).

## 5. Content & Asset Strategy
- **Imagery:** High-energy, professional fitness photography (e.g., {{DATA:IMAGE:IMAGE_13}}).
- **Iconography:** Consistent solid-fill icons for facility amenities and activity types.
- **Verbatim Copy:** "Activation Required: Visit center to get access & activate membership" is a critical requirement for offline-to-online conversion.
