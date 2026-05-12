<script setup lang="ts">
import type { InputMenuItem } from '@nuxt/ui';
import type { IUserListItem } from '../types/users';

interface Props {
  disabledUsers: string[] | undefined;
}

const props = defineProps<Props>();

const requestFetch = useRequestFetch();

function formatUserName(user: IUserListItem) {
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

const modelValue = defineModel<string>({ required: true });
const searchTerm = ref('');
const debouncedSearchTerm = refDebounced(searchTerm, 300);

const { data: usersData, asyncStatus } = useQuery({
  key: () => ['users', 'search', debouncedSearchTerm.value],
  query: () =>
    requestFetch<{ data: IUserListItem[] }>('/api/users/list', {
      query: { search: debouncedSearchTerm.value },
    }),
  enabled: () => debouncedSearchTerm.value.length >= 1,
});

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
      user.email !== modelValue.value,
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

const avatar = computed(() => {
  const selectedUser = usersData.value?.data.find(
    (user) => user.email === modelValue.value,
  );
  if (!selectedUser) {
    return undefined;
  }
  if (selectedUser.avatar) {
    return {
      src: `/avatars/${selectedUser.avatar}`,
      alt: formatUserName(selectedUser),
      loading: 'lazy' as const,
    };
  }
  return {
    icon: 'i-lucide-user',
    alt: formatUserName(selectedUser),
  };
});
</script>

<template>
  <UInputMenu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :items="items"
    :loading="asyncStatus === 'loading'"
    :avatar="avatar"
    autocomplete
    ignore-filter
    clear
    placeholder="Search user..."
    value-key="value"
  />
</template>
