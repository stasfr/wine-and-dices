<script setup lang="ts">
import type { IUserProfile } from '../types/users';

interface Props {
  user: IUserProfile | null | undefined;
}

const props = defineProps<Props>();

const state = ref({
  id: '',
  email: '',
  status: '',
  lastName: '',
  firstName: '',
  middleName: '',
});

watch(
  () => props.user,
  (user) => {
    if (!user) {
      return;
    }

    state.value.id = user.id;
    state.value.email = user.email;
    state.value.status = user.isActive ? 'Active' : 'Inactive';
    state.value.lastName = user.lastName || '';
    state.value.firstName = user.firstName || '';
    state.value.middleName = user.middleName || '';
  },
  { immediate: true },
);
</script>

<template>
  <UForm v-if="props.user" :state="state" class="space-y-4">
    <UPageCard title="Account">
      <div class="space-y-4">
        <UFormField label="ID" name="id">
          <UInput v-model="state.id" disabled class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="state.email" disabled class="w-full" />
        </UFormField>

        <UFormField label="Status" name="status">
          <UInput v-model="state.status" disabled class="w-full" />
        </UFormField>
      </div>
    </UPageCard>

    <UPageCard title="Full Name">
      <div class="space-y-4">
        <UFormField label="Last Name" name="lastName">
          <UInput v-model="state.lastName" disabled class="w-full" />
        </UFormField>

        <UFormField label="First Name" name="firstName">
          <UInput v-model="state.firstName" disabled class="w-full" />
        </UFormField>

        <UFormField label="Middle Name" name="middleName">
          <UInput v-model="state.middleName" disabled class="w-full" />
        </UFormField>
      </div>
    </UPageCard>
  </UForm>

  <div v-else class="text-center py-8 text-muted">
    No user data available
  </div>
</template>
