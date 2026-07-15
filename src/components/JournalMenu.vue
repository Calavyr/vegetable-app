<template>
    <div>
        <input type="date" v-model="selectedDate" @change="updateDate">
        <div contenteditable id="editor" ref="editor" @input="updateJournal"></div>
    </div>
</template>

<script>
import { journal } from '@/composables/JournalManager';

export default {
    data() {
        return {
            selectedDate: new Date().toISOString().slice(0, 10),
            prevSelectedDate: new Date().toISOString().slice(0, 10)
        }
    },
    methods: {
        updateDate(e) {
            if (this.selectedDate == '') return
            if (!journal.value[this.selectedDate]) {
                journal.value[this.selectedDate] = ''
            }
            this.$refs.editor.innerText = journal.value[this.selectedDate]
            this.prevSelectedDate = this.selectedDate
        },
        updateJournal(e) {
            if (this.selectedDate == '') return
            journal.value[this.selectedDate] = this.$refs.editor.innerText
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
</style>