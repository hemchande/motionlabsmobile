# Stream.io Live Recording Setup

This guide explains how to set up the live recording session feature in the mobile app.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Stream.io Configuration
VITE_STREAM_CALL_ID=demo-call-xGvo-o50
VITE_STREAM_API_KEY=htspepyqm3aw
VITE_STREAM_API_SECRET=akku2tsv8cxghhsdtp9rs3jpbfv28detcp7me2urrgp88rr4pj9j45vd3ubfxmqf
```

## How It Works

1. **Quick Actions Screen**: Tap "Record Session" button
2. **Record Video Screen**: Tap "Record Live Session" button
3. **Live Session**: The app will:
   - Request camera and microphone permissions
   - Connect to Stream.io
   - Start a live video session
   - Display real-time video feed
   - Allow toggling video/audio on/off

## Features

- ✅ Mobile-optimized interface
- ✅ Real-time video streaming via Stream.io
- ✅ Camera and microphone controls
- ✅ Recording timer
- ✅ Error handling for permissions
- ✅ Clean exit/disconnect

## Usage

1. Navigate to "Quick Actions" screen (screen 7 in Coach flow)
2. Tap "Record Session"
3. Or navigate to "Record Video" screen (screen 4)
4. Tap "Record Live Session"
5. Grant camera/microphone permissions when prompted
6. Session will start automatically

## Backend Integration

The Stream.io call ID (`VITE_STREAM_CALL_ID`) should match the one used in your backend agent (`cvMLAgent`). The backend agent can join the same call to provide real-time AI analysis.

## Security Note

⚠️ **Important**: The API secret is exposed in the frontend for development only. In production, you should:
- Generate JWT tokens server-side
- Never expose the API secret in client-side code
- Use a secure backend endpoint to generate tokens

## Troubleshooting

### Camera Permission Denied
- Check browser settings
- Make sure no other apps are using the camera
- Try refreshing the page

### Connection Failed
- Check your internet connection
- Verify Stream.io credentials are correct
- Check browser console for errors

### Token Generation Error
- Ensure `VITE_STREAM_API_SECRET` is set in `.env`
- Restart the dev server after adding environment variables





