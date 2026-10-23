<template>
	<Garden ref="garden" @layoutPreviewReady="layoutPreviewReady"></Garden>
	<SidebarMenu></SidebarMenu>
	
	<PlantMenu ref="plantMenu" v-show="currentMenu === 'plant'" @startLayoutTool="startLayoutTool" @applyLayout="applyLayout" @cancelLayout="cancelLayout"></PlantMenu>
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
		startLayoutTool(config) {
			this.$refs.plantMenu.layoutPreviewReady = false
			this.$refs.plantMenu.arrangementMessage = 'Drag a line or patch on the garden to preview placements.'
			this.$refs.garden.beginLayout(config)
			currentMenu.value = ''
		},
		layoutPreviewReady(count) {
			this.$refs.plantMenu.layoutPreviewReady = count > 0
			this.$refs.plantMenu.arrangementMessage = count > 0 ? `Previewing ${count} placements.` : 'No valid placements in that area.'
		},
		applyLayout() {
			this.$refs.plantMenu.arrangementMessage = this.$refs.garden.applyLayout()
			this.$refs.plantMenu.layoutPreviewReady = false
		},
		cancelLayout() {
			this.$refs.garden.cancelLayout()
			this.$refs.plantMenu.layoutPreviewReady = false
			this.$refs.plantMenu.arrangementMessage = ''
		},
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
