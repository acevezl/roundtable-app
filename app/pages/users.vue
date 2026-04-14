<template>
    <v-card>
        <v-card-title> Página para usuarios conectados...</v-card-title>
    </v-card>
</template>

<script setup>
definePageMeta({
    middleware: 'autenticado',
})
</script>

<style scoped></style>
