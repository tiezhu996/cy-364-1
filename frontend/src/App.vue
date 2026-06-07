<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { fetchOverview } from "./api/client";
import { APP_CODE, APP_NAME } from "./constants/app";
import { REQUEST_MESSAGES } from "./constants/messages";
import { createFallbackOverview } from "./state/dashboard";
import { routes } from "./routes";
import type { OverviewResponse } from "./types";
import FeatureStrip from "./components/FeatureStrip.vue";
import MetricGrid from "./components/MetricGrid.vue";
import OperationsTable from "./components/OperationsTable.vue";
import InventoryPanel from "./components/InventoryPanel.vue";

const overview = ref<OverviewResponse>(createFallbackOverview());
const notice = ref(REQUEST_MESSAGES.overviewFallback);
const currentRoute = ref("/");

function goHealth() {
  window.location.href = REQUEST_MESSAGES.healthPath;
}

function navigateTo(path: string) {
  currentRoute.value = path;
  window.history.pushState({}, "", path);
}

async function loadOverview() {
  try {
    overview.value = await fetchOverview();
    notice.value = "后端服务已联通，当前展示实时接口数据。";
  } catch {
    notice.value = REQUEST_MESSAGES.overviewFallback;
  }
}

watch(currentRoute, (newRoute) => {
  if (newRoute === "/") {
    loadOverview();
  }
});

onMounted(() => {
  const path = window.location.pathname;
  if (routes.some((r) => r.path === path)) {
    currentRoute.value = path;
  }
  loadOverview();

  window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    if (routes.some((r) => r.path === path)) {
      currentRoute.value = path;
    }
  });
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div class="brand-header">
        <span class="brand-code">{{ APP_CODE }}</span>
        <h1 class="brand-title">{{ APP_NAME }}</h1>
      </div>
      <nav class="nav-menu">
        <el-button
          v-for="route in routes"
          :key="route.path"
          :type="currentRoute === route.path ? 'primary' : 'default'"
          @click="navigateTo(route.path)"
        >
          {{ route.label }}
        </el-button>
      </nav>
      <el-button type="success" @click="goHealth">API Health</el-button>
    </header>

    <section class="workspace">
      <template v-if="currentRoute === '/'">
        <div class="lead-grid">
          <article class="hero-panel">
            <span class="pill">{{ notice }}</span>
            <h2>{{ overview.appName }}</h2>
            <p>{{ overview.description }}</p>
          </article>
          <MetricGrid :items="overview.kpis" />
        </div>
        <FeatureStrip :items="overview.features" />
        <section class="work-panel">
          <h2>运营任务流</h2>
          <OperationsTable :records="overview.records" />
        </section>
      </template>

      <template v-else-if="currentRoute === '/inventory'">
        <InventoryPanel />
      </template>

      <template v-else>
        <section class="placeholder-panel">
          <h2>{{ routes.find((r) => r.path === currentRoute)?.label || '页面' }}</h2>
          <p>该模块正在开发中，敬请期待。</p>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px clamp(20px, 4vw, 56px);
  background: color-mix(in srgb, #f6f5ee 86%, white 14%);
  border-bottom: 1px solid color-mix(in srgb, #1f2417 12%, transparent);
  flex-wrap: wrap;
}

.brand-header {
  flex-shrink: 0;
}

.nav-menu {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}

.placeholder-panel {
  background: color-mix(in srgb, #f6f5ee 86%, white 14%);
  border: 1px solid color-mix(in srgb, #1f2417 13%, transparent);
  border-radius: 8px;
  padding: clamp(40px, 8vw, 80px);
  text-align: center;
  box-shadow: 0 18px 50px color-mix(in srgb, #1f2417 10%, transparent);
}

.placeholder-panel h2 {
  font-size: clamp(24px, 3vw, 36px);
  margin-bottom: 16px;
}

.placeholder-panel p {
  color: color-mix(in srgb, #1f2417 68%, transparent);
  font-size: clamp(16px, 2vw, 18px);
}

@media (max-width: 860px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-menu {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
