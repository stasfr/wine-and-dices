<script setup lang="ts">
const loading = ref(false);
</script>

<template>
  <UPage>
    <UPageHeader title="Dice Throne Games List">
      <template #links>
        <UModal :dismissible="loading === false" title="Create Game">
          <UButton
            label="Create Game"
            color="success"
            trailing-icon="i-lucide-square-plus"
          />

          <template #content>
            <Placeholder class="h-48 m-4" />
          </template>
        </UModal>
      </template>
    </UPageHeader>

    <UPageBody> here will be datatable </UPageBody>
  </UPage>
</template>
