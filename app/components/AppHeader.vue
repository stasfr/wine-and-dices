<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui';

const { loggedIn, user, clear } = useUserSession();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dices',
    icon: 'i-lucide-dices',
    children: [
      {
        label: 'Characters list',
        icon: 'i-lucide-users',
        to: '/characters',
      },
      {
        label: 'Games list',
        icon: 'i-lucide-gamepad-2',
        to: '/games',
      },
      {
        label: 'Create Game',
        icon: 'i-lucide-square-plus',
        to: '/games/create',
      },
    ],
  },
]);

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: async () => {
        await clear();
        await navigateTo('/auth/login');
      },
    },
  ],
]);
</script>

<template>
  <UHeader
    title="W&D"
    to="/"
    :ui="{
      center: 'basis-1/2 flex-1',
    }"
  >
    <UNavigationMenu :items="items" class="w-full justify-center" />

    <template #right>
      <template v-if="loggedIn">
        <UDropdownMenu :items="userMenuItems">
          <UButton color="neutral" variant="ghost" icon="i-lucide-circle-user">
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

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
