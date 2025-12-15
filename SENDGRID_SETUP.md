# SendGrid Setup Guide - Step by Step

## What is SENDGRID_FROM_EMAIL?

**SENDGRID_FROM_EMAIL** is the email address that will appear as the **sender** of all emails sent from your application.

**Example:** When a user receives a password reset email, they will see it's from `noreply@yourdomain.com` (or whatever you set).

---

## Step-by-Step Setup

### Step 1: Sign Up for SendGrid

1. Go to https://sendgrid.com
2. Click **"Start for Free"**
3. Sign up with your email
4. Verify your email address

### Step 2: Create API Key

1. Log in to SendGrid Dashboard
2. Go to **Settings** → **API Keys** (left sidebar)
3. Click **"Create API Key"** button
4. Give it a name: `Linkcode LMS`
5. Select **"Full Access"** (or at least "Mail Send" permission)
6. Click **"Create & View"**
7. **COPY THE API KEY** - You won't see it again!
   - It looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Verify Sender Email (This is your SENDGRID_FROM_EMAIL)

You need to verify the email address that will be used as the sender.

#### Option A: Verify Single Sender (Easiest - Use Your Personal Email)

1. In SendGrid Dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a New Sender"**
3. Fill in the form:
   - **From Email Address:** `your_email@gmail.com` (or any email you own)
   - **From Name:** `Linkcode LMS` (or your company name)
   - **Reply To:** Same as From Email
   - **Company Address:** Your address
   - **City, State, Zip:** Your location
   - **Country:** Your country
4. Click **"Create"**
5. **Check your email inbox** for a verification email from SendGrid
6. Click the verification link in the email
7. ✅ **Verified!** Now you can use this email as `SENDGRID_FROM_EMAIL`

#### Option B: Verify Domain (For Production - Recommended)

1. In SendGrid Dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Follow the DNS setup instructions
4. This allows you to send from any email on your domain (e.g., `noreply@yourdomain.com`)

---

## Step 4: Set Environment Variables

### For Local Development (.env file)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` file and add:
   ```env
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   SENDGRID_FROM_EMAIL=your_verified_email@gmail.com
   ```

### For Render (Production)

1. Go to your Render Dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Click **"Add Environment Variable"**
5. Add these two variables:
   - **Key:** `SENDGRID_API_KEY`
     **Value:** `SG.your_actual_api_key_here`
   
   - **Key:** `SENDGRID_FROM_EMAIL`
     **Value:** `your_verified_email@gmail.com` (the email you verified in Step 3)

6. Click **"Save Changes"**
7. Render will automatically redeploy

---

## Quick Reference

| Variable | What It Is | Where to Get It |
|----------|------------|-----------------|
| `SENDGRID_API_KEY` | Your SendGrid API key | SendGrid Dashboard → Settings → API Keys → Create API Key |
| `SENDGRID_FROM_EMAIL` | Verified sender email | SendGrid Dashboard → Settings → Sender Authentication → Verify a New Sender |

---

## Testing

After setting up:

1. **Local:** Start your backend server
2. **Render:** Wait for deployment to complete
3. Check logs - you should see:
   ```
   ✅ SendGrid API configured (works on Render free tier)
      From Email: your_verified_email@gmail.com
   ```
4. Test by requesting a password reset OTP

---

## Common Questions

### Q: Can I use my Gmail address as SENDGRID_FROM_EMAIL?
**A:** Yes! Just verify it in SendGrid (Step 3, Option A). The email will be sent FROM SendGrid's servers, but it will appear to come from your Gmail address.

### Q: Do I need to add it to both local .env and Render?
**A:** Yes! 
- **Local .env:** For testing on your computer
- **Render Environment Variables:** For production deployment

### Q: What if I don't set SENDGRID_FROM_EMAIL?
**A:** The code will try to use `SMTP_USER` or default to `noreply@linkcode.com`. But it's better to set it explicitly.

### Q: Can I change SENDGRID_FROM_EMAIL later?
**A:** Yes! Just update the environment variable and redeploy. Make sure the new email is verified in SendGrid first.

---

## Troubleshooting

### Error: "The from address does not match a verified Sender Identity"
- **Solution:** Verify the email in SendGrid Dashboard → Settings → Sender Authentication

### Error: "Invalid API key"
- **Solution:** Double-check your API key. Make sure you copied the entire key starting with `SG.`

### Emails not sending
- Check SendGrid Dashboard → Activity → Email Activity to see delivery status
- Check your backend logs for error messages

