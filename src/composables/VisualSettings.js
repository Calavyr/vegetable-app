import { ref, watch } from "vue";

const defaults = {
    showCropHitboxes: true,
    showBoundaryPoints: true,
    selectionShape: 'box',
    pixelsPerCentimeter: 1
}

function loadSettings() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem('visualSettings'))
        const settings = { ...defaults }
        if (typeof savedSettings?.showCropHitboxes === 'boolean') settings.showCropHitboxes = savedSettings.showCropHitboxes
        if (typeof savedSettings?.showBoundaryPoints === 'boolean') settings.showBoundaryPoints = savedSettings.showBoundaryPoints
        if (savedSettings?.selectionShape === 'box' || savedSettings?.selectionShape === 'lasso') settings.selectionShape = savedSettings.selectionShape
        const scale = Number(savedSettings?.pixelsPerCentimeter)
        if (Number.isFinite(scale) && scale >= 0.1 && scale <= 10) settings.pixelsPerCentimeter = scale
        return settings
    } catch (err) {
        return defaults
    }
}

const savedSettings = loadSettings()
const showCropHitboxes = ref(savedSettings.showCropHitboxes)
const showBoundaryPoints = ref(savedSettings.showBoundaryPoints)
const selectionShape = ref(savedSettings.selectionShape)
const pixelsPerCentimeter = ref(savedSettings.pixelsPerCentimeter)

function persistSettings() {
    try {
        localStorage.setItem('visualSettings', JSON.stringify({
            showCropHitboxes: showCropHitboxes.value,
            showBoundaryPoints: showBoundaryPoints.value,
            selectionShape: selectionShape.value,
            pixelsPerCentimeter: pixelsPerCentimeter.value
        }))
    } catch (err) {
        console.warn(err)
    }
}

watch([showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter], persistSettings, {
    flush: 'sync'
})

function updateVisualSettings(settings) {
    if (!settings || typeof settings !== 'object') return
    if (typeof settings.showCropHitboxes === 'boolean') showCropHitboxes.value = settings.showCropHitboxes
    if (typeof settings.showBoundaryPoints === 'boolean') showBoundaryPoints.value = settings.showBoundaryPoints
    if (settings.selectionShape === 'box' || settings.selectionShape === 'lasso') selectionShape.value = settings.selectionShape
    const scale = Number(settings.pixelsPerCentimeter)
    if (Number.isFinite(scale) && scale >= 0.1 && scale <= 10) pixelsPerCentimeter.value = scale
    persistSettings()
}

function getVisualSettingsData() {
    return {
        showCropHitboxes: showCropHitboxes.value,
        showBoundaryPoints: showBoundaryPoints.value,
        selectionShape: selectionShape.value,
        pixelsPerCentimeter: pixelsPerCentimeter.value
    }
}

export function getVisualSettings() {
    return { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter, updateVisualSettings, getVisualSettingsData }
}
