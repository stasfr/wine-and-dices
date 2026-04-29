<script setup lang="ts">
const { data } = useQuery({
  key: ['characters'],
  query: () => $fetch('/api/dices/characters/list'),
});
</script>

<template>
  <UPage>
    <UPageHeader title="Dice Throne Characters List" />

    <UPageBody>
      <UPageList>
        <UPageCard
          v-for="(character, index) in data"
          :key="index"
          variant="ghost"
          :to="character.to"
          :target="character.target"
        >
          <template #body>
            <UUser
              :name="user.name"
              :description="user.description"
              :avatar="user.avatar"
              size="xl"
              class="relative"
            />
          </template>
        </UPageCard>
      </UPageList>
    </UPageBody>
  </UPage>
</template>
