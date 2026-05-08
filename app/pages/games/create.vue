<template>
  <UPage>
    <UPageHeader title="Create Game">
      <template #links>
        <UButton to="/games" label="Back" icon="i-lucide-arrow-left" />
      </template>
    </UPageHeader>

    <UPageBody>
      <CreateGameForm />
    </UPageBody>
  </UPage>
</template>
