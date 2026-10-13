<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/app/components/BaseButton.vue';
import { RouteName } from '@/app/constants/route-names';
import CardLayout from '@/app/layouts/CardLayout.vue';
import { useSessionStore } from '@/app/stores/session.store';

const router = useRouter();
const session = useSessionStore();
const { user } = storeToRefs(session);
const signingOut = ref(false);

const onSignOut = async () => {
  signingOut.value = true;
  try {
    await session.signOut();
  } finally {
    await router.replace({ name: RouteName.SignIn });
  }
};
</script>

<template>
  <CardLayout
    title="Welcome to the application."
    :subtitle="user ? `Signed in as ${user.name} (${user.email})` : undefined"
  >
    <BaseButton variant="secondary" :loading="signingOut" @click="onSignOut">
      {{ signingOut ? 'Signing out…' : 'Sign out' }}
    </BaseButton>
  </CardLayout>
</template>
