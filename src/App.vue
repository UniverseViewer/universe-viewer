<template>
  <MainWindow />
</template>

<script setup>
import MainWindow from './views/MainWindow.vue'
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
a,
a:visited {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
</style>
