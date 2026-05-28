<script setup lang="ts">
import { parseAbsoluteToLocal } from '@internationalized/date';

import type { GameMode, IGameParticipantDetail } from '../types';

const gameId = useRouteParams<string>('gameId', '');
const { getGame } = useDicesApi();

const {
  data: gameData,
  isLoading,
  error: gameError,
} = useQuery({
  key: () => ['games', gameId.value],
  query: () => getGame(gameId.value),
});

const game = computed(() => gameData.value?.data.game);
const teams = computed(() => gameData.value?.data.teams || []);

const allParticipants = computed(() => {
  const result: IGameParticipantDetail[] = [];
  for (const team of teams.value) {
    result.push(...team.participants);
  }
  return result;
});

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

function formatDate(dateString: string, timeString: string | null) {
  const str = timeString || dateString;
  const zoned = parseAbsoluteToLocal(str.replace(' ', 'T'));
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  if (timeString) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  }
  return zoned.toDate().toLocaleString('en-US', options);
}
</script>

<template>
  <div v-if="isLoading" class="text-center py-8 text-muted">
    Loading game details...
  </div>

  <div v-else-if="gameError" class="text-center py-8 text-error">
    {{ getErrorMessage(gameError) }}
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
        <span class="text-base">{{ formatDate(game.date, game.time) }}</span>
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

    <div v-if="game.mode !== 'king_of_the_hill'" class="space-y-4">
      <div
        class="grid gap-4"
        :class="teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <UCard
          v-for="team in teams"
          :key="team.teamIndex"
          class="w-full"
          :ui="{ root: team.winner ? 'ring-success/30' : '' }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium text-sm">
                Team {{ team.teamIndex + 1 }}
              </span>
              <UBadge
                v-if="game.isTie"
                color="warning"
                variant="subtle"
                label="Tie"
              />
              <UBadge
                v-else-if="team.winner"
                color="success"
                variant="subtle"
                label="Winner"
              />
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="participant in team.participants"
              :key="participant.id"
              class="flex items-center gap-2 p-2 rounded-lg border border-default bg-default"
            >
              <UAvatar
                v-if="participant.characterKey"
                :src="`/images/portraits/${participant.characterKey}.png`"
                :alt="participant.characterName || ''"
              />
              <UAvatar v-else icon="i-lucide-user" />

              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">
                  {{ formatUserName(participant) }}
                </div>
                <div class="text-xs text-muted truncate">
                  {{ participant.characterName || 'Unknown character' }}
                </div>
              </div>
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
            v-for="participant in allParticipants"
            :key="participant.id"
            class="flex items-center gap-2 p-2 rounded-lg border border-default"
            :class="
              game.isTie
                ? 'bg-warning/10 border-warning/30'
                : participant.winner
                  ? 'bg-success/10 border-success/30'
                  : 'bg-default'
            "
          >
            <UAvatar
              v-if="participant.characterKey"
              :src="`/images/portraits/${participant.characterKey}.png`"
              :alt="participant.characterName || ''"
            />
            <UAvatar v-else icon="i-lucide-user" />

            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">
                {{ formatUserName(participant) }}
              </div>
              <div class="text-xs text-muted truncate">
                {{ participant.characterName || 'Unknown character' }}
              </div>
            </div>

            <UBadge
              v-if="game.isTie"
              color="warning"
              variant="subtle"
              label="Tie"
            />
            <UBadge
              v-else-if="participant.winner"
              color="success"
              variant="subtle"
              label="Winner"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
