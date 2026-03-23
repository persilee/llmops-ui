<script setup lang="ts">
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div v-if="visible" class="loading-container">
    <div class="main-box">
      <!-- 紫色柱子 -->
      <div
        class="pillar"
        style="
          left: 20px;
          width: 56px;
          height: 110px;
          background-color: rgb(108, 63, 245);
          border-radius: 10px 10px 0px 0px;
          z-index: 1;
        "
      >
        <div class="eye-group" style="left: 12px; top: 16px; gap: 12px">
          <div class="eye-white" style="width: 12px; height: 12px; background-color: white">
            <div
              class="eye-black"
              style="
                width: 4px;
                height: 4px;
                background-color: rgb(45, 45, 45);
                transform: translate(4.96499px, 0.590676px);
              "
            ></div>
          </div>
          <div class="eye-white" style="width: 12px; height: 12px; background-color: white">
            <div
              class="eye-black"
              style="
                width: 4px;
                height: 4px;
                background-color: rgb(45, 45, 45);
                transform: translate(4.96259px, 0.610452px);
              "
            ></div>
          </div>
        </div>
      </div>
      <!-- 黑色柱子 -->
      <div
        class="pillar"
        style="
          left: 52px;
          width: 42px;
          height: 72px;
          background-color: rgb(45, 45, 45);
          border-radius: 8px 8px 0px 0px;
          z-index: 2;
        "
      >
        <div class="eye-group" style="left: 8px; top: 12px; gap: 8px">
          <div class="eye-white" style="width: 10px; height: 10px; background-color: white">
            <div
              class="eye-black"
              style="
                width: 4px;
                height: 4px;
                background-color: rgb(45, 45, 45);
                transform: translate(4.96259px, 0.610452px);
              "
            ></div>
          </div>
          <div class="eye-white" style="width: 10px; height: 10px; background-color: white">
            <div
              class="eye-black"
              style="
                width: 4px;
                height: 4px;
                background-color: rgb(45, 45, 45);
                transform: translate(4.96259px, 0.610452px);
              "
            ></div>
          </div>
        </div>
      </div>
      <!-- 橙色柱子 -->
      <div
        class="pillar"
        style="
          left: 0px;
          width: 60px;
          height: 56px;
          z-index: 3;
          background-color: rgb(255, 155, 107);
          border-radius: 120px 120px 0px 0px;
        "
      >
        <div class="eye-group eye-group-orange" style="left: 12px; top: 22px; gap: 22px">
          <div
            class="eye-black"
            style="
              width: 6px;
              height: 6px;
              background-color: rgb(45, 45, 45);
              transform: translate(0px, 0px);
            "
          ></div>
          <div
            class="eye-black"
            style="width: 6px; height: 6px; background-color: rgb(45, 45, 45)"
          ></div>
        </div>
      </div>
      <!-- 黄色柱子 -->
      <div
        class="pillar"
        style="
          left: 78px;
          width: 30px;
          height: 36px;
          background-color: rgb(232, 215, 84);
          border-radius: 30px 30px 0px 0px;
          z-index: 4;
        "
      >
        <div class="eye-group eye-group-yellow" style="left: 6px; top: 14px; gap: 10px">
          <div
            class="eye-black"
            style="
              width: 4px;
              height: 4px;
              background-color: rgb(45, 45, 45);
              transform: translate(0px, 0px);
            "
          ></div>
          <div
            class="eye-black"
            style="
              width: 4px;
              height: 4px;
              background-color: rgb(45, 45, 45);
              transform: translate(0px, 0px);
            "
          ></div>
        </div>
        <div class="mouth" style="left: 7px; top: 26px"></div>
      </div>
    </div>
    <div class="" style="margin-top: 6px; font-size: 12px; padding: 2px 10px">加载中...</div>
    <div class="shimmer-base loading-box"></div>
  </div>
</template>

<style scoped>
.loading-container {
  position: relative;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}
.loading-box {
  position: absolute;
  z-index: 100;
  width: 180px;
  height: 180px;
  color: transparent !important;
  border-radius: 180px;
}
/* 主盒子 */
.main-box {
  position: relative;
  width: 110px;
  height: 110px;
}
/* 所有柱子通用样式 */
.pillar {
  position: absolute;
  bottom: 0;
  transition: all 0.7s ease-in-out;
  transform-origin: center bottom;
}
/* 眼睛容器 */
.eye-group {
  position: absolute;
  display: flex;
  transition: all 0.7s ease-in-out;
}
/* 白色眼白 */
.eye-white {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  overflow: hidden;
}
/* 黑色眼珠 */
.eye-black {
  border-radius: 50%;
  transition: transform 0.1s ease-out;
}
/* 黄色柱子的嘴巴 */
.mouth {
  position: absolute;
  width: 16px;
  background-color: #2d2d2d;
  transition: all 0.3s ease-out;
  height: 2px;
  border-radius: 2px;
  transform: none;
}
/* 橙色柱子眼睛组特殊过渡 */
.eye-group-orange {
  transition: all 0.2s ease-out;
}
/* 黄色柱子眼睛组特殊过渡 */
.eye-group-yellow {
  transition: all 0.2s ease-out;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.shimmer-base {
  background: linear-gradient(
    90deg,
    #00000000 0%,
    #00000000 40%,
    rgba(255, 255, 255, 0.8) 50%,
    /* 这里就是白色光韵 */ #00000000 60%,
    #00000000 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2.6s infinite linear;
}
</style>
