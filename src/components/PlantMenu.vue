<template>
    <div>
        <div id="tableWrapper">
            <div class="plantGrid">
                <button v-for="plant in plants" :key="plant.id" @click="selectPlant(plant)" :class="{ 'selected': currentPlant === plant }">
                    <span>{{ plant.plant }}</span>
                    <img :src="plant.image" width="50">
                </button>
            </div>
            <form @submit.prevent="importCrop">
                <input v-model="customPlantName" placeholder="Crop name" maxlength="40" required>
                <label>Growing space radius (cm)
                    <input v-model.number="customPlantRadius" type="number" min="1" max="500" step="1" required>
                </label>
                <input type="file" accept="image/*" @change="handleImageChange" required>
                <button type="submit">Import crop</button>
                <p v-if="importError">{{ importError }}</p>
            </form>
        </div>
    </div>
</template>

<script>
import { getPlantState } from '@/composables/PlantManager';
const { currentPlant, selectPlant, addCustomPlant, getPlants } = getPlantState()

export default {
    data() {
        return {
            plants: getPlants(),
            currentPlant,
            customPlantName: '',
            customPlantRadius: 23,
            customPlantImage: '',
            importError: ''
        }
    },
    methods: {
        selectPlant,
        handleImageChange(event) {
            const file = event.target.files[0]
            this.importError = ''
            if (!file) return
            if (!file.type.startsWith('image/')) {
                this.importError = 'Choose an image file.'
                return
            }
            if (file.size > 2 * 1024 * 1024) {
                this.importError = 'Choose an image smaller than 2 MB.'
                return
            }
            const reader = new FileReader()
            reader.onload = () => { this.customPlantImage = reader.result }
            reader.readAsDataURL(file)
        },
        importCrop() {
            if (!this.customPlantImage) {
                this.importError = 'Choose an image file.'
                return
            }
            const plant = {
                id: `custom-${Date.now()}`,
                plant: this.customPlantName.trim(),
                colour: 'Green',
                image: this.customPlantImage,
                minArea: 45,
                spacingRadius: this.customPlantRadius
            }
            try {
                addCustomPlant(plant)
                this.selectPlant(plant)
                this.customPlantName = ''
                this.customPlantRadius = 23
                this.customPlantImage = ''
                this.importError = ''
            } catch (error) {
                this.importError = 'Could not save this crop. Try a smaller image.'
            }
        }
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
.plantGrid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
}
.plantGrid button {
    min-height: 90px;
    border: black 2px solid;
    border-radius: 1vw;
    background: white;
}
.plantGrid button.selected {
    background: lightgrey;
}
.plantGrid img {
    display: block;
    margin: 4px auto;
    object-fit: contain;
}
form {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 12px;
}
form label {
    white-space: nowrap;
}
form input[type="number"] {
    width: 72px;
}
td {
    width: 20%;
    border: black 2px solid;
    border-radius: 1vw;
    text-align: center;
    background: white;
}

td.selected {
    background: lightgrey;
}
</style>
