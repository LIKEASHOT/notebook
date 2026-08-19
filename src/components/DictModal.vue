<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dict-overlay" @click.self="close">
      <div class="dict-modal" @click.stop>
        <!-- 弹窗顶部栏 -->
        <div class="dict-header">
          <div class="dict-title-wrap">
            <span class="dict-title-icon">📖</span>
            <span class="dict-title">单词查询</span>
          </div>
          <div class="dict-close-btn" @click="close">
            <span class="dict-close-icon">×</span>
          </div>
        </div>

        <!-- 搜索输入栏 -->
        <div class="dict-search-row">
          <div class="dict-input-wrap">
            <span class="dict-search-icon">⌕</span>
            <input
              ref="inputRef"
              v-model="queryInput"
              class="dict-input"
              placeholder="输入英文单词或短语..."
              type="search"
              @keydown.enter="handleSearch"
            />
            <div v-if="queryInput" class="dict-input-clear" @click="clearInput">
              <span class="dict-clear-icon">×</span>
            </div>
          </div>
          <button
            class="dict-query-btn"
            :disabled="loading || !queryInput.trim()"
            @click="handleSearch"
          >
            <span>{{ loading ? '查询中' : '查询' }}</span>
          </button>
        </div>

        <!-- 结果展示区 -->
        <div class="dict-content">
          <!-- 加载中 -->
          <div v-if="loading" class="dict-state dict-state--loading">
            <div class="dict-spinner"></div>
            <span class="dict-state-text">正在查询词典...</span>
          </div>

          <!-- 查词成功 -->
          <div v-else-if="result && result.found" class="dict-result">
            <!-- 单词标题与发音 -->
            <div class="dict-word-header">
              <div class="dict-word-main">
                <span class="dict-word-text">{{ result.word }}</span>
                <!-- 发音按钮 -->
                <button
                  class="dict-audio-btn"
                  :class="{ 'dict-audio-btn--playing': isPlayingAudio }"
                  title="播放美音发音"
                  @click="playAudio"
                >
                  <span class="dict-audio-icon">🔊</span>
                  <span class="dict-audio-label">朗读</span>
                </button>
              </div>

              <!-- 笔记本状态徽标 -->
              <div v-if="inNotebookInfo" class="dict-badge dict-badge--saved">
                <span>已在词本 · 第 {{ inNotebookInfo.pageId }} 面</span>
              </div>
              <div v-else class="dict-badge dict-badge--unsaved">
                <span>未加入词本</span>
              </div>
            </div>

            <!-- 词性与释义列表：一个词性一行 -->
            <div class="dict-lines-list">
              <div
                v-for="(item, idx) in result.lines"
                :key="idx"
                class="dict-line-item"
              >
                <div class="dict-pos-tag">{{ item.pos }}</div>
                <div class="dict-meaning-text">{{ item.meaning }}</div>
              </div>
            </div>

            <!-- 底部操作按钮：决定是否添加到单词本 -->
            <div class="dict-action-box">
              <button
                v-if="!inNotebookInfo"
                class="dict-btn-add"
                @click="addToNotebook"
              >
                <span class="dict-btn-icon">＋</span>
                <span>添加到单词本</span>
              </button>

              <button
                v-else
                class="dict-btn-jump"
                @click="jumpToTarget"
              >
                <span>✓ 已在第 {{ inNotebookInfo.pageId }} 面（点击前往）</span>
                <span class="dict-btn-arrow">›</span>
              </button>
            </div>
          </div>

          <!-- 未查到结果 -->
          <div v-else-if="searched && (!result || !result.found)" class="dict-state dict-state--empty">
            <span class="dict-empty-icon">🔍</span>
            <span class="dict-state-title">未找到相关释义</span>
            <span class="dict-state-desc">请检查单词拼写是否正确后重试</span>
          </div>

          <!-- 初始引导 -->
          <div v-else class="dict-state dict-state--init">
            <span class="dict-init-icon">💡</span>
            <span class="dict-state-title">快速查词与入库</span>
            <span class="dict-state-desc">输入英文单词查询完整词性与释义，可一键将其收录至单词本。</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, nextTick, inject } from 'vue'
import { queryWord, playWordAudio } from '../utils/dict.js'
import { useNotebookStore } from '../store/notebook.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialWord: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'jumpToWord'])

const store = useNotebookStore()
const showToast = inject('showToast', () => {})

const inputRef = ref(null)
const queryInput = ref('')
const loading = ref(false)
const searched = ref(false)
const result = ref(null)
const isPlayingAudio = ref(false)

// 响应式判断当前查到的词是否已经在单词本中
const inNotebookInfo = computed(() => {
  if (!result.value || !result.value.word) return null
  return store.findWord(result.value.word)
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.initialWord) {
        queryInput.value = props.initialWord
        handleSearch()
      } else if (!result.value) {
        searched.value = false
      }
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
          inputRef.value.select?.()
        }
      })
    }
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

function clearInput() {
  queryInput.value = ''
  if (inputRef.value) inputRef.value.focus()
}

async function handleSearch() {
  const word = queryInput.value.trim()
  if (!word) return

  loading.value = true
  searched.value = true

  try {
    const res = await queryWord(word)
    result.value = res
  } catch (err) {
    showToast(err.message || '查询失败，请检查网络')
    result.value = null
  } finally {
    loading.value = false
  }
}

function playAudio() {
  if (!result.value?.word) return
  isPlayingAudio.value = true
  playWordAudio(result.value.word, 2)
  setTimeout(() => {
    isPlayingAudio.value = false
  }, 1200)
}

function addToNotebook() {
  if (!result.value?.word) return
  const res = store.addWordToNotebook(result.value.word)
  if (res.success) {
    showToast(`已成功添加「${result.value.word}」至第 ${res.pageId} 面 ✓`)
  } else if (res.alreadyExists) {
    showToast(`该单词已在第 ${res.pageId} 面`)
  } else {
    showToast(res.msg || '添加失败')
  }
}

function jumpToTarget() {
  if (!inNotebookInfo.value) return
  const target = inNotebookInfo.value
  close()
  emit('jumpToWord', {
    pageIdx: target.pageIdx,
    slotIdx: target.slotIdx
  })
}
</script>

<style scoped>
/* ── 遮罩层 ─────────────────────────────────────────── */
.dict-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 22, 10, 0.6);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: dictFadeIn 0.2s ease-out;
}

@keyframes dictFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── 弹窗主体（拟物纸张风格） ───────────────────────── */
.dict-modal {
  width: 100%;
  max-width: 440px;
  max-height: 85vh;
  background-color: #fdfbf7;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(44, 36, 22, 0.35), 0 0 0 1px #e2d7c3;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dictSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dictSlideUp {
  from { transform: translateY(20px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

/* ── 顶部栏 ─────────────────────────────────────────── */
.dict-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 12px;
  background-color: #f6eedf;
  border-bottom: 1px solid #e5dac6;
}

.dict-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dict-title-icon {
  font-size: 18px;
}

.dict-title {
  font-size: 16px;
  font-weight: 700;
  color: #4a3818;
  letter-spacing: 0.5px;
}

.dict-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.dict-close-btn:active {
  background: rgba(0, 0, 0, 0.12);
}

.dict-close-icon {
  font-size: 18px;
  color: #7a6850;
  line-height: 1;
}

/* ── 搜索输入栏 ─────────────────────────────────────── */
.dict-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fbf7ee;
  border-bottom: 1px solid #ede4d4;
}

.dict-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #dccfb8;
  border-radius: 10px;
  padding: 0 10px;
  height: 38px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04);
}

.dict-search-icon {
  font-size: 15px;
  color: #a89a80;
  margin-right: 6px;
}

.dict-input {
  flex: 1;
  font-size: 14px;
  color: #2c2416;
  background: transparent;
  border: none;
  outline: none;
}

.dict-input::placeholder {
  color: #baa990;
}

.dict-input-clear {
  padding: 4px;
  cursor: pointer;
}

.dict-clear-icon {
  font-size: 16px;
  color: #a89a80;
}

.dict-query-btn {
  background-color: #7a5c10;
  color: #fff8e8;
  border-radius: 10px;
  padding: 0 14px;
  height: 38px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.dict-query-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dict-query-btn:not(:disabled):active {
  opacity: 0.85;
}

/* ── 结果内容区 ─────────────────────────────────────── */
.dict-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 180px;
  max-height: calc(85vh - 120px);
}

/* ── 状态展示（引导/加载/空） ──────────────────────── */
.dict-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

.dict-init-icon,
.dict-empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.dict-state-title {
  font-size: 15px;
  font-weight: 600;
  color: #5a4625;
  margin-bottom: 6px;
}

.dict-state-desc {
  font-size: 13px;
  color: #9a8870;
  line-height: 1.5;
  max-width: 280px;
}

.dict-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e0d5c1;
  border-top-color: #7a5c10;
  border-radius: 50%;
  animation: dictSpin 0.7s linear infinite;
  margin-bottom: 12px;
}

@keyframes dictSpin {
  to { transform: rotate(360deg); }
}

.dict-state-text {
  font-size: 13px;
  color: #7a6850;
}

/* ── 查词成功展示 ───────────────────────────────────── */
.dict-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dict-word-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ded4c0;
}

.dict-word-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dict-word-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  font-weight: 700;
  color: #2c2416;
  letter-spacing: 0.3px;
}

.dict-audio-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #f0e6d2;
  border: 1px solid #d8caa9;
  border-radius: 14px;
  padding: 3px 8px;
  cursor: pointer;
  transition: transform 0.1s, background-color 0.15s;
}

.dict-audio-btn:active,
.dict-audio-btn--playing {
  background-color: #e2d2b5;
  transform: scale(0.95);
}

.dict-audio-icon {
  font-size: 13px;
}

.dict-audio-label {
  font-size: 11px;
  color: #6a5330;
  font-weight: 600;
}

.dict-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
}

.dict-badge--saved {
  background-color: #e3f2dc;
  color: #2e6918;
  border: 1px solid #c2e2b4;
}

.dict-badge--unsaved {
  background-color: #f7ede2;
  color: #9c5c24;
  border: 1px solid #ebd3bd;
}

/* ── 词性与释义列表：一个词性一行 ───────────────────── */
.dict-lines-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dict-line-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #fbf7ee;
  border: 1px solid #ebdcc5;
  border-radius: 10px;
  padding: 8px 12px;
  line-height: 1.5;
}

.dict-pos-tag {
  flex-shrink: 0;
  background-color: #7a5c10;
  color: #fff8e8;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace, sans-serif;
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.3px;
  margin-top: 1px;
}

.dict-meaning-text {
  font-size: 14px;
  color: #2c2416;
  word-break: break-word;
}

/* ── 底部操作按钮 ───────────────────────────────────── */
.dict-action-box {
  margin-top: 6px;
  padding-top: 10px;
}

.dict-btn-add {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #7a5c10;
  color: #fff8e8;
  padding: 11px 0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 12px rgba(122, 92, 16, 0.25);
  transition: opacity 0.15s, transform 0.1s;
}

.dict-btn-add:active {
  opacity: 0.88;
  transform: scale(0.99);
}

.dict-btn-icon {
  font-size: 16px;
  line-height: 1;
}

.dict-btn-jump {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #eef6eb;
  color: #2b6118;
  border: 1px solid #c2e2b4;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dict-btn-jump:active {
  background-color: #ddead6;
}

.dict-btn-arrow {
  font-size: 16px;
  font-weight: 700;
}
</style>
