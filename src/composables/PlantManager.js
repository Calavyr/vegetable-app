import { ref } from "vue";
const currentPlant = ref(0)

export function getPlantState() {
    function selectPlant(plant) {
        currentPlant.value = plant
    }

    return { currentPlant, selectPlant }
}