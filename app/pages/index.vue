<script setup lang="ts">
const { loggedIn, user, session, fetch, clear } = useUserSession();
</script>

<template>
  <div>
    <pre>{{ loggedIn }}</pre>
    <pre>{{ user }}</pre>
    <pre>{{ session }}</pre>
    <div class="flex gap-2">
      <UButton @click="fetch">Fetch</UButton>
      <UButton @click="clear">Clear</UButton>
    </div>
  </div>
</template>
