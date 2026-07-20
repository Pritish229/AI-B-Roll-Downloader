const axios = require('axios');

class HuggingFaceService {
  constructor() {
    this.apiKey = (process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    // Using a fast, modern open-source model
    this.modelName = 'mistralai/Mistral-7B-Instruct-v0.3';
    this.apiUrl = `https://api-inference.huggingface.co/models/${this.modelName}`;
  }

  /**
   * Generates a cinematic visual story for the video script using Hugging Face Serverless Inference API
   * @param {Array<Object>} subtitles 
   * @returns {Promise<string>} Generated story
   */
  async generateStory(subtitles) {
    const fullScript = subtitles.map(s => s.text).join(' ');

    const prompt = `[INST] You are a world-class cinematic video director, B-Roll producer, and visual storyteller.
Analyze the following video script:
"${fullScript}"

Your goal is to write a coherent "Visual Story" (a 2-3 paragraph detailed, visually-rich description of the video flow, setting the mood, color tones, setting, transitions, and the general B-Roll vibe that maps to this script).
Be descriptive and focus on stock video imagery, color palettes, and cinematic camera movements.

Write ONLY the 2-3 paragraphs story description itself. Do not include introductory text, explanations, or titles. Just output the story paragraphs directly. [/INST]`;

    // If API key is not present, warn and go straight to local fallback to save time and prevent errors
    if (!this.apiKey) {
      console.warn('========================================================================');
      console.warn(' [WARNING] HUGGINGFACE_API_KEY is not set in .env!');
      console.warn(' Falling back to highly optimized local NLP Narrative Generator.');
      console.warn('========================================================================');
      return this.generateLocalFallback(subtitles);
    }

    try {
      console.log(`Sending request to Hugging Face API using model ${this.modelName}...`);
      const response = await axios.post(
        this.apiUrl,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 15000 // 15 seconds timeout
        }
      );

      let storyText = '';
      if (Array.isArray(response.data) && response.data[0] && response.data[0].generated_text) {
        storyText = response.data[0].generated_text.trim();
      } else if (response.data && response.data.generated_text) {
        storyText = response.data.generated_text.trim();
      }

      // If the response is empty or contains model loading warnings, throw to trigger fallback
      if (!storyText || storyText.includes('is currently loading') || storyText.length < 50) {
        throw new Error('HF Model returned incomplete or empty narrative');
      }

      // Clean up any potential prompt remnants in response
      storyText = storyText.replace(/\[INST\].*?\[\/INST\]/gs, '').trim();

      console.log('✓ Successfully generated cinematic story via Hugging Face API.');
      return storyText;
    } catch (error) {
      console.error('Error calling Hugging Face API, falling back to local NLP Narrative Generator:', error.message);
      return this.generateLocalFallback(subtitles);
    }
  }

  /**
   * Premium rule-based local storyboard builder that acts as a robust fallback
   * @param {Array<Object>} subtitles 
   * @returns {string} Story text
   */
  generateLocalFallback(subtitles) {
    const fullScript = subtitles.map(s => s.text).join(' ');

    const themes = [
      {
        keywords: ['work', 'office', 'laptop', 'typing', 'business', 'code', 'develop', 'project', 'company', 'startup', 'strategy', 'goal'],
        name: 'Modern Corporate Tech & Creative Workspace',
        story: `The video opens with a shallow depth-of-field close-up of fingers typing fluidly on a sleek backlit keyboard in a sun-drenched loft office. Cool blue light streams from screen interfaces, casting soft shadows across a solid oak desk where a warm ceramic coffee cup gently steams. Visual transitions are sharp and rhythmic, showing snippets of charts on glass whiteboards and creative thinkers sharing high-fives in modern collaborative zones.

As the narrative progresses, the scenery shifts towards focused, cinematic close-ups of digital screens with code compilers and UI prototypes in progress. The color grading is highly premium—incorporating rich charcoal shadows, deep navy tones, and soft amber golden-hour sunlight diffusing through large window panes. 

The story wraps up with a satisfying wide shot of the modern tech center at twilight, looking out at the city lights. This sequence projects a sense of focus, professionalism, and ambitious execution, establishing an energetic, forward-thinking corporate visual atmosphere.`
      },
      {
        keywords: ['nature', 'forest', 'mountains', 'beach', 'river', 'travel', 'adventure', 'explore', 'hike', 'world', 'green', 'sky', 'sun'],
        name: 'Epic Natural Landscapes & Outdoor Adventure',
        story: `The video takes flight with a breathtaking drone sequence gliding smoothly over a dense pine forest blanketed in early morning mist. Golden sunrise beams slice through towering canopy branches, highlighting crisp dew drops and rich dark-green pine needles. The camera slowly pivots to trace a tranquil winding river cut deep into a mountain valley.

We follow with slow-motion ground-level tracking shots of an adventurer stepping along damp, earth-toned trails scattered with golden autumn leaves. The cinematic tone shifts to rich teal-and-orange grading, bringing warm sunset highlights to jagged granite cliffs and gentle, rolling ocean waves breaking over golden sand. 

The story ends with an expansive panorama of a vast landscape under a starry evening sky, capturing the immense beauty and sheer grandeur of the wild. The visual journey leaves the viewer with a deep sense of wanderlust, freedom, and peaceful exploration.`
      },
      {
        keywords: ['success', 'goal', 'win', 'improve', 'grow', 'future', 'lead', 'inspire', 'motivate', 'dream', 'achieve', 'power', 'life'],
        name: 'High-Impact Inspirational & Motivational Narrative',
        story: `The scene opens in deep silence, featuring a dramatic close-up of a runner tying their shoelaces under the cold, misty light of a city streetlamp at dawn. The camera moves with a slow, deliberate pan up to their determined face, catching sweat reflecting the streetlights. Every cut is measured, highlighting the raw effort and human grit in slow-motion detail.

As the energy builds, the visuals transition to spectacular shots of a figure standing atop a majestic skyscraper, looking out at a sprawling metropolis at twilight as the lights flicker on. Vibrant, warm golden tones flood the frame, contrasting with the dark cool tones of the city.

The storyboard reaches its climax with shots of proud faces, bright smiles, and triumphant handshakes. The final sequence shows an open road stretching toward a bright, wide horizon, illustrating a feeling of boundless potential, unbreakable determination, and ultimate success.`
      }
    ];

    // Attempt to match keywords
    let matchedTheme = themes[0];
    let maxMatches = 0;

    for (const theme of themes) {
      let matches = 0;
      for (const keyword of theme.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const count = (fullScript.match(regex) || []).length;
        matches += count;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        matchedTheme = theme;
      }
    }

    console.log(`✓ Local NLP Engine mapped script to theme: "${matchedTheme.name}"`);
    return `[Cinematic Vibe: ${matchedTheme.name}]\n\n${matchedTheme.story}`;
  }
}

module.exports = new HuggingFaceService();
