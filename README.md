# Hifz — Quran Memorization

A free, static, installable Quran memorization web app for Android, iPhone, iPad and desktop browsers. The core reading, reciter playback, repetition, tests and revision tools require no API key or account.

## Practice

- **Read:** select a surah and verse range; stream real qāri recordings.
- **Memorize:** repeat each verse, the whole passage, or progressively connect verses; hide text and reveal hints.
- **Recite:** compare browser-recognized Arabic with the selected passage. Matching words and possible differences are highlighted. This is experimental word matching, **not tajweed or pronunciation assessment**. Recognition can be wrong; dismiss false alerts.
- **Test myself:** hear a random prompt from your memorized surahs or custom range, then continue with the next verse. Listening starts on an explicit tap.
- **Revision:** confidence ratings schedule strong passages farther apart and weak passages sooner. Possible mistakes and manual teacher notes are saved for review.
- **Progress:** practice history, self-rated strong verses, consistency calendar and configurable daily goal.

## More tools

Search all 114 surahs, jump by Madinah page/juz/reference, find verses from Arabic words, bookmark verses, compare similar openings, progressive hints and hint history, record yourself locally, download recordings for your teacher, preview real qāri audio, download selected audio for offline use, microphone check, focus mode, dark theme, adjustable Arabic font, guest mode, local backup and restore.

The reciter catalogue includes the Arabic audio editions supplied by Al Quran Cloud. Multiple recitation styles are separate editions. Some reciters may lack particular verses or support for browser downloads. It does not claim every reciter worldwide.

## Install

- **Android:** open the live website in Chrome, then use Install app / Add to Home screen.
- **iPhone/iPad:** open in Safari → Share → Add to Home Screen.

Keep the app open during microphone sessions. It cannot listen while your device is locked. After the first successful online visit, the app and Quran text are cached for offline reading. Audio must be downloaded separately. Browser storage can be evicted; export important progress and download recordings.

## Speech availability and privacy

Browser speech recognition varies by browser, OS and installed language support. It may use the browser vendor’s online speech service, including for Arabic. Hifz does not upload those speech sessions to its own server. Speech recognition can mishear Qur’anic Arabic and cannot replace a teacher.

If browser recognition is unavailable, you can still record yourself, practise with hidden text, compare a typed transcript, or opt into **record-and-transcribe** with your own OpenAI-compatible speech API. The suggested Groq setup uses `whisper-large-v3-turbo`. Free-provider quotas and billing are controlled by the provider. A key stays in memory for this visit and is never included in progress exports. Audio is sent only after the explicit cloud recording confirmation. No key or payment information is bundled.

Progress is stored in browser localStorage. Recordings are stored in IndexedDB. Downloaded audio uses Cache Storage. Data does not automatically sync across devices; use export/import for progress and download recordings separately. Guest practice does not overwrite saved progress. There are no third-party analytics or accounts.

## Hosting

This project is served directly from the `main` branch root through GitHub Pages. No backend or build step is required. All assets use relative paths to work under a repository subpath.

## Local checks

Node 18+:

```sh
npm run check
npm test
```

Serve the folder over HTTP (opening index.html as file:// will not load JSON or the module):

```sh
python3 -m http.server 8080
```

Tests cover corpus integrity, word alignment, incomplete recitation handling, silence, repetition order, revision scheduling and verse search. Real microphone behavior and transcription quality require tests on your device.

## Sources and font

- Quran Arabic text and verse metadata: Al Quran Cloud `quran-uthmani`, checked for 114 surahs and 6,236 verses. https://alquran.cloud/api
- Arabic recitation catalogue and source audio URLs: Al Quran Cloud. https://alquran.cloud/cdn
- Amiri Quran font: Google Fonts / Amiri project, SIL Open Font License, included as `FONT-LICENSE.txt`. https://github.com/google/fonts/tree/main/ofl/amiriquran

The text uses Hafs. Do not mix other recitation traditions with word checking. Similar-verse comparison is based on matching normalized opening words, not a comprehensive scholarly mutashabihat database. The app does not diagnose tashkeel, makharij or tajweed mistakes.

Recordings remain the property of their respective sources and reciters. Only download/use/share where permitted by the source. The app code is provided in this repository; third-party Quran text, fonts and audio retain their respective terms.
