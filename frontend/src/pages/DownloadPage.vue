<template>
  <div class="flex-grow flex items-center justify-center p-6 bg-radial-gradient">
    <div class="w-full max-w-3xl glass-panel p-8 rounded-3xl border border-editor-border/80 shadow-glass animate-slide-up relative overflow-hidden">
      <!-- Glow decoration -->
      <div 
        class="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000"
        :class="[
          projectStore.progress.status === 'completed' ? 'bg-emerald-500' : 
          projectStore.progress.status === 'failed' ? 'bg-red-500' : 'bg-purple-600'
        ]"
      ></div>

      <!-- HEADER FOR INITIAL / CONFIG STATE -->
      <div v-if="projectStore.progress.status === 'idle'" class="text-center mb-8">
        <span class="px-3 py-1 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-full text-xs font-bold tracking-wider uppercase font-mono">
          Step 6: Set Limits & Download
        </span>
        <h2 class="text-2xl font-extrabold text-white mt-4 tracking-tight">Configure Assets Pack Limits</h2>
        <p class="text-gray-400 text-sm mt-1">
          Specify exactly how many files of each asset category you want to fetch per search tag.
        </p>
      </div>

      <!-- HEADER FOR COMPILING STATE -->
      <div v-else class="text-center mb-8">
        <span class="px-3 py-1 bg-editor-surface border border-editor-border text-purple-400 rounded-full text-xs font-semibold tracking-wider uppercase">
          Compiling Assets
        </span>
        <h2 class="text-2xl font-extrabold text-white mt-4 tracking-tight">Compilation Pipeline</h2>
        <p class="text-gray-400 text-sm mt-1">
          Our background thread is searching Pexels, Pixabay, Unsplash & Vecteezy, downloading files, writing local metadata, and zipping the final pack.
        </p>
      </div>

      <!-- CONFIGURATION VIEW (idle state) -->
      <div v-if="projectStore.progress.status === 'idle'" class="space-y-6">
        
        <!-- Locked Video Settings Summary -->
        <div class="glass-card p-4 rounded-xl border border-editor-border/60 flex flex-wrap items-center justify-between gap-4 bg-purple-950/5">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              ⚙
            </span>
            <div>
              <p class="text-xs font-bold text-white">Active Video Settings</p>
              <p class="text-[10px] text-gray-500">Configured in Step 5</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 bg-editor-surface border border-editor-border text-gray-300 rounded-lg text-xs font-mono">
              Framing: {{ projectStore.videoSettings.aspectRatio }}
            </span>
            <span class="px-2.5 py-1 bg-editor-surface border border-editor-border text-gray-300 rounded-lg text-xs font-mono uppercase">
              Tone: {{ projectStore.videoSettings.videoTone }}
            </span>
            <button 
              @click="goToSettings"
              class="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors ml-2"
            >
              Change
            </button>
          </div>
        </div>

        <!-- Custom Destination Folder Selection Card -->
        <div class="glass-card p-6 rounded-2xl border border-editor-border/60 space-y-4">
          <div class="flex items-center justify-between border-b border-editor-border/50 pb-3">
            <div class="flex items-center gap-2 text-purple-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">Save Direct to Folder</h3>
            </div>
            <span class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-950/40 border border-purple-500/30 text-purple-300">
              Windows & macOS Native
            </span>
          </div>

          <div class="space-y-3">
            <p class="text-[10px] text-gray-400 leading-relaxed">
              Skip the heavy ZIP creation entirely! Click <strong>Browse Folder</strong> to select any local path on your computer. Your structural assets, tags, and script will copy there directly.
            </p>

            <div class="flex gap-2">
              <input 
                type="text"
                v-model="projectStore.downloadConfig.destinationPath"
                placeholder="e.g. C:\Users\YourName\Videos\B-Roll Project"
                class="flex-1 bg-editor-bg border border-editor-border/80 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 outline-none placeholder-gray-600 transition-all"
              />
              <button
                @click="browseDestinationFolder"
                :disabled="projectStore.isLoading"
                class="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Browse...
              </button>
            </div>
            
            <div v-if="projectStore.downloadConfig.destinationPath" class="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl animate-fade-in">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Target path active. Assets will copy directly here!</span>
            </div>
          </div>
        </div>

        <!-- Limit Sliders -->
        <div class="glass-card p-6 rounded-2xl border border-editor-border/60 space-y-5">
          <!-- 0. Max Total Assets (Global Limit Cap) -->
          <div class="flex flex-col gap-1.5 bg-purple-950/15 p-4 rounded-xl border border-purple-500/20">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-white">Absolute Global Downloads Cap</label>
              <span class="text-purple-300 font-mono text-xs font-extrabold">{{ projectStore.downloadConfig.maxTotalAssets }} total assets max</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="150" 
              step="5"
              v-model.number="projectStore.downloadConfig.maxTotalAssets"
              class="w-full accent-purple-500 cursor-pointer h-1.5 bg-editor-bg rounded-lg"
            />
            <p class="text-[10px] text-purple-300/80 leading-normal">
              <strong>Smart Round-Robin Coverage:</strong> Limits the absolute total downloads across the entire project. Distributes the slot budget evenly so every single script line gets coverage without downloading hundreds of files!
            </p>
          </div>

          <!-- 1. Max Videos -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-300">Stock Videos</label>
              <span class="text-purple-400 font-mono text-xs font-bold">{{ projectStore.downloadConfig.maxVideos }} video{{ projectStore.downloadConfig.maxVideos !== 1 ? 's' : '' }} / tag</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1"
              v-model.number="projectStore.downloadConfig.maxVideos"
              class="w-full accent-purple-500 cursor-pointer h-1.5 bg-editor-bg rounded-lg"
            />
            <p class="text-[10px] text-gray-500">High definition videos matched to search tag. Orientation & tone settings will apply.</p>
          </div>

          <!-- 2. Max Images -->
          <div class="flex flex-col gap-1.5 border-t border-editor-border pt-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-300">Stock Photos</label>
              <span class="font-mono text-xs font-bold" :class="projectStore.downloadConfig.maxImages === 0 ? 'text-gray-600' : 'text-purple-400'">
                {{ projectStore.downloadConfig.maxImages === 0 ? 'OFF' : projectStore.downloadConfig.maxImages + (projectStore.downloadConfig.maxImages !== 1 ? ' photos' : ' photo') + ' / tag' }}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1"
              v-model.number="projectStore.downloadConfig.maxImages"
              class="w-full accent-purple-500 cursor-pointer h-1.5 bg-editor-bg rounded-lg"
            />
            <p class="text-[10px] text-gray-500">Complementary photographic image assets. Set to 0 to disable.</p>
          </div>

          <!-- 3. Max GIFs -->
          <div class="flex flex-col gap-1.5 border-t border-editor-border pt-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-300">Animated GIFs</label>
              <span class="font-mono text-xs font-bold" :class="projectStore.downloadConfig.maxGifs === 0 ? 'text-gray-600' : 'text-purple-400'">
                {{ projectStore.downloadConfig.maxGifs === 0 ? 'OFF' : projectStore.downloadConfig.maxGifs + (projectStore.downloadConfig.maxGifs !== 1 ? ' GIFs' : ' GIF') + ' / tag' }}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1"
              v-model.number="projectStore.downloadConfig.maxGifs"
              class="w-full accent-purple-500 cursor-pointer h-1.5 bg-editor-bg rounded-lg"
            />
            <p class="text-[10px] text-gray-500">Fast looping animated reactions and illustration GIFs. Set to 0 to disable.</p>
          </div>

          <!-- 4. Max Shapes -->
          <div class="flex flex-col gap-1.5 border-t border-editor-border pt-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-300">Transparent Vector Shapes</label>
              <span class="font-mono text-xs font-bold" :class="projectStore.downloadConfig.maxShapes === 0 ? 'text-gray-600' : 'text-purple-400'">
                {{ projectStore.downloadConfig.maxShapes === 0 ? 'OFF' : projectStore.downloadConfig.maxShapes + (projectStore.downloadConfig.maxShapes !== 1 ? ' shapes' : ' shape') + ' / tag' }}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1"
              v-model.number="projectStore.downloadConfig.maxShapes"
              class="w-full accent-purple-500 cursor-pointer h-1.5 bg-editor-bg rounded-lg"
            />
            <p class="text-[10px] text-gray-500">Decorative transparent illustration designs and shapes. Set to 0 to disable.</p>
          </div>
        </div>

        <!-- Trigger Download Button -->
        <div class="pt-4 max-w-sm mx-auto text-center">
          <button 
            @click="triggerBackgroundDownload"
            class="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white px-6 py-4 rounded-xl text-sm font-extrabold tracking-widest uppercase shadow-glow shadow-purple-500/20 border border-purple-500/40 hover:scale-[1.01] transition-all duration-300"
          >
            <svg class="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Trigger Compilation Pack
          </button>
          <p class="text-[10px] text-gray-500 mt-2 leading-relaxed italic">
            * This spins up concurrent search processes in our background downloader. You can monitor the progress instantly.
          </p>
        </div>

      </div>

      <!-- MAIN PROCESSING VIEW (searching, downloading, zipping, completed, failed states) -->
      <div v-else class="space-y-6">
        
        <!-- Main Progress Visualizer -->
        <div class="glass-card p-6 rounded-2xl border border-editor-border/60 flex flex-col items-center">
          <!-- 1. Processing / Searching / Downloading / Zipping / Exporting Loader -->
          <div v-if="['searching', 'downloading', 'zipping', 'exporting'].includes(projectStore.progress.status)" class="w-full space-y-4">
            <!-- Status + Percent -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
                <span class="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  {{ projectStore.progress.status }}
                </span>
              </div>
              <span class="text-sm font-mono font-bold text-white">
                <template v-if="projectStore.progress.status === 'zipping'">
                  Zipping: {{ projectStore.progress.zipProgress ? `${projectStore.progress.zipProgress.current}/${projectStore.progress.zipProgress.total}` : 'Initializing...' }}
                </template>
                <template v-else-if="projectStore.progress.status === 'exporting'">
                  Exporting to folder
                </template>
                <template v-else>
                  {{ projectStore.progress.downloadedAssets }}/{{ projectStore.progress.totalAssets }}
                </template>
                &nbsp;({{ projectStore.progress.status === 'zipping' ? (projectStore.progress.zipProgress ? Math.round((projectStore.progress.zipProgress.current / projectStore.progress.zipProgress.total) * 100) + '%' : 'Please wait...') : (projectStore.progress.status === 'exporting' ? 'Please wait...' : `${projectStore.progress.progressPercent}%`) }})
              </span>
            </div>

            <!-- Progress bar (searching & downloading state) -->
            <div v-if="!['zipping', 'exporting'].includes(projectStore.progress.status)" class="w-full h-3 bg-editor-bg rounded-full overflow-hidden border border-editor-border">
              <div
                class="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 shadow-glow"
                :style="{ width: `${projectStore.progress.progressPercent}%` }"
              ></div>
            </div>

            <!-- Shimmering Progress Bar (zipping & exporting state) -->
            <div v-else class="w-full h-3 bg-editor-bg rounded-full overflow-hidden border border-editor-border relative">
              <div
                class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full absolute top-0 left-0 bottom-0 animate-shimmer shadow-glow shadow-purple-500/30 transition-all duration-300"
                :style="{ 
                  width: projectStore.progress.status === 'zipping' && projectStore.progress.zipProgress ? `${(projectStore.progress.zipProgress.current / projectStore.progress.zipProgress.total) * 100}%` : '100%',
                  backgroundSize: '200% auto'
                }"
              ></div>
            </div>

            <!-- Asset type breakdown chips (shown once typeCounts is available) -->
            <div
              v-if="projectStore.progress.typeCounts && projectStore.progress.status === 'downloading'"
              class="flex flex-wrap gap-2 justify-center"
            >
              <span v-if="projectStore.progress.typeCounts.video > 0"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950/40 border border-blue-800/40 text-blue-300">
                🎬 {{ projectStore.progress.typeCounts.video }} Videos
              </span>
              <span v-if="projectStore.progress.typeCounts.image > 0"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                🖼 {{ projectStore.progress.typeCounts.image }} Photos
              </span>
              <span v-if="projectStore.progress.typeCounts.gif > 0"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-950/40 border border-orange-800/40 text-orange-300">
                🎞 {{ projectStore.progress.typeCounts.gif }} GIFs
              </span>
              <span v-if="projectStore.progress.typeCounts.shape > 0"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/40 border border-purple-800/40 text-purple-300">
                🔷 {{ projectStore.progress.typeCounts.shape }} Shapes
              </span>
            </div>

            <!-- Current activity panel -->
            <div class="p-3 rounded-xl bg-editor-panel border border-editor-border/60 flex items-center gap-3">
              <span class="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0"></span>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Now Processing</p>
                <p class="text-xs font-mono text-gray-200 truncate mt-0.5 leading-snug" :title="projectStore.progress.currentAsset">
                  {{ projectStore.progress.currentAsset || 'Initializing...' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 2. Completed Success View -->
          <div v-else-if="projectStore.progress.status === 'completed'" class="w-full py-4 animate-fade-in">
            <div class="max-w-md mx-auto bg-editor-surface/40 border border-editor-border rounded-2xl overflow-hidden shadow-2xl text-left">
              <!-- Download Section -->
              <div class="p-6 border-b border-editor-border bg-emerald-950/5 flex flex-col items-center text-center space-y-4">
                <div class="w-14 h-14 bg-emerald-950/40 border border-emerald-800/40 rounded-full flex items-center justify-center text-emerald-400 shadow-glow shadow-emerald-500/10">
                  <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white tracking-wide">
                    {{ projectStore.progress.destinationPath ? 'Assets Saved Successfully!' : 'B-Roll Pack Compiled!' }}
                  </h3>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ projectStore.progress.destinationPath 
                      ? 'Files copied directly to your specified local directory.' 
                      : 'Your structured asset bundle is ready for download.' }}
                  </p>
                </div>

                <!-- Action Button -->
                <div class="w-full pt-2">
                  <div v-if="projectStore.progress.destinationPath" class="space-y-3">
                    <div class="bg-editor-bg border border-editor-border/80 p-2.5 rounded-xl text-left">
                      <p class="text-[9px] uppercase font-extrabold text-gray-500 tracking-wider">Local Path</p>
                      <p class="text-[11px] font-mono text-gray-300 mt-0.5 break-all">{{ projectStore.progress.destinationPath }}</p>
                    </div>
                    <button 
                      @click="openDestinationFolder(projectStore.progress.destinationPath)"
                      class="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-5 py-3.5 rounded-xl text-xs font-extrabold tracking-widest uppercase border border-emerald-500/40 hover:scale-[1.01] transition-all duration-300 shadow-glow shadow-emerald-500/10"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Open Destination Folder
                    </button>
                  </div>

                  <a 
                    v-else
                    :href="getZipDownloadUrl()"
                    download
                    class="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-5 py-3.5 rounded-xl text-xs font-extrabold tracking-widest uppercase border border-emerald-500/40 hover:scale-[1.01] transition-all duration-300 shadow-glow shadow-emerald-500/15"
                  >
                    <svg class="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download ZIP Pack
                  </a>
                </div>
              </div>

              <!-- Expiry Timer & Quick Delete Console Section -->
              <div v-if="projectStore.progress.expiresAt" class="p-5 bg-purple-950/10 flex flex-col space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 text-base">⏱</span>
                    <div>
                      <p class="text-[11px] font-bold text-white uppercase tracking-wider">Server Asset Purge</p>
                      <p class="text-[10px] text-gray-500 mt-0.5">Files deleted automatically in</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-base font-extrabold font-mono text-purple-400 bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-lg">
                      {{ remainingTime }}
                    </span>
                  </div>
                </div>

                <!-- Ticking Progress Micro Bar -->
                <div class="w-full h-1 bg-editor-bg rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-purple-500/80 rounded-full transition-all duration-1000"
                    :style="{ width: `${progressFractionPercent}%` }"
                  ></div>
                </div>

                <div class="flex items-center justify-between pt-1 gap-4">
                  <p class="text-[9px] text-gray-500 leading-normal max-w-[200px]">
                    To comply with security and save hosting space, all files are permanently deleted.
                  </p>
                  <button 
                    @click="onQuickDelete"
                    :disabled="projectStore.isLoading"
                    class="px-4 py-2 bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 disabled:opacity-50 text-red-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 shrink-0 hover:scale-[1.02] active:scale-95 shadow-lg"
                  >
                    Quick Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Failed View -->
          <div v-else-if="projectStore.progress.status === 'failed'" class="w-full text-center py-6 space-y-4 animate-fade-in">
            <!-- If ZIP still exists despite failure, show download anyway -->
            <div v-if="projectStore.progress.zipPath" class="glass-card p-4 rounded-xl border border-green-900/40 bg-green-950/10 text-center mb-2">
              <p class="text-xs font-bold text-green-400 mb-2">✓ ZIP was created before the error. You can still download it:</p>
              <a
                :href="projectStore.progress.zipPath"
                download
                class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                ↓ Download ZIP
              </a>
            </div>

            <div class="w-16 h-16 bg-red-950/40 border border-red-900/40 rounded-full flex items-center justify-center text-red-400 mx-auto">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Pipeline Execution Halted</h3>
              <p class="text-xs text-red-400/80 mt-1 max-w-md mx-auto">
                {{ projectStore.progress.currentAsset || 'The engine hit a bottleneck during search or packaging. Check terminal logs.' }}
              </p>
            </div>
            <div class="pt-2">
              <button
                @click="retryDownloadFlow"
                class="bg-editor-surface hover:bg-editor-border border border-editor-border text-gray-300 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Reconfigure &amp; Retry
              </button>
            </div>
          </div>

          <!-- 3b. Session Expired: server restarted, progress wiped, no zip found -->
          <div v-else-if="projectStore.progress.status === 'idle' && projectStore.projectId" class="w-full text-center py-6 space-y-4 animate-fade-in">
            <div class="w-16 h-16 bg-yellow-950/40 border border-yellow-900/40 rounded-full flex items-center justify-center text-yellow-400 mx-auto">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Session Expired</h3>
              <p class="text-xs text-yellow-400/80 mt-1 max-w-md mx-auto">
                The server restarted and lost download progress. Your project data is intact — restart the download.
              </p>
            </div>
            <div class="pt-2">
              <button
                @click="retryDownloadFlow"
                class="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                ↺ Restart Download
              </button>
            </div>
          </div>
        </div>

        <!-- Warning Drawer / Details list -->
        <div v-if="projectStore.progress.errors && projectStore.progress.errors.length > 0" class="glass-card p-4 rounded-xl border border-yellow-900/30 bg-yellow-950/5">
          <h4 class="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Pipeline Warning Alerts ({{ projectStore.progress.errors.length }})
          </h4>
          <div class="max-h-28 overflow-y-auto space-y-1.5 pr-2">
            <p 
              v-for="(err, idx) in projectStore.progress.errors" 
              :key="idx"
              class="text-[10px] font-mono text-yellow-400 bg-yellow-950/20 p-2 rounded border border-yellow-900/20"
            >
              {{ err }}
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

export default {
  name: 'DownloadPage',
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();

    const remainingTime = ref('3:00');
    const progressFractionPercent = ref(100);
    let countdownInterval = null;

    const startCountdown = () => {
      if (countdownInterval) clearInterval(countdownInterval);
      
      const expiresAt = projectStore.progress.expiresAt;
      if (!expiresAt) return;

      const updateTimer = () => {
        const now = Date.now();
        const diff = expiresAt - now;

        if (diff <= 0) {
          remainingTime.value = '0:00';
          progressFractionPercent.value = 0;
          clearInterval(countdownInterval);
          // Return to idle state upon expiry
          projectStore.progress.status = 'idle';
          return;
        }

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        remainingTime.value = `${mins}:${String(secs).padStart(2, '0')}`;
        progressFractionPercent.value = Math.max(0, Math.min(100, (diff / 180000) * 100));
      };

      updateTimer();
      countdownInterval = setInterval(updateTimer, 1000);
    };

    onMounted(() => {
      // If we landed here and it was already processing, make sure polling is active.
      if (['searching', 'downloading', 'zipping', 'exporting'].includes(projectStore.progress.status)) {
        projectStore.startPollingProgress();
      }
      
      // If already complete, kick off the countdown
      if (projectStore.progress.status === 'completed') {
        startCountdown();
      }
    });

    // Watch status to start countdown on completion
    watch(() => projectStore.progress.status, (newStatus) => {
      if (newStatus === 'completed') {
        startCountdown();
      } else if (newStatus === 'idle') {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }
    });

    onBeforeUnmount(() => {
      if (countdownInterval) clearInterval(countdownInterval);
    });

    const onQuickDelete = async () => {
      if (confirm('Are you sure you want to instantly delete all B-roll downloads, uploads, and compiled ZIP files from the server? This action cannot be undone.')) {
        try {
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
          await projectStore.quickDeleteProject();
        } catch (err) {
          console.error(err);
        }
      }
    };

    const triggerBackgroundDownload = async () => {
      try {
        await projectStore.startBrollDownload();
      } catch (err) {
        console.error(err);
      }
    };

    const goToSettings = () => {
      router.push({ name: 'settings' });
    };

    const getZipDownloadUrl = () => {
      return `/api/download/${projectStore.projectId}`;
    };

    const browseDestinationFolder = async () => {
      try {
        await projectStore.selectDestinationFolder();
      } catch (err) {
        console.error(err);
      }
    };

    const openDestinationFolder = (pathStr) => {
      projectStore.openDestinationFolder(pathStr);
    };

    const retryDownloadFlow = () => {
      projectStore.progress.status = 'idle';
    };

    return {
      projectStore,
      triggerBackgroundDownload,
      goToSettings,
      getZipDownloadUrl,
      retryDownloadFlow,
      browseDestinationFolder,
      openDestinationFolder,
      remainingTime,
      progressFractionPercent,
      onQuickDelete
    };
  }
};
</script>

<style scoped>
.bg-radial-gradient {
  background: radial-gradient(circle at center, #1b132c 0%, #0F0F12 75%);
}
.glass-panel {
  backdrop-filter: blur(16px);
  background-color: rgba(22, 22, 29, 0.4);
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.animate-shimmer {
  animation: shimmer 1.5s linear infinite;
}
</style>
