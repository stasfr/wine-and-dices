<script setup lang="ts">
const { user, session } = useUserSession();
</script>

<template>
  <div class="p-4 space-y-4">
    <h1 class="text-2xl font-bold">Profile</h1>

    <UPageCard title="User">
      <pre>{{ user }}</pre>
    </UPageCard>

    <UPageCard title="Session">
      <pre>{{ session }}</pre>
    </UPageCard>
  </div>
</template>
