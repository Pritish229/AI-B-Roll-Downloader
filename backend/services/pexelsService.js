const axios = require('axios');

class PexelsService {
  constructor() {
    this.apiKey = (process.env.PEXELS_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    this.baseUrl = 'https://api.pexels.com';
    this.videoCache = new Map();
    this.imageCache = new Map();
  }

  async getWithRetry(url, config, retries = 2, delay = 1500) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await axios.get(url, config);
      } catch (error) {
        if (error.response?.status === 429 && i < retries) {
          console.warn(`[Pexels] Rate limit 429 hit. Sleeping for ${delay}ms before retry ${i + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Search videos on Pexels
   * @param {string} query 
   * @param {number} limit 
   * @returns {Promise<Array<Object>>}
   */
  /**
   * Helper to enrich search query with chosen aesthetic video tone
   */
  enrichQueryWithTone(query, tone) {
    if (!tone || tone === 'none' || tone === 'standard') return query;
    const toneAdjectives = {
      cinematic: 'cinematic',
      modern: 'modern clean',
      warm: 'warm glow',
      dark: 'moody dark',
      vibrant: 'vibrant color'
    };

    let selectedTones = [];
    if (Array.isArray(tone)) {
      selectedTones = tone;
    } else if (typeof tone === 'string') {
      selectedTones = tone.split(',').map(t => t.trim());
    } else {
      selectedTones = [tone];
    }

    let enriched = query;
    for (const singleTone of selectedTones) {
      const adj = toneAdjectives[String(singleTone).toLowerCase()];
      if (adj && !enriched.toLowerCase().includes(adj.split(' ')[0])) {
        enriched = `${enriched} ${adj}`;
      }
    }
    return enriched;
  }

  /**
   * Helper to map aspect ratio to Pexels API orientation parameter
   */
  getOrientation(aspectRatio) {
    if (aspectRatio === '9:16') return 'portrait';
    if (aspectRatio === '1:1') return 'square';
    return 'landscape'; // Default to landscape for 16:9, 4:3
  }

  /**
   * Search videos on Pexels
   * @param {string} query 
   * @param {number} limit 
   * @param {string} aspectRatio
   * @param {string} videoTone
   * @returns {Promise<Array<Object>>}
   */
  async searchVideos(query, limit = 3, aspectRatio = '16:9', videoTone = 'cinematic') {
    if (!this.apiKey) {
      console.warn('PEXELS_API_KEY is not set. Using high-quality direct fallback stock videos.');
      return this.getFallbackVideos(query, limit);
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}_${videoTone}`;
    if (this.videoCache.has(cacheKey)) {
      console.log(`Pexels video cache hit for query: "${query}"`);
      return this.videoCache.get(cacheKey);
    }

    const enrichedQuery = this.enrichQueryWithTone(query, videoTone);
    const orientation = this.getOrientation(aspectRatio);

    try {
      console.log(`Searching Pexels videos for "${enrichedQuery}" with orientation "${orientation}"`);
      const response = await this.getWithRetry(`${this.baseUrl}/videos/search`, {
        headers: { Authorization: this.apiKey },
        params: {
          query: enrichedQuery,
          per_page: limit * 3, // Fetch slightly more to filter for custom aspect ratios
          orientation
        },
        timeout: 8000
      });

      if (!response.data || !response.data.videos) {
        return [];
      }

      const results = [];
      for (const video of response.data.videos) {
        if (results.length >= limit) break;

        const videoFiles = video.video_files || [];
        
        // Find the best quality MP4 file matching aspect ratio constraints
        const matchingFile = videoFiles.find(f => {
          if (f.file_type !== 'video/mp4') return false;
          
          if (aspectRatio === '9:16') {
            return f.height > f.width;
          } else if (aspectRatio === '1:1') {
            return Math.abs(f.width - f.height) < (f.width * 0.2); // square within 20%
          } else {
            return f.width > f.height; // Landscape (16:9 or 4:3)
          }
        }) || videoFiles.find(f => f.file_type === 'video/mp4') || videoFiles[0];

        if (matchingFile && matchingFile.link) {
          results.push({
            id: `pexels-vid-${video.id}`,
            source: 'pexels',
            type: 'video',
            url: matchingFile.link,
            title: `${query.replace(/\s+/g, '_')}_${video.id}`,
            extension: 'mp4',
            width: video.width,
            height: video.height
          });
        }
      }

      this.videoCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching Pexels videos for "${query}":`, error.message);
      return this.getFallbackVideos(query, limit);
    }
  }

  /**
   * Search images on Pexels
   * @param {string} query 
   * @param {number} limit 
   * @param {string} aspectRatio
   * @param {string} videoTone
   * @returns {Promise<Array<Object>>}
   */
  async searchImages(query, limit = 3, aspectRatio = '16:9', videoTone = 'cinematic') {
    if (!this.apiKey) {
      console.warn('PEXELS_API_KEY is not set. Using high-quality direct fallback stock images.');
      return this.getFallbackImages(query, limit);
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}_${videoTone}`;
    if (this.imageCache.has(cacheKey)) {
      console.log(`Pexels image cache hit for query: "${query}"`);
      return this.imageCache.get(cacheKey);
    }

    const enrichedQuery = this.enrichQueryWithTone(query, videoTone);
    const orientation = this.getOrientation(aspectRatio);

    try {
      const response = await this.getWithRetry(`${this.baseUrl}/v1/search`, {
        headers: { Authorization: this.apiKey },
        params: {
          query: enrichedQuery,
          per_page: limit * 3,
          orientation
        },
        timeout: 8000
      });

      if (!response.data || !response.data.photos) {
        return [];
      }

      const results = [];
      for (const photo of response.data.photos) {
        if (results.length >= limit) break;

        // Verify orientation matches
        let isAspectMatch = false;
        if (aspectRatio === '9:16') {
          isAspectMatch = photo.height > photo.width;
        } else if (aspectRatio === '1:1') {
          isAspectMatch = Math.abs(photo.width - photo.height) < (photo.width * 0.2);
        } else {
          isAspectMatch = photo.width > photo.height;
        }

        if (isAspectMatch && photo.src && photo.src.large) {
          results.push({
            id: `pexels-img-${photo.id}`,
            source: 'pexels',
            type: 'image',
            url: photo.src.large,
            title: `${query.replace(/\s+/g, '_')}_${photo.id}`,
            extension: 'jpg',
            width: photo.width,
            height: photo.height
          });
        }
      }

      this.imageCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching Pexels images for "${query}":`, error.message);
      return this.getFallbackImages(query, limit);
    }
  }

  /**
   * Returns direct beautiful fallback MP4 stock URLs to avoid breaking app testing
   */
  getFallbackVideos(query, limit) {
    const defaultVids = [
      {
        id: 'pexels-fallback-vid-1',
        source: 'pexels-fallback',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-working-in-a-beautiful-office-43093-large.mp4',
        title: 'office_business_laptop',
        extension: 'mp4',
        width: 1920,
        height: 1080
      },
      {
        id: 'pexels-fallback-vid-2',
        source: 'pexels-fallback',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-in-an-office-42289-large.mp4',
        title: 'office_laptop_work',
        extension: 'mp4',
        width: 1920,
        height: 1080
      },
      {
        id: 'pexels-fallback-vid-3',
        source: 'pexels-fallback',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42293-large.mp4',
        title: 'woman_office_laptop',
        extension: 'mp4',
        width: 1920,
        height: 1080
      },
      {
        id: 'pexels-fallback-vid-4',
        source: 'pexels-fallback',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-businessman-typing-on-a-laptop-42301-large.mp4',
        title: 'typing_keyboard_close_up',
        extension: 'mp4',
        width: 1920,
        height: 1080
      }
    ];

    // Filter or cycle based on keyword matching
    const q = query.toLowerCase();
    let filtered = defaultVids.filter(v => 
      q.includes('work') || q.includes('office') || q.includes('laptop') || q.includes('typing') || q.includes('computer') || q.includes('business')
    );

    if (filtered.length === 0) {
      filtered = defaultVids;
    }

    return filtered.slice(0, limit);
  }

  /**
   * Returns beautiful direct fallback stock image URLs
   */
  getFallbackImages(query, limit) {
    const images = [
      {
        id: 'pexels-fallback-img-1',
        source: 'pexels-fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        title: 'laptop_on_desk',
        extension: 'jpg',
        width: 1200,
        height: 800
      },
      {
        id: 'pexels-fallback-img-2',
        source: 'pexels-fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80',
        title: 'typing_on_laptop_close_up',
        extension: 'jpg',
        width: 1200,
        height: 800
      },
      {
        id: 'pexels-fallback-img-3',
        source: 'pexels-fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
        title: 'office_collaboration_working',
        extension: 'jpg',
        width: 1200,
        height: 800
      },
      {
        id: 'pexels-fallback-img-4',
        source: 'pexels-fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        title: 'futuristic_technology_abstract',
        extension: 'jpg',
        width: 1200,
        height: 800
      }
    ];

    const q = query.toLowerCase();
    let filtered = images.filter(img => 
      q.includes('work') || q.includes('laptop') || q.includes('tech') || q.includes('office') || q.includes('computer')
    );

    if (filtered.length === 0) {
      filtered = images;
    }

    return filtered.slice(0, limit);
  }
}

module.exports = new PexelsService();
