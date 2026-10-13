<script setup lang="ts">
import TheAppLoader from '@/app/components/TheAppLoader.vue';
</script>

<template>
  <!-- Until the first navigation resolves (session restore + lazy page chunk), show a loader instead of a blank page. -->
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="Component" />
    <TheAppLoader v-else />
  </RouterView>
</template>
