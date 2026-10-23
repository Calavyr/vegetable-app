<template>
    <div class="plantMenu">
        <div class="menuContent">
            <div class="plantGrid">
                <div v-for="plant in plants" :key="plant.id" class="plantCard">
                    <button @click="selectPlant(plant)" :class="{ 'selected': currentPlant === plant }">
                        <span>{{ plant.plant }}</span>
                        <img :src="plant.image" width="50">
                        <small>{{ getPlantRadius(plant) }} cm radius</small>
                    </button>
                    <button v-if="String(plant.id).startsWith('custom-')" class="removePlant" @click="removePlant(plant)">Remove</button>
                </div>
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
import { getGardenState } from '@/composables/GardenManager';
const { currentPlant, selectPlant, addCustomPlant, removeCustomPlant, getPlants } = getPlantState()
const { getCrops } = getGardenState()

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
        getPlantRadius(plant) {
            return plant.spacingRadius ?? plant.minArea / 2
        },
        removePlant(plant) {
            if (getCrops().value.some((crop) => crop.id === plant.id)) {
                this.importError = 'Remove this crop from the garden before deleting it.'
                return
            }
            removeCustomPlant(plant.id)
            this.importError = ''
        },
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
* {
    box-sizing: border-box;
}
.plantMenu {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 60%;
    height: 80%;
    border: black 2px solid;
    background: white;
}
.menuContent {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 12px;
    left: 1%;
    top: 4%;
    width: 98%;
    height: 92%;
}
.plantGrid {
    display: grid;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    align-content: start;
    gap: 8px;
}
.plantGrid button {
    min-height: 110px;
    border: black 2px solid;
    border-radius: 1vw;
    background: white;
}
.plantCard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}
.plantCard > button:first-child {
    width: 100%;
    flex: 1;
}
.plantCard .removePlant {
    min-height: 28px;
    border: 1px solid #8b1c1c;
    border-radius: 4px;
    background: #fff;
    color: #8b1c1c;
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
    flex: 0 0 auto;
    flex-wrap: wrap;
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
</style>
