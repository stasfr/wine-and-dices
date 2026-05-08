<script setup lang="ts">
import type { InputMenuItem } from '@nuxt/ui';
import type { IUserListItem } from '../types/users';

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
    value: user.id,
    email: user.email,
  }));
});
</script>

<template>
  <UInputMenu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    autocomplete
    :items="items"
    :loading="asyncStatus === 'loading'"
    ignore-filter
    icon="i-lucide-user"
    placeholder="Search user..."
  >
    <template #item-label="{ item }">
      <template v-if="item && typeof item === 'object'">
        {{ 'label' in item ? item.label : '' }}
        <span v-if="'email' in item" class="text-muted">
          {{ item.email }}
        </span>
      </template>
    </template>
  </UInputMenu>
</template>
