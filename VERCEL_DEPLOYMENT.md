# Vercel Deployment Guide for Farmetrics

## 🚀 Quick Deploy to Vercel

### Required Environment Variables

When deploying to Vercel, you'll need to set these environment variables in the Vercel dashboard:

#### **Essential Variables (Required)**
```
VITE_SUPABASE_URL=https://fxlklgnfskkdwqzveuhl.supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

#### **Optional Variables (Recommended)**
```
VITE_APP_NAME=Farmetrics
VITE_SESSION_TIMEOUT=480
NODE_ENV=production
```

### Step-by-Step Deployment

1. **Prepare Your Supabase Credentials**
   - Go to your Supabase dashboard: https://app.supabase.com/project/fxlklgnfskkdwqzveuhl
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon public" key

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your repository
   - Configure the project:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables**
   In the Vercel dashboard, go to your project settings → Environment Variables and add:

   | Variable Name | Value | Environment |
   |---------------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://fxlklgnfskkdwqzveuhl.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | [Your actual anon key] | Production, Preview, Development |
   | `VITE_APP_NAME` | `Farmetrics` | Production, Preview, Development |
   | `VITE_SESSION_TIMEOUT` | `480` | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |

4. **Deploy**
   - Click "Deploy" and wait for the build to complete

### Configuration Files Included

- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `vite.config.ts` - Vite build configuration  
- ✅ `.env.example` - Environment variables template

### Build Settings

The project is configured with:
- **Framework**: Vite (React + TypeScript)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x (automatically detected)

### Security Headers

The deployment includes security headers:
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer Policy

### Routing Configuration

Single Page Application (SPA) routing is configured to handle all routes through `index.html`.

### Performance Optimizations

- Static assets are cached for 1 year
- Gzip compression enabled
- Immutable caching for versioned assets

## 🔧 Post-Deployment Checklist

### 1. **Verify Supabase Connection**
- Test admin login at: `https://your-domain.vercel.app/admin-signin`
- Test supervisor login at: `https://your-domain.vercel.app/supervisor-signin`

### 2. **Configure Supabase for Production**

In your Supabase dashboard:

1. **Update Site URL**:
   - Go to Authentication → URL Configuration
   - Set Site URL to: `https://your-domain.vercel.app`
   - Add Redirect URLs: `https://your-domain.vercel.app/**`

2. **Configure Email Templates** (if using auth emails):
   - Go to Authentication → Email Templates
   - Update the redirect URLs in email templates

3. **Set up Custom Domain** (optional):
   - In Vercel, go to Settings → Domains
   - Add your custom domain
   - Update Supabase Site URL accordingly

### 3. **Test Core Functionality**
- [ ] User authentication (admin/supervisor)
- [ ] Dashboard data loading
- [ ] Map functionality
- [ ] File uploads (APK management)
- [ ] Responsive design on mobile

### 4. **Monitor Performance**
- Use Vercel Analytics for performance monitoring
- Check Supabase dashboard for API usage
- Monitor for any error logs

## 🔑 Security Considerations

1. **Environment Variables**: Never commit actual keys to version control
2. **CORS**: Ensure Supabase CORS settings include your Vercel domain
3. **RLS Policies**: Verify Row Level Security policies are working correctly
4. **API Rate Limits**: Monitor Supabase usage to avoid hitting limits

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check that all environment variables are set correctly
   - Ensure Node.js version is 18.x or higher

2. **Supabase Connection Errors**:
   - Verify the Supabase URL and anon key are correct
   - Check if the Supabase project is active and not paused

3. **Routing Issues**:
   - Ensure `vercel.json` is properly configured for SPA routing

4. **Authentication Issues**:
   - Verify Site URL in Supabase matches your Vercel domain
   - Check redirect URLs configuration

### Getting Help:
- Check Vercel deployment logs for build errors
- Review Supabase logs for API errors
- Test locally with production environment variables

---

## 📋 Environment Variables Quick Copy

**For Vercel Dashboard:**

```
VITE_SUPABASE_URL=https://fxlklgnfskkdwqzveuhl.supabase.co
VITE_SUPABASE_ANON_KEY=[PASTE_YOUR_ACTUAL_ANON_KEY_HERE]
VITE_APP_NAME=Farmetrics
VITE_SESSION_TIMEOUT=480
NODE_ENV=production
```

**⚠️ Important**: Replace `[PASTE_YOUR_ACTUAL_ANON_KEY_HERE]` with your actual Supabase anon key from the Supabase dashboard. 