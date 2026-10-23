<template>
    <div>
        <label>
            <input type="checkbox" v-model="showCropHitboxes">
            Show crop hitboxes
        </label>
        <label>
            <input type="checkbox" v-model="showBoundaryPoints">
            Show garden boundary points
        </label>
        <label>
            Drag selection shape
            <select v-model="selectionShape">
                <option value="box">Box</option>
                <option value="lasso">Lasso</option>
            </select>
        </label>
        <label>
            Pixels per centimetre
            <input v-model.number="pixelsPerCentimeter" type="number" min="0.1" max="10" step="0.1">
        </label>
    </div>
</template>

<script>
import { getVisualSettings } from '@/composables/VisualSettings';

const { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter } = getVisualSettings()

export default {
    setup() {
        return { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter }
    }
}
</script>

<style scoped>
div {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 60%;
    height: 80%;
    border: black 2px solid;
    background-color: white;
}
</style>
