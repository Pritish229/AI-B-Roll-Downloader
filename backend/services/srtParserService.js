const Parser = require('srt-parser-2').default;

class SrtParserService {
  constructor() {
    this.parser = new Parser();
  }

  /**
   * Parse SRT file content into a clean JSON array
   * @param {string} srtContent 
   * @returns {Array<Object>}
   */
  parse(srtContent) {
    if (!srtContent || typeof srtContent !== 'string') {
      throw new Error('Invalid SRT file content');
    }

    try {
      const parsed = this.parser.fromSrt(srtContent);
      return parsed.map((item, index) => {
        // Strip milliseconds to match user example format "00:00:01"
        const start = item.startTime ? item.startTime.split(',')[0] : '00:00:00';
        const end = item.endTime ? item.endTime.split(',')[0] : '00:00:00';
        
        return {
          id: item.id || String(index + 1),
          start,
          end,
          text: item.text ? item.text.trim().replace(/\r?\n/g, ' ') : ''
        };
      }).filter(item => item.text.length > 0);
    } catch (error) {
      console.error('Error in SrtParserService:', error);
      throw new Error('Failed to parse SRT file. Please ensure it is a valid subtitle file.');
    }
  }
}

module.exports = new SrtParserService();
