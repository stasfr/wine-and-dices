<template>
  <UPage>
    <UPageHeader title="Game Details">
      <template #links>
        <UButton
          to="/games"
          label="Back to list"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <GameDataWidget />
    </UPageBody>
  </UPage>
</template>
