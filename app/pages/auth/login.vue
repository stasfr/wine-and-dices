<script setup lang="ts">
import * as v from 'valibot';
import type { FormSubmitEvent } from '@nuxt/ui';

const FORM_ID = 'login-form';

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
  <UForm
    :id="FORM_ID"
    :schema="schema"
    :state="formData"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Email" name="email">
      <UInput v-model="formData.email" />
    </UFormField>

    <UFormField label="Password" name="password">
      <UInput v-model="formData.password" type="password" />
    </UFormField>

    <UButton type="submit"> Submit </UButton>
  </UForm>
</template>
