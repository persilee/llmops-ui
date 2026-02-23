<script setup lang="ts">
import CopyrightInfo from './components/CopyrightInfo.vue'
import LoginBanner from './components/LoginBanner.vue'
import LoginForm from './components/LoginForm.vue'
</script>

<template>
  <div class="flex h-screen bg-white">
    <!-- 左侧 Banner -->
    <LoginBanner />
    <!-- 右侧登录表单 -->
    <div class="relative flex flex-1 items-center justify-center pb-10">
      <div class="flex flex-col items-center justify-center w-[366px]">
        <LoginForm />
      </div>
      <div class="absolute right-0 bottom-0 w-full">
        <CopyrightInfo :start-year="2025" author="lishaoy.net" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
