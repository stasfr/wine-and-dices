<script setup lang="ts">
import { useMutation } from '@pinia/colada';

const { user } = useUserSession();

const toast = useToast();
const {
  resendActivation: resendActivationRequest,
  updateProfile: updateProfileRequest,
} = useAuthApi();
const { handleError } = useErrorHandler();
const { fetch } = useUserSession();

const { mutate: resendActivation, isLoading: isResendingActivation } =
  useMutation({
    mutation: () => resendActivationRequest(),
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
    updateProfileRequest({
      firstName: state.value.firstName,
      lastName: state.value.lastName,
      middleName: state.value.middleName,
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

}

function handleSave() {
  updateProfile();
}
</script>

<template>
  <UForm v-if="user" :state="state" class="space-y-4">
    <UPageCard title="Account">
      <div class="space-y-4">
        <UserAvatarManager />

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
