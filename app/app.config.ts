export default defineAppConfig({
    ui: {
        colors: {
            primary: 'green',
            neutral: 'slate'
        },
        colorMode: {
            preference: 'light', // Défaut à 'light'
            fallback: 'light',   // Si pas de préférence système, 'light'
            classSuffix: ''
        },

    }


})