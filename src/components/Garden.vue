<template>
    <div class="gardenView">
    <v-stage
    :config='konvaConfig'
    @mousemove='handleMouseMove'
    @mousedown='handleMouseDown'
    @mouseup='handleMouseUp'
    @wheel='handleWheel'
    @mouseleave='handleMouseUp'>
        <v-layer :config="cameraConfig">
            <v-line :config='borderConfig'></v-line>
            <v-text v-if="layoutConfig" :config="{x: 16, y: 42, text: 'Drag on the garden to preview placements.', fontSize: 16, fill: '#111111', listening: false}"></v-text>
            <v-image v-for="crop in crops" :key="crop" :config="getCropImageConfig(crop)"></v-image>
            <template v-if="showCropHitboxes">
                <v-circle v-for="crop in crops" :key="crop.id + crop.pos.x + crop.pos.y" :config="getCropCircleConfig(crop)"></v-circle>
            </template>
            <v-circle v-for="crop in selectedCrops" :key="'selected-' + crop.id + crop.pos.x + crop.pos.y" :config="getSelectionCircleConfig(crop)"></v-circle>
            <template v-if="showBoundaryPoints">
                <v-circle v-for="(point, index) in boundaryPoints" :key="'boundary-point-' + index" :config="getBoundaryPointConfig(point)"></v-circle>
            </template>
            <v-circle v-for="(point, index) in layoutPreview" :key="'layout-preview-' + index" :config="getLayoutPreviewConfig(point)"></v-circle>
            <v-rect v-if="gestureMode && selectionShape === 'box' && gestureMoved" :config="getGestureBoxConfig()"></v-rect>
            <v-line v-if="gestureMode && selectionShape === 'lasso' && gestureMoved" :config="getGestureLassoConfig()"></v-line>
        </v-layer>
        <v-layer>
            <v-text :config="{ x: 16, y: 16, text: Math.round(cameraConfig.scaleX * 100) + '%  -  Scroll to zoom  -  Middle-mouse-drag to pan (scroll-wheel)', fontSize: 14, fill: '#222222', listening: false }"></v-text>
            <v-text :config="getScaleLabelConfig()"></v-text>
            <v-line :config="getScaleLineConfig()"></v-line>
        </v-layer>
    </v-stage>
    <div class="layoutPanel">
        <strong>Crop layout</strong>
        <span>Using: {{ currentPlant && currentPlant.plant ? currentPlant.plant : 'Select a crop in Plant Menu' }}</span>
        <label>Spacing (cm) <input v-model.number="layoutSpacing" type="number" min="1" max="500"></label>
        <label>Layout
            <select v-model="layoutType">
                <option value="row">Rows</option>
                <option value="patch">Patch</option>
            </select>
        </label>
        <template v-if="layoutType === 'row'">
            <label>Rows <input v-model.number="layoutRows" type="number" min="1" max="20"></label>
            <label>Row gap (cm) <input v-model.number="rowGap" type="number" min="1" max="500"></label>
        </template>
        <label v-else>Patch pattern
            <select v-model="patchPattern">
                <option value="rows">Regular rows</option>
                <option value="tight">Staggered tight pack</option>
            </select>
        </label>
        <div class="layoutButtons">
            <button @click="beginLayout">Draw layout</button>
            <button @click="applyLayout" :disabled="layoutPreview.length === 0">Apply preview</button>
            <button @click="cancelLayout">Cancel</button>
        </div>
        <small v-if="layoutMessage">{{ layoutMessage }}</small>
    </div>
    </div>
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
const { showCropHitboxes, showBoundaryPoints, selectionShape, pixelsPerCentimeter } = getVisualSettings()

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
            cameraConfig: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
            borderConfig: {
                points: [],
                closed: true,
                stroke: '#000000',
                fill: '#32a852'
            },
            crops: getCrops(),
            currentPlant,
            selectedCrop: null,
            boundaryPoints: getPoints(),
            showCropHitboxes,
            showBoundaryPoints,
            selectionShape,
            pixelsPerCentimeter,
            layoutPreview: [],
            layoutConfig: null,
            layoutStart: null,
            layoutEnd: null,
            layoutSpacing: 50,
            layoutType: 'row',
            layoutRows: 1,
            rowGap: 60,
            patchPattern: 'tight',
            layoutMessage: '',
            selectedCrops: [],
            gestureMode: null,
            gestureStart: null,
            gestureEnd: null,
            gesturePoints: [],
            gestureMoved: false,
            groupDragStart: null,
            groupStartPositions: [],
            isPanning: false,
            panStart: null,
            panOrigin: null,
            isDraggingScale: false,
            scaleDragStart: null,
            scaleOffset: { x: 0, y: 0 }
        }
    },
    methods: {
        updateGarden() {
            this.borderConfig.points = this.gardenBorder.getPoints()
        },
        beginLayout() {
            if (!currentPlant.value?.id) {
                this.layoutMessage = 'Select a crop in the Plant menu first.'
                return
            }
            if (getPoints().value.length < 3) {
                this.layoutMessage = 'Draw a garden boundary first.'
                return
            }
            this.layoutConfig = {
                plantId: currentPlant.value.id,
                spacing: this.layoutSpacing,
                type: this.layoutType,
                rows: this.layoutRows,
                rowGap: this.rowGap,
                patchPattern: this.patchPattern
            }
            this.layoutStart = null
            this.layoutEnd = null
            this.layoutPreview = []
            this.layoutMessage = 'Drag on the garden to draw the layout.'
        },
        cancelLayout() {
            this.layoutConfig = null
            this.layoutStart = null
            this.layoutEnd = null
            this.layoutPreview = []
            this.layoutMessage = ''
        },
        applyLayout() {
            if (!this.layoutConfig || this.layoutPreview.length == 0) return 'Draw a layout preview first.'
            let plant = getPlantState().getPlants().value.find((item) => item.id === this.layoutConfig.plantId)
            if (!plant) return 'That crop is no longer available.'
            let positions = [...this.layoutPreview]
            for (let position of positions) addCrop(new Crop(plant.id, position))
            let count = positions.length
            this.cancelLayout()
            this.layoutMessage = `Placed ${count} crops.`
            return `Placed ${count} crops.`
        },
        getLayoutPreviewConfig(point) {
            return { x: point.x, y: point.y, radius: 5, fill: '#1687ff', opacity: 0.65, listening: false }
        },
        getGardenPoint(e) {
            return new Vector(
                (e.evt.clientX - this.cameraConfig.x) / this.cameraConfig.scaleX,
                (e.evt.clientY - this.cameraConfig.y) / this.cameraConfig.scaleY
            )
        },
        getPixelScale() {
            return Math.max(0.1, Math.min(10, Number(this.pixelsPerCentimeter) || 1))
        },
        getScaleDistance() {
            let targetDistance = 100 / (this.cameraConfig.scaleX * this.getPixelScale())
            let power = Math.pow(10, Math.floor(Math.log10(targetDistance)))
            let candidates = [1, 2, 5, 10].map((value) => value * power)
            return candidates.reduce((closest, value) => Math.abs(value - targetDistance) < Math.abs(closest - targetDistance) ? value : closest)
        },
        getScaleLabelConfig() {
            let distance = this.getScaleDistance()
            let label = distance >= 100 ? `${distance / 100} m` : `${distance} cm`
            return {
                x: 20 + this.scaleOffset.x,
                y: this.konvaConfig.height - 54 + this.scaleOffset.y,
                text: `Estimated scale - ${label} - Draggable`,
                fontSize: 14,
                fill: '#222222',
                name: 'scale-ruler'
            }
        },
        getScaleLineConfig() {
            let distance = this.getScaleDistance()
            let width = distance * this.getPixelScale() * this.cameraConfig.scaleX
            let x = 20 + this.scaleOffset.x
            let y = this.konvaConfig.height - 28 + this.scaleOffset.y
            return {
                points: [x, y - 5, x, y, x + width, y, x + width, y - 5],
                stroke: '#222222',
                strokeWidth: 2,
                name: 'scale-ruler'
            }
        },
        handleWheel(e) {
            e.evt.preventDefault()
            let oldScale = this.cameraConfig.scaleX
            let newScale = Math.max(0.25, Math.min(4, oldScale * (e.evt.deltaY < 0 ? 1.1 : 1 / 1.1)))
            let pointerX = e.evt.clientX
            let pointerY = e.evt.clientY
            let gardenX = (pointerX - this.cameraConfig.x) / oldScale
            let gardenY = (pointerY - this.cameraConfig.y) / oldScale
            this.cameraConfig.scaleX = newScale
            this.cameraConfig.scaleY = newScale
            this.cameraConfig.x = pointerX - gardenX * newScale
            this.cameraConfig.y = pointerY - gardenY * newScale
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
                if (crop.pos.sub(point).magnitudeSquared() < (crop.spacingRadius * this.getPixelScale() + radius) ** 2) return false
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
            let pixelScale = this.getPixelScale()
            let radius = (plant?.spacingRadius ?? plant?.minArea / 2 ?? spacing / 2) * pixelScale
            spacing *= pixelScale
            let candidates = []
            if (config.type === 'row') {
                let direction = this.layoutEnd.sub(this.layoutStart)
                let length = Math.sqrt(direction.magnitudeSquared())
                if (length < 1) return this.layoutPreview = []
                let unit = direction.mulScalar(1 / length)
                let normal = new Vector(-unit.y, unit.x)
                let rowCount = Math.max(1, Math.min(20, Number(config.rows) || 1))
                let rowGap = Math.max((Number(config.rowGap) || Number(config.spacing) || 1) * pixelScale, radius * 2)
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
            let newPoint = this.getGardenPoint(e)
            addPoint(newPoint) // Add point using GardenManager
            this.borderConfig.points = this.gardenBorder.getPoints() // Updates rendered polygon
        },
        getCropCircleConfig(crop) {
            return {
                x: crop.pos.x,
                y: crop.pos.y,
                radius: crop.spacingRadius * this.getPixelScale(),
                fill: 'red',
                opacity: 0.2,
                listening: false
            }
        },
        getCropImageConfig(crop) {
            let size = crop.minArea * this.getPixelScale()
            return {
                x: crop.pos.x - size / 2,
                y: crop.pos.y - size / 2,
                width: size,
                height: size,
                image: crop.image
            }
        },
        getSelectionCircleConfig(crop) {
            return {
                x: crop.pos.x,
                y: crop.pos.y,
                radius: crop.spacingRadius * this.getPixelScale() + 4,
                fill: 'transparent',
                stroke: 'blue',
                strokeWidth: 3,
                listening: false
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
            if (this.isDraggingScale) {
                this.scaleOffset = new Vector(e.evt.clientX, e.evt.clientY).sub(this.scaleDragStart)
                return
            }
            if (this.isPanning) {
                this.cameraConfig.x = this.panOrigin.x + e.evt.clientX - this.panStart.x
                this.cameraConfig.y = this.panOrigin.y + e.evt.clientY - this.panStart.y
                return
            }
            if (isMouseDown) {
                let gardenPoint = this.getGardenPoint(e)
                if (this.layoutConfig && this.layoutStart) {
                    this.layoutEnd = gardenPoint
                    this.updateLayoutPreview()
                    return
                }
                if (this.gestureMode) {
                    this.gestureEnd = gardenPoint
                    if (this.gestureStart.sub(this.gestureEnd).magnitudeSquared() > 36) this.gestureMoved = true
                    if (this.selectionShape === 'lasso') {
                        let lastPoint = this.gesturePoints[this.gesturePoints.length - 1]
                        if (lastPoint.sub(this.gestureEnd).magnitudeSquared() >= 25) this.gesturePoints.push(this.gestureEnd)
                    }
                    return
                }
                if (!drawingBorder && getPoints().value.length == 0) {
                    drawingBorder = true
                }
                if (drawingBorder) {
                   this.addBorderPoint(e)
                } else if (draggingBorderPoint !== null) {
                    getPoints().value[draggingBorderPoint] = gardenPoint
                    this.borderConfig.points = this.gardenBorder.getPoints()
                } else if (draggingCrop && this.selectedCrop) {
                    let delta = gardenPoint.sub(this.groupDragStart)
                    let selected = this.selectedCrops
                    let proposed = this.groupStartPositions.map((position) => position.add(delta))
                    let valid = selected.every((crop, index) => this.isCropPositionValid(crop, proposed[index], selected))
                    if (valid) {
                        selected.forEach((crop, index) => { crop.pos = proposed[index] })
                    }
                }
            } else {
                let x = e.evt.clientX
                let y = e.evt.clientY
            }
        },
        handleMouseDown(e) {
            if (e.target.name && e.target.name() === 'scale-ruler' && e.evt.button == 0) {
                this.isDraggingScale = true
                this.scaleDragStart = new Vector(e.evt.clientX, e.evt.clientY)
                isMouseDown = true
                return
            }
            if (e.evt.button == 1) {
                e.evt.preventDefault()
                this.isPanning = true
                this.panStart = new Vector(e.evt.clientX, e.evt.clientY)
                this.panOrigin = new Vector(this.cameraConfig.x, this.cameraConfig.y)
                return
            }
            isMouseDown = true
            let gardenPoint = this.getGardenPoint(e)
            if (this.layoutConfig && getPoints().value.length >= 3 && e.evt.button == 0) {
                this.layoutStart = gardenPoint
                this.layoutEnd = this.layoutStart
                this.layoutPreview = []
                return
            }
            if (getPoints().value.length == 0 || drawingBorder) {
                return
            }

            let point = gardenPoint
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
            let cropRadius = closestCrop ? Math.max(closestCrop.minArea * this.getPixelScale() / 2, closestCrop.spacingRadius * this.getPixelScale()) : 0
            let difference = closestCrop ? closestCrop.pos.sub(point) : null
            let cropIsSelected = closestCrop && difference.magnitudeSquared() <= cropRadius * cropRadius

            if (e.evt.button == 2) { // Right click
                this.beginSelectionGesture('delete', point)
                return
            }

            if (e.evt.button == 0) { // Left click
                if (cropIsSelected) {
                    if (!this.selectedCrops.includes(closestCrop)) this.selectedCrops = [closestCrop]
                    this.selectedCrop = closestCrop
                    draggingCrop = true
                    this.groupDragStart = point
                    this.groupStartPositions = this.selectedCrops.map((crop) => crop.pos)
                    return
                }
                this.beginSelectionGesture('select', point)
            }
        },
        handleMouseUp(e) {
            if (this.isDraggingScale) {
                this.isDraggingScale = false
                this.scaleDragStart = null
                this.scaleOffset = { x: 0, y: 0 }
                isMouseDown = false
                return
            }
            if (this.isPanning) {
                this.isPanning = false
                isMouseDown = false
                return
            }
            if (this.layoutConfig && this.layoutStart) {
                this.layoutEnd = this.getGardenPoint(e)
                this.updateLayoutPreview()
                this.layoutStart = null
                this.layoutMessage = this.layoutPreview.length > 0 ? `Previewing ${this.layoutPreview.length} placements.` : 'No valid placements in that area.'
                isMouseDown = false
                return
            }
            if (this.gestureMode) {
                let endPoint = this.getGardenPoint(e)
                this.gestureEnd = endPoint
                if (this.gestureMoved) {
                    if (this.selectionShape === 'lasso') this.gesturePoints.push(endPoint)
                    let matches = this.crops.filter((crop) => this.isCropInGesture(crop.pos))
                    if (this.gestureMode === 'delete') {
                        matches.forEach((crop) => removeCrop(crop))
                        this.selectedCrops = this.selectedCrops.filter((crop) => !matches.includes(crop))
                        this.selectedCrop = this.selectedCrops[0] || null
                    } else {
                        this.selectedCrops = matches
                        this.selectedCrop = matches[0] || null
                    }
                } else if (this.gestureMode === 'delete') {
                    let crop = this.getCropAtPoint(this.gestureStart)
                    if (crop) removeCrop(crop)
                    this.selectedCrops = this.selectedCrops.filter((item) => item !== crop)
                    this.selectedCrop = this.selectedCrops[0] || null
                } else if (currentPlant.value?.id) {
                    let crop = new Crop(currentPlant.value.id, this.gestureStart)
                    if (this.isCropPositionInside(crop, crop.pos) && !this.hasCropOverlap(crop)) addCrop(crop)
                } else {
                    this.selectedCrops = []
                    this.selectedCrop = null
                }
                this.gestureMode = null
                this.gestureStart = null
                this.gestureEnd = null
                this.gesturePoints = []
                this.gestureMoved = false
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
        beginSelectionGesture(mode, point) {
            this.gestureMode = mode
            this.gestureStart = point
            this.gestureEnd = point
            this.gesturePoints = [point]
            this.gestureMoved = false
        },
        getGestureBoxConfig() {
            let x = Math.min(this.gestureStart.x, this.gestureEnd.x)
            let y = Math.min(this.gestureStart.y, this.gestureEnd.y)
            return { x, y, width: Math.abs(this.gestureEnd.x - this.gestureStart.x), height: Math.abs(this.gestureEnd.y - this.gestureStart.y), stroke: this.gestureMode === 'delete' ? 'red' : 'blue', strokeWidth: 2, fill: this.gestureMode === 'delete' ? 'rgba(255,0,0,0.12)' : 'rgba(0,0,255,0.12)', listening: false }
        },
        getGestureLassoConfig() {
            let points = this.gesturePoints.flatMap((point) => [point.x, point.y])
            if (this.gestureEnd) points.push(this.gestureEnd.x, this.gestureEnd.y)
            let color = this.gestureMode === 'delete' ? 'red' : 'blue'
            return { points, stroke: color, strokeWidth: 2, closed: this.gestureMoved, fill: this.gestureMode === 'delete' ? 'rgba(255,0,0,0.12)' : 'rgba(0,0,255,0.12)', listening: false }
        },
        isCropInGesture(point) {
            if (this.selectionShape === 'box') {
                return point.x >= Math.min(this.gestureStart.x, this.gestureEnd.x) && point.x <= Math.max(this.gestureStart.x, this.gestureEnd.x) && point.y >= Math.min(this.gestureStart.y, this.gestureEnd.y) && point.y <= Math.max(this.gestureStart.y, this.gestureEnd.y)
            }
            let inside = false
            let points = this.gesturePoints
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                if ((points[i].y > point.y) !== (points[j].y > point.y) && point.x < (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x) inside = !inside
            }
            return inside
        },
        getCropAtPoint(point) {
            let crop = this.getClosestCrop(point)
            if (!crop) return null
            let radius = Math.max(crop.spacingRadius * this.getPixelScale(), crop.minArea * this.getPixelScale() / 2)
            return crop.pos.sub(point).magnitudeSquared() <= radius ** 2 ? crop : null
        },
        isCropPositionInside(crop, position) {
            let radius = crop.spacingRadius * this.getPixelScale()
            let corners = [
                new Vector(position.x - radius, position.y - radius),
                new Vector(position.x + radius, position.y - radius),
                new Vector(position.x + radius, position.y + radius),
                new Vector(position.x - radius, position.y + radius)
            ]
            return corners.every((corner) => this.gardenBorder.isPointInPolygon(corner))
        },
        isCropPositionValid(crop, position, selectedCrops) {
            let radius = crop.spacingRadius * this.getPixelScale()
            let corners = [
                new Vector(position.x - radius, position.y - radius),
                new Vector(position.x + radius, position.y - radius),
                new Vector(position.x + radius, position.y + radius),
                new Vector(position.x - radius, position.y + radius)
            ]
            if (!corners.every((corner) => this.gardenBorder.isPointInPolygon(corner))) return false
            for (let other of this.crops) {
                if (selectedCrops.includes(other)) continue
                if (other.pos.sub(position).magnitudeSquared() < ((other.spacingRadius + crop.spacingRadius) * this.getPixelScale()) ** 2) return false
            }
            return true
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
                let minDistance = (existingCrop.spacingRadius + crop.spacingRadius) * this.getPixelScale()
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
.gardenView {
    position: fixed;
    inset: 0;
}
.layoutPanel {
    position: absolute;
    z-index: 10;
    left: 16px;
    bottom: 70px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 230px;
    max-height: 45vh;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #555;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.95);
}
.layoutPanel label {
    display: flex;
    justify-content: space-between;
    gap: 8px;
}
.layoutPanel input,
.layoutPanel select {
    width: 90px;
}
.layoutButtons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
.layoutButtons button {
    flex: 1;
}
</style>
