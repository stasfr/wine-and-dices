<script setup lang="ts">
const { getCharactersList } = useDicesApi();

const { data, error: charactersError } = useQuery({
  key: ['characters'],
  query: () => getCharactersList(),
});

const charactersList = computed(() => data.value?.data || []);
</script>

<template>
  <div v-if="charactersError" class="text-center py-8 text-error">
    {{ getErrorMessage(charactersError) }}
  </div>
  <div v-else class="grid grid-cols-2 md:flex md:flex-wrap gap-4 md:gap-8">
    <UPageCard
      v-for="character in charactersList"
      :key="character.id"
      :title="character.name"
    >
      <NuxtImg
        :src="`images/portraits/${character.key}.png`"
        :alt="character.name"
        class="rounded-lg"
        sizes="128px xl:160px"
      />
    </UPageCard>
  </div>
</template>
