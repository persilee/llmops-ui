<script setup lang="ts">
const visible = defineModel({ type: Boolean, default: false })

const handleCloseModal = () => {
  visible.value = false
}
</script>

<template>
  <a-modal
    :visible="visible"
    title="召回测试"
    title-align="start"
    modal-class="rounded-xl w-2/3 min-w-[800px]"
    :footer="false"
    @cancel="handleCloseModal"
  >
  </a-modal>
</template>

<style scoped></style>
