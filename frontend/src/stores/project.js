import { defineStore } from 'pinia';
import axios from 'axios';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectId: localStorage.getItem('projectId') || '',
    originalName: localStorage.getItem('originalName') || '',
    subtitles: JSON.parse(localStorage.getItem('subtitles')) || [],
    rawScriptText: localStorage.getItem('rawScriptText') || '',
    story: localStorage.getItem('story') || '',
    videoSettings: {
      aspectRatio: localStorage.getItem('aspectRatio') || '16:9',
      videoTone: localStorage.getItem('videoTone') || 'cinematic'
    },
    downloadConfig: {
      maxVideos: 2,
      maxImages: 1,
      maxGifs: 1,
      maxShapes: 1,
      maxTotalAssets: 30,
      destinationPath: localStorage.getItem('destinationPath') || ''
    },
    progress: {
      status: 'idle', // 'idle' | 'searching' | 'downloading' | 'zipping' | 'completed' | 'failed'
      totalAssets: 0,
      downloadedAssets: 0,
      currentAsset: '',
      progressPercent: 0,
      errors: [],
      zipPath: ''
    },
    isLoading: false,
    error: null,
    pollInterval: null
  }),

  actions: {
    /**
     * Upload an SRT file to start a new project
     */
    async uploadSrtFile(file) {
      this.isLoading = true;
      this.error = null;
      this.story = '';
      
      const formData = new FormData();
      formData.append('srtFile', file);

      try {
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const { projectId, originalName, subtitles } = response.data;
        
        this.projectId = projectId;
        this.originalName = originalName;
        // Make sure tags are initialized as empty if not set
        this.subtitles = subtitles.map(sub => ({
          ...sub,
          tags: sub.tags || [],
          enabled: true
        }));

        this.persistToLocalStorage();
      } catch (err) {
        console.error('Upload failed:', err);
        this.error = err.response?.data?.error || 'Failed to upload and parse SRT file. Make sure it is valid.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Updates local subtitles array
     */
    updateSubtitles(newSubtitles) {
      this.subtitles = newSubtitles;
      localStorage.setItem('subtitles', JSON.stringify(this.subtitles));
    },

    /**
     * Request the backend to generate a cinematic visual story
     */
    async generateStory() {
      if (!this.projectId) return;

      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.post('/api/story/generate', {
          projectId: this.projectId,
          subtitles: this.subtitles
        });

        const { story } = response.data;
        this.story = story || '';
        this.persistToLocalStorage();
      } catch (err) {
        console.error('Story generation failed:', err);
        this.error = err.response?.data?.error || 'Failed to generate visual story.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Request the backend to generate search tags for subtitles based on script & story
     */
    async generateTags() {
      if (!this.projectId) return;

      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.post('/api/tags/generate', {
          projectId: this.projectId,
          subtitles: this.subtitles
        });

        const { subtitles, story } = response.data;
        this.story = story || '';
        
        // Map generated tags back to subtitles, ensuring enabled state is preserved
        this.subtitles = subtitles.map(newSub => {
          const oldSub = this.subtitles.find(s => s.id === newSub.id);
          return {
            ...newSub,
            enabled: oldSub ? oldSub.enabled : true
          };
        });

        this.persistToLocalStorage();
      } catch (err) {
        console.error('Tag generation failed:', err);
        this.error = err.response?.data?.error || 'Failed to generate tags for subtitles.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Transcribe raw script text into timing cues
     */
    async transcribeScript(scriptText) {
      if (!this.projectId) return;

      this.isLoading = true;
      this.error = null;
      this.rawScriptText = scriptText;

      try {
        const response = await axios.post('/api/transcribe', {
          projectId: this.projectId,
          scriptText
        });

        const { subtitles } = response.data;
        this.subtitles = subtitles.map(sub => ({
          ...sub,
          tags: sub.tags || [],
          enabled: true
        }));

        this.persistToLocalStorage();
      } catch (err) {
        console.error('Transcription failed:', err);
        this.error = err.response?.data?.error || 'Failed to auto-transcribe script text.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Trigger native folder browser dialog and update state
     */
    async selectDestinationFolder() {
      try {
        this.isLoading = true;
        const response = await axios.post('/api/select-folder');
        if (response.data && response.data.selectedPath) {
          this.downloadConfig.destinationPath = response.data.selectedPath;
          this.persistToLocalStorage();
        }
        return response.data;
      } catch (err) {
        console.error('Failed to select folder:', err);
        this.error = err.response?.data?.error || 'Failed to open directory browser.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Open custom generated folder in explorer
     */
    async openDestinationFolder(pathStr) {
      try {
        await axios.post('/api/open-folder', { folderPath: pathStr });
      } catch (err) {
        console.error('Failed to open folder:', err);
        alert(err.response?.data?.error || 'Failed to open destination folder.');
      }
    },

    /**
     * Start downloading B-roll assets based on chosen tags and aspect/tone settings
     */
    async startBrollDownload() {
      if (!this.projectId) return;

      this.isLoading = true;
      this.error = null;

      // Extract all enabled tags
      const tagList = [];
      this.subtitles.forEach(sub => {
        if (sub.enabled && sub.tags) {
          sub.tags.forEach(tag => {
            // Check if tag is already added to avoid duplicates in search list
            if (!tagList.some(t => t.tag === tag)) {
              tagList.push({
                tag,
                enabled: true
              });
            }
          });
        }
      });

      if (tagList.length === 0) {
        this.error = 'No subtitle tracks or tags are enabled. Please enable some tags to download assets.';
        this.isLoading = false;
        return;
      }

      try {
        const response = await axios.post('/api/assets/download', {
          projectId: this.projectId,
          tags: tagList,
          config: {
            ...this.downloadConfig,
            aspectRatio: this.videoSettings.aspectRatio,
            videoTone: this.videoSettings.videoTone
          }
        });

        // Initialize progress state locally based on response
        this.progress = {
          status: response.data.status,
          totalAssets: 0,
          downloadedAssets: 0,
          currentAsset: response.data.message || 'Starting background search...',
          progressPercent: 0,
          errors: [],
          zipPath: ''
        };

        // Start polling progress immediately
        this.startPollingProgress();
      } catch (err) {
        console.error('Failed to start B-roll download:', err);
        this.error = err.response?.data?.error || 'Failed to initiate asset downloading process.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Poll the progress endpoint for status updates
     */
    async fetchProgress() {
      if (!this.projectId) return;

      try {
        const response = await axios.get(`/api/assets/progress/${this.projectId}`);
        this.progress = response.data;

        // Stop polling if complete or failed
        if (this.progress.status === 'completed' || this.progress.status === 'failed') {
          this.stopPollingProgress();
        }
      } catch (err) {
        console.error('Progress check failed:', err);
      }
    },

    startPollingProgress() {
      this.stopPollingProgress(); // Clear existing if any
      this.fetchProgress(); // Immediately fetch once
      
      this.pollInterval = setInterval(() => {
        this.fetchProgress();
      }, 1000); // Poll every 1 second
    },

    stopPollingProgress() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    },

    /**
     * Persists key project details to localStorage for page-reload resilience
     */
    persistToLocalStorage() {
      localStorage.setItem('projectId', this.projectId);
      localStorage.setItem('originalName', this.originalName);
      localStorage.setItem('subtitles', JSON.stringify(this.subtitles));
      localStorage.setItem('rawScriptText', this.rawScriptText || '');
      localStorage.setItem('story', this.story);
      localStorage.setItem('aspectRatio', this.videoSettings.aspectRatio);
      localStorage.setItem('videoTone', this.videoSettings.videoTone);
      localStorage.setItem('destinationPath', this.downloadConfig.destinationPath || '');
    },

    /**
     * Instantly deletes all project files from the server (Quick Delete)
     */
    async quickDeleteProject() {
      if (!this.projectId) return;
      this.isLoading = true;
      try {
        await axios.post(`/api/cleanup/${this.projectId}`);
        // Reset progress status locally
        this.progress = {
          status: 'idle',
          totalAssets: 0,
          downloadedAssets: 0,
          currentAsset: 'Project files purged successfully.',
          progressPercent: 0,
          errors: [],
          zipPath: ''
        };
      } catch (err) {
        console.error('Quick delete failed:', err);
        alert(err.response?.data?.error || 'Failed to trigger Quick Delete.');
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Resets the project store state
     */
    resetProject() {
      this.stopPollingProgress();
      this.projectId = '';
      this.originalName = '';
      this.subtitles = [];
      this.rawScriptText = '';
      this.story = '';
      this.error = null;
      this.isLoading = false;
      this.videoSettings = {
        aspectRatio: '16:9',
        videoTone: 'cinematic'
      };
      this.progress = {
        status: 'idle',
        totalAssets: 0,
        downloadedAssets: 0,
        currentAsset: '',
        progressPercent: 0,
        errors: [],
        zipPath: ''
      };
      
      localStorage.removeItem('projectId');
      localStorage.removeItem('originalName');
      localStorage.removeItem('subtitles');
      localStorage.removeItem('rawScriptText');
      localStorage.removeItem('story');
      localStorage.removeItem('aspectRatio');
      localStorage.removeItem('videoTone');
      localStorage.removeItem('destinationPath');
    }
  }
});
