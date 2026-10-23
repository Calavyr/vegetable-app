<template>
	<Garden ref="garden"></Garden>
	<SidebarMenu></SidebarMenu>
	
	<PlantMenu v-show="currentMenu === 'plant'"></PlantMenu>
	<JournalMenu v-show="currentMenu === 'journal'" ref="journal"></JournalMenu>
	<WeatherMenu v-show="currentMenu === 'weather'"></WeatherMenu>
	<SaveMenu v-show="currentMenu === 'save'" @saveLoaded="updateChildren()"></SaveMenu>
	<SettingsMenu v-show="currentMenu === 'settings'"></SettingsMenu>
</template>

<script>
import Garden from './components/Garden.vue';
import SidebarMenu from './components/SidebarMenu.vue';
import PlantMenu from './components/PlantMenu.vue';

import { getMenuState } from '@/composables/MenuManager.js'
import SaveMenu from './components/SaveMenu.vue';
import SettingsMenu from './components/SettingsMenu.vue';
import JournalMenu from './components/JournalMenu.vue';
import WeatherMenu from './components/WeatherMenu.vue';
const { currentMenu, toggleMenu } = getMenuState()

export default {
	name: 'App',
	components: {
		Garden,
		SidebarMenu,
		PlantMenu,
		JournalMenu,
		WeatherMenu,
		SaveMenu,
		SettingsMenu
	},
	setup() {
		return {
			currentMenu
		}
	},
	methods: {
		updateChildren() {
			this.$refs.journal.updateDate()
			this.$refs.garden.updateGarden()
		},
		preventContextMenu(e) {
			e.preventDefault()
		}
	},
	mounted() {
		window.addEventListener('contextmenu', this.preventContextMenu)
	},
	unmounted() {
		window.removeEventListener('contextmenu', this.preventContextMenu)
	}
}
</script>

<style scoped>
</style>
