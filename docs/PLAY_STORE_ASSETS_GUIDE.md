# Play Store Assets Guide

Complete guide for creating all required visual assets for Google Play Store submission.

---

## 📋 Required Assets Checklist

### ✅ Already Have

- [x] App icon (512x512) - `assets/icon.png`
- [x] Adaptive icon (512x512) - `assets/adaptive-icon.png`

### 🎨 Need to Create

- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (minimum 2, recommended 4-8)
- [ ] Tablet screenshots (optional but recommended, 2-4)
- [ ] Promo video (optional, 30-120 seconds)

---

## 1. Feature Graphic (REQUIRED)

**Dimensions:** 1024 x 500 pixels  
**Format:** PNG or JPEG  
**Max size:** 1 MB  
**Purpose:** Displayed at top of store listing

### Design Guidelines

**Must include:**

- App name or logo
- Clear, attractive visual
- Readable text (if any)

**Must NOT include:**

- Misleading content
- Prices or promotional text
- Screenshots of the app
- Text covering more than 30% of image

### Design Template

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [App Icon]     Dating App                             │
│                                                         │
│                 Find Meaningful Connections            │
│                                                         │
│  [Gradient or attractive background with couple/heart] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tools to Create

**Option 1: Canva (Easiest)**

1. Go to canva.com
2. Create custom size: 1024 x 500
3. Search templates: "app banner"
4. Customize with your colors (#667eea)
5. Add text: "Dating App" and "Find Meaningful Connections"
6. Download as PNG

**Option 2: Figma (Professional)**

1. Create new file
2. Frame: 1024 x 500
3. Add gradient background
4. Add app icon (from assets/icon.png)
5. Add text layers
6. Export as PNG

**Option 3: Photoshop/GIMP**

1. New file: 1024 x 500, 72 DPI
2. Create gradient background
3. Import app icon
4. Add text with readable font
5. Export as PNG

### Color Scheme

- Primary: #667eea (purple)
- Secondary: #764ba2 (darker purple)
- Accent: #f093fb (pink)
- Text: #ffffff (white)

---

## 2. Phone Screenshots (REQUIRED)

**Minimum:** 2 screenshots  
**Recommended:** 4-8 screenshots  
**Dimensions:**

- 1080 x 1920 (16:9)
- 1080 x 2340 (19.5:9)
- 1080 x 2400 (20:9)

**Format:** PNG or JPEG  
**Max size:** 8 MB each

### Screenshot Ideas

**Screenshot 1: Profile Browsing**

- Show swipe card interface
- Profile photo, name, age, bio
- Like/dislike buttons
- Caption: "Discover people near you"

**Screenshot 2: Match Notification**

- Match screen with "It's a Match!" message
- Two profile photos
- "Send Message" button
- Caption: "Connect with your matches"

**Screenshot 3: Chat Interface**

- Active conversation
- Messages back and forth
- Show typing indicator
- Caption: "Start meaningful conversations"

**Screenshot 4: Profile Screen**

- User's own profile
- Multiple photos
- Bio, interests, preferences
- Caption: "Create your perfect profile"

**Screenshot 5: Matches List**

- Grid or list of matches
- Profile photos with names
- Unread message indicators
- Caption: "Keep track of your connections"

**Screenshot 6: Premium Features**

- Premium subscription screen
- Feature list with checkmarks
- Pricing options
- Caption: "Unlock premium features"

### How to Capture Screenshots

**Method 1: Physical Device**

```bash
# Run app on Android device
npm run android

# Take screenshots using device screenshot button
# Usually: Power + Volume Down
```

**Method 2: Android Emulator**

```bash
# Start emulator from Android Studio
# Or use command:
emulator -avd Pixel_5_API_31

# Run app
npm run android

# Take screenshot: Camera icon in emulator toolbar
# Or use: Cmd/Ctrl + S
```

**Method 3: ADB Command**

```bash
# Take screenshot via ADB
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./screenshots/

# Or use script:
for i in {1..8}; do
  echo "Position screen $i and press Enter"
  read
  adb shell screencap -p /sdcard/screen$i.png
  adb pull /sdcard/screen$i.png ./screenshots/
done
```

### Screenshot Enhancement

**Add captions/frames (optional but recommended):**

1. Use screenshot framing tools:
   - https://mockuphone.com
   - https://screenshots.pro
   - https://app-mockup.com

2. Add device frame (Pixel, Samsung, etc.)

3. Add caption text at top or bottom

4. Keep consistent style across all screenshots

---

## 3. Tablet Screenshots (RECOMMENDED)

**Minimum:** 2 screenshots  
**Recommended:** 2-4 screenshots  
**Dimensions:**

- 1920 x 1080 (landscape)
- 2560 x 1440 (landscape)
- 1200 x 1920 (portrait)

**Purpose:** Show tablet-optimized layout

### Tablet Screenshot Ideas

1. Split-screen view (matches + chat)
2. Profile browsing in landscape
3. Settings screen
4. Matches grid view

### How to Capture

```bash
# Use tablet emulator
emulator -avd Pixel_Tablet_API_31

# Or use larger phone in landscape
# Take screenshots same as phone
```

---

## 4. Promo Video (OPTIONAL)

**Length:** 30-120 seconds  
**Max size:** 100 MB  
**Format:** MP4, MOV, or AVI  
**Aspect ratio:** 16:9 or 9:16

### Video Content Ideas

**30-second version:**

1. (0-5s) App logo animation
2. (5-15s) Quick feature showcase
3. (15-25s) Swipe, match, chat demo
4. (25-30s) Call to action + download

**60-second version:**

1. (0-10s) Hook: "Finding love shouldn't be complicated"
2. (10-20s) Profile creation
3. (20-35s) Swiping and matching
4. (35-50s) Chat and connection
5. (50-60s) Call to action

### Tools to Create

**Screen Recording:**

```bash
# Android device
# Use built-in screen recorder
# Or: Settings > Developer options > Screen recording

# Or use ADB:
adb shell screenrecord /sdcard/demo.mp4
adb pull /sdcard/demo.mp4
```

**Video Editing:**

- iMovie (Mac)
- DaVinci Resolve (Free, professional)
- Adobe Premiere Pro
- Canva Video Editor (Easy)

### Video Tips

- Show actual app usage (not animations)
- Keep it fast-paced
- Add upbeat background music
- Include captions (many watch without sound)
- Show key features clearly
- End with clear call to action

---

## 5. Asset Organization

Create this folder structure:

```
/home/behar/dating-app/
├── assets/
│   ├── icon.png (512x512) ✅
│   ├── adaptive-icon.png (512x512) ✅
│   └── playstore/
│       ├── feature-graphic.png (1024x500)
│       ├── screenshots/
│       │   ├── phone/
│       │   │   ├── 01-profile-browsing.png
│       │   │   ├── 02-match-notification.png
│       │   │   ├── 03-chat-interface.png
│       │   │   ├── 04-profile-screen.png
│       │   │   ├── 05-matches-list.png
│       │   │   └── 06-premium-features.png
│       │   └── tablet/
│       │       ├── 01-tablet-landscape.png
│       │       └── 02-tablet-split-view.png
│       └── promo-video.mp4 (optional)
```

---

## 6. Quick Creation Script

Save this as `scripts/prepare-playstore-assets.sh`:

```bash
#!/bin/bash

echo "📱 Play Store Assets Preparation"
echo "================================"

# Create directories
mkdir -p assets/playstore/screenshots/phone
mkdir -p assets/playstore/screenshots/tablet

echo ""
echo "✅ Directories created"
echo ""
echo "Next steps:"
echo "1. Create feature graphic (1024x500) → assets/playstore/feature-graphic.png"
echo "2. Take phone screenshots → assets/playstore/screenshots/phone/"
echo "3. Take tablet screenshots → assets/playstore/screenshots/tablet/"
echo "4. (Optional) Create promo video → assets/playstore/promo-video.mp4"
echo ""
echo "Use this guide: docs/PLAY_STORE_ASSETS_GUIDE.md"
```

Run it:

```bash
chmod +x scripts/prepare-playstore-assets.sh
./scripts/prepare-playstore-assets.sh
```

---

## 7. Asset Validation Checklist

Before uploading to Play Console:

### Feature Graphic

- [ ] Dimensions: 1024 x 500 pixels
- [ ] Format: PNG or JPEG
- [ ] Size: Under 1 MB
- [ ] No misleading content
- [ ] Text is readable
- [ ] Looks good on different backgrounds

### Phone Screenshots

- [ ] Minimum 2 screenshots
- [ ] Correct dimensions (1080 x 1920 or similar)
- [ ] Format: PNG or JPEG
- [ ] Size: Under 8 MB each
- [ ] Show actual app interface
- [ ] No placeholder content
- [ ] Consistent style

### Tablet Screenshots (if included)

- [ ] Minimum 2 screenshots
- [ ] Correct dimensions (1920 x 1080 or similar)
- [ ] Shows tablet-optimized layout
- [ ] Consistent with phone screenshots

### Promo Video (if included)

- [ ] Length: 30-120 seconds
- [ ] Size: Under 100 MB
- [ ] Format: MP4, MOV, or AVI
- [ ] Shows actual app usage
- [ ] Has captions or text overlays
- [ ] Professional quality

---

## 8. Common Mistakes to Avoid

### ❌ Don't Do This

1. **Using stock photos** - Must show actual app
2. **Misleading screenshots** - Must match real functionality
3. **Low resolution** - Must meet minimum dimensions
4. **Text-heavy feature graphic** - Keep it visual
5. **Inconsistent branding** - Use same colors/style
6. **Showing competitor apps** - Only show your app
7. **Including prices** - Prices change, graphics don't
8. **Using copyrighted images** - Only use owned/licensed content

### ✅ Do This

1. **Show real app screens** - Actual interface
2. **Use consistent branding** - Same colors, fonts
3. **High quality images** - Sharp, clear, professional
4. **Highlight key features** - Show what makes app special
5. **Keep it simple** - Don't overcrowd
6. **Test on different devices** - Check how it looks
7. **Get feedback** - Ask others before submitting
8. **Follow Play Store guidelines** - Read official docs

---

## 9. Design Resources

### Free Tools

- **Canva:** https://canva.com (easiest)
- **Figma:** https://figma.com (professional)
- **GIMP:** https://gimp.org (Photoshop alternative)
- **Inkscape:** https://inkscape.org (vector graphics)

### Screenshot Tools

- **MockUPhone:** https://mockuphone.com
- **Screely:** https://screely.com
- **Screenshot.rocks:** https://screenshot.rocks

### Stock Photos (if needed)

- **Unsplash:** https://unsplash.com
- **Pexels:** https://pexels.com
- **Pixabay:** https://pixabay.com

### Icons

- **Lucide:** https://lucide.dev (already using in app)
- **Heroicons:** https://heroicons.com
- **Feather:** https://feathericons.com

### Color Palette

```css
/* Your app colors */
--primary: #667eea;
--secondary: #764ba2;
--accent: #f093fb;
--success: #10b981;
--error: #ef4444;
--background: #ffffff;
--text: #1f2937;
```

---

## 10. Timeline

| Task                    | Time          | Priority    |
| ----------------------- | ------------- | ----------- |
| Feature graphic         | 1-2 hours     | Required    |
| Phone screenshots (2-4) | 1-2 hours     | Required    |
| Phone screenshots (5-8) | 1-2 hours     | Recommended |
| Tablet screenshots      | 1 hour        | Recommended |
| Promo video             | 3-5 hours     | Optional    |
| **Total**               | **4-8 hours** |             |

---

## 11. Getting Help

**Design Help:**

- Hire on Fiverr: $20-100 for complete asset package
- Upwork: Professional designers
- 99designs: Design contests

**Screenshot Help:**

- Ask friends/family to review
- Post in r/androiddev for feedback
- Use Play Store preview tool

**Questions?**

- Google Play Console Help Center
- Android Developers documentation
- Stack Overflow

---

## Quick Start

```bash
# 1. Create directories
mkdir -p assets/playstore/screenshots/{phone,tablet}

# 2. Run app and take screenshots
npm run android
# Take 4-8 screenshots of key screens

# 3. Create feature graphic
# Use Canva or Figma (1024x500)

# 4. Organize files
# Move all assets to assets/playstore/

# 5. Validate
# Check dimensions and file sizes

# 6. Upload to Play Console
# Store presence > Main store listing
```

---

**Remember:** Quality assets significantly impact download rates. Invest time in making them look professional!

_Last updated: January 13, 2026_
