# Asset Optimization & Storage Strategy

**Last Updated:** March 4, 2026  
**Current Asset Size:** 596K (play-store-screenshots)

---

## 📊 Current Asset Status

| Path | Size | Type | Status |
|------|------|------|--------|
| `assets/play-store-screenshots/` | 596K | PNG images | ⚠️ In repo |
| `assets/playstore/` | 16K | Small assets | ✅ Acceptable |
| `public/` | Varies | Web assets | ✅ Static served |

---

## 🎯 Optimization Strategy

### Problem
- **596K** of binary screenshot files in git repository
- Slows down `git clone` and `git pull`
- Not needed for application runtime
- Should be versioned separately from code

### Solution: Move to Cloud Storage

**Recommended Approach:**
```
dating-app/ (Git repo)
    ├── docs/
    ├── src/
    ├── backend/
    └── scripts/
        └── download-assets.sh  ← Downloads at build time

Cloud Storage (CDN)
    └── dating-app-assets/
        └── play-store-screenshots/
            ├── screenshot-1.png
            ├── screenshot-2.png
            └── ...
```

---

## 📋 Implementation Options

### Option 1: AWS S3 + CloudFront (Recommended for Production)

**Setup:**
```bash
# Create S3 bucket
aws s3 mb s3://dating-app-assets

# Upload screenshots
aws s3 sync assets/play-store-screenshots/ \
  s3://dating-app-assets/play-store-screenshots/

# Set CloudFront distribution for CDN caching
```

**Cost:** ~$0.50-2/month + data transfer (~$0.09/GB)

**Download at Build Time:**
```bash
#!/bin/bash
# scripts/download-assets.sh

ASSET_URL="https://d111111abcdef8.cloudfront.net/assets"

mkdir -p assets/play-store-screenshots
curl -o assets/play-store-screenshots/screenshot-1.png \
  "$ASSET_URL/play-store-screenshots/screenshot-1.png"
```

### Option 2: GitHub Releases (Simple, Free)

**Setup:**
1. Create GitHub Release
2. Upload screenshots as release assets
3. Reference URL in `.env` or `app.config.js`

**Download Script:**
```bash
#!/bin/bash
# scripts/download-assets.sh

GITHUB_RELEASE="https://github.com/user/dating-app/releases/download/v1.0-assets"

mkdir -p assets/play-store-screenshots
curl -L -o assets/play-store-screenshots/screenshot-1.png \
  "$GITHUB_RELEASE/screenshot-1.png"
```

**Pros:** Free, integrated with GitHub  
**Cons:** Slower, limited to 2GB per release

### Option 3: Firebase Cloud Storage (If Using Firebase)

**Setup:**
```bash
# Upload to Firebase
firebase storage cp assets/play-store-screenshots/ \
  gs://your-project.appspot.com/assets/

# Reference in app
const assetURL = 'https://storage.googleapis.com/your-project.appspot.com/assets/screenshot-1.png'
```

**Pros:** Integrated with existing Firebase setup  
**Cons:** Requires Firebase project

### Option 4: Vercel Blob (Easiest if Using Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Upload assets
npx vercel blob upload --access public assets/play-store-screenshots/screenshot-1.png
```

**Pros:** Simple, integrated with Vercel  
**Cons:** Limited to Vercel users

---

## 🔧 Migration Steps

### Step 1: Choose Storage Provider
- **Production:** AWS S3 + CloudFront
- **Development:** GitHub Releases
- **Small Team:** Firebase Storage

### Step 2: Upload Assets
```bash
# Example with AWS S3
aws s3 sync assets/play-store-screenshots/ \
  s3://dating-app-assets/play-store-screenshots/ \
  --acl public-read
```

### Step 3: Create Download Script
```bash
#!/bin/bash
# scripts/download-assets.sh

set -e

ASSET_BUCKET="https://dating-app-assets.s3.amazonaws.com"
SCREENSHOT_DIR="assets/play-store-screenshots"

echo "Downloading app assets..."
mkdir -p "$SCREENSHOT_DIR"

for file in screenshot-1.png screenshot-2.png screenshot-3.png; do
    url="$ASSET_BUCKET/$file"
    echo "Downloading $file..."
    curl -L -o "$SCREENSHOT_DIR/$file" "$url"
done

echo "✓ Assets downloaded successfully"
```

### Step 4: Update Build Process
```json
{
  "scripts": {
    "prebuild": "scripts/download-assets.sh",
    "build": "expo export -p web"
  }
}
```

### Step 5: Remove from Git
```bash
# Remove from git history
git rm --cached assets/play-store-screenshots/

# Add to .gitignore
echo "assets/play-store-screenshots/" >> .gitignore

# Commit
git commit -m "chore: move screenshots to cloud storage"
```

### Step 6: Update CI/CD
```yaml
# .github/workflows/build.yml
- name: Download assets
  run: scripts/download-assets.sh
  
- name: Build
  run: npm run build
```

---

## 💾 Local Development

### Option A: Keep Local Copies (During Migration)
```bash
# Keep screenshots locally for faster development
# Just don't commit them
echo "assets/play-store-screenshots/" >> .gitignore

# Developers can manually download or keep cached
```

### Option B: Lazy Download
```bash
# Add to package.json
"postinstall": "npm run download-assets:if-missing"

# Script only downloads if missing
scripts/download-assets-if-missing.sh
```

### Option C: Developer Instructions
```markdown
## Setup Assets Locally

1. Download from: https://github.com/user/dating-app/releases/download/v1.0-assets
2. Extract to `assets/play-store-screenshots/`
3. Done!
```

---

## 📊 Estimated Savings

**Before Migration:**
- Git repo size: ~50MB (with history)
- Clone time: 10-15 seconds
- Every change: Push 596K

**After Migration:**
- Git repo size: ~49MB
- Clone time: 8-10 seconds  
- Download assets: On-demand (cached by CDN)
- Benefit: 1% repo size reduction + faster pushes

---

## 🔐 Security Considerations

### If Using Public Cloud Storage:
- Screenshots are typically public anyway (Play Store)
- Consider signing URLs if sensitive
- Use CDN for better performance

### Example: AWS S3 Signed URLs
```bash
# Generate signed URL (1 hour expiration)
aws s3 presign s3://dating-app-assets/screenshot-1.png \
  --expires-in 3600
```

---

## 📚 Recommended Implementation

For this project, **recommend AWS S3 + CloudFront**:

1. **Cost:** ~$2-5/month
2. **Performance:** Excellent (CDN-backed)
3. **Scalability:** Unlimited growth
4. **Security:** Configurable access
5. **Reliability:** 99.99% uptime

**Quick Setup:**
```bash
# 1. Create bucket
aws s3 mb s3://dating-app-assets

# 2. Upload assets
aws s3 sync assets/play-store-screenshots/ \
  s3://dating-app-assets/ --acl public-read

# 3. Create download script (see above)

# 4. Update CI/CD to download before build

# 5. Remove from git (see "Remove from Git" section)
```

---

## ⚠️ Migration Caution

**Don't Move These:**
- `assets/playstore/` (16K, acceptable)
- `public/` (web assets, needed at build time)
- `src/` (source code)

**Only Move:**
- `assets/play-store-screenshots/` (596K binary screenshots)

---

## Future Optimization

### Image Optimization
```bash
# Compress screenshots before uploading
npx imagemin assets/play-store-screenshots/*.png \
  --out-dir=assets/play-store-screenshots-optimized/

# Typically saves 20-30% with no quality loss
```

### Lazy Loading
```javascript
// Load screenshots on-demand in app
const loadScreenshot = (id) => {
  return `${process.env.ASSET_CDN_URL}/screenshots/${id}.png`
}
```

---

## Checklist

- [ ] Choose storage provider
- [ ] Upload assets to cloud
- [ ] Create download script
- [ ] Test download script locally
- [ ] Update CI/CD pipeline
- [ ] Update build scripts
- [ ] Remove from git history
- [ ] Update .gitignore
- [ ] Test full build pipeline
- [ ] Document for team
- [ ] Verify assets accessible
- [ ] Set up monitoring

---

**Not Urgent:** This optimization can be implemented post-launch or when git repo grows significantly. Current impact is minimal (~1% of repo size).

**Status:** ✅ Ready to implement when needed
