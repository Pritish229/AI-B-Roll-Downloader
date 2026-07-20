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
      <div class="flex items-center gap-2">
        <span>© 2026 AI B-Roll Downloader. Built for high-fidelity creators.</span>
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
