<script setup lang="ts">
const { user, fetch: fetchSession } = useUserSession();
const { handleError } = useErrorHandler();
const requestFetch = useRequestFetch();

const activationId = useRouteParams<string>('activationId', '');

const isAlreadyActivated = computed(() => user.value?.isActive === true);

const {
  mutate: activate,
  isLoading,
  status,
  error,
} = useMutation({
  mutation: () =>
    requestFetch(`/api/auth/activate/${activationId.value}`, {
      method: 'POST',
    }),
  onSuccess: async () => {
    await fetchSession();

    start();
  },
  onError: (err) => {
    handleError(err, {
      title: 'Activation failed',
      fallback: 'An error occurred during activation',
    });
  },
});

const { start } = useTimeoutFn(
  () => {
    navigateTo('/profile');
  },
  3000,
  { immediate: false },
);

watch(
  [activationId, isAlreadyActivated],
  () => {
    if (!activationId.value) {
      return;
    }

    if (isAlreadyActivated.value) {
      return;
    }

    if (isLoading.value) {
      return;
    }

    activate();
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-6">
    <template v-if="!activationId">
      <UIcon name="i-lucide-circle-x" class="size-8 text-error" />
      <p class="text-center text-neutral-500">Invalid activation link.</p>
    </template>

    <template v-else-if="isAlreadyActivated">
      <UIcon name="i-lucide-circle-x" class="size-8 text-error" />
      <p class="text-center text-neutral-500">This link is no longer valid.</p>
    </template>

    <template v-else-if="isLoading">
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
      <p class="text-center text-neutral-500">Activating your account...</p>
    </template>

    <template v-else-if="status === 'error'">
      <UIcon name="i-lucide-circle-x" class="size-8 text-error" />
      <p class="text-center text-neutral-500">
        {{ getErrorMessage(error) }}
      </p>
      <UButton to="/auth/login" class="w-full">
        <span class="text-center w-full">Go to Login</span>
      </UButton>
    </template>

    <template v-else-if="status === 'success'">
      <UIcon name="i-lucide-check-circle" class="size-8 text-success" />
      <p class="text-center text-neutral-500">
        Account activated successfully. Redirecting you shortly...
      </p>
    </template>
  </div>
</template>
