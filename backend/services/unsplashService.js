const axios = require('axios');

class UnsplashService {
  constructor() {
    this.accessKey = (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    this.secretKey = (process.env.UNSPLASH_SECRET_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    this.baseUrl = 'https://api.unsplash.com';
    this.imageCache = new Map();
  }

  /**
   * Helper to map aspect ratio to Unsplash API orientation parameter
   */
  getOrientation(aspectRatio) {
    if (aspectRatio === '9:16') return 'portrait';
    if (aspectRatio === '1:1') return 'squarish';
    return 'landscape'; // Default to landscape for 16:9, 4:3
  }

  /**
   * Search photos on Unsplash
   * @param {string} query 
   * @param {number} limit 
   * @param {string} aspectRatio
   * @returns {Promise<Array<Object>>}
   */
  async searchImages(query, limit = 3, aspectRatio = '16:9') {
    if (!this.accessKey) {
      console.warn('[Unsplash] UNSPLASH_ACCESS_KEY is not set. Skipping Unsplash search.');
      return [];
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}`;
    if (this.imageCache.has(cacheKey)) {
      console.log(`[Unsplash] Image cache hit for query: "${query}"`);
      return this.imageCache.get(cacheKey);
    }

    const orientation = this.getOrientation(aspectRatio);

    try {
      console.log(`[Unsplash] Searching images for "${query}" with orientation "${orientation}"`);
      const response = await axios.get(`${this.baseUrl}/search/photos`, {
        headers: {
          Authorization: `Client-ID ${this.accessKey}`
        },
        params: {
          query,
          per_page: limit,
          orientation
        },
        timeout: 8000
      });

      if (!response.data || !response.data.results) {
        return [];
      }

      const results = response.data.results.map(photo => ({
        id: `unsplash-img-${photo.id}`,
        source: 'unsplash',
        type: 'image',
        url: photo.urls.regular,
        title: `${query.replace(/\s+/g, '_')}_${photo.id}`,
        extension: 'jpg',
        width: photo.width,
        height: photo.height
      }));

      this.imageCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`[Unsplash] Error searching images for "${query}":`, error.message);
      return [];
    }
  }
}

module.exports = new UnsplashService();
