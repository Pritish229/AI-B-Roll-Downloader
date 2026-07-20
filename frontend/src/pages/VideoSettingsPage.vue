<template>
  <div class="flex-grow flex flex-col h-[calc(100vh-140px)] overflow-hidden">
    <!-- Header panel -->
    <div class="glass-panel p-4 px-6 border-b border-editor-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-0.5 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-lg text-xs font-bold font-mono">
          Step 5: Required Video Settings
        </span>
        <h2 class="text-lg font-bold text-white tracking-wide">Aesthetic & Orientation Settings</h2>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="goBackToTags"
          class="flex items-center gap-1 bg-editor-surface hover:bg-editor-border border border-editor-border text-gray-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          ← Adjust Tags
        </button>

        <button 
          @click="proceedToDownload"
          class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white px-5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide shadow-glow transition-all"
        >
          Proceed to Download →
        </button>
      </div>
    </div>

    <!-- Main split layout workspace -->
    <div class="flex-grow flex flex-col lg:flex-row overflow-hidden bg-[#0c0c0e]">
      
      <!-- Settings Panel -->
      <div class="flex-grow overflow-y-auto p-8 space-y-8 lg:max-w-2xl border-r border-editor-border/60">
        
        <!-- Aspect Ratio Selection -->
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-bold text-white tracking-wide">Aspect Ratio / Video Dimensions</h3>
            <p class="text-xs text-gray-500 mt-1">Select the output framing aspect ratio for your stock video asset packs.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <button 
              v-for="ratio in aspectRatios" 
              :key="ratio.value"
              @click="selectRatio(ratio.value)"
              class="glass-panel p-5 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group"
              :class="[
                projectStore.videoSettings.aspectRatio === ratio.value 
                  ? 'border-purple-500 bg-purple-950/20 shadow-glow shadow-purple-500/5' 
                  : 'border-editor-border bg-editor-surface/30 hover:border-purple-600/40 hover:bg-editor-surface/40'
              ]"
            >
              <!-- Aspect Ratio Symbol Graphic -->
              <div class="flex justify-between items-start mb-3">
                <div 
                  class="w-10 h-7 rounded border border-gray-600 flex items-center justify-center shrink-0 opacity-80"
                  :class="[
                    ratio.value === '16:9' ? 'w-10 h-6' :
                    ratio.value === '9:16' ? 'w-6 h-10' :
                    ratio.value === '4:3' ? 'w-8 h-7' : 'w-7 h-7'
                  ]"
                >
                  <span class="text-[8px] font-mono text-gray-400">{{ ratio.label.split(' ')[0] }}</span>
                </div>

                <div 
                  class="w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                  :class="[
                    projectStore.videoSettings.aspectRatio === ratio.value 
                      ? 'border-purple-500 bg-purple-500 text-white' 
                      : 'border-gray-600'
                  ]"
                >
                  <svg v-if="projectStore.videoSettings.aspectRatio === ratio.value" class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <p class="text-xs font-bold text-white tracking-wide">{{ ratio.label }}</p>
              <p class="text-[10px] text-gray-500 mt-1 leading-normal">{{ ratio.desc }}</p>
            </button>
          </div>
        </div>

        <!-- Video Tone Selection -->
        <div class="space-y-4 border-t border-editor-border/60 pt-8">
          <div>
            <h3 class="text-sm font-bold text-white tracking-wide">Aesthetic & Visual Tone</h3>
            <p class="text-xs text-gray-500 mt-1">Select the lighting, color grade, and background atmosphere style for search optimizations.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              v-for="tone in tones" 
              :key="tone.value"
              @click="toggleTone(tone.value)"
              class="glass-panel p-5 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] flex items-center gap-4 relative overflow-hidden group"
              :class="[
                isToneSelected(tone.value) 
                  ? 'border-purple-500 bg-purple-950/20 shadow-glow shadow-purple-500/5' 
                  : 'border-editor-border bg-editor-surface/30 hover:border-purple-600/40 hover:bg-editor-surface/40'
              ]"
            >
              <!-- Color Indicator Dot -->
              <div 
                class="w-10 h-10 rounded-xl shrink-0 border border-editor-border flex items-center justify-center text-xs"
                :class="tone.indicatorClass"
              >
                {{ tone.emoji }}
              </div>

              <div>
                <p class="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  {{ tone.name }}
                  <svg v-if="isToneSelected(tone.value)" class="w-3.5 h-3.5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </p>
                <p class="text-[10px] text-gray-500 mt-1 leading-normal">{{ tone.desc }}</p>
              </div>
            </button>
          </div>
        </div>

      </div>

      <!-- Preview Panel (WOW element) -->
      <div class="flex-grow bg-[#09090b] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <!-- Grid overlay -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        
        <div class="text-center mb-6 z-10">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Live Framing Preview</h3>
          <p class="text-[10px] text-gray-600 mt-1">Aspect: {{ projectStore.videoSettings.aspectRatio }} | Tone: {{ projectStore.videoSettings.videoTone }}</p>
        </div>

        <!-- Morphing Monitor Preview Frame -->
        <div 
          class="rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl bg-editor-surface"
          :class="[
            previewSizeClass,
            previewBorderGlowClass
          ]"
        >
          <!-- Dynamic gradient mimicking color tone -->
          <div 
            class="absolute inset-0 transition-all duration-500 opacity-30 pointer-events-none"
            :class="previewGradientClass"
          ></div>

          <!-- Inside details -->
          <div class="z-10 text-center p-6 space-y-3">
            <span class="px-2 py-0.5 bg-black/40 border border-white/10 text-white rounded text-[8px] font-mono uppercase tracking-wider">
              Asset Mockup Frame
            </span>
            <h4 class="text-sm font-bold text-white tracking-wide">
              {{ currentToneDetails.title }}
            </h4>
            <p class="text-[10px] text-gray-400 max-w-[200px] leading-relaxed mx-auto">
              {{ currentToneDetails.desc }}
            </p>
          </div>

          <!-- Letterbox grid decorative guidelines -->
          <div class="absolute inset-0 border border-white/5 pointer-events-none flex items-center justify-center">
            <div class="w-full h-0.5 bg-white/5 absolute"></div>
            <div class="h-full w-0.5 bg-white/5 absolute"></div>
          </div>
        </div>

        <div class="mt-8 text-center max-w-sm z-10">
          <p class="text-[11px] text-gray-500 leading-relaxed bg-editor-surface/30 p-4.5 rounded-2xl border border-editor-border/40">
            <strong>Engine Sync:</strong> The search query for each segment is appended with descriptive adjectives matching the visual tone (e.g. <em>"warm glow"</em> or <em>"moody dark"</em>) to guarantee stock footage aligns with your desired mood.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

export default {
  name: 'VideoSettingsPage',
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();

    const aspectRatios = [
      { 
        value: '16:9', 
        label: '16:9 Horizontal', 
        desc: 'YouTube widescreen, standard documentary, landscape presentations.', 
        aspectClass: 'aspect-video' 
      },
      { 
        value: '9:16', 
        label: '9:16 (19:16) Vertical', 
        desc: 'YouTube Shorts, Instagram Reels, TikTok vertical storytelling format.', 
        aspectClass: 'aspect-[9/16]' 
      },
      { 
        value: '4:3', 
        label: '4:3 Retro Academy', 
        desc: 'Classic vintage television framing, nostalgic, high-focus presentations.', 
        aspectClass: 'aspect-[4/3]' 
      },
      { 
        value: '1:1', 
        label: '1:1 Square', 
        desc: 'Instagram feeds, centered focus, social media post visual format.', 
        aspectClass: 'aspect-square' 
      }
    ];

    const tones = [
      { 
        value: 'cinematic', 
        name: 'Cinematic', 
        emoji: '🎬', 
        desc: 'Dramatic lighting, majestic anamorphic flares, premium film grading.', 
        indicatorClass: 'bg-indigo-950/40 border-indigo-700/50 text-indigo-400',
        gradientClass: 'bg-gradient-to-tr from-blue-900 to-indigo-950',
        previewTitle: 'Cinematic Masterpiece',
        previewDesc: 'Rich contrast, professional cinematic framing, and deep, gorgeous film shadows.'
      },
      { 
        value: 'modern', 
        name: 'Modern & Clean', 
        emoji: '🏢', 
        desc: 'Bright lighting, minimalist white workspaces, corporate aesthetic.', 
        indicatorClass: 'bg-slate-900/40 border-slate-700/50 text-slate-400',
        gradientClass: 'bg-gradient-to-tr from-cyan-900 to-slate-950',
        previewTitle: 'Clean Corporate Loft',
        previewDesc: 'Sleek minimal aesthetics, crisp details, high daylight levels, and professional layouts.'
      },
      { 
        value: 'warm', 
        name: 'Warm Golden', 
        emoji: '🌅', 
        desc: 'Sunset/sunrise rays, golden hour flares, warm orange and yellow glow.', 
        indicatorClass: 'bg-amber-950/40 border-amber-800/50 text-amber-400',
        gradientClass: 'bg-gradient-to-tr from-yellow-900 to-amber-950',
        previewTitle: 'Golden Sunset Glow',
        previewDesc: 'Warm amber tones, dazzling light leakage, and refreshing organic sunshine highlights.'
      },
      { 
        value: 'dark', 
        name: 'Dark & Moody', 
        emoji: '🌃', 
        desc: 'Low-key neon lighting, heavy dark contrast, aesthetic shadow work.', 
        indicatorClass: 'bg-red-950/40 border-red-900/40 text-red-400',
        gradientClass: 'bg-gradient-to-tr from-red-950 to-neutral-950',
        previewTitle: 'Moody Nocturnal Vibe',
        previewDesc: 'Deep velvet shadows, gorgeous cybernetic light accents, and powerful dramatic contrast.'
      },
      { 
        value: 'vibrant', 
        name: 'Vibrant & Bright', 
        emoji: '🎨', 
        desc: 'High color saturation, lively natural details, active human energy.', 
        indicatorClass: 'bg-pink-950/40 border-pink-800/40 text-pink-400',
        gradientClass: 'bg-gradient-to-tr from-pink-900 to-indigo-950',
        previewTitle: 'Vibrant Color Blast',
        previewDesc: 'Breathtaking saturated pigments, lively motions, and happy, dynamic stock scenarios.'
      }
    ];

    const selectRatio = (ratioVal) => {
      projectStore.videoSettings.aspectRatio = ratioVal;
      projectStore.persistToLocalStorage();
    };

    const isToneSelected = (toneVal) => {
      const current = projectStore.videoSettings.videoTone || 'cinematic';
      const selected = current.split(',').map(t => t.trim()).filter(Boolean);
      return selected.includes(toneVal);
    };

    const toggleTone = (toneVal) => {
      const current = projectStore.videoSettings.videoTone || 'cinematic';
      let selected = current.split(',').map(t => t.trim()).filter(Boolean);
      
      if (selected.includes(toneVal)) {
        selected = selected.filter(t => t !== toneVal);
      } else {
        selected.push(toneVal);
      }
      
      if (selected.length === 0) {
        selected = ['cinematic'];
      }
      
      projectStore.videoSettings.videoTone = selected.join(',');
      projectStore.persistToLocalStorage();
    };

    const firstSelectedTone = computed(() => {
      const current = projectStore.videoSettings.videoTone || 'cinematic';
      return current.split(',')[0] || 'cinematic';
    });

    const goBackToTags = () => {
      router.push({ name: 'tags' });
    };

    const proceedToDownload = () => {
      router.push({ name: 'download' });
    };

    // Live Preview Computeds
    const previewSizeClass = computed(() => {
      const ratio = projectStore.videoSettings.aspectRatio;
      if (ratio === '16:9') return 'w-80 h-44';
      if (ratio === '9:16') return 'w-44 h-80';
      if (ratio === '4:3') return 'w-72 h-54';
      return 'w-64 h-64'; // 1:1
    });

    const previewBorderGlowClass = computed(() => {
      const tone = firstSelectedTone.value;
      if (tone === 'cinematic') return 'border-indigo-500/40 shadow-indigo-500/10';
      if (tone === 'modern') return 'border-cyan-500/30 shadow-cyan-500/5';
      if (tone === 'warm') return 'border-amber-500/40 shadow-amber-500/10';
      if (tone === 'dark') return 'border-red-500/30 shadow-red-500/10';
      return 'border-pink-500/40 shadow-pink-500/10';
    });

    const previewGradientClass = computed(() => {
      const matched = tones.find(t => t.value === firstSelectedTone.value);
      return matched ? matched.gradientClass : 'bg-gradient-to-tr from-indigo-900 to-indigo-950';
    });

    const currentToneDetails = computed(() => {
      const matched = tones.find(t => t.value === firstSelectedTone.value);
      return {
        title: matched ? matched.previewTitle : 'Framing Preview',
        desc: matched ? matched.previewDesc : 'Select settings to update framing details.'
      };
    });

    return {
      projectStore,
      aspectRatios,
      tones,
      selectRatio,
      isToneSelected,
      toggleTone,
      goBackToTags,
      proceedToDownload,
      previewSizeClass,
      previewBorderGlowClass,
      previewGradientClass,
      currentToneDetails
    };
  }
};
</script>

<style scoped>
/* Glassmorphism style overrides */
.glass-panel {
  backdrop-filter: blur(16px);
  background-color: rgba(22, 22, 29, 0.4);
}
</style>
