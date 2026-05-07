<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const { loggedIn, user } = useUserSession();

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
</script>

<template>
  <UHeader title="W&D" to="/">
    <UNavigationMenu :items="items" color="neutral" />

    <template #right>
      <template v-if="loggedIn">
        <UButton
          color="neutral"
          variant="ghost"
          to="/profile"
          icon="i-lucide-circle-user"
        >
          <template v-if="user && user.email">
            {{ user.email }}
          </template>
        </UButton>
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
