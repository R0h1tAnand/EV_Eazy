# Intelligent EV Ride Management System

## Table of Contents

1. [Introduction](#introduction)
2. [App Flow](#app-flow)
   - [Welcome Screen & Permissions](#welcome-screen--permissions)
   - [User & Admin Authentication](#user--admin-authentication)
   - [User Dashboard](#user-dashboard)
   - [Admin Dashboard](#admin-dashboard)
3. [Core Features](#core-features)
   - [Automated Ride Completion & Verification](#automated-ride-completion--verification)
   - [Damage Tracking System](#damage-tracking-system)
   - [Unauthorized Parking Prevention](#unauthorized-parking-prevention)
   - [Dynamic Penalty Management](#dynamic-penalty-management)
   - [Payment Integration](#payment-integration)
   - [Debug Mode](#debug-mode)
4. [Geofencing & GPS Functionalities](#geofencing--gps-functionalities)
5. [Simulation Mode for Development](#simulation-mode-for-development)
6. [Technology Stack](#technology-stack)

## Introduction

Electric vehicle rental services face challenges such as unauthorized parking, improper returns, and lack of damage tracking. This app aims to resolve these inefficiencies by integrating geofencing technology, real-time tracking, penalty enforcement, and IoT-based damage detection.

---

## App Flow

### Welcome Screen & Permissions

1. Animated welcome logo.
2. App requests mandatory permissions:
   - **Storage** (For saving images)
   - **Location** (For GPS-based tracking and geofencing)
   - **Messaging** (For notifications)
3. If the user denies location permission, a warning is displayed, and access is blocked until granted.

### User & Admin Authentication

#### **User Registration:**

- Input details:
  - Email
  - Password
  - Phone Number
  - Aadhar Number (ID Verification)
  - Upload Aadhar Image
- After registration, the user can log in.

#### **Admin Registration:**

- Input details:
  - Email
  - Password
  - Phone Number
  - Vehicle Details (Model, Base Image in New Condition)
- Set geofencing areas for the registered vehicles.

### User Dashboard

- **Vehicle Availability:** Displays available EVs (O3 & GT5) with:
  - Battery Percentage
  - Rental Cost
- **Payments & Penalties:**
  - Payment details
  - Breakdown of penalties:
    - Damage-based penalties (assessed by AI damage detection)
    - Overtime penalties
    - Unauthorized parking fines

### Admin Dashboard

- **Vehicle Management:**
  - Add/Remove Vehicles
  - Update Geofencing Areas
- **Monitoring & Tracking:**
  - Live GPS tracking of vehicles
  - View geofencing violations
  - View uploaded pre/post-rental images
  - Receive notifications for tracking failures

---

## Core Features

### Automated Ride Completion & Verification

- **Geofencing for Parking Zones:**
  - Uses OpenStreetMap API for defining designated parking zones.
  - Ride only ends when the vehicle is parked in the authorized zone.
- **Time-Bound Rental:**
  - Countdown timer enforced.
  - Overtime incurs penalties.
- **Real-Time GPS Validation:**
  - Unauthorized mid-ride parking is flagged.

### Damage Tracking System

- **Pre/Post-Rental Image Upload:**
  - Users must upload timestamped photos of the vehicle before and after the ride.
- **IoT-Based Damage Detection:** (Future integration)
  - Uses MPU6050 accelerometer & SW-420 impact sensor.
  - Detects sudden force changes (>3g lateral force or 10° tilt) indicating damage.
- **AI-Based Damage Analysis:**
  - Compares pre/post images and currently classifies damage as **'Damaged'** or **'Non-Damaged'**.
  - Future updates will introduce severity levels (Minimal, Moderate, Severe, Extreme).
  - Penalties are assigned based on damage classification.

### Unauthorized Parking Prevention

- **Geofencing Rules:**
  - Vehicles must remain inside a 5m radius of designated parking areas.
  - If parked outside, a penalty is applied after a 20-minute grace period.

### Dynamic Penalty Management

- **Rule-Based Engine:**
  - **Late Returns:** (Overtime charge = Base rate × Overtime minutes)
  - **Damage-Based Fines:** AI-assessed damage classification determines penalty.
  - **Unauthorized Parking:** Flat fee + additional surcharge for extended violations.

### Payment Integration

- **Instamojo API for Auto-Deductions**
- **Dispute Resolution:**
  - Users can appeal penalties through the portal.

### Debug Mode

- **Simulation Mode for Testing:**
  - Allows developers to simulate vehicle movement and damage detection such that even if I move the vehicle, it should be read as a GPS movement.
  - Enables testing without IoT hardware.
  - Helps demonstrate app functionality during hackathon judging.

---

## Geofencing & GPS Functionalities

- **Existing Implementation:**
  - Developed in HTML, CSS, and JavaScript to determine coordinates inside a selected region.
- **How It Works in the App:**
  - GPS coordinates are validated in real-time.
  - Unauthorized movement is flagged and penalized.

---

## Simulation Mode for Development

- Allows testing of:
  - Geofencing restrictions
  - Ride start/stop logic
  - Penalty calculations
  - Damage detection workflow
- Helps in iterative debugging before hardware integration.

---

## Technology Stack

| Component                         | Technology Used           |
| --------------------------------- | ------------------------- |
| **Mobile App**                    | React Native              |
| **Backend**                       | Node.js / Python (Django) |
| **Database**                      | SUPABASE                  |
| **Geofencing**                    | OpenStreetMap API         |
| **Payment Gateway**               | Instamojo API             |
| **AI Model for Damage Detection** | Self Mode Model           |
| **Push Notifications**            | SUPABASE                  |

---

## Conclusion

This intelligent EV ride management system enhances rental efficiency through geofencing, real-time tracking, damage assessment, and automated penalties. The inclusion of a debug mode ensures easy testing and seamless functionality demonstrations. This approach will significantly reduce operational inefficiencies and improve customer experience in EV rentals.

