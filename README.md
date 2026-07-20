# AI B-Roll Downloader 🎬

AI B-Roll Downloader is a production-grade full-stack web application designed for video creators, editors, and automation engineers. It ingests standard `.srt` subtitle files, parses their timeline intervals, extracts contextual keywords using Natural Language Processing (NLP), and queries stock media repositories (Pexels & Pixabay) to compile a fully-packaged, downloadable B-roll assets bundle in `.zip` format.

---

## 🚀 Key Features

* **Resilient SRT Parsing:** Automatically parses SRT tracks into structured JSON timeline segments.
* **Cinematic Tag Extraction:** Utilizes `compromise` POS tagging and `keyword-extractor` to intelligently extract nouns, locations, actions, emotions, objects, and cinematic multi-word phrases.
* **Granular Timeline Editor:** A CapCut/Premiere Pro inspired dark timeline to search, enable/disable, add, delete, or refine timings and texts of individual tracks.
* **Asset Confirmation Control:** Interactive tag confirming system with tag reordering, inline tag edits, and additions.
* **Resilient Parallel Downloader:** Executes downloads in a background concurrent queue (limited to 3 parallel downloads to respect API rate limits) with automatic network retry mechanisms.
* **Structured ZIP Bundling:** Compresses media into a strict folder structure:
  * `videos/` (HD landscape MP4s)
  * `images/` (Photos)
  * `gifs/` (Animated loops)
  * `shapes/` (Transparent PNG overlays/arrows)
  * `metadata/` (Detailed source asset listing in `metadata.json`)
  * `original-script/` (Original subtitle SRT file)
* **Single-Command Start:** Zero friction startup starting both Express server and Vite frontend concurrently.

---

## 🛠 Tech Stack

### Backend
* **Node.js** (Runtime environment)
* **Express.js** (REST API)
* **Multer** (Buffer parsing for SRT uploads)
* **Archiver** (Direct ZIP stream compression)
* **Compromise & Keyword-Extractor** (NLP parser engine)
* **fs-extra** (Robust disk operations)
* **Axios** (Stock API requests and streaming file downloads)

### Frontend
* **Vue 3** (Composition API)
* **Vite** (Optimized bundler and proxy dev server)
* **Tailwind CSS** (obsidian/violet cinematic glassmorphic custom theme)
* **Pinia** (State registry)
* **Vue Router** (View orchestration with route protection guards)

---

## 📂 Folder Structure

```text
ai-b-roll-downloader/
├── backend/
│   ├── controllers/
│   │   └── projectController.js
│   ├── routes/
│   │   └── api.js
│   ├── services/
│   │   ├── srtParserService.js
│   │   ├── tagGeneratorService.js
│   │   ├── pexelsService.js
│   │   ├── pixabayService.js
│   │   ├── downloadService.js
│   │   ├── metadataService.js
│   │   └── zipService.js
│   ├── uploads/          # User-uploaded SRT temp files
│   ├── downloads/        # Downloaded asset directories and ZIPs
│   ├── index.js          # Express entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── UploadPage.vue
│   │   │   ├── ScriptEditorPage.vue
│   │   │   ├── TagsPage.vue
│   │   │   └── DownloadPage.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── stores/
│   │   │   └── project.js
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json          # Orchestrator package.json
├── .gitignore
├── .env.example
└── README.md
```

---

## 🔧 Installation & Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v16+) and `npm` installed.

### Step 1: Clone the Repository and Install Dependencies
In the root directory, simply run:
```bash
npm install
```
*This will automatically install packages in the root, and immediately trigger the `postinstall` script to set up both the `/frontend` and `/backend` modules.*

### Step 2: Configure Environment Keys
Create a `.env` file in the `backend/` directory (or fill in the template at the root `.env.example`):
```env
PORT=5005
PEXELS_API_KEY=your_pexels_api_key_here
PIXABAY_API_KEY=your_pixabay_api_key_here
```

> [!NOTE]
> If you don't have stock media API keys, the application is built with a **robust self-healing stock simulator**. It will automatically fallback to served high-quality landscape B-roll footage (Mixkit creative commons videos and beautiful Unsplash images) so you can test the entire pipeline end-to-end without needing keys!

### Step 3: Run the Application
Start both the client and server concurrently using a single command in the root folder:
```bash
npm run dev
```

* **Frontend:** Serves on [http://localhost:3000](http://localhost:3000)
* **Backend API:** Serves on [http://localhost:5005](http://localhost:5005)

---

## ⚙️ REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/upload` | `POST` | Uploads a `.srt` subtitle file. Parses and stores it. |
| `/api/script/:projectId` | `GET` | Retrieves parsed subtitle timings. |
| `/api/tags/generate` | `POST` | Executes NLP extraction to generate stock keywords for script rows. |
| `/api/assets/download` | `POST` | Triggers background searches, downloads files in queues, and ZIPs them. |
| `/api/assets/progress/:projectId` | `GET` | Returns active progress percentage and logs of the download queue. |
| `/api/download/:projectId` | `GET` | Downloads the generated `.zip` project asset package. |

---

## 💎 Production Quality Standards
* **Rate-Limit Resilience:** Throttles concurrent downloads to prevent stock API ip bans.
* **Background Processing:** Triggers searches and downloads inside background promises, immediately returning standard JSON to the frontend to prevent gateway timeouts.
* **Self-Healing Failbacks:** In the absence of API credentials, serves real beautiful stock footage to keep the compiler fully executable.
* **Clean Memory Footprint:** Uses Streams to pipes assets directly to folders, and pipes the `archiver` file output directly to disk.
