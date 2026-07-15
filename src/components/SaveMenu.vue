<template>
    <div>
        <button @click="exportSaveData('save.txt')">Save</button><br>
        <input type="file" @change="handleFileChange">
        <button @click="loadSaveData()" v-if="file">Load</button>
    </div>
</template>

<script>
import { journal } from '@/composables/JournalManager';
import { watch } from 'vue';

export default {
    data() {
        return {
            file: ''
        }
    },
    methods: {
        exportSaveData(fileName) {
            let journalData = journal.value

            let text = JSON.stringify(journalData)

            const blob = new Blob([text], {type: 'text/plain'})
            const fileUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = fileName
            link.href = fileUrl,
            link.click()
            URL.revokeObjectURL(fileUrl)
        },
        loadSaveData() {
            if (this.file == '' || this.file == null) return
            const reader = new FileReader()
            const updateOthers = this.updateOthers
            reader.onload = function(e) {
                const content = e.target.result
                
                localStorage.setItem('journal', content)
                
                updateOthers()
            }
            reader.readAsText(this.file)
        },
        updateOthers() {
            let journalData = localStorage.getItem('journal')
            if (journalData !== null) {
                let parsedJournalData = JSON.parse(journalData)
                if (journalData !== '') {
                    if (parsedJournalData) {
                        console.log(parsedJournalData)
                        journal.value = parsedJournalData
                    }
                } else {
                    journal.value = {}
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