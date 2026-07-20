const Parser = require('srt-parser-2').default;

class SrtParserService {
  constructor() {
    this.parser = new Parser();
  }

  /**
   * Format any timestamp (e.g. 00:00:01,000, 00:00:01.000, 01:23.400) to standard HH:MM:SS format
   * @param {string} timeStr 
   * @returns {string}
   */
  formatTimestamp(timeStr) {
    if (!timeStr) return '00:00:00';
    let cleanStr = String(timeStr).trim().replace('.', ',');
    let parts = cleanStr.split(',')[0].split(':');
    if (parts.length === 2) {
      // MM:SS -> 00:MM:SS
      parts.unshift('00');
    }
    return parts.map(p => p.padStart(2, '0')).slice(0, 3).join(':');
  }

  /**
   * Strip HTML tags (<font>, <i>, <b>) and SSA/ASS tags ({\an8}) from subtitle dialogue
   * @param {string} text 
   * @returns {string}
   */
  stripHtmlAndFormatting(text) {
    if (!text) return '';
    return String(text)
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/\{[^}]*\}/g, '') // Strip SSA/ASS tags like {\an8}
      .replace(/\r?\n/g, ' ')
      .trim();
  }

  /**
   * Parse SRT file content or raw string buffer into a clean JSON array
   * Supports standard .srt, WebVTT .vtt, period timestamps, single arrows ->, non-standard line endings, and HTML styling tags.
   * @param {string} srtContent 
   * @returns {Array<Object>}
   */
  parse(srtContent) {
    if (!srtContent || typeof srtContent !== 'string') {
      throw new Error('Invalid subtitle content provided. Content must be a valid text string.');
    }

    // Normalize line endings and strip BOM markers
    const cleanedContent = srtContent
      .replace(/^\uFEFF/, '')
      .replace(/^\uFFFE/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    if (!cleanedContent.trim()) {
      throw new Error('Subtitle file is empty.');
    }

    let results = [];

    // Stage 1: Try srt-parser-2 primary parser
    try {
      const parsed = this.parser.fromSrt(cleanedContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        results = parsed.map((item, index) => {
          return {
            id: String(item.id || index + 1),
            start: this.formatTimestamp(item.startTime),
            end: this.formatTimestamp(item.endTime),
            text: this.stripHtmlAndFormatting(item.text)
          };
        }).filter(item => item.text.length > 0);
      }
    } catch (e) {
      console.warn('[SrtParserService] Primary parser error, triggering regex fallback:', e.message);
    }

    // Stage 2: Fallback Regex Parser (handles missing cue IDs, single arrows, VTT headers, period timestamps)
    if (results.length === 0) {
      console.log('[SrtParserService] Running Fallback Regex Parser...');
      // Matches timestamp lines: 00:00:01,000 --> 00:00:03,000 or 00:00:01.000 -> 00:00:03.000 or 00:01.000 --> 00:03.000
      const timeRegex = /(?:^|\n)(?:(\d+)\s*\n)?(\d{1,2}:\d{2}(?::\d{2})?(?:[\.,]\d{1,3})?)\s*(?:-->|->)\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[\.,]\d{1,3})?)/g;

      let match;
      const matches = [];
      while ((match = timeRegex.exec(cleanedContent)) !== null) {
        matches.push({
          index: match.index,
          id: match[1],
          startTime: match[2],
          endTime: match[3],
          contentStartIndex: match.index + match[0].length
        });
      }

      for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const nextMatchIndex = i + 1 < matches.length ? matches[i + 1].index : cleanedContent.length;
        const rawText = cleanedContent.slice(current.contentStartIndex, nextMatchIndex);
        const cleanText = this.stripHtmlAndFormatting(rawText);

        if (cleanText) {
          results.push({
            id: String(current.id || i + 1),
            start: this.formatTimestamp(current.startTime),
            end: this.formatTimestamp(current.endTime),
            text: cleanText
          });
        }
      }
    }

    if (results.length === 0) {
      throw new Error('Failed to parse subtitle file. No valid subtitle timestamps (e.g. 00:00:01,000 --> 00:00:03,000) were found in the uploaded file.');
    }

    return results;
  }
}

module.exports = new SrtParserService();
