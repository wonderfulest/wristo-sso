<script setup lang="ts">
import { useRoute } from 'vue-router'
import Layout from '@/layout/Layout.vue'
const route = useRoute()
</script>

<template>
  <component :is="['/login', '/register'].includes(route.path) ? 'router-view' : Layout" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
