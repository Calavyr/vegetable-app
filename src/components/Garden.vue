<template>
    <v-stage
    :config='konvaConfig'
    @mousemove='handleMouseMove'
    @mousedown='handleMouseDown'
    @mouseup='handleMouseUp'
    @mouseleave='handleMouseUp'>
        <v-layer>
            <v-line :config='borderConfig'></v-line>
            <v-text v-if="layoutConfig" :config="{x: 16, y: 16, text: 'Draw on the garden, then reopen Plant to apply or cancel the preview.', fontSize: 16, fill: '#111111', listening: false}"></v-text>
            <v-image v-for="crop in crops" :key="crop" :config="{x: crop.pos.x - crop.image.width / 2, y: crop.pos.y - crop.image.height / 2, image: crop.image}"></v-image>
            <template v-if="showCropHitboxes">
                <v-circle v-for="crop in crops" :key="crop.id + crop.pos.x + crop.pos.y" :config="getCropCircleConfig(crop)"></v-circle>
            </template>
            <template v-if="showBoundaryPoints">
                <v-circle v-for="(point, index) in boundaryPoints" :key="'boundary-point-' + index" :config="getBoundaryPointConfig(point)"></v-circle>
            </template>
            <v-circle v-for="(point, index) in layoutPreview" :key="'layout-preview-' + index" :config="getLayoutPreviewConfig(point)"></v-circle>
        </v-layer>
    </v-stage>
</template>

<script>
import { Crop } from '@/assets/Crop';
import { GardenBorder } from '@/assets/GardenBorder';
import { Vector } from '@/assets/Vector';
import { getGardenState } from '@/composables/GardenManager';
import { getPlantState } from '@/composables/PlantManager';
import { markRaw } from 'vue';
import { getVisualSettings } from '@/composables/VisualSettings';
const { currentPlant, selectPlant } = getPlantState()
const { addCrop, removeCrop, getCrops, addPoint, insertPoint, removePoint, getPoints } = getGardenState()
const { showCropHitboxes, showBoundaryPoints } = getVisualSettings()

let isMouseDown = false
let drawingBorder = false
let draggingCrop = false
let draggingBorderPoint = null

export default {
    components: {

    },
    props: {

    },
    data() {
        return {
            // Keep the class instance out of Vue's deep proxying. Vue unwraps
            // refs on proxied objects, but GardenBorder expects the ref itself.
            gardenBorder: markRaw(new GardenBorder(getPoints())),
            konvaConfig: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            borderConfig: {
                points: [],
                closed: true,
                stroke: '#000000',
                fill: '#32a852'
            },
            crops: getCrops(),
            selectedCrop: null,
            boundaryPoints: getPoints(),
            showCropHitboxes,
            showBoundaryPoints,
            layoutPreview: [],
            layoutConfig: null,
            layoutStart: null,
            layoutEnd: null
        }
    },
    methods: {
        updateGarden() {
            this.borderConfig.points = this.gardenBorder.getPoints()
        },
        beginLayout(config) {
            this.layoutConfig = config
            this.layoutStart = null
            this.layoutEnd = null
            this.layoutPreview = []
        },
        cancelLayout() {
            this.layoutConfig = null
            this.layoutStart = null
            this.layoutEnd = null
            this.layoutPreview = []
        },
        applyLayout() {
            if (!this.layoutConfig || this.layoutPreview.length == 0) return 'Draw a layout preview first.'
            let plant = getPlantState().getPlants().value.find((item) => item.id === this.layoutConfig.plantId)
            if (!plant) return 'That crop is no longer available.'
            let positions = [...this.layoutPreview]
            for (let position of positions) addCrop(new Crop(plant.id, position))
            let count = positions.length
            this.cancelLayout()
            return `Placed ${count} crops.`
        },
        getLayoutPreviewConfig(point) {
            return { x: point.x, y: point.y, radius: 5, fill: '#1687ff', opacity: 0.65, listening: false }
        },
        getLayoutPointIsAvailable(point, radius, previewPoints) {
            let corners = [
                new Vector(point.x - radius, point.y - radius),
                new Vector(point.x + radius, point.y - radius),
                new Vector(point.x + radius, point.y + radius),
                new Vector(point.x - radius, point.y + radius)
            ]
            if (!corners.every((corner) => this.gardenBorder.isPointInPolygon(corner))) return false
            for (let crop of this.crops) {
                if (crop.pos.sub(point).magnitudeSquared() < (crop.spacingRadius + radius) ** 2) return false
            }
            for (let placedPoint of previewPoints) {
                if (placedPoint.sub(point).magnitudeSquared() < (radius * 2) ** 2) return false
            }
            return true
        },
        updateLayoutPreview() {
            if (!this.layoutConfig || !this.layoutStart || !this.layoutEnd) return
            let config = this.layoutConfig
            let spacing = Math.max(Number(config.spacing) || 1, 1)
            let plant = getPlantState().getPlants().value.find((item) => item.id === config.plantId)
            let radius = plant?.spacingRadius ?? plant?.minArea / 2 ?? spacing / 2
            spacing = Math.max(spacing, radius * 2)
            let candidates = []
            if (config.type === 'row') {
                let direction = this.layoutEnd.sub(this.layoutStart)
                let length = Math.sqrt(direction.magnitudeSquared())
                if (length < 1) return this.layoutPreview = []
                let unit = direction.mulScalar(1 / length)
                let normal = new Vector(-unit.y, unit.x)
                let rowCount = Math.max(1, Math.min(20, Number(config.rows) || 1))
                let rowGap = Math.max(Number(config.rowGap) || spacing, radius * 2)
                for (let row = 0; row < rowCount; row++) {
                    for (let distance = 0; distance <= length; distance += spacing) {
                        let candidate = this.layoutStart.add(unit.mulScalar(distance)).add(normal.mulScalar(row * rowGap))
                        if (this.getLayoutPointIsAvailable(candidate, radius, candidates)) candidates.push(candidate)
                    }
                }
            } else {
                let minX = Math.min(this.layoutStart.x, this.layoutEnd.x)
                let maxX = Math.max(this.layoutStart.x, this.layoutEnd.x)
                let minY = Math.min(this.layoutStart.y, this.layoutEnd.y)
                let maxY = Math.max(this.layoutStart.y, this.layoutEnd.y)
                let tight = config.patchPattern === 'tight'
                let rowSpacing = tight ? spacing * Math.sqrt(3) / 2 : spacing
                let row = 0
                for (let y = minY + radius; y <= maxY - radius; y += rowSpacing, row++) {
                    let offset = tight && row % 2 == 1 ? spacing / 2 : 0
                    for (let x = minX + radius + offset; x <= maxX - radius; x += spacing) {
                        let candidate = new Vector(x, y)
                        if (this.getLayoutPointIsAvailable(candidate, radius, candidates)) candidates.push(candidate)
                    }
                }
            }
            this.layoutPreview = candidates
        },
        addBorderPoint(e) {
            let newPoint = new Vector(e.evt.clientX, e.evt.clientY)
            addPoint(newPoint) // Add point using GardenManager
            this.borderConfig.points = this.gardenBorder.getPoints() // Updates rendered polygon
        },
        getCropCircleConfig(crop) {
            return {
                x: crop.pos.x,
                y: crop.pos.y,
                radius: crop.spacingRadius,
                fill: 'red',
                opacity: 0.2,
                stroke: crop === this.selectedCrop ? 'blue' : undefined,
                strokeWidth: crop === this.selectedCrop ? 3 : 0
            }
        },
        getBoundaryPointConfig(point) {
            return {
                x: point.x,
                y: point.y,
                radius: 6,
                fill: 'red',
                stroke: '#ffffff',
                strokeWidth: 2
            }
        },
        handleMouseMove(e) {
            if (isMouseDown) {
                if (this.layoutConfig && this.layoutStart) {
                    this.layoutEnd = new Vector(e.evt.clientX, e.evt.clientY)
                    this.updateLayoutPreview()
                    return
                }
                if (!drawingBorder && getPoints().value.length == 0) {
                    drawingBorder = true
                }
                if (drawingBorder) {
                   this.addBorderPoint(e)
                } else if (draggingBorderPoint !== null) {
                    getPoints().value[draggingBorderPoint] = new Vector(e.evt.clientX, e.evt.clientY)
                    this.borderConfig.points = this.gardenBorder.getPoints()
                } else if (draggingCrop && this.selectedCrop) {
                    let newPos = new Vector(e.evt.clientX, e.evt.clientY)
                    let oldPos = this.selectedCrop.pos
                    this.selectedCrop.pos = newPos
                    if (!this.gardenBorder.isCropInPolygon(this.selectedCrop) || this.hasCropOverlap(this.selectedCrop, this.selectedCrop)) {
                        this.selectedCrop.pos = oldPos
                    }
                }
            } else {
                let x = e.evt.clientX
                let y = e.evt.clientY
            }
        },
        handleMouseDown(e) {
            isMouseDown = true
            if (this.layoutConfig && getPoints().value.length >= 3 && e.evt.button == 0) {
                this.layoutStart = new Vector(e.evt.clientX, e.evt.clientY)
                this.layoutEnd = this.layoutStart
                this.layoutPreview = []
                return
            }
            if (getPoints().value.length == 0 || drawingBorder) {
                return
            }

            let point = new Vector(e.evt.clientX, e.evt.clientY)
            let points = getPoints().value
            let closestBorderPoint = this.getClosestBorderPoint(point)

            if (e.evt.button == 2 && closestBorderPoint !== null) {
                if (points.length > 3) {
                    removePoint(points[closestBorderPoint])
                    this.borderConfig.points = this.gardenBorder.getPoints()
                }
                return
            }

            if (e.evt.button == 0 && closestBorderPoint !== null) {
                draggingBorderPoint = closestBorderPoint
                return
            }

            if (e.evt.button == 0) {
                let closestEdge = this.getClosestBorderEdge(point)
                if (closestEdge !== null) {
                    insertPoint(closestEdge.index + 1, closestEdge.point)
                    draggingBorderPoint = closestEdge.index + 1
                    this.borderConfig.points = this.gardenBorder.getPoints()
                    return
                }
            }

            let closestCrop = this.getClosestCrop(point)
            let cropRadius = closestCrop ? closestCrop.image.width / 2 : 0
            let difference = closestCrop ? closestCrop.pos.sub(point) : null
            let cropIsSelected = closestCrop && difference.magnitudeSquared() <= cropRadius * cropRadius

            if (e.evt.button == 2) { // Right click
                if (cropIsSelected) {
                    removeCrop(closestCrop)
                    if (this.selectedCrop === closestCrop) this.selectedCrop = null
                }
                return
            }

            if (e.evt.button == 0) { // Left click
                if (cropIsSelected) {
                    this.selectedCrop = closestCrop
                    draggingCrop = true
                    return
                }

                let x = e.evt.clientX
                let y = e.evt.clientY
                if (!currentPlant.value.id) return

                let posVector = new Vector(x, y)
                let newCrop = new Crop(currentPlant.value.id, posVector)

                if (!this.gardenBorder.isCropInPolygon(newCrop)) {
                    return
                }

                if (this.hasCropOverlap(newCrop)) {
                    return
                }

                addCrop(newCrop)
            }
        },
        handleMouseUp(e) {
            if (this.layoutConfig && this.layoutStart) {
                this.layoutEnd = new Vector(e.evt.clientX, e.evt.clientY)
                this.updateLayoutPreview()
                this.layoutStart = null
                this.$emit('layoutPreviewReady', this.layoutPreview.length)
                isMouseDown = false
                return
            }
            isMouseDown = false
            draggingCrop = false
            draggingBorderPoint = null
            if (drawingBorder && getPoints().value.length != 0) {
                drawingBorder = false
                this.borderConfig.points = this.gardenBorder.getPoints()
            }
        },
        getClosestCrop(point) { // For selecting crops with mouse
            let closestCrop = null
            let minDistSquared = Number.POSITIVE_INFINITY
            for (let crop of this.crops) {
                let difference = crop.pos.sub(point)
                let distanceSquared = difference.magnitudeSquared()

                if (distanceSquared < minDistSquared) {
                    closestCrop = crop
                    minDistSquared = distanceSquared
                }
            }
            return closestCrop
        },
        getClosestBorderPoint(point) {
            let points = getPoints().value
            let closestIndex = null
            let minDistSquared = 12 ** 2

            for (let i = 0; i < points.length; i++) {
                let difference = points[i].sub(point)
                let distanceSquared = difference.magnitudeSquared()
                if (distanceSquared <= minDistSquared) {
                    closestIndex = i
                    minDistSquared = distanceSquared
                }
            }
            return closestIndex
        },
        getClosestBorderEdge(point) {
            let points = getPoints().value
            let closestEdge = null
            let minDistSquared = 10 ** 2

            for (let i = 0; i < points.length; i++) {
                let edgePoint1 = points[i]
                let edgePoint2 = points[(i + 1) % points.length]
                if (edgePoint1.sub(edgePoint2).magnitudeSquared() == 0) continue

                let closestPoint = this.gardenBorder.getClosestPointOnEdge(point, edgePoint1, edgePoint2)
                let distanceSquared = closestPoint.sub(point).magnitudeSquared()
                if (distanceSquared <= minDistSquared) {
                    closestEdge = { index: i, point: closestPoint }
                    minDistSquared = distanceSquared
                }
            }
            return closestEdge
        },
        hasCropOverlap(crop, ignoredCrop = null) {
            for (let existingCrop of this.crops) {
                if (existingCrop === ignoredCrop) continue

                let difference = existingCrop.pos.sub(crop.pos)
                let minDistance = existingCrop.spacingRadius + crop.spacingRadius
                if (difference.magnitudeSquared() < minDistance * minDistance) {
                    return true
                }
            }
            return false
        }
    },
    mounted() {
        window.addEventListener('resize', () => {
            this.konvaConfig.width = window.innerWidth
            this.konvaConfig.height = window.innerHeight
        })
    }
}
</script>

<style scoped>
</style>
