<script setup lang="ts">
import type { IGameDetail, IGameParticipantDetail, GameMode } from '#shared/types/games';

const route = useRoute();
const gameId = computed(() => route.params.gameId as string);

const requestFetch = useRequestFetch();

const { data: gameData, asyncStatus } = useQuery({
  key: () => ['games', gameId.value],
  query: () =>
    requestFetch<{ data: IGameDetail }>(`/api/dices/games/${gameId.value}`),
});

const isLoading = computed(() => asyncStatus.value === 'loading');

const game = computed(() => gameData.value?.data.game);
const participants = computed(() => gameData.value?.data.participants || []);

const modeLabelMap: Record<GameMode, string> = {
  one_vs_one: '1v1',
  two_vs_two: '2v2',
  three_vs_three: '3v3',
  two_vs_two_vs_two: '2v2v2',
  king_of_the_hill: 'King of the Hill',
};

const modeLabel = computed(() => {
  const mode = game.value?.mode;
  if (!mode) {
    return '';
  }
  return modeLabelMap[mode] || mode;
});

const teamCount = computed(() => {
  const mode = game.value?.mode;

  if (!mode) {
    return 0;
  }

  switch (mode) {
    case 'one_vs_one':
      return 2;
    case 'two_vs_two':
      return 2;
    case 'three_vs_three':
      return 2;
    case 'two_vs_two_vs_two':
      return 3;
    default:
      return 0;
  }
});

const groupedParticipants = computed(() => {
  const groups: Record<
    number,
    IGameParticipantDetail[]
  > = {};

  for (const participant of participants.value) {
    if (!groups[participant.teamIndex]) {
      groups[participant.teamIndex] = [];
    }

    const group = groups[participant.teamIndex];
    if (!group) {
      continue;
    }

    group.push(participant);
  }

  return groups;
});

function formatUserName(participant: IGameParticipantDetail) {
  if (participant.playerName) {
    return participant.playerName;
  }

  const parts: string[] = [];
  if (participant.userLastName) {
    parts.push(participant.userLastName);
  }
  if (participant.userFirstName) {
    parts.push(participant.userFirstName);
  }
  if (participant.userMiddleName) {
    parts.push(participant.userMiddleName);
  }
  if (parts.length > 0) {
    return parts.join(' ');
  }

  return participant.userEmail || 'Unknown';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
</script>

<template>
  <UPage>
    <UPageHeader :title="isLoading ? 'Loading...' : 'Game Details'">
      <template #links>
        <UButton
          to="/games"
          label="Back to list"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div v-if="isLoading" class="text-center py-8 text-muted">
        Loading game details...
      </div>

      <div v-else-if="!game" class="text-center py-8 text-muted">
        Game not found
      </div>

      <div v-else class="space-y-6 flex flex-col gap-4">
        <div class="flex gap-4 w-full">
          <UCard class="flex-1">
            <template #header>
              <span class="font-medium text-sm">Date</span>
            </template>
            <span class="text-base">{{ formatDate(game.date) }}</span>
          </UCard>

          <UCard class="flex-1">
            <template #header>
              <span class="font-medium text-sm">Mode</span>
            </template>
            <UBadge variant="subtle">
              {{ modeLabel }}
            </UBadge>
          </UCard>
        </div>

        <UCard v-if="game.comment">
          <template #header>
            <span class="font-medium text-sm">Comment</span>
          </template>
          <p class="text-base whitespace-pre-wrap">{{ game.comment }}</p>
        </UCard>

        <div
          v-if="game.mode !== 'king_of_the_hill'"
          class="space-y-4"
        >
          <div
            class="grid gap-4"
            :class="teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'"
          >
            <UCard
              v-for="teamIdx in teamCount"
              :key="teamIdx"
              class="w-full"
            >
              <template #header>
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm">Team {{ teamIdx }}</span>
                </div>
              </template>

              <div class="space-y-4">
                <div
                  v-for="participant in groupedParticipants[teamIdx - 1] || []"
                  :key="participant.id"
                  class="flex items-center gap-3 p-3 rounded-lg border border-default"
                  :class="participant.winner ? 'bg-success/10 border-success/30' : 'bg-default'"
                >
                  <UAvatar
                    v-if="participant.characterKey"
                    :src="`/images/portraits/${participant.characterKey}.png`"
                    :alt="participant.characterName || ''"
                    size="md"
                  />
                  <UAvatar v-else size="md" icon="i-lucide-user" />

                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">
                      {{ formatUserName(participant) }}
                    </div>
                    <div class="text-xs text-muted truncate">
                      {{ participant.characterName || 'Unknown character' }}
                    </div>
                  </div>

                  <UBadge
                    v-if="participant.winner"
                    color="success"
                    variant="subtle"
                    size="sm"
                    label="Winner"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div v-else class="space-y-4">
          <UCard class="w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">Participants</span>
              </div>
            </template>

            <div class="space-y-2">
              <div
                v-for="participant in participants"
                :key="participant.id"
                class="flex items-center gap-3 p-3 rounded-lg border border-default"
                :class="participant.winner ? 'bg-success/10 border-success/30' : 'bg-default'"
              >
                <UAvatar
                  v-if="participant.characterKey"
                  :src="`/images/portraits/${participant.characterKey}.png`"
                  :alt="participant.characterName || ''"
                  size="md"
                />
                <UAvatar v-else size="md" icon="i-lucide-user" />

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">
                    {{ formatUserName(participant) }}
                  </div>
                  <div class="text-xs text-muted truncate">
                    {{ participant.characterName || 'Unknown character' }}
                  </div>
                </div>

                <UBadge
                  v-if="participant.winner"
                  color="success"
                  variant="subtle"
                  size="sm"
                  label="Winner"
                />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
