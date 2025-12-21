<script setup lang="ts"></script>

<template>
  <div class="cursor"></div>
</template>

<style scoped>
.cursor {
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #444;
  animation: blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
