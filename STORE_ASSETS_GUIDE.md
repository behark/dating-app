# 📱 App Store & Play Store Assets Guide

This guide will help you create all required assets for app store submission.

---

## 🎨 1. App Icon

### iOS Requirements

- **Size:** 1024x1024 pixels
- **Format:** PNG (no transparency)
- **Color Space:** RGB
- **File:** `assets/icon.png`

### Android Requirements

- **Size:** 512x512 pixels (foreground)
- **Format:** PNG (no transparency)
- **Adaptive Icon:** Requires foreground and background
- **Files:**
  - `assets/adaptive-icon.png` (foreground)
  - Background color defined in `app.config.js`

### Design Guidelines

- ✅ Use simple, recognizable design
- ✅ Avoid text (may be unreadable at small sizes)
- ✅ Use high contrast colors
- ✅ Test at various sizes (16x16 to 1024x1024)
- ❌ Don't use transparency
- ❌ Don't include app name in icon

### Tools

- **Design:** Figma, Sketch, Adobe Illustrator
- **Export:** Use "Export for Screens" feature
- **Testing:** Use [App Icon Generator](https://www.appicon.co/) to preview all sizes

---

## 📸 2. Screenshots

### iOS Screenshot Requirements

**iPhone (Required):**

- **Sizes:**
  - 6.7" Display (iPhone 14 Pro Max): 1290 x 2796 pixels
  - 6.5" Display (iPhone 11 Pro Max): 1242 x 2688 pixels
  - 5.5" Display (iPhone 8 Plus): 1242 x 2208 pixels
- **Minimum:** 1 screenshot
- **Maximum:** 10 screenshots

**iPad (Optional but recommended):**

- **Size:** 2048 x 2732 pixels (12.9" iPad Pro)
- **Minimum:** 1 screenshot

### Android Screenshot Requirements

**Phone:**

- **Sizes:**
  - 16:9 aspect ratio (e.g., 1080 x 1920)
  - 9:16 aspect ratio (portrait)
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots

**Tablet (Optional):**

- **Size:** 7" tablet: 1200 x 1920 pixels
- **Minimum:** 1 screenshot

### Screenshot Content Checklist

Take screenshots of these key screens:

- [ ] **Login/Registration Screen** - Show authentication flow
- [ ] **Home/Discovery Screen** - Show swipe cards interface
- [ ] **Profile Screen** - Show user profile with photos
- [ ] **Matches Screen** - Show list of matches
- [ ] **Chat Screen** - Show messaging interface
- [ ] **Premium Features** - Show premium benefits (if applicable)
- [ ] **Safety Features** - Show safety tools (if applicable)

### Screenshot Best Practices

- ✅ Use real content (not placeholders)
- ✅ Show key features prominently
- ✅ Use consistent design language
- ✅ Add text overlays highlighting features (optional)
- ✅ Remove sensitive data (test accounts, personal info)
- ❌ Don't use Lorem ipsum or placeholder text
- ❌ Don't show errors or empty states

### Tools

- **iOS Simulator:** Take screenshots directly from simulator
- **Android Emulator:** Use built-in screenshot tool
- **Physical Devices:** Use device screenshot feature
- **Editing:** Figma, Photoshop, Canva (for adding text overlays)

---

## 📝 3. App Description

### Play Store Description

**Short Description (80 characters max):**

```
Find meaningful connections with people nearby. Swipe, match, and chat!
```

**Full Description (4000 characters max):**

```
[Your Dating App Name] - Find Your Perfect Match

Looking for meaningful connections? [Your Dating App Name] helps you discover people nearby who share your interests and values.

KEY FEATURES:
✨ Swipe & Match - Browse profiles and swipe right on people you like
💬 Real-time Chat - Message your matches instantly
👤 Complete Profiles - Share photos, interests, and what makes you unique
🔒 Safety First - Built-in safety features and reporting tools
⭐ Premium Features - Boost your profile, see who liked you, and more

WHY CHOOSE [YOUR APP]?
- Verified profiles for added security
- Advanced matching algorithm
- Privacy-focused design
- Active community of real users
- 24/7 customer support

SAFETY & PRIVACY:
Your safety is our priority. We use advanced moderation tools and provide easy reporting options. Your data is encrypted and never shared without your consent.

DOWNLOAD NOW and start your journey to finding meaningful connections!

Questions? Contact us at support@your-dating-app.com
```

### App Store Description

**Subtitle (30 characters max):**

```
Find meaningful connections
```

**Description (4000 characters max):**

```
[Same as Play Store full description above]
```

### Description Best Practices

- ✅ Start with value proposition
- ✅ Use bullet points for features
- ✅ Include keywords naturally
- ✅ Mention safety and privacy
- ✅ Add call-to-action
- ✅ Include support contact
- ❌ Don't use excessive emojis
- ❌ Don't make false claims
- ❌ Don't use all caps

---

## 🎬 4. Promotional Graphics (Optional but Recommended)

### Feature Graphic (Android)

- **Size:** 1024 x 500 pixels
- **Format:** PNG or JPG
- **Purpose:** Displayed at top of Play Store listing

### App Preview Video (iOS)

- **Duration:** 15-30 seconds
- **Format:** MP4, MOV
- **Purpose:** Show app in action
- **Content:** Demonstrate key features

---

## 📋 5. Submission Checklist

Before submitting, ensure you have:

### Required Assets

- [ ] App icon (1024x1024 for iOS, 512x512 for Android)
- [ ] At least 2 screenshots (Android) or 1 screenshot (iOS)
- [ ] App description (short + full)
- [ ] Privacy Policy URL (hosted on web)
- [ ] Terms of Service URL (hosted on web)
- [ ] Support email address
- [ ] Privacy contact email

### Optional Assets

- [ ] Feature graphic (Android)
- [ ] App preview video (iOS)
- [ ] Promotional images
- [ ] Marketing materials

---

## 🚀 6. Quick Start

1. **Create App Icon:**

   ```bash
   # Design in Figma/Sketch
   # Export as 1024x1024 PNG
   # Save to assets/icon.png
   ```

2. **Take Screenshots:**

   ```bash
   # iOS: Use Simulator → Device → Screenshot
   # Android: Use Emulator → Extended Controls → Screenshot
   # Save to screenshots/ folder
   ```

3. **Write Description:**

   ```bash
   # Use templates above
   # Customize for your app
   # Save to app-description.txt
   ```

4. **Host Legal Documents:**
   ```bash
   # Upload PRIVACY_POLICY_TEMPLATE.html to your website
   # Upload TERMS_OF_SERVICE_TEMPLATE.html to your website
   # Update environment variables with URLs
   ```

---

## 📚 Resources

- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Templates](https://www.figma.com/community)

---

**Need Help?** Contact support@your-dating-app.com
