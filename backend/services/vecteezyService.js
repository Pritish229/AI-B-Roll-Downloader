const axios = require('axios');

class VecteezyService {
  constructor() {
    this.apiKey = (process.env.VECTEEZY_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    this.accountId = (process.env.VECTEEZY_ACCOUNT_ID || '1').trim().replace(/^['"]|['"]$/g, '');
    this.baseUrl = 'https://api.vecteezy.com';
    this.imageCache = new Map();
  }

  /**
   * Helper to map aspect ratio to Vecteezy API orientation parameter
   */
  getOrientation(aspectRatio) {
    if (aspectRatio === '9:16') return 'vertical';
    if (aspectRatio === '1:1') return 'square';
    return 'horizontal'; // Default to horizontal for landscape
  }

  /**
   * Search photos on Vecteezy
   * @param {string} query 
   * @param {number} limit 
   * @param {string} aspectRatio
   * @returns {Promise<Array<Object>>}
   */
  async searchImages(query, limit = 3, aspectRatio = '16:9') {
    if (!this.apiKey) {
      console.warn('[Vecteezy] VECTEEZY_API_KEY is not set. Skipping Vecteezy search.');
      return [];
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}`;
    if (this.imageCache.has(cacheKey)) {
      console.log(`[Vecteezy] Cache hit for query: "${query}"`);
      return this.imageCache.get(cacheKey);
    }

    const orientation = this.getOrientation(aspectRatio);

    try {
      console.log(`[Vecteezy] Searching images for "${query}" with orientation "${orientation}"`);
      const response = await axios.get(`${this.baseUrl}/v2/${this.accountId}/resources`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        params: {
          term: query,
          content_type: 'photo',
          page: 1,
          per_page: limit,
          orientation
        },
        timeout: 8000
      });

      if (!response.data || !response.data.resources) {
        return [];
      }

      const results = response.data.resources.map(photo => ({
        id: `vecteezy-img-${photo.id}`,
        source: 'vecteezy',
        type: 'image',
        url: photo.preview_url || photo.thumbnail_url,
        title: `${query.replace(/\s+/g, '_')}_${photo.id}`,
        extension: 'jpg',
        width: photo.preview_dimensions?.width || 1200,
        height: photo.preview_dimensions?.height || 800
      }));

      this.imageCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`[Vecteezy] Error searching images for "${query}":`, error.message);
      return [];
    }
  }
}

module.exports = new VecteezyService();
