<template>
  <div class="flex-grow flex flex-col h-[calc(100vh-140px)] overflow-hidden">
    <!-- Header panel -->
    <div class="glass-panel p-4 px-6 border-b border-editor-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-0.5 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-lg text-xs font-bold font-mono">
          Step 3: Generate Story
        </span>
        <h2 class="text-lg font-bold text-white tracking-wide">Cinematic Script Narrative</h2>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="goBackToEditor"
          class="flex items-center gap-1 bg-editor-surface hover:bg-editor-border border border-editor-border text-gray-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          ← Adjust Script
        </button>

        <button 
          @click="proceedToTags"
          :disabled="projectStore.isLoading || !projectStore.story"
          class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:from-editor-surface disabled:to-editor-surface disabled:text-gray-600 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide shadow-glow transition-all"
        >
          Proceed to Tags →
        </button>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex-grow flex flex-col items-center justify-center p-6 bg-radial-gradient overflow-y-auto">
      
      <!-- Loading State -->
      <div v-if="projectStore.isLoading" class="w-full max-w-xl text-center space-y-6 animate-pulse">
        <div class="w-20 h-20 mx-auto rounded-3xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 animate-spin opacity-20"></div>
          <svg class="w-10 h-10 text-purple-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-bold text-white tracking-wide">Orchestrating Visual Narrative</h3>
          <p class="text-xs text-purple-400/80 font-mono tracking-widest uppercase animate-pulse">Querying HuggingFace Open Source LLM...</p>
        </div>
        <p class="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Our system is utilizing an advanced open-source visual director model to convert your timing cues into a rich cinematic storyboard.
        </p>
      </div>

      <!-- Narrative View/Edit Panel -->
      <div v-else-if="projectStore.story" class="w-full max-w-3xl glass-panel p-8 rounded-3xl border border-editor-border/80 shadow-glass space-y-6 animate-slide-up">
        
        <div class="flex items-center justify-between border-b border-editor-border/60 pb-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 bg-purple-950/40 border border-purple-800/40 rounded-xl flex items-center justify-center text-purple-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h3 class="text-md font-bold text-white">Visual Narrative Script</h3>
              <p class="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Mistral-7B / Llama-3 Cinematic Storyboard</p>
            </div>
          </div>

          <!-- Edit mode toggle -->
          <button 
            @click="isEditing = !isEditing"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all"
            :class="[
              isEditing 
                ? 'bg-purple-950/30 border-purple-500 text-purple-300' 
                : 'bg-editor-surface hover:bg-editor-border border-editor-border text-gray-400 hover:text-white'
            ]"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {{ isEditing ? 'Lock Narrative' : 'Edit Story' }}
          </button>
        </div>

        <!-- Narrative Content Area -->
        <div class="relative">
          <!-- Textarea for editing -->
          <textarea 
            v-if="isEditing"
            v-model="projectStore.story"
            @change="saveStoryChanges"
            class="w-full h-72 bg-editor-bg border border-purple-500/30 focus:border-purple-500 rounded-2xl p-5 text-xs text-gray-300 leading-relaxed focus:outline-none font-sans"
            placeholder="Type your visual story storyboard script here..."
          ></textarea>

          <!-- Beautiful rendering when viewing -->
          <div v-else class="h-72 overflow-y-auto pr-2 text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap space-y-4 select-text">
            {{ projectStore.story }}
          </div>
        </div>

        <!-- Alert information & Regeneration -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-editor-border/60">
          <p class="text-[10px] text-gray-500 max-w-md leading-normal italic">
            * This visual narrative provides holistic thematic keywords and aesthetic vibes to guide Step 4 (Tag Generation) for maximum B-roll sync precision.
          </p>

          <button 
            @click="regenerateStory"
            class="flex items-center gap-1.5 bg-editor-surface hover:bg-editor-border border border-editor-border text-xs font-bold text-gray-300 px-4.5 py-2 rounded-xl transition-all shrink-0 hover:text-purple-300"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
            Regenerate Story
          </button>
        </div>

      </div>

      <!-- Initial / Empty State -->
      <div v-else class="w-full max-w-md text-center space-y-6 animate-slide-up">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-editor-surface border border-editor-border flex items-center justify-center text-purple-400 shadow-glow">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="space-y-1">
          <h3 class="text-md font-bold text-white">Narrative Generation Required</h3>
          <p class="text-xs text-gray-500">Transform your script into a cinematic descriptive story.</p>
        </div>
        <button 
          @click="generateStory"
          class="bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs tracking-wider uppercase shadow-glow-accent transition-all duration-300"
        >
          Generate Story Now
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

export default {
  name: 'StoryGeneratorPage',
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();
    
    const isEditing = ref(false);

    onMounted(() => {
      // Auto-trigger story generation if it doesn't exist yet!
      if (!projectStore.story && projectStore.projectId) {
        generateStory();
      }
    });

    const generateStory = async () => {
      try {
        await projectStore.generateStory();
      } catch (err) {
        console.error(err);
      }
    };

    const regenerateStory = () => {
      if (confirm('Are you sure you want to regenerate the visual story? Any manual edits will be overwritten.')) {
        isEditing.value = false;
        generateStory();
      }
    };

    const saveStoryChanges = () => {
      projectStore.persistToLocalStorage();
    };

    const goBackToEditor = () => {
      router.push({ name: 'editor' });
    };

    const proceedToTags = async () => {
      if (!projectStore.story) return;
      
      // Auto-generate tags in background as we move to tags confirmation!
      router.push({ name: 'tags' });
    };

    return {
      projectStore,
      isEditing,
      generateStory,
      regenerateStory,
      saveStoryChanges,
      goBackToEditor,
      proceedToTags
    };
  }
};
</script>

<style scoped>
.bg-radial-gradient {
  background: radial-gradient(circle at center, #1b132c 0%, #0F0F12 75%);
}
</style>
