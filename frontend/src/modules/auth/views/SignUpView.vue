<script setup lang="ts">
import { RouteName } from '@/app/constants/route-names';
import CardLayout from '@/app/layouts/CardLayout.vue';
import SignUpForm from '../components/SignUpForm.vue';
</script>

<template>
  <CardLayout title="Create your account" subtitle="It only takes a minute">
    <SignUpForm />
    <template #footer>
      Already have an account?
      <RouterLink :to="{ name: RouteName.SignIn }">Sign in</RouterLink>
    </template>
  </CardLayout>
</template>
