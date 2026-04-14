<script setup>
import { onMounted } from 'vue'
import { getDB } from '~/services/fireinit'

onMounted(() => {
  const db = getDB()
  console.log('DB initialized:', !!db)
})
</script>

<template>
  <div>Home</div>
</template>