# Google OAuth Setup Guide

## The "Sign in to Chrome" screen is NORMAL
That is just Google's login page. It's working correctly.

## Why it might fail after signing in

The callback URL `http://localhost:5001/api/auth/google/callback` must be
registered in Google Cloud Console, otherwise Google will reject the redirect.

---

## Steps to fix in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID:
   `your-google-client-id-here`
3. Under **"Authorized redirect URIs"**, make sure this is added:
   ```
   http://localhost:5001/api/auth/google/callback
   ```
4. Under **"Authorized JavaScript origins"**, make sure this is added:
   ```
   http://localhost:3000
   http://localhost:5001
   ```
5. Click **Save**

---

## Current .env values (already correct)

```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
CLIENT_URL=http://localhost:3000
PORT=5001
```

---

## Flow after fix

1. User clicks "Continue with Google"
2. Browser goes to `http://localhost:5001/api/auth/google` → redirects to Google
3. User signs in with Google account
4. Google redirects back to `http://localhost:5001/api/auth/google/callback`
5. Server creates/finds user, generates JWT token
6. Server redirects to `http://localhost:3000/auth/callback?token=JWT_TOKEN`
7. Client stores token, calls `/api/auth/me`, logs user in
8. User lands on homepage ✅
