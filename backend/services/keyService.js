const fs = require('fs-extra');
const path = require('path');

class KeyService {
  constructor() {
    this.configDir = path.join(__dirname, '..', 'config');
    this.configFile = path.join(this.configDir, 'custom_keys.json');
    this.customKeys = {};

    this.managedKeys = [
      { keyName: 'GROK_API_KEY', label: 'Groq Llama AI', signupUrl: 'https://console.groq.com/keys', description: 'Used for AI script transcription, cinematic story creation & visual keyword extraction.' },
      { keyName: 'PEXELS_API_KEY', label: 'Pexels Stock API', signupUrl: 'https://www.pexels.com/api/', description: 'Primary high-definition stock video & image provider.' },
      { keyName: 'PIXABAY_API_KEY', label: 'Pixabay Stock API', signupUrl: 'https://pixabay.com/api/docs/', description: 'Secondary HD stock video, background graphics & shape overlay engine.' },
      { keyName: 'UNSPLASH_ACCESS_KEY', label: 'Unsplash Photo API', signupUrl: 'https://unsplash.com/developers', description: 'Curated aesthetic visual photography fallback engine.' },
      { keyName: 'VECTEEZY_API_KEY', label: 'Vecteezy Graphic API', signupUrl: 'https://www.vecteezy.com/api', description: 'Premium vector & graphical visual asset engine.' },
      { keyName: 'GEMINI_API_KEY', label: 'Google Gemini AI', signupUrl: 'https://aistudio.google.com/app/apikey', description: 'Alternative multi-modal narrative generator.' },
      { keyName: 'PINTEREST_API_KEY', label: 'Pinterest Visual API', signupUrl: 'https://developers.pinterest.com/', description: 'Visual aesthetic reference board engine.' }
    ];

    this._loadCustomKeys();
  }

  /**
   * Load custom keys from disk
   */
  _loadCustomKeys() {
    try {
      if (fs.existsSync(this.configFile)) {
        this.customKeys = fs.readJsonSync(this.configFile) || {};
      }
    } catch (err) {
      console.warn('[KeyService] Failed to load custom_keys.json:', err.message);
      this.customKeys = {};
    }
  }

  /**
   * Save custom keys to disk
   */
  _saveCustomKeys() {
    try {
      fs.ensureDirSync(this.configDir);
      fs.writeJsonSync(this.configFile, this.customKeys, { spaces: 2 });
    } catch (err) {
      console.error('[KeyService] Failed to save custom_keys.json:', err.message);
    }
  }

  /**
   * Gets active API key, prioritizing:
   * 1. Request header (x-key-name)
   * 2. Saved custom user key in custom_keys.json
   * 3. Environment variable in .env
   */
  getKey(keyName, req = null) {
    // Check request headers (convert GROK_API_KEY -> x-grok-api-key)
    if (req && req.headers) {
      const headerName = `x-${keyName.toLowerCase().replace(/_/g, '-')}`;
      if (req.headers[headerName]) {
        return String(req.headers[headerName]).trim().replace(/^['"]|['"]$/g, '');
      }
    }

    // Check custom saved keys
    if (this.customKeys[keyName] && String(this.customKeys[keyName]).trim()) {
      return String(this.customKeys[keyName]).trim().replace(/^['"]|['"]$/g, '');
    }

    // Check process.env fallback
    if (process.env[keyName] && String(process.env[keyName]).trim()) {
      return String(process.env[keyName]).trim().replace(/^['"]|['"]$/g, '');
    }

    return '';
  }

  /**
   * Returns metadata and current status for all managed keys
   */
  getAllKeyStatuses(req = null) {
    const isProductionOrVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
    const allowReset = !isProductionOrVercel;

    const keys = this.managedKeys.map(item => {
      const { keyName, label, signupUrl, description } = item;
      const customVal = (this.customKeys[keyName] || '').trim();
      const envVal = (process.env[keyName] || '').trim().replace(/^['"]|['"]$/g, '');
      const activeVal = this.getKey(keyName, req);

      let status = 'missing'; // 'custom' | 'default' | 'missing'
      if (customVal) {
        status = 'custom';
      } else if (envVal) {
        status = 'default';
      }

      let maskedValue = '';
      if (activeVal) {
        if (activeVal.length > 8) {
          maskedValue = `${activeVal.slice(0, 4)}...${activeVal.slice(-4)}`;
        } else {
          maskedValue = '••••••••';
        }
      }

      return {
        keyName,
        label,
        signupUrl,
        description,
        status,
        maskedValue,
        hasCustom: !!customVal,
        hasDefault: !!envVal,
        isConfigured: !!activeVal
      };
    });

    return {
      allowReset,
      keys
    };
  }

  /**
   * Save or update custom API keys
   * @param {Object} keysObj Key-value pairs of keyName -> value
   */
  saveKeys(keysObj = {}) {
    for (const item of this.managedKeys) {
      const keyName = item.keyName;
      if (keyName in keysObj) {
        const val = String(keysObj[keyName] || '').trim();
        if (val) {
          this.customKeys[keyName] = val;
        } else {
          delete this.customKeys[keyName];
        }
      }
    }
    this._saveCustomKeys();
    return this.getAllKeyStatuses();
  }

  /**
   * Reset all custom API keys back to default environment settings
   */
  resetKeys() {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('Resetting system default API keys is disabled on global production deployment.');
    }
    this.customKeys = {};
    this._saveCustomKeys();
    return this.getAllKeyStatuses();
  }
}

module.exports = new KeyService();
