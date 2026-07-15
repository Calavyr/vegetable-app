import { ref } from "vue";
const currentPlant = ref(0)

export function getPlantState() {
    function selectPlant(plant) {
        if (currentPlant.value == plant) {
            currentPlant.value = ''
        } else {
            currentPlant.value = plant
        }
    }

    return { currentPlant, selectPlant }
}