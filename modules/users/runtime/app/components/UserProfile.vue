<script setup lang="ts">
import { useMutation } from '@pinia/colada';

const { user } = useUserSession();

const toast = useToast();
const requestFetch = useRequestFetch();
const { handleError } = useErrorHandler();
const { fetch } = useUserSession();

const { mutate: resendActivation, isLoading: isResendingActivation } = useMutation({
  mutation: () =>
    requestFetch('/api/auth/resend-activation', {
      method: 'POST',
    }),
  onSuccess: () => {
    toast.add({
      title: 'Activation email sent',
      color: 'success',
    });
  },
  onError: (err) => {
    handleError(err, { title: 'Failed to resend activation email' });
  },
});

function handleResendActivation() {
  resendActivation();
}

const isEditing = ref(false);

const state = ref({
  id: '',
  email: '',
  lastName: '',
  firstName: '',
  middleName: '',
});

const avatarUrl = computed(() => {
  const currentUser = user.value;
  if (!currentUser || !currentUser.avatar) {
    return undefined;
  }

  return `/avatars/${currentUser.avatar}`;
});

watch(
  () => user.value,
  (currentUser) => {
    if (!currentUser) {
      return;
    }

    state.value.id = currentUser.id;
    state.value.email = currentUser.email;
    state.value.lastName = currentUser.lastName || '';
    state.value.firstName = currentUser.firstName || '';
    state.value.middleName = currentUser.middleName || '';
  },
  { immediate: true },
);

const { mutate: updateProfile, isLoading: isUpdatingProfile } = useMutation({
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
    await fetch();
  },
  onError: (err) => {
    handleError(err, { title: 'Failed to update profile' });
  },
});

const { handleFileInput, files: avatarFiles } = useFileStorage();
const avatarFileInputEl = useTemplateRef('avatarFileInput');

const { mutate: uploadAvatar, isLoading: isUploadingAvatar } = useMutation({
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
    await fetch();

    if (avatarFileInputEl.value) {
      avatarFileInputEl.value.value = '';
    }
  },
  onError: (err) => {
    handleError(err, { title: 'Failed to update avatar' });
  },
});

const { mutate: deleteAvatar, isLoading: isDeletingAvatar } = useMutation({
  mutation: () =>
    requestFetch('/api/users/avatar', {
      method: 'DELETE',
    }),
  onSuccess: async () => {
    toast.add({
      title: 'Avatar removed',
      color: 'success',
    });
    await fetch();
  },
  onError: (err) => {
    handleError(err, { title: 'Failed to remove avatar' });
  },
});

function handleEdit() {
  isEditing.value = true;
}

function handleCancel() {
  isEditing.value = false;

  const currentUser = user.value;
  if (!currentUser) {
    return;
  }

  state.value.lastName = currentUser.lastName || '';
  state.value.firstName = currentUser.firstName || '';
  state.value.middleName = currentUser.middleName || '';

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
  <UForm v-if="user" :state="state" class="space-y-4">
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
                label="Upload avatar"
                icon="i-lucide-upload"
                :loading="isUploadingAvatar"
                @click="triggerAvatarInput"
              />
              <UButton
                v-if="avatarUrl"
                label="Remove"
                color="error"
                variant="outline"
                icon="i-lucide-trash"
                :loading="isDeletingAvatar"
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
          <UBadge
            :label="user.isActive ? 'Active' : 'Inactive'"
            :color="user.isActive ? 'success' : 'warning'"
            variant="subtle"
          />
        </UFormField>

        <UButton
          v-if="!user.isActive"
          label="Send activation email again"
          icon="i-lucide-mail"
          :loading="isResendingActivation"
          @click="handleResendActivation"
        />
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
            <UButton label="Edit" icon="i-lucide-pencil" @click="handleEdit" />
          </template>

          <template v-else>
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              icon="i-lucide-x"
              @click="handleCancel"
            />
            <UButton
              label="Save"
              icon="i-lucide-check"
              :loading="isUpdatingProfile"
              @click="handleSave"
            />
          </template>
        </div>
      </div>
    </UPageCard>
  </UForm>

  <div v-else class="text-center py-8 text-muted">No user data available</div>
</template>
