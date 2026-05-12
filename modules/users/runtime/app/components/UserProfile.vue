<script setup lang="ts">
import type { IUserProfile } from '../types/users';

interface Props {
  user: IUserProfile | null | undefined;
}

const props = defineProps<Props>();

function formatValue(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value;
}
</script>

<template>
  <div v-if="props.user" class="space-y-4">
    <UPageCard title="Account">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">ID</span>
          <span class="text-sm">{{ props.user.id }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">Email</span>
          <span class="text-sm">{{ props.user.email }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">Status</span>
          <UBadge
            :color="props.user.isActive ? 'success' : 'error'"
            :label="props.user.isActive ? 'Active' : 'Inactive'"
          />
        </div>
      </div>
    </UPageCard>

    <UPageCard title="Full Name">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">Last Name</span>
          <span class="text-sm">{{ formatValue(props.user.lastName) }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">First Name</span>
          <span class="text-sm">{{ formatValue(props.user.firstName) }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">Middle Name</span>
          <span class="text-sm">{{ formatValue(props.user.middleName) }}</span>
        </div>
      </div>
    </UPageCard>
  </div>

  <div v-else class="text-center py-8 text-muted">
    No user data available
  </div>
</template>
