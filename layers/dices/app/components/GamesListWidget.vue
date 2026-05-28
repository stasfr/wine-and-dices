<script setup lang="ts">
import type { GameMode, IGameListItem } from '../types';

const { getGamesList, getCharactersList } = useDicesApi();

const modeFilter = useRouteQuery<string>('mode', '');
const searchFilter = useRouteQuery<string>('search', '');
const rawCharacterIdsFilter = useRouteQuery<string>('characterIds', '');
const userIdFilter = useRouteQuery<string>('userId', '');
const playerNameFilter = useRouteQuery<string>('playerName', '');

const characterIdsFilter = computed(() => {
  if (!rawCharacterIdsFilter.value) {
    return [];
  }
  return rawCharacterIdsFilter.value.split(',');
});

function setCharacterIdsFilter(value: string[]) {
  if (value.length === 0) {
    rawCharacterIdsFilter.value = '';
  } else {
    rawCharacterIdsFilter.value = value.join(',');
  }
}

const filtersOpen = ref(false);

const draftMode = ref('');
const draftSearch = ref('');
const draftCharacterIds = ref<string[]>([]);
const draftUserId = ref('');
const draftPlayerName = ref('');
const findUsersOpen = ref(false);

function initDraftFilters() {
  draftMode.value = modeFilter.value;
  draftSearch.value = searchFilter.value;
  draftCharacterIds.value = [...characterIdsFilter.value];
  draftUserId.value = userIdFilter.value;
  draftPlayerName.value = playerNameFilter.value;
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
  if (characterIdsFilter.value.length > 0) {
    count++;
  }
  if (userIdFilter.value || playerNameFilter.value) {
    count++;
  }
  return count;
});

const {
  data: gamesData,
  isLoading,
  error: gamesError,
} = useQuery({
  key: () => [
    'games',
    {
      mode: modeFilter.value,
      search: searchFilter.value,
      characterIds: characterIdsFilter.value,
      userId: userIdFilter.value,
      playerName: playerNameFilter.value,
    },
  ],
  query: () => {
    const query: Record<string, string> = {};

    if (modeFilter.value) {
      query.mode = modeFilter.value;
    }
    if (searchFilter.value) {
      query.search = searchFilter.value;
    }
    if (characterIdsFilter.value.length > 0) {
      query.characterIds = characterIdsFilter.value.join(',');
    }
    if (userIdFilter.value) {
      query.userId = userIdFilter.value;
    }
    if (playerNameFilter.value) {
      query.playerName = playerNameFilter.value;
    }

    query.perPage = '100';

    return getGamesList(query);
  },
});

const { data: charactersData } = useQuery({
  key: ['characters'],
  query: () => getCharactersList(),
});

const characterItems = computed(() =>
  (charactersData.value?.data || []).map((character) => ({
    label: character.name,
    value: character.id,
    avatar: {
      src: `images/portraits/${character.key}.png`,
      alt: character.name,
      loading: 'lazy' as const,
    },
  })),
);

const gamesList = computed(() => gamesData.value?.data || []);

function handleViewGame(game: IGameListItem) {
  navigateTo(`/games/${game.id}`);
}

const { user } = useUserSession();

function handleSelectMe() {
  const currentUser = user.value;
  if (!currentUser) {
    return;
  }

  draftPlayerName.value = currentUser.email;
  draftUserId.value = currentUser.id;
}

function handleUserSelected(selectedUser: { email: string; userId: string }) {
  draftPlayerName.value = selectedUser.email;
  draftUserId.value = selectedUser.userId;
  findUsersOpen.value = false;
}

function applyFilters() {
  modeFilter.value = draftMode.value;
  searchFilter.value = draftSearch.value;
  setCharacterIdsFilter([...draftCharacterIds.value]);
  userIdFilter.value = draftUserId.value;
  playerNameFilter.value = draftPlayerName.value;
  filtersOpen.value = false;
}

function clearFilters() {
  draftMode.value = '';
  draftSearch.value = '';
  draftCharacterIds.value = [];
  draftUserId.value = '';
  draftPlayerName.value = '';
  modeFilter.value = '';
  searchFilter.value = '';
  rawCharacterIdsFilter.value = '';
  userIdFilter.value = '';
  playerNameFilter.value = '';
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
          v-if="activeFiltersCount > 0"
          color="error"
          variant="ghost"
          label="Reset filters"
          @click="clearFilters"
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
      description="Filter games by mode, characters or search text"
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

          <UFormField label="Characters">
            <USelect
              v-model="draftCharacterIds"
              :items="characterItems"
              multiple
              placeholder="Select characters"
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

          <UFormField label="Player">
            <div class="flex items-center gap-2">
              <UInput
                v-model="draftPlayerName"
                class="w-full"
                placeholder="Player name or email..."
                :ui="{ trailing: 'pe-1' }"
                @update:model-value="draftUserId = ''"
              >
                <template v-if="draftPlayerName.length > 0" #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-circle-x"
                    aria-label="Clear input"
                    @click="
                      draftPlayerName = '';
                      draftUserId = '';
                    "
                  />
                </template>
              </UInput>
              <UButton
                color="neutral"
                variant="outline"
                label="Select me"
                @click="handleSelectMe"
              />
              <UButton
                color="neutral"
                variant="outline"
                label="Find users"
                @click="findUsersOpen = true"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-2 w-full">
          <UButton
            color="error"
            variant="outline"
            label="Clear"
            icon="i-lucide-trash"
            class="flex-1 flex items-center justify-center"
            @click="clearFilters"
          />
          <UButton
            label="Apply"
            class="flex-1 flex items-center justify-center"
            color="success"
            icon="i-lucide-check"
            @click="applyFilters"
          />
        </div>
      </template>
    </USlideover>

    <FindUsersModal
      v-model:open="findUsersOpen"
      :disabled-users="undefined"
      @select="handleUserSelected"
    />
  </UPage>
</template>
