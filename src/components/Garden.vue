<template>
    <v-stage
    :config='konvaConfig'
    @mousemove='handleMouseMove'
    @mousedown='handleMouseDown'
    @mouseup='handleMouseUp'
    @mouseleave='handleMouseUp'>
        <v-layer>
            <v-line :config='borderConfig'></v-line>
            <v-image v-for="crop in crops" :key="crop" :config="{x: crop.pos.x - crop.image.width / 2, y: crop.pos.y - crop.image.height / 2, image: crop.image}"></v-image>
            <template v-if="showCropHitboxes">
                <v-circle v-for="crop in crops" :key="crop.id + crop.pos.x + crop.pos.y" :config="getCropCircleConfig(crop)"></v-circle>
            </template>
            <template v-if="showBoundaryPoints">
                <v-circle v-for="(point, index) in boundaryPoints" :key="'boundary-point-' + index" :config="getBoundaryPointConfig(point)"></v-circle>
            </template>
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
            showBoundaryPoints
        }
    },
    methods: {
        updateGarden() {
            this.borderConfig.points = this.gardenBorder.getPoints()
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
                radius: crop.image.width / 2,
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
                let minDistance = (existingCrop.image.width + crop.image.width) / 2
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
