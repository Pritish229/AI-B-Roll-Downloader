const nlp = require('compromise');
const keywordExtractor = require('keyword-extractor');

class TagGeneratorService {
  /**
   * Intelligently generates tags from a text string, categorized by type.
   * @param {string} text 
   * @returns {Object} { nouns, cinematicPhrases, locations, activities, emotions, objects, all: string[] }
   */
  generateTagsFromText(text) {
    if (!text || typeof text !== 'string') {
      return { nouns: [], cinematicPhrases: [], locations: [], activities: [], emotions: [], objects: [], all: [] };
    }

    const cleanText = text.trim();
    const doc = nlp(cleanText);

    // 1. NLP POS Tagging
    const nouns = doc.nouns().out('array').map(n => n.toLowerCase());
    const verbs = doc.verbs().out('array').map(v => v.toLowerCase());
    const adjectives = doc.adjectives().out('array').map(a => a.toLowerCase());
    const places = doc.places().out('array').map(p => p.toLowerCase());

    // 2. Keyword Extraction (cleans up stop words)
    const keywords = keywordExtractor.extract(cleanText, {
      language: 'english',
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true
    });

    // 3. Classify Locations
    const locationKeywords = ['office', 'home', 'kitchen', 'room', 'street', 'city', 'park', 'forest', 'beach', 'restaurant', 'cafe', 'school', 'hospital', 'outdoor', 'indoor', 'building', 'workspace', 'studio', 'house', 'garden', 'nature'];
    const locations = [];
    places.forEach(p => locations.push(p));
    locationKeywords.forEach(loc => {
      if (cleanText.toLowerCase().includes(loc) && !locations.includes(loc)) {
        locations.push(loc);
      }
    });

    // 4. Classify Emotions
    const emotionKeywords = ['happy', 'sad', 'angry', 'confident', 'joy', 'fear', 'scared', 'excited', 'crying', 'laughing', 'smiling', 'focused', 'stressed', 'frustrated', 'calm', 'peaceful', 'thoughtful', 'serious', 'proud', 'love', 'funny', 'cheerful'];
    const emotions = [];
    adjectives.forEach(adj => {
      if (emotionKeywords.includes(adj)) emotions.push(adj);
    });
    emotionKeywords.forEach(emo => {
      if (cleanText.toLowerCase().includes(emo) && !emotions.includes(emo)) {
        emotions.push(emo);
      }
    });

    // 5. Classify Objects
    const objectKeywords = ['laptop', 'computer', 'phone', 'smartphone', 'tablet', 'desk', 'table', 'chair', 'coffee', 'cup', 'food', 'dinner', 'lunch', 'breakfast', 'car', 'vehicle', 'pen', 'notebook', 'bag', 'camera', 'plant', 'clock', 'screen', 'glasses', 'documents'];
    const objects = [];
    nouns.forEach(noun => {
      if (objectKeywords.includes(noun)) objects.push(noun);
    });
    objectKeywords.forEach(obj => {
      if (cleanText.toLowerCase().includes(obj) && !objects.includes(obj)) {
        objects.push(obj);
      }
    });

    // 6. Activities (Verbs + Nouns context)
    const activities = [];
    // e.g. "eating dinner", "using laptop"
    verbs.forEach(v => {
      if (v.length > 2 && !['is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did'].includes(v)) {
        nouns.forEach(n => {
          if (cleanText.toLowerCase().indexOf(v) < cleanText.toLowerCase().indexOf(n)) {
            activities.push(`${v} ${n}`);
          }
        });
      }
    });
    
    // Add common action keywords
    const actionKeywords = ['typing', 'writing', 'walking', 'running', 'drinking', 'talking', 'speaking', 'smiling', 'working', 'cooking', 'reading', 'meeting', 'negotiating', 'exercising', 'coding', 'designing', 'explaining', 'listening', 'helping', 'teaching', 'building'];
    actionKeywords.forEach(action => {
      if (cleanText.toLowerCase().includes(action)) {
        const nounFound = nouns.find(n => n !== 'someone' && n !== 'person');
        if (nounFound) {
          activities.push(`${action} ${nounFound}`);
        } else {
          activities.push(action);
        }
      }
    });

    // 7. Cinematic Phrases
    const cinematicPhrases = [];
    
    // Multi-word combination: [adjective] + [noun]
    if (adjectives.length > 0 && nouns.length > 0) {
      adjectives.forEach(adj => {
        nouns.forEach(noun => {
          if (cleanText.toLowerCase().includes(`${adj} ${noun}`)) {
            cinematicPhrases.push(`${adj} ${noun}`);
          }
        });
      });
    }

    // Noun + Location/Object combination
    if (nouns.length > 1) {
      const primaryNoun = nouns[0];
      const secondaryNoun = nouns[1];
      if (primaryNoun !== secondaryNoun) {
        cinematicPhrases.push(`${primaryNoun} ${secondaryNoun}`);
      }
    }

    // Default multi-word tags based on script text
    const shortPhrase = cleanText
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(' ')
      .filter(w => w.length > 2 && !['and', 'the', 'for', 'with', 'that', 'this', 'from', 'here', 'there'].includes(w))
      .slice(0, 4)
      .join(' ');
      
    if (shortPhrase && shortPhrase.split(' ').length > 1) {
      cinematicPhrases.push(shortPhrase);
    }

    // Add cinematic style multi-word variations
    if (nouns.length > 0) {
      const mainSubject = nouns[0];
      if (locations.length > 0) {
        cinematicPhrases.push(`${mainSubject} in ${locations[0]}`);
      }
      cinematicPhrases.push(`cinematic ${mainSubject}`);
      cinematicPhrases.push(`${mainSubject} slow motion`);
    }

    // 8. Single Word Tags (filtered nouns & key terms)
    const filteredNouns = keywords.filter(w => w.length > 2 && !locationKeywords.includes(w) && !emotionKeywords.includes(w));

    // Combine all unique tags for search, prioritising high value cinematic phrases
    const allSet = new Set();
    
    // Order matters - we want the most descriptive tags first
    cinematicPhrases.forEach(tag => allSet.add(tag.trim()));
    activities.forEach(tag => allSet.add(tag.trim()));
    locations.forEach(tag => {
      if (nouns.length > 0 && nouns[0] !== tag) {
        allSet.add(`${nouns[0]} ${tag}`.trim());
      }
      allSet.add(tag.trim());
    });
    emotions.forEach(tag => {
      if (nouns.length > 0) {
        allSet.add(`${tag} ${nouns[0]}`.trim());
      }
      allSet.add(tag.trim());
    });
    objects.forEach(tag => allSet.add(tag.trim()));
    filteredNouns.forEach(tag => allSet.add(tag.trim()));
    
    // Add default fallbacks if we failed to extract anything
    if (allSet.size === 0) {
      allSet.add('cinematic video');
      allSet.add('aesthetic background');
    }

    const allTags = Array.from(allSet).filter(t => t.length > 2).slice(0, 10); // Limit to top 10

    return {
      nouns: Array.from(new Set(filteredNouns)).slice(0, 5),
      cinematicPhrases: Array.from(new Set(cinematicPhrases)).slice(0, 5),
      locations: Array.from(new Set(locations)).slice(0, 3),
      activities: Array.from(new Set(activities)).slice(0, 4),
      emotions: Array.from(new Set(emotions)).slice(0, 3),
      objects: Array.from(new Set(objects)).slice(0, 4),
      all: allTags
    };
  }

  /**
   * Processes a list of subtitles and returns the list with generated tags
   * @param {Array<Object>} subtitles 
   * @returns {Array<Object>}
   */
  generateTagsForSubtitles(subtitles) {
    if (!subtitles || !Array.isArray(subtitles)) {
      throw new Error('Subtitles must be an array');
    }

    return subtitles.map(sub => {
      const generated = this.generateTagsFromText(sub.text);
      return {
        ...sub,
        tags: generated.all,
        extractedGroups: {
          nouns: generated.nouns,
          cinematicPhrases: generated.cinematicPhrases,
          locations: generated.locations,
          activities: generated.activities,
          emotions: generated.emotions,
          objects: generated.objects
        }
      };
    });
  }
}

module.exports = new TagGeneratorService();
