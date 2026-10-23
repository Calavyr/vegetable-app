import { ref } from "vue";

const showCropHitboxes = ref(true)
const showBoundaryPoints = ref(true)

export function getVisualSettings() {
    return { showCropHitboxes, showBoundaryPoints }
}
