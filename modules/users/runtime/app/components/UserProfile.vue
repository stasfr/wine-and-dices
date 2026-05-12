<script setup lang="ts">
import { useMutation } from '@pinia/colada';
import type { IUserProfile } from '../types/users';

interface Props {
  user: IUserProfile | null | undefined;
}

const props = defineProps<Props>();

const toast = useToast();
const requestFetch = useRequestFetch();

const isEditing = ref(false);

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

const { mutate: updateProfile, asyncStatus: updateAsyncStatus } = useMutation({
  mutation: () =>
    requestFetch('/api/users/profile', {
      method: 'PATCH',
      body: {
        firstName: state.value.firstName,
        lastName: state.value.lastName,
        middleName: state.value.middleName,
      },
    }),
  onSuccess: async () => {
    toast.add({
      title: 'Profile updated',
      color: 'success',
    });
    isEditing.value = false;
    await useUserSession().fetch();
  },
  onError: (err) => {
    const error = err instanceof Error ? err : new Error(String(err));
    toast.add({
      title: 'Failed to update profile',
      description: error.message,
      color: 'error',
    });
  },
});

function handleEdit() {
  isEditing.value = true;
}

function handleCancel() {
  isEditing.value = false;

  const user = props.user;
  if (!user) {
    return;
  }

  state.value.lastName = user.lastName || '';
  state.value.firstName = user.firstName || '';
  state.value.middleName = user.middleName || '';
}

function handleSave() {
  updateProfile();
}
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
          <UInput
            v-model="state.lastName"
            :disabled="!isEditing"
            class="w-full"
          />
        </UFormField>

        <UFormField label="First Name" name="firstName">
          <UInput
            v-model="state.firstName"
            :disabled="!isEditing"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Middle Name" name="middleName">
          <UInput
            v-model="state.middleName"
            :disabled="!isEditing"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <template v-if="!isEditing">
            <UButton
              type="button"
              label="Edit"
              icon="i-lucide-pencil"
              @click="handleEdit"
            />
          </template>

          <template v-else>
            <UButton
              type="button"
              label="Cancel"
              color="neutral"
              variant="outline"
              icon="i-lucide-x"
              @click="handleCancel"
            />
            <UButton
              type="button"
              label="Save"
              icon="i-lucide-check"
              :loading="updateAsyncStatus === 'loading'"
              @click="handleSave"
            />
          </template>
        </div>
      </div>
    </UPageCard>
  </UForm>

  <div v-else class="text-center py-8 text-muted">
    No user data available
  </div>
</template>
