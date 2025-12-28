import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const darkMode = ref(true)

  const canvasThemes = {
    dark: {
      background: 0x000000,
      markOutline: 0xaaaaaa,
      horizonBackground: 0x000030,
      point: {
        r: 1.0,
        g: 1.0,
        b: 1.0,
      },
      selectedPoint: {
        r: 0.0,
        g: 1.0,
        b: 0.0,
      },
      redshiftNear: {
        r: 0.0,
        g: 0.0,
        b: 1.0,
      },
      redshiftFar: {
        r: 1.0,
        g: 0.0,
        b: 0.0,
      },
    },
    light: {
      background: 0xe4e4e4,
      markOutline: 0x000000,
      horizonBackground: 0xffffff,
      point: {
        r: 0.0,
        g: 0.0,
        b: 0.0,
      },
      selectedPoint: {
        r: 1.0,
        g: 0.0,
        b: 0.0,
      },
      redshiftNear: {
        r: 0.0,
        g: 1.0,
        b: 0.0,
      },
      redshiftFar: {
        r: 0.0,
        g: 0.0,
        b: 1.0,
      },
    },
  }

  const canvasTheme = computed(() => (darkMode.value ? canvasThemes.dark : canvasThemes.light))
  const themeName = computed(() => (darkMode.value ? 'dark' : 'light'))

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setDarkMode(value) {
    darkMode.value = value
  }

  function initialize() {
    const savedTheme = localStorage.getItem('theme_mode')
    if (savedTheme) {
      darkMode.value = savedTheme === 'dark'
    }
  }

  watch(darkMode, (val) => {
    localStorage.setItem('theme_mode', val ? 'dark' : 'light')
  })

  return {
    darkMode,
    canvasTheme,
    themeName,
    toggleDarkMode,
    setDarkMode,
    initialize,
  }
})
