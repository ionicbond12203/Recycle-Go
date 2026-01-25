# Recycle Go ♻️

> **An AI-powered recycling platform connecting contributors with collectors in real-time.**

Recycle Go makes recycling effortless by using **Google Cloud Vision AI** to instantly identify recyclable materials and **Real-time Geolocation** to dispatch collectors to your doorstep. Think of it as "Uber for Recycling".

---

## 📱 Core Features

### 🤖 AI-Powered Scanner
- **Instant Recognition**: Just snap a photo, and the app identifies materials (Plastic, Glass, Paper) using Google Cloud Vision API.
- **Smart Classification**: Automtically categorizes items and estimates their point value and CO2 savings.

### 📍 Real-Time Collection
- **Live Tracking**: View nearby collectors on an interactive map (LBS).
- **On-Demand Dispatch**: Request a pickup and track the collector's route to your location in real-time.
- **Verification System**: Secure transaction flow where collectors weigh and verify items before points are awarded.

### 🎮 Gamification & Rewards
- **Eco-Points System**: Earn points for every successful recycle.
- **Leaderboards & Badges**: Unlock achievements like "Gold Collector" and track your carbon footprint reduction.

---

## 🛠 Tech Stack

**Mobile Architecture**
- **Framework**: React Native (Expo SDK 50)
- **Language**: TypeScript
- **Navigation**: Expo Router (File-based routing)

**Backend & Services**
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google & Email)
- **Real-time**: Supabase Realtime (WebSockets for location tracking)
- **AI Vision**: Google Cloud Vision API
- **AI Chat**: Google Gemini (Eco-Bot Assistant)
- **Maps**: Google Maps SDK

---

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    https://github.com/ionicbond12203/Recycle-Go.git
    cd recycle-go
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Setup Environment Variables**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_cloud_key
    EXPO_PUBLIC_TAVILY_API_KEY=your_tavily_key
    EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run the App**
    ```bash
    npx expo start
    ```

---

<!-- 
## 📸 Screenshots

*(Place your screenshots here. Recommended: 1. Home Screen, 2. AI Scanner, 3. Map View)*
-->

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
