<script setup lang="ts">
import { ref } from 'vue';

const BASE_API = import.meta.env.VITE_BASE_API;

const testRef = ref();

async function testFetch() {
  const url = `${BASE_API}/health`;
  const res = await fetch(url, {
    method: 'GET',
  });
  const data = await res.json();
  testRef.value = data;
}
</script>

<template>
  <pre>
    testRef: {{ testRef }}
  </pre>
  <button @click="testFetch">test btn</button>
</template>

<style scoped></style>
