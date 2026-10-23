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

    function removeCustomPlant(id) {
        if (!String(id).startsWith('custom-')) return false
        plants.value = plants.value.filter((plant) => plant.id !== id)
        localStorage.setItem('custom-plants', JSON.stringify(plants.value.filter((plant) => String(plant.id).startsWith('custom-'))))
        if (currentPlant.value?.id === id) currentPlant.value = ''
        return true
    }

    function getPlants() {
        return plants
    }

    return { currentPlant, selectPlant, addCustomPlant, removeCustomPlant, getPlants }
}
