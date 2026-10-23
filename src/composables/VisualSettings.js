import { ref } from "vue";

const showCropHitboxes = ref(true)
const showBoundaryPoints = ref(true)
const selectionShape = ref('box')
const pixelsPerCentimeter = ref(1)

export function getVisualSettings() {
    return { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter }
}
