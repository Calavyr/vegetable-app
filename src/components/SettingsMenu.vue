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
    </div>
</template>

<script>
import { getVisualSettings } from '@/composables/VisualSettings';

const { showCropHitboxes, showBoundaryPoints, selectionShape } = getVisualSettings()

export default {
    setup() {
        return { showCropHitboxes, showBoundaryPoints, selectionShape }
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
