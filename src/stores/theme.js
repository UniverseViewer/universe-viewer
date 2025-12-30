import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const darkMode = ref(false)
  let vuetifyTheme = null

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

  const redshiftGradient = computed(() => {
    const theme = canvasTheme
    const gradient = new Float32Array(256 * 3)
    const near = theme.value.redshiftNear
    const far = theme.value.redshiftFar
    for (let i = 0; i < 256; i++) {
      const v = i / 255.0
      gradient[i * 3] = near.r + (far.r - near.r) * v
      gradient[i * 3 + 1] = near.g + (far.g - near.g) * v
      gradient[i * 3 + 2] = near.b + (far.b - near.b) * v
    }
    return gradient
  })

  const themeName = computed(() => (darkMode.value ? 'dark' : 'light'))

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setDarkMode(value) {
    darkMode.value = value
  }

  function initialize(themeInstance = null) {
    if (themeInstance) {
      vuetifyTheme = themeInstance
    }
    const savedTheme = localStorage.getItem('theme_mode')
    if (savedTheme) {
      darkMode.value = savedTheme === 'dark'
    }
    if (vuetifyTheme) {
      vuetifyTheme.change(darkMode.value ? 'dark' : 'light')
    }
  }

  watch(darkMode, (val) => {
    localStorage.setItem('theme_mode', val ? 'dark' : 'light')
    // Sync Vuetify theme with store
    if (vuetifyTheme) {
      vuetifyTheme.change(val ? 'dark' : 'light')
    }
  })

  return {
    darkMode,
    canvasTheme,
    themeName,
    redshiftGradient,
    toggleDarkMode,
    setDarkMode,
    initialize,
  }
})
