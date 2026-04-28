<script setup>
import { ref } from 'vue'

const props = defineProps({
  option: { type: Object, required: true },
})

const liked = ref(false)
</script>

<template>
  <div class="d-flex align-center ga-2">
    <v-btn
      icon
      variant="text"
      @click="liked = !liked"
    >
      <v-icon :color="liked ? 'red' : 'grey-lighten-1'">
        {{ liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}
      </v-icon>
    </v-btn>

    <span>{{ option.title }}</span>
  </div>
</template>