<script setup lang="ts">
import { RouteName } from '../constants/route-names';
import CardLayout from '../layouts/CardLayout.vue';
</script>

<template>
  <CardLayout title="Page not found" subtitle="The page you are looking for does not exist or has moved.">
    <RouterLink :to="{ name: RouteName.Home }">Go to the home page</RouterLink>
  </CardLayout>
</template>
