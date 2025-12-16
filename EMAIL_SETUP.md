# Email Setup Guide

## SMTP Configuration

To enable email functionality for newsletter subscriptions, you need to configure SMTP settings in your `.env` file.

### Gmail Setup (Recommended)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Scholarship Gateway" as the name
   - Copy the generated 16-character password

3. **Add to `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=usamajatt16@gmail.com
SMTP_PASS=your-16-character-app-password-here

# Optional: Only needed for production
# For local testing, it will default to http://localhost:3000
FRONTEND_URL=https://scholarshipgateway.com
```

### Other Email Providers

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Custom SMTP:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
# FRONTEND_URL is optional for local testing (defaults to http://localhost:3000)
FRONTEND_URL=https://yourdomain.com
```

## How It Works

1. **Subscription**: Users subscribe via the newsletter form on the frontend
2. **Email Storage**: Email addresses are stored in the `newsletter_subscribers` table
3. **Auto-Email**: When a new post is published (or status changes from draft to published), emails are automatically sent to all active subscribers
4. **Email Template**: Beautiful HTML email template with post details, images, and CTA buttons

## Local Testing (No Domain Required)

**FRONTEND_URL is NOT required for local testing!**

For local development, you can test email sending without setting `FRONTEND_URL`. The system will automatically use `http://localhost:3000` as the default.

**Minimum `.env` for local testing:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=usamajatt16@gmail.com
SMTP_PASS=your-gmail-app-password
# FRONTEND_URL is optional - defaults to http://localhost:3000
```

**Note:** Email links in local testing will point to `http://localhost:3000`. This is fine for testing email functionality. For production, you should set `FRONTEND_URL` to your actual domain.

## Testing

1. Subscribe using the newsletter form on the frontend
2. Create or update a post and set status to "published"
3. Check the console logs for email sending status
4. Verify emails are received by subscribers

## Troubleshooting

- **Emails not sending**: Check SMTP credentials and ensure app password is correct (for Gmail)
- **Rate limiting**: Emails are sent in batches of 10 with 1-second delays to avoid rate limiting
- **Check logs**: Check server console for email sending errors

