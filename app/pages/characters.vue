<script setup lang="ts">
const requestFetch = useRequestFetch();
const { data } = useQuery({
  key: ['characters'],
  query: () => requestFetch('/api/dices/characters/list'),
});

const charactersList = computed(() => data.value?.data || []);
</script>

<template>
  <UPage>
    <UPageHeader title="Dice Throne Characters List" />

    <UPageBody>
      <div class="flex gap-8 flex-wrap">
        <UPageCard
          v-for="character in charactersList"
          :key="character.id"
          :title="character.name"
        >
          <NuxtImg
            :src="`images/portraits/${character.key}.png`"
            :alt="character.name"
            class="w-30 rounded-lg"
          />
        </UPageCard>
      </div>
    </UPageBody>
  </UPage>
</template>
