<script setup lang="ts">
import * as v from 'valibot';

const participantSchema = v.object({
  playerName: v.pipe(v.string(), v.minLength(1, 'Player name is required')),
  characterId: v.pipe(v.string(), v.minLength(1, 'Character is required')),
  winner: v.boolean(),
  teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

interface Props {
  participant: {
    playerName: string;
    characterId: string;
    winner: boolean;
    teamIndex: number;
  };
  index: number;
  disabledCharacters: string[] | undefined;
  removable?: boolean;
}

const props = defineProps<Props>();

interface Emits {
  remove: [index: number];
}

const emit = defineEmits<Emits>();

function handleRemove() {
  emit('remove', props.index);
}
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium"> Player </span>
        <UButton
          v-if="props.removable"
          type="button"
          size="xs"
          color="error"
          variant="ghost"
          label="Remove"
          @click="handleRemove"
        />
      </div>
    </template>

    <UForm
      :name="`participants.${props.index}`"
      :schema="participantSchema"
      nested
      class="space-y-2 flex flex-col w-full"
    >
      <UFormField name="playerName" label="Player Name">
        <UserSearchInput
          v-model="props.participant.playerName"
          class="w-full"
        />
      </UFormField>

      <UFormField name="characterId" label="Character">
        <GameCharacterSelect
          v-model="props.participant.characterId"
          :disabled-characters="props.disabledCharacters"
          class="w-full"
        />
      </UFormField>

      <UCheckbox
        name="winner"
        v-model="props.participant.winner"
        label="Winner"
      />
    </UForm>
  </UCard>
</template>
