<script setup lang="ts">
import type {
  IGameListItem,
  GameMode,
} from '~~/modules/dice-throne-games/runtime/app/types/games';

const requestFetch = useRequestFetch();

const modeFilter = useRouteQuery<string>('mode', '');
const searchFilter = useRouteQuery<string>('search', '');

const filtersOpen = ref(false);

const draftMode = ref('');
const draftSearch = ref('');

function initDraftFilters() {
  draftMode.value = modeFilter.value;
  draftSearch.value = searchFilter.value;
}

watch(filtersOpen, (open) => {
  if (open) {
    initDraftFilters();
  }
});

const modeLabelMap: Record<GameMode, string> = {
  one_vs_one: '1v1',
  two_vs_two: '2v2',
  three_vs_three: '3v3',
  two_vs_two_vs_two: '2v2v2',
  king_of_the_hill: 'King of the Hill',
};

const modeOptions = Object.entries(modeLabelMap).map(([value, label]) => ({
  label,
  value,
}));

const activeFiltersCount = computed(() => {
  let count = 0;
  if (modeFilter.value) {
    count++;
  }
  if (searchFilter.value) {
    count++;
  }
  return count;
});

const {
  data: gamesData,
  isLoading,
  error: gamesError,
} = useQuery({
  key: () => ['games', { mode: modeFilter.value, search: searchFilter.value }],
  query: () =>
    requestFetch('/api/dices/games/list', {
      query: {
        ...(modeFilter.value && { mode: modeFilter.value }),
        ...(searchFilter.value && { search: searchFilter.value }),
      },
    }),
});

const gamesList = computed(() => gamesData.value?.data || []);

function handleViewGame(game: IGameListItem) {
  navigateTo(`/games/${game.id}`);
}

function applyFilters() {
  modeFilter.value = draftMode.value;
  searchFilter.value = draftSearch.value;
  filtersOpen.value = false;
}

function clearFilters() {
  draftMode.value = '';
  draftSearch.value = '';
  modeFilter.value = '';
  searchFilter.value = '';
}
</script>

<template>
  <UPage>
    <UPageHeader title="Dice Throne Games List">
      <template #links>
        <UButton
          color="neutral"
          variant="outline"
          label="Filters"
          trailing-icon="i-lucide-sliders-horizontal"
          :badge="activeFiltersCount > 0 ? activeFiltersCount : undefined"
          @click="filtersOpen = true"
        />
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

    <USlideover
      v-model:open="filtersOpen"
      title="Filters"
      description="Filter games by mode or search text"
      side="right"
    >
      <template #body>
        <div class="flex flex-col gap-6">
          <UFormField label="Game Mode">
            <USelect
              v-model="draftMode"
              :items="modeOptions"
              placeholder="Select mode"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Search">
            <UInput
              v-model="draftSearch"
              placeholder="Search in comments..."
              icon="i-lucide-search"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full">
          <UButton
            color="neutral"
            variant="outline"
            label="Clear"
            class="flex-1"
            @click="clearFilters"
          />
          <UButton label="Apply" class="flex-1" @click="applyFilters" />
        </div>
      </template>
    </USlideover>
  </UPage>
</template>
