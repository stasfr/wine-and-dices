<script setup lang="ts">
interface Props {
  modelValue: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const requestFetch = useRequestFetch();

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

const value = computed({
  get() {
    return props.modelValue;
  },
  set(newValue: string) {
    emit('update:modelValue', newValue);
  },
});
</script>

<template>
  <USelect
    v-model="value"
    :items="characterItems"
    placeholder="Select character"
  />
</template>
