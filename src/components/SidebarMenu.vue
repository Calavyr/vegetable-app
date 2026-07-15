<template>
<div id="container">
    <div id="sidebar" ref="sidebar">
        <div ref="plantMenu" @click="toggleMenu('plant')">Plant</div>
        <div ref="journalMenu" @click="toggleMenu('journal')">Journal</div>
        <div ref="weatherMenu" @click="toggleMenu('weather')">Weather</div>
        <div ref="saveMenu" @click="toggleMenu('save')">Save</div>
        <div ref="settingsMenu" @click="toggleMenu('settings')">Settings</div>
    </div>
    <div @click="toggleSidebar()" id="toggleButton"></div>
</div>
</template>


<script>
import { getMenuState } from '@/composables/MenuManager.js'
const { currentMenu, toggleMenu } = getMenuState()

export default {
    props: {

    },
    components: {

    },
    data() {
        return {

        }
    },
    methods: {
        toggleSidebar() {
            if (this.$refs.sidebar.style.right == '0px') {
                this.$refs.sidebar.style.right = '-96px'
            } else {
                this.$refs.sidebar.style.right = '0px'
            }
        },
        toggleMenu
    }
}
</script>

<style scoped>
div#container {
    position: fixed;
    width: 64px;
    height: 80vh;
    right: 32px;
    top: 10vh;
}

div#container #sidebar {
    position: absolute;
    height: 70%;
    width: 64px;
    right: -96px;
    transition: right 1s;
}

div#container #sidebar > div {
    height: 20%;
    width: 64px;
    background-color: blue;
    border: black 2px solid;
    color: white;
}

div#container #toggleButton {
    position: absolute;
    height: 64px;
    width: 64px;
    bottom: 0;
    background-color: red;
}
</style>