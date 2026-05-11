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

  return usersData.value.data
    .filter((user) => {
      if (!props.disabledUsers) {
        return true;
      }

      return (
        !props.disabledUsers.includes(user.email) ||
        user.email === modelValue.value
      );
    })
    .map((user) => ({
      label: formatUserName(user),
      description: user.email,
      value: user.email,
    }));
});
</script>

<template>
  <UInputMenu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :items="items"
    :loading="asyncStatus === 'loading'"
    autocomplete
    ignore-filter
    clear
    icon="i-lucide-user"
    placeholder="Search user..."
    value-key="value"
  />
</template>
