# Step-by-Step Beginner Installation Guide (`INSTALLATION.md`)

Welcome! This guide walks you through installing and running **AI Music Video Studio** from scratch, even if you have never set up a Node.js + FFmpeg studio application before.

---

## Part 1: Windows (Windows 10 / Windows 11)

### Step 1: Install Node.js
1. Visit [https://nodejs.org](https://nodejs.org) and download the **LTS (Long Term Support)** installer (`.msi`).
2. Run the installer and keep all default options checked.
3. Open **PowerShell** or **Command Prompt** and verify:
   ```powershell
   node -v
   npm -v
   ```

### Step 2: Install FFmpeg (Required for MP4 Rendering)
1. In **PowerShell**, run:
   ```powershell
   winget install Gyan.FFmpeg
   ```
2. Close and reopen PowerShell, then verify FFmpeg is installed:
   ```powershell
   ffmpeg -version
   ```

### Step 3: Download the Project & Install Packages
1. Open PowerShell inside the project folder and run:
   ```powershell
   npm install
   ```

### Step 4: Configure Your `.env` File
1. Copy `.env.example` to a new file named `.env`:
   ```powershell
   copy .env.example .env
   ```
2. Open `.env` in Notepad and paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   PORT=3000
   ```

### Step 5: Start the Studio
```powershell
npm run dev
```
Open your browser to **http://localhost:3000**.

---

## Part 2: macOS (Apple Silicon M1/M2/M3/M4 & Intel)

### Step 1: Install Homebrew (if not already installed)
Open **Terminal** and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install Node.js and FFmpeg
```bash
brew install node ffmpeg
```
Verify both tools:
```bash
node -v
ffmpeg -version
```

### Step 3: Install Project Dependencies & Configure `.env`
```bash
npm install
cp .env.example .env
```
Edit `.env` to add your `GEMINI_API_KEY=...`.

### Step 4: Run the Application
```bash
npm run dev
```
Open **http://localhost:3000** in Safari or Chrome.

---

## Part 3: Linux (Ubuntu / Debian / Fedora)

### Step 1: Install Node.js 22 LTS and FFmpeg
On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y curl git ffmpeg build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Install Dependencies & Start the Server
```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```
Open **http://localhost:3000**.

---

## Part 4: Android Phones & Tablets

You can use **AI Music Video Studio** on Android in two ways:

### Option A: Connect to Your PC / Cloud Server Over Wi-Fi (Recommended for Fast MP4 Rendering)
Because full 1080p/4K FFmpeg video encoding is CPU-intensive, running the backend on your PC, Mac, or Cloud VM and opening the mobile-first studio interface on your Android phone gives the best performance:
1. Start the app on your computer with `npm run dev`.
2. Find your computer's local Wi-Fi IP address (for example `192.168.1.50`).
3. On your Android phone (connected to the same Wi-Fi), open Chrome and visit `http://192.168.1.50:3000`.
4. Use the dedicated mobile bottom navigation bar (`Home`, `Create`, `Prompts`, `Scenes`, `Editor`) to create and edit videos from your phone.

### Option B: Run Locally on Android Using Termux
If you want to run the Node.js + FFmpeg server directly on your Android device:
1. Install **Termux** from F-Droid.
2. Open Termux and update packages:
   ```bash
   pkg update && pkg upgrade -y
   pkg install -y nodejs-lts ffmpeg git
   ```
3. Clone or copy this repository into your Termux home folder:
   ```bash
   git clone <your-repo-url> ai-music-video-studio
   cd ai-music-video-studio
   npm install
   cp .env.example .env
   ```
4. Add your `GEMINI_API_KEY` to `.env` using `nano .env`, then start the server:
   ```bash
   npm run dev
   ```
5. Open Chrome on your Android device and go to **http://localhost:3000**.

---

## Verifying Everything Works

Run the built-in unit tests and TypeScript check at any time:
```bash
npx --yes tsx --test src/utils/studioEngine.test.ts
npm run lint
npm run build
```
