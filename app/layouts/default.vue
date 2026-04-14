<template>
    <v-app>
        <v-navigation-drawer v-model="drawer" rail expand-on-hover>
            <v-list>
                <v-list-item
                    v-for="(item, i) in items"
                    :key="i"
                    :to="item.to"
                    :title="item.title"
                    :prepend-icon="item.icon"
                    exact
                />
            </v-list>
        </v-navigation-drawer>
        <v-app-bar>
            <v-app-bar-nav-icon @click="drawer = !drawer" />
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <v-spacer />
            <v-btn v-if="logged" icon @click.stop="doLogout()">
                <v-icon>mdi-logout</v-icon>
            </v-btn>
            <v-btn v-else icon to="/login">
                <v-icon>mdi-login</v-icon>
            </v-btn>
        </v-app-bar>

        <v-main>
            <v-container>
                <slot />
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const drawer = ref(false)
const title = ref('Vue 3 Demo')
const items = ref([
    {
        icon: 'mdi-apps',
        title: 'Welcome',
        to: '/',
    },
    {
        icon: 'mdi-chart-bubble',
        title: 'Inspire',
        to: '/inspire',
    },
    {
        icon: 'mdi-chart-bubble',
        title: 'Users',
        to: '/users',
    },
])

const { logged } = storeToRefs(store)

async function doLogout() {
    await store.logout()
    navigateTo('/')
}
</script>
