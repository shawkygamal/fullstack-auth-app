<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import BaseAlert from '@/app/components/BaseAlert.vue';
import BaseButton from '@/app/components/BaseButton.vue';
import BaseInput from '@/app/components/BaseInput.vue';
import { useFormValidation } from '@/app/composables/use-form-validation';
import { RouteName } from '@/app/constants/route-names';
import { useSignUp } from '../composables/use-sign-up';
import type { AuthSignupType } from '../models';
import { focusField, focusFirstInvalidField } from '../utils/focus';
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  validateEmail,
  validateName,
  validateNewPassword,
} from '../utils/validators';
import SignUpPasswordRules from './SignUpPasswordRules.vue';

const router = useRouter();
const { submit, loading, errors: apiErrors, isRateLimited, retryInLabel } = useSignUp();

const formRef = useTemplateRef<HTMLFormElement>('form');
const form = reactive<AuthSignupType>({ email: '', name: '', password: '' });
const { errors, touch, validate } = useFormValidation(form, {
  email: validateEmail,
  name: validateName,
  password: validateNewPassword,
});

const onSubmit = async () => {
  if (!validate()) return focusFirstInvalidField(formRef.value);

  const error = await submit({ email: form.email.trim(), name: form.name.trim(), password: form.password });
  if (!error) return router.replace({ name: RouteName.Home });

  // The email is taken: that is the field to change.
  if (error.status === 409) await focusField('email');
};
</script>

<template>
  <form ref="form" class="form" novalidate @submit.prevent="onSubmit">
    <BaseAlert :messages="apiErrors" />
    <BaseInput
      id="name"
      v-model="form.name"
      label="Name"
      placeholder="Enter your full name"
      icon="user"
      autocomplete="name"
      required
      :maxlength="NAME_MAX_LENGTH"
      :error="errors.name"
      @blur="touch('name')"
    />
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
      placeholder="Create a password"
      type="password"
      icon="lock"
      autocomplete="new-password"
      required
      :maxlength="PASSWORD_MAX_LENGTH"
      :error="errors.password"
      @blur="touch('password')"
    >
      <template #description>
        <SignUpPasswordRules :password="form.password" />
      </template>
    </BaseInput>
    <BaseButton type="submit" :loading="loading" :disabled="isRateLimited">
      <template v-if="isRateLimited">Try again in {{ retryInLabel }}</template>
      <template v-else-if="loading">Creating account…</template>
      <template v-else>Create account</template>
    </BaseButton>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: 18px;
}
</style>
