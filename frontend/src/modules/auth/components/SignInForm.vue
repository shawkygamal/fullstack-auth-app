<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseAlert from '@/app/components/BaseAlert.vue';
import BaseButton from '@/app/components/BaseButton.vue';
import BaseInput from '@/app/components/BaseInput.vue';
import { useFormValidation } from '@/app/composables/use-form-validation';
import { RouteName } from '@/app/constants/route-names';
import { safeRedirect } from '@/app/utils/safe-redirect';
import { useSignIn } from '../composables/use-sign-in';
import type { AuthLoginType } from '../models';
import { focusField, focusFirstInvalidField } from '../utils/focus';
import { validateEmail, validateRequiredPassword } from '../utils/validators';

const route = useRoute();
const router = useRouter();
const { submit, loading, errors: apiErrors, isRateLimited, retryInLabel } = useSignIn();

const formRef = useTemplateRef<HTMLFormElement>('form');
const form = reactive<AuthLoginType>({ email: '', password: '' });
const { errors, touch, untouch, validate } = useFormValidation(form, {
  email: validateEmail,
  password: validateRequiredPassword,
});

const onSubmit = async () => {
  if (!validate()) return focusFirstInvalidField(formRef.value);

  const error = await submit({ email: form.email.trim(), password: form.password });
  if (!error) return router.replace(safeRedirect(route.query.redirect) ?? { name: RouteName.Home });

  // Keep the email, clear the rejected password and put the cursor back for the next try. The emptied field must not
  // then complain that it is empty: the user did nothing wrong there.
  if (error.status === 401) {
    form.password = '';
    untouch('password');
    await focusField('password');
  }
};
</script>

<template>
  <form ref="form" class="form" novalidate @submit.prevent="onSubmit">
    <BaseAlert :messages="apiErrors" />
    <BaseInput
      id="email"
      v-model="form.email"
      label="Email"
      placeholder="name@example.com"
      type="email"
      icon="email"
      autocomplete="username"
      required
      :error="errors.email"
      @blur="touch('email')"
    />
    <BaseInput
      id="password"
      v-model="form.password"
      label="Password"
      placeholder="Enter your password"
      type="password"
      icon="lock"
      autocomplete="current-password"
      required
      :error="errors.password"
      @blur="touch('password')"
    />
    <BaseButton type="submit" :loading="loading" :disabled="isRateLimited">
      <template v-if="isRateLimited">Try again in {{ retryInLabel }}</template>
      <template v-else-if="loading">Signing in…</template>
      <template v-else>Sign in</template>
    </BaseButton>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: 18px;
}
</style>
