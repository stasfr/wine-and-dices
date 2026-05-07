<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

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
      <UTooltip text="Login or register">
        <UButton
          color="neutral"
          variant="ghost"
          to="/auth/login"
          icon="i-lucide-circle-user"
          aria-label="GitHub"
        />
      </UTooltip>

      <UColorModeButton />
    </template>
  </UHeader>
</template>
