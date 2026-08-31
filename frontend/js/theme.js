const themeKey = "pomodoro-theme";
const themes = ['dark', 'light', 'blue', 'green'];
const defaultTheme = 'dark';

export function saveTheme(theme) {
    try {
        localStorage.setItem(themeKey, theme);
    }catch(ex) {
        console.log(ex);
    }
}

export function deleteTheme() {
    try {
        localStorage.removeItem(themeKey);
    }catch(ex) {
        console.log(ex);
    }
}

export function loadTheme() {
    try {
        const saved = localStorage.getItem(themeKey);

        if(!saved || !themes.includes(saved)) {
            return defaultTheme;
        }

        return saved;
    }catch(ex) {
        console.log(ex);
        return defaultTheme;
    }
}

export function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
}
