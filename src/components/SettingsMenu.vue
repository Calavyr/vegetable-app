<template>
    <div class="menu">
        <label class="settingRow">
            <span>Show crop hitboxes</span>
            <input type="checkbox" v-model="showCropHitboxes">
        </label>
        <label class="settingRow">
            <span>Show garden boundary points</span>
            <input type="checkbox" v-model="showBoundaryPoints">
        </label>
        <label class="settingRow">
            <span>Drag selection shape</span>
            <select v-model="selectionShape">
                <option value="box">Box</option>
                <option value="lasso">Lasso</option>
            </select>
        </label>
        <label class="settingRow scaleRow">
            <span>Pixels per centimetre</span>
            <input v-model.number="pixelsPerCentimeter" type="number" min="0.1" max="10" step="0.1">
        </label>
        <button class="resetButton" @click="resetAllData">Reset all data</button>
    </div>
</template>

<script>
import { getVisualSettings } from '@/composables/VisualSettings';

const { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter } = getVisualSettings()

export default {
    setup() {
        return { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter }
    },
    methods: {
        resetAllData() {
            if (!window.confirm('This will permanently delete your saved garden, journal, custom crops, tags, and settings. Continue?')) return

            for (let key of ['journal', 'crops', 'points', 'custom-plants', 'journal-tags', 'visualSettings']) {
                localStorage.removeItem(key)
            }
            window.location.reload()
        }
    }
}
</script>

<style scoped>
.menu {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 60%;
    height: 80%;
    border: black 2px solid;
    background-color: white;
    box-sizing: border-box;
    padding: 12px;
}
.settingRow {
    display: block;
    padding: 6px;
}
.settingRow input,
.settingRow select {
    display: block;
    margin-top: 4px;
}
.scaleRow input {
    width: 80px;
}
.resetButton {
    margin: 6px;
    padding: 6px;
}
</style>
