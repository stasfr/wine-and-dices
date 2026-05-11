<script setup lang="ts">
import {
  Time,
  CalendarDateTime,
  today,
  getLocalTimeZone,
} from '@internationalized/date';
import { useMutation, useQueryCache } from '@pinia/colada';
import { shallowRef } from 'vue';

import type { ICreateGameBody } from '../types/create';

const FORM_ID = 'create-game-form';

const requestFetch = useRequestFetch();
const toast = useToast();
const queryCache = useQueryCache();

const { data: charactersData } = useQuery({
  key: ['characters'],
  query: () => requestFetch('/api/dices/characters/list'),
});

const charactersList = computed(() => charactersData.value?.data || []);

const characterItems = computed(() =>
  charactersList.value.map((c: { id: string; name: string }) => ({
    label: c.name,
    value: c.id,
  })),
);

const { mutate: createGame, asyncStatus: createAsyncStatus } = useMutation({
  mutation: (data: ICreateGameBody) =>
    requestFetch('/api/dices/games/create', {
      method: 'POST',
      body: data,
    }),
  onSettled: () => {
    queryCache.invalidateQueries({ key: ['games'] });
  },
});

const gameModeItems = [
  { label: '1v1', value: 'one_vs_one' },
  { label: '2v2', value: 'two_vs_two' },
  { label: '3v3', value: 'three_vs_three' },
  { label: '2v2v2', value: 'two_vs_two_vs_two' },
  { label: 'King of the Hill', value: 'king_of_the_hill' },
];

const inputDateRef = useTemplateRef('inputDate');

const date = shallowRef(today(getLocalTimeZone()));
const time = shallowRef(new Time());

const formData = ref({
  comment: '',
  mode: 'king_of_the_hill' as const,
  participants: [
    { playerName: '', characterId: '', winner: false, teamIndex: 0 },
    { playerName: '', characterId: '', winner: false, teamIndex: 1 },
    { playerName: '', characterId: '', winner: false, teamIndex: 2 },
  ],
});

function addParticipant() {
  formData.value.participants.push({
    playerName: '',
    characterId: '',
    winner: false,
    teamIndex: formData.value.participants.length,
  });
}

function removeParticipant(index: number) {
  formData.value.participants.splice(index, 1);
  formData.value.participants.forEach((p, i) => {
    p.teamIndex = i;
  });
}

async function onSubmit() {
  const { comment, mode, participants } = formData.value;
  const currentDate = date.value;
  const currentTime = time.value;

  if (!currentDate) {
    toast.add({
      title: 'Date is required',
      color: 'error',
    });
    return;
  }

  if (!currentTime) {
    toast.add({
      title: 'Time is required',
      color: 'error',
    });
    return;
  }

  const dateTime = new CalendarDateTime(
    currentDate.year,
    currentDate.month,
    currentDate.day,
    currentTime.hour,
    currentTime.minute,
    currentTime.second || 0,
    currentTime.millisecond || 0,
  );

  try {
    createGame({
      date: dateTime.toString(),
      comment,
      mode,
      participants,
    });

    toast.add({
      title: 'Game created',
      color: 'success',
    });
    date.value = today(getLocalTimeZone());
    time.value = new Time();
    formData.value.comment = '';
    formData.value.mode = 'king_of_the_hill';
    formData.value.participants = [
      { playerName: '', characterId: '', winner: false, teamIndex: 0 },
      { playerName: '', characterId: '', winner: false, teamIndex: 1 },
      { playerName: '', characterId: '', winner: false, teamIndex: 2 },
    ];
    navigateTo('/games');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    toast.add({
      title: 'Failed to create game',
      description: error.message,
      color: 'error',
    });
  }
}
</script>

<template>
  <form
    :id="FORM_ID"
    class="space-y-4 flex flex-col gap-2"
    @submit.prevent="onSubmit"
    @keydown.enter.prevent
  >
    <div class="flex gap-2 w-full">
      <UFormField label="Date" name="date" class="flex-1">
        <UInputDate ref="inputDate" v-model="date">
          <template #trailing>
            <UPopover :reference="inputDateRef?.inputsRef?.[3]?.$el">
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-calendar"
                aria-label="Select a date"
                class="px-0"
              />

              <template #content>
                <UCalendar v-model="date" class="p-2" />
              </template>
            </UPopover>
          </template>
        </UInputDate>
      </UFormField>

      <UFormField label="Time" name="time" class="flex-1">
        <UInputTime v-model="time" :hour-cycle="24" />
      </UFormField>
    </div>

    <UFormField label="Comment" name="comment">
      <UTextarea v-model="formData.comment" class="w-full" />
    </UFormField>

    <UFormField label="Mode" name="mode">
      <USelect v-model="formData.mode" :items="gameModeItems" class="w-full" />
    </UFormField>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-medium text-sm">Participants</span>
        <UButton
          type="button"
          size="sm"
          color="neutral"
          variant="ghost"
          label="Add"
          @click="addParticipant"
        />
      </div>

      <div
        v-for="(participant, index) in formData.participants"
        :key="index"
        class="p-3 border rounded-lg space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium"> Participant {{ index + 1 }} </span>
          <UButton
            type="button"
            size="xs"
            color="error"
            variant="ghost"
            label="Remove"
            @click="removeParticipant(index)"
          />
        </div>

        <UFormField
          :name="`participants.${index}.playerName`"
          label="Player Name"
        >
          <UserSearchInput v-model="participant.playerName" />
        </UFormField>

        <!-- TODO: move to its own component -->
        <UFormField
          :name="`participants.${index}.characterId`"
          label="Character"
        >
          <USelect
            v-model="participant.characterId"
            :items="characterItems"
            placeholder="Select character"
          />
        </UFormField>

        <UFormField
          :name="`participants.${index}.teamIndex`"
          label="Team Index"
        >
          <UInput v-model="participant.teamIndex" type="number" />
        </UFormField>

        <UCheckbox
          :name="`participants.${index}.winner`"
          v-model="participant.winner"
          label="Winner"
        />
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        to="/games"
        color="neutral"
        variant="outline"
        label="Cancel"
      />
      <UButton
        type="submit"
        label="Create"
        :loading="createAsyncStatus === 'loading'"
      />
    </div>
  </form>
</template>
