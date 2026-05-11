<script setup lang="ts">
import {
  Time,
  CalendarDateTime,
  today,
  getLocalTimeZone,
} from '@internationalized/date';
import { useMutation, useQueryCache } from '@pinia/colada';
import * as v from 'valibot';

import type { FormError, FormSubmitEvent } from '@nuxt/ui';
import type { ICreateGameBody } from '../types/create';

const FORM_ID = 'create-game-form';

const requestFetch = useRequestFetch();
const toast = useToast();
const queryCache = useQueryCache();

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

const inputDateRef = useTemplateRef('inputDate');

const date = shallowRef(today(getLocalTimeZone()));
const time = shallowRef(new Time());

const schema = v.object({
  comment: v.string(),
  mode: v.pipe(v.string(), v.minLength(1, 'Mode is required')),
  participants: v.array(
    v.object({
      playerName: v.pipe(v.string(), v.minLength(1, 'Player name is required')),
      characterId: v.pipe(v.string(), v.minLength(1, 'Character is required')),
      winner: v.boolean(),
      teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
    }),
  ),
});

type Schema = v.InferOutput<typeof schema>;

function createDefaultParticipants(mode: string) {
  if (mode === 'king_of_the_hill') {
    return [
      { playerName: '', characterId: '', winner: false, teamIndex: 0 },
      { playerName: '', characterId: '', winner: false, teamIndex: 0 },
      { playerName: '', characterId: '', winner: false, teamIndex: 0 },
    ];
  }

  const configs: Record<string, { teams: number; playersPerTeam: number }> = {
    one_vs_one: { teams: 2, playersPerTeam: 1 },
    two_vs_two: { teams: 2, playersPerTeam: 2 },
    three_vs_three: { teams: 2, playersPerTeam: 3 },
    two_vs_two_vs_two: { teams: 3, playersPerTeam: 2 },
  };

  const config = configs[mode] || { teams: 2, playersPerTeam: 1 };
  const participants = [];

  for (let team = 0; team < config.teams; team++) {
    for (let player = 0; player < config.playersPerTeam; player++) {
      participants.push({
        playerName: '',
        characterId: '',
        winner: false,
        teamIndex: team,
      });
    }
  }

  return participants;
}

const state = ref<Schema>({
  comment: '',
  mode: 'one_vs_one',
  participants: createDefaultParticipants('one_vs_one'),
});

watch(
  () => state.value.mode,
  (newMode) => {
    state.value.participants = createDefaultParticipants(newMode);
  },
);

const disabledCharacters = computed(() =>
  state.value.participants
    .map((participant) => participant.characterId)
    .filter((characterId) => characterId !== ''),
);

const teamCount = computed(() => {
  switch (state.value.mode) {
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
    { participant: Schema['participants'][0]; index: number }[]
  > = {};

  if (state.value.mode === 'king_of_the_hill') {
    return groups;
  }

  state.value.participants.forEach((participant, index) => {
    if (!groups[participant.teamIndex]) {
      groups[participant.teamIndex] = [];
    }

    const group = groups[participant.teamIndex];
    if (!group) {
      return;
    }

    group.push({ participant, index });
  });

  return groups;
});

function validate() {
  const errors: FormError[] = [];

  if (!date.value) {
    errors.push({ name: 'date', message: 'Date is required' });
  }

  if (!time.value) {
    errors.push({ name: 'time', message: 'Time is required' });
  }

  return errors;
}

function addParticipant() {
  state.value.participants.push({
    playerName: '',
    characterId: '',
    winner: false,
    teamIndex: 0,
  });
}

function removeParticipant(index: number) {
  state.value.participants.splice(index, 1);
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const currentDate = date.value;
  const currentTime = time.value;

  if (!currentDate) {
    return;
  }

  if (!currentTime) {
    return;
  }

  const { comment, mode, participants } = event.data;

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
    state.value.comment = '';
    state.value.mode = 'one_vs_one';
    state.value.participants = createDefaultParticipants('one_vs_one');

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
  <UForm
    :id="FORM_ID"
    :schema="schema"
    :state="state"
    :validate="validate"
    class="space-y-4 flex flex-col gap-2"
    @submit="onSubmit"
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
      <UTextarea v-model="state.comment" class="w-full" />
    </UFormField>

    <GameModeSelect v-model="state.mode" />

    <div v-if="state.mode !== 'king_of_the_hill'" class="space-y-2">
      <div
        class="grid gap-4"
        :class="teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <UCard
          v-for="teamIdx in teamCount"
          :key="teamIdx"
          :title="`Team ${teamIdx}`"
          class="w-full"
        >
          <div class="space-y-4">
            <GameParticipantForm
              v-for="item in groupedParticipants[teamIdx - 1] || []"
              :key="item.index"
              :participant="item.participant"
              :index="item.index"
              :disabled-characters="disabledCharacters"
            />
          </div>
        </UCard>
      </div>
    </div>

    <div v-else class="space-y-2">
      <UCard class="w-full">
        <template #header>
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
        </template>

        <div class="space-y-2">
          <GameParticipantForm
            v-for="(participant, index) in state.participants"
            :key="index"
            :participant="participant"
            :index="index"
            :disabled-characters="disabledCharacters"
            :removable="state.participants.length > 2"
            @remove="removeParticipant"
          />
        </div>
      </UCard>
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
  </UForm>
</template>
