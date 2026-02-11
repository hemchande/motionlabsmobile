# Brevo Email Invite Integration

## Overview

The plus button on the Team Roster screen now sends email invitations to athletes via Brevo service.

---

## ✅ What Was Implemented

### 1. Brevo Service (`src/services/brevo.ts`)
- Client-side service for sending emails via Brevo API
- Sends professional HTML invitation emails
- Handles errors gracefully

### 2. Invite Modal
- Opens when clicking the plus (+) button on Team Roster
- Form fields:
  - Athlete Email (required)
  - Athlete Name (optional)
- Success/error feedback
- Loading states

### 3. Integration
- Uses `useAuth()` to get coach information
- Uses `useUser()` to get user context
- Generates unique invitation tokens
- Creates invitation links

---

## 🔧 Setup

### 1. Add Brevo API Key

Create or update `.env` file in the project root:

```env
VITE_BREVO_API_KEY=your_brevo_api_key_here
```

### 2. Get Brevo API Key

1. Sign up at [Brevo (formerly Sendinblue)](https://www.brevo.com/)
2. Go to **SMTP & API** → **API Keys**
3. Create a new API key
4. Copy the key and add it to `.env`

### 3. Restart Dev Server

After adding the API key, restart the frontend:

```bash
npm run dev
```

---

## 🚀 Usage

### Sending an Invitation

1. Navigate to **Team Roster** screen
2. Click the **plus (+)** button in the top-right
3. Enter athlete email (required)
4. Enter athlete name (optional)
5. Click **Send Invite**
6. Confirmation message appears

### Invitation Email

The athlete receives a professional email with:
- Welcome message from coach
- MotionLabs AI branding
- Feature highlights
- **Accept Invitation** button
- Unique invitation link

---

## 📋 Features

### ✅ Modal Dialog
- Clean, mobile-friendly design
- Form validation
- Error handling
- Success confirmation
- Auto-close on success

### ✅ Email Content
- Professional HTML template
- Responsive design
- Branded with MotionLabs AI
- Clear call-to-action
- Fallback text link

### ✅ Error Handling
- Email format validation
- API error messages
- User-friendly error display
- Loading states

---

## 🔍 Code Structure

### Brevo Service
```typescript
// src/services/brevo.ts
BrevoService.sendAthleteInvitation({
  coachName: string,
  coachEmail: string,
  athleteEmail: string,
  athleteName?: string,
  institution?: string,
  invitationLink: string
})
```

### Modal Component
```tsx
// In MobileTeamRoster component
- showInviteModal state
- athleteEmail state
- athleteName state
- handleSendInvite function
- Modal UI with form
```

---

## 📧 Email Template

The invitation email includes:
- **Header**: MotionLabs AI branding
- **Welcome**: Personalized greeting
- **Features**: 
  - Personalized performance insights
  - Form feedback
  - Injury prevention tools
  - Progress tracking
- **CTA**: Accept Invitation button
- **Footer**: Coach information

---

## 🐛 Troubleshooting

### "Brevo API key not configured"
- Check that `VITE_BREVO_API_KEY` is set in `.env`
- Restart the dev server after adding the key
- Verify the key is correct

### "Failed to send invitation"
- Check Brevo API key is valid
- Verify internet connection
- Check Brevo account has sending credits
- Review browser console for detailed errors

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check Brevo dashboard for delivery status
- Ensure Brevo account is verified

---

## ✅ Status

- ✅ Brevo service created
- ✅ Invite modal implemented
- ✅ Plus button connected
- ✅ Email template ready
- ✅ Error handling added
- ⚠️ **Requires Brevo API key in `.env`**

---

## 🔄 Next Steps

1. ✅ Invite functionality complete
2. 🔄 Add invitation tracking in database
3. 🔄 Add invitation status management
4. 🔄 Add resend invitation feature
5. 🔄 Add bulk invite feature

---

**Ready to use!** Just add your Brevo API key to `.env` and start inviting athletes! 🎉




