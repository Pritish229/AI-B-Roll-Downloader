<template>
  <div class="flex-grow flex flex-col h-[calc(100vh-140px)] overflow-hidden">
    <!-- Header panel with tab selection -->
    <div class="glass-panel p-4 px-6 border-b border-editor-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-0.5 bg-editor-surface border border-editor-border text-purple-400 rounded-lg text-xs font-bold font-mono">
          Step 2: Script Transcribe
        </span>
        
        <!-- Toggle Tabs: Script Editor vs Premiere Timeline -->
        <div class="flex bg-editor-bg border border-editor-border rounded-xl p-1 shrink-0 ml-2">
          <button 
            @click="selectTab('raw')"
            class="px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all"
            :class="[activeTab === 'raw' ? 'bg-purple-600 text-white shadow-glow' : 'text-gray-400 hover:text-white']"
          >
            ✍ Video Script Text
          </button>
          <button 
            @click="selectTab('timeline')"
            class="px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5"
            :class="[activeTab === 'timeline' ? 'bg-purple-600 text-white shadow-glow' : 'text-gray-400 hover:text-white']"
          >
            🎬 Premiere Timeline
            <span class="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/30 text-[9px] text-purple-300 font-mono">
              {{ projectStore.subtitles.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Action Panel / Controls -->
      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <!-- Confirm Tags button -->
        <button 
          @click="confirmTags"
          :disabled="projectStore.isLoading || projectStore.subtitles.length === 0"
          class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:from-editor-surface disabled:to-editor-surface disabled:text-gray-600 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-extrabold tracking-widest uppercase shadow-glow shadow-purple-500/20 border border-purple-500/40 hover:scale-[1.01] transition-all duration-300 shrink-0"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Confirm & Pick Tags →
        </button>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex-grow flex overflow-hidden">
      <!-- Loading Overlay -->
      <div v-if="projectStore.isLoading" class="w-full flex-grow flex flex-col items-center justify-center bg-[#0c0c0e]/95 p-6 space-y-6 text-center animate-fade-in">
        <div class="w-16 h-16 rounded-3xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 animate-spin opacity-20"></div>
          <svg class="w-8 h-8 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div class="space-y-1">
          <h3 class="text-md font-bold text-white tracking-wide">Auto-Transcribing Video Script</h3>
          <p class="text-[10px] text-purple-400/80 font-mono tracking-widest uppercase animate-pulse">Running Speech Aligner Splitter...</p>
        </div>
        <p class="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          AI is splitting your raw dialogue script into timed dialogue transcription tracks with millimeter precision.
        </p>
      </div>

      <!-- 1. RAW SCRIPT TEXT EDITOR TAB -->
      <div v-else-if="activeTab === 'raw'" class="flex-grow flex flex-col p-6 bg-[#0c0c0e] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between border-b border-editor-border pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Video Script Transcript</h3>
            <p class="text-xs text-gray-500 mt-0.5">Type or paste your spoken audio/video transcript script here.</p>
          </div>
          <button 
            @click="autoTranscribeScript"
            :disabled="!rawText.trim()"
            class="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:from-editor-surface disabled:to-editor-surface disabled:text-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-glow"
          >
            🪄 Auto-Transcribe to Timeline
          </button>
        </div>

        <textarea 
          v-model="rawText"
          placeholder="e.g. In style, color is not just a visual choice. It is a powerful form of communication. It shapes our perceptions, influences our moods, and defines our personal aesthetic. When we choose a particular color palette for our wardrobe, we are not simply getting dressed..."
          class="w-full flex-grow min-h-[300px] bg-editor-bg border border-editor-border/80 focus:border-purple-500 rounded-2xl p-6 text-xs text-gray-300 leading-relaxed font-mono focus:outline-none transition-all resize-none"
        ></textarea>
      </div>

      <!-- 2. TIMED TRANSCRIPTION TIMELINE TAB -->
      <div v-else class="flex-grow overflow-y-auto p-6 space-y-3 bg-[#0c0c0e] flex flex-col w-full">
        <!-- Subtitle timeline search and cue controllers -->
        <div class="flex items-center justify-between gap-4 border-b border-editor-border pb-3 shrink-0">
          <!-- Search Cues -->
          <div class="relative w-full max-w-xs">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search transcript lines..."
              class="glass-input pl-9 pr-4 py-1.5 rounded-lg text-xs w-full text-white placeholder-gray-500 font-mono"
            />
          </div>

          <!-- Add Cues -->
          <button 
            @click="addNewTrack"
            class="flex items-center gap-1.5 bg-editor-surface hover:bg-editor-border border border-editor-border text-gray-300 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
          >
            <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Cue Block
          </button>
        </div>

        <!-- Timeline Rows Container -->
        <div class="flex-grow overflow-y-auto space-y-3 pr-1 min-h-[300px]">
          <div v-if="filteredSubtitles.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-12 h-12 rounded-full bg-editor-surface flex items-center justify-center text-gray-600 border border-editor-border mb-3">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-400">Timeline Empty</p>
            <p class="text-xs text-gray-600 mt-1">Please write in raw script mode first and click Auto-Transcribe, or click "Add Cue Block" manually.</p>
          </div>

          <!-- Subtitle blocks -->
          <div 
            v-for="(sub, index) in filteredSubtitles" 
            :key="sub.id"
            class="glass-card p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row items-center gap-4 relative group"
            :class="[
              sub.enabled 
                ? 'border-editor-border hover:border-purple-600/40 hover:shadow-glow' 
                : 'border-editor-border/40 opacity-50 bg-[#16161d]/20'
            ]"
          >
            <!-- Toggle Cue -->
            <div class="flex items-center gap-3 shrink-0 self-start md:self-center">
              <button 
                @click="toggleTrack(sub.id)"
                class="w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                :class="[
                  sub.enabled 
                    ? 'border-purple-500 bg-purple-950/20 text-purple-400' 
                    : 'border-gray-700 bg-editor-bg text-transparent'
                ]"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <span class="text-xs font-mono font-bold text-gray-500 tracking-wider">
                #{{ String(index + 1).padStart(2, '0') }}
              </span>
            </div>

            <!-- Start / End Timestamps -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="flex flex-col">
                <span class="text-[9px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5">Start</span>
                <input 
                  type="text" 
                  v-model="sub.start"
                  @change="onSubtitleEdited"
                  class="glass-input px-2.5 py-1 rounded-md text-xs font-mono w-24 text-center text-purple-300 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <span class="text-gray-600 mt-3 font-semibold">→</span>
              <div class="flex flex-col">
                <span class="text-[9px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5">End</span>
                <input 
                  type="text" 
                  v-model="sub.end"
                  @change="onSubtitleEdited"
                  class="glass-input px-2.5 py-1 rounded-md text-xs font-mono w-24 text-center text-indigo-300 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Subtitle Dialogue Line input -->
            <div class="flex-grow w-full md:w-auto">
              <span class="text-[9px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5 block md:hidden">Transcript Dialogue</span>
              <input 
                type="text" 
                v-model="sub.text"
                @change="onSubtitleEdited"
                placeholder="Spoken dialogue context..."
                class="glass-input w-full px-3 py-2 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none font-sans"
              />
            </div>

            <!-- Remove Cue -->
            <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button 
                @click="removeTrack(sub.id)"
                class="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-all"
                title="Delete Cue Block"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Sidebar -->
      <aside class="hidden lg:flex w-80 border-l border-editor-border/80 bg-editor-panel/50 p-6 flex-col overflow-y-auto gap-4 shrink-0">
        <h3 class="text-sm font-bold text-white tracking-wider uppercase mb-2">Transcribe Control</h3>
        
        <div class="glass-card p-4 rounded-xl space-y-4">
          <div class="flex items-center justify-between border-b border-editor-border pb-2.5">
            <span class="text-xs text-gray-400">Total Duration</span>
            <span class="text-xs font-mono font-bold text-purple-400">{{ getDurationString() }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-editor-border pb-2.5">
            <span class="text-xs text-gray-400">Dialogue Clips</span>
            <span class="text-xs font-mono font-bold text-indigo-400">{{ projectStore.subtitles.length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">Enabled Clips</span>
            <span class="text-xs font-mono font-bold text-gray-300">{{ projectStore.subtitles.filter(s => s.enabled).length }}</span>
          </div>
        </div>

        <div class="text-xs text-gray-500 leading-relaxed bg-editor-surface/30 p-4.5 rounded-xl border border-editor-border/40 mt-auto">
          <p class="font-bold text-gray-400 mb-1 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Premiere Pro Flow
          </p>
          Dialogue transcription tracks split your video script into neat visual chunks. Use <strong>Raw Script</strong> to paste dialog text and Auto-Transcribe it, or adjust specific cues directly in the <strong>Timeline</strong>!
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

export default {
  name: 'ScriptEditorPage',
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();

    const activeTab = ref('timeline');
    const rawText = ref('');
    const searchQuery = ref('');

    onMounted(() => {
      // If we got subtitles from SRT, pre-fill rawText with the text and default to timeline
      if (projectStore.subtitles && projectStore.subtitles.length > 0) {
        activeTab.value = 'timeline';
        rawText.value = projectStore.subtitles.map(s => s.text).join(' ');
      } else {
        // If empty manual project, default to raw script writer
        activeTab.value = 'raw';
        rawText.value = projectStore.rawScriptText || '';
      }
    });

    // Filter subtitles array based on query search
    const filteredSubtitles = computed(() => {
      if (!searchQuery.value.trim()) return projectStore.subtitles;
      const q = searchQuery.value.toLowerCase();
      return projectStore.subtitles.filter(sub => 
        sub.text.toLowerCase().includes(q) || 
        sub.start.includes(q) || 
        sub.end.includes(q)
      );
    });

    const onSubtitleEdited = () => {
      projectStore.updateSubtitles(projectStore.subtitles);
    };

    const toggleTrack = (id) => {
      const idx = projectStore.subtitles.findIndex(s => s.id === id);
      if (idx !== -1) {
        projectStore.subtitles[idx].enabled = !projectStore.subtitles[idx].enabled;
        onSubtitleEdited();
      }
    };

    const removeTrack = (id) => {
      if (confirm('Are you sure you want to remove this dialogue cue block?')) {
        const filtered = projectStore.subtitles.filter(s => s.id !== id);
        projectStore.updateSubtitles(filtered);
      }
    };

    const addNewTrack = () => {
      let start = '00:00:00';
      let end = '00:00:05';
      
      if (projectStore.subtitles.length > 0) {
        const last = projectStore.subtitles[projectStore.subtitles.length - 1];
        start = last.end;
        
        const parts = start.split(':').map(Number);
        if (parts.length === 3) {
          parts[2] += 5;
          if (parts[2] >= 60) {
            parts[2] -= 60;
            parts[1] += 1;
          }
          if (parts[1] >= 60) {
            parts[1] -= 60;
            parts[0] += 1;
          }
          end = parts.map(v => String(v).padStart(2, '0')).join(':');
        }
      }

      const newSub = {
        id: `cue_${Date.now()}`,
        start,
        end,
        text: '',
        tags: [],
        enabled: true
      };

      projectStore.subtitles.push(newSub);
      onSubtitleEdited();
    };

    const autoTranscribeScript = async () => {
      if (!rawText.value.trim()) return;
      try {
        await projectStore.transcribeScript(rawText.value);
        activeTab.value = 'timeline'; // Switch to timeline view on success!
      } catch (err) {
        alert(err.message || 'Auto-transcription failed. Please try again.');
      }
    };

    const confirmTags = () => {
      router.push({ name: 'tags' });
    };

    const selectTab = (tab) => {
      if (tab === 'raw' && projectStore.subtitles && projectStore.subtitles.length > 0) {
        rawText.value = projectStore.subtitles.map(s => s.text).filter(Boolean).join(' ');
      }
      activeTab.value = tab;
    };

    const getDurationString = () => {
      if (projectStore.subtitles.length === 0) return '00:00:00';
      return projectStore.subtitles[projectStore.subtitles.length - 1].end;
    };

    return {
      projectStore,
      activeTab,
      rawText,
      searchQuery,
      filteredSubtitles,
      onSubtitleEdited,
      toggleTrack,
      removeTrack,
      addNewTrack,
      autoTranscribeScript,
      confirmTags,
      getDurationString,
      selectTab
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
