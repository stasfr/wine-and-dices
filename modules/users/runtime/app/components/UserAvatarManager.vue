<script setup lang="ts">
import { useMutation } from '@pinia/colada';

const toast = useToast();
const requestFetch = useRequestFetch();
const { handleError } = useErrorHandler();
const { user, fetch } = useUserSession();

const avatarFileInputEl = useTemplateRef('avatarFileInput');

const avatarUrl = computed(() => {
  const currentUser = user.value;
  if (!currentUser || !currentUser.avatar) {
    return undefined;
  }

  return `/avatars/${currentUser.avatar}`;
});

const { mutate: uploadAvatar, isLoading: isUploadingAvatar } = useMutation({
  mutation: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return requestFetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
    });
  },
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

function handleAvatarInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    uploadAvatar(file);
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
</template>
