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
    </div>
</template>

<script>
import { getVisualSettings } from '@/composables/VisualSettings';

const { showCropHitboxes, showBoundaryPoints } = getVisualSettings()

export default {
    setup() {
        return { showCropHitboxes, showBoundaryPoints }
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
