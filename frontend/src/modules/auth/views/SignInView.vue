<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BaseAlert from '@/app/components/BaseAlert.vue';
import { RouteName } from '@/app/constants/route-names';
import CardLayout from '@/app/layouts/CardLayout.vue';
import SignInForm from '../components/SignInForm.vue';

const NOTICES: Partial<Record<string, string>> = {
  expired: 'Your session has expired. Please sign in again.',
  'signed-out': 'You signed out in another tab.',
};

const route = useRoute();
const notices = computed(() => {
  const notice = NOTICES[String(route.query.reason)];
  return notice ? [notice] : [];
});
</script>

<template>
  <CardLayout title="Welcome back" subtitle="Sign in to your account">
    <BaseAlert :messages="notices" variant="info" />
    <SignInForm />
    <template #footer>
      Don't have an account?
      <RouterLink :to="{ name: RouteName.SignUp }">Sign up</RouterLink>
    </template>
  </CardLayout>
</template>
