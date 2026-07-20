const axios = require('axios');
const tagGeneratorService = require('./tagGeneratorService');
const huggingfaceService = require('./huggingfaceService');

class AIService {
  /**
   * Generates a cinematic video story with a title, formatted narrative,
   * AND globally deduplicated search tags (max 50) — all in a single Gemini call.
   *
   * Story format output mirrors:
   *   Video Story – The Power of Color in Style
   *   <blank line>
   *   <paragraph text>
   *   ...
   *   Then at the end:
   *   "TAGS: tag1, tag2, tag3 ..."
   *
   * @param {Array<Object>} subtitles
   * @returns {Promise<{ story: string, tags: string[] }>}
   */
    // ─── GROQ API HELPER ────────────────────────────────────────────────────────

  /**
   * Single OpenAI-compatible chat completion call to Groq.
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {Object} opts — { temperature, max_tokens, json }
   * @returns {Promise<string>} The assistant message content
   */
  async _groqChat(systemPrompt, userPrompt, opts = {}) {
    const apiKey = keyService.getKey('GROK_API_KEY');
    if (!apiKey) throw new Error('GROK_API_KEY not set');

    const body = {
      model:             opts.model       ?? 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   }
      ],
      temperature:       opts.temperature       ?? 0.6,
      max_tokens:        opts.max_tokens        ?? 500,
      frequency_penalty: opts.frequency_penalty ?? 0.5,  // kills repetitive loops
      presence_penalty:  opts.presence_penalty  ?? 0.3
    };
    if (opts.json) body.response_format = { type: 'json_object' };

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      body,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  /**
   * Generates a cinematic video story (chunked 5-subtitle approach) + global tags.
   * Each group of 5 subtitles is understood and converted into a short visual scenario.
   * All scenarios are stitched into one cohesive story. Tags are extracted last.
   *
   * @param {Array<Object>} subtitles
   * @returns {Promise<{ story: string, tags: string[] }>}
   */
  async generateStoryWithTags(subtitles) {
    const apiKey = keyService.getKey('GROK_API_KEY');

    if (!apiKey) {
      console.warn('[AIService] GROK_API_KEY not set. Using local fallback for story + tags.');
      return this.generateLocalFallback(subtitles);
    }

    try {
      console.log('[AIService] Generating chunked story via Groq (5 subtitles/scene)...');

      // ── STEP 1: Break into chunks of 5 and generate one scene per chunk ────
      const CHUNK_SIZE = 5;
      const chunks = [];
      for (let i = 0; i < subtitles.length; i += CHUNK_SIZE) {
        chunks.push(subtitles.slice(i, i + CHUNK_SIZE));
      }
      console.log(`[AIService] Processing ${chunks.length} scene chunk(s) from ${subtitles.length} subtitles...`);

      const sceneSystemPrompt =
        `You are a video director. Given spoken subtitle lines, write exactly ONE sentence describing what the camera sees. Be specific and visual. No repetition. End after the sentence.`;

      const scenePromises = chunks.map((chunk, idx) => {
        const lines = chunk.map(s => s.text).join(' ');
        const userMsg = `Lines: "${lines}"\nCamera sees:`;
        return this._groqChat(sceneSystemPrompt, userMsg, {
          model: 'llama-3.1-8b-instant',
          temperature: 0.5,
          max_tokens: 100,
          frequency_penalty: 0.8,
          presence_penalty: 0.5
        })
          .then(scene => ({ idx, scene: scene.split('\n')[0].trim() })) // take first line only
          .catch(err => {
            console.warn(`[AIService] Scene chunk ${idx + 1} failed, using raw text:`, err.message);
            return { idx, scene: chunk.map(s => s.text).join(' ').slice(0, 120) };
          });
      });

      const sceneResults = await Promise.all(scenePromises);
      sceneResults.sort((a, b) => a.idx - b.idx);
      const scenes = sceneResults.map(r => r.scene);

      // ── STEP 2: Stitch all scenes into one cohesive story with a title ──────
      const fullScript = subtitles.map(s => s.text).join(' ');
      const stitchSystemPrompt =
        `You are a master video story editor. You receive a list of visual scene descriptions.
Your job is to combine them into ONE cohesive, flowing cinematic story.
Write a TITLE on line 1 in the format: Video Story – [Catchy Title]
Leave a blank line, then write the full story as connected flowing prose paragraphs.
Do NOT use bullet points, headers, or markdown. Keep all scenes in order. Max 300 words.`;

      const stitchUserMsg = `Original script summary: "${fullScript.slice(0, 300)}"\n\nScene descriptions:\n${scenes.map((s, i) => `Scene ${i + 1}: ${s}`).join('\n\n')}`;

      console.log('[AIService] Stitching scenes into full story...');
      const fullStory = await this._groqChat(stitchSystemPrompt, stitchUserMsg, { temperature: 0.5, max_tokens: 500 });

      // ── STEP 3: Extract global search tags from the full story ───────────────
      const tagSystemPrompt =
        `You are a visual stock footage search expert.
Given a cinematic video story, extract the best Pexels/Pixabay search tags.
Return ONLY a JSON object with a single key "tags" containing an array of strings.
Example: {"tags": ["woman choosing outfit mirror", "colorful fabric close up", "confident walk city"]}
Rules:
- 2-5 words each, visual and specific
- No abstract or single-word tags
- No negative phrasing
- Max 50 unique tags, no duplicates`;

      console.log('[AIService] Extracting search tags from story...');
      const tagRaw = await this._groqChat(tagSystemPrompt, `Video story:\n${fullStory}\n\nOriginal script:\n${fullScript.slice(0, 800)}`, { temperature: 0.3, max_tokens: 600, json: true });

      let tags = [];
      try {
        const parsed = JSON.parse(tagRaw);
        const rawTags = Array.isArray(parsed) ? parsed : (parsed.tags || []);
        tags = [...new Set(
          rawTags.map(t => String(t).trim().toLowerCase())
                 .filter(t => t.length > 3 && t.split(' ').length >= 2)
        )].slice(0, 50);
        console.log(`[AIService] ✓ Extracted ${tags.length} tags via Groq.`);
      } catch (tagErr) {
        console.warn('[AIService] Tag JSON parse failed, using local fallback tags:', tagErr.message);
        const fallback = this.generateLocalFallback(subtitles);
        tags = fallback.tags;
      }

      return { story: fullStory, tags };

    } catch (error) {
      console.error('[AIService] Groq story generation failed, falling back:', error.message);
      return this.generateLocalFallback(subtitles);
    }
  }

  /**
   * Generates a cinematic visual story using HuggingFace (legacy, kept for compat)
   * @param {Array<Object>} subtitles
   * @returns {Promise<string>} Generated story
   */
  async generateStory(subtitles) {
    return huggingfaceService.generateStory(subtitles);
  }

  /**
   * Generates optimized search tags using Groq, with fallback to local NLP.
   * @param {Array<Object>} subtitles
   * @param {string} story
   * @returns {Promise<Array<Object>>} Subtitles with tags
   */
  async generateTagsFromSupers(subtitles, story = '') {
    const apiKey = keyService.getKey('GROK_API_KEY');

    if (!apiKey) {
      console.warn('[AIService] GROK_API_KEY not set. Extracting tags using local NLP.');
      return tagGeneratorService.generateTagsForSubtitles(subtitles);
    }

    const fullScript = subtitles.map(s => s.text).join('\n');

    const systemPrompt =
      `You are a visual stock footage search expert.
Given a video story and script, generate the best Pexels/Pixabay search tags.
Return ONLY a JSON object with key "tags" containing an array of strings.
Example: {"tags": ["woman choosing outfit mirror", "colorful fabric close up"]}
Rules: 2-5 words, visual and specific, no abstract tags, max 50, no duplicates.`;

    try {
      console.log('[AIService] Generating global tag pool via Groq...');
      const raw = await this._groqChat(
        systemPrompt,
        `Story:\n"${story}"\n\nScript:\n"${fullScript.slice(0, 800)}"`,
        { temperature: 0.3, max_tokens: 600, json: true }
      );

      const parsed = JSON.parse(raw);
      const rawTags = Array.isArray(parsed) ? parsed : (parsed.tags || []);
      let globalTags = [...new Set(
        rawTags.map(t => String(t).trim().toLowerCase())
               .filter(t => t.length > 3 && t.split(' ').length >= 2)
      )].slice(0, 50);

      console.log(`[AIService] ✓ Generated ${globalTags.length} global tags via Groq.`);
      return this._mapTagsToSubtitles(subtitles, globalTags);

    } catch (error) {
      console.error('[AIService] Groq tag generation failed, falling back to local NLP:', error.message);
      return tagGeneratorService.generateTagsForSubtitles(subtitles);
    }
  }

  /**
   * Combined story + tags generation in a single optimized call.
   * @param {Array<Object>} subtitles
   * @returns {Promise<Object>} { story, subtitles: Array<{ id, tags }> }
   */
  async generateStoryAndTags(subtitles) {
    try {
      const { story, tags } = await this.generateStoryWithTags(subtitles);
      const subtitlesWithTags = this._mapTagsToSubtitles(subtitles, tags);
      return { story, subtitles: subtitlesWithTags };
    } catch (err) {
      return this.generateLocalFallback(subtitles);
    }
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  /**
   * Parses the combined Gemini output that has story text + TAGS: line
   * @param {string} rawText
   * @returns {{ story: string, tags: string[] }}
   */
  _parseStoryAndTags(rawText) {
    const tagsMarker = rawText.lastIndexOf('\nTAGS:');
    let storyPart = rawText;
    let tagPart = '';

    if (tagsMarker !== -1) {
      storyPart = rawText.substring(0, tagsMarker).trim();
      tagPart = rawText.substring(tagsMarker + 6).trim(); // after "TAGS:"
    }

    // Parse comma-separated tags
    let tags = tagPart
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 3 && t.split(' ').length >= 2);

    // Deduplicate and enforce 50 max
    tags = [...new Set(tags)].slice(0, 50);

    return { story: storyPart, tags };
  }

  /**
   * Maps a global pool of tags to each subtitle by finding the best keyword matches.
   * Each subtitle gets 1–3 tags from the pool.
   * @param {Array<Object>} subtitles
   * @param {string[]} globalTags
   * @returns {Array<Object>}
   */
  _mapTagsToSubtitles(subtitles, globalTags) {
    return subtitles.map(sub => {
      const subWords = sub.text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);

      // Score each global tag by how many of its words appear in the subtitle text
      const scored = globalTags.map(tag => {
        const tagWords = tag.split(/\s+/);
        const score = tagWords.filter(tw => subWords.some(sw => sw.includes(tw) || tw.includes(sw))).length;
        return { tag, score };
      });

      // Sort by score descending, take top 2 matching tags
      scored.sort((a, b) => b.score - a.score);
      let bestTags = scored.filter(s => s.score > 0).slice(0, 2).map(s => s.tag);

      // If no keywords matched, fall back to 2 general tags from the pool
      if (bestTags.length === 0) {
        bestTags = globalTags.slice(0, 2);
      }

      return {
        ...sub,
        tags: bestTags,
        extractedGroups: {
          nouns: bestTags,
          cinematicPhrases: bestTags
        }
      };
    });
  }

  /**
   * Local rule-based fallback that generates a story + tags without any API
   */
  generateLocalFallback(subtitles) {
    const fullScript = subtitles.map(s => s.text).join(' ');

    const themes = [
      {
        keywords: ['work', 'office', 'laptop', 'typing', 'business', 'code', 'develop'],
        name: 'Modern Tech & Workspace',
        desc: 'A sleek, corporate workspace story. The camera pans across modern loft offices, showing close-ups of developers coding on glowing keypads, focused teamwork, and refreshing coffee cups on clean desks. The overall tone is productive, professional, and forward-thinking, matching a warm, high-contrast color scheme.'
      },
      {
        keywords: ['nature', 'forest', 'mountains', 'beach', 'river', 'travel', 'adventure'],
        name: 'Outdoor Nature & Travel',
        desc: 'An immersive natural landscape narrative. Visuals feature sweeping drone shots of dense pine forests shrouded in morning mist, golden hour waves crashing gently on sandy shores, and adventurers hiking along serene mountain trails. The color grading emphasizes lush greens, deep earthy tones, and warm sunset highlights.'
      },
      {
        keywords: ['success', 'goal', 'win', 'improve', 'grow', 'future', 'lead'],
        name: 'Inspirational & Motivating',
        desc: 'A powerful, human-centric motivational story. The visual flow follows individuals climbing stairs, standing at peaks looking over majestic cities, and walking with confidence. Subtle slow-motion captures real emotion, focusing on determined facial expressions and broad, triumphant horizons.'
      },
      {
        keywords: ['color', 'style', 'fashion', 'outfit', 'clothes', 'dress', 'wear'],
        name: 'Fashion & Style',
        desc: 'A vibrant, color-drenched fashion narrative. The visuals open with close-ups of rich fabric textures, bold jewel tones hanging in sunlit boutiques, and confident individuals stepping into rooms dressed to impress. Slow pans reveal curated outfit details — a silk pastel blouse, structured blazer shoulders, and clean white sneakers catching the light.'
      }
    ];

    let matchedTheme = themes[0];
    for (const t of themes) {
      if (t.keywords.some(kw => fullScript.toLowerCase().includes(kw))) {
        matchedTheme = t;
        break;
      }
    }

    const story = `Video Story – ${matchedTheme.name}\n\n${matchedTheme.desc}\n\nThis cohesive storyboard utilizes modern framing (such as tight macro shots and expansive wide-angle panoramas) to create a premium flow. It is designed to match the pacing of your script while focusing on high-quality human engagement and beautiful atmospheric details.`;

    // Build a flat deduplicated tag pool from all subtitles via local NLP (max 30)
    const tagSet = new Set();
    for (const sub of subtitles) {
      try {
        const generated = tagGeneratorService.generateTagsFromText(sub.text);
        generated.all.slice(0, 2).forEach(t => { if (t && t.trim()) tagSet.add(t.trim()); });
      } catch (e) { /* skip */ }

      if (tagSet.size < 3) {
        const words = sub.text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        if (words.length >= 2) tagSet.add(`${words[0]} ${words[1]}`);
      }

      if (tagSet.size >= 30) break;
    }

    // Ensure a minimum sensible set for fashion/style/color content
    if (tagSet.size < 5) {
      ['colorful outfit flat lay', 'woman choosing clothes mirror', 'jewel tone fabric close up',
        'confident walk city street', 'pastel color palette fashion',
        'blue outfit professional look', 'red dress bold statement'].forEach(t => tagSet.add(t));
    }

    const tags = [...tagSet].slice(0, 30);
    return { story, tags };
  }
}

module.exports = new AIService();
