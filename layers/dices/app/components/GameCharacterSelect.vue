<script setup lang="ts">
interface Props {
  disabledCharacters: string[] | undefined;
}

const props = defineProps<Props>();

const value = defineModel<string>({ required: true });

const requestFetch = useRequestFetch();

const { data: charactersData } = useQuery({
  key: ['characters'],
  query: () => requestFetch('/api/dices/characters/list'),
});

const charactersList = computed(() => charactersData.value?.data || []);

const characterItems = computed(() =>
  charactersList.value.map((character) => ({
    label: character.name,
    value: character.id,
    disabled:
      props.disabledCharacters?.includes(character.id) &&
      character.id !== value.value,
    avatar: {
      src: `images/portraits/${character.key}.png`,
      alt: character.name,
      loading: 'lazy' as const,
    },
  })),
);

const avatar = computed(
  () => characterItems.value.find((item) => item.value === value.value)?.avatar,
);
</script>

<template>
  <USelect
    v-model="value"
    :items="characterItems"
    value-key="value"
    :avatar="avatar"
    placeholder="Select character"
  />
</template>
