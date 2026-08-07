<template>
  <router-view />
  <!-- 全局 Toast -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastVisible" class="g-toast">{{ toastMsg }}</div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, provide } from 'vue'

const toastVisible = ref(false)
const toastMsg = ref('')
let toastTimer = null

function showToast(msg, duration = 1800) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, duration)
}

// 让全局子组件都能调用
provide('showToast', showToast)
</script>

<style>
/* ── 全局 Reset ─────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html {
  font-size: 16px;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  background: #f0ebe0;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  color: #2c2416;
  overscroll-behavior: none;
}

input, button, textarea {
  font-family: inherit;
  outline: none;
  border: none;
  background: none;
}

/* ── 全局 Toast ─────────────────────────── */
.g-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 22, 10, 0.82);
  color: #fff8e8;
  padding: 12px 28px;
  border-radius: 40px;
  font-size: 15px;
  z-index: 9999;
  white-space: nowrap;
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
