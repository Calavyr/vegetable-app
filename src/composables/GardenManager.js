import { ref } from "vue";
import { Vector } from "../assets/Vector";
const crops = ref([])
const points = ref([])

export function getGardenState() {
    function addCrop(crop) {
        crops.value.push(crop)
    }
    function removeCrop(crop) {
        let index = crops.value.indexOf(crop)
        if (index == -1) {
            return false
        }
        crops.value.splice(index, 1)
        return true
    }
    function getCrops() {
        return crops
    }
    function clearCrops() {
        crops.value = []
    }
    function addPoint(point) {
        if (!(point instanceof Vector)) {
            point = new Vector(point.x, point.y)
        }
        points.value.push(point)
    }
    function insertPoint(index, point) {
        if (!(point instanceof Vector)) {
            point = new Vector(point.x, point.y)
        }
        points.value.splice(index, 0, point)
    }
    function removePoint(point) {
        let index = points.value.indexOf(point)
        if (index == -1) {
            return false
        }
        points.value.splice(index, 1)
        return true
    }
    function getPoints() {
        return points
    }
    function clearPoints() {
        points.value = []
    }

    return { addCrop, removeCrop, getCrops, clearCrops, addPoint, insertPoint, removePoint, getPoints, clearPoints }
}
