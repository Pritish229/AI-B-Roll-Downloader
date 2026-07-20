<template>
  <div class="flex-grow flex flex-col h-[calc(100vh-140px)] overflow-hidden">
    <!-- Header panel -->
    <div class="glass-panel p-4 px-6 border-b border-editor-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-0.5 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-lg text-xs font-bold font-mono">
          Step 4: Confirm Tags
        </span>
        <h2 class="text-lg font-bold text-white tracking-wide">Generate Tags based on Supers</h2>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="goBackToEditor"
          class="flex items-center gap-1 bg-editor-surface hover:bg-editor-border border border-editor-border text-gray-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          ← Adjust Script
        </button>

        <button 
          @click="proceedToSettings"
          :disabled="projectStore.isLoading || totalActiveTagsCount === 0"
          class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:from-editor-surface disabled:to-editor-surface disabled:text-gray-600 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide shadow-glow transition-all"
        >
          Proceed to Settings →
        </button>
      </div>
    </div>

    <!-- Main split layout workspace -->
    <div class="flex-grow flex overflow-hidden">
      <!-- Tag refinement scroll container -->
      <div class="flex-grow overflow-y-auto p-6 space-y-4 bg-[#0c0c0e]">
        
        <!-- AI Loading Overlay inside content panel -->
        <div v-if="projectStore.isLoading" class="flex flex-col items-center justify-center py-24 space-y-6 text-center">
          <div class="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-white">Extracting Visual Tags</h3>
            <p class="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Matching script cues with visual databases...</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- AI Visual Story Panel for Context -->
          <div 
            v-if="projectStore.story" 
            class="glass-panel p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-indigo-950/10 shadow-glow mb-6 relative overflow-hidden"
          >
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_50%)] pointer-events-none"></div>
            
            <div class="flex items-start gap-4 relative">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="flex-grow space-y-2.5">
                <h3 class="text-xs font-bold text-white tracking-widest uppercase font-mono">
                  ★ Story Theme Context
                </h3>
                <p class="text-xs text-gray-400 leading-relaxed max-h-24 overflow-y-auto pr-2">
                  {{ projectStore.story }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="enabledSubtitles.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-12 h-12 rounded-full bg-editor-surface flex items-center justify-center text-gray-600 border border-editor-border mb-3">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-400">All script tracks are disabled</p>
            <p class="text-xs text-gray-600 mt-1">Please enable tracks in the script editor to extract tags.</p>
          </div>

          <!-- Subtitle list with tags -->
          <div 
            v-for="(sub, index) in enabledSubtitles" 
            :key="sub.id"
            class="glass-card p-5 rounded-2xl border border-editor-border hover:border-purple-600/30 hover:shadow-glow transition-all duration-200"
          >
            <!-- Track Info / Original Script line -->
            <div class="flex items-center justify-between border-b border-editor-border pb-3 mb-4">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-400 flex items-center justify-center text-[10px] font-bold font-mono">
                  {{ index + 1 }}
                </span>
                <span class="text-xs font-mono font-semibold text-gray-400">
                  {{ sub.start }} → {{ sub.end }}
                </span>
              </div>
              <p class="text-xs text-gray-400 italic max-w-lg truncate" :title="sub.text">
                "{{ sub.text }}"
              </p>
            </div>

            <!-- Tags List -->
            <div class="flex flex-wrap gap-2.5 items-center">
              <div 
                v-for="(tag, tagIdx) in sub.tags" 
                :key="tagIdx"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-editor-surface/60 border border-editor-border hover:border-purple-500/40 transition-all text-white group/tag"
              >
                <!-- Tag Input Field (Double click to edit) -->
                <input 
                  v-if="editingTagKey === `${sub.id}_${tagIdx}`"
                  type="text" 
                  v-model="editTagValue"
                  @keyup.enter="saveTagEdit(sub.id, tagIdx)"
                  @blur="saveTagEdit(sub.id, tagIdx)"
                  class="bg-editor-bg border-none text-xs text-purple-300 font-mono w-24 p-0 focus:outline-none"
                  v-focus
                />
                <span 
                  v-else 
                  @dblclick="startTagEdit(sub.id, tagIdx, tag)"
                  class="cursor-pointer select-none font-mono"
                  title="Double click to edit tag"
                >
                  {{ tag }}
                </span>

                <!-- Edit tag button -->
                <button 
                  v-if="editingTagKey !== `${sub.id}_${tagIdx}`"
                  @click="startTagEdit(sub.id, tagIdx, tag)"
                  class="opacity-0 group-hover/tag:opacity-100 text-gray-500 hover:text-purple-400 transition-opacity"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                <!-- Remove tag button -->
                <button 
                  @click="removeTag(sub.id, tagIdx)"
                  class="text-gray-500 hover:text-red-400 font-extrabold ml-0.5"
                >
                  ×
                </button>
              </div>

              <!-- Inline Add Tag Form -->
              <form @submit.prevent="addTag(sub.id)" class="flex items-center gap-1 ml-1 shrink-0">
                <input 
                  type="text" 
                  v-model="newTagValues[sub.id]"
                  placeholder="+ Add tag"
                  class="bg-transparent border border-editor-border hover:border-purple-600/30 focus:border-purple-500 px-3 py-1 rounded-full text-xs font-semibold font-mono w-24 text-purple-400 placeholder-gray-600 focus:outline-none transition-all"
                />
              </form>
            </div>
          </div>
        </div>

      </div>

      <!-- Configurations / Helper sidebar panel -->
      <aside class="w-80 border-l border-editor-border/80 bg-editor-panel/50 p-6 flex flex-col overflow-y-auto gap-5 shrink-0">
        <div>
          <h3 class="text-sm font-bold text-white tracking-wider uppercase mb-1">Tag Extraction</h3>
          <p class="text-[10px] text-gray-500">Review search tags extracted directly from subtitle cues.</p>
        </div>

        <div class="glass-card p-4.5 rounded-xl space-y-3.5">
          <div class="flex items-center justify-between border-b border-editor-border pb-2.5">
            <span class="text-xs text-gray-400">Total Unique Tags</span>
            <span class="text-xs font-mono font-bold text-purple-400">{{ totalActiveTagsCount }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">Context Status</span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              Synced with Story
            </span>
          </div>
        </div>

        <button 
          @click="regenerateTags"
          class="flex items-center justify-center gap-1.5 bg-editor-surface hover:bg-editor-border border border-editor-border text-xs font-bold text-gray-300 py-2.5 rounded-xl transition-all hover:text-purple-300 w-full"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
          </svg>
          Re-extract tags
        </button>

        <div class="glass-card p-4 rounded-xl border border-editor-border/40 text-[11px] leading-relaxed text-gray-500 space-y-2 mt-auto">
          <p class="font-bold text-gray-400 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tag Confirms
          </p>
          <p>
            Feel free to double click any tag bubble to rewrite it, or use the "+ Add tag" field to key in manual search cues!
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

export default {
  name: 'TagsPage',
  directives: {
    focus: {
      mounted(el) {
        el.focus();
      }
    }
  },
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();

    const newTagValues = reactive({});
    const editingTagKey = ref(null); // format: `${subId}_${tagIdx}`
    const editTagValue = ref('');

    onMounted(() => {
      // Auto-extract tags from script/story context on mount if empty!
      const hasTags = projectStore.subtitles.some(s => s.tags && s.tags.length > 0);
      if (!hasTags && projectStore.projectId) {
        projectStore.generateTags();
      }
    });

    const enabledSubtitles = computed(() => {
      return projectStore.subtitles.filter(sub => sub.enabled);
    });

    const totalActiveTagsCount = computed(() => {
      let count = 0;
      const seen = new Set();
      projectStore.subtitles.forEach(sub => {
        if (sub.enabled && sub.tags) {
          sub.tags.forEach(t => {
            if (!seen.has(t)) {
              seen.add(t);
              count++;
            }
          });
        }
      });
      return count;
    });

    const goBackToEditor = () => {
      router.push({ name: 'editor' });
    };

    const proceedToSettings = () => {
      router.push({ name: 'settings' });
    };

    const regenerateTags = () => {
      if (confirm('Are you sure you want to re-extract all tags? Any manual tag additions or edits will be reset.')) {
        projectStore.generateTags();
      }
    };

    // Tag list manipulation
    const removeTag = (subId, tagIdx) => {
      const sub = projectStore.subtitles.find(s => s.id === subId);
      if (sub && sub.tags) {
        sub.tags.splice(tagIdx, 1);
        projectStore.updateSubtitles(projectStore.subtitles);
      }
    };

    const addTag = (subId) => {
      const val = newTagValues[subId] ? newTagValues[subId].trim() : '';
      if (!val) return;

      const sub = projectStore.subtitles.find(s => s.id === subId);
      if (sub) {
        if (!sub.tags) sub.tags = [];
        if (!sub.tags.includes(val)) {
          sub.tags.push(val);
          projectStore.updateSubtitles(projectStore.subtitles);
        }
      }
      newTagValues[subId] = '';
    };

    // Double click edit tag
    const startTagEdit = (subId, tagIdx, currentVal) => {
      editingTagKey.value = `${subId}_${tagIdx}`;
      editTagValue.value = currentVal;
    };

    const saveTagEdit = (subId, tagIdx) => {
      if (editingTagKey.value === null) return;

      const val = editTagValue.value.trim();
      const sub = projectStore.subtitles.find(s => s.id === subId);
      if (sub && sub.tags) {
        if (val) {
          sub.tags[tagIdx] = val;
        } else {
          sub.tags.splice(tagIdx, 1);
        }
        projectStore.updateSubtitles(projectStore.subtitles);
      }

      editingTagKey.value = null;
      editTagValue.value = '';
    };

    return {
      projectStore,
      enabledSubtitles,
      totalActiveTagsCount,
      newTagValues,
      editingTagKey,
      editTagValue,
      goBackToEditor,
      proceedToSettings,
      regenerateTags,
      removeTag,
      addTag,
      startTagEdit,
      saveTagEdit
    };
  }
};
</script>

<style scoped>
.glass-panel {
  backdrop-filter: blur(16px);
  background-color: rgba(22, 22, 29, 0.4);
}
</style>
