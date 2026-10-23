import { ref } from "vue";
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
        points.value.push(point)
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

    return { addCrop, removeCrop, getCrops, clearCrops, addPoint, removePoint, getPoints, clearPoints }
}