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
            <v-circle v-for="crop in crops" :key="crop.id + crop.pos.x + crop.pos.y" :config="getCropCircleConfig(crop)"></v-circle>
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
const { currentPlant, selectPlant } = getPlantState()
const { addCrop, removeCrop, getCrops, addPoint, removePoint, getPoints } = getGardenState()

let isMouseDown = false
let drawingBorder = false
let draggingCrop = false

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
            selectedCrop: null
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
        handleMouseMove(e) {
            if (isMouseDown) {
                if (!drawingBorder && getPoints().value.length == 0) {
                    drawingBorder = true
                }
                if (drawingBorder) {
                   this.addBorderPoint(e)
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
