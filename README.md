# 🌱 GreenGuard - Tree Care & Community Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform: Web](https://img.shields.io/badge/Platform-Web-blue.svg)](https://developer.mozilla.org/en-US/docs/Web)
[![No AI](https://img.shields.io/badge/No-AI-red.svg)](https://github.com)

> A **rule-based, community-driven Green Tech application** designed to improve the survival rate of planted trees through verified care activities, gamification, and transparent impact tracking.

---

## 📌 Quick Summary

GreenGuard is a **rule-based, community-driven Green Tech application** designed to improve the survival rate of planted trees. It enables users to register trees, log care activities, earn rewards, and track environmental impact — all through **transparent, non-AI, deterministic logic**.

The platform focuses on **post-plantation care**, accountability, and long-term sustainability rather than just planting trees.

### Key Highlights
- ❌ **No AI** - Fully rule-based and deterministic
- ❌ **No Machine Learning** - All decisions are transparent and auditable
- ✅ **Community-Driven** - Encourages local participation and ownership
- ✅ **Gamified** - Green Coins and leaderboards for engagement
- ✅ **Transparent** - All calculations use publicly available formulas

---

## 🎯 Problem Statement

Every year, millions of saplings are planted by governments, NGOs, and corporates. However, a significant number of these trees fail to survive due to:

- **Lack of regular aftercare** - No systematic follow-up after planting
- **No accountability or monitoring system** - Difficult to track which trees need attention
- **Low community involvement** - Limited engagement from local communities
- **Absence of measurable impact tracking** - No clear metrics on survival rates or environmental impact

Most initiatives stop at plantation, ignoring long-term care and survival. GreenGuard bridges this critical gap.

---

## 💡 Our Solution

GreenGuard addresses these challenges by:

- ✅ Creating **community ownership** around trees
- ✅ Verifying care activities using **rule-based validation** (GPS, timestamps, frequency limits)
- ✅ Encouraging participation through **gamification and rewards** (Green Coins, leaderboards)
- ✅ Providing **dashboards for NGOs, schools, and corporates** for monitoring and reporting
- ✅ Tracking environmental impact using **static, transparent formulas** (CO₂, oxygen, survival rates)

### Core Principles
- **Transparency**: All validation rules and calculations are deterministic and auditable
- **Accountability**: GPS verification and photo timestamps ensure authentic care activities
- **Community**: Local participation creates sustainable long-term care
- **Impact**: Measurable metrics demonstrate real environmental benefits

---

## ⚙️ How the Platform Works

### 1️⃣ Tree Registration & Mapping
- Users register trees with GPS location, species, age, and planting date
- Each tree appears on a shared interactive map (Google Maps)
- Trees require admin approval before appearing publicly
- Optional community endorsement system for faster approval

### 2️⃣ Community Care Logging
Users can care for nearby trees by:
- Selecting a tree from the map or nearby list
- Uploading a photo with GPS metadata
- Selecting health indicators from a checklist
- Submitting a care log

**Validation Rules:**
- ✅ GPS proximity check (within 50 meters of tree location)
- ✅ Timestamp verification (photo must be taken within 15 minutes)
- ✅ Frequency limit (once per tree per 24 hours per user)
- ✅ Photo EXIF data extraction for location and time

### 3️⃣ Rule-Based Monitoring & Validation (NO AI)
All system decisions are deterministic and logic-based:

- **Distance Validation**: Calculates distance between photo GPS and tree GPS using Haversine formula
- **Time-Based Restrictions**: 24-hour cooldown per tree, 15-minute photo timestamp window
- **Manual Health Checklists**: Users select from predefined health indicators
- **Suspicious Activity Detection**: Flags rapid multiple logs, GPS mismatches, or unusual patterns for admin review

This ensures transparency, fairness, and compliance with non-AI constraints.

### 4️⃣ Gamification & Green Rewards
- Users earn **Green Coins (XP)** for verified actions:
  - Watering trees: +5 points per approved log
  - Registering trees: Points vary by tree type
  - Endorsing trees: Community verification points
- **Leaderboards** rank individuals, schools, and communities
- **Top Communities** section highlights active regions
- Coins can be redeemed for partner coupons or eco-friendly rewards (coming soon)
- Corporates support rewards via CSR budgets

### 5️⃣ Tree Adoption & Story Timeline
- Users or institutions can adopt trees (feature in development)
- Each tree maintains a timeline of care events and photos
- Adoption certificates can be generated and shared
- Long-term commitment tracking

### 6️⃣ Admin, NGO & School Dashboards
Authorized users can view:
- **Total registered trees** (approved vs pending)
- **Active vs inactive trees** (cared for in last 30 days)
- **Area-wise survival rates** and care frequency patterns
- **Top contributors** and institutions
- **Flagged activities** for review and moderation
- **Care frequency heatmaps** by location

---

## 🌍 Environmental Impact Tracking

Impact is calculated using **publicly available static values**, not AI models:

### CO₂ Absorption
```
CO₂ Absorbed = (Number of Trees × CO₂ per tree per year × Years since planting)
Default: ~21.77 kg CO₂ per tree per year
```

### Oxygen Generation
```
Oxygen Generated = (Number of Trees × Oxygen per tree per year × Years since planting)
Default: ~118 kg O₂ per tree per year
```

### Survival Rate
```
Survival Rate = (Active Trees / Approved Trees) × 100
Active Trees = Trees with care logs in last 30 days
```

All calculations are documented and transparent, using standard environmental science formulas.

---

## 🧩 Key Features

### Core Functionality
- ✅ **Tree Registration** - GPS-based tree registration with photo upload
- ✅ **Interactive Map** - View all registered trees on Google Maps
- ✅ **Care Logging** - Verified watering and care activities
- ✅ **Rule-Based Validation Engine** - GPS, timestamp, and frequency checks
- ✅ **Gamification** - Green Coins, XP system, and leaderboards
- ✅ **Admin Dashboard** - Tree approval, user management, flagged activity review
- ✅ **User Dashboard** - Personal tree registry, care history, XP tracking
- ✅ **Community Features** - Top members, top communities, endorsements

### Data Validation & Anti-Misuse
- ✅ **GPS Radius Validation** - Must be within 50 meters of tree
- ✅ **24-Hour Frequency Limit** - One care log per tree per day per user
- ✅ **Photo Verification** - EXIF data extraction for location and timestamp
- ✅ **Suspicious Activity Flagging** - Automatic detection of unusual patterns
- ✅ **Admin Review System** - Manual verification for flagged activities

### Impact & Transparency
- ✅ **Environmental Metrics** - CO₂ absorbed, oxygen generated, survival rates
- ✅ **Public Statistics** - Homepage displays real-time impact metrics
- ✅ **Transparent Calculations** - All formulas are rule-based and auditable

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Tailwind CSS for styling
- **JavaScript (ES6+)** - Vanilla JS with modules
- **Google Maps API** - Interactive map integration
- **Material Icons** - Icon library

### Backend & Services (Pre-Configured)
- **Firebase Authentication** - Google Sign-In, user management (already connected)
- **Cloud Firestore** - NoSQL database for trees, users, care logs (already connected)
- **Firebase Analytics** - Usage tracking (already configured)
- **Firestore Security Rules** - Access control and data validation (already deployed)
- **Google Maps API** - Interactive map integration (already configured)

### Key Libraries & APIs
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase SDK v10.12.2** - Authentication, Firestore, Analytics
- **EXIF.js** - Photo metadata extraction (GPS, timestamp)
- **UI Avatars API** - Generated user avatars

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Modern Web Browser** (Chrome, Firefox, Edge, Safari - latest versions)
- **Internet Connection** - Required for Firebase and Google Maps APIs

**That's it!** All APIs, Firebase configuration, and Google Maps are already connected and ready to use.

---

## 🚀 Getting Started

## 🌐 Use Without Download (Recommended)

GreenGuard is fully web-based and does **not require any installation or download**.

Simply open the live application:

👉 https://green-guard-69.netlify.app/

- Sign in using your **Google account**
- Start registering and caring for trees instantly
- Works on desktop and mobile browsers

No setup. No build. No installation.


### Quick Start (3 Steps)

#### 1. Download the Repository
```bash
git clone [https://github.com/yourusername/greenguard_landing_page.git](https://github.com/gsaianimesh/green_guard.git)
```

Or download as ZIP and extract the files.

#### 2. Open the Application
Simply open `index.html` in your web browser:
- **Double-click** `index.html` in your file explorer, OR
- **Right-click** → Open with → Your preferred browser

#### 3. Start Using GreenGuard!
- The application will load with all APIs and services already configured
- Click "Login" to sign in with Google
- Start registering trees and logging care activities!

### That's It! 🎉

All Firebase services, Google Maps API, and authentication are **pre-configured** and connected to our production environment. No setup required!

### Optional: Local Web Server (For Development)

If you want to run it on a local server (recommended for development):

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

**Note**: Direct file access (`file://`) also works, but some browsers may have CORS restrictions. Using a local server is recommended for the best experience.

---

## 📁 Project Structure

```
greenguard_landing_page/
│
├── index.html              # Homepage
├── about.html              # About page
├── partners.html           # Partners & rewards page
├── faq.html                # FAQ page
├── auth.html               # Authentication page
├── dashboard.html          # User dashboard
├── admin.html              # Admin dashboard
├── register-tree.html      # Tree registration page
├── view-tree.html          # Tree map view
├── water-tree.html         # Care logging page
├── profile.html            # User profile page
│
├── firebase-init.js        # Firebase configuration
├── home.js                 # Homepage logic & metrics
├── auth.js                 # Authentication logic
├── dashboard.js            # User dashboard logic
├── admin.js                # Admin dashboard logic
├── register-tree.js        # Tree registration logic
├── view-tree.js            # Map view logic
├── water-tree.js           # Care logging logic
├── profile.js              # Profile management
│
├── firestore.rules         # Firestore security rules
│
└── README.md               # This file
```

---

## 🔐 Security & Permissions

### Pre-Configured Security
The application uses Firestore security rules that are already deployed:

- **Public Read**: Tree data (approved trees) and user profiles are publicly readable
- **Authenticated Write**: Users can only create/update their own data
- **Admin Only**: Tree approval, user management, and flagged activity review

Security rules are defined in `firestore.rules` and are already active in production.

### Data Privacy
- User emails and UIDs are stored securely in Firebase Auth
- GPS coordinates are used only for tree location verification
- Photos are stored as base64 data URLs (not uploaded to external servers)
- Personal information is only visible to users and administrators

---

## 🎮 Usage Guide

### For Regular Users

1. **Sign In**: Use Google Sign-In to create or access your account
2. **Register a Tree**: Click "Register a Tree", fill in details, capture GPS location, upload photo
3. **Water Trees**: Find nearby trees on the map, upload a photo, log care activity
4. **Track Progress**: View your dashboard for XP, registered trees, and care history
5. **Earn Rewards**: Accumulate Green Coins through verified activities

### For Administrators

1. **Access Admin Panel**: Sign in with admin account
2. **Approve Trees**: Review pending tree registrations
3. **Review Flagged Activities**: Check suspicious care logs
4. **Monitor Metrics**: View dashboard statistics and impact metrics
5. **Manage Users**: View user activity and manage accounts

### For NGOs/Schools

1. **View Public Statistics**: Check homepage for impact metrics
2. **Monitor Trees**: Use admin dashboard (if granted access) to track survival rates
3. **Encourage Participation**: Share platform with community members
4. **Track Impact**: Use survival rate and care frequency data for reporting

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User authentication (Google Sign-In)
- [ ] Tree registration with GPS capture
- [ ] Photo upload with EXIF data extraction
- [ ] Care logging with validation rules
- [ ] GPS proximity validation (50m radius)
- [ ] 24-hour frequency limit enforcement
- [ ] Admin tree approval workflow
- [ ] Flagged activity detection
- [ ] Dashboard statistics display
- [ ] Map view with tree markers
- [ ] Impact metrics calculation

### Browser Compatibility
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest)

---

## 🐛 Known Issues & Limitations

- **Photo Storage**: Currently using base64 encoding (limited by Firestore document size)
- **Adoption Feature**: Tree adoption functionality is in development
- **Reward Redemption**: Green Coin redemption system is coming soon
- **Mobile Optimization**: Some features may need mobile-specific improvements
- **Offline Support**: Currently requires internet connection

---

## 🚧 Future Enhancements

- [ ] Tree adoption system with certificates
- [ ] Green Coin redemption marketplace
- [ ] QR code generation for trees
- [ ] Push notifications for care reminders
- [ ] Mobile app (React Native / Flutter)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Social sharing features
- [ ] Tree health timeline visualization
- [ ] Community challenges and events

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style and structure
- Ensure all validation rules remain rule-based (no AI/ML)
- Test thoroughly before submitting
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors & Credits

- **Development Team** - GreenGuard Platform
- **Firebase** - Authentication and database services
- **Google Maps** - Mapping functionality
- **Tailwind CSS** - Styling framework
- **Material Icons** - Icon library

---

## 📞 Support & Contact

- **Documentation**: See `about.html` and `faq.html` for detailed information
- **Issues**: Report bugs or request features via GitHub Issues
- **Email**: animesh@failbox.me

---

## 🙏 Acknowledgments

- Environmental organizations and NGOs working on tree plantation
- Community members contributing to tree care
- Open-source libraries and frameworks used in this project

---

## 📊 Project Status

**Current Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2025

---

<div align="center">

**Made with 🌱 for a greener planet**

[Homepage](index.html) • [About](about.html) • [Partners](partners.html) • [FAQ](faq.html)

</div>
