<template>
    <div>
        <button @click="exportSaveData('save.txt')">Save</button><br>
        <input type="file" @change="handleFileChange">
        <button @click="loadSaveData()" v-if="file">Load</button>
    </div>
</template>

<script>
import { Crop } from '@/assets/Crop';
import { Vector } from '@/assets/Vector';
import { getGardenState } from '@/composables/GardenManager';
import { journal } from '@/composables/JournalManager';
import { watch } from 'vue';
const { addCrop, getCrops, clearCrops, addPoint, getPoints, clearPoints } = getGardenState()

export default {
    data() {
        return {
            file: ''
        }
    },
    methods: {
        exportSaveData(fileName) {
            let journalData = journal.value
            let cropsData = getCrops().value
            let simplifiedCropsData = cropsData.map((v, i) => ({id: v.id, pos: v.pos}))
            let pointsData = getPoints().value

            const saveData = {
                journal: journalData,
                crops: simplifiedCropsData,
                points: pointsData
            }

            let text = JSON.stringify(saveData)

            const blob = new Blob([text], {type: 'text/plain'})
            const fileUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = fileName
            link.href = fileUrl,
            link.click()
            URL.revokeObjectURL(fileUrl)
        },
        loadSaveData() { // Load save data into localStorage, then reload app normally from localStorage
            if (this.file == '' || this.file == null) return
            const reader = new FileReader()
            const updateOthers = this.updateOthers
            reader.onload = function(e) {
                const saveData = JSON.parse(e.target.result)
                
                localStorage.setItem('journal', JSON.stringify(saveData.journal))
                localStorage.setItem('crops', JSON.stringify(saveData.crops))
                localStorage.setItem('points', JSON.stringify(saveData.points))
                
                updateOthers()
            }
            reader.readAsText(this.file)
        },
        updateOthers() {
            let journalData = localStorage.getItem('journal')
            if (journalData !== null) {
                let parsedJournalData = JSON.parse(journalData)
                if (journalData !== '' && parsedJournalData) {
                    journal.value = parsedJournalData
                } else {
                    journal.value = {}
                }
            }

            let cropsData = localStorage.getItem('crops')
            clearCrops()
            if (cropsData !== null) {
                let parsedCropsData = JSON.parse(cropsData)
                if (cropsData !== '' && parsedCropsData) {
                    for (let cropInfo of parsedCropsData) {
                        let posVector = new Vector(cropInfo.pos.x, cropInfo.pos.y)
                        let crop = new Crop(cropInfo.id, posVector)
                        addCrop(crop)
                    }
                }
            }
            let pointsData = localStorage.getItem('points')
            clearPoints()
            if (pointsData !== null) {
                let parsedPointsData = JSON.parse(pointsData)
                if (pointsData !== '' && parsedPointsData) {
                    for (let point of parsedPointsData) {
                        addPoint(point)
                    }
                }
            }
            
            this.$emit('saveLoaded')
        },
        handleFileChange(event) {
            const file = event.target.files[0]
            if (file) {
                this.file = file
            } else {
                this.file = ''
            }
        }
    },
    mounted() {
        watch(journal.value, (newValue, oldValue) => {
            try {
                localStorage.setItem('journal', JSON.stringify(newValue))
            } catch (err) {
                console.warn(err)
            }
        })
        watch(getCrops().value, (newValue, oldValue) => {
            try {
                let simplifiedNewValue = newValue.map((v, i) => ({id: v.id, pos: v.pos}))
                localStorage.setItem('crops', JSON.stringify(simplifiedNewValue))
            } catch (err) {
                console.warn(err)
            }
        })
        watch(getPoints().value, (newValue, oldValue) => {
            try {
                localStorage.setItem('points', JSON.stringify(newValue))
            } catch (err) {
                console.warn(err)
            }
        })
        this.updateOthers()
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
    background-color: white;
}
</style>