<script setup lang="ts">
const { user } = useUserSession();
</script>

<template>
  <UPage>
    <UPageHeader title="Profile" />

    <UPageBody>
      <UserProfile :user="user" />
    </UPageBody>
  </UPage>
</template>
