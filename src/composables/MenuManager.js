import { ref } from "vue";
const currentMenu = ref('none')

export function getMenuState() {
    function toggleMenu(menuName) {
        if (menuName == currentMenu.value) {
            currentMenu.value = 'none'
        } else {
            currentMenu.value = menuName
        }
    }

    return { currentMenu, toggleMenu }
}