# ZapSplit App Store Submission Checklist

> Last Updated: February 6, 2026
> Status: PRE-SUBMISSION AUDIT

---

## EXECUTIVE SUMMARY

Your app is **~85% ready** for submission. There are several critical items that MUST be fixed before submitting to either store.

### Critical Blockers (MUST FIX)
1. **Google Sign In NOT implemented** - Required for Android, recommended for iOS
2. **Help & Support goes to wrong screen** - Bug reported
3. **Deep linking web files missing** - Need AASA and assetlinks.json
4. **Bundle identifier is placeholder** - `com.yourname.zapsplit` must be updated

### What's Already Good
- Apple Pay & Google Pay configured
- Apple Sign In implemented
- Privacy Policy & Terms of Service complete
- Delete Account functionality (Apple requirement)
- Dark mode support
- All permissions properly declared

---

## PART 1: CRITICAL BUGS TO FIX

### 1.1 Help & Support Navigation Bug
**Status:** BUG - Goes to Settings instead of Help screen
**Priority:** HIGH
**File:** `src/screens/profile/ProfileScreen.tsx` (or wherever Help & Support is)
**Fix:** Ensure navigation goes to correct Help/FAQ screen

### 1.2 Default Profile Photo
**Status:** NEEDS VERIFICATION
**Current:** Uses initials with blue gradient
**Required:** Grey silhouette fallback like other apps (optional, current is fine)
**File:** `src/components/common/Avatar.tsx`

---

## PART 2: AUTHENTICATION

### 2.1 Apple Sign In
**Status:** IMPLEMENTED
**Location:** `src/hooks/useAuth.ts` (lines 74-124)
- Requests fullName and email scopes
- Creates profile automatically
- Platform check for iOS only

### 2.2 Google Sign In
**Status:** NOT IMPLEMENTED
**Priority:** CRITICAL for Android, RECOMMENDED for iOS

#### Step-by-Step Implementation Guide:

**Step 1: Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client IDs"
5. Create TWO credentials:
   - **iOS:** Select "iOS", enter bundle ID: `com.zapsplit.app`
   - **Android:** Select "Android", enter package name: `com.zapsplit.app`, add SHA-1 fingerprint from Play Console
6. Copy the Client IDs

**Step 2: Supabase Setup**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → "Authentication" → "Providers"
3. Enable "Google"
4. Paste your Google Client ID and Client Secret
5. Save

**Step 3: Install Package**
```bash
npx expo install @react-native-google-signin/google-signin
```

**Step 4: Update app.json**
Add to plugins array:
```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
  }
]
```

**Step 5: Add to useAuth.ts**
```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// In useAuth hook, add:
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
});

const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const { idToken } = await GoogleSignin.getTokens();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google Sign In error:', error);
    throw error;
  }
};
```

**Step 6: Add Button to LoginScreen.tsx and SignupScreen.tsx**
```tsx
<TouchableOpacity
  style={styles.googleButton}
  onPress={signInWithGoogle}
>
  <Ionicons name="logo-google" size={20} color="#DB4437" />
  <Text style={styles.googleButtonText}>Continue with Google</Text>
</TouchableOpacity>
```

**Step 7: Rebuild the App**
```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

**Note:** If you offer Apple Sign In on iOS, Apple REQUIRES you offer it. If you offer Google Sign In, Apple says you MUST also offer Apple Sign In (which you have).

### 2.3 Email/Password Auth
**Status:** IMPLEMENTED
**Location:** `src/screens/auth/LoginScreen.tsx`, `SignupScreen.tsx`

---

## PART 3: PAYMENT INTEGRATION

### 3.1 Apple Pay
**Status:** ENABLED
**Location:** `src/services/stripeService.ts` (lines 187-189)
```javascript
applePay: {
  merchantCountryCode: 'AU',
}
```
**Verification Needed:**
- [ ] Apple Pay certificate in Apple Developer Portal
- [ ] Merchant ID in Stripe Dashboard matches app.json
- [ ] Test on physical device

### 3.2 Google Pay
**Status:** ENABLED
**Location:** `src/services/stripeService.ts` (lines 191-194)
```javascript
googlePay: {
  merchantCountryCode: 'AU',
  testEnv: __DEV__,
}
```
**Verification Needed:**
- [ ] Google Pay merchant account configured
- [ ] Test on physical Android device

### 3.3 Stripe Connect
**Status:** IMPLEMENTED
- Create account flow
- Account status checking
- Instant payouts (just deployed!)

---

## PART 4: PRIVACY & LEGAL COMPLIANCE

### 4.1 Privacy Policy
**Status:** COMPLETE
**Location:** `src/screens/settings/PrivacyPolicyScreen.tsx`
**Last Updated:** January 2026
**Contents:**
- Data collection disclosure
- Third-party sharing (Stripe, Supabase, OpenAI)
- Data retention (30 days after deletion)
- User rights (access, deletion, correction)
- Australian Privacy Law compliance
- Contact: privacy@zapsplit.com

### 4.2 Terms of Service
**Status:** COMPLETE
**Location:** `src/screens/settings/TermsOfServiceScreen.tsx`
**Last Updated:** January 2026
**Contents:**
- Age requirement (18+)
- Service description
- Payment terms
- AI processing consent (OpenAI)
- Liability limitation
- Contact: legal@zapsplit.com

### 4.3 Email Addresses
**Action Required:** Verify these emails exist and are monitored:
- [ ] support@zapsplit.app
- [ ] privacy@zapsplit.com
- [ ] legal@zapsplit.com

---

## PART 5: ACCOUNT MANAGEMENT

### 5.1 Delete Account (Apple Requirement)
**Status:** IMPLEMENTED
**Location:** `src/screens/settings/DeleteAccountScreen.tsx`
**Flow:**
1. User types "delete my account" to confirm
2. Double confirmation alert
3. Calls `delete-account` edge function
4. Signs out user
**Compliance:** Meets Apple's June 30, 2022 requirement

### 5.2 Edit Profile
**Status:** IMPLEMENTED
- Change name
- Change avatar
- Remove avatar (reverts to initials)

### 5.3 Change Password
**Status:** IMPLEMENTED
**Location:** `src/screens/settings/ChangePasswordScreen.tsx`

---

## PART 6: APP STORE METADATA

### 6.1 iOS App Store Connect

#### Required Fields
- [ ] App Name (max 30 chars): `ZapSplit`
- [ ] Subtitle (max 30 chars): `Split Bills Instantly`
- [ ] Description (max 4000 chars)
- [ ] Keywords
- [ ] Primary Category: `Finance`
- [ ] Secondary Category: `Utilities` or `Lifestyle`
- [ ] Content Rating: Complete questionnaire (likely 4+)
- [ ] Privacy Policy URL: `https://zapsplit.app/privacy`
- [ ] Support URL: `https://zapsplit.app/support`

#### Screenshots Required
| Device | Resolution | Required |
|--------|-----------|----------|
| 6.9" iPhone 16 Pro Max | 1320 x 2868 | Yes |
| 6.5" iPhone 14 Plus | 1284 x 2778 | Yes |
| 5.5" iPhone 8 Plus | 1242 x 2208 | Yes |
| 12.9" iPad Pro | 2048 x 2732 | If iPad supported |

#### App Review Notes
Provide demo account:
```
Email: demo@zapsplit.app
Password: [create demo account]
Notes: This account has pre-populated splits for testing.
```

### 6.2 Google Play Console

#### Required Fields
- [ ] App Name (max 30 chars): `ZapSplit`
- [ ] Short Description (max 80 chars)
- [ ] Full Description (max 4000 chars)
- [ ] App Category: `Finance`
- [ ] Content Rating: Complete IARC questionnaire
- [ ] Privacy Policy URL
- [ ] **Financial Features Declaration Form** (MANDATORY)

#### Graphics Required
| Asset | Dimensions | Format |
|-------|-----------|--------|
| App Icon | 512 x 512 | PNG |
| Feature Graphic | 1024 x 500 | JPEG/PNG |
| Phone Screenshots | 1080 x 1920 min | JPEG/PNG |

#### Data Safety Section
Must declare:
- [ ] Personal info collected (name, email)
- [ ] Financial info collected (payment methods via Stripe)
- [ ] Photos (receipt scanning)
- [ ] Data sharing with third parties (Stripe, OpenAI)
- [ ] Data deletion option available

---

## PART 7: DEEP LINKING

### 7.1 Current Configuration
**iOS:** `applinks:zapsplit.app` configured in app.json
**Android:** Intent filters for `https://zapsplit.app/pay/*`
**Custom Scheme:** `zapsplit://`

### 7.2 MISSING: Apple App Site Association
**Action Required:** Create file at `https://zapsplit.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.zapsplit.app",
        "paths": ["/pay/*"]
      }
    ]
  }
}
```
Replace `TEAMID` with your Apple Developer Team ID.

### 7.3 MISSING: Android Asset Links
**Action Required:** Create file at `https://zapsplit.app/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.zapsplit.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```
Get fingerprint from Play Console after enrolling in Play App Signing.

---

## PART 8: APP CONFIGURATION

### 8.1 Bundle Identifier (MUST FIX)
**Current (WRONG):** `com.yourname.zapsplit`
**Should Be:** `com.zapsplit.app` (or your chosen identifier)

**Files to Update:**
- [ ] `app.json` → `ios.bundleIdentifier`
- [ ] `app.json` → `android.package`
- [ ] Apple Developer Portal
- [ ] Google Play Console

### 8.2 App Icons
**Status:** PRESENT
- `assets/icon.png` - 1024x1024 ✓
- `assets/adaptive-icon.png` - Android adaptive ✓
- `assets/splash-icon.png` - Splash screen ✓

### 8.3 Splash Screen
**Status:** CONFIGURED
- White background with logo
- Hides after 1.5 seconds

---

## PART 9: PERMISSIONS

### 9.1 iOS Info.plist Descriptions
```
NSCameraUsageDescription: "ZapSplit needs camera access to scan receipts and automatically split bills."
NSPhotoLibraryUsageDescription: "ZapSplit needs access to your photos to upload receipt images."
```
**Status:** CONFIGURED ✓

### 9.2 Android Permissions
```xml
CAMERA
READ_EXTERNAL_STORAGE
WRITE_EXTERNAL_STORAGE
```
**Status:** CONFIGURED ✓

---

## PART 10: FINTECH-SPECIFIC REQUIREMENTS

### 10.1 Apple App Store (Finance Category)
- [ ] App must be submitted by legal entity (not individual)
- [ ] Proper licensing documentation may be required
- [ ] Must comply with Australian financial regulations
- [ ] PCI DSS compliance (handled by Stripe)

### 10.2 Google Play Store
- [ ] **Financial Features Declaration Form** - MANDATORY
- [ ] Complete in Play Console before submission
- [ ] Disclose all financial features
- [ ] Deadline for existing apps: March 4, 2026

### 10.3 Australian Regulations
- [ ] Review ASIC requirements for payment apps
- [ ] Review AUSTRAC requirements (money transfer)
- [ ] Consider if AFSL (Australian Financial Services Licence) needed
- [ ] Note: Bill-splitting may be exempt from some requirements

---

## PART 11: TESTING CHECKLIST

### Before Submission
- [ ] Test Apple Pay on physical iPhone
- [ ] Test Google Pay on physical Android
- [ ] Test Apple Sign In flow
- [ ] Test email sign up and login
- [ ] Test password reset
- [ ] Test receipt scanning (camera permission)
- [ ] Test photo upload (gallery permission)
- [ ] Test push notifications
- [ ] Test deep links (`https://zapsplit.app/pay/TESTCODE`)
- [ ] Test delete account flow
- [ ] Test Stripe Connect onboarding
- [ ] Test payment flow end-to-end
- [ ] Test dark mode throughout app
- [ ] Test on multiple screen sizes

### Demo Account for Review
Create account with:
- Pre-populated splits (different types)
- Friend connections
- Payment history
- Stripe Connect enabled

---

## PART 12: ACTION ITEMS BY PRIORITY

### CRITICAL (Must Fix Before Submission)
1. [ ] Implement Google Sign In
2. [ ] Fix Help & Support navigation bug
3. [ ] Update bundle identifier from placeholder
4. [ ] Create AASA file for iOS deep links
5. [ ] Create assetlinks.json for Android deep links
6. [ ] Verify email addresses exist (support@, privacy@, legal@)

### HIGH PRIORITY
7. [ ] Complete Financial Features Declaration (Google)
8. [ ] Test Apple Pay on device
9. [ ] Test Google Pay on device
10. [ ] Create demo account for app review
11. [ ] Take screenshots for both stores
12. [ ] Write app descriptions

### MEDIUM PRIORITY
13. [ ] Create feature graphic (1024x500) for Google Play
14. [ ] Review all screens in dark mode
15. [ ] Test on iPad (if supporting)
16. [ ] Review accessibility (VoiceOver, TalkBack)

### LOW PRIORITY (Nice to Have)
17. [ ] Add app preview video
18. [ ] Localization for other markets
19. [ ] Add more comprehensive FAQ

---

## PART 13: SUBMISSION TIMELINE

### Recommended Order

**Week 1:**
- Fix all critical bugs
- Implement Google Sign In
- Update bundle identifier
- Set up deep linking files on web server

**Week 2:**
- Test everything on physical devices
- Create demo account
- Take screenshots
- Write descriptions
- Complete all forms

**Week 3:**
- Submit to Apple App Store (review takes 1-3 days typically)
- Wait for approval or address feedback

**Week 4:**
- Submit to Google Play Store (review takes 1-7 days)
- Address any feedback

---

## APPENDIX A: FILE LOCATIONS

| Item | Path |
|------|------|
| App Config | `/app.json` |
| Auth Hook | `/src/hooks/useAuth.ts` |
| Stripe Service | `/src/services/stripeService.ts` |
| Privacy Policy | `/src/screens/settings/PrivacyPolicyScreen.tsx` |
| Terms of Service | `/src/screens/settings/TermsOfServiceScreen.tsx` |
| Delete Account | `/src/screens/settings/DeleteAccountScreen.tsx` |
| Settings | `/src/screens/settings/SettingsScreen.tsx` |
| Avatar | `/src/components/common/Avatar.tsx` |
| Icons | `/assets/` |

---

## APPENDIX B: USEFUL LINKS

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy Center](https://play.google.com/developer-content-policy/)
- [Stripe Apple Pay Setup](https://stripe.com/docs/apple-pay)
- [Stripe Google Pay Setup](https://stripe.com/docs/google-pay)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Apple App Site Association Validator](https://branch.io/resources/aasa-validator/)

---

## NOTES

This checklist was generated based on:
1. Apple App Store submission requirements (2026)
2. Google Play Developer Content Policy (2026)
3. Full audit of ZapSplit codebase
4. Fintech/payment app specific requirements
5. Australian market requirements

**Questions?** Review the official documentation or consult with a compliance expert for fintech-specific licensing questions.
