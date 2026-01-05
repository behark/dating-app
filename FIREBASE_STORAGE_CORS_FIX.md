# Firebase Storage CORS Configuration Fix

## Problem
When uploading profile pictures from the web app (Vercel), you're getting CORS errors:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://dating-app-seven-peach.vercel.app' 
has been blocked by CORS policy
```

## Solution
Firebase Storage needs to be configured to allow requests from your Vercel domain. This must be done in the Firebase Console.

## Steps to Fix

### Option 1: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`my-project-de65d`)
3. In the left sidebar, click **"Storage"**
4. Click on the **"Rules"** tab
5. You should see your storage security rules

6. **Important**: CORS for Firebase Storage is configured via **Google Cloud Console**, not Firebase Console directly.

### Option 2: Using Google Cloud Console (Required for CORS)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`my-project-de65d`)
3. In the left sidebar, go to **"Cloud Storage"** > **"Buckets"**
4. Click on your storage bucket (usually `my-project-de65d.firebasestorage.app` or `my-project-de65d.appspot.com`)
5. Click on the **"Configuration"** tab
6. Scroll down to **"CORS configuration"**
7. Click **"Edit CORS configuration"**
8. Add the following CORS configuration:

```json
[
  {
    "origin": [
      "https://dating-app-seven-peach.vercel.app",
      "https://*.vercel.app"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
```

9. Click **"Save"**

### Option 3: Using gsutil Command Line Tool

If you have `gsutil` installed, you can create a CORS configuration file:

1. Create a file named `cors.json`:
```json
[
  {
    "origin": [
      "https://dating-app-seven-peach.vercel.app",
      "https://*.vercel.app"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
```

2. Run the command:
```bash
gsutil cors set cors.json gs://my-project-de65d.firebasestorage.app
```

Replace `my-project-de65d.firebasestorage.app` with your actual storage bucket name.

## Verify the Fix

After configuring CORS, test by:

1. Opening your app on Vercel
2. Try uploading a profile picture
3. Check the browser console - CORS errors should be gone

## Additional Notes

- **Wildcard origins**: Using `https://*.vercel.app` allows all Vercel preview deployments
- **Production domain**: Make sure to add your production domain when you have one
- **Security**: The CORS configuration only affects browser requests. Server-side requests don't need CORS.

## Troubleshooting

### Still getting CORS errors?
1. Wait a few minutes - CORS changes can take time to propagate
2. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Verify the bucket name matches exactly
4. Check that the origin URL matches exactly (including https://)

### Can't find CORS settings?
- Make sure you're in **Google Cloud Console**, not Firebase Console
- The bucket name might be different - check Firebase Console > Storage > Files tab for the bucket URL
