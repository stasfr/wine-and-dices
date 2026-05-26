<script setup lang="ts">
const value = defineModel<string>({ required: true });

const gameModeItems = [
  { label: '1v1', value: 'one_vs_one' },
  { label: '2v2', value: 'two_vs_two' },
  { label: '3v3', value: 'three_vs_three' },
  { label: '2v2v2', value: 'two_vs_two_vs_two' },
  { label: 'King of the Hill', value: 'king_of_the_hill' },
];
</script>

<template>
  <UFormField label="Mode" name="mode">
    <USelect v-model="value" :items="gameModeItems" class="w-full" />
  </UFormField>
</template>
