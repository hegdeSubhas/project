# TalkingHead Avatar Setup Guide

## Installation

The InterviewSessionComponent now uses TalkingHead for a professional talking avatar with lip-sync capabilities.

### Step 1: Install the Package

Run the following command in your project directory:

```bash
npm install talkinghead
```

Or with yarn:
```bash
yarn add talkinghead
```

### Step 2: Verify Installation

After installation, you should see `talkinghead` in your `package.json` dependencies.

### Step 3: Run the Application

```bash
npm start
```

## Features Implemented

✅ **Talking Avatar** - Professional 3D avatar with lip-sync
✅ **Interview Questions** - Avatar asks predefined interview questions
✅ **Text-to-Speech** - Avatar speaks all text in a natural voice
✅ **Interactive** - Click the chat button to make avatar ask questions
✅ **Ready Player Me Integration** - Uses RPM avatars for customization

## How It Works

1. **Avatar Initialization**: TalkingHead loads with a professional avatar body
2. **Welcome Message**: Avatar greets candidate on session start
3. **Ask Questions**: Click the chat button (message icon) to trigger interview questions
4. **Lip Sync**: All speech automatically synchronizes with avatar lip movements
5. **Custom Voice**: Uses professional voice settings for interviews

## Interview Questions

The avatar can ask the following questions:
- Tell me about your experience with this role.
- What are your key strengths and how do they apply here?
- Can you describe a challenging project you worked on?
- How do you approach problem-solving?
- What interested you most about this position?
- Where do you see yourself in 5 years?

## Customization

### Change Avatar Gender
In `InterviewSessionComponent.js`, line ~27:
```javascript
body: 'F', // Change to 'M' for male avatar
```

### Change Avatar URL
Replace the avatar URL with your own Ready Player Me avatar:
```javascript
url: 'https://models.readyplayer.me/YOUR_AVATAR_ID.glb'
```

### Add Custom Questions
Modify the `interviewQuestions` array in the component to add more questions.

### Change Voice
Update the `voiceURI` in the TalkingHead initialization:
```javascript
voiceURI: 'Google UK English Female' // or other available voices
```

## Troubleshooting

### Avatar not showing?
1. Check browser console for errors
2. Ensure TalkingHead is properly installed: `npm install talkinghead`
3. Check that the avatar URL is accessible
4. Make sure WebGL is supported in your browser

### No lip-sync?
- Ensure audio context is enabled in your browser
- Check browser speaker settings

### Avatar not speaking?
- Verify text-to-speech is available in your browser
- Check browser microphone/speaker permissions
- Try a different voiceURI

## Browser Support

TalkingHead works best on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting Install Issues

If you encounter PowerShell security errors, use Command Prompt instead:
```cmd
cd C:\Users\subha\Desktop\NextHire\next-hire-frontend
npm install talkinghead
```

Or use the node terminal in VS Code to run npm commands.
