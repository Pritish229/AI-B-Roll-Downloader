const axios = require('axios');
const keyService = require('./keyService');

class PixabayService {
  constructor() {
    this.baseUrl = 'https://pixabay.com/api';
    this.videoCache = new Map();
    this.imageCache = new Map();
    this.shapeCache = new Map();
  }

  get apiKey() {
    return keyService.getKey('PIXABAY_API_KEY');
  }

  async getWithRetry(url, config, retries = 2, delay = 1500) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await axios.get(url, config);
      } catch (error) {
        if (error.response?.status === 429 && i < retries) {
          console.warn(`[Pixabay] Rate limit 429 hit. Sleeping for ${delay}ms before retry ${i + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Search videos on Pixabay
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
   * Helper to map aspect ratio to Pixabay API orientation parameter
   */
  getOrientation(aspectRatio) {
    if (aspectRatio === '9:16') return 'vertical';
    if (aspectRatio === '1:1') return 'all';
    return 'horizontal'; // landscape
  }

  /**
   * Search videos on Pixabay
   * @param {string} query 
   * @param {number} limit 
   * @param {string} aspectRatio
   * @param {string} videoTone
   * @returns {Promise<Array<Object>>}
   */
  async searchVideos(query, limit = 3, aspectRatio = '16:9', videoTone = 'cinematic') {
    if (!this.apiKey) {
      console.warn('PIXABAY_API_KEY is not set. Using fallback videos.');
      return this.getFallbackVideos(query, limit);
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}_${videoTone}`;
    if (this.videoCache.has(cacheKey)) {
      console.log(`Pixabay video cache hit for query: "${query}"`);
      return this.videoCache.get(cacheKey);
    }

    const enrichedQuery = this.enrichQueryWithTone(query, videoTone);
    const orientation = this.getOrientation(aspectRatio);

    try {
      console.log(`Searching Pixabay videos for "${enrichedQuery}"`);
      const response = await this.getWithRetry(`${this.baseUrl}/videos/`, {
        params: {
          key: this.apiKey,
          q: enrichedQuery,
          per_page: limit * 3,
          safesearch: 'true'
        },
        timeout: 8000
      });

      if (!response.data || !response.data.hits) {
        return [];
      }

      const results = [];
      for (const hit of response.data.hits) {
        if (results.length >= limit) break;

        const videosObj = hit.videos || {};
        const bestVideo = videosObj.large || videosObj.medium || videosObj.small || videosObj.tiny;

        if (bestVideo && bestVideo.url) {
          // Filter orientation
          let isAspectMatch = false;
          if (aspectRatio === '9:16') {
            isAspectMatch = hit.height > hit.width;
          } else if (aspectRatio === '1:1') {
            isAspectMatch = Math.abs(hit.width - hit.height) < (hit.width * 0.2);
          } else {
            isAspectMatch = hit.width > hit.height;
          }

          if (isAspectMatch) {
            results.push({
              id: `pixabay-vid-${hit.id}`,
              source: 'pixabay',
              type: 'video',
              url: bestVideo.url,
              title: `${query.replace(/\s+/g, '_')}_${hit.id}`,
              extension: 'mp4',
              width: hit.width,
              height: hit.height
            });
          }
        }
      }

      this.videoCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching Pixabay videos for "${query}":`, error.message);
      return this.getFallbackVideos(query, limit);
    }
  }

  /**
   * Search images on Pixabay
   * @param {string} query 
   * @param {number} limit 
   * @param {string} aspectRatio
   * @param {string} videoTone
   * @returns {Promise<Array<Object>>}
   */
  async searchImages(query, limit = 3, aspectRatio = '16:9', videoTone = 'cinematic') {
    if (!this.apiKey) {
      console.warn('PIXABAY_API_KEY is not set. Using fallback images.');
      return this.getFallbackImages(query, limit);
    }

    const cacheKey = `${query}_${limit}_${aspectRatio}_${videoTone}`;
    if (this.imageCache.has(cacheKey)) {
      console.log(`Pixabay image cache hit for query: "${query}"`);
      return this.imageCache.get(cacheKey);
    }

    const enrichedQuery = this.enrichQueryWithTone(query, videoTone);
    const orientation = this.getOrientation(aspectRatio);

    try {
      const response = await this.getWithRetry(`${this.baseUrl}/`, {
        params: {
          key: this.apiKey,
          q: enrichedQuery,
          image_type: 'photo',
          orientation,
          per_page: limit * 3,
          safesearch: 'true'
        },
        timeout: 8000
      });

      if (!response.data || !response.data.hits) {
        return [];
      }

      const results = [];
      for (const hit of response.data.hits) {
        if (results.length >= limit) break;

        let isAspectMatch = false;
        if (aspectRatio === '9:16') {
          isAspectMatch = hit.imageHeight > hit.imageWidth;
        } else if (aspectRatio === '1:1') {
          isAspectMatch = Math.abs(hit.imageWidth - hit.imageHeight) < (hit.imageWidth * 0.2);
        } else {
          isAspectMatch = hit.imageWidth > hit.imageHeight;
        }

        if (isAspectMatch && hit.largeImageURL) {
          results.push({
            id: `pixabay-img-${hit.id}`,
            source: 'pixabay',
            type: 'image',
            url: hit.largeImageURL,
            title: `${query.replace(/\s+/g, '_')}_${hit.id}`,
            extension: 'jpg',
            width: hit.imageWidth,
            height: hit.imageHeight
          });
        }
      }

      this.imageCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching Pixabay images for "${query}":`, error.message);
      return this.getFallbackImages(query, limit);
    }
  }

  /**
   * Search transparent PNG shapes / illustrations on Pixabay
   * @param {string} query 
   * @param {number} limit 
   * @returns {Promise<Array<Object>>}
   */
  async searchShapes(query, limit = 3) {
    if (!this.apiKey) {
      console.warn('PIXABAY_API_KEY is not set. Using fallback transparent shapes.');
      return this.getFallbackShapes(query, limit);
    }

    const cacheKey = `${query}_${limit}`;
    if (this.shapeCache.has(cacheKey)) {
      console.log(`Pixabay shape cache hit for query: "${query}"`);
      return this.shapeCache.get(cacheKey);
    }

    try {
      const response = await this.getWithRetry(`${this.baseUrl}/`, {
        params: {
          key: this.apiKey,
          q: query,
          image_type: 'illustration', // illustrations are great for shapes/graphics
          colors: 'transparent', // Crucial: gets transparent backgrounds
          per_page: limit * 2,
          safesearch: 'true'
        },
        timeout: 8000
      });

      if (!response.data || !response.data.hits) {
        return [];
      }

      const results = [];
      for (const hit of response.data.hits) {
        if (results.length >= limit) break;

        if (hit.largeImageURL) {
          results.push({
            id: `pixabay-shape-${hit.id}`,
            source: 'pixabay',
            type: 'shape',
            url: hit.largeImageURL,
            title: `${query.replace(/\s+/g, '_')}_shape_${hit.id}`,
            extension: 'png',
            width: hit.imageWidth,
            height: hit.imageHeight
          });
        }
      }

      this.shapeCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching Pixabay transparent shapes for "${query}":`, error.message);
      return this.getFallbackShapes(query, limit);
    }
  }

  /**
   * Search GIFs (Pixabay has illustrations/animations)
   */
  async searchGifs(query, limit = 3) {
    // Pixabay doesn't directly return .gif files via API, they return mp4 loops or illustrations.
    // So we can fallback to high quality direct animated GIF assets, which are amazing.
    return this.getFallbackGifs(query, limit);
  }

  /**
   * Fallback lists
   */
  getFallbackVideos(query, limit) {
    return [
      {
        id: 'pixabay-fallback-vid-1',
        source: 'pixabay-fallback',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-business-people-meeting-in-office-43098-large.mp4',
        title: 'business_meeting_discussion',
        extension: 'mp4',
        width: 1920,
        height: 1080
      },
      {
        id: 'pixabay-fallback-vid-2',
        source: 'pixabay-fallback',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-hand-holding-smartphone-typing-message-43034-large.mp4',
        title: 'phone_screen_typing',
        extension: 'mp4',
        width: 1920,
        height: 1080
      }
    ].slice(0, limit);
  }

  getFallbackImages(query, limit) {
    return [
      {
        id: 'pixabay-fallback-img-1',
        source: 'pixabay-fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        title: 'workspace_setup_laptop',
        extension: 'jpg',
        width: 1200,
        height: 800
      },
      {
        id: 'pixabay-fallback-img-2',
        source: 'pixabay-fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        title: 'office_desks_indoor',
        extension: 'jpg',
        width: 1200,
        height: 800
      }
    ].slice(0, limit);
  }

  getFallbackShapes(query, limit) {
    // Beautiful transparent PNG arrows, frames, badges, icons
    return [
      {
        id: 'pixabay-fallback-shape-1',
        source: 'pixabay-fallback',
        type: 'shape',
        url: 'https://img.icons8.com/color/512/arrow.png', // Large transparent color arrow icon
        title: 'direction_arrow_shape',
        extension: 'png',
        width: 512,
        height: 512
      },
      {
        id: 'pixabay-fallback-shape-2',
        source: 'pixabay-fallback',
        type: 'shape',
        url: 'https://img.icons8.com/color/512/star.png',
        title: 'star_badge_shape',
        extension: 'png',
        width: 512,
        height: 512
      },
      {
        id: 'pixabay-fallback-shape-3',
        source: 'pixabay-fallback',
        type: 'shape',
        url: 'https://img.icons8.com/color/512/chat--v1.png',
        title: 'chat_bubble_shape',
        extension: 'png',
        width: 512,
        height: 512
      }
    ].slice(0, limit);
  }

  getFallbackGifs(query, limit) {
    // High quality direct animated GIFs
    return [
      {
        id: 'pixabay-fallback-gif-1',
        source: 'pixabay-fallback',
        type: 'gif',
        url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', // loading/processing gif
        title: 'futuristic_loader',
        extension: 'gif',
        width: 480,
        height: 480
      },
      {
        id: 'pixabay-fallback-gif-2',
        source: 'pixabay-fallback',
        type: 'gif',
        url: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif', // working keyboard loop
        title: 'fast_coding_typing',
        extension: 'gif',
        width: 480,
        height: 360
      }
    ].slice(0, limit);
  }
}

module.exports = new PixabayService();
