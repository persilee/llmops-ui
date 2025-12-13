<script setup lang="ts"></script>

<template>
  <a-collapse-item header="对话开场白" key="2">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <a-button @click.stop type="text" size="mini">
        <template #icon>
          <icon-plus class="text-gray-600" />
        </template>
      </a-button>
    </template>
    <!-- 内容 -->
    <div class="text-sm text-gray-500">总结聊天对话的内容，并用于更好的响应用户的消息。</div>
  </a-collapse-item>
</template>

<style scoped></style>
