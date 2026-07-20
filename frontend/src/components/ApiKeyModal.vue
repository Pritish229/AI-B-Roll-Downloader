<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      @click.self="close"
    >
      <div class="relative w-full max-w-3xl glass-panel bg-[#141419]/95 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-editor-border/60 flex items-center justify-between bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white tracking-wide">API Keys & Provider Settings</h3>
              <p class="text-xs text-gray-400">Replace default API keys with your own keys for unlimited rates & custom access.</p>
            </div>
          </div>
          <button 
            @click="close"
            class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- System Key Info Banner -->
        <div class="px-6 py-3 bg-purple-950/30 border-b border-purple-800/30 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-purple-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Leave any field blank to use default built-in server keys automatically.</span>
          </div>
          <button 
            @click="resetToDefaults"
            :disabled="isSaving"
            class="text-purple-400 hover:text-purple-200 underline font-semibold transition-colors flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All to System Defaults
          </button>
        </div>

        <!-- Keys List Form -->
        <div class="flex-grow p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <div v-if="successMsg" class="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ successMsg }}
          </div>

          <div v-if="errorMsg" class="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ errorMsg }}
          </div>

          <div 
            v-for="item in keyList" 
            :key="item.keyName"
            class="p-4 bg-editor-surface/40 border border-editor-border/60 rounded-xl hover:border-purple-500/40 transition-all space-y-2.5"
          >
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2.5">
                <span class="font-bold text-sm text-white">{{ item.label }}</span>
                <!-- Status Badge -->
                <span 
                  v-if="item.status === 'custom'" 
                  class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Custom Key Active
                </span>
                <span 
                  v-else-if="item.status === 'default'" 
                  class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-500/50"
                >
                  System Default Active
                </span>
                <span 
                  v-else 
                  class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/50"
                >
                  Not Configured
                </span>
              </div>

              <!-- Direct Link to Create API Key -->
              <a 
                :href="item.signupUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:text-white bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 rounded-lg transition-all"
                title="Open provider website to generate your API key"
              >
                <span>🔗 Get API Key</span>
                <svg class="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <p class="text-xs text-gray-400 leading-relaxed">{{ item.description }}</p>

            <!-- Key Input -->
            <div class="relative flex items-center">
              <input 
                :type="showKeys[item.keyName] ? 'text' : 'password'"
                v-model="formKeys[item.keyName]"
                :placeholder="item.maskedValue ? `Current: ${item.maskedValue} (Enter new value to update)` : 'Paste your API key here...'"
                class="w-full bg-[#0A0A0D] border border-editor-border/80 focus:border-purple-500 rounded-lg px-3.5 py-2 pr-10 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
              />
              <button 
                type="button"
                @click="toggleShowKey(item.keyName)"
                class="absolute right-2.5 text-gray-500 hover:text-gray-300 p-1"
                title="Toggle key visibility"
              >
                <svg v-if="!showKeys[item.keyName]" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.018 10.018 0 014.122-.963c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-4.018-4.018a3 3 0 00-4.243-4.243M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-editor-border/60 bg-[#0F0F13] flex items-center justify-between">
          <span class="text-[11px] text-gray-500">Keys are encrypted & stored in your local workspace environment.</span>
          <div class="flex items-center gap-3">
            <button 
              @click="close"
              class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="saveKeys"
              :disabled="isSaving"
              class="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-glow-accent transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg v-if="isSaving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSaving ? 'Saving Keys...' : 'Save & Apply Keys' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, reactive, watch, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'ApiKeyModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const keyList = ref([]);
    const formKeys = reactive({});
    const showKeys = reactive({});
    const isSaving = ref(false);
    const successMsg = ref('');
    const errorMsg = ref('');

    const fetchKeyStatuses = async () => {
      try {
        const response = await axios.get('/api/config/keys');
        if (response.data && response.data.keys) {
          keyList.value = response.data.keys;
        }
      } catch (err) {
        console.error('Failed to fetch API key statuses:', err);
      }
    };

    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        successMsg.value = '';
        errorMsg.value = '';
        fetchKeyStatuses();
      }
    });

    onMounted(() => {
      if (props.isOpen) {
        fetchKeyStatuses();
      }
    });

    const toggleShowKey = (keyName) => {
      showKeys[keyName] = !showKeys[keyName];
    };

    const saveKeys = async () => {
      isSaving.value = true;
      successMsg.value = '';
      errorMsg.value = '';

      try {
        const payload = {};
        for (const item of keyList.value) {
          const keyName = item.keyName;
          if (formKeys[keyName] !== undefined && formKeys[keyName] !== null) {
            payload[keyName] = formKeys[keyName];
          }
        }

        const response = await axios.post('/api/config/keys', payload);
        if (response.data && response.data.keys) {
          keyList.value = response.data.keys;
          // Clear inputs
          Object.keys(formKeys).forEach(k => { formKeys[k] = ''; });
          successMsg.value = 'API keys updated successfully! Applied to active searches & transcriptions.';
          emit('updated', response.data.keys);
          setTimeout(() => {
            successMsg.value = '';
          }, 3000);
        }
      } catch (err) {
        console.error('Failed to save API keys:', err);
        errorMsg.value = err.response?.data?.error || 'Failed to save API keys.';
      } finally {
        isSaving.value = false;
      }
    };

    const resetToDefaults = async () => {
      if (!confirm('Are you sure you want to reset all API keys to the system default settings?')) {
        return;
      }

      isSaving.value = true;
      successMsg.value = '';
      errorMsg.value = '';

      try {
        const response = await axios.post('/api/config/keys/reset');
        if (response.data && response.data.keys) {
          keyList.value = response.data.keys;
          Object.keys(formKeys).forEach(k => { formKeys[k] = ''; });
          successMsg.value = 'All API keys reset to system defaults.';
          emit('updated', response.data.keys);
          setTimeout(() => {
            successMsg.value = '';
          }, 3000);
        }
      } catch (err) {
        console.error('Failed to reset API keys:', err);
        errorMsg.value = err.response?.data?.error || 'Failed to reset API keys.';
      } finally {
        isSaving.value = false;
      }
    };

    const close = () => {
      emit('close');
    };

    return {
      keyList,
      formKeys,
      showKeys,
      isSaving,
      successMsg,
      errorMsg,
      toggleShowKey,
      saveKeys,
      resetToDefaults,
      close
    };
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.6);
}
</style>
