<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type {
  IGameListItem,
  GameMode,
  IGameParticipantDetail,
} from '../types/games';
import { parseAbsoluteToLocal } from '@internationalized/date';

interface Props {
  data: IGameListItem[];
  loading: boolean;
}

interface Emits {
  view: [game: IGameListItem];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modeLabelMap: Record<GameMode, string> = {
  one_vs_one: '1v1',
  two_vs_two: '2v2',
  three_vs_three: '3v3',
  two_vs_two_vs_two: '2v2v2',
  king_of_the_hill: 'King of the Hill',
};

const modeColorMap: Record<
  GameMode,
  'primary' | 'success' | 'warning' | 'info' | 'error'
> = {
  one_vs_one: 'primary',
  two_vs_two: 'success',
  three_vs_three: 'warning',
  two_vs_two_vs_two: 'info',
  king_of_the_hill: 'error',
};

const columns: TableColumn<IGameListItem>[] = [
  {
    accessorKey: 'teams',
    header: 'Players',
    meta: {
      class: {
        th: 'w-64',
      },
    },
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    meta: {
      class: {
        th: 'w-32',
      },
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    meta: {
      class: {
        th: 'w-48',
      },
    },
  },
  {
    accessorKey: 'comment',
    header: 'Comment',
    meta: {
      class: {
        td: 'max-w-64 truncate',
      },
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableHiding: false,
    meta: {
      class: {
        td: 'text-right',
      },
    },
  },
];

function formatParticipant(participant: IGameParticipantDetail) {
  const character =
    participant.characterName || participant.characterKey || 'Unknown';
  let player = 'Unknown';

  if (participant.userFirstName || participant.userLastName) {
    player = [participant.userFirstName, participant.userLastName]
      .filter(Boolean)
      .join(' ');
  } else if (participant.playerName) {
    player = participant.playerName;
  }

  return `${character} - ${player}`;
}

function formatDate(dateValue: string) {
  const zoned = parseAbsoluteToLocal(dateValue.replace(' ', 'T'));
  return zoned.toDate().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getModeLabel(mode: GameMode) {
  return modeLabelMap[mode] || mode;
}

function getModeColor(mode: GameMode) {
  const color = modeColorMap[mode];
  if (!color) {
    return 'neutral';
  }
  return color;
}
</script>

<template>
  <UTable
    :data="props.data"
    :columns="columns"
    :loading="props.loading"
    class="flex-1"
  >
    <template #teams-cell="{ row }">
      <div class="flex flex-col gap-2">
        <template
          v-for="(team, teamIdx) in row.original.teams"
          :key="team.teamIndex"
        >
          <div
            class="flex flex-col gap-1"
            :class="{ 'text-green-600': team.winner }"
          >
            <span
              v-for="participant in team.participants"
              :key="participant.id"
            >
              {{ formatParticipant(participant) }}
            </span>
          </div>
          <USeparator
            v-if="teamIdx < row.original.teams.length - 1"
            type="dashed"
            class="my-1"
          />
        </template>
      </div>
    </template>

    <template #mode-cell="{ row }">
      <UBadge
        :label="getModeLabel(row.original.mode)"
        variant="subtle"
        :color="getModeColor(row.original.mode)"
      />
    </template>

    <template #date-cell="{ row }">
      {{ formatDate(row.original.date) }}
    </template>

    <template #comment-cell="{ row }">
      {{ row.original.comment || '-' }}
    </template>

    <template #actions-cell="{ row }">
      <UDropdownMenu
        :items="[
          { type: 'label', label: 'Actions' },
          {
            label: 'View details',
            icon: 'i-lucide-eye',
            onSelect: () => emit('view', row.original),
          },
        ]"
        :content="{ align: 'end' }"
        aria-label="Actions dropdown"
      >
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          aria-label="Actions dropdown"
        />
      </UDropdownMenu>
    </template>
  </UTable>
</template>
