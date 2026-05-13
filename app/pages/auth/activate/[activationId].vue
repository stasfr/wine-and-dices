<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { fetch: fetchSession } = useUserSession();
const { handleError } = useErrorHandler();

const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  const activationId = route.params.activationId;

  if (typeof activationId !== 'string' || !activationId) {
    error.value = true;
    loading.value = false;
    toast.add({
      title: 'Error',
      description: 'Invalid activation link',
      color: 'error',
    });
    return;
  }

  try {
    await $fetch(`/api/auth/activate/${activationId}`, {
      method: 'POST',
    });

    await fetchSession();

    toast.add({
      title: 'Success',
      description: 'Account activated successfully',
      color: 'success',
    });

    await navigateTo('/profile');
  } catch (err: unknown) {
    error.value = true;
    handleError(err, { title: 'Error', fallback: 'Activation failed' });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 flex-1">
    <UPageCard title="Account Activation" class="w-full max-w-md">
      <div class="flex flex-col items-center gap-4 py-6">
        <UIcon
          v-if="loading"
          name="i-lucide-loader-2"
          class="size-8 animate-spin text-primary"
        />
        <UIcon
          v-else-if="error"
          name="i-lucide-circle-x"
          class="size-8 text-error"
        />
        <UIcon
          v-else
          name="i-lucide-check-circle"
          class="size-8 text-success"
        />

        <p class="text-center text-neutral-500">
          <span v-if="loading">Activating your account...</span>
          <span v-else-if="error"
            >Activation failed. Please try again or contact support.</span
          >
          <span v-else>Redirecting to your profile...</span>
        </p>

        <UButton v-if="error" to="/auth/login" class="w-full">
          <span class="text-center w-full">Go to Login</span>
        </UButton>
      </div>
    </UPageCard>
  </div>
</template>
