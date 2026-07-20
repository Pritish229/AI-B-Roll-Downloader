const path = require('path');
const os = require('os');
const fs = require('fs-extra');

class StorageService {
  constructor() {
    this._isReadOnly = null;
  }

  /**
   * Determine whether current backend environment is read-only (e.g. Vercel, AWS Lambda, Serverless)
   */
  isReadOnly() {
    if (this._isReadOnly !== null) {
      return this._isReadOnly;
    }

    if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.NOW_REGION || process.env.TMP_STORAGE) {
      this._isReadOnly = true;
      return true;
    }

    try {
      const testDir = path.join(__dirname, '..', 'temp');
      fs.ensureDirSync(testDir);
      const testFile = path.join(testDir, `.write_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.removeSync(testFile);
      this._isReadOnly = false;
    } catch (err) {
      console.warn('[StorageService] Backend directory is read-only. Falling back to OS temp storage.');
      this._isReadOnly = true;
    }

    return this._isReadOnly;
  }

  /**
   * Get safe, writable path for storage category (uploads, downloads, temp, config)
   * @param {...string} subPaths 
   * @returns {string}
   */
  getPath(...subPaths) {
    if (this.isReadOnly()) {
      return path.join(os.tmpdir(), 'ai-broll-downloader', ...subPaths);
    }
    return path.join(__dirname, '..', ...subPaths);
  }

  /**
   * Safely convert raw File buffer into a clean string handling UTF-8, UTF-16LE, and UTF-16BE BOMs
   * @param {Buffer|string} buffer 
   * @returns {string}
   */
  bufferToString(buffer) {
    if (typeof buffer === 'string') return buffer;
    if (!buffer || !Buffer.isBuffer(buffer)) return String(buffer || '');

    // Detect UTF-16 LE BOM (0xFF 0xFE)
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return buffer.toString('utf16le');
    }
    // Detect UTF-16 BE BOM (0xFE 0xFF)
    if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
      const swapped = Buffer.from(buffer);
      swapped.swap16();
      return swapped.toString('utf16le');
    }
    return buffer.toString('utf-8');
  }
}

module.exports = new StorageService();
