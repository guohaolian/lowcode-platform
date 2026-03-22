<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const modules = [
  { name: 'form',   label: 'Form' },
  { name: 'page',   label: 'Page' },
  { name: 'flow',   label: 'Flow' },
  { name: 'report', label: 'Report' },
]
</script>

<template>
  <div class="app-layout">
    <header class="topbar">
      <div class="topbar-brand">
        <span class="brand-name">Studio</span>
        <span class="brand-dot"></span>
      </div>
      <nav class="topbar-nav">
        <button
          v-for="m in modules" :key="m.name"
          class="nav-btn"
          :class="{ active: route.name === m.name }"
          @click="router.push({ name: m.name })"
        >{{ m.label }}</button>
      </nav>
      <div class="topbar-meta">
        <span class="mono" style="font-size:11px;color:var(--text3)">v1.0</span>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout { height: 100vh; display: flex; flex-direction: column; }
.topbar {
  height: 48px; background: var(--bg); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 20px; gap: 32px; flex-shrink: 0;
}
.topbar-brand { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.brand-name { font-size: 14px; font-weight: 600; letter-spacing: -.03em; color: var(--text); }
.brand-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); }
.topbar-nav { display: flex; align-items: center; flex: 1; }
.nav-btn {
  padding: 5px 14px; border: none; background: transparent;
  color: var(--text3); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: color .12s; font-family: inherit; border-radius: var(--radius);
  letter-spacing: -.01em; position: relative;
}
.nav-btn:hover { color: var(--text); }
.nav-btn.active { color: var(--text); }
.nav-btn.active::after {
  content: ''; position: absolute; bottom: -11px; left: 50%;
  transform: translateX(-50%); width: 20px; height: 2px;
  background: var(--text); border-radius: 2px 2px 0 0;
}
.topbar-meta { flex-shrink: 0; }
.main-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
</style>
