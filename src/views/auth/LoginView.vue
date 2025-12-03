<script setup lang="ts">
import LoginBanner from './components/LoginBanner.vue'
import LoginForm from './components/LoginForm.vue'
</script>

<template>
  <div class="flex h-screen bg-white">
    <!-- 左侧 Banner -->
    <LoginBanner />
    <!-- 右侧登录表单 -->
    <div class="relative flex flex-1 items-center justify-center pb-10">
      <div class="flex flex-col items-center justify-center w-[336px]">
        <LoginForm />
      </div>
      <div class="absolute right-0 bottom-0 w-full">
        <footer class="flex items-center justify-center h-10 text-gray-600 text-center">
          LLMOps AppBuilder
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
