<script setup lang="ts">
const { data: gamesData, asyncStatus: gamesAsyncStatus } = useGamesList();
const gamesList = computed(() => gamesData.value?.data || []);
</script>

<template>
  <UPage>
    <UPageHeader title="Dice Throne Games List">
      <template #links>
        <UButton
          to="/games/create"
          label="Create Game"
          color="success"
          trailing-icon="i-lucide-square-plus"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div v-if="gamesAsyncStatus === 'loading'">Loading...</div>
      <div v-else-if="gamesList.length === 0">No games found</div>
      <pre v-else>{{ JSON.stringify(gamesList, null, 2) }}</pre>
    </UPageBody>
  </UPage>
</template>
