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
const { handleError } = useErrorHandler();

const { mutate: createGame, isLoading: isCreatingGame } = useMutation({
  mutation: (data: ICreateGameBody) =>
    requestFetch('/api/dices/games/create', {
      method: 'POST',
      body: data,
    }),
  onSuccess: () => {
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
  },
  onError: (err) => {
    handleError(err, {
      title: 'Failed to create game',
      fallback: 'An error occurred',
    });
  },
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
  participants: v.pipe(
    v.array(
      v.object({
        playerName: v.pipe(
          v.string(),
          v.minLength(1, 'Player name is required'),
        ),
        characterId: v.pipe(
          v.string(),
          v.minLength(1, 'Character is required'),
        ),
        winner: v.boolean(),
        teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
      }),
    ),
    v.maxLength(6),
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

function validateWinners() {
  const errors: FormError[] = [];
  const winnerCount = state.value.participants.filter((p) => p.winner).length;

  if (winnerCount === 0) {
    errors.push({
      name: 'participants',
      message: 'At least one participant must be a winner',
    });
    return errors;
  }

  if (state.value.mode === 'king_of_the_hill') {
    if (winnerCount !== 1) {
      errors.push({
        name: 'participants',
        message: 'King of the hill mode requires exactly 1 winner',
      });
    }
  } else {
    const participantsByTeam = new Map<number, Schema['participants']>();

    for (const participant of state.value.participants) {
      const team = participantsByTeam.get(participant.teamIndex) || [];
      team.push(participant);
      participantsByTeam.set(participant.teamIndex, team);
    }

    let winningTeamCount = 0;
    for (const [, teamParticipants] of participantsByTeam) {
      const teamWinnerCount = teamParticipants.filter((p) => p.winner).length;
      const allWinners = teamWinnerCount === teamParticipants.length;
      const noWinners = teamWinnerCount === 0;

      if (!allWinners && !noWinners) {
        errors.push({
          name: 'participants',
          message: 'All members of a team must be winners or none',
        });
        break;
      }

      if (allWinners) {
        winningTeamCount++;
      }
    }

    if (winningTeamCount !== 1) {
      errors.push({
        name: 'participants',
        message: 'Exactly one team must be the winner',
      });
    }
  }

  return errors;
}

const isFormValid = computed(() => {
  const schemaResult = v.safeParse(schema, state.value);
  if (!schemaResult.success) {
    return false;
  }

  if (!date.value) {
    return false;
  }

  if (!time.value) {
    return false;
  }

  const winnerErrors = validateWinners();
  if (winnerErrors.length > 0) {
    return false;
  }

  return true;
});

const disabledCharacters = computed(() =>
  state.value.participants
    .map((participant) => participant.characterId)
    .filter((characterId) => characterId !== ''),
);

const disabledUsers = computed(() =>
  state.value.participants
    .map((participant) => participant.playerName)
    .filter((playerName) => playerName !== ''),
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

  if (state.value.mode === 'king_of_the_hill') {
    if (state.value.participants.length < 3) {
      errors.push({
        name: 'participants',
        message: 'King of the hill requires at least 3 participants',
      });
    }

    if (state.value.participants.length > 6) {
      errors.push({
        name: 'participants',
        message: 'Maximum 6 participants allowed',
      });
    }
  }

  errors.push(...validateWinners());

  return errors;
}

function handleToggleWinner(index: number) {
  const participant = state.value.participants[index];
  if (!participant) {
    return;
  }

  const newWinnerState = !participant.winner;

  if (state.value.mode === 'king_of_the_hill') {
    for (let i = 0; i < state.value.participants.length; i++) {
      const p = state.value.participants[i];
      if (!p) {
        continue;
      }
      p.winner = i === index ? newWinnerState : false;
    }
  } else {
    const teamIndex = participant.teamIndex;
    for (const p of state.value.participants) {
      p.winner = p.teamIndex === teamIndex ? newWinnerState : false;
    }
  }
}

function addParticipant() {
  if (state.value.participants.length >= 6) {
    return;
  }

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

function onSubmit(event: FormSubmitEvent<Schema>) {
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

  createGame({
    date: dateTime.toString(),
    comment,
    mode,
    participants,
  });
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
              :disabled-users="disabledUsers"
              :removable="false"
              @toggle-winner="handleToggleWinner"
              @update:participant="state.participants[item.index] = $event"
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
              icon="i-lucide-plus"
              :disabled="state.participants.length >= 6"
              @click="addParticipant"
            />
          </div>
        </template>

        <div class="space-y-4">
          <GameParticipantForm
            v-for="(participant, index) in state.participants"
            :key="index"
            :participant="participant"
            :index="index"
            :disabled-characters="disabledCharacters"
            :disabled-users="disabledUsers"
            :removable="state.participants.length > 3"
            @remove="removeParticipant"
            @toggle-winner="handleToggleWinner"
            @update:participant="state.participants[index] = $event"
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
        icon="i-lucide-x"
      />
      <UButton
        type="submit"
        label="Create"
        icon="i-lucide-check"
        :loading="isCreatingGame"
        :disabled="!isFormValid"
      />
    </div>
  </UForm>
</template>
