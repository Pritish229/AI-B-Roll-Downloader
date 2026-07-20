import { createRouter, createWebHistory } from 'vue-router';
import { useProjectStore } from '../stores/project';
import UploadPage from '../pages/UploadPage.vue';
import ScriptEditorPage from '../pages/ScriptEditorPage.vue';
import StoryGeneratorPage from '../pages/StoryGeneratorPage.vue';
import TagsPage from '../pages/TagsPage.vue';
import VideoSettingsPage from '../pages/VideoSettingsPage.vue';
import DownloadPage from '../pages/DownloadPage.vue';

const routes = [
  {
    path: '/',
    name: 'upload',
    component: UploadPage
  },
  {
    path: '/editor',
    name: 'editor',
    component: ScriptEditorPage,
    meta: { requiresProject: true }
  },
  {
    path: '/story',
    name: 'story',
    component: StoryGeneratorPage,
    meta: { requiresProject: true }
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagsPage,
    meta: { requiresProject: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: VideoSettingsPage,
    meta: { requiresProject: true }
  },
  {
    path: '/download',
    name: 'download',
    component: DownloadPage,
    meta: { requiresProject: true }
  },
  // Catch-all redirect to upload
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guards to enforce upload order
router.beforeEach((to, from, next) => {
  const store = useProjectStore();
  
  if (to.meta.requiresProject && !store.projectId) {
    next({ name: 'upload' });
  } else {
    next();
  }
});

export default router;
