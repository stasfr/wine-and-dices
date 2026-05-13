<script setup lang="ts">
import * as v from 'valibot';
import type { FormSubmitEvent } from '@nuxt/ui';

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  confirmPassword: string;
}

export type AuthFormBody = LoginBody | RegisterBody;

const FORM_ID = 'login-form';

const mode = ref<'login' | 'register'>('login');
const loading = ref(false);

const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Must be at least 8 characters'),
  v.maxLength(64, 'Must be at most 64 characters'),
  v.regex(/^\S*$/, 'Must not contain spaces'),
  v.regex(/[a-z]/, 'Must contain at least one lowercase letter'),
  v.regex(/[A-Z]/, 'Must contain at least one uppercase letter'),
  v.regex(/[0-9]/, 'Must contain at least one digit'),
  v.regex(/[\p{P}\p{S}]/u, 'Must contain at least one special character'),
);

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email')),
  password: passwordSchema,
});

const registerSchema = v.pipe(
  v.object({
    email: v.pipe(v.string(), v.email('Invalid email')),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  }),
  v.forward(
    v.check(
      (input) => input.password === input.confirmPassword,
      'Passwords do not match',
    ),
    ['confirmPassword'],
  ),
);

const schema = computed(() =>
  mode.value === 'login' ? loginSchema : registerSchema,
);

const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
});

const isFormValid = computed(() => {
  const result = v.safeParse(schema.value, formData.value);
  return result.success;
});

const toast = useToast();
const { handleError, getErrorStatusCode } = useErrorHandler();

async function onSubmit(_event: FormSubmitEvent<AuthFormBody>) {
  loading.value = true;

  try {
    if (mode.value === 'login') {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: formData.value.email,
          password: formData.value.password,
        },
      });

      await useUserSession().fetch();
      await navigateTo('/profile');
    } else {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          email: formData.value.email,
          password: formData.value.password,
        },
      });

      await useUserSession().fetch();

      toast.add({
        title: 'Success',
        description: 'Registration completed successfully',
        color: 'success',
      });

      await navigateTo('/profile');
    }
  } catch (error: unknown) {
    const statusCode = getErrorStatusCode(error);
    if (mode.value === 'login' && statusCode === 404) {
      mode.value = 'register';
      toast.add({
        title: 'Info',
        description: 'User does not exist. Confirm password to register.',
        color: 'info',
      });
    } else {
      handleError(error, { title: 'Error', fallback: 'An error occurred' });
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 flex-1">
    <UPageCard
      :title="mode === 'login' ? 'Login' : 'Register'"
      class="w-full max-w-md"
    >
      <UForm
        :id="FORM_ID"
        :schema="schema"
        :state="formData"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput v-model="formData.email" type="email" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="formData.password" type="password" class="w-full" />
        </UFormField>

        <UFormField
          v-if="mode === 'register'"
          label="Confirm password"
          name="confirmPassword"
        >
          <UInput
            v-model="formData.confirmPassword"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UButton
          :loading="loading"
          :disabled="!isFormValid"
          type="submit"
          class="w-full"
        >
          <span class="text-center w-full">
            {{ mode === 'login' ? 'Login or create an account' : 'Register' }}
          </span>
        </UButton>
      </UForm>
    </UPageCard>
  </div>
</template>
