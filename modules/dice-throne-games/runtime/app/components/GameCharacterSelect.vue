<script setup lang="ts">
const value = defineModel<string>({ required: true });

const requestFetch = useRequestFetch();

const { data: charactersData } = useQuery({
  key: ['characters'],
  query: () => requestFetch('/api/dices/characters/list'),
});

const charactersList = computed(() => charactersData.value?.data || []);

const characterItems = computed(() =>
  charactersList.value.map((c: { id: string; name: string; key: string }) => ({
    label: c.name,
    value: c.id,
    avatar: {
      src: `images/portraits/${c.key}.png`,
      alt: c.name,
      loading: 'lazy' as const,
    },
  })),
);

const avatar = computed(() =>
  characterItems.value.find((item) => item.value === value.value)?.avatar,
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
