# Farmetrics - Agricultural Data Management System

A comprehensive web application for managing agricultural data collection in Ghana, designed for admins and supervisors to oversee field operations and data quality.

## 🚀 Project Overview

Farmetrics is a production-ready agricultural monitoring platform that enables:
- **Admin Dashboard**: Complete system oversight and management
- **Supervisor Portal**: Regional farm and field officer management  
- **APK Management**: Mobile app distribution for field officers
- **Data Collection**: Real-time agricultural data from field operations

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Charts**: Recharts
- **Maps**: Leaflet.js
- **State Management**: React Query
- **Routing**: React Router v6

## 📋 Implementation Status

### ✅ **Completed Features**

#### Authentication & Security
- [x] **Multi-role authentication system** (Admin, Supervisor, Field Officer)
- [x] **Row Level Security (RLS)** policies for data protection
- [x] **PKCE authentication flow** for enhanced security
- [x] **Protected routes** with role-based access control
- [x] **Session management** with automatic token refresh

#### Admin Dashboard
- [x] **Real-time statistics dashboard** with live data
- [x] **Field officer management** with approval workflows
- [x] **Farm management** with approval system
- [x] **Visit tracking and reporting** with performance metrics
- [x] **APK management system** for mobile app distribution
- [x] **Geographic data visualization** with farm polygons
- [x] **Activity monitoring** and system logs

#### Data Management
- [x] **Farm polygon capture** and storage (GeoJSON)
- [x] **EXIF metadata extraction** from field photos
- [x] **Media storage** with Supabase buckets
- [x] **Visit progress tracking** with completion rates
- [x] **Issue reporting system** with status tracking
- [x] **Real-time data synchronization**

#### User Interfaces
- [x] **Responsive design** for all screen sizes
- [x] **Dark/light theme support**
- [x] **Mobile-first APK download page**
- [x] **Professional admin interface**
- [x] **Intuitive navigation** and layout
- [x] **Loading state optimization**

#### Database Schema
- [x] **Complete database structure** with all required tables
- [x] **Foreign key relationships** properly configured
- [x] **Data validation** and constraints
- [x] **Migration system** for schema updates
- [x] **Backup and recovery** considerations

### 🔄 **In Progress**

#### Data Export System
- [ ] **Excel export** functionality for reports
- [ ] **PDF generation** for stakeholder reports
- [ ] **CSV export** for data analysis
- [ ] **Custom report builders**

#### Mobile Integration APIs
- [ ] **Farmer/farm submission endpoints** for mobile app
- [ ] **Visit data synchronization** APIs
- [ ] **Issue reporting** mobile endpoints
- [ ] **Offline data sync** capabilities

### 📅 **Planned Features**

#### Analytics & Reporting
- [ ] **Advanced analytics dashboard**
- [ ] **Regional comparison reports**
- [ ] **Crop yield analysis**
- [ ] **Performance benchmarking**

#### System Optimization
- [ ] **Database query optimization**
- [ ] **Caching implementation**
- [ ] **Performance monitoring**
- [ ] **Error tracking system**

## 🚦 **Getting Started**

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farmetrics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_NAME=Farmetrics
   VITE_SESSION_TIMEOUT=480
   ```

4. **Database Setup**
   - Run the migration files in `supabase/migrations/`
   - Set up Row Level Security policies
   - Create storage buckets for media and APK files

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 **Project Structure**

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   ├── common/          # Shared layout components
│   ├── maps/            # Map visualization components
│   └── ui/              # Base UI components (shadcn/ui)
├── hooks/               # Custom React hooks
├── integrations/        # Third-party integrations
│   └── supabase/        # Supabase client and types
├── pages/               # Page components
│   ├── admin/           # Admin dashboard pages
│   └── [public pages]   # Public pages
├── services/            # Business logic and API calls
└── lib/                 # Utility functions
```

## 🔑 **Key Features Implemented**

### APK Management System
- **Upload Management**: Secure APK file uploads for admins
- **Version Control**: Activate/deactivate APK versions
- **Download Tracking**: Monitor download statistics
- **Public Distribution**: Field officer download page

### Field Officer Management
- **Account Approval**: Admin approval workflow for new officers
- **Performance Tracking**: Visit completion and progress monitoring
- **Regional Assignment**: Geographic assignment management

### Farm & Visit Management
- **Farm Registration**: Complete farm data with polygon coordinates
- **Visit Tracking**: Multi-cycle visit progress monitoring
- **Data Quality**: EXIF metadata validation and GPS verification

## 🛡️ **Security Implementation**

- **Row Level Security**: Database-level access control
- **Role-based Authentication**: Admin, Supervisor, Field Officer roles
- **Secure File Storage**: Protected APK and media storage
- **API Security**: Authenticated endpoints with proper authorization

## 📊 **Performance Optimizations**

- **Reduced Loading States**: Minimized loading indicators
- **Lazy Loading**: Component-based code splitting
- **Optimized Queries**: Efficient database queries
- **Caching Strategy**: Smart data caching implementation

## 🤝 **Contributing**

This is a production system with specific requirements. All changes should be:
1. Tested thoroughly
2. Documented properly
3. Approved by stakeholders
4. Deployed through proper channels

## 📞 **Support**

For technical support or questions about the system:
- Contact the development team
- Review the inline documentation
- Check the Supabase dashboard for real-time issues

---

**Status**: Production Ready ✅  
**Last Updated**: January 2025  
**Version**: 1.0.0
