<script setup>
defineProps({
  option: { type: Object, required: true },
})

</script>

<template>
  <div>{{ option.title }}</div>
</template>