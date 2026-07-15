<template>
    <div>
        <input type="date" v-model="selectedDate" @change="updateDate">
        <div contenteditable id="editor" ref="editor" @input="updateJournal"></div>
        <div id="changeDateButtons">
            <button @click="changeDay(-1)">⇦</button>
            <button @click="changeDay(1)">⇨</button>
        </div>
    </div>
</template>

<script>
import { journal } from '@/composables/JournalManager';

export default {
    data() {
        return {
            selectedDate: new Date().toLocaleDateString('sv-SE')
        }
    },
    methods: {
        updateDate(e) {
            if (this.selectedDate == '') return
            if (!journal.value[this.selectedDate]) {
                journal.value[this.selectedDate] = ''
            }
            this.$refs.editor.innerText = journal.value[this.selectedDate]
        },
        updateJournal(e) {
            if (this.selectedDate == '') return
            journal.value[this.selectedDate] = this.$refs.editor.innerText
        },
        changeDay(daysToMove) {
            if (this.selectedDate === '') return

            const current = new Date(this.selectedDate + 'T00:00:00')
            
            current.setDate(current.getDate() + daysToMove)
            
            this.selectedDate = current.toLocaleDateString('sv-SE')
            
            this.updateDate()
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
    background-color: white;
}
div#editor {
    position: absolute;
    left: 4%;
    top: 8%;
    width: 92%;
    height: 87%;
    overflow-x: hidden;
    overflow-y: auto;
}
div#changeDateButtons {
    position: absolute;
    top: auto;
    bottom: calc(0% - 1px);
    left: auto;
    right: calc(4% - 4px);
    width: fit-content;
    height: fit-content;
    border: none;
    outline: 2px solid black;
    outline-offset: -2px;
}
</style>