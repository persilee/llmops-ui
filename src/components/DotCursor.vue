<script setup lang="ts"></script>

<template>
  <div class="dot-cursor"></div>
</template>

<style scoped>
.dot-cursor {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 100%;
  background-color: #444;
  animation: blink 0.6s step-end infinite;
  vertical-align: middle;
  transform: translateY(-1px);
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
