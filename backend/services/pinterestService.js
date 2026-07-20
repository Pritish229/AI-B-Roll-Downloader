const axios = require('axios');
const keyService = require('./keyService');

class PinterestService {
  constructor() {
    this.baseUrl = 'https://api.pinterest.com/v5';
    this.imageCache = new Map();
    this.isAvailable = null; // null = untested, true/false after first call
  }

  get accessToken() {
    return keyService.getKey('PINTEREST_API_KEY');
  }

  /**
   * Build standard auth headers
   */
  _headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generic GET with retry on 429
   */
  async getWithRetry(url, config, retries = 2, delay = 2000) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await axios.get(url, config);
      } catch (error) {
        const status = error.response?.status;

        if (status === 429 && i < retries) {
          console.warn(`[Pinterest] Rate limit hit. Sleeping ${delay}ms before retry ${i + 1}/${retries}...`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          continue;
        }

        // Mark as unavailable on auth failures so we skip future calls
        if (status === 401 || status === 403) {
          console.warn(`[Pinterest] Auth error (${status}). Disabling service for this session.`);
          this.isAvailable = false;
        }

        throw error;
      }
    }
  }

  /**
   * Extract the best available image URL from a Pinterest pin media object
   * Pinterest returns images in multiple resolutions under media.images
   */
  _extractImageUrl(pin) {
    try {
      // Pin media images structure: { "150x150": {...}, "400x300": {...}, "600x": {...}, "1200x": {...}, "originals": {...} }
      const images = pin?.media?.images || pin?.images || {};

      // Prefer highest resolution available
      const preferredKeys = ['originals', '1200x', '736x', '600x', '400x300', '474x', '236x', '150x150'];

      for (const key of preferredKeys) {
        if (images[key]?.url) {
          return images[key].url;
        }
      }

      // Fallback: grab first URL found in any image size
      for (const [, imgData] of Object.entries(images)) {
        if (imgData?.url) return imgData.url;
      }
    } catch (e) {
      // ignore parse errors
    }
    return null;
  }

  /**
   * Search Pinterest pins by keyword using the search endpoint
   * Falls back to board listing if search isn't available
   * @param {string} query
   * @param {number} limit
   * @param {string} aspectRatio
   * @returns {Promise<Array<Object>>}
   */
  async searchImages(query, limit = 3, aspectRatio = '16:9') {
    if (!this.accessToken) {
      console.warn('[Pinterest] No PINTEREST_API_KEY set. Skipping Pinterest search.');
      return [];
    }

    if (this.isAvailable === false) {
      return [];
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}`;
    if (this.imageCache.has(cacheKey)) {
      console.log(`[Pinterest] Cache hit for query: "${query}"`);
      return this.imageCache.get(cacheKey);
    }

    // Strategy 1: Try the official pin search endpoint (requires partner access)
    let results = await this._searchPins(query, limit, aspectRatio);

    // Strategy 2: If search fails or returns empty, try user's saved pins
    if (results.length === 0) {
      results = await this._getUserPins(query, limit, aspectRatio);
    }

    if (results.length > 0) {
      this.isAvailable = true;
      this.imageCache.set(cacheKey, results);
    }

    return results;
  }

  /**
   * Strategy 1: Official Pinterest pin search endpoint
   * Endpoint: GET /v5/search/pins?query=...&pin_filter=exclude_native
   */
  async _searchPins(query, limit, aspectRatio) {
    try {
      console.log(`[Pinterest] Searching pins for "${query}"...`);

      const response = await this.getWithRetry(`${this.baseUrl}/search/pins`, {
        headers: this._headers(),
        params: {
          query,
          page_size: Math.min(limit * 4, 25), // fetch extra for filtering
          pin_filter: 'exclude_native'
        },
        timeout: 10000
      });

      const pins = response?.data?.items || [];
      console.log(`[Pinterest] Search returned ${pins.length} pins for "${query}"`);

      return this._processPins(pins, query, limit, aspectRatio);
    } catch (error) {
      const status = error.response?.status;

      if (status === 403 || status === 401) {
        console.warn(`[Pinterest] Pin search not authorized (${status}). Trying user pins fallback...`);
      } else if (status === 404) {
        console.warn('[Pinterest] Search endpoint not found. Trying user pins fallback...');
      } else {
        console.error(`[Pinterest] Pin search error: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Strategy 2: Use GET /v5/pins to retrieve the authenticated user's saved pins
   * These are images the token owner has saved - still valid B-roll material
   */
  async _getUserPins(query, limit, aspectRatio) {
    try {
      console.log(`[Pinterest] Fetching user pins as fallback for "${query}"...`);

      const response = await this.getWithRetry(`${this.baseUrl}/pins`, {
        headers: this._headers(),
        params: {
          page_size: 25,
          pin_filter: 'exclude_native'
        },
        timeout: 10000
      });

      const pins = response?.data?.items || [];
      console.log(`[Pinterest] User pins returned ${pins.length} pins`);

      // Filter by query relevance (title/description keyword match)
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const scored = pins.map(pin => {
        const text = `${pin.title || ''} ${pin.description || ''}`.toLowerCase();
        const score = queryWords.filter(w => text.includes(w)).length;
        return { pin, score };
      });

      // Sort by relevance, but include all if no matches (user's pins are still valid assets)
      const sorted = scored.sort((a, b) => b.score - a.score);
      const topPins = sorted.slice(0, limit * 3).map(s => s.pin);

      return this._processPins(topPins, query, limit, aspectRatio);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        console.warn(`[Pinterest] User pins auth failed (${status}). Token may lack 'pins:read' scope.`);
        this.isAvailable = false;
      } else {
        console.error(`[Pinterest] User pins error: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Process raw pin objects into our standard asset format
   * @param {Array} pins
   * @param {string} query
   * @param {number} limit
   * @param {string} aspectRatio
   */
  _processPins(pins, query, limit, aspectRatio) {
    const results = [];

    for (const pin of pins) {
      if (results.length >= limit) break;

      const imageUrl = this._extractImageUrl(pin);
      if (!imageUrl) continue;

      // Pinterest media objects may include width/height
      const width = pin?.media?.images?.originals?.width
        || pin?.media?.images?.['1200x']?.width
        || 1000;
      const height = pin?.media?.images?.originals?.height
        || pin?.media?.images?.['1200x']?.height
        || 800;

      // Filter by orientation if we have dimensions
      if (width && height && width > 0 && height > 0) {
        let isAspectMatch = true;
        if (aspectRatio === '9:16') {
          isAspectMatch = height > width;
        } else if (aspectRatio === '1:1') {
          isAspectMatch = Math.abs(width - height) < (width * 0.3);
        } else {
          // For 16:9 or 4:3 landscape — accept both landscape and unknown orientation pins
          isAspectMatch = width >= height;
        }

        if (!isAspectMatch) continue;
      }

      // Determine extension from URL
      const urlPath = imageUrl.split('?')[0];
      const ext = urlPath.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';

      const pinId = pin.id || `unknown_${Date.now()}`;
      const safeTitle = (pin.title || query).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 50);

      results.push({
        id: `pinterest-img-${pinId}`,
        source: 'pinterest',
        type: 'image',
        url: imageUrl,
        title: `${query.replace(/\s+/g, '_')}_pinterest_${pinId}`,
        extension: safeExt,
        width,
        height,
        pinTitle: safeTitle,
        pinDescription: pin.description || ''
      });
    }

    console.log(`[Pinterest] Processed ${results.length} usable images from ${pins.length} pins for "${query}"`);
    return results;
  }

  /**
   * Test the token and log what scopes are active
   */
  async testConnection() {
    if (!this.accessToken) {
      return { success: false, message: 'No PINTEREST_API_KEY in environment.' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/user_account`, {
        headers: this._headers(),
        timeout: 8000
      });

      const user = response.data;
      console.log(`[Pinterest] ✓ Connected as: ${user.username || user.display_name || 'unknown'}`);
      this.isAvailable = true;
      return {
        success: true,
        username: user.username,
        displayName: user.display_name,
        accountType: user.account_type
      };
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;

      // Specific diagnosis for consumer app type restriction
      const isConsumerTypeError = msg && msg.toLowerCase().includes('consumer type');
      if (isConsumerTypeError) {
        const diagnosis = [
          'Pinterest API Error: Your app is registered as a "Consumer" type app.',
          'This restricts all API calls regardless of the access token.',
          'To fix: Go to https://developers.pinterest.com/apps/ → select your app → change App Type to "Standard" or "Partner".',
          'After upgrading, re-generate your access token and update PINTEREST_API_KEY in .env.'
        ].join(' ');
        console.error(`[Pinterest] ✗ ${diagnosis}`);
        this.isAvailable = false;
        return {
          success: false,
          status,
          message: msg,
          diagnosis,
          fix: 'Upgrade app type at https://developers.pinterest.com/apps/'
        };
      }

      console.error(`[Pinterest] ✗ Connection test failed (${status}): ${msg}`);
      this.isAvailable = false;
      return { success: false, status, message: msg };
    }
  }
}

module.exports = new PinterestService();
