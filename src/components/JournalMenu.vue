<template>
    <div class="journalMenu">
        <div class="dateControls">
            <button @click="changeDay(-1)">⇦</button>
            <input type="date" v-model="selectedDate" @change="updateDate">
            <button @click="changeDay(1)">⇨</button>
        </div>

        <div class="tagSearch">
            <input v-model="tagSearch" placeholder="Search journal tags">
            <div v-if="tagSearch" class="searchResults">
                <button v-for="result in filteredEntries" :key="result.date" @click="openEntry(result.date)">
                    {{ result.date }} · {{ result.tags.join(', ') }}
                </button>
                <span v-if="filteredEntries.length === 0">No entries match that tag.</span>
            </div>
        </div>

        <form class="tagEditor" @submit.prevent="addTag">
            <input v-model="tagInput" list="journalTagSuggestions" placeholder="Add a tag" maxlength="30">
            <datalist id="journalTagSuggestions">
                <option v-for="tag in tagSuggestions" :key="tag" :value="tag"></option>
            </datalist>
            <button type="submit">Add tag</button>
            <button v-for="tag in currentTags" :key="tag" type="button" class="tag" @click="removeTag(tag)">
                {{ tag }} ×
            </button>
        </form>

        <div contenteditable="true" class="editor" ref="editor" @input="updateJournal"></div>
    </div>
</template>

<script>
import { journal } from '@/composables/JournalManager';

export default {
    data() {
        return {
            selectedDate: new Date().toLocaleDateString('sv-SE'),
            tagInput: '',
            tagSearch: '',
            currentTags: [],
            knownTags: []
        }
    },
    computed: {
        tagSuggestions() {
            let tags = [...this.knownTags]
            for (let entry of Object.values(journal.value)) {
                if (entry && typeof entry === 'object' && Array.isArray(entry.tags)) tags.push(...entry.tags.filter((tag) => typeof tag === 'string'))
            }
            let uniqueTags = [...new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values()]
            let search = this.tagInput.trim().toLowerCase()
            return search ? uniqueTags.filter((tag) => tag.toLowerCase().includes(search)) : uniqueTags
        },
        filteredEntries() {
            let search = this.tagSearch.trim().toLowerCase()
            if (!search) return []
            return Object.entries(journal.value)
                .map(([date, rawEntry]) => {
                    let entry = typeof rawEntry === 'string' ? { text: rawEntry, tags: [] } : rawEntry
                    return { date, tags: Array.isArray(entry?.tags) ? entry.tags : [] }
                })
                .filter((entry) => entry.tags.some((tag) => tag.toLowerCase().includes(search)))
                .sort((first, second) => second.date.localeCompare(first.date))
        }
    },
    mounted() {
        try {
            let savedTags = JSON.parse(localStorage.getItem('journal-tags') || '[]')
            if (Array.isArray(savedTags)) this.knownTags = savedTags.filter((tag) => typeof tag === 'string')
        } catch (error) {
            console.warn(error)
        }
        this.updateDate()
    },
    methods: {
        getEntry(date) {
            let entry = journal.value[date]
            if (typeof entry === 'string') {
                entry = { text: entry, tags: [] }
                journal.value[date] = entry
            }
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                entry = { text: '', tags: [] }
                journal.value[date] = entry
            }
            if (!Array.isArray(entry.tags)) entry.tags = []
            if (typeof entry.text !== 'string') entry.text = ''
            return entry
        },
        updateDate() {
            if (this.selectedDate == '') return
            let entry = this.getEntry(this.selectedDate)
            this.$refs.editor.innerText = entry.text
            this.currentTags = [...entry.tags]
        },
        updateJournal() {
            if (this.selectedDate == '') return
            this.getEntry(this.selectedDate).text = this.$refs.editor.innerText
        },
        addTag() {
            let tag = this.tagInput.trim().replace(/^#/, '')
            if (!tag || this.selectedDate == '') return
            let entry = this.getEntry(this.selectedDate)
            if (!entry.tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase())) {
                entry.tags.push(tag)
            }
            if (!this.knownTags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase())) {
                this.knownTags.push(tag)
                try {
                    localStorage.setItem('journal-tags', JSON.stringify(this.knownTags))
                } catch (error) {
                    console.warn(error)
                }
            }
            this.currentTags = [...entry.tags]
            this.tagInput = ''
        },
        removeTag(tag) {
            let entry = this.getEntry(this.selectedDate)
            entry.tags = entry.tags.filter((item) => item !== tag)
            this.currentTags = [...entry.tags]
        },
        openEntry(date) {
            this.selectedDate = date
            this.updateDate()
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
.journalMenu {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 60%;
    height: 80%;
    border: black 2px solid;
    background-color: white;
}
.dateControls,
.tagSearch,
.tagEditor,
.editor {
    position: absolute;
    left: 4%;
    width: 92%;
}
.dateControls {
    top: 3%;
    display: flex;
    gap: 8px;
}
.dateControls input {
    flex: 1;
}
.tagSearch {
    top: 11%;
}
.tagSearch > input {
    width: 100%;
    box-sizing: border-box;
}
.searchResults {
    position: absolute;
    z-index: 1;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 140px;
    overflow-y: auto;
    border: 1px solid #777;
    background: white;
}
.searchResults button,
.searchResults span {
    display: block;
    width: 100%;
    padding: 6px;
    text-align: left;
}
.tagEditor {
    top: 20%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}
.tag {
    border: 1px solid #4776b8;
    border-radius: 12px;
    background: #eaf2ff;
}
.editor {
    top: 30%;
    height: 65%;
    overflow: auto;
    border: 1px solid #777;
    padding: 8px;
    box-sizing: border-box;
}
</style>
