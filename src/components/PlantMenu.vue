<template>
    <div>
        <div id="tableWrapper">
            <table>
                <tr v-for="(chunk, chunkIndex) in chunkedPlants">
                    <td v-for="(plant, plantIndex) in chunk" @click="selectPlant(plant)">
                        <p>{{ plant.plant }}</p>
                        <img :src="plant.image" width="50px">
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import plantsData from '@/data/plants.json'
import { getPlantState } from '@/composables/PlantManager';
const { currentPlant, selectPlant } = getPlantState()

export default {
    data() {
        return {
            plants: plantsData,
            chunkedPlants: []
        }
    },
    mounted() {
        const columns = 5;
        for (let i = 0; i < this.plants.length; i += columns) {
            this.chunkedPlants.push(this.plants.slice(i, i + columns))
        }
    },
    methods: {
        selectPlant
    }
}


</script>

<style scoped>
div {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 60%;
    height: 80%;
    border: black 2px solid;
    background: white;
}
div#tableWrapper {
    position: absolute;
    left: 4%;
    top: 5%;
    width: 92%;
    height: 90%;
    overflow-x: hidden;
    overflow-y: auto;
}
table {
    width: 100%;
    height: 100%;
}
td {
    width: 20%;
    border: black 2px solid;
    border-radius: 1vw;
    text-align: center;
    background: white;
}
</style>