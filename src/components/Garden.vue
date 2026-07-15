<template>
    <v-stage
    :config='konvaConfig'
    @mousemove='handleMouseMove'
    @mousedown='handleMouseDown'
    @mouseup='handleMouseUp'
    @mouseleave='handleMouseUp'>
        <v-layer>
            <v-line :config='borderConfig'></v-line>
            <v-image v-for="crop in crops" :config="{x: crop.pos.x - crop.image.width / 2, y: crop.pos.y - crop.image.height / 2, image: crop.image}"></v-image>
        </v-layer>
    </v-stage>
</template>

<script>
import { Crop } from '@/assets/Crop';
import { GardenBorder } from '@/assets/GardenBorder';
import { Vector } from '@/assets/Vector';
import { getGardenState } from '@/composables/GardenManager';
import { getPlantState } from '@/composables/PlantManager';
const { currentPlant, selectPlant } = getPlantState()
const { addCrop, removeCrop, getCrops, addPoint, removePoint, getPoints } = getGardenState()

let isMouseDown = false
let drawingBorder = false

export default {
    components: {

    },
    props: {

    },
    data() {
        return {
            gardenBorder: new GardenBorder(getPoints()),
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
            crops: getCrops()
        }
    },
    methods: {
        updateGarden() {
            this.borderConfig.points = this.gardenBorder.getPoints()
        },
        addBorderPoint(e) {
            let newPoint = new Vector(e.evt.clientX, e.evt.clientY)
            addPoint(newPoint)
            this.borderConfig.points = this.gardenBorder.getPoints()            
        },
        handleMouseMove(e) {
            if (isMouseDown) {
                if (!drawingBorder && this.gardenBorder.points.length == 0) {
                    drawingBorder = true
                }
                if (drawingBorder) {
                   this.addBorderPoint(e)
                }
            } else {
                let x = e.evt.clientX
                let y = e.evt.clientY
            }
        },
        handleMouseDown(e) {
            isMouseDown = true
            if (this.gardenBorder.points.length != 0 && !drawingBorder) {
                let x = e.evt.clientX
                let y = e.evt.clientY
                if (!currentPlant.value.id) return

                let posVector = new Vector(x, y)
                let newCrop = new Crop(currentPlant.value.id, posVector)

                if (!this.gardenBorder.isCropInPolygon(newCrop)) {
                    return
                }

                addCrop(newCrop)
            }
        },
        handleMouseUp(e) {
            isMouseDown = false
            if (drawingBorder && this.gardenBorder.points.length != 0) {
                drawingBorder = false
                this.borderConfig.points = this.gardenBorder.getPoints()
            }
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