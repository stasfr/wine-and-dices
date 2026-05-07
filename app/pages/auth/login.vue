<script setup lang="ts">
import * as v from 'valibot';
import type { FormSubmitEvent } from '@nuxt/ui';

const FORM_ID = 'login-form';

const loading = ref(false);
const schema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Must be at least 8 characters')),
});

type Schema = v.InferOutput<typeof schema>;

const formData = ref({
  email: '',
  password: '',
});

const toast = useToast();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: formData.value,
    });
    toast.add({
      title: 'Success',
      description: 'The form has been submitted.',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: `An error occurred while submitting the form: ${error}`,
      color: 'error',
    });
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 flex-1">
    <UPageCard title="Login" class="w-full max-w-md">
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

        <UButton :loading="loading" type="submit" class="w-full">
          <span class="text-center w-full"> Login or register </span>
        </UButton>
      </UForm>
    </UPageCard>
  </div>
</template>
