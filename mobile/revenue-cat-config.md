# Revenue Cat Configuration Guide

This document provides step-by-step instructions for configuring Revenue Cat for Recipe Wizard's premium subscription system.

## Prerequisites

Before setting up Revenue Cat, you'll need:

1. **Apple Developer Account** ($99/year) - Required for iOS app store
2. **Google Play Developer Account** ($25 one-time) - Required for Android app store
3. **Revenue Cat Account** (Free for up to $10K monthly tracked revenue)

## Phase 3 Implementation Status ✅

- ✅ Revenue Cat SDK integrated
- ✅ Purchase service wrapper created
- ✅ Premium context updated with Revenue Cat integration
- ✅ Subscription plans screen connected to Revenue Cat offerings
- ✅ Purchase flow implemented with error handling
- ✅ Success/failure screens updated for Revenue Cat responses
- ✅ Mock mode for development and testing

## Revenue Cat Dashboard Setup

### 1. Create Revenue Cat Account

1. Go to [RevenueCat.com](https://www.revenuecat.com/)
2. Sign up for a free account
3. Create a new app project for "Recipe Wizard"

### 2. Configure App Details

```
App Name: Recipe Wizard
Bundle ID (iOS): com.yourcompany.recipewizard
Package Name (Android): com.yourcompany.recipewizard
```

### 3. Get API Keys

After creating your app, you'll find your API keys in:
- **Settings** → **API Keys**
- Copy the **iOS API Key** and **Android API Key**

### 4. Configure API Keys Securely

**⚠️ SECURITY: Never commit real API keys to version control!**

1. **Copy the example environment file:**
   ```bash
   cd mobile
   cp .env.example .env
   ```

2. **Update your `.env` file with real API keys:**
   ```bash
   # Edit mobile/.env
   EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS=appl_xxxxxxxxxxxxxxxxxx
   EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID=goog_xxxxxxxxxxxxxxxxxx
   ```

3. **Verify .env is in .gitignore:**
   The `.env` file should already be excluded from version control. Never commit files containing real API keys.

**Note:** Revenue Cat public API keys are safe for client-side use, but should still be managed securely to prevent abuse.

## App Store Configuration

### iOS App Store Setup

1. **Create App in App Store Connect**
   - Bundle ID: `com.yourcompany.recipewizard`
   - App Name: "Recipe Wizard"

2. **Create In-App Purchase Products**
   - Product Type: Auto-Renewable Subscription
   - Product IDs:
     - Monthly: `recipe_wizard_monthly`
     - Yearly: `recipe_wizard_yearly`
   - Pricing:
     - Monthly: $4.99/month
     - Yearly: $49.99/year

3. **Create Subscription Group**
   - Group Name: "Recipe Wizard Premium"
   - Add both monthly and yearly products to this group

### Android Google Play Setup

1. **Create App in Google Play Console**
   - Package name: `com.yourcompany.recipewizard`
   - App name: "Recipe Wizard"

2. **Create Subscription Products**
   - Go to **Monetize** → **Products** → **Subscriptions**
   - Create products with same IDs as iOS:
     - `recipe_wizard_monthly` - $4.99/month
     - `recipe_wizard_yearly` - $49.99/year

## Revenue Cat Product Configuration

### 1. Add Products to Revenue Cat

In Revenue Cat dashboard:

1. Go to **Products**
2. Click **+ New Product**
3. Add each product:

**Monthly Product:**
```
Product ID: recipe_wizard_monthly
Display Name: Monthly Premium
Type: Subscription
App Store Product ID: recipe_wizard_monthly (iOS)
Play Store Product ID: recipe_wizard_monthly (Android)
```

**Yearly Product:**
```
Product ID: recipe_wizard_yearly
Display Name: Yearly Premium
Type: Subscription
App Store Product ID: recipe_wizard_yearly (iOS)
Play Store Product ID: recipe_wizard_yearly (Android)
```

### 2. Create Offerings

1. Go to **Offerings**
2. Create a new offering:
   - Identifier: `default`
   - Description: "Recipe Wizard Premium Plans"

3. Add packages to the offering:
   - **Monthly Package**: Attach `recipe_wizard_monthly` product
   - **Yearly Package**: Attach `recipe_wizard_yearly` product

### 3. Configure Entitlements

1. Go to **Entitlements**
2. Create entitlement:
   - Identifier: `premium_features` (matches `ENTITLEMENT_ID` in code)
   - Description: "Recipe Wizard Premium Features"

3. Attach both products to this entitlement

## Testing Configuration

### 1. Sandbox Testing (iOS)

1. **Create Sandbox Test User**
   - Go to App Store Connect → **Users and Access** → **Sandbox Testers**
   - Create test accounts with valid but fake email addresses

2. **Configure Test Device**
   - Sign out of production App Store on test device
   - Sign in with sandbox test account

### 2. Google Play Testing

1. **Internal Testing Track**
   - Upload app to Internal Testing track in Google Play Console
   - Add test user emails to testing group

2. **License Testing**
   - Add test Gmail accounts to License Testing list
   - Set test responses for subscriptions

### 3. Revenue Cat Test Mode

Revenue Cat automatically detects sandbox purchases and marks them appropriately in the dashboard.

## Environment Variables

The app uses environment variables for secure configuration:

### Local Development (.env file)
```bash
# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=https://recipe-wizard-api-8b81a32e7184.herokuapp.com

# Development Configuration
EXPO_PUBLIC_DEBUG=true

# Revenue Cat API Keys
EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS=appl_xxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID=goog_xxxxxxxxxxxxxxxxxx

# Premium Testing Configuration
EXPO_PUBLIC_IS_PREMIUM=false
```

### Production/EAS Build
For production builds, set environment variables in your EAS build configuration or CI/CD pipeline. Never include real API keys in version control.

## Security Best Practices

### API Key Security
- ✅ **Public Keys**: Revenue Cat API keys are public keys safe for client-side use
- ✅ **Environment Variables**: Keys are stored in `.env` files, not hardcoded
- ✅ **Git Ignore**: `.env` files are excluded from version control
- ⚠️ **Team Sharing**: Share keys securely (encrypted files, password managers, etc.)
- ⚠️ **Key Rotation**: Consider rotating keys periodically for security

### What's Safe vs. What's Not
```bash
# ✅ SAFE - These are public keys designed for client apps
EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS=appl_xxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID=goog_xxxxxxxxxxxxxxxxxx

# ❌ NEVER PUT THESE IN CLIENT APPS:
# - Backend API keys
# - Database credentials
# - Payment processing keys
# - Admin tokens
```

### Development Team Setup
1. **Copy .env.example to .env** for each developer
2. **Share API keys securely** (Slack DM, password manager, etc.)
3. **Never commit .env files** to Git
4. **Use different keys for staging/production** environments

## Validation Checklist

Before going live, verify:

- [ ] Revenue Cat API keys are correctly configured
- [ ] App Store Connect in-app purchases are approved
- [ ] Google Play Console subscriptions are active
- [ ] Revenue Cat products match store product IDs exactly
- [ ] Entitlement is properly configured with all products
- [ ] Sandbox testing works on both platforms
- [ ] Purchase restoration works correctly
- [ ] Error handling is working for failed purchases
- [ ] Subscription management links work

## Testing Scenarios

### Test Cases to Verify

1. **Successful Purchase Flow**
   - User can view subscription plans from Revenue Cat offerings
   - Purchase completes successfully
   - Premium features are immediately unlocked
   - Purchase appears in Revenue Cat dashboard

2. **Purchase Restoration**
   - Previous purchases are restored correctly
   - Premium status is updated after restoration
   - Works across app reinstalls

3. **Error Handling**
   - Cancelled purchases are handled gracefully
   - Network errors show appropriate messages
   - Invalid products are handled correctly

4. **Subscription Management**
   - Users can manage subscriptions through device settings
   - Cancellations are reflected in app
   - Renewals work correctly

## Troubleshooting

### Common Issues

1. **"Product not available for purchase"**
   - Verify product IDs match exactly between app stores and Revenue Cat
   - Check that products are approved in app store
   - Ensure app version matches the one with approved in-app purchases

2. **API Key Issues**
   - Verify API keys are correct and not placeholder values
   - Check that bundle ID/package name matches Revenue Cat configuration
   - Ensure proper platform API key is being used

3. **Sandbox Testing Problems**
   - Make sure test device is signed in with sandbox account
   - Clear app data and restart if purchases seem stuck
   - Check Revenue Cat dashboard for sandbox purchase events

## Going Live

### Pre-Launch Checklist

1. **App Store Approval**
   - Submit app to App Store Connect for review
   - Wait for in-app purchase approval (can take 24-48 hours)
   - Submit Google Play app for review

2. **Revenue Cat Production**
   - Switch from sandbox to production API keys
   - Remove development/test mode flags
   - Monitor Revenue Cat dashboard for real purchases

3. **Monitoring Setup**
   - Set up Revenue Cat webhooks for purchase events
   - Configure analytics for subscription metrics
   - Set up alerts for failed purchases or issues

## Support Resources

- **Revenue Cat Documentation**: https://docs.revenuecat.com/
- **Apple In-App Purchase Guide**: https://developer.apple.com/in-app-purchase/
- **Google Play Billing Guide**: https://developer.android.com/google/play/billing

---

*This configuration was set up for Recipe Wizard Phase 3 implementation. Update API keys and product IDs as needed for your specific setup.*