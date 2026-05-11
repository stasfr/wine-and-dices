<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type { IGameListItem, GameMode } from '#shared/types/games';

interface Props {
  data: IGameListItem[];
  loading: boolean;
}

interface Emits {
  view: [game: IGameListItem];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const modeLabelMap: Record<GameMode, string> = {
  one_vs_one: '1v1',
  two_vs_two: '2v2',
  three_vs_three: '3v3',
  two_vs_two_vs_two: '2v2v2',
  king_of_the_hill: 'King of the Hill',
};

const modeColorMap: Record<GameMode, string> = {
  one_vs_one: 'primary',
  two_vs_two: 'success',
  three_vs_three: 'warning',
  two_vs_two_vs_two: 'info',
  king_of_the_hill: 'error',
};

const columns: TableColumn<IGameListItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => `#${row.getValue('id')}`,
    meta: {
      class: {
        th: 'w-24',
        td: 'font-mono text-muted',
      },
    },
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }) => {
      const mode = row.getValue('mode') as GameMode;
      const label = modeLabelMap[mode] || mode;
      const color = modeColorMap[mode] || 'neutral';

      return h(UBadge, { variant: 'subtle', color }, () => label);
    },
    meta: {
      class: {
        th: 'w-32',
      },
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const dateValue = row.getValue('date') as string;
      return new Date(dateValue).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    },
    meta: {
      class: {
        th: 'w-48',
      },
    },
  },
  {
    accessorKey: 'comment',
    header: 'Comment',
    cell: ({ row }) => {
      const comment = row.getValue('comment') as string | null;
      return comment || '-';
    },
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
    cell: ({ row }) => {
      const game = row.original;

      const items = [
        {
          type: 'label' as const,
          label: 'Actions',
        },
        {
          label: 'View details',
          icon: 'i-lucide-eye',
          onSelect() {
            emit('view', game);
          },
        },
      ];

      return h(
        UDropdownMenu,
        {
          content: {
            align: 'end',
          },
          items,
          'aria-label': 'Actions dropdown',
        },
        () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            'aria-label': 'Actions dropdown',
          }),
      );
    },
  },
];
</script>

<template>
  <UTable
    :data="props.data"
    :columns="columns"
    :loading="props.loading"
    class="flex-1"
  />
</template>
