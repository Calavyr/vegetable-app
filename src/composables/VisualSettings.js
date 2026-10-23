import { ref } from "vue";

const showCropHitboxes = ref(true)
const showBoundaryPoints = ref(true)
const selectionShape = ref('box')

export function getVisualSettings() {
    return { showCropHitboxes, showBoundaryPoints, selectionShape }
}
