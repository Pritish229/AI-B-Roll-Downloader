const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');

class ZipService {
  /**
   * Helper to recursively list all files in a directory.
   */
  async _getAllFiles(dir, baseDir = dir) {
    let results = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat && stat.isDirectory()) {
        const subFiles = await this._getAllFiles(filePath, baseDir);
        results = results.concat(subFiles);
      } else {
        const relativePath = path.relative(baseDir, filePath);
        // Avoid adding hidden/dot files (like the .progress folder or hidden system metadata)
        if (!file.startsWith('.')) {
          results.push({ absolutePath: filePath, relativePath });
        }
      }
    }
    return results;
  }

  /**
   * Zip a directory and save it as a zip file using adm-zip.
   * Supports real-time progress callbacks for individual files.
   * @param {string} sourceDir Directory to zip 
   * @param {string} outPath Output zip file path
   * @param {string} projectId Optional project identifier for logging
   * @param {function} onProgress Callback function(current, total, filename)
   * @returns {Promise<string>} Output zip file path
   */
  async createProjectZip(sourceDir, outPath, projectId = '', onProgress = null) {
    await fs.ensureDir(path.dirname(outPath));

    // Ensure the source directory exists
    if (!await fs.pathExists(sourceDir)) {
      throw new Error(`Source directory does not exist: ${sourceDir}`);
    }

    console.log(`[Adm-Zip] Analyzing files in ${sourceDir}...`);
    const files = await this._getAllFiles(sourceDir);
    const totalFiles = files.length;

    console.log(`[Adm-Zip] Compiling zip from ${sourceDir} to ${outPath} (${totalFiles} files)...`);
    
    const zip = new AdmZip();
    
    // Add all files one-by-one with progress reporting
    for (let i = 0; i < totalFiles; i++) {
      const fileInfo = files[i];
      const zipPath = path.dirname(fileInfo.relativePath);
      const cleanZipPath = zipPath === '.' ? '' : zipPath;
      
      // Add local file with correct sub-folder path inside the ZIP
      zip.addLocalFile(fileInfo.absolutePath, cleanZipPath);
      
      if (onProgress) {
        onProgress(i + 1, totalFiles, path.basename(fileInfo.relativePath));
      }
    }
    
    // Write synchronously to disk
    zip.writeZip(outPath);
    
    const stats = await fs.stat(outPath);
    console.log(`[Adm-Zip] Zip creation complete. Total size: ${stats.size} bytes`);
    
    return outPath;
  }
}

module.exports = new ZipService();
