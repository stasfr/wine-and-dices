<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'About',
    to: '/about',
  },
  {
    label: 'Portfolio',
    to: '/portfolio',
  },
  {
    label: 'Contacts',
    to: '/contacts',
  },
]);
</script>

<template>
  <UHeader title="App" to="/">
    <UNavigationMenu :items="items" color="neutral" />

    <template #right>
      <UColorModeButton />

      <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/stasfr"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
    </template>
  </UHeader>
</template>
