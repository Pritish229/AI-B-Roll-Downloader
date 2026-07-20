<template>
  <div class="flex-grow flex items-center justify-center p-6 bg-radial-gradient">
    <div class="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-editor-border/80 shadow-glass animate-slide-up">
      <div class="text-center mb-8">
        <span class="px-3 py-1 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-full text-xs font-semibold tracking-wider uppercase">
          Step 1: Ingest Script
        </span>
        <h2 class="text-3xl font-extrabold text-white mt-4 tracking-tight">Upload Subtitle File</h2>
        <p class="text-gray-400 text-sm mt-2 max-w-md mx-auto">
          Ingest a standard `.srt` subtitle file. Our engine will parse the timestamps and extract key visual contexts.
        </p>
      </div>

      <!-- Drag & Drop Area -->
      <div 
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        class="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group"
        :class="[
          isDragging 
            ? 'border-purple-500 bg-purple-950/20 scale-[1.01]' 
            : 'border-editor-border bg-editor-surface/30 hover:border-purple-600/60 hover:bg-editor-surface/50'
        ]"
      >
        <!-- Decorative Glow Grid -->
        <div class="absolute inset-0 bg-gradient-to-tr from-purple-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <!-- File Select Input -->
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          accept=".srt"
          @change="handleFileSelect"
        />

        <div class="w-16 h-16 rounded-2xl bg-editor-surface flex items-center justify-center border border-editor-border group-hover:border-purple-500/50 group-hover:shadow-glow transition-all duration-300 mb-4">
          <svg 
            class="w-8 h-8 text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <p class="text-sm font-semibold text-white tracking-wide">
          Drag and drop your <span class="text-purple-400 font-bold">.srt</span> file here
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Or click to browse from files
        </p>
        <p class="text-[11px] text-gray-600 mt-4 uppercase tracking-widest font-mono">Max Size: 10MB</p>
      </div>

      <!-- Selected File View -->
      <div v-if="selectedFile" class="mt-6 p-4 rounded-xl bg-editor-panel border border-editor-border flex items-center justify-between animate-fade-in">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 bg-purple-950/40 border border-purple-800/40 rounded-lg flex items-center justify-center text-purple-400 shrink-0 font-bold text-xs">
            SRT
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-white truncate">{{ selectedFile.name }}</p>
            <p class="text-[10px] text-gray-500 mt-0.5">{{ formatBytes(selectedFile.size) }}</p>
          </div>
        </div>
        <button 
          @click.stop="clearFile" 
          class="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-all"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Error Dialog -->
      <div v-if="projectStore.error || validationError" class="mt-6 p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-300 text-xs flex gap-2.5 items-start">
        <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="font-bold">Parsing Ingestion Issue</p>
          <p class="mt-0.5 opacity-90">{{ projectStore.error || validationError }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 flex justify-between items-center gap-4 flex-wrap">
        <button 
          @click="proceedToManualScript"
          class="flex items-center gap-1.5 bg-editor-surface hover:bg-editor-border border border-editor-border text-gray-300 px-5 py-3 rounded-xl text-sm font-semibold transition-all shrink-0"
        >
          ✍ Write Script Manually
        </button>

        <button 
          @click="uploadFile" 
          :disabled="!selectedFile || projectStore.isLoading"
          class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:from-editor-surface disabled:to-editor-surface disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-editor-border disabled:shadow-none text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide shadow-glow-accent transition-all duration-300"
        >
          <span v-if="projectStore.isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ projectStore.isLoading ? 'Parsing Subtitles...' : 'Proceed to Editor' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

export default {
  name: 'UploadPage',
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();
    
    const fileInput = ref(null);
    const selectedFile = ref(null);
    const isDragging = ref(false);
    const validationError = ref(null);

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      validateAndSelect(file);
    };

    const handleDrop = (event) => {
      isDragging.value = false;
      const file = event.dataTransfer.files[0];
      validateAndSelect(file);
    };

    const validateAndSelect = (file) => {
      validationError.value = null;
      projectStore.error = null;

      if (!file) return;

      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'srt') {
        validationError.value = 'Invalid file type. Please upload a standard subtitle file ending in .srt';
        selectedFile.value = null;
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        validationError.value = 'Subtitles file size exceeds the 10MB limit.';
        selectedFile.value = null;
        return;
      }

      selectedFile.value = file;
    };

    const clearFile = () => {
      selectedFile.value = null;
      validationError.value = null;
      projectStore.error = null;
    };

    const uploadFile = async () => {
      if (!selectedFile.value) return;

      try {
        await projectStore.uploadSrtFile(selectedFile.value);
        // Navigate automatically on success
        router.push({ name: 'editor' });
      } catch (err) {
        console.error(err);
      }
    };

    const proceedToManualScript = () => {
      projectStore.projectId = `project_${Date.now()}`;
      projectStore.originalName = 'Manual Script Project';
      projectStore.subtitles = [];
      projectStore.rawScriptText = '';
      projectStore.persistToLocalStorage();
      router.push({ name: 'editor' });
    };

    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return {
      projectStore,
      fileInput,
      selectedFile,
      isDragging,
      validationError,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      clearFile,
      uploadFile,
      proceedToManualScript,
      formatBytes
    };
  }
};
</script>

<style scoped>
.bg-radial-gradient {
  background: radial-gradient(circle at center, #1b132c 0%, #0F0F12 75%);
}
</style>
