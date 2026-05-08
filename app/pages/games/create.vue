<script setup lang="ts">
import * as v from 'valibot';
import { CalendarDate, Time, CalendarDateTime } from '@internationalized/date';

import type { FormSubmitEvent } from '@nuxt/ui';

const requestFetch = useRequestFetch();
const toast = useToast();

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

const { createGame, asyncStatus: createAsyncStatus } = useCreateGame();

const gameModeItems = [
  { label: '1v1', value: 'one_vs_one' },
  { label: '2v2', value: 'two_vs_two' },
  { label: '3v3', value: 'three_vs_three' },
  { label: '2v2v2', value: 'two_vs_two_vs_two' },
  { label: 'King of the Hill', value: 'king_of_the_hill' },
];

const schema = v.object({
  date: v.custom<CalendarDate>(
    (input) => input instanceof CalendarDate,
    'Date is required',
  ),
  time: v.custom<Time>((input) => input instanceof Time, 'Time is required'),
  comment: v.optional(v.pipe(v.string(), v.minLength(1))),
  mode: v.picklist([
    'one_vs_one',
    'two_vs_two',
    'three_vs_three',
    'two_vs_two_vs_two',
    'king_of_the_hill',
  ]),
  participants: v.array(
    v.object({
      playerName: v.pipe(v.string(), v.minLength(1)),
      characterId: v.pipe(v.string(), v.minLength(1)),
      winner: v.boolean(),
      teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
    }),
  ),
});

type Schema = v.InferOutput<typeof schema>;

const inputDate = useTemplateRef('inputDate');

const state = reactive({
  date: undefined as CalendarDate | undefined,
  time: undefined as Time | undefined,
  comment: '',
  mode: 'king_of_the_hill' as const,
  participants: [
    { playerName: '', characterId: '', winner: false, teamIndex: 0 },
    { playerName: '', characterId: '', winner: false, teamIndex: 1 },
    { playerName: '', characterId: '', winner: false, teamIndex: 2 },
  ],
});

function addParticipant() {
  state.participants.push({
    playerName: '',
    characterId: '',
    winner: false,
    teamIndex: state.participants.length,
  });
}

function removeParticipant(index: number) {
  state.participants.splice(index, 1);
  state.participants.forEach((p, i) => {
    p.teamIndex = i;
  });
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { date, time, comment, mode, participants } = event.data;

  if (!date) {
    toast.add({
      title: 'Date is required',
      color: 'error',
    });
    return;
  }

  if (!time) {
    toast.add({
      title: 'Time is required',
      color: 'error',
    });
    return;
  }

  const dateTime = new CalendarDateTime(
    date.year,
    date.month,
    date.day,
    time.hour,
    time.minute,
    time.second || 0,
    time.millisecond || 0,
  );

  createGame(
    {
      date: dateTime.toString(),
      comment,
      mode,
      participants,
    },
    {
      onSuccess: () => {
        toast.add({
          title: 'Game created',
          color: 'success',
        });
        state.date = undefined;
        state.time = undefined;
        state.comment = '';
        state.mode = 'king_of_the_hill';
        state.participants = [
          { playerName: '', characterId: '', winner: false, teamIndex: 0 },
          { playerName: '', characterId: '', winner: false, teamIndex: 1 },
          { playerName: '', characterId: '', winner: false, teamIndex: 2 },
        ];
        navigateTo('/games');
      },
      onError: (error) => {
        toast.add({
          title: 'Failed to create game',
          description: error.message,
          color: 'error',
        });
      },
    },
  );
}
</script>

<template>
  <UPage>
    <UPageHeader title="Create Game">
      <template #links>
        <UButton to="/games" label="Back" icon="i-lucide-arrow-left" />
      </template>
    </UPageHeader>

    <UPageBody>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex gap-2">
          <UFormField label="Date" name="date">
            <UInputDate ref="inputDate" v-model="state.date">
              <template #trailing>
                <UPopover :reference="inputDate?.inputsRef[3]?.$el">
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    aria-label="Select a date"
                    class="px-0"
                  />

                  <template #content>
                    <UCalendar v-model="state.date" class="p-2" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>

          <UFormField label="Time" name="time">
            <UInputTime v-model="state.time" :hour-cycle="24" />
          </UFormField>
        </div>

        <UFormField label="Mode" name="mode">
          <USelect v-model="state.mode" :items="gameModeItems" />
        </UFormField>

        <UFormField label="Comment" name="comment">
          <UTextarea v-model="state.comment" />
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
            v-for="(participant, index) in state.participants"
            :key="index"
            class="p-3 border rounded-lg space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">
                Participant {{ index + 1 }}
              </span>
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
              <UInput v-model="participant.playerName" />
            </UFormField>

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
      </UForm>
    </UPageBody>
  </UPage>
</template>
