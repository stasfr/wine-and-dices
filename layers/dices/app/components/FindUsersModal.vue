<script setup lang="ts">
import type { InputMenuItem } from '@nuxt/ui';

interface UserListItem {
  id: string;
  email: string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  avatar: string | null;
}

interface Props {
  disabledUsers: string[] | undefined;
}

const props = defineProps<Props>();

interface Emits {
  select: [value: { email: string; userId: string }];
  'update:open': [value: boolean];
}

const emit = defineEmits<Emits>();

const open = defineModel<boolean>('open', { required: true });

const requestFetch = useRequestFetch();
const searchTerm = ref('');
const debouncedSearchTerm = refDebounced(searchTerm, 300);
const selectedEmail = ref('');

const { data: usersData, asyncStatus } = useQuery({
  key: () => ['users', 'search', debouncedSearchTerm.value],
  query: () =>
    requestFetch<{ data: UserListItem[] }>('/api/users/list', {
      query: { search: debouncedSearchTerm.value },
    }),
  enabled: () => debouncedSearchTerm.value.length >= 1,
});

function formatUserName(user: UserListItem) {
  const parts: string[] = [];
  if (user.lastName) {
    parts.push(user.lastName);
  }
  if (user.firstName) {
    parts.push(user.firstName);
  }
  if (user.middleName) {
    parts.push(user.middleName);
  }
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return user.email;
}

const items = computed<InputMenuItem[]>(() => {
  if (!usersData.value) {
    return [];
  }

  return usersData.value.data.map((user) => ({
    label: formatUserName(user),
    description: user.email,
    value: user.email,
    disabled:
      props.disabledUsers?.includes(user.email) &&
      user.email !== selectedEmail.value,
    avatar: user.avatar
      ? {
          src: `/avatars/${user.avatar}`,
          alt: formatUserName(user),
          loading: 'lazy' as const,
        }
      : {
          icon: 'i-lucide-user',
          alt: formatUserName(user),
        },
  }));
});

function handleSelect() {
  const email = selectedEmail.value;
  if (!email) {
    return;
  }

  const selectedUser = usersData.value?.data.find((u) => u.email === email);
  if (!selectedUser) {
    return;
  }

  emit('select', { email: selectedUser.email, userId: selectedUser.id });
  selectedEmail.value = '';
  searchTerm.value = '';
}

function handleClose() {
  selectedEmail.value = '';
  searchTerm.value = '';
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Find Users"
    description="Search and select a registered user"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UInputMenu
          v-model="selectedEmail"
          v-model:search-term="searchTerm"
          :items="items"
          :loading="asyncStatus === 'loading'"
          autocomplete
          ignore-filter
          clear
          placeholder="Search user..."
          value-key="value"
          class="w-full"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 w-full justify-end">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          @click="handleClose"
        />
        <UButton
          label="Select"
          :disabled="!selectedEmail"
          @click="handleSelect"
        />
      </div>
    </template>
  </UModal>
</template>
