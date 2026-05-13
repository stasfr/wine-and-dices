<script setup lang="ts">
import type { IGameListItem } from '~~/modules/dice-throne-games/runtime/app/types/games';

const requestFetch = useRequestFetch();

const {
  data: gamesData,
  isLoading,
  error: gamesError,
} = useQuery({
  key: ['games'],
  query: () => requestFetch('/api/dices/games/list'),
});
const gamesList = computed(() => gamesData.value?.data || []);

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
      <div v-if="gamesError" class="text-center py-8 text-error">
        {{ getErrorMessage(gamesError) }}
      </div>
      <div
        v-else-if="!isLoading && gamesList.length === 0"
        class="text-center py-8 text-muted"
      >
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
