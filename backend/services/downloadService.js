const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const PROGRESS_DIR = path.join(__dirname, '..', 'downloads', '.progress');

class DownloadService {
  constructor() {
    // In-memory progress registry (fast reads, persisted to disk for restart resilience)
    this.projectsProgress = {};

    // Ensure progress directory exists on startup
    fs.ensureDir(PROGRESS_DIR).catch(() => {});
  }

  // ─── PERSISTENCE HELPERS ────────────────────────────────────────────────────

  _progressFilePath(projectId) {
    return path.join(PROGRESS_DIR, `${projectId}.json`);
  }

  async _persistProgress(projectId) {
    try {
      await fs.writeJson(this._progressFilePath(projectId), this.projectsProgress[projectId], { spaces: 2 });
    } catch (e) {
      // Non-fatal — in-memory state is always authoritative during this session
    }
  }

  async _loadProgressFromDisk(projectId) {
    try {
      const filePath = this._progressFilePath(projectId);
      if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────────

  /**
   * Initialize progress tracking for a project
   * @param {string} projectId 
   * @param {number} totalAssets 
   */
  initProgress(projectId, totalAssets) {
    this.projectsProgress[projectId] = {
      status: 'searching',
      totalAssets,
      downloadedAssets: 0,
      currentAsset: 'Searching stock assets...',
      progressPercent: 0,
      errors: [],
      zipPath: ''
    };
    this._persistProgress(projectId);
  }

  getProgress(projectId) {
    // 1. Fast in-memory lookup
    if (this.projectsProgress[projectId]) {
      return this.projectsProgress[projectId];
    }

    // 2. Try loading authoritative progress from disk file
    try {
      const filePath = this._progressFilePath(projectId);
      if (fs.existsSync(filePath)) {
        const diskData = fs.readJsonSync(filePath);
        if (diskData) {
          console.log(`[DownloadService] Restored progress state from disk for ${projectId}.`);
          this.projectsProgress[projectId] = diskData;
          return diskData;
        }
      }
    } catch (e) {
      console.warn(`[DownloadService] Failed to read progress JSON from disk for ${projectId}:`, e.message);
    }

    // 3. Check if zip exists already (nodemon restart happened mid-job and progress file missing)
    const zipPath = path.join(__dirname, '..', 'downloads', `${projectId}.zip`);
    const zipExists = fs.existsSync(zipPath);

    if (zipExists) {
      // ZIP exists — the job completed before the restart. Restore a completed state.
      console.log(`[DownloadService] ZIP found on disk for ${projectId}. Restoring completed state.`);
      const restored = {
        status: 'completed',
        totalAssets: 0,
        downloadedAssets: 0,
        currentAsset: 'Project generated successfully! (restored after server restart)',
        progressPercent: 100,
        errors: [],
        zipPath: `/api/download/${projectId}`
      };
      this.projectsProgress[projectId] = restored;
      return restored;
    }

    // 3. Not in memory, no ZIP — genuine not-found
    return {
      status: 'idle',
      totalAssets: 0,
      downloadedAssets: 0,
      currentAsset: 'Session expired. Please restart the download.',
      progressPercent: 0,
      errors: [],
      zipPath: ''
    };
  }

  /**
   * Update progress state and persist to disk
   * @param {string} projectId 
   * @param {Object} updates 
   */
  updateProgress(projectId, updates) {
    if (!this.projectsProgress[projectId]) {
      this.projectsProgress[projectId] = {
        status: 'searching',
        totalAssets: 0,
        downloadedAssets: 0,
        currentAsset: '',
        progressPercent: 0,
        errors: [],
        zipPath: ''
      };
    }

    this.projectsProgress[projectId] = {
      ...this.projectsProgress[projectId],
      ...updates
    };

    // Auto-calculate percentage
    const progress = this.projectsProgress[projectId];
    if (progress.totalAssets > 0) {
      progress.progressPercent = Math.min(
        100,
        Math.round((progress.downloadedAssets / progress.totalAssets) * 100)
      );
    }

    // Persist to disk (async, non-blocking)
    this._persistProgress(projectId);
  }

  /**
   * Download a file from a URL to a local destination
   * @param {string} fileUrl 
   * @param {string} destPath 
   * @param {number} retries 
   */
  async downloadFile(fileUrl, destPath, retries = 3) {
    await fs.ensureDir(path.dirname(destPath));

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios({
          method: 'GET',
          url: fileUrl,
          responseType: 'stream',
          timeout: 45000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(destPath);
          response.data.pipe(writer);

          let error = null;
          writer.on('error', err => {
            error = err;
            writer.close();
            reject(err);
          });

          writer.on('finish', () => {
            if (!error) {
              resolve(destPath);
            }
          });
        });
      } catch (err) {
        console.error(`Download attempt ${attempt} failed for ${fileUrl}:`, err.message);
        if (attempt === retries) {
          throw new Error(`Failed after ${retries} attempts. Original error: ${err.message}`);
        }
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  /**
   * Download multiple assets with controlled concurrency (default limit: 3)
   * @param {string} projectId 
   * @param {Array<Object>} assetsToDownload 
   * @param {string} baseDownloadDir 
   * @param {number} concurrencyLimit 
   */
  async downloadAssetsQueue(projectId, assetsToDownload, baseDownloadDir, concurrencyLimit = 3) {
    this.updateProgress(projectId, {
      status: 'downloading',
      totalAssets: assetsToDownload.length,
      downloadedAssets: 0
    });

    const queue = [...assetsToDownload];
    const results = [];

    const runNext = async () => {
      if (queue.length === 0) return;

      const item = queue.shift();
      const filename = `${item.title}.${item.extension}`;

      let typeFolder = 'images';
      if (item.type === 'video') typeFolder = 'videos';
      else if (item.type === 'gif') typeFolder = 'gifs';
      else if (item.type === 'shape') typeFolder = 'shapes';

      const localPath = path.join(baseDownloadDir, typeFolder, filename);
      const relativeLocalPath = `${typeFolder}/${filename}`;

      const typeEmoji = { video: '🎬', image: '🖼', gif: '🎞', shape: '🔷' }[item.type] || '📄';
      const typeLabel = { video: 'Video', image: 'Photo', gif: 'GIF', shape: 'Shape' }[item.type] || item.type;

      this.updateProgress(projectId, {
        currentAsset: `${typeEmoji} ${typeLabel}: ${filename} [${item.source}]`
      });

      try {
        await this.downloadFile(item.url, localPath);

        const currentProgress = this.getProgress(projectId);
        this.updateProgress(projectId, {
          downloadedAssets: currentProgress.downloadedAssets + 1
        });

        results.push({
          tag: item.tag,
          source: item.source,
          type: item.type,
          url: item.url,
          localPath: relativeLocalPath,
          status: 'success'
        });
      } catch (error) {
        console.error(`Queue item failed: ${filename}`, error.message);

        const currentProgress = this.getProgress(projectId);
        const errorsList = [...currentProgress.errors, `Failed: ${filename}`];

        this.updateProgress(projectId, {
          downloadedAssets: currentProgress.downloadedAssets + 1,
          errors: errorsList
        });

        results.push({
          tag: item.tag,
          source: item.source,
          type: item.type,
          url: item.url,
          localPath: '',
          status: 'failed',
          error: error.message
        });
      }

      await runNext();
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrencyLimit, assetsToDownload.length); i++) {
      workers.push(runNext());
    }

    await Promise.all(workers);
    return results;
  }
}

module.exports = new DownloadService();
