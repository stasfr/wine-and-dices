<script setup lang="ts">
import type { IGameListItem } from '#shared/types/games';

const { data: gamesData, asyncStatus: gamesAsyncStatus } = useGamesList();
const gamesList = computed(() => gamesData.value?.data || []);
const isLoading = computed(() => gamesAsyncStatus.value === 'loading');

function handleViewGame(game: IGameListItem) {
  navigateTo(`/games/${game.id}`);
}
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
      <div v-if="!isLoading && gamesList.length === 0" class="text-center py-8 text-muted">
        No games found
      </div>
      <GamesTable
        v-else
        :data="gamesList"
        :loading="isLoading"
        @view="handleViewGame"
      />
    </UPageBody>
  </UPage>
</template>
