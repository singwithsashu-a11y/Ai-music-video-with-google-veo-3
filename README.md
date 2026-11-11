# 🎬 AI Music Video Studio — Pro Director Suite

**Turn Your Music Into Cinematic, Story-Driven AI Music Videos**

**AI Music Video Studio** is a full-stack, commercial-grade **AI Music-to-Video Production Platform** built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Node.js + Express**, **Google Gemini AI (`@google/genai`)**, **Firebase Authentication & Firestore**, **Google Drive Cloud API v3**, **HTML5 60fps Canvas Cinema Engine**, and a real **FFmpeg / FFprobe H.264 + AAC MP4 Rendering Pipeline**.

Upload your real `.mp3` or `.wav` song, automatically extract exact duration, BPM, beat timestamps, energy curves, and structural sections (`Intro`, `Verse`, `Chorus`, `Bridge`, `Outro`), craft story-driven scenes using the **13-Parameter AI Prompt Studio**, lock protagonist appearance and clothing in the **Character Studio**, edit timelines and colour grading in the **Multi-Track Video Editor**, sync cuts to musical beats, and export a **Clean Video (without lyrics)** or **Synchronized Subtitle / Karaoke MP4** directly to your device or **Google Drive**.

---

## 📑 Table of Contents

1. [Project Overview & Vision](#1-project-overview--vision)
2. [Complete Feature Breakdown](#2-complete-feature-breakdown)
3. [End-to-End Pipeline: How the Application Works](#3-end-to-end-pipeline-how-the-application-works)
4. [System Architecture & Tech Stack](#4-system-architecture--tech-stack)
5. [Complete Folder & File Structure](#5-complete-folder--file-structure)
6. [System Requirements & Prerequisites](#6-system-requirements--prerequisites)
7. [Environment Variables Setup (`.env`)](#7-environment-variables-setup-env)
8. [API Keys & Cloud Credentials Required](#8-api-keys--cloud-credentials-required)
9. [Firebase Authentication, Firestore & Google Drive OAuth Setup](#9-firebase-authentication-firestore--google-drive-oauth-setup)
10. [Google Gemini AI Setup (`@google/genai`)](#10-google-gemini-ai-setup-googlegenai)
11. [3-Tier Video Generation Engine & Google Flow / Veo Architecture](#11-3-tier-video-generation-engine--google-flow--veo-architecture)
12. [FFmpeg & FFprobe Media Processing Setup](#12-ffmpeg--ffprobe-media-processing-setup)
13. [Database & Storage Architecture (Project Isolation)](#13-database--storage-architecture-project-isolation)
14. [Step-by-Step Local Development Setup](#14-step-by-step-local-development-setup)
15. [Windows Installation Guide (Windows 10 / 11)](#15-windows-installation-guide-windows-10--11)
16. [Linux Installation Guide (Ubuntu / Debian / Fedora)](#16-linux-installation-guide-ubuntu--debian--fedora)
17. [macOS Installation Guide (Apple Silicon & Intel)](#17-macos-installation-guide-apple-silicon--intel)
18. [Android Installation & Mobile Studio Guide (Termux + Wi-Fi)](#18-android-installation--mobile-studio-guide-termux--wi-fi)
19. [Running Frontend & Backend Together](#19-running-frontend--backend-together)
20. [Building & Running in Production](#20-building--running-in-production)
21. [Cloud Deployment Guide (Docker / Cloud Run / VPS)](#21-cloud-deployment-guide-docker--cloud-run--vps)
22. [Accessing the Studio on Mobile Phones Over Local Wi-Fi](#22-accessing-the-studio-on-mobile-phones-over-local-wi-fi)
23. [Detailed Guide: How to Upload Songs & Analyze Audio](#23-detailed-guide-how-to-upload-songs--analyze-audio)
24. [Detailed Guide: How to Use the Advanced AI Prompt Studio](#24-detailed-guide-how-to-use-the-advanced-ai-prompt-studio)
25. [Detailed Guide: How to Maintain Character Consistency Across Scenes](#25-detailed-guide-how-to-maintain-character-consistency-across-scenes)
26. [Detailed Guide: How to Use Storyboard & Director's Cut Mode](#26-detailed-guide-how-to-use-storyboard--directors-cut-mode)
27. [Detailed Guide: How to Use the Multi-Track Video Editor, Colour Grading & Beat Sync](#27-detailed-guide-how-to-use-the-multi-track-video-editor-colour-grading--beat-sync)
28. [Detailed Guide: Exporting MP4 Videos, Clean Video Mode & Google Drive Sync](#28-detailed-guide-exporting-mp4-videos-clean-video-mode--google-drive-sync)
29. [Backend REST API Reference](#29-backend-rest-api-reference)
30. [Troubleshooting Common Errors & FAQ](#30-troubleshooting-common-errors--faq)

---

## 1. Project Overview & Vision

Traditional music video tools merely slap static text lyrics over a looping background. **AI Music Video Studio** is engineered as a real **AI Film Director & Non-Linear Post-Production Suite**:

- **Story-Driven Visuals (Not Just Lyrics)**: Scenes follow cinematic narrative arcs—such as a protagonist walking down a rain-soaked neon street, a warm flashback memory, an extreme close-up emotional reaction, a rooftop silhouette under storm clouds, and an epic drone pullback—while keeping **Clean Video Mode** (no forced lyrics burned onto every shot) enabled by default.
- **Strict Per-Project Data Isolation**: Every project has a unique ID (`proj_*`), isolated audio asset (`track_*`), isolated storyboard scenes, isolated prompt library, and isolated render history. Development Demo Mode is completely separated behind an explicit sandbox toggle.
- **Desktop & Mobile-First Studio Experience**: Features a deep charcoal/obsidian cinema theme (`#07090F` / `#0B0F19`) with violet/indigo (`#7C3AED` / `#6366F1`) and sky-blue (`#38BDF8`) accents, a full desktop sidebar (`256px`), a collapsible mobile drawer, and a fixed mobile bottom navigation bar (`Home`, `Create`, `Prompts`, `Scenes`, `Editor`).

---

## 2. Complete Feature Breakdown

### 🎵 1. Real Audio Upload & Backend DSP Signal Analysis
- Upload real `.mp3` and `.wav` master files (validated for MIME type and size up to 50 MB).
- Uses `ffprobe` and `ffmpeg` PCM signal inspection on the backend (`/api/audio/upload` & `/api/audio/analyze`) to read:
  - **Exact Duration** (seconds & `MM:SS` timecode)
  - **Codec, Sample Rate (e.g., 44100 Hz / 48000 Hz), Channels, and File Size**
  - **BPM (Beats Per Minute)** and **Beat Grid Timestamps**
  - **Waveform Peaks Array** (for interactive timeline rendering)
  - **Structural Song Sections**: `Intro`, `Verse 1`, `Chorus 1`, `Verse 2`, `Chorus 2`, `Bridge`, `Final Chorus`, and `Outro` with normalized RMS energy scores.

### 🎛️ 2. Advanced AI Prompt Studio (`Prompts` Tab)
Control how every single scene is generated using multi-select tags and 13 dedicated cinema fields:
- **Visual Style (12 Options)**: `Cinematic Realism`, `Photorealistic`, `Bollywood Music Video`, `Anime`, `3D Animation`, `2D Animation`, `Dreamlike Fantasy`, `Dark Cinematic`, `Vintage Film`, `Documentary`, `Music Video Aesthetic`, `Surreal Art`.
- **Camera Controls (14 Options)**: `Close-up`, `Extreme Close-up`, `Medium Shot`, `Wide Shot`, `Establishing Shot`, `Over-the-Shoulder`, `Drone Shot`, `Tracking Shot`, `Dolly In`, `Dolly Out`, `Pan Left / Right`, `Tilt Up / Down`, `Handheld Camera`, `Slow Motion`.
- **Lighting (9 Options)**: `Golden Hour`, `Blue Hour`, `Moonlight`, `Neon Lighting`, `Soft Natural Light`, `Cinematic Backlight`, `Studio Lighting`, `Dramatic Shadows`, `Volumetric Lighting`.
- **Environment (12 Options)**: `Rooftop`, `Rainy Street`, `Bedroom`, `Beach`, `Mountains`, `Forest`, `City at Night`, `Empty Highway`, `Wedding Venue`, `Cafe`, `Futuristic City`, `Fantasy World`.
- **Mood (11 Options)**: `Romantic`, `Sad`, `Emotional`, `Lonely`, `Heartbroken`, `Mysterious`, `Hopeful`, `Nostalgic`, `Dark`, `Energetic`, `Inspirational`.
- **13 Director Prompt Fields**:
  1. `Main Scene Description`
  2. `Character Description`
  3. `Character Action`
  4. `Facial Expression`
  5. `Clothing / Wardrobe`
  6. `Environment`
  7. `Camera Movement`
  8. `Lighting`
  9. `Colour Grading`
  10. `Visual Effects`
  11. `Scene Transition`
  12. `Negative Prompt`
  13. `Additional Director Instructions`
- **Prompt Actions**: Auto-Generate AI Prompt with Gemini (`/api/ai/prompt-studio-generate`), Manual Edit, Save & Apply to Scene, Duplicate Prompt, Prompt History, Favorites Filter, Copy Master Prompt, Preview Scene Prompt Modal, and one-click Render Scene Clip.

### 🎭 3. AI Character Consistency Studio (`Cast` Tab)
- Create and manage recurring protagonists and cast members with:
  - **Character Name, Role & Age**
  - **Physical Appearance Description**
  - **Clothes / Wardrobe Lock**
  - **Facial Expression Lock**
  - **Hairstyle Lock**
  - **3-Angle Turnaround Reference Sheet** (`0° Front`, `90° Profile`, `180° Back`)
  - **Reference Photo Upload** or **Live Gemini AI Portrait Generation** (`/api/ai/generate-image`)
- **One-Click Cast Sync**: Click **"Inject Active Cast Into All Scene Prompts"** to lock your protagonist's exact physical description and wardrobe across every scene in the active project.

### 🎞️ 4. AI Storyboard & Director's Cut Mode (`Scenes` Tab)
- Dynamically calculates scene count and duration to match 100% of your uploaded song's real length (`30s` song, `3m 30s` song, or `6m+` song).
- **Literal vs. Metaphorical Lyric Symbolism**: Analyzes song phrases for both literal meaning and metaphorical visual motifs, paired with 8 procedural animation presets (`nebula_swirl`, `rain_neon_streaks`, `shattered_prism`, `ember_ascension`, `chrono_ripples`, `aurora_pulse`, `cyber_grid_flight`, `floating_lanterns`).
- **Director's Cut Mode**: Adjust camera angle, camera movement, transition type (`Cross Dissolve`, `Beat Flash Cut`, `Anamorphic Whip Pan`, `Dolly Zoom In`, `Glitch Sync`, `Fade to Black`), and ripple-edit scene durations before or after rendering clips.

### ✂️ 5. Multi-Track Video Editor, Colour Grading & Beat Sync (`Editor` Tab)
- **60fps Real-Time Cinema Monitor (`CanvasCinemaPlayer`)**: Live preview with synchronized audio playback, procedural lighting/particles, colour grading filters, optional lyrics overlay, title/outro cards, `.png` frame capture, and Full-Screen Monitor mode.
- **4-Track Interactive Timeline**:
  - `Track V1`: Narrative Video Scenes (supports drag-and-drop scene reordering and duration trimming).
  - `Track V2`: Atmospheric Symbolism & VFX Layer.
  - `Track A1`: Master Audio Waveform & Beat Grid Markers.
  - `Track T1`: Lyrics & Subtitles Track.
- **5-Tab Inspector Panel**:
  1. `Scene`: Edit scene duration (`2s`–`60s`), transition, camera, per-scene lyric visibility, reorder left/right, or regenerate an individual scene clip.
  2. `Lyrics`: Choose **Disable Lyrics Completely (Clean Video)**, **Selected Scenes Only**, **Karaoke Word-by-Word**, **Full Lyrics**, **Subtitle Mode**, or **Minimal Editorial Captions**, plus font family, size, position (`Top`, `Center`, `Bottom`), text color, outline color, shadow, and animation speed.
  3. `Colour`: Live sliders for **Temperature (Warm/Cool)**, **Contrast**, **Brightness**, **Saturation**, **Exposure**, **35mm Film Grain**, **Vignette**, **Lens Flare**, **Glow**, **Depth-of-Field Bokeh**, and **Fade-In / Fade-Out**.
  4. `Beats`: Inspect BPM and beat timestamps, toggle **Auto Beat-Sync**, and click **Snap All Cuts to Musical Beats**.
  5. `Export`: Full Export Studio for `.mp4`, `.srt`, `.png` thumbnail, and `.json` project backup.

### ☁️ 6. Google Drive Cloud Sync (`Projects & Drive` Tab)
- Authenticate with Google OAuth using the official **Sign in with Google** button.
- Browse and search your Google Drive files (`All Files`, `Audio (MP3/WAV)`, `Video (MP4)`, `Project / Lyrics`).
- **Import from Drive to Studio**: Import an `.mp3`/`.wav` song directly from Google Drive into the backend DSP analyzer, or import a `.json` project backup / `.srt` lyrics file.
- **Backup from Studio to Drive**: Upload your active project `.json` backup, synchronized `.srt` subtitles, or rendered master `.mp4` music video directly to Google Drive.
- **Protected Cloud Mutations**: Overwriting or deleting any file in Google Drive always displays a confirmation modal before executing the API call.

---

## 3. End-to-End Pipeline: How the Application Works

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. UPLOAD AUDIO (.MP3 / .WAV) or IMPORT FROM GOOGLE DRIVE                │
│    Frontend reads file -> POST /api/audio/upload -> Saved to /storage/   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. REAL BACKEND DSP AUDIO ANALYSIS (FFprobe + FFmpeg PCM)                │
│    Extracts exact Duration, Sample Rate, BPM, Beat Grid, Waveform Peaks, │
│    and Structural Song Sections (Intro, Verse, Chorus, Bridge, Outro)    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. GEMINI AI STORYBOARD & NARRATIVE ARC GENERATION                       │
│    POST /api/ai/analyze-lyrics -> Builds story-driven scenes spanning    │
│    100% of song duration + Literal/Metaphorical symbolism + Clean Video  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. ADVANCED AI PROMPT STUDIO & CHARACTER CONSISTENCY LOCKS               │
│    Refine 13 Director Fields, Camera/Lighting/Mood tags, and inject      │
│    active Character Studio wardrobe & identity locks into every scene    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. SCENE-BY-SCENE VIDEO GENERATION (POST /api/video/generate-scene)      │
│    Background worker renders individual H.264 MP4 clips per scene using  │
│    configured provider (Priority 3 FFmpeg Cinema / Priority 2 Veo API)   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. MULTI-TRACK VIDEO EDITOR, COLOUR GRADING & BEAT SYNC                  │
│    Reorder scenes, trim timings, snap cuts to beats, grade film colour,  │
│    and toggle Clean Video (No Lyrics) or Karaoke/Subtitle overlays       │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. MASTER MP4 COMPILATION & CLOUD EXPORT (POST /api/video/render-master) │
│    FFmpeg concatenates scene clips, mixes master audio track, applies    │
│    grading/resolution/FPS/bitrate -> Download .MP4 or Save to Drive      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. System Architecture & Tech Stack

| Layer | Technology | Role in Application |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite 8 | Reactive SPA studio shell, workspaces, and state management |
| **Styling & Design** | Tailwind CSS v4 + Lucide Icons | Deep-obsidian dark cinema UI, responsive desktop & mobile layouts |
| **Real-Time Preview** | HTML5 2D Canvas (`CanvasCinemaPlayer`) | 60fps audio-reactive scene preview, live colour grading & subtitle renderer |
| **Backend Server** | Node.js + Express 4 (`server.ts`) | REST API routes, background job queue, static media serving & Vite middleware |
| **AI Intelligence** | `@google/genai` (Google Gemini SDK) | Storyboard generation, 13-field prompt enhancement, image & voice generation |
| **Video & Audio DSP** | System `ffmpeg` & `ffprobe` | Audio metadata/BPM extraction, procedural scene MP4 synthesis & master MP4 muxing |
| **Authentication & DB** | Firebase Auth + Cloud Firestore | Google Sign-In, user profiles, and cloud project synchronization |
| **Cloud File Sync** | Google Drive REST API v3 | Client-authorized Drive file browsing, audio/project import, and MP4/JSON backup |
| **Local Persistence** | JSON Disk DB (`storage/studio-db.json`) | Zero-config local persistence for projects, tracks, characters, jobs, and exports |

---

## 5. Complete Folder & File Structure

```text
.
├── server.ts                                      # Express backend server, DSP audio analyzer, Gemini API routes & FFmpeg worker
├── package.json                                   # NPM scripts, dependencies, and build configuration
├── tsconfig.json                                  # TypeScript compiler configuration
├── vite.config.ts                                 # Vite bundler configuration
├── index.html                                     # HTML entry point with Google Fonts (Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono)
├── firebase-applet-config.json                    # Firebase project & OAuth client configuration
├── firestore.rules                                # Firestore security rules for user & project isolation
├── .env.example                                   # Template for environment variables
├── README.md                                      # Complete technical & user documentation (this file)
├── INSTALLATION.md                                # Beginner-friendly step-by-step OS installation guide
├── storage/                                       # Auto-created persistent server storage directory
│   ├── studio-db.json                             # Local JSON database (projects, tracks, characters, jobs, telemetry)
│   ├── uploads/                                   # Uploaded user MP3/WAV audio files & synthesized TTS WAVs
│   ├── renders/                                   # Individual rendered scene MP4 clips
│   └── exports/                                   # Final compiled full-length master MP4 music videos
└── src/
    ├── main.tsx                                   # React DOM root mount
    ├── index.css                                  # Tailwind CSS v4 import and custom studio scrollbar/font styles
    ├── App.tsx                                    # Main studio shell, desktop sidebar, mobile bottom nav, auth & state sync
    ├── firebase.ts                                # Firebase Auth, Firestore & Google Drive OAuth scope/token manager
    ├── types/
    │   └── studio.ts                              # Complete TypeScript interfaces for projects, prompts, scenes, grading & jobs
    ├── data/
    │   └── seedStudioData.ts                      # Initial empty production project factory, default characters & Sandbox demo data
    ├── utils/
    │   ├── studioEngine.ts                        # Pure logic: storyboard builder, 13-field prompt compiler, beat-grid snapper, SRT builder
    │   └── studioEngine.test.ts                   # Automated unit tests using Node's built-in test runner (node:test)
    └── components/
        ├── CreateVideoWorkspace.tsx               # Step-by-step audio upload, DSP analysis, style picker & storyboard trigger
        ├── PromptStudioWorkspace.tsx              # Dedicated 13-field AI Prompt Studio with multi-select tags, favorites & history
        ├── StoryboardWorkspace.tsx                # Visual scene cards, Director's Cut editor, symbolism toggle & batch clip renderer
        ├── VideoEditorWorkspace.tsx               # Multi-track timeline (V1, V2, A1, T1) + 5-tab Inspector (Scene, Lyrics, Colour, Beats, Export)
        ├── CanvasCinemaPlayer.tsx                 # 60fps HTML5 Canvas monitor with colour grading, bokeh, film grain & Clean Video mode
        ├── CharacterStudioWorkspace.tsx           # Character wardrobe/hair/expression locks, turnaround sheet & cast prompt injector
        ├── GoogleDriveWorkspace.tsx               # Google Drive file browser, audio/project importer & confirmed cloud backup
        ├── DirectorsCutControlBar.tsx             # Quick camera/movement/transition/timing bar for individual scenes
        ├── LyricSymbolismStudioModal.tsx          # Modal for inspecting and editing literal vs. metaphorical lyric symbolism
        ├── MusicAndToolsWorkspace.tsx             # Music library manager, AI lyric generator, voiceover synthesizer & audio tools
        └── SubscriptionAndAdminWorkspace.tsx      # 3-Tier provider priority controls, honest Flow disclosure & background job monitor
```

---

## 6. System Requirements & Prerequisites

Before installing the project on your computer or server, ensure you have:

1. **Node.js**: Version **20.x LTS** or **22.x LTS** (includes `npm`).
   - Verify with: `node -v` and `npm -v`
2. **FFmpeg & FFprobe**: Required for real audio duration/BPM analysis and `.mp4` video rendering.
   - Verify with: `ffmpeg -version` and `ffprobe -version`
3. **Git**: For cloning and version control.
   - Verify with: `git --version`
4. **Hardware**:
   - Minimum 4 GB RAM (8 GB+ recommended for 1080p/4K FFmpeg rendering).
   - At least 2 GB of free disk space for `storage/uploads/`, `storage/renders/`, and `storage/exports/`.

---

## 7. Environment Variables Setup (`.env`)

Create a `.env` file in the root directory of the project by copying `.env.example`:

```bash
cp .env.example .env
```

Add the following variables to your `.env` file:

```env
# Required for live Gemini AI Storyboard, Prompt Studio, Character Image & Voice generation
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Express + Vite server port (must be 3000 in AI Studio preview; configurable locally)
PORT=3000
```

> **Security Note**: Never commit your `.env` file or raw API keys to GitHub. All Gemini API calls execute strictly on the backend inside `server.ts`.

---

## 8. API Keys & Cloud Credentials Required

1. **`GEMINI_API_KEY` (Google AI Studio)**:
   - Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) and create a Gemini API key.
   - Paste it into `.env` as `GEMINI_API_KEY=...`.
   - **Offline Resilience**: Even if `GEMINI_API_KEY` is not set or quota is exhausted, `server.ts` includes deterministic fallbacks for storyboard generation, prompt compilation, SVG character portraits, and FFmpeg WAV voice synthesis so the app never crashes.
2. **Firebase & Google OAuth Configuration (`firebase-applet-config.json`)**:
   - Pre-configured in `firebase-applet-config.json` at the root of the project for client-side Firebase Authentication, Firestore, and Google Drive OAuth scopes.

---

## 9. Firebase Authentication, Firestore & Google Drive OAuth Setup

Authentication and Google Drive integration are implemented in `src/firebase.ts` and `src/components/GoogleDriveWorkspace.tsx`:

1. **Google Sign-In**:
   - Uses Firebase `signInWithPopup(auth, googleProvider)`.
   - Styled with the official 4-color Google Material button (`OfficialGoogleSignInButton`).
2. **Configured Google Drive OAuth Scopes (`SCOPES` in `src/firebase.ts`)**:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.metadata`
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
   - `https://www.googleapis.com/auth/drive.appdata`
   - `https://www.googleapis.com/auth/drive.activity`
   - `https://www.googleapis.com/auth/drive.activity.readonly`
   - `https://www.googleapis.com/auth/drive.apps.readonly`
   - `https://www.googleapis.com/auth/drive.install`
   - `https://www.googleapis.com/auth/drive.meet.readonly`
   - `https://www.googleapis.com/auth/drive.photos.readonly`
   - `https://www.googleapis.com/auth/drive.scripts`
3. **In-Memory Token Security**:
   - The OAuth `accessToken` is cached strictly in memory (`cachedAccessToken`) inside `src/firebase.ts`—never written to `localStorage` or `sessionStorage`—and cleared immediately on `signOut`.

---

## 10. Google Gemini AI Setup (`@google/genai`)

Inside `server.ts`, the official `@google/genai` SDK powers four AI studio endpoints:

1. **`POST /api/ai/analyze-lyrics` (`gemini-3-flash-preview`)**:
   - Analyzes your song's lyrics, detected audio sections, BPM, and selected director style to generate story-driven scene prompts and literal/metaphorical symbolism.
2. **`POST /api/ai/prompt-studio-generate` (`gemini-3-flash-preview`)**:
   - Takes your selected Visual Styles, Camera Controls, Lighting, Environment, Mood, and active Character Studio cast to auto-populate all 13 cinema director fields and compile a master scene prompt.
3. **`POST /api/ai/generate-image` (`gemini-3.1-flash-image-preview`)**:
   - Generates character reference portraits and turnaround visuals for the Character Studio.
4. **`POST /api/ai/generate-voice` (`gemini-3.8-flash-lite-tts` + FFmpeg WAV Fallback)**:
   - Synthesizes studio vocal narration cues and automatically falls back to FFmpeg spoken-cadence WAV synthesis (`tts_studio_*.wav`) if TTS quota or schema is unavailable.

---

## 11. 3-Tier Video Generation Engine & Google Flow / Veo Architecture

The studio implements a transparent, configurable **3-Tier Video Provider Architecture** (manageable in the **Subscription & Flow** and **Admin Panel** tabs):

| Priority | Provider Name | How It Works & Billing Transparency |
| :--- | :--- | :--- |
| **Priority 1** | **Google Flow / AI Pro Subscription** | Connects your Google identity for workspace verification. **Important Technical Disclosure**: Google does not currently provide a public OAuth REST API that allows third-party web apps to spend consumer Google AI Pro / Flow web subscription credits. The app never scrapes cookies or fakes Flow credit deduction. |
| **Priority 2** | **Google Veo Video API (`veo-3.1-fast-generate-preview`)** | Official paid Gemini/Veo video generation API. Disabled by default so you never incur unexpected cloud billing; can be explicitly enabled in Admin/Subscription settings when a paid API key is configured. |
| **Priority 3 (Default)** | **Procedural Cinema FFmpeg Engine** | Always-on server-side FFmpeg + filtergraph synthesizer (`renderProceduralSceneClipWithFfmpeg` in `server.ts`). Generates real playable H.264 `.mp4` video clips per scene and compiles full-length master `.mp4` videos at zero external API cost. |

---

## 12. FFmpeg & FFprobe Media Processing Setup

`server.ts` invokes system `ffmpeg` and `ffprobe` binaries for three critical workflows:
1. **Audio Inspection (`analyzeAudioFileWithFfmpeg`)**: Extracts exact duration, sample rate, channels, bitrate, and PCM RMS energy windows.
2. **Per-Scene Video Clip Rendering (`renderProceduralSceneClipWithFfmpeg`)**: Synthesizes an H.264 `.mp4` video clip (`libx264`, `yuv420p`) matching the scene's exact duration, resolution, aspect ratio (`16:9`, `9:16`, `1:1`, `4:5`), colour palette, animated grid/vignette, and optional lyric caption.
3. **Full-Length Master MP4 Render (`processBackgroundJob` -> `master_mp4_render`)**: Concatenates all scene clips, mixes the uploaded master audio track (`aac` at `128k`, `192k`, or `320k`), applies custom frame rate (`24`, `30`, or `60` fps), respects **Clean Video Mode (without lyrics)**, and outputs a downloadable `.mp4` in `storage/exports/`.

---

## 13. Database & Storage Architecture (Project Isolation)

- **Local Persistent Database (`storage/studio-db.json`)**:
  - Automatically initialized and saved atomically on every project update, audio upload, character save, or render job completion.
- **Strict Production vs. Demo Isolation**:
  - Production projects (`isDemoProject: false`) and Development Demo Sandbox projects (`isDemoProject: true`) are filtered separately in `/api/bootstrap?demoMode=false|true`.
  - Creating a new project always initializes an empty, isolated record with `durationSec: 0`, `scenes: []`, and `No Song Uploaded`.

---

## 14. Step-by-Step Local Development Setup

```bash
# 1. Clone the repository
git clone <your-repo-url> ai-music-video-studio
cd ai-music-video-studio

# 2. Install all dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_api_key

# 4. Run the unit tests to verify the core engine
npx --yes tsx --test src/utils/studioEngine.test.ts

# 5. Start the full-stack development server (Frontend + Express + FFmpeg worker)
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 15. Windows Installation Guide (Windows 10 / 11)

1. **Install Node.js LTS**:
   - Download the Windows `.msi` installer (v20 or v22 LTS) from [https://nodejs.org](https://nodejs.org) and complete the setup.
2. **Install FFmpeg**:
   - Open **PowerShell** as Administrator and run:
     ```powershell
     winget install Gyan.FFmpeg
     ```
   - Close and reopen PowerShell, then verify:
     ```powershell
     node -v
     npm -v
     ffmpeg -version
     ```
3. **Install & Run the Studio**:
   ```powershell
   git clone <your-repo-url> ai-music-video-studio
   cd ai-music-video-studio
   npm install
   copy .env.example .env
   notepad .env
   npm run dev
   ```
4. Open **http://localhost:3000** in Chrome or Edge.

---

## 16. Linux Installation Guide (Ubuntu / Debian / Fedora)

```bash
# 1. Update packages and install FFmpeg, curl, git, and build tools
sudo apt update
sudo apt install -y ffmpeg curl git build-essential

# 2. Install Node.js 22 LTS (if not installed)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Verify versions
node -v && npm -v && ffmpeg -version

# 4. Clone, install packages, and start the server
git clone <your-repo-url> ai-music-video-studio
cd ai-music-video-studio
npm install
cp .env.example .env
nano .env   # Add GEMINI_API_KEY
npm run dev
```

---

## 17. macOS Installation Guide (Apple Silicon & Intel)

```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node.js and FFmpeg
brew install node ffmpeg

# 3. Clone, install dependencies, and start
git clone <your-repo-url> ai-music-video-studio
cd ai-music-video-studio
npm install
cp .env.example .env
nano .env   # Add GEMINI_API_KEY
npm run dev
```

---

## 18. Android Installation & Mobile Studio Guide (Termux + Wi-Fi)

### Method A: Use Your Android Phone Connected to Your PC / Cloud Server (Recommended)
Because 1080p/4K FFmpeg video encoding is CPU-intensive, running the backend on your laptop/PC or cloud VM and opening the mobile studio in Chrome on Android gives instant touch editing:
1. Run `npm run dev` on your computer.
2. Find your computer's local Wi-Fi IP (`ipconfig` on Windows or `ifconfig` / `ip a` on Linux/macOS, e.g. `192.168.1.50`).
3. On your Android phone on the same Wi-Fi network, open `http://192.168.1.50:3000`.

### Method B: Run Directly on Android Inside Termux
1. Install **Termux** (from F-Droid) on your Android device.
2. Run the following commands inside Termux:
   ```bash
   pkg update && pkg upgrade -y
   pkg install -y nodejs-lts ffmpeg git
   git clone <your-repo-url> ai-music-video-studio
   cd ai-music-video-studio
   npm install
   cp .env.example .env
   nano .env
   npm run dev
   ```
3. Open Chrome on your Android phone and go to **http://localhost:3000**.

---

## 19. Running Frontend & Backend Together

This project uses a unified full-stack server (`server.ts`) that serves both the Express `/api/*` backend and the Vite React frontend on **Port 3000**. You only need **one terminal command**:

```bash
npm run dev
```

Available `package.json` scripts:
- `npm run dev` — Starts the full-stack Express + Vite + FFmpeg development server (`tsx server.ts`).
- `npm run build` — Builds the optimized production frontend bundle into `dist/` (`vite build`).
- `npm run start` — Runs the production server (`node server.ts`).
- `npm run lint` — Runs full TypeScript type verification (`tsc --noEmit`).
- `npm run clean` — Removes `dist/` build artifacts.

---

## 20. Building & Running in Production

```bash
# 1. Verify TypeScript types
npm run lint

# 2. Run unit tests
npx --yes tsx --test src/utils/studioEngine.test.ts

# 3. Build optimized frontend assets into /dist
npm run build

# 4. Start the server in production mode
NODE_ENV=production npm run start
```

---

## 21. Cloud Deployment Guide (Docker / Cloud Run / VPS)

To deploy on **Google Cloud Run**, **Render**, **Railway**, or any **Docker VPS**:

1. Ensure the container image includes `ffmpeg` (e.g., `apt-get update && apt-get install -y ffmpeg` in a `node:22-bookworm-slim` image).
2. Run `npm ci && npm run build`.
3. Configure environment variables: `NODE_ENV=production`, `PORT=3000`, `GEMINI_API_KEY=<your_key>`.
4. Mount a persistent volume at `/app/storage` (or use Google Drive Cloud Sync) if you want uploaded audio and rendered MP4 files to persist across container restarts.

---

## 22. Accessing the Studio on Mobile Phones Over Local Wi-Fi

The Express server in `server.ts` listens on `0.0.0.0:3000`, which automatically allows devices on your local network to connect:
- **Mobile UI Features**:
  - Fixed 5-button bottom navigation bar (`Home`, `Create`, `Prompts`, `Scenes`, `Editor`).
  - Hamburger menu button in the top bar for accessing `Character Studio`, `Music Library`, `AI Tools`, `Projects & Drive`, `Subscription & Flow`, and `Admin Panel`.
  - Touch-friendly timeline controls and full-screen video monitor toggle.

---

## 23. Detailed Guide: How to Upload Songs & Analyze Audio

1. Click **Create New Project** in the top bar (or open the **Create Video** tab).
2. Under **Step 1: Upload Master Audio Track**, select an `.mp3` or `.wav` file from your device (or click **Synthesize 30s Studio Demo Song** to generate a real `.wav` test file on the server).
3. Wait for the upload confirmation badge showing your exact **Filename**, **Duration (`MM:SS`)**, **Sample Rate**, **BPM**, and **Interactive Waveform**.
4. Enter or paste your song lyrics (optional—if left blank, the studio creates a purely instrumental story-driven visual arc).
5. Select one of the **12 Director Styles** (e.g., `Romantic music video`, `Cinematic Bollywood style`, `Dark Cinematic`, `Anime music video`, `Story-based music video`).
6. Click **Analyze Song & Generate Full-Length Storyboard**.

---

## 24. Detailed Guide: How to Use the Advanced AI Prompt Studio

1. Open the **Prompt Studio** (`Prompts` tab).
2. Select which scene you want to customize from the top scene selector bar.
3. Click any combination of multi-select tags across:
   - **Visual Style** (e.g., `Cinematic Realism` + `Bollywood Music Video`)
   - **Camera Controls** (e.g., `Close-up` + `Dolly In` + `Slow Motion`)
   - **Lighting** (e.g., `Blue Hour` + `Neon Lighting`)
   - **Environment** (e.g., `Rainy Street` + `Rooftop`)
   - **Mood** (e.g., `Emotional` + `Nostalgic`)
4. Click **Auto-Generate AI Prompt** to have Gemini automatically write rich descriptions across all **13 Director Prompt Fields**, or edit any of the 13 fields manually.
5. Click **Preview Scene Prompt** to inspect the compiled master prompt, **Save & Apply to Scene** to update the storyboard, or **Render Scene Clip Now** to immediately generate that scene's MP4 clip.
6. Mark your best prompts with the **Heart (Favorite)** icon to reuse them across other scenes from the **Prompt History & Favorites Library**.

---

## 25. Detailed Guide: How to Maintain Character Consistency Across Scenes

1. Open the **Character Studio** (`Cast` tab).
2. Create a new character or select an existing cast member.
3. Fill in the consistency locks:
   - **Name & Age** (e.g., `Aria Vance`, `24`)
   - **Physical Description** (facial structure, skin tone, eye color, build)
   - **Clothes / Wardrobe Lock** (exact outfit worn in every shot)
   - **Facial Expression & Hairstyle Lock**
4. Upload a reference image or click **Generate AI Portrait** to create a reference portrait and 3-angle turnaround sheet (`0° Front`, `90° Profile`, `180° Back`).
5. Toggle the character as **Active in Project**, then click **"Inject Active Cast Into All Scene Prompts"**. Every scene in your project will now include that character's locked identity and wardrobe.

---

## 26. Detailed Guide: How to Use Storyboard & Director's Cut Mode

1. Open the **Storyboard** (`Scenes` tab).
2. Each scene card displays its exact time range (`startTimeSec` – `endTimeSec`), song section badge (`Intro`, `Verse`, `Chorus`, `Bridge`, `Outro`), narrative arc beat, camera/lighting setup, and lyric symbolism motif.
3. Toggle **Director's Cut Mode** on any scene to adjust:
   - Camera Angle & Camera Movement
   - Scene Transition (`Cross Dissolve`, `Beat Flash Cut`, `Anamorphic Whip Pan`, `Dolly Zoom In`, `Glitch Sync`, `Fade to Black`)
   - Exact Scene Duration (automatically ripples adjacent scene timestamps so total song duration stays locked).
4. Click **Render Scene Clip** on an individual scene or **Render All Scene Clips** to batch-render H.264 `.mp4` clips for the entire storyboard.

---

## 27. Detailed Guide: How to Use the Multi-Track Video Editor, Colour Grading & Beat Sync

1. Open the **Video Editor** (`Editor` tab).
2. Use the **Cinema Monitor** on the left to play/pause your music video in real time, scrub the playhead, toggle Full-Screen mode, or capture a `.png` thumbnail frame.
3. On the **Multi-Track Timeline** at the bottom:
   - Drag and drop scene blocks on **Track V1** to reorder scenes.
   - Click any scene block to inspect and edit it in the right-hand **5-Tab Inspector**:
     - **`Scene` Tab**: Trim or extend duration (`2s`–`60s`), change transition, toggle per-scene lyrics, or regenerate the clip.
     - **`Lyrics` Tab**: Choose **Disable Lyrics Completely (Clean Video)**, **Selected Scenes Only**, **Karaoke Word-by-Word**, **Full Lyrics**, **Subtitles**, or **Minimal Captions**, and customize typography, colors, position, and speed.
     - **`Colour` Tab**: Grade your video with **Temperature**, **Contrast**, **Brightness**, **Saturation**, **Exposure**, **35mm Film Grain**, **Vignette**, **Lens Flare**, **Glow**, **Bokeh**, and **Fade-In/Out**.
     - **`Beats` Tab**: Enable **Auto Beat-Sync** and click **Snap All Cuts to Musical Beats** to align every scene cut with your song's BPM beat grid.

---

## 28. Detailed Guide: Exporting MP4 Videos, Clean Video Mode & Google Drive Sync

1. In the **Video Editor**, select the **`Export` Tab** (or click **Render Final Master MP4** in the Storyboard).
2. Configure your **Export Studio Settings**:
   - **Resolution**: `720p`, `1080p`, or `4K`
   - **Aspect Ratio**: `16:9` (YouTube/Widescreen), `9:16` (Reels/Shorts/TikTok), `1:1` (Square), or `4:5` (Social Portrait)
   - **Frame Rate**: `24 fps` (Cinema), `30 fps`, or `60 fps`
   - **Audio Bitrate**: `128k`, `192k`, or `320k` AAC
   - **Clean Video Mode Toggle**: Keep **"Clean Video Export (Without Lyrics)"** checked if you want pure cinematic visuals with zero burned-in text.
3. Click **Render & Export Master MP4**. Once complete, click **Download MP4** to save the `.mp4` file to your device, or open **Projects & Drive** to upload the `.mp4`, `.srt` subtitles, and `.json` project backup directly to your **Google Drive**.

---

## 29. Backend REST API Reference

| Method & Endpoint | Description |
| :--- | :--- |
| `GET /api/bootstrap?demoMode=false\|true` | Returns isolated projects, characters, tracks, background jobs, and provider settings |
| `POST /api/projects` | Creates a new empty, isolated music video project |
| `PUT /api/projects/:id` | Persists full project state (scenes, prompts, colour grading, lyrics settings, export config) |
| `DELETE /api/projects/:id` | Deletes a project from the server database |
| `POST /api/audio/upload` | Validates and saves uploaded `.mp3`/`.wav`, runs FFprobe/FFmpeg DSP analysis, and links to project |
| `POST /api/audio/analyze` | Re-analyzes an uploaded audio track for BPM, beat grid, energy curve, and song sections |
| `POST /api/audio/generate-studio-track` | Synthesizes a real playable `.wav` studio demo track via FFmpeg for instant testing |
| `POST /api/ai/analyze-lyrics` | Calls Gemini AI to generate story-driven scene prompts and literal/metaphorical symbolism |
| `POST /api/ai/prompt-studio-generate` | Calls Gemini AI to populate all 13 Prompt Studio director fields from selected tags |
| `POST /api/ai/generate-image` | Generates AI character portraits or scene concept art |
| `POST /api/ai/generate-voice` | Synthesizes vocal narration cues (Gemini TTS with automatic FFmpeg WAV fallback) |
| `POST /api/video/generate-scene` | Queues an asynchronous background job to render an individual scene `.mp4` clip |
| `POST /api/video/generate-all-scenes` | Queues background render jobs for all scenes in a project |
| `POST /api/video/render-master` | Compiles all scene clips + master audio + export settings into a downloadable `.mp4` |
| `GET /api/render/download/:filename` | Streams or downloads a rendered `.mp4` video with proper `Content-Disposition` headers |

---

## 30. Troubleshooting Common Errors & FAQ

### Troubleshooting
- **Error: `ffmpeg: command not found` during audio upload or MP4 export**
  - **Fix**: Install `ffmpeg` on your OS (`winget install Gyan.FFmpeg` on Windows, `brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Linux) and restart your terminal.
- **Google Sign-In / Google Drive popup closes immediately**
  - **Fix**: Ensure browser popups are allowed for `localhost:3000` or your deployed domain, and click the **Sign in with Google** button in the top bar or `Projects & Drive` tab.
- **Port 3000 is already in use (`EADDRINUSE`)**
  - **Fix**: Stop any other process using port 3000 (`npx kill-port 3000`) or run `npm run dev` after closing old terminal instances.

### Frequently Asked Questions (FAQ)
- **Q: Does this app force lyrics onto every scene of my video?**
  - **A**: No. **Clean Video Mode** is active by default so your music video plays like a real cinematic film without text covering the visuals. You can enable lyrics for specific scenes only, or turn on Karaoke/Subtitles at any time in the Video Editor.
- **Q: Will demo data ever mix into my real projects?**
  - **A**: Never. Every new project starts completely empty with its own unique `proj_*` ID. Development Demo Mode is strictly isolated behind the `Dev Demo Mode: ON/OFF` switch.
- **Q: Can I edit a single scene without regenerating the entire music video?**
  - **A**: Yes. In both **Prompt Studio**, **Storyboard**, and **Video Editor**, you can edit the prompt, duration, camera, or colour of any single scene and click **Regenerate Scene Clip** for that shot alone.
