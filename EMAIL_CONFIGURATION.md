# Email Service Configuration Guide

This project supports **both SendGrid API and SMTP (Gmail)** for sending emails.

## Current Setup: Render (Free Tier) → Using SendGrid

### ✅ For Render Free Tier (Current Setup)

**Render free tier blocks SMTP ports (25, 465, 587), so we use SendGrid API.**

#### Environment Variables in Render:
```
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com (optional)
```

#### Setup Steps:
1. Sign up at https://sendgrid.com (free: 100 emails/day)
2. Create API Key: Settings → API Keys → Create API Key
3. Verify Sender: Settings → Sender Authentication → Verify a New Sender
4. Add environment variables in Render Dashboard
5. Deploy

---

## Future Setup: Vultr/AWS → Switch to SMTP (Gmail)

### ✅ For Vultr/AWS/Other VPS (Future Setup)

**SMTP works perfectly on Vultr, AWS, and most VPS providers.**

#### Environment Variables:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
```

#### Setup Steps for Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password) for `SMTP_PASS`
4. Set environment variables in your VPS
5. Deploy

#### To Switch from SendGrid to SMTP:
1. **Remove/Delete** `SENDGRID_API_KEY` from environment variables
2. **Add** SMTP variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.)
3. Redeploy
4. The code will automatically use SMTP instead of SendGrid

---

## How It Works

The code automatically chooses the email service:

- **Priority 1**: If `SENDGRID_API_KEY` is set → Uses SendGrid API
- **Priority 2**: If SendGrid not set but SMTP configured → Uses SMTP

**No code changes needed!** Just update environment variables.

---

## Quick Reference

| Platform | Service | Status |
|----------|---------|--------|
| Render (Free) | SendGrid API | ✅ Current |
| Render (Paid) | SMTP or SendGrid | ✅ Both work |
| Vultr | SMTP (Gmail) | ✅ Future |
| AWS EC2 | SMTP (Gmail) | ✅ Future |
| Other VPS | SMTP (Gmail) | ✅ Future |

---

## Testing

After deployment, check logs:
- SendGrid: `✅ SendGrid API configured (works on Render free tier)`
- SMTP: `✅ SMTP server is ready to send emails`

Test by requesting a password reset OTP.

