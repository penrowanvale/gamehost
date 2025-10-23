# 📧 Email Notification System Guide

This guide explains the email notification system implemented in GameBlast Mobile platform and how to configure it.

## 🎯 Overview

The platform automatically sends email notifications to `managervcreation@gmail.com` for important events that require admin attention. The system uses Gmail SMTP for reliable email delivery.

## 📬 When Admin Gets Notified

### 1. **Organiser Registration** 🎪
**Trigger**: When someone fills out the organiser signup form
**Email Contains**:
- Organiser's real name and chosen organiser name
- Contact details (email, phone, WhatsApp)
- Aadhaar document links (front and back)
- Registration timestamp
- Direct link to admin panel for approval

**Purpose**: Admin needs to review and approve organiser applications manually.

### 2. **Contact Form Submissions** 📝
**Trigger**: When users submit the contact form on the website
**Email Contains**:
- User's name, email, and phone (if provided)
- Subject and message content
- Submission timestamp
- Quick reply button to respond directly

**Purpose**: Ensure all user inquiries are promptly addressed.

### 3. **General Admin Alerts** 🚨
**Trigger**: System errors, important events, or manual notifications
**Email Contains**:
- Alert title and detailed message
- Additional data (if applicable)
- Timestamp and context information
- Link to admin panel

**Purpose**: Keep admin informed of platform status and issues.

## ⚙️ Email Configuration

### Environment Variables Required

Add these to your `.env` file:

```bash
# Admin notification email (where notifications are sent)
ADMIN_EMAIL=managervcreation@gmail.com

# SMTP configuration (sender email)
SMTP_USER=managervcreation@gmail.com
SMTP_PASSWORD=your_gmail_app_password_here

# Support email (shown to users)
SUPPORT_EMAIL=support@gameblast.in
```

### Gmail App Password Setup

1. **Enable 2-Step Verification** on your Gmail account
2. Go to **Google Account > Security > 2-Step Verification**
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Use this 16-character password as `SMTP_PASSWORD`

⚠️ **Never use your regular Gmail password for SMTP!**

## 🔧 Technical Implementation

### Email Service Location
- **File**: `config/email.js`
- **Functions**:
  - `sendOrganiserSignupNotification()` - Organiser registration alerts
  - `sendContactFormNotification()` - Contact form submissions
  - `sendGeneralAdminNotification()` - General alerts
  - `sendAdminNotification()` - Base email sending function

### API Integration
- **Organiser Signup**: `api/auth.js` (line ~162)
- **Contact Form**: `api/contact.js`
- **General Alerts**: Can be called from any API endpoint

### Dependencies
- **nodemailer**: Email sending library
- **Added to**: `package.json`

## 📨 Email Templates

All emails use responsive HTML templates with:
- **GameBlast Mobile branding**
- **Professional styling**
- **Mobile-friendly design**
- **Clear call-to-action buttons**
- **Indian timezone timestamps**

### Sample Email Structure
```
🎮 GameBlast Mobile
[Alert Type]

[Content in formatted table/sections]

[Action Button: Open Admin Panel]

Footer with timestamp and branding
```

## 🚀 Testing the System

### Test Organiser Registration
1. Go to `/login` page
2. Switch to "Organiser" tab
3. Click "Sign Up" and fill the form
4. Submit - admin should receive notification email

### Test Contact Form
1. Go to `/contact` page
2. Fill out and submit the contact form
3. Admin should receive notification email

### Verify Email Delivery
- Check Gmail inbox for `managervcreation@gmail.com`
- Check spam folder if emails don't appear
- Monitor server logs for email sending status

## 🛠️ Troubleshooting

### Common Issues

**1. Emails Not Sending**
```bash
# Check environment variables
echo $SMTP_USER
echo $SMTP_PASSWORD
echo $ADMIN_EMAIL

# Check server logs
npm run dev
# Look for "Admin notification sent" or error messages
```

**2. Gmail Authentication Error**
- Ensure 2-Step Verification is enabled
- Use App Password, not regular password
- Check if "Less secure app access" is disabled (good!)

**3. Emails Going to Spam**
- Add sender email to contacts
- Check SPF/DKIM records for your domain
- Use consistent sender email address

**4. Template Not Displaying Correctly**
- Test in different email clients
- Check HTML syntax in email templates
- Verify CSS inline styles

### Debug Mode
Add this to your `.env` for detailed email debugging:
```bash
DEBUG_EMAIL=true
```

## 📊 Monitoring

### Success Indicators
- Console logs: "Admin notification sent successfully"
- Email delivery confirmations
- Admin panel shows new organiser requests

### Error Indicators
- Console errors: "Failed to send admin notification"
- Missing emails in admin inbox
- User complaints about no response

## 🔒 Security Considerations

### Email Security
- ✅ Uses App Passwords (secure)
- ✅ SMTP over TLS/SSL
- ✅ No sensitive data in email content
- ✅ Aadhaar documents as secure links only

### Data Privacy
- Only necessary information is emailed
- Personal data is handled according to privacy policy
- Email content is professional and secure

## 📈 Future Enhancements

### Planned Features
- **Email Templates**: More customizable templates
- **SMS Notifications**: WhatsApp/SMS alerts for urgent matters
- **Email Analytics**: Track open rates and responses
- **Auto-Responses**: Automated acknowledgment emails
- **Multiple Recipients**: CC/BCC additional admin emails

### Integration Options
- **Slack/Discord**: Platform notifications
- **Push Notifications**: Browser/mobile alerts
- **Dashboard Alerts**: In-app notification system

## 📞 Support

If you encounter issues with the email system:

1. **Check Configuration**: Verify all environment variables
2. **Test Gmail Access**: Try logging into Gmail with app password
3. **Review Logs**: Check server console for error messages
4. **Contact Developer**: Provide error logs and configuration details

---

**✅ Email notification system is now active!** Admin will receive notifications at `managervcreation@gmail.com` for all important platform events.