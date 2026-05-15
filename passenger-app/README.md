# Passenger App · back-seat voice questionnaire

A single-file web app for a Samsung tablet (or iPhone/iPad) mounted in the back of an Uber. Passengers tap **Start**, pick a theme, and speak their answers to 5 questions. Built with vanilla JS + Web Speech API + ElevenLabs for the voice.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML + CSS + JS in one file) |
| `generate-audio.js` | Node script that calls ElevenLabs and saves mp3s into `audio/` |
| `audio/<theme>/` | Pre-generated mp3s: `welcome`, `q1`–`q5`, `thanks` |
| `.env` | Your ElevenLabs API key + voice ID (gitignored) |
| `package.json` | Convenience scripts (`start`, `tunnel`, `generate`) |

---

## Run locally on your laptop

```bash
cd passenger-app
npm start        # serves on http://localhost:5173
```

Open http://localhost:5173 in Chrome. The flow works end-to-end with browser TTS as fallback — no API key needed to try it.

> Microphone needs HTTPS or `localhost`. Plain-IP testing (e.g. `http://192.168.1.x:5173`) **won't** work on mobile — use the ngrok step below.

---

## Test on your iPhone / iPad

iOS Safari requires HTTPS for microphone access. The cleanest path is ngrok.

1. **Sign up free** at https://dashboard.ngrok.com (gives you a stable token).
2. **Install + auth** (once):
   ```bash
   brew install ngrok
   ngrok config add-authtoken <YOUR_TOKEN>
   ```
3. **In terminal A**, start the local server:
   ```bash
   npm start
   ```
4. **In terminal B**, open the HTTPS tunnel:
   ```bash
   npm run tunnel
   ```
   You'll get a URL like `https://abcd-1234.ngrok-free.app` — open this on your iPhone Safari.
5. **Tap "Start"** → Safari prompts for microphone → tap **Allow**.
6. Speak your answers. The app shows a live transcript and auto-advances 3 seconds after you stop talking. You can also say "next" or tap **Next** / **Skip**.

### iOS Safari quirks (already handled)

- **Mic permission**: prompted on first start; re-granted per ngrok URL.
- **Continuous recognition**: iOS pauses recognition between phrases. The app auto-restarts it while the question screen is active.
- **Audio unlock**: iOS won't autoplay audio. The Tap-to-Start button unlocks playback for the rest of the session.
- **Wake lock**: not enabled — the screen may dim on long pauses. (Easy to add later if you mount the tablet permanently.)
- **iPad split-view**: works fine; locks landscape recommended via the iPad's rotation lock.

---

## Add your friend's voice (ElevenLabs)

The app already runs on browser TTS as a placeholder. To swap in your friend's cloned voice:

1. **Get your credentials**:
   - API key: https://elevenlabs.io → Profile → API Keys
   - Voice ID: click your cloned voice → copy the `Voice ID` field
2. **Configure**:
   ```bash
   cp .env.example .env
   # edit .env with your real values
   ```
3. **Generate all the audio**:
   ```bash
   npm run generate
   ```
   This calls ElevenLabs once per question (4 themes × 7 clips = 28 files). Cost is roughly **$0.10–$0.50 in credits total**, depending on tier.
4. **Reload the app** — passengers now hear your friend.

### Re-generate after editing questions

If you change a question, edit it in **both** places:

- `index.html` → `THEMES` object (the displayed text)
- `generate-audio.js` → `THEMES` object (what gets spoken)

Then run `npm run generate` again — only the changed files re-fetch.
To force a full re-render (e.g. after switching voices), run `npm run generate:force`.

### Swap voices

Change `ELEVENLABS_VOICE_ID` in `.env`, then `npm run generate:force`.

---

## Admin / data

- Visit `/#admin` on the device (or click the small `·` at the bottom-left of the welcome screen).
- See every saved session.
- Export to **JSON** or **CSV**.
- "Test voice" plays a sample so you can confirm audio works.
- "Clear all data" wipes localStorage on that device.

All session data lives in **localStorage** — never sent anywhere.

---

## Add a new theme

In **both** `index.html` and `generate-audio.js`, add an entry to `THEMES`:

```js
"airport-run": {
  name: "Airport Run",                       // display name (index.html only)
  desc: "For YVR trips",                     // display desc (index.html only)
  welcome: "Welcome aboard. Off to the airport?",  // (generate-audio.js only)
  thanks:  "Safe travels.",                  // (generate-audio.js only)
  questions: [
    "Where are you flying to?",
    "Business or vacation?",
    "Window or aisle?",
    "How early do you usually get to the airport?",
    "What's the longest flight you've ever taken?",
  ],
},
```

Then `npm run generate` and reload.

---

## Known limitations

- **No iOS Chrome support for Web Speech API.** Use Safari on iPhone/iPad.
- **Accents + road noise** degrade recognition. The "Skip" button is intentional.
- **No internet → no fallback TTS** for missing mp3 files. So once you generate audio, the app is fully offline-capable.
- **Single-device storage.** Sessions live on the tablet's localStorage; export regularly.

---

## Next features to consider (not built yet)

- AI-generated follow-up questions (one Claude call per answer)
- Tip-jar QR code on the thank-you screen
- Multi-language theme variants
- Passenger consent screen (recording disclosure) before first question
- Wake-lock so the tablet never dims mid-ride
- Auto-upload sessions to a Google Sheet on WiFi
