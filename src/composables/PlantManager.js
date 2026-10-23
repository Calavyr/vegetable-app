import { ref } from "vue";
import plantsData from '@/data/plants.json'

const currentPlant = ref(0)
const plants = ref([...plantsData])

try {
    const savedPlants = JSON.parse(localStorage.getItem('custom-plants') || '[]')
    if (Array.isArray(savedPlants)) plants.value.push(...savedPlants)
} catch (error) {
    console.warn(error)
}

export function getPlantState() {
    function selectPlant(plant) {
        if (currentPlant.value == plant) {
            currentPlant.value = ''
        } else {
            currentPlant.value = plant
        }
    }

    function addCustomPlant(plant) {
        plants.value.push(plant)
        localStorage.setItem('custom-plants', JSON.stringify(plants.value.filter((item) => String(item.id).startsWith('custom-'))))
    }

    function getPlants() {
        return plants
    }

    return { currentPlant, selectPlant, addCustomPlant, getPlants }
}
