<template>
  <div class="nb-root">
    <!-- 搜索栏 -->
    <div class="nb-search-bar">
      <div class="nb-search-row">
        <div class="nb-search-inner">
          <span class="nb-search-icon">⌕</span>
          <input
            class="nb-search-field"
            v-model="searchText"
            placeholder="搜索单词..."
            type="search"
            @input="onSearchInput"
            @keydown.enter="handleSearch"
          />
          <div v-if="searchText" class="nb-search-clear" @click="clearSearch">
            <span class="nb-clear-icon">×</span>
          </div>
        </div>
        <div class="nb-stats-btn" @click="goToStats">
          <span class="nb-stats-btn-text">统计</span>
        </div>
      </div>

      <!-- 候选词下拉框 -->
      <div v-if="searchSuggestions.length > 0" class="nb-suggestions">
        <div
          v-for="(item, i) in searchSuggestions"
          :key="i"
          class="nb-suggestion-item"
          :class="{ 'nb-suggestion-item--last': i === searchSuggestions.length - 1 }"
          @click="selectSuggestion(item)"
        >
          <div class="nb-suggestion-left">
            <span class="nb-suggestion-word">{{ item.word }}</span>
            <div v-if="item.circles > 0" class="nb-suggestion-dots">
              <div v-for="c in Math.min(item.circles, 5)" :key="c" class="nb-suggestion-dot"></div>
              <span v-if="item.circles > 5" class="nb-suggestion-dot-more">+{{ item.circles - 5 }}</span>
            </div>
          </div>
          <span class="nb-suggestion-page">第 {{ item.pageNum }} 页</span>
        </div>
        <div v-if="searchSuggestionsTotal > searchSuggestions.length" class="nb-suggestion-more">
          <span class="nb-suggestion-more-text">还有 {{ searchSuggestionsTotal - searchSuggestions.length }} 个结果，继续输入缩小范围</span>
        </div>
      </div>
    </div>

    <!-- 页码信息 -->
    <div class="nb-info-bar">
      <span class="nb-info-text">
        第 {{ currentPage + 1 }} 页 · 共 {{ store.pages.length }} 页 · {{ store.totalWords }} 个单词
      </span>
    </div>

    <!-- 单词本翻页（用 CSS scroll-snap 代替 swiper） -->
    <div class="nb-swiper-wrap" ref="swiperWrap" @scroll.passive="onScroll">
      <div
        class="nb-swiper-inner"
        :style="{ width: store.pages.length * 100 + 'vw' }"
      >
        <div
          v-for="(page, pageIdx) in store.pages"
          :key="page.id"
          class="nb-swiper-page"
        >
          <div class="nb-paper">
            <!-- 纸张顶部分割线 -->
            <div class="nb-paper-top-rule"></div>

            <!-- 16 个单词格 -->
            <div
              v-for="slotIdx in 16"
              :key="slotIdx"
              class="nb-word-row"
              :class="{ 'nb-word-row--highlight': isHighlighted(pageIdx, slotIdx - 1) }"
            >
              <!-- 左侧圆圈区（点击+1，长按-1） -->
              <div
                class="nb-circles-wrap"
                @click="addCircle(pageIdx, slotIdx - 1)"
                @contextmenu.prevent="removeCircle(pageIdx, slotIdx - 1)"
                v-long-press="() => removeCircle(pageIdx, slotIdx - 1)"
              >
                <div
                  v-for="c in getCircles(pageIdx, slotIdx - 1)"
                  :key="c"
                  class="nb-dot"
                ></div>
                <div v-if="getCircles(pageIdx, slotIdx - 1) === 0" class="nb-dot-placeholder"></div>
              </div>

              <!-- 右侧单词区 -->
              <div class="nb-word-area">
                <!-- 已有单词：点击弹菜单 -->
                <span
                  v-if="getWord(pageIdx, slotIdx - 1)"
                  class="nb-word-text"
                  @click="showWordMenu(pageIdx, slotIdx - 1)"
                >{{ getWord(pageIdx, slotIdx - 1) }}</span>

                <!-- 空格：点击后显示输入框 -->
                <div v-else class="nb-empty-slot" @click="activateSlot(pageIdx, slotIdx - 1)">
                  <input
                    v-if="isActiveSlot(pageIdx, slotIdx - 1)"
                    class="nb-inline-input"
                    ref="activeInput"
                    autofocus
                    placeholder="输入单词..."
                    @keydown.enter="(e) => confirmWord(pageIdx, slotIdx - 1, e.target.value)"
                    @blur="(e) => onBlur(pageIdx, slotIdx - 1, e.target.value)"
                  />
                  <span v-else class="nb-slot-mark">·</span>
                </div>
              </div>
            </div>

            <!-- 纸张底部：页码 -->
            <div class="nb-paper-footer">
              <span class="nb-paper-num">— {{ page.id }} —</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="nb-bottom-bar">
      <div class="nb-last-btn" @click="goToLastPage">
        <span class="nb-last-btn-text">末页</span>
      </div>
      <div class="nb-add-btn" @click="addNewPage">
        <span class="nb-add-btn-text">＋ 新增一页</span>
      </div>
    </div>

    <!-- 编辑单词弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="nb-overlay" @click.self="cancelEdit">
        <div class="nb-modal" @click.stop>
          <span class="nb-modal-title">编辑单词</span>
          <input
            class="nb-modal-input"
            v-model="editingValue"
            ref="editInput"
            placeholder="输入新的单词"
            @keydown.enter="confirmEdit"
          />
          <div class="nb-modal-actions">
            <div class="nb-btn-cancel" @click="cancelEdit"><span>取消</span></div>
            <div class="nb-btn-confirm" @click="confirmEdit"><span>确认</span></div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="nb-overlay" @click.self="cancelDelete">
        <div class="nb-modal" @click.stop>
          <span class="nb-modal-title">确认删除</span>
          <p class="nb-modal-content">确定删除「{{ deletingWord }}」吗？</p>
          <div class="nb-modal-actions">
            <div class="nb-btn-cancel" @click="cancelDelete"><span>取消</span></div>
            <div class="nb-btn-delete" @click="confirmDelete"><span>删除</span></div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑/删除选择弹窗 -->
    <Teleport to="body">
      <div v-if="showActionSheet" class="nb-overlay" @click.self="closeActionSheet">
        <div class="nb-action-sheet" @click.stop>
          <div class="nb-action-item" @click="doEdit">编辑单词</div>
          <div class="nb-action-item nb-action-item--danger" @click="doDelete">删除单词</div>
          <div class="nb-action-cancel" @click="closeActionSheet">取消</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotebookStore } from '../store/notebook.js'
import { inject } from 'vue'

const store = useNotebookStore()
const router = useRouter()
const showToast = inject('showToast')

// ── 状态 ──────────────────────────────────────────────
const swiperWrap = ref(null)
const currentPage = ref(0)
const activeSlot = ref(null) // { pageIdx, slotIdx }
const activeInput = ref(null)
const searchText = ref('')
const highlightedSlot = ref(null)
let highlightTimer = null

// 弹窗状态
const showActionSheet = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editInput = ref(null)
const editingSlot = ref(null)
const editingValue = ref('')
const deletingSlot = ref(null)
const deletingWord = ref('')

// ── 初始化 ──────────────────────────────────────────
onMounted(() => {
  store.init()
  // 检查是否有从统计页传回的跳转目标
  nextTick(() => {
    currentPage.value = Math.max(0, store.pages.length - 1)
    scrollToPage(currentPage.value, 'instant')

    if (store.searchTarget) {
      const target = store.searchTarget
      store.searchTarget = null
      currentPage.value = target.pageIdx
      scrollToPage(target.pageIdx, 'instant')
      setTimeout(() => {
        highlightedSlot.value = { pageIdx: target.pageIdx, slotIdx: target.slotIdx }
        clearTimeout(highlightTimer)
        highlightTimer = setTimeout(() => { highlightedSlot.value = null }, 2500)
      }, 300)
    }
  })
})

// ── 自定义长按指令 ─────────────────────────────────
const vLongPress = {
  mounted(el, binding) {
    let timer = null
    const start = (e) => {
      if (e.type === 'mousedown') e.preventDefault()
      timer = setTimeout(() => binding.value(e), 500)
    }
    const cancel = () => clearTimeout(timer)
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchmove', cancel)
    el.addEventListener('mousedown', start)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el._longPressCleanup = () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchend', cancel)
      el.removeEventListener('touchmove', cancel)
      el.removeEventListener('mousedown', start)
      el.removeEventListener('mouseup', cancel)
      el.removeEventListener('mouseleave', cancel)
    }
  },
  unmounted(el) { el._longPressCleanup?.() }
}

// ── 翻页逻辑 ──────────────────────────────────────
function scrollToPage(idx, behavior = 'smooth') {
  if (!swiperWrap.value) return
  const w = swiperWrap.value.offsetWidth
  swiperWrap.value.scrollTo({ left: idx * w, behavior })
}

function onScroll() {
  if (!swiperWrap.value) return
  const w = swiperWrap.value.offsetWidth
  const idx = Math.round(swiperWrap.value.scrollLeft / w)
  if (idx !== currentPage.value) {
    currentPage.value = idx
    activeSlot.value = null
  }
}

watch(currentPage, (newVal) => {
  scrollToPage(newVal)
})

// ── 数据读取 ─────────────────────────────────────
function getWord(pageIdx, slotIdx) {
  return store.pages[pageIdx]?.words[slotIdx]?.text || ''
}
function getCircles(pageIdx, slotIdx) {
  return store.pages[pageIdx]?.words[slotIdx]?.circles || 0
}
function isActiveSlot(pageIdx, slotIdx) {
  return activeSlot.value?.pageIdx === pageIdx && activeSlot.value?.slotIdx === slotIdx
}
function isHighlighted(pageIdx, slotIdx) {
  return highlightedSlot.value?.pageIdx === pageIdx && highlightedSlot.value?.slotIdx === slotIdx
}

// ── 单词输入 ─────────────────────────────────────
function activateSlot(pageIdx, slotIdx) {
  if (getWord(pageIdx, slotIdx)) return
  activeSlot.value = { pageIdx, slotIdx }
  nextTick(() => {
    const inputs = document.querySelectorAll('.nb-inline-input')
    if (inputs.length) inputs[inputs.length - 1].focus()
  })
}

function onBlur(pageIdx, slotIdx, value) {
  if (activeSlot.value?.pageIdx === pageIdx && activeSlot.value?.slotIdx === slotIdx) {
    const trimmed = (value || '').trim()
    if (trimmed) store.setWord(pageIdx, slotIdx, trimmed)
    activeSlot.value = null
  }
}

function confirmWord(pageIdx, slotIdx, value) {
  const trimmed = (value || '').trim()
  if (trimmed) store.setWord(pageIdx, slotIdx, trimmed)
  activeSlot.value = null
}

// ── 圆圈操作 ─────────────────────────────────────
function addCircle(pageIdx, slotIdx) {
  if (!getWord(pageIdx, slotIdx)) return
  store.addCircle(pageIdx, slotIdx)
}
function removeCircle(pageIdx, slotIdx) {
  store.removeCircle(pageIdx, slotIdx)
}

// ── 单词菜单 ─────────────────────────────────────
const menuSlot = ref(null)

function showWordMenu(pageIdx, slotIdx) {
  menuSlot.value = { pageIdx, slotIdx }
  showActionSheet.value = true
}
function closeActionSheet() {
  showActionSheet.value = false
}
function doEdit() {
  showActionSheet.value = false
  const { pageIdx, slotIdx } = menuSlot.value
  editingSlot.value = { pageIdx, slotIdx }
  editingValue.value = getWord(pageIdx, slotIdx)
  showEditModal.value = true
  nextTick(() => editInput.value?.focus())
}
function doDelete() {
  showActionSheet.value = false
  const { pageIdx, slotIdx } = menuSlot.value
  deletingSlot.value = { pageIdx, slotIdx }
  deletingWord.value = getWord(pageIdx, slotIdx)
  showDeleteModal.value = true
}
function confirmEdit() {
  const trimmed = (editingValue.value || '').trim()
  if (trimmed && editingSlot.value) {
    const { pageIdx, slotIdx } = editingSlot.value
    store.setWord(pageIdx, slotIdx, trimmed)
  }
  closeEdit()
}
function cancelEdit() { closeEdit() }
function closeEdit() {
  showEditModal.value = false
  editingSlot.value = null
  editingValue.value = ''
}
function confirmDelete() {
  if (deletingSlot.value) {
    const { pageIdx, slotIdx } = deletingSlot.value
    store.deleteWord(pageIdx, slotIdx)
  }
  cancelDelete()
}
function cancelDelete() {
  showDeleteModal.value = false
  deletingSlot.value = null
  deletingWord.value = ''
}

// ── 翻页操作 ─────────────────────────────────────
function addNewPage() {
  store.addNewPage()
  nextTick(() => {
    currentPage.value = store.pages.length - 1
  })
}
function goToLastPage() {
  currentPage.value = Math.max(0, store.pages.length - 1)
}

// ── 搜索 ─────────────────────────────────────────
const searchSuggestions = computed(() => {
  const query = (searchText.value || '').trim().toLowerCase()
  if (!query) return []
  const results = []
  for (let pi = 0; pi < store.pages.length; pi++) {
    for (let si = 0; si < 16; si++) {
      const w = store.pages[pi]?.words[si]
      if (w && w.text && w.text.toLowerCase().includes(query)) {
        results.push({ word: w.text, pageIdx: pi, slotIdx: si, pageNum: store.pages[pi].id, circles: w.circles || 0 })
        if (results.length >= 8) return results
      }
    }
  }
  return results
})

const searchSuggestionsTotal = computed(() => {
  const query = (searchText.value || '').trim().toLowerCase()
  if (!query) return 0
  let count = 0
  for (let pi = 0; pi < store.pages.length; pi++) {
    for (let si = 0; si < 16; si++) {
      const w = store.pages[pi]?.words[si]
      if (w && w.text && w.text.toLowerCase().includes(query)) count++
    }
  }
  return count
})

function onSearchInput() {}

function handleSearch() {
  if (searchSuggestions.value.length > 0) {
    selectSuggestion(searchSuggestions.value[0])
    return
  }
  const query = (searchText.value || '').trim()
  if (!query) return
  showToast('未找到该单词')
}

function selectSuggestion(item) {
  currentPage.value = item.pageIdx
  highlightedSlot.value = { pageIdx: item.pageIdx, slotIdx: item.slotIdx }
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => { highlightedSlot.value = null }, 2500)
  searchText.value = ''
}

function clearSearch() {
  searchText.value = ''
  highlightedSlot.value = null
}

// ── 导航 ─────────────────────────────────────────
function goToStats() {
  router.push('/stats')
}
</script>

<style scoped>
/* ── 根容器 ─────────────────────────────────────────── */
.nb-root {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: #f0ebe0;
  overflow: hidden;
  max-width: 480px;
  margin: 0 auto;
}

/* ── 搜索栏 ─────────────────────────────────────────── */
.nb-search-bar {
  position: relative;
  background-color: #e6e0d3;
  border-bottom: 1px solid #cfc5ae;
  flex-shrink: 0;
  z-index: 50;
}
.nb-search-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 10px;
}
.nb-search-inner {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #fdfbf6;
  border-radius: 12px;
  padding: 0 12px;
  gap: 8px;
  box-shadow: 0 1px 4px rgba(44, 36, 22, 0.08);
  border: 1px solid #ddd5c0;
}
.nb-search-icon {
  font-size: 22px;
  color: #9b8f7a;
  flex-shrink: 0;
}
.nb-search-field {
  flex: 1;
  padding: 10px 0;
  font-size: 15px;
  color: #2c2416;
  background: transparent;
  border: none;
  outline: none;
  -webkit-appearance: none;
}
.nb-search-field::placeholder { color: #b8a98a; }
.nb-search-clear {
  padding: 6px;
  cursor: pointer;
}
.nb-clear-icon { font-size: 20px; color: #9b8f7a; }
.nb-stats-btn {
  background-color: #7a5c10;
  border-radius: 20px;
  padding: 8px 18px;
  cursor: pointer;
  user-select: none;
}
.nb-stats-btn:active { opacity: 0.8; }
.nb-stats-btn-text { color: #fff8e8; font-size: 14px; font-weight: 600; }

/* ── 候选词 ─────────────────────────────────────────── */
.nb-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fdfbf6;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  box-shadow: 0 8px 28px rgba(44, 36, 22, 0.18);
  z-index: 100;
  overflow: hidden;
  border: 1px solid #e4d9c5;
  border-top: none;
}
.nb-suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0ebe0;
  cursor: pointer;
  transition: background-color 0.12s;
}
.nb-suggestion-item:active { background-color: #f4efe4; }
.nb-suggestion-item--last { border-bottom: none; }
.nb-suggestion-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nb-suggestion-word {
  font-size: 15px;
  color: #2c2416;
  font-family: Georgia, serif;
}
.nb-suggestion-dots {
  display: flex;
  align-items: center;
  gap: 3px;
}
.nb-suggestion-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #c0392b;
}
.nb-suggestion-dot-more { font-size: 11px; color: #c0392b; }
.nb-suggestion-page { font-size: 12px; color: #9b8f7a; }
.nb-suggestion-more {
  padding: 10px 16px;
  background-color: #f8f4ec;
  border-top: 1px solid #f0ebe0;
}
.nb-suggestion-more-text { font-size: 12px; color: #b8a98a; font-style: italic; }

/* ── 页码信息栏 ─────────────────────────────────────── */
.nb-info-bar {
  background-color: #e6e0d3;
  padding: 5px 16px 6px;
  border-bottom: 1px solid #cfc5ae;
  flex-shrink: 0;
}
.nb-info-text {
  font-size: 12px;
  color: #8b7355;
  letter-spacing: 0.3px;
}

/* ── 翻页主体 ────────────────────────────────────────── */
.nb-swiper-wrap {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.nb-swiper-wrap::-webkit-scrollbar { display: none; }
.nb-swiper-inner {
  display: flex;
  height: 100%;
}
.nb-swiper-page {
  width: 100vw;
  max-width: 480px;
  flex-shrink: 0;
  height: 100%;
  scroll-snap-align: start;
  overflow-y: auto;
  padding: 10px 12px;
}

/* ── 纸张 ───────────────────────────────────────────── */
.nb-paper {
  background: linear-gradient(180deg, #fdfbf6 0%, #f8f4ec 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(44, 36, 22, 0.10), 0 0 0 1px rgba(200, 185, 155, 0.5);
  overflow: hidden;
  min-height: calc(100% - 0px);
}
.nb-paper-top-rule {
  height: 3px;
  background: linear-gradient(90deg, #e8c97a 0%, #c4922a 50%, #e8c97a 100%);
  margin-bottom: 2px;
}
.nb-paper-footer {
  padding: 8px 0 10px;
  text-align: center;
}
.nb-paper-num { font-size: 13px; color: #c4b49a; letter-spacing: 2px; }

/* ── 单词行 ─────────────────────────────────────────── */
.nb-word-row {
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-bottom: 1px solid #f0ebe0;
  min-height: 42px;
  transition: background-color 0.3s;
}
.nb-word-row--highlight {
  background-color: #fef9e0;
  animation: highlightPulse 2.5s ease-out forwards;
}
@keyframes highlightPulse {
  0% { background-color: #fde68a; }
  60% { background-color: #fef9e0; }
  100% { background-color: transparent; }
}

/* ── 圆圈区 ─────────────────────────────────────────── */
.nb-circles-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  width: 52px;
  min-height: 32px;
  flex-shrink: 0;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.15s;
}
.nb-circles-wrap:active { background-color: #f0ebe0; }
.nb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #c0392b;
}
.nb-dot-placeholder {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px dashed #cfc5ae;
}

/* ── 单词区 ─────────────────────────────────────────── */
.nb-word-area {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 42px;
}
.nb-word-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 16px;
  color: #2c2416;
  cursor: pointer;
  padding: 4px 0;
  display: block;
  width: 100%;
  letter-spacing: 0.3px;
  user-select: none;
}
.nb-word-text:active { opacity: 0.7; }
.nb-empty-slot {
  flex: 1;
  min-height: 42px;
  display: flex;
  align-items: center;
  cursor: text;
}
.nb-slot-mark {
  font-size: 20px;
  color: #cfc5ae;
}
.nb-inline-input {
  flex: 1;
  width: 100%;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 16px;
  color: #2c2416;
  padding: 8px 0;
  border-bottom: 1.5px solid #7a5c10 !important;
  outline: none;
  background: transparent;
}

/* ── 底部操作栏 ─────────────────────────────────────── */
.nb-bottom-bar {
  padding: 10px 18px;
  background-color: #e6e0d3;
  border-top: 1px solid #cfc5ae;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
}
.nb-last-btn {
  background-color: #a08050;
  border-radius: 30px;
  padding: 11px 28px;
  cursor: pointer;
  user-select: none;
}
.nb-last-btn:active { opacity: 0.8; }
.nb-last-btn-text { color: #fff8e8; font-size: 15px; font-weight: 600; }
.nb-add-btn {
  background-color: #7a5c10;
  border-radius: 30px;
  padding: 11px 40px;
  cursor: pointer;
  user-select: none;
}
.nb-add-btn:active { opacity: 0.8; }
.nb-add-btn-text { color: #fff8e8; font-size: 15px; font-weight: 600; }

/* ── 弹窗通用 ───────────────────────────────────────── */
.nb-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(30, 22, 10, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.nb-modal {
  background-color: #fdfbf6;
  border-radius: 18px;
  width: min(340px, 90vw);
  padding: 26px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
}
.nb-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #2c2416;
  text-align: center;
}
.nb-modal-content {
  font-size: 15px;
  color: #5a4a36;
  text-align: center;
  margin: 0;
}
.nb-modal-input {
  width: 100%;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 17px;
  color: #2c2416;
  padding: 10px 14px;
  border: 1.5px solid #cfc5ae;
  border-radius: 10px;
  background: #f8f4ec;
  outline: none;
  box-sizing: border-box;
}
.nb-modal-input:focus { border-color: #7a5c10; }
.nb-modal-actions {
  display: flex;
  gap: 10px;
}
.nb-btn-cancel, .nb-btn-confirm, .nb-btn-delete {
  flex: 1;
  padding: 12px 0;
  border-radius: 30px;
  text-align: center;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  user-select: none;
}
.nb-btn-cancel { border: 1.5px solid #cfc5ae; color: #8b7355; }
.nb-btn-cancel:active { background: #f0ebe0; }
.nb-btn-confirm { background-color: #7a5c10; color: #fff8e8; }
.nb-btn-confirm:active { opacity: 0.8; }
.nb-btn-delete { background-color: #c0392b; color: #fff; }
.nb-btn-delete:active { opacity: 0.8; }

/* ── 动作选择菜单（action sheet） ───────────────────── */
.nb-action-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fdfbf6;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  overflow: hidden;
  box-shadow: 0 -4px 28px rgba(0,0,0,0.15);
  max-width: 480px;
  margin: 0 auto;
}
.nb-action-item {
  padding: 18px 24px;
  font-size: 16px;
  color: #2c2416;
  text-align: center;
  border-bottom: 1px solid #f0ebe0;
  cursor: pointer;
  user-select: none;
}
.nb-action-item:active { background: #f4efe4; }
.nb-action-item--danger { color: #c0392b; }
.nb-action-cancel {
  padding: 18px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #8b7355;
  text-align: center;
  background: #f4efe4;
  cursor: pointer;
  user-select: none;
}
.nb-action-cancel:active { opacity: 0.8; }
</style>
