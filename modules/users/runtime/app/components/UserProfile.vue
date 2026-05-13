<script setup lang="ts">
import { useMutation } from '@pinia/colada';
import type { IUserProfile } from '../types/users';

interface Props {
  user: IUserProfile | null | undefined;
}

const props = defineProps<Props>();

const toast = useToast();
const requestFetch = useRequestFetch();

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const fetchError = err as {
      statusMessage?: string;
      message?: string;
    };

    if (typeof fetchError.statusMessage === 'string') {
      return fetchError.statusMessage;
    }

    if (typeof fetchError.message === 'string') {
      return fetchError.message;
    }
  }

  return 'An unexpected error occurred';
}

const isEditing = ref(false);

const state = ref({
  id: '',
  email: '',
  status: '',
  lastName: '',
  firstName: '',
  middleName: '',
});

const avatarUrl = computed(() => {
  const user = props.user;
  if (!user || !user.avatar) {
    return undefined;
  }

  return `/avatars/${user.avatar}`;
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
    toast.add({
      title: 'Failed to update profile',
      description: getErrorMessage(err),
      color: 'error',
    });
  },
});

const { handleFileInput, files: avatarFiles } = useFileStorage();
const avatarFileInputEl = useTemplateRef('avatarFileInput');

const { mutate: uploadAvatar, asyncStatus: uploadAvatarAsyncStatus } =
  useMutation({
    mutation: () =>
      requestFetch('/api/users/avatar', {
        method: 'POST',
        body: {
          files: avatarFiles.value,
        },
      }),
    onSuccess: async () => {
      toast.add({
        title: 'Avatar updated',
        color: 'success',
      });
      await useUserSession().fetch();

      if (avatarFileInputEl.value) {
        avatarFileInputEl.value.value = '';
      }
    },
    onError: (err) => {
      toast.add({
        title: 'Failed to update avatar',
        description: getErrorMessage(err),
        color: 'error',
      });
    },
  });

const { mutate: deleteAvatar, asyncStatus: deleteAvatarAsyncStatus } =
  useMutation({
    mutation: () =>
      requestFetch('/api/users/avatar', {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      toast.add({
        title: 'Avatar removed',
        color: 'success',
      });
      await useUserSession().fetch();
    },
    onError: (err) => {
      toast.add({
        title: 'Failed to remove avatar',
        description: getErrorMessage(err),
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

  if (avatarFileInputEl.value) {
    avatarFileInputEl.value.value = '';
  }
}

function handleSave() {
  updateProfile();
}

async function handleAvatarInput(event: Event) {
  await handleFileInput(event);

  if (avatarFiles.value.length > 0) {
    uploadAvatar();
  }
}

function handleAvatarDelete() {
  deleteAvatar();
}

function triggerAvatarInput() {
  if (avatarFileInputEl.value) {
    avatarFileInputEl.value.click();
  }
}
</script>

<template>
  <UForm v-if="props.user" :state="state" class="space-y-4">
    <UPageCard title="Account">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <UAvatar
            :src="avatarUrl"
            alt="Avatar"
            icon="i-lucide-user"
            size="3xl"
          />

          <div class="flex flex-col gap-2">
            <input
              ref="avatarFileInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              @input="handleAvatarInput"
            />

            <div class="flex gap-2">
              <UButton
                type="button"
                label="Upload avatar"
                icon="i-lucide-upload"
                size="sm"
                :loading="uploadAvatarAsyncStatus === 'loading'"
                @click="triggerAvatarInput"
              />
              <UButton
                v-if="avatarUrl"
                type="button"
                label="Remove"
                color="error"
                variant="outline"
                icon="i-lucide-trash"
                size="sm"
                :loading="deleteAvatarAsyncStatus === 'loading'"
                @click="handleAvatarDelete"
              />
            </div>
          </div>
        </div>

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

  <div v-else class="text-center py-8 text-muted">No user data available</div>
</template>
