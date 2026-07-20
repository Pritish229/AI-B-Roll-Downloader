const fs = require('fs-extra');
const path = require('path');

class MetadataService {
  /**
   * Generates and writes the metadata.json file for a project
   * @param {string} destDir Base project download directory
   * @param {Array<Object>} downloadedAssets List of downloaded assets and their sources
   * @returns {Promise<string>} Path to written metadata.json
   */
  async saveMetadata(destDir, downloadedAssets) {
    const metadataPath = path.join(destDir, 'metadata', 'metadata.json');
    await fs.ensureDir(path.dirname(metadataPath));

    // Map to the requested schema
    const formattedMetadata = downloadedAssets
      .filter(asset => asset.status === 'success')
      .map(asset => ({
        tag: asset.tag,
        source: asset.source,
        type: asset.type,
        url: asset.url,
        localPath: asset.localPath
      }));

    const wrapper = {
      projectGeneratedAt: new Date().toISOString(),
      totalAssetsDownloaded: formattedMetadata.length,
      assets: formattedMetadata
    };

    await fs.writeJson(metadataPath, wrapper, { spaces: 2 });
    return metadataPath;
  }
}

module.exports = new MetadataService();
