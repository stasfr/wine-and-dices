<script setup lang="ts">
import * as v from 'valibot';
import type { FormSubmitEvent } from '@nuxt/ui';

const FORM_ID = 'login-form';

const mode = ref<'login' | 'register'>('login');
const loading = ref(false);

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Must be at least 8 characters')),
});

const registerSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Must be at least 8 characters')),
  confirmPassword: v.pipe(
    v.string(),
    v.minLength(8, 'Must be at least 8 characters'),
  ),
});

const schema = computed(() =>
  mode.value === 'login' ? loginSchema : registerSchema,
);

type Schema = v.InferOutput<typeof loginSchema> | v.InferOutput<typeof registerSchema>;

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

async function onSubmit(event: FormSubmitEvent<Schema>) {
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
      if (formData.value.password !== formData.value.confirmPassword) {
        toast.add({
          title: 'Error',
          description: 'Пароли не совпадают',
          color: 'error',
        });
        return;
      }

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
        description: 'Регистрация прошла успешно',
        color: 'success',
      });

      await navigateTo('/profile');
    }
  } catch (error: any) {
    if (mode.value === 'login' && error.statusCode === 404) {
      mode.value = 'register';
      toast.add({
        title: 'Info',
        description:
          'User does not exist. Confirm password to register.',
        color: 'info',
      });
    } else {
      toast.add({
        title: 'Error',
        description: error.statusMessage || error.message || 'An error occurred',
        color: 'error',
      });
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 flex-1">
    <UPageCard :title="mode === 'login' ? 'Login' : 'Register'" class="w-full max-w-md">
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
          label="Подтвердите пароль"
          name="confirmPassword"
        >
          <UInput
            v-model="formData.confirmPassword"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UButton :loading="loading" :disabled="!isFormValid" type="submit" class="w-full">
          <span class="text-center w-full">
            {{ mode === 'login' ? 'Login' : 'Register' }}
          </span>
        </UButton>
      </UForm>
    </UPageCard>
  </div>
</template>
