# AI B-Roll Downloader 🎬

AI B-Roll Downloader is a premium cross-platform application designed for video creators, editors, and automation engineers. It converts dialogue scripts or standard `.srt` subtitle files into structured, production-ready B-roll stock asset packages downloadable as a `.zip` archive or directly saved to local native directories.

---

## 🚀 Key Features

* **Resilient Script & SRT Ingestion:** Parses SRT tracks into structured timeline cues or allows writing scripts manually with auto-transcription.
* **AI & Local NLP Keyword Extraction:** Uses Groq Llama-3.3/3.1 models and offline POS natural language processing (`compromise`) to generate visual search terms mapped to dialogue lines.
* **Custom User API Key Management:** Built-in UI settings modal (**⚙️ API Keys**) allowing users to replace system keys with their own API credentials. Includes direct 1-click links to official provider portals.
* **Granular Premiere-Style Timeline Editor:** Tabbed script editor with Cues timeline for inline timing edits, tag confirming, and visual story previews.
* **Multiple Aesthetic Tone Customization:** Select multiple aesthetic visual tones (Cinematic, Warm Golden Glow, Moody Dark, Modern Clean, Vibrant Color) simultaneously to enrich stock search queries.
* **Multi-Engine Stock Media Fallbacks:** Concurrent, rate-limited stock media searches across **Pexels**, **Pixabay**, **Unsplash**, and **Vecteezy V2**.
* **Native Cross-Platform Folder Downloader:** Supports picking custom local save directories natively on Windows & macOS (`osascript` & `FolderBrowserDialog`) and opening finished download folders in Explorer/Finder.
* **3-Minute Post-Compilation Auto-Expiry & Quick Delete:** Automatically purges project folders and ZIP packages after 3 minutes (or via instant **Quick Delete**) to protect data privacy and save disk space.
* **Native Desktop Application Mode:** Option to run as a standalone desktop application via 1-click Windows launchers (`start-desktop.bat` / `start-desktop.ps1`) or via Electron (`npm run desktop`).

---

## 🛠 Tech Stack

### Backend
* **Node.js** (Runtime environment)
* **Express.js** (REST API orchestrator)
* **Groq Llama 3.3 / 3.1 & Gemini API** (AI transcription, visual story generation & tag pools)
* **Multer** (Buffer parsing for SRT uploads)
* **ADM-ZIP** (Synchronous, in-memory zero-corruption archive compiler)
* **Compromise & Keyword-Extractor** (Offline NLP parser fallbacks)
* **Axios** (Pexels, Pixabay, Unsplash, Vecteezy V2 REST clients)

### Frontend
* **Vue 3** (Composition API)
* **Vite** (Optimized bundler & dev server)
* **Tailwind CSS** (Cinematic glassmorphism custom theme)
* **Pinia** (State & local storage persistence)
* **Vue Router** (View & stepper route orchestration)

### Desktop Application Wrappers
* **Electron** (Cross-platform desktop runner frame)
* **Edge & Chrome Standalone App Launcher** (1-click borderless desktop application window mode)

---

## 📂 Folder Structure

```text
ai-b-roll-downloader/
├── backend/
│   ├── config/
│   │   └── custom_keys.json       # User custom API keys storage
│   ├── controllers/
│   │   └── projectController.js   # Main API logic (transcribe, keys, cleanup, folder pickers)
│   ├── routes/
│   │   └── api.js                 # Express API endpoints
│   ├── services/
│   │   ├── keyService.js          # Dynamic API Key resolution manager
│   │   ├── aiService.js           # Groq Llama 3.3/3.1 story & tag orchestrator
│   │   ├── srtParserService.js    # SRT subtitle timeline parser
│   │   ├── tagGeneratorService.js # Local rule-based NLP tag fallback
│   │   ├── pexelsService.js       # Pexels API search client
│   │   ├── pixabayService.js      # Pixabay API search client
│   │   ├── unsplashService.js     # Unsplash photo API search client
│   │   ├── vecteezyService.js     # Vecteezy V2 graphic API search client
│   │   ├── downloadService.js     # Parallel asset downloader queue
│   │   ├── metadataService.js     # Structural metadata.json generator
│   │   └── zipService.js          # ADM-ZIP compiler
│   ├── uploads/                   # Temp SRT uploads
│   ├── downloads/                 # Active asset compile directories
│   ├── index.js                   # Node Express entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ApiKeyModal.vue    # Glassmorphism API Keys configuration modal
│   │   ├── pages/
│   │   │   ├── UploadPage.vue
│   │   │   ├── ScriptEditorPage.vue
│   │   │   ├── TagsPage.vue
│   │   │   ├── VideoSettingsPage.vue
│   │   │   └── DownloadPage.vue
│   │   ├── stores/
│   │   │   └── project.js         # Pinia state management
│   │   ├── App.vue                # Main layout with header stepper & API keys button
│   │   └── main.js
│   └── package.json
│
├── electron/
│   └── main.js                    # Electron desktop entry process
├── start-desktop.bat              # 1-Click Windows Batch Desktop Launcher
├── start-desktop.ps1              # 1-Click Windows PowerShell Desktop Launcher
├── project_architecture_and_changes.md # Complete technical architecture documentation
├── package.json                   # Workspace orchestrator package.json
└── README.md
```

---

## 🔧 Installation & Quick Start

### Prerequisites
* Windows or macOS
* [Node.js](https://nodejs.org) (v16+ installed). *Note: Running `start-desktop.bat` or `start-desktop.ps1` will automatically detect, download, and install Node.js v20 LTS if missing!*

### Step 1: Install Dependencies
Run in the project root directory:
```bash
npm install
```
*This installs root packages and automatically runs `postinstall` to install dependencies in `/frontend` and `/backend`.*

---

## 🔑 Custom API Keys Setup

The app includes built-in fallback keys, but you can enter your own custom API keys directly inside the web interface:

1. Click the **"⚙️ API Keys"** button in the top header.
2. Next to each provider, click **"🔗 Get API Key"** to create a free API key on the official developer sites:
   * **Groq AI (Llama 3.3/3.1):** [console.groq.com/keys](https://console.groq.com/keys)
   * **Pexels Stock API:** [pexels.com/api](https://www.pexels.com/api/)
   * **Pixabay Stock API:** [pixabay.com/api/docs](https://pixabay.com/api/docs/)
   * **Unsplash API:** [unsplash.com/developers](https://unsplash.com/developers)
   * **Vecteezy API:** [vecteezy.com/api](https://www.vecteezy.com/api)
   * **Google Gemini API:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   * **Pinterest API:** [developers.pinterest.com](https://developers.pinterest.com/)
3. Paste your key(s) into the input box and click **"Save & Apply Keys"**.

---

## 🖥 Running the Application

### Method 1: Web App Mode (Development Server)
```bash
npm run dev
```
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5005](http://localhost:5005)

### Method 2: 1-Click Native Desktop App (Windows)
Double-click `start-desktop.bat` in the root folder or execute in PowerShell:
```powershell
.\start-desktop.ps1
```
*Launches the application as a clean, borderless native desktop app window using Microsoft Edge or Google Chrome standalone app mode.*

### Method 3: Electron Desktop Runner
```bash
npm run desktop
```
*Spawns the Express backend process and opens a native Electron application frame.*

---

## ⚙️ REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/upload` | `POST` | Uploads `.srt` file and parses subtitle Cues. |
| `/api/transcribe` | `POST` | Transcribes raw script text into Cues via Groq Llama / local NLP. |
| `/api/story/generate` | `POST` | Generates a cinematic visual narrative from timeline Cues. |
| `/api/tags/generate` | `POST` | Extracts visual search tags for each line. |
| `/api/assets/download` | `POST` | Runs background asset search, queues downloads, and compiles ZIP/folder. |
| `/api/assets/progress/:projectId` | `GET` | Returns real-time percentage and current asset download progress. |
| `/api/download/:projectId` | `GET` | Downloads the generated `.zip` B-roll asset package. |
| `/api/cleanup/:projectId` | `POST` | Triggers immediate Quick Delete purge of project folders. |
| `/api/select-folder` | `POST` | Opens native macOS (`osascript`) or Windows folder browse dialog. |
| `/api/open-folder` | `POST` | Opens destination directory in Windows Explorer or macOS Finder. |
| `/api/config/keys` | `GET / POST` | Retrieves status or updates custom user API keys. |
| `/api/config/keys/reset` | `POST` | Resets all custom API keys back to system defaults. |

---

## 💎 Production Quality & Security
* **Rate-Limit Resilience:** Throttles concurrent downloads to respect stock API limits.
* **Auto-Purge Hygiene:** 3-minute automatic countdown timer purges compiled folders to free disk space and safeguard user scripts.
* **Dynamic Key Persistence:** User API keys are stored locally and sanitized across all dynamic API requests.

---

## 👨‍💻 Author & Connect

**Pritish Ranjan Dash**

* **GitHub:** [github.com/Pritish229](https://github.com/Pritish229)
* **LinkedIn:** [linkedin.com/in/pritish-ranjan-dash-91a2aa245](https://www.linkedin.com/in/pritish-ranjan-dash-91a2aa245/)
