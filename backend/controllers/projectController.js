const path = require('path');
const fs = require('fs-extra');
const srtParserService = require('../services/srtParserService');
const tagGeneratorService = require('../services/tagGeneratorService');
const aiService = require('../services/aiService');
const pexelsService = require('../services/pexelsService');
const pixabayService = require('../services/pixabayService');
const pinterestService = require('../services/pinterestService');
const downloadService = require('../services/downloadService');
const metadataService = require('../services/metadataService');
const zipService = require('../services/zipService');
const unsplashService = require('../services/unsplashService');
const vecteezyService = require('../services/vecteezyService');
const keyService = require('../services/keyService');
const storageService = require('../utils/storageService');

class ProjectController {
  constructor() {
    this.activeCleanups = {};
  }

  /**
   * Handles SRT file upload
   */
  async uploadSrt(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please upload a .srt file.' });
      }

      const srtContent = storageService.bufferToString(req.file.buffer);
      const projectId = `project_${Date.now()}`;
      
      // Parse subtitles
      const subtitles = srtParserService.parse(srtContent);

      // Create uploads folder for this project
      const projectUploadDir = storageService.getPath('uploads', projectId);
      await fs.ensureDir(projectUploadDir);

      // Save original SRT file and parsed JSON
      await fs.writeFile(path.join(projectUploadDir, 'script.srt'), srtContent);
      await fs.writeJson(path.join(projectUploadDir, 'subtitles.json'), subtitles, { spaces: 2 });

      return res.status(200).json({
        projectId,
        originalName: req.file.originalname,
        subtitles
      });
    } catch (error) {
      console.error('Error in uploadSrt:', error);
      return res.status(500).json({ error: error.message || 'Failed to process subtitle file' });
    }
  }

  /**
   * Retrieves the parsed script
   */
  async getScript(req, res) {
    try {
      const { projectId } = req.params;
      const uploadDir = storageService.getPath('uploads', projectId);
      const taggedJsonPath = path.join(uploadDir, 'subtitles_with_tags.json');
      const jsonPath = path.join(uploadDir, 'subtitles.json');
      const storyPath = path.join(uploadDir, 'story.json');

      if (!await fs.pathExists(jsonPath)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      let subtitles;
      if (await fs.pathExists(taggedJsonPath)) {
        subtitles = await fs.readJson(taggedJsonPath);
      } else {
        subtitles = await fs.readJson(jsonPath);
      }

      let story = '';
      if (await fs.pathExists(storyPath)) {
        const storyData = await fs.readJson(storyPath);
        story = storyData.story || '';
      }

      return res.status(200).json({ projectId, subtitles, story });
    } catch (error) {
      console.error('Error in getScript:', error);
      return res.status(500).json({ error: 'Failed to retrieve script' });
    }
  }

  /**
   * Generates a cinematic visual story for the script using open source LLM via HuggingFace
   */
  async generateStory(req, res) {
    try {
      const { projectId, subtitles } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      let subsToProcess = subtitles;
      const projectUploadDir = storageService.getPath('uploads', projectId);

      // If subtitles not provided in body, load from disk
      if (!subsToProcess) {
        const jsonPath = path.join(projectUploadDir, 'subtitles.json');
        if (!await fs.pathExists(jsonPath)) {
          return res.status(404).json({ error: 'Project files not found' });
        }
        subsToProcess = await fs.readJson(jsonPath);
      }

      console.log(`Generating cinematic story + global tag pool for project ${projectId}...`);

      // Single Gemini call generates both the formatted story AND global tag pool (max 50)
      const { story, tags: globalTags } = await aiService.generateStoryWithTags(subsToProcess);

      // Save visual story
      await fs.writeJson(path.join(projectUploadDir, 'story.json'), { story }, { spaces: 2 });

      // Pre-save the global tag pool — Step 4 will load this instead of making another API call
      if (Array.isArray(globalTags) && globalTags.length > 0) {
        await fs.writeJson(path.join(projectUploadDir, 'global_tags.json'), { tags: globalTags }, { spaces: 2 });
        console.log(`[Story] Pre-saved ${globalTags.length} global tags for project ${projectId}.`);
      }

      return res.status(200).json({
        projectId,
        story
      });
    } catch (error) {
      console.error('Error in generateStory:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate story' });
    }
  }

  /**
   * Generates tags for the script
   */
  async generateTags(req, res) {
    try {
      const { projectId, subtitles } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      let subsToProcess = subtitles;
      const projectUploadDir = storageService.getPath('uploads', projectId);

      // If subtitles not provided in body, load from disk
      if (!subsToProcess) {
        const jsonPath = path.join(projectUploadDir, 'subtitles.json');
        if (!await fs.pathExists(jsonPath)) {
          return res.status(404).json({ error: 'Project files not found' });
        }
        subsToProcess = await fs.readJson(jsonPath);
      }

      // Load visual story
      const storyPath = path.join(projectUploadDir, 'story.json');
      let story = '';
      if (await fs.pathExists(storyPath)) {
        const storyData = await fs.readJson(storyPath);
        story = storyData.story || '';
      }

      // Load pre-generated global tags if Story step already ran (avoids double API call)
      const globalTagsPath = path.join(projectUploadDir, 'global_tags.json');
      let subtitlesWithTags;

      if (await fs.pathExists(globalTagsPath)) {
        console.log(`[Tags] Loading pre-generated global tag pool for project ${projectId}...`);
        const { tags: globalTags } = await fs.readJson(globalTagsPath);
        // Map global tags onto each subtitle by keyword relevance
        subtitlesWithTags = aiService._mapTagsToSubtitles(subsToProcess, globalTags);
        console.log(`[Tags] ✓ Mapped ${globalTags.length} global tags across ${subsToProcess.length} subtitles.`);
      } else {
        // Story step hasn't run or failed — generate tags fresh
        console.log(`[Tags] Generating fresh global tag pool for project ${projectId}...`);
        subtitlesWithTags = await aiService.generateTagsFromSupers(subsToProcess, story);
      }

      // Save tagged subtitles
      await fs.writeJson(path.join(projectUploadDir, 'subtitles_with_tags.json'), subtitlesWithTags, { spaces: 2 });

      return res.status(200).json({
        projectId,
        subtitles: subtitlesWithTags,
        story
      });
    } catch (error) {
      console.error('Error in generateTags:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate tags' });
    }
  }

  /**
   * Starts B-roll search and download process
   */
  async downloadAssets(req, res) {
    const self = this;
    try {
      const { projectId, tags, config } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags array is required' });
      }

      const maxConfig = config || {
        maxVideos: 2,
        maxImages: 1,
        maxGifs: 1,
        maxShapes: 1,
        aspectRatio: '16:9',
        videoTone: 'cinematic',
        maxTotalAssets: 30
      };

      // 1. Search Stock APIs for each enabled tag
      const enabledTags = tags.filter(t => t.enabled);
      if (enabledTags.length === 0) {
        return res.status(400).json({ error: 'No tags are enabled for download.' });
      }

      // Initialize download directory
      const downloadsDir = storageService.getPath('downloads', projectId);
      const zipOutPath = storageService.getPath('downloads', `${projectId}.zip`);

      // ── CLEANUP: Remove stale artifacts from any previous run for this project ──
      // This prevents old metadata.json, old assets, and old ZIPs from interfering.
      try {
        if (await fs.pathExists(downloadsDir)) {
          await fs.remove(downloadsDir);
          console.log(`[Cleanup] Removed old downloads folder: ${downloadsDir}`);
        }
        if (await fs.pathExists(zipOutPath)) {
          await fs.remove(zipOutPath);
          console.log(`[Cleanup] Removed old ZIP: ${zipOutPath}`);
        }
        // Also remove the persisted progress file so a stale 'completed' state isn't restored
        const progressFile = storageService.getPath('downloads', '.progress', `${projectId}.json`);
        if (await fs.pathExists(progressFile)) {
          await fs.remove(progressFile);
          console.log(`[Cleanup] Removed stale progress file for ${projectId}`);
        }
      } catch (cleanupErr) {
        console.warn(`[Cleanup] Non-fatal cleanup error for ${projectId}:`, cleanupErr.message);
      }

      // Ensure fresh download directory exists
      await fs.ensureDir(downloadsDir);

      // Set starting progress state in download service
      downloadService.initProgress(projectId, 0);

      // We respond immediately to avoid timeouts, then run the search & download process in background
      res.status(200).json({
        message: 'Search and download process started in the background.',
        projectId,
        status: 'searching'
      });

      // Background process wrapper
      (async () => {
        try {
          console.log(`Starting background B-roll search for project ${projectId}...`);
          
          // 1. Programmatic Semantic Tag Clustering (Group tags by keyword intersections to avoid 429 Rate Limits)
          const stopWords = new Set(['and', 'the', 'with', 'for', 'a', 'an', 'in', 'on', 'at', 'of', 'by', 'to', 'is', 'are']);
          const tagWordsList = enabledTags.map(item => {
            const cleanWords = item.tag.toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .split(/\s+/)
              .filter(w => w.length > 2 && !stopWords.has(w));
            return { item, words: cleanWords };
          });

          const clusters = [];
          const processedIndices = new Set();

          for (let i = 0; i < tagWordsList.length; i++) {
            if (processedIndices.has(i)) continue;

            const current = tagWordsList[i];
            const cluster = {
              representativeQuery: current.item.tag,
              tagsInCluster: [current.item.tag]
            };
            processedIndices.add(i);

            for (let j = i + 1; j < tagWordsList.length; j++) {
              if (processedIndices.has(j)) continue;

              const candidate = tagWordsList[j];
              const intersection = current.words.filter(w => candidate.words.includes(w));
              
              if (intersection.length > 0) {
                cluster.tagsInCluster.push(candidate.item.tag);
                processedIndices.add(j);
                
                // Merge unique keywords to form a single cohesive search query (cap at 4 terms)
                const uniqueWords = Array.from(new Set([...current.words, ...candidate.words]));
                cluster.representativeQuery = uniqueWords.slice(0, 4).join(' ');
              }
            }
            clusters.push(cluster);
          }

          console.log(`Clustered ${enabledTags.length} original tags into ${clusters.length} unique semantic search queries.`);

          // Group found assets by original tag/query to run round-robin distribution
          const assetsByTag = {};
          enabledTags.forEach(t => {
            assetsByTag[t.tag] = [];
          });

          // Run stock asset searches over unique clusters in concurrency chunks of 3
          const concurrencyLimit = 3;
          for (let i = 0; i < clusters.length; i += concurrencyLimit) {
            const batch = clusters.slice(i, i + concurrencyLimit);
            console.log(`Searching batch of ${batch.length} queries (${i + 1}-${Math.min(i + concurrencyLimit, clusters.length)} of ${clusters.length})...`);
            
            const searchPromises = batch.map(async (cluster) => {
              const query = cluster.representativeQuery;
              const clusterAssets = [];

              // 1. Videos (Pexels and Pixabay)
              if (maxConfig.maxVideos > 0) {
                try {
                  const pexelsVids = await pexelsService.searchVideos(query, maxConfig.maxVideos, maxConfig.aspectRatio, maxConfig.videoTone);
                  pexelsVids.forEach(v => clusterAssets.push(v));
                } catch (e) {
                  console.error(`Pexels video search fail for cluster "${query}":`, e.message);
                }

                try {
                  const pixabayVids = await pixabayService.searchVideos(query, maxConfig.maxVideos, maxConfig.aspectRatio, maxConfig.videoTone);
                  pixabayVids.forEach(v => clusterAssets.push(v));
                } catch (e) {
                  console.error(`Pixabay video search fail for cluster "${query}":`, e.message);
                }
              }

              // 2. Images (Pexels, Pixabay, and Pinterest)
              if (maxConfig.maxImages > 0) {
                let pexelsImgs = [];
                let pixabayImgs = [];

                try {
                  pexelsImgs = await pexelsService.searchImages(query, maxConfig.maxImages, maxConfig.aspectRatio, maxConfig.videoTone);
                  pexelsImgs.forEach(i => clusterAssets.push(i));
                } catch (e) {
                  console.error(`Pexels image search fail for cluster "${query}":`, e.message);
                }

                try {
                  pixabayImgs = await pixabayService.searchImages(query, maxConfig.maxImages, maxConfig.aspectRatio, maxConfig.videoTone);
                  pixabayImgs.forEach(i => clusterAssets.push(i));
                } catch (e) {
                  console.error(`Pixabay image search fail for cluster "${query}":`, e.message);
                }

                // Pinterest image search (uses Bearer token)
                try {
                  const pinterestImgs = await pinterestService.searchImages(query, maxConfig.maxImages, maxConfig.aspectRatio);
                  pinterestImgs.forEach(i => clusterAssets.push(i));
                  if (pinterestImgs.length > 0) {
                    console.log(`[Pinterest] ✓ Added ${pinterestImgs.length} pin image(s) for "${query}"`);
                  }
                } catch (e) {
                  console.error(`Pinterest image search fail for cluster "${query}":`, e.message);
                }

                // Unsplash & Vecteezy fallback search: if both Pexels and Pixabay returned no images for this query, search fallbacks
                if (pexelsImgs.length === 0 && pixabayImgs.length === 0) {
                  try {
                    const unsplashImgs = await unsplashService.searchImages(query, maxConfig.maxImages, maxConfig.aspectRatio);
                    unsplashImgs.forEach(i => clusterAssets.push(i));
                    if (unsplashImgs.length > 0) {
                      console.log(`[Unsplash Fallback] ✓ Added ${unsplashImgs.length} image(s) for "${query}"`);
                    }
                  } catch (e) {
                    console.error(`Unsplash image fallback search fail for cluster "${query}":`, e.message);
                  }

                  try {
                    const vecteezyImgs = await vecteezyService.searchImages(query, maxConfig.maxImages, maxConfig.aspectRatio);
                    vecteezyImgs.forEach(i => clusterAssets.push(i));
                    if (vecteezyImgs.length > 0) {
                      console.log(`[Vecteezy Fallback] ✓ Added ${vecteezyImgs.length} image(s) for "${query}"`);
                    }
                  } catch (e) {
                    console.error(`Vecteezy image fallback search fail for cluster "${query}":`, e.message);
                  }
                }
              }

              // 3. GIFs
              if (maxConfig.maxGifs > 0) {
                try {
                  const pixabayGifs = await pixabayService.searchGifs(query, maxConfig.maxGifs);
                  pixabayGifs.forEach(g => clusterAssets.push(g));
                } catch (e) {
                  console.error(`GIF search fail for cluster "${query}":`, e.message);
                }
              }

              // 4. Transparent PNG Shapes
              if (maxConfig.maxShapes > 0) {
                try {
                  const pixabayShapes = await pixabayService.searchShapes(query, maxConfig.maxShapes);
                  pixabayShapes.forEach(s => clusterAssets.push(s));
                } catch (e) {
                  console.error(`Transparent shape search fail for cluster "${query}":`, e.message);
                }
              }

              return clusterAssets;
            });

            const batchResults = await Promise.all(searchPromises);
            batch.forEach((cluster, idx) => {
              let clusterAssets = batchResults[idx] || [];

              // ── TYPE INTERLEAVE: Reorder assets so round-robin picks a balanced mix ──
              // Without this, videos always fill the cap before images/GIFs/shapes are reached.
              const byType = {
                video: clusterAssets.filter(a => a.type === 'video'),
                image: clusterAssets.filter(a => a.type === 'image'),
                gif:   clusterAssets.filter(a => a.type === 'gif'),
                shape: clusterAssets.filter(a => a.type === 'shape')
              };
              const interleaved = [];
              const maxLen = Math.max(...Object.values(byType).map(a => a.length));
              for (let r = 0; r < maxLen; r++) {
                for (const typeArr of Object.values(byType)) {
                  if (r < typeArr.length) interleaved.push(typeArr[r]);
                }
              }
              clusterAssets = interleaved;

              // Map interleaved assets to ALL original tags inside this semantic cluster
              cluster.tagsInCluster.forEach(originalTag => {
                const mapped = clusterAssets.map(asset => ({ ...asset, tag: originalTag }));
                if (!assetsByTag[originalTag]) assetsByTag[originalTag] = [];
                assetsByTag[originalTag].push(...mapped);
              });
            });

            // Rate-limit guard: sleep between search batches to prevent 429 from Pexels/Pixabay
            if (i + concurrencyLimit < clusters.length) {
              console.log(`[Rate Limit Guard] Sleeping 1200ms between search batches...`);
              await new Promise(resolve => setTimeout(resolve, 1200));
            }
          }

          // Compile unique assets using a Round-Robin selector to ensure balanced, capped timeline coverage
          const uniqueAssets = [];
          const seenUrls = new Set();
          const seenIds = new Set();
          
          const globalLimit = maxConfig.maxTotalAssets || 30;
          console.log(`Distributing search results. Target global cap is ${globalLimit} assets.`);

          const queries = Object.keys(assetsByTag);
          let addedAny = true;
          let round = 0;

          while (uniqueAssets.length < globalLimit && addedAny) {
            addedAny = false;
            
            for (const query of queries) {
              if (uniqueAssets.length >= globalLimit) break;
              
              const queryAssets = assetsByTag[query] || [];
              if (round < queryAssets.length) {
                const asset = queryAssets[round];
                
                // Deduplicate by URL and ID
                if (!seenUrls.has(asset.url) && !seenIds.has(asset.id)) {
                  seenUrls.add(asset.url);
                  seenIds.add(asset.id);
                  uniqueAssets.push(asset);
                }
                addedAny = true;
              }
            }
            round++;
          }

          console.log(`Round-Robin completed. Filtered unique asset download count: ${uniqueAssets.length}.`);

          // Build a type breakdown summary for the progress display
          const typeCounts = { video: 0, image: 0, gif: 0, shape: 0 };
          uniqueAssets.forEach(a => { if (typeCounts[a.type] !== undefined) typeCounts[a.type]++; });
          const breakdownLabel = [
            typeCounts.video  > 0 ? `${typeCounts.video} video${typeCounts.video !== 1 ? 's' : ''}` : null,
            typeCounts.image  > 0 ? `${typeCounts.image} photo${typeCounts.image !== 1 ? 's' : ''}` : null,
            typeCounts.gif    > 0 ? `${typeCounts.gif} GIF${typeCounts.gif !== 1 ? 's' : ''}` : null,
            typeCounts.shape  > 0 ? `${typeCounts.shape} shape${typeCounts.shape !== 1 ? 's' : ''}` : null
          ].filter(Boolean).join(', ');
          console.log(`Asset breakdown: ${breakdownLabel}`);

          if (uniqueAssets.length === 0) {
            downloadService.updateProgress(projectId, {
              status: 'failed',
              currentAsset: 'Search completed. No stock assets found for the given tags.',
              errors: ['No stock assets matched the enabled tags.']
            });
            return;
          }

          // Announce what will be downloaded before starting queue
          downloadService.updateProgress(projectId, {
            currentAsset: `Queued: ${breakdownLabel} — starting downloads...`,
            typeCounts
          });

          // 2. Execute parallel queue downloads
          const downloadResults = await downloadService.downloadAssetsQueue(
            projectId,
            uniqueAssets,
            downloadsDir
          );

          // 3. Save metadata.json
          downloadService.updateProgress(projectId, {
            status: maxConfig.destinationPath ? 'exporting' : 'zipping',
            currentAsset: 'Generating metadata.json...'
          });
          await metadataService.saveMetadata(downloadsDir, downloadResults);

          // 4. Copy original script files
          downloadService.updateProgress(projectId, {
            currentAsset: 'Packaging script files...'
          });
          const originalScriptDest = path.join(downloadsDir, 'original-script');
          await fs.ensureDir(originalScriptDest);
          
          const sourceSrtPath = storageService.getPath('uploads', projectId, 'script.srt');
          if (await fs.pathExists(sourceSrtPath)) {
            await fs.copy(sourceSrtPath, path.join(originalScriptDest, 'script.srt'));
          }

          // 5. Transfer to Destination Folder OR Generate ZIP
          if (maxConfig.destinationPath) {
            const destFolder = path.resolve(maxConfig.destinationPath);
            downloadService.updateProgress(projectId, {
              status: 'exporting',
              currentAsset: `Moving resources to: ${destFolder}...`
            });
            
            // Ensure target directory exists and copy the structural files
            await fs.ensureDir(destFolder);
            await fs.copy(downloadsDir, destFolder);
            console.log(`[Destination Path] Copied assets from ${downloadsDir} to ${destFolder}`);

            // 6. Complete project
            const expiresAt = Date.now() + 180000; // 3 minutes from now
            downloadService.updateProgress(projectId, {
              status: 'completed',
              currentAsset: `Success! Resources saved directly to your folder.`,
              destinationPath: destFolder,
              zipPath: '',
              expiresAt
            });
            console.log(`Project B-roll creation completed successfully for ${projectId} (Direct Folders)!`);

            // Start the 3-minute automatic purge cleanup timer
            self.scheduleProjectCleanup(projectId);
          } else {
            // Generate standard ZIP fallback
            await zipService.createProjectZip(downloadsDir, zipOutPath, projectId, (current, total, filename) => {
              downloadService.updateProgress(projectId, {
                status: 'zipping',
                currentAsset: `Archiving file [${current}/${total}]: ${filename}`,
                zipProgress: {
                  current,
                  total
                }
              });
            });

            // 6. Complete project
            const expiresAt = Date.now() + 180000; // 3 minutes from now
            downloadService.updateProgress(projectId, {
              status: 'completed',
              currentAsset: 'Project generated successfully!',
              zipPath: `/api/download/${projectId}`,
              destinationPath: '',
              expiresAt
            });
            console.log(`Project B-roll creation completed successfully for ${projectId}!`);

            // Start the 3-minute automatic purge cleanup timer
            self.scheduleProjectCleanup(projectId);
          }

        } catch (bgError) {
          console.error(`Background B-roll process failed for project ${projectId}:`, bgError);
          downloadService.updateProgress(projectId, {
            status: 'failed',
            currentAsset: 'Background processing failed.',
            errors: [bgError.message || 'Unknown processing error']
          });
        }
      })();

    } catch (error) {
      console.error('Error in downloadAssets:', error);
      return res.status(500).json({ error: error.message || 'Failed to start download process' });
    }
  }

  /**
   * Retrieves B-roll downloading progress
   */
  getProgress(req, res) {
    try {
      const { projectId } = req.params;
      const progress = downloadService.getProgress(projectId);
      return res.status(200).json(progress);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Schedule automatic project file purge after 3 minutes
   */
  scheduleProjectCleanup(projectId) {
    console.log(`[Cleanup] Scheduled 3-minute automatic file purge for project: ${projectId}`);
    
    if (this.activeCleanups[projectId]) {
      clearTimeout(this.activeCleanups[projectId]);
    }

    this.activeCleanups[projectId] = setTimeout(async () => {
      await this.executeProjectCleanup(projectId);
    }, 180000); // 3 minutes = 180,000 ms
  }

  /**
   * Performs physical and memory purge for project files
   */
  async executeProjectCleanup(projectId) {
    console.log(`[Cleanup] Running automatic purge for project: ${projectId}...`);
    const uploadsDir = storageService.getPath('uploads', projectId);
    const downloadsDir = storageService.getPath('downloads', projectId);
    const zipPath = storageService.getPath('downloads', `${projectId}.zip`);
    const progressFile = storageService.getPath('downloads', '.progress', `${projectId}.json`);

    try {
      if (await fs.pathExists(uploadsDir)) {
        await fs.remove(uploadsDir);
        console.log(`[Cleanup] Purged uploads folder: ${uploadsDir}`);
      }
      if (await fs.pathExists(downloadsDir)) {
        await fs.remove(downloadsDir);
        console.log(`[Cleanup] Purged downloads folder: ${downloadsDir}`);
      }
      if (await fs.pathExists(zipPath)) {
        await fs.remove(zipPath);
        console.log(`[Cleanup] Purged ZIP file: ${zipPath}`);
      }
      if (await fs.pathExists(progressFile)) {
        await fs.remove(progressFile);
        console.log(`[Cleanup] Purged progress file: ${progressFile}`);
      }
      
      // Clear in-memory progress
      downloadService.updateProgress(projectId, { status: 'idle', zipPath: '' });
      if (downloadService.projectsProgress && downloadService.projectsProgress[projectId]) {
        delete downloadService.projectsProgress[projectId];
      }
      console.log(`[Cleanup] Successfully purged all records for ${projectId}.`);
    } catch (err) {
      console.error(`[Cleanup] Purge failed for project ${projectId}:`, err.message);
    } finally {
      if (this.activeCleanups[projectId]) {
        delete this.activeCleanups[projectId];
      }
    }
  }

  /**
   * Instantly deletes all project files manually
   */
  async quickDelete(req, res) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      console.log(`[Cleanup] Manual Quick Delete triggered for project: ${projectId}`);
      
      // Clear scheduled timeout if any
      if (this.activeCleanups[projectId]) {
        clearTimeout(this.activeCleanups[projectId]);
        delete this.activeCleanups[projectId];
      }

      await this.executeProjectCleanup(projectId);
      return res.status(200).json({ success: true, message: 'All project files purged successfully.' });
    } catch (error) {
      console.error('Error in quickDelete:', error);
      return res.status(500).json({ error: 'Failed to purge project files' });
    }
  }

  /**
   * Downloads the completed project ZIP file
   */
  async downloadZip(req, res) {
    try {
      const { projectId } = req.params;
      const zipPath = storageService.getPath('downloads', `${projectId}.zip`);

      if (!await fs.pathExists(zipPath)) {
        return res.status(404).json({ error: 'ZIP file not found. It may still be generating or was deleted.' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${projectId}.zip"`);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error in downloadZip:', error);
      return res.status(500).json({ error: 'Failed to download ZIP file' });
    }
  }

  /**
   * Opens the native folder picker dialog and returns selected path
   */
  async selectFolder(req, res) {
    try {
      const { exec } = require('child_process');

      if (process.platform === 'darwin') {
        // macOS native folder picker using AppleScript
        const cmd = `osascript -e 'POSIX path of (choose folder with prompt "Select Destination Folder for Downloaded Assets")'`;
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error('[Folder Selector] Error executing osascript:', error.message);
            // AppleScript returns error if user cancels
            if (error.message.includes('User canceled') || error.code === 1) {
              return res.status(200).json({ cancelled: true });
            }
            return res.status(500).json({ error: 'Failed to open folder browser on macOS. Please type or paste the path manually.' });
          }
          const selectedPath = stdout.trim();
          if (!selectedPath) {
            return res.status(200).json({ cancelled: true });
          }
          console.log(`[Folder Selector] macOS user selected path: ${selectedPath}`);
          return res.status(200).json({ selectedPath });
        });
      } else if (process.platform === 'win32') {
        // Windows native folder picker using PowerShell
        const tempScriptPath = storageService.getPath('temp', 'select-folder.ps1');
        
        // Ensure temp folder exists
        await fs.ensureDir(path.dirname(tempScriptPath));
        
        // Write the powershell script to temp file
        const psScript = `Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select Destination Folder for Downloaded Assets"
$dialog.ShowNewFolderButton = $true
$res = $dialog.ShowDialog()
if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
}`;
        await fs.writeFile(tempScriptPath, psScript, 'utf8');

        // Execute powershell script in Single-Threaded Apartment (STA) mode
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -STA -File "${tempScriptPath}"`;
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error('[Folder Selector] Error executing PS script:', error.message);
            return res.status(500).json({ error: 'Failed to open folder browser. Please type or paste the path manually.' });
          }
          const selectedPath = stdout.trim();
          if (!selectedPath) {
            return res.status(200).json({ cancelled: true });
          }
          console.log(`[Folder Selector] Windows user selected path: ${selectedPath}`);
          return res.status(200).json({ selectedPath });
        });
      } else {
        // Linux/other OS - direct typing fallback
        return res.status(400).json({ 
          error: 'Native folder dialog is not supported on this platform. Please enter the path manually.' 
        });
      }
    } catch (e) {
      console.error('[Folder Selector] Controller error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  /**
   * Opens a specified folder path in the OS file explorer/finder
   */
  async openFolder(req, res) {
    try {
      const { folderPath } = req.body;
      if (!folderPath) {
        return res.status(400).json({ error: 'folderPath is required' });
      }
      
      const { exec } = require('child_process');
      const resolvedPath = path.resolve(folderPath);
      
      if (!await fs.pathExists(resolvedPath)) {
        return res.status(404).json({ error: 'Selected destination folder does not exist' });
      }

      console.log(`[Open Folder] Opening: ${resolvedPath}`);
      
      let cmd;
      if (process.platform === 'win32') {
        cmd = `explorer "${resolvedPath}"`;
      } else if (process.platform === 'darwin') {
        cmd = `open "${resolvedPath}"`;
      } else {
        cmd = `xdg-open "${resolvedPath}"`;
      }

      exec(cmd, (err) => {
        if (err) {
          console.error('[Open Folder] Failed to open:', err.message);
          return res.status(500).json({ error: `Failed to open directory in file manager: ${err.message}` });
        }
        return res.status(200).json({ success: true });
      });
    } catch (e) {
      console.error('[Open Folder] Controller error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  /**
   * Transcribes a raw text script into a timed list of subtitle cues (Premiere Pro style)
   */
  async transcribeScript(req, res) {
    try {
      const { scriptText, projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }
      if (!scriptText || typeof scriptText !== 'string' || !scriptText.trim()) {
        return res.status(400).json({ error: 'scriptText is required and must be a valid string' });
      }

      const projectUploadDir = path.join(__dirname, '..', 'uploads', projectId);
      await fs.ensureDir(projectUploadDir);

      // Save original raw script text
      await fs.writeFile(path.join(projectUploadDir, 'script.txt'), scriptText, 'utf8');

      // ── CLEANUP STALE FILES UPON RE-TRANSCRIPTION ──
      // If we are auto-transcribing a new raw script, any old story, tags, and progress are stale and must be cleaned up.
      try {
        const staleFiles = [
          path.join(projectUploadDir, 'subtitles_with_tags.json'),
          path.join(projectUploadDir, 'story.json'),
          path.join(projectUploadDir, 'global_tags.json')
        ];
        for (const file of staleFiles) {
          if (await fs.pathExists(file)) {
            await fs.remove(file);
            console.log(`[Cleanup] Removed stale file during re-transcription: ${file}`);
          }
        }
      } catch (cleanupErr) {
        console.warn('[Cleanup] Non-fatal cleanup error during re-transcription:', cleanupErr.message);
      }

      // Attempt AI-based transcription or local timing-cue extraction
      let subtitles = [];
      const apiKey = (process.env.GROK_API_KEY || '').trim().replace(/^['\"]|['\"]$/g, '');

      if (apiKey) {
        try {
          console.log(`[Transcribe] AI Auto-Transcribing raw script for ${projectId} using Groq...`);
          
          const systemPrompt = `You are a professional video subtitling editor (Premiere Pro Transcribe tool).
Given a raw video script, split it into timed transcription subtitle cues (3-6 seconds each).
Return ONLY a JSON object with a single key "subtitles" containing an array of objects.
Each object must have exactly three keys:
- "start" (formatted as HH:MM:SS, e.g. "00:00:00")
- "end" (formatted as HH:MM:SS, e.g. "00:00:04")
- "text" (the spoken subtitle sentence/phrase)

Rules:
- Make sure timing is sequential and continuous.
- Do not add markdown formatting, quotes, or prefixing block text. Return raw JSON text.`;

          const responseText = await aiService._groqChat(systemPrompt, `Script: "${scriptText.slice(0, 1500)}"`, {
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 1500,
            json: true
          });

          const parsed = JSON.parse(responseText);
          subtitles = parsed.subtitles || parsed;
          console.log(`[Transcribe] AI generated ${subtitles.length} timed cues.`);
        } catch (aiErr) {
          console.warn('[Transcribe] AI transcription failed, falling back to local sentence-splitter:', aiErr.message);
        }
      }

      // Local sentence-splitter fallback (if no AI key or AI failed)
      if (!Array.isArray(subtitles) || subtitles.length === 0) {
        console.log(`[Transcribe] Running local fallback sentence-splitter for ${projectId}...`);
        // Clean and split by sentences/clauses
        const sentences = scriptText
          .replace(/\r?\n/g, ' ')
          .split(/(?<=[.!?])\s+|(?<=,)\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 3);

        let currentTime = 0; // seconds
        subtitles = sentences.map((sentence, index) => {
          // Duration based on word count: roughly 150 words per minute (2.5 words per second)
          // Minimum 3 seconds, maximum 7 seconds
          const words = sentence.split(/\s+/).length;
          const duration = Math.max(3, Math.min(7, Math.round(words / 2)));
          
          const formatTime = (totalSeconds) => {
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
          };

          const start = formatTime(currentTime);
          currentTime += duration;
          const end = formatTime(currentTime);

          return {
            id: `cue_${index + 1}`,
            start,
            end,
            text: sentence
          };
        });
      }

      // Save the generated timing cues as subtitles.json
      await fs.writeJson(path.join(projectUploadDir, 'subtitles.json'), subtitles, { spaces: 2 });

      return res.status(200).json({
        projectId,
        originalName: 'Manual Script Project',
        subtitles
      });
    } catch (error) {
      console.error('Error in transcribeScript:', error);
      return res.status(500).json({ error: error.message || 'Failed to transcribe script' });
    }
  }

  /**
   * Retrieves active API key configuration statuses
   */
  async getApiKeys(req, res) {
    try {
      const data = keyService.getAllKeyStatuses(req);
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error in getApiKeys:', error);
      return res.status(500).json({ error: 'Failed to retrieve API key statuses' });
    }
  }

  /**
   * Saves updated custom API keys
   */
  async saveApiKeys(req, res) {
    try {
      const data = keyService.saveKeys(req.body);
      return res.status(200).json({ message: 'API keys updated successfully', ...data });
    } catch (error) {
      console.error('Error in saveApiKeys:', error);
      return res.status(500).json({ error: 'Failed to save API keys' });
    }
  }

  /**
   * Resets custom API keys back to default environment settings
   */
  async resetApiKeys(req, res) {
    try {
      const data = keyService.resetKeys();
      return res.status(200).json({ message: 'API keys reset to default', ...data });
    } catch (error) {
      console.error('Error in resetApiKeys:', error);
      return res.status(403).json({ error: error.message || 'Failed to reset API keys' });
    }
  }
}

module.exports = new ProjectController();
