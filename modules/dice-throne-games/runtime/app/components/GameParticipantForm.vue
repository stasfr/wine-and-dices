<script setup lang="ts">
import * as v from 'valibot';

const participantSchema = v.object({
  playerName: v.pipe(v.string(), v.minLength(1, 'Player name is required')),
  userId: v.optional(v.pipe(v.string(), v.minLength(1))),
  characterId: v.pipe(v.string(), v.minLength(1, 'Character is required')),
  winner: v.boolean(),
  teamIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

interface Props {
  index: number;
  disabledCharacters: string[] | undefined;
  disabledUsers: string[] | undefined;
  removable: boolean;
  showSelectMe: boolean;
}

const props = defineProps<Props>();

interface Emits {
  remove: [index: number];
  toggleWinner: [index: number];
}

const emit = defineEmits<Emits>();

function handleRemove() {
  emit('remove', props.index);
}

interface Model {
  playerName: string;
  userId: string | undefined;
  characterId: string;
  winner: boolean;
  teamIndex: number;
}

const participant = defineModel<Model>('participant', { required: true });

const { user } = useUserSession();
const findUsersOpen = ref(false);
const participantFormRef = useTemplateRef('participantForm');

function handleSelectMe() {
  const currentUser = user.value;
  if (!currentUser) {
    return;
  }

  participant.value.playerName = currentUser.email;
  participant.value.userId = currentUser.id;
  participantFormRef.value?.clear('playerName');
}

function handlePlayerNameInput() {
  participant.value.userId = undefined;
}

function handleUserSelected(selectedUser: { email: string; userId: string }) {
  participant.value.playerName = selectedUser.email;
  participant.value.userId = selectedUser.userId;
  findUsersOpen.value = false;
  participantFormRef.value?.clear('playerName');
}
</script>

<template>
  <UCard class="w-full">
    <template v-if="props.removable" #header>
      <div class="flex items-center justify-end">
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          label="Remove"
          icon="i-lucide-trash"
          @click="handleRemove"
        />
      </div>
    </template>

    <UForm
      ref="participantForm"
      :name="`participants.${props.index}`"
      :schema="participantSchema"
      nested
      class="space-y-2 flex flex-col w-full"
    >
      <UFormField name="playerName" label="Player Name">
        <div class="flex items-center gap-2">
          <UInput
            v-model="participant.playerName"
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
            @update:model-value="handlePlayerNameInput"
          >
            <template v-if="participant.playerName.length > 0" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Clear input"
                @click="participant.playerName = ''; participant.userId = undefined"
              />
            </template>
          </UInput>
          <UButton
            v-if="props.showSelectMe"
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

      <UFormField name="characterId" label="Character">
        <GameCharacterSelect
          v-model="participant.characterId"
          :disabled-characters="props.disabledCharacters"
          class="w-full"
        />
      </UFormField>

      <UCheckbox
        name="winner"
        :model-value="participant.winner"
        label="Winner"
        @update:model-value="emit('toggleWinner', props.index)"
      />
    </UForm>

    <FindUsersModal
      v-model:open="findUsersOpen"
      :disabled-users="props.disabledUsers"
      @select="handleUserSelected"
    />
  </UCard>
</template>
