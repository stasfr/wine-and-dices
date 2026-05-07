<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui';

const { loggedIn, user, clear } = useUserSession();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Characters',
    to: '/characters',
  },
  {
    label: 'Games',
    to: '/games',
  },
]);

const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    to: '/profile',
  },
  {
    label: 'Logout',
    icon: 'i-lucide-log-out',
    color: 'error',
    onSelect: async () => {
      await clear();
      await navigateTo('/');
    },
  },
]);
</script>

<template>
  <UHeader title="W&D" to="/">
    <UNavigationMenu :items="items" color="neutral" />

    <template #right>
      <template v-if="loggedIn">
        <UDropdownMenu :items="userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-circle-user"
          >
            <template v-if="user && user.email">
              {{ user.email }}
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
      <template v-else>
        <UTooltip text="Login or register">
          <UButton
            color="neutral"
            variant="ghost"
            to="/auth/login"
            icon="i-lucide-circle-user"
            aria-label="Login or register"
          />
        </UTooltip>
      </template>

      <UColorModeButton />
    </template>
  </UHeader>
</template>
