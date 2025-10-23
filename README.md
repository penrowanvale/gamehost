# GameBlast Mobile - Ultimate Mobile Gaming Platform

A comprehensive mobile-first gaming platform built for Tambola, number games, and other interactive competitions. This platform connects users with game organisers and provides a seamless experience for game participation, payment verification, and prize distribution.

## 🚀 Features

### For Users
- **Mobile-First Design**: Optimized for mobile devices with PWA capabilities
- **Game Discovery**: Browse featured and top games with advanced filtering
- **Secure Registration**: Easy signup with payment verification system
- **Sheet Selection**: Interactive sheet selection with pricing tiers
- **Payment Integration**: UPI QR code payments with UTR verification
- **Real-time Updates**: Live game notifications and status updates
- **Leaderboard**: View winners and platform statistics

### For Organisers
- **Organiser Dashboard**: Complete game management interface
- **Game Creation**: Easy game setup with customizable pricing
- **Payment Verification**: Approve/reject user payments with UTR tracking
- **Google Drive Integration**: Manage game sheets through Google Drive
- **Participant Management**: Track registrations and downloads
- **Revenue Analytics**: Profit/loss tracking and game statistics

### For Admins
- **Complete Platform Control**: Manage users, organisers, and games
- **Featured Games Management**: Control homepage game promotions
- **Sponsored Ads**: Manage advertisement banners and placements
- **News Banner**: Control scrolling news ticker content
- **Ad Network Integration**: Manage Google AdSense, TapJoy, and Meta ads
- **Data Export**: Download platform data in Excel format
- **Organiser Approval**: Review and approve organiser applications

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcrypt
- **File Storage**: Google Drive API integration
- **Deployment**: Vercel
- **PWA**: Service Worker with offline capabilities

## 📱 Mobile-First Approach

- Responsive design optimized for mobile devices
- Touch-friendly interfaces and interactions
- Fast loading with optimized assets
- Progressive Web App (PWA) capabilities
- Offline functionality for essential features

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Supabase account
- Google Drive API credentials (for sheet management)
- Vercel account (for deployment)

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd gameblast-mobile
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration
Create a \`.env\` file in the root directory:

\`\`\`env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key_min_32_characters

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+1234567890

# Google Drive API (for sheet management)
GOOGLE_DRIVE_CLIENT_ID=your_google_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_drive_client_secret

# Environment
NODE_ENV=development
\`\`\`

### 4. Database Setup

#### Create Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new project
2. Copy the project URL and API keys
3. Run the database schema:

\`\`\`sql
-- Execute the contents of config/database-schema.sql in your Supabase SQL editor
\`\`\`

#### Create Admin User
\`\`\`sql
-- Insert admin user (replace with your details)
INSERT INTO users (username, email, phone, password_hash, role) 
VALUES (
  'admin', 
  'admin@yourdomain.com', 
  '+1234567890', 
  '$2a$10$example_hash_replace_with_real_hash', 
  'admin'
);
\`\`\`

### 5. Google Drive API Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Add authorized redirect URIs
6. Download credentials and add to environment variables

### 6. Local Development
\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\` to view the application.

## 🚀 Deployment to Vercel

### 1. Prepare for Deployment
Ensure all environment variables are properly configured in your \`.env\` file.

### 2. Deploy to Vercel

#### Option A: Vercel CLI
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to configure your project
\`\`\`

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### 3. Configure Environment Variables in Vercel
In your Vercel dashboard, add all environment variables from your \`.env\` file:

- \`SUPABASE_URL\`
- \`SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`JWT_SECRET\`
- \`ADMIN_EMAIL\`
- \`ADMIN_PHONE\`
- \`GOOGLE_DRIVE_CLIENT_ID\`
- \`GOOGLE_DRIVE_CLIENT_SECRET\`
- \`NODE_ENV=production\`

### 4. Custom Domain (Optional)
1. Add your custom domain in Vercel dashboard
2. Configure DNS records as instructed
3. SSL certificate will be automatically provisioned

## 📊 Database Schema

The platform uses the following main tables:

- **users**: User accounts (users, organisers, admins)
- **organisers**: Extended organiser profiles
- **games**: Game information and settings
- **game_participants**: User registrations and payments
- **game_winners**: Game results and prizes
- **sponsored_ads**: Advertisement management
- **news_banner**: News ticker content
- **admin_settings**: Platform configuration
- **ad_scripts**: Ad network integration

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Row Level Security**: Supabase RLS policies
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured CORS policies
- **Rate Limiting**: API rate limiting (implement as needed)

## 💰 Monetization Features

- **Organiser Fees**: Monthly subscription for organisers (₹2,500/month)
- **Featured Game Promotions**: Paid promotions with glow effects
- **Sponsored Advertisements**: Banner ad placements
- **Ad Network Integration**: Google AdSense, TapJoy, Meta ads
- **Commission Structure**: Configurable commission on games (optional)

## 🎮 Game Flow

1. **User Registration**: Users sign up with basic information
2. **Game Discovery**: Browse available games with filters
3. **Sheet Selection**: Choose sheets and pricing tier
4. **Payment**: UPI payment via QR code
5. **Verification**: Organiser verifies payment using UTR ID
6. **Sheet Download**: Download selected sheets after approval
7. **Live Game**: Join meeting and play the game
8. **Results**: Winners announced and added to leaderboard

## 📱 PWA Features

- **Installable**: Can be installed on mobile devices
- **Offline Support**: Basic functionality works offline
- **Push Notifications**: Game notifications (implement as needed)
- **App-like Experience**: Full-screen mobile app experience

## 🔧 Admin Panel Features

- **User Management**: View and manage all users
- **Organiser Approval**: Review organiser applications
- **Game Promotion**: Feature games on homepage
- **Content Management**: News banner and advertisements
- **Analytics**: Platform statistics and data export
- **Ad Network**: Manage ad scripts and placements

## 📈 Analytics & Reporting

- **Game Statistics**: Participation and revenue tracking
- **User Analytics**: Registration and engagement metrics
- **Organiser Reports**: Individual organiser performance
- **Platform Metrics**: Overall platform health and growth
- **Export Functionality**: Excel export for all data

## 🛡️ Legal & Compliance

- **Terms & Conditions**: Platform usage terms
- **Privacy Policy**: Data protection and privacy
- **Disclaimer**: Platform liability limitations
- **Refund Policy**: Payment and refund guidelines
- **Age Verification**: 18+ age requirement enforcement

## 🔄 Future Enhancements

- **Mobile Apps**: Native iOS and Android apps
- **Payment Gateway**: Direct payment processing
- **Live Streaming**: Integrated game streaming
- **Social Features**: User profiles and social sharing
- **Advanced Analytics**: Detailed reporting dashboard
- **Multi-language**: Support for regional languages
- **Cryptocurrency**: Crypto payment options

## 📞 Support & Maintenance

- **Error Monitoring**: Implement error tracking (Sentry)
- **Performance Monitoring**: Monitor app performance
- **Regular Backups**: Automated database backups
- **Security Updates**: Regular dependency updates
- **Feature Updates**: Continuous platform improvements

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. For any contributions or modifications, please contact the project owner.

---

**GameBlast Mobile** - Revolutionizing mobile gaming experiences with seamless technology and user-centric design.

For support or queries, contact: support@gameblast.in