# BonziWORLD New Features - Quick Reference

## Message Logging 📝
All messages in BonziWORLD chat are now automatically logged and saved for future reference.
- **Location**: `logs/messages/[roomId].log`
- **Format**: `[Timestamp] Username (GUID): Message`
- **Automatic**: No user action required

## TTS Voice Selection 🎤
You can now switch between different text-to-speech voices to customize your Bonzi's voice!

### Usage:
```
/voice en-us       # US English (default)
/voice en-gb       # British English
/voice es          # Spanish
/voice fr          # French
/voice de          # German
/voice it          # Italian
/voice ru          # Russian
/voice jp          # Japanese
```

### Example:
```
/voice ja          # Switch to Japanese accent
/voice es          # Switch to Spanish accent
```

## PS4 Notifications 🎮
Get desktop and in-app notifications for important events!

### Features:
- Smooth animations when notifications appear/disappear
- Auto-dismiss after 5 seconds or click the × button
- Sound alerts for important events
- Desktop notifications (if your browser supports it)
- Different notification types:
  - **Info** (blue) - General information
  - **Success** (green) - Positive events
  - **Warning** (orange) - Warnings
  - **Error** (red) - Problems
  - **Primary** (purple) - Special events

### Automatic Notifications For:
- Users joining/leaving rooms
- Announcements from room owners
- Join/ban/kick events
- Login failures
- Commands from other users

### Manual Notifications:
```
/notify Your custom notification message
/ps4notify Your PS4-style notification message
```

## Bug Fixes 🐛
- **Fixed SamJS Crashes**: The text-to-speech engine is now more stable and won't crash on unusual input
  - Better error handling
  - Input validation
  - Character filtering
  - Audio context management

## Technical Details

### Message Logs
- Logs are stored per room
- Includes user GUID for user tracking
- Timestamps in ISO 8601 format
- Persistent across sessions

### Voice System
- Saves voice selection per user in the room
- Broadcasts voice changes to all users
- Validated against safe voice list
- No special permissions required

### Notification System
- Desktop notifications require user permission (asked once)
- In-app notifications work in all browsers
- Graceful fallback if features unavailable
- Low bandwidth overhead

## Tips & Tricks

1. **Voice combinations**: Mix different voice types with pitch/speed for unique effects
   ```
   /voice jp
   /pitch 200
   /speed 100
   ```

2. **Message history**: Admins can check logs for moderation purposes

3. **Notification sounds**: Keep notifications enabled to stay aware of room activity

4. **Desktop notifications**: Enable in your browser settings for full experience

## Support
If you encounter any issues:
1. Check browser console (F12) for error messages
2. Try refreshing the page
3. Clear browser cache if problems persist
