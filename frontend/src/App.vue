<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F3F4F6] flex flex-col font-sans">
    <!-- Header -->
    <header class="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-editor-border shadow-glow">
      <div class="flex items-center gap-3 cursor-pointer" @click="goHome">
        <div class="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-glow-accent">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-wider text-white flex items-center gap-1.5 font-sans">
            AI B-Roll <span class="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-extrabold">Downloader</span>
          </h1>
          <p class="text-[10px] text-gray-400 tracking-widest uppercase font-semibold">Cinematic Asset Orchestrator</p>
        </div>
      </div>

      <!-- Navigation Stepper (Interactive Progress Pipeline) -->
      <nav v-if="projectStore.projectId" class="hidden md:flex items-center gap-2 lg:gap-4 glass-card px-4 py-1.5 rounded-full border border-editor-border/60">
        <button 
          v-for="(step, idx) in steps" 
          :key="step.route"
          @click="navigateStep(step.route)"
          :disabled="!isStepUnlocked(idx)"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200"
          :class="[
            currentRouteName === step.route 
              ? 'bg-editor-accent text-white shadow-glow' 
              : isStepUnlocked(idx) 
                ? 'text-gray-300 hover:text-white hover:bg-editor-surface/60' 
                : 'text-gray-600 cursor-not-allowed'
          ]"
        >
          <span 
            class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
            :class="[
              currentRouteName === step.route 
                ? 'bg-white text-editor-accent' 
                : isStepUnlocked(idx)
                  ? 'bg-editor-border text-purple-400'
                  : 'bg-editor-bg text-gray-700'
            ]"
          >
            {{ idx + 1 }}
          </span>
          {{ step.name }}
          <svg v-if="idx < steps.length - 1" class="w-3 h-3 text-gray-600 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      <!-- Options / Active Project Banner -->
      <div class="flex items-center gap-3">
        <div v-if="projectStore.projectId" class="hidden lg:flex flex-col items-end">
          <p class="text-[11px] text-gray-400">Active Project</p>
          <p class="text-xs font-bold text-purple-400 max-w-[150px] truncate" :title="projectStore.originalName">
            {{ projectStore.originalName }}
          </p>
        </div>

        <button 
          v-if="projectStore.projectId"
          @click="confirmReset" 
          class="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          New Project
        </button>
      </div>
    </header>

    <!-- Main Viewport -->
    <main class="flex-grow flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="glass-panel py-4 px-6 mt-auto border-t border-editor-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
      <div class="flex items-center gap-3 flex-wrap">
        <span>© 2026 AI B-Roll Downloader. Created by <strong class="text-gray-300 font-bold">Pritish Ranjan Dash</strong></span>
        <span class="text-gray-600">|</span>
        <a 
          href="https://github.com/Pritish229" 
          target="_blank" 
          rel="noopener noreferrer"
          class="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-semibold"
        >
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </a>
        <a 
          href="https://www.linkedin.com/in/pritish-ranjan-dash-91a2aa245/" 
          target="_blank" 
          rel="noopener noreferrer"
          class="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold"
        >
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.68 1.68 0 1 0 0 3.36 1.68 1.68 0 0 0 0-3.36z"/></svg>
          LinkedIn
        </a>
      </div>
      <div class="flex items-center gap-4 flex-wrap justify-end">
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Pexels Engine Active
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Pixabay Engine Active
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Unsplash Engine Active
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Vecteezy Engine Active
        </span>
      </div>
    </footer>

  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from './stores/project';

export default {
  name: 'App',
  setup() {
    const projectStore = useProjectStore();
    const route = useRoute();
    const router = useRouter();

    const steps = [
      { name: 'Upload Script', route: 'upload' },
      { name: 'Edit Script', route: 'editor' },
      { name: 'Confirm Tags', route: 'tags' },
      { name: 'Video Settings', route: 'settings' },
      { name: 'Download B-Roll', route: 'download' }
    ];

    const currentRouteName = computed(() => route.name);

    const isStepUnlocked = (idx) => {
      if (!projectStore.projectId) return idx === 0;
      
      // Wizard flow locks:
      if (idx === 0) return true;
      if (idx === 1) return !!projectStore.projectId;
      if (idx === 2) return projectStore.subtitles && projectStore.subtitles.length > 0;
      if (idx === 3) return projectStore.subtitles && projectStore.subtitles.some(s => s.tags && s.tags.length > 0);
      if (idx === 4) return projectStore.subtitles && projectStore.subtitles.some(s => s.tags && s.tags.length > 0) && !!projectStore.videoSettings.aspectRatio;
      return false;
    };

    const navigateStep = (routeName) => {
      router.push({ name: routeName });
    };

    const confirmReset = () => {
      if (confirm('Are you sure you want to discard the current project and start a new script? Any unsaved edits will be lost.')) {
        projectStore.resetProject();
        router.push({ name: 'upload' });
      }
    };

    const goHome = () => {
      router.push({ name: 'upload' });
    };

    return {
      projectStore,
      steps,
      currentRouteName,
      isStepUnlocked,
      navigateStep,
      confirmReset,
      goHome
    };
  }
};
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
