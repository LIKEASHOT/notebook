<template>
  <div class="stats-root">
    <!-- 顶部：搜索栏 + 返回 -->
    <div class="stats-search-bar">
      <div class="stats-search-row">
        <div class="back-btn" @click="goBack">
          <span class="back-icon">‹</span>
        </div>
        <div class="stats-search-inner">
          <span class="stats-search-icon">⌕</span>
          <input
            class="stats-search-field"
            v-model="searchText"
            placeholder="搜索单词，找到后跳转到该页..."
            type="search"
            @input="onSearchInput"
            @keydown.enter="handleSearch"
          />
          <div v-if="searchText" class="stats-search-clear" @click="clearSearch">
            <span class="stats-clear-icon">×</span>
          </div>
        </div>
      </div>

      <!-- 候选词下拉框 -->
      <div v-if="searchSuggestions.length > 0" class="stats-suggestions">
        <div
          v-for="(item, i) in searchSuggestions"
          :key="i"
          class="stats-suggestion-item"
          :class="{ 'stats-suggestion-item--last': i === searchSuggestions.length - 1 }"
          @click="selectSuggestion(item)"
        >
          <div class="stats-suggestion-left">
            <span class="stats-suggestion-word">{{ item.word }}</span>
            <div v-if="item.circles > 0" class="stats-suggestion-dots">
              <div v-for="c in Math.min(item.circles, 5)" :key="c" class="stats-suggestion-dot"></div>
              <span v-if="item.circles > 5" class="stats-suggestion-dot-more">+{{ item.circles - 5 }}</span>
            </div>
          </div>
          <span class="stats-suggestion-page">第 {{ item.pageNum }} 页</span>
        </div>
        <div v-if="searchSuggestionsTotal > searchSuggestions.length" class="stats-suggestion-more">
          <span class="stats-suggestion-more-text">还有 {{ searchSuggestionsTotal - searchSuggestions.length }} 个结果，继续输入缩小范围</span>
        </div>
      </div>
    </div>

    <!-- 滚动区域 -->
    <div class="stats-scroll">
      <!-- 统计卡片 -->
      <div class="stats-cards-row">
        <div class="stats-card">
          <span class="stats-card-num">{{ store.totalWords }}</span>
          <span class="stats-card-label">总单词数</span>
        </div>
        <div class="stats-card">
          <span class="stats-card-num">{{ store.pages.length }}</span>
          <span class="stats-card-label">总页数</span>
        </div>
      </div>
      <div class="stats-cards-row stats-cards-row--single">
        <div class="stats-card stats-card--accent">
          <span class="stats-card-num">{{ store.totalCircles }}</span>
          <span class="stats-card-label">总忘记次数</span>
        </div>
      </div>

      <!-- 随机测试按钮 -->
      <div class="stats-quiz-btn" @click="drawQuiz">
        <span class="stats-quiz-btn-icon">🎲</span>
        <span class="stats-quiz-btn-text">随机抽取 15 个单词进行自测</span>
      </div>

      <!-- 有圆圈标记的单词 -->
      <div class="stats-section" v-if="store.allForgotten.length > 0">
        <div class="stats-section-header">
          <span class="stats-section-title">有圆圈标记的单词（{{ store.allForgotten.length }} 个）</span>
        </div>
        <div
          class="stats-forgotten-row"
          v-for="(item, i) in store.allForgotten"
          :key="item.text + '_' + i"
        >
          <span class="stats-rank">{{ i + 1 }}</span>
          <span class="stats-forgotten-word">{{ item.text }}</span>
          <!-- 可点击的圆圈区，点击增加次数，不立即重排序 -->
          <div class="stats-dots-wrap" @click="store.addForgottenCircle(item)">
            <div v-for="c in Math.min(item.circles, 20)" :key="c" class="stats-dot"></div>
            <span v-if="item.circles > 20" class="stats-dot-overflow">+{{ item.circles - 20 }}</span>
          </div>
          <!-- 第几面 -->
          <span class="stats-page-label">第 {{ item.pageId }} 面</span>
        </div>
      </div>

      <div v-if="store.allForgotten.length === 0" class="stats-empty">
        <span class="stats-empty-text">还没有单词添加圆圈标记</span>
      </div>

      <!-- 导出按钮 -->
      <div class="stats-export-btn" @click="exportData">
        <span class="stats-export-icon">💾</span>
        <span class="stats-export-text">导出全部单词数据</span>
      </div>

      <div class="stats-bottom-spacer"></div>
    </div>

    <!-- 随机测试弹窗 -->
    <Teleport to="body">
      <div v-if="showQuiz" class="quiz-overlay" @click.self="closeQuiz">
        <div class="quiz-modal" @click.stop>
          <div class="quiz-header">
            <span class="quiz-title">🎲 随机自测（15 词）</span>
          </div>

          <div class="quiz-list">
            <div
              v-for="(item, i) in quizWords"
              :key="i"
              class="quiz-item"
            >
              <span class="quiz-num">{{ i + 1 }}</span>

              <!-- 圆圈标记区，点击+1，长按-1 -->
              <div
                class="quiz-circles-wrap"
                @click.stop="store.addQuizCircle(item)"
                @contextmenu.prevent="store.removeQuizCircle(item)"
                v-long-press="() => store.removeQuizCircle(item)"
              >
                <template v-if="item.circles > 0">
                  <div v-for="c in Math.min(item.circles, 5)" :key="c" class="quiz-dot"></div>
                  <span v-if="item.circles > 5" class="quiz-dot-overflow">+{{ item.circles - 5 }}</span>
                </template>
                <div v-else class="quiz-dot-empty">
                  <span class="quiz-dot-add-icon">○</span>
                </div>
              </div>

              <span class="quiz-word">{{ item.text }}</span>

              <div class="quiz-page-tag" @click.stop="jumpToPage(item.pageIdx, item.slotIdx)">
                <span class="quiz-page-text">第 {{ item.pageId }} 面 ›</span>
              </div>
            </div>
          </div>

          <div class="quiz-actions">
            <div class="quiz-action-btn quiz-action-btn--primary" @click="drawQuiz">
              <span>重新抽取</span>
            </div>
            <div class="quiz-action-btn quiz-action-btn--close" @click="closeQuiz">
              <span>关闭</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 导出成功弹窗 -->
    <Teleport to="body">
      <div v-if="showExportModal" class="nb-overlay" @click.self="showExportModal = false">
        <div class="export-modal" @click.stop>
          <span class="export-modal-title">导出成功 ✓</span>
          <p class="export-modal-content">单词数据已复制到剪贴板！共 {{ store.totalWords }} 个单词，{{ store.pages.length }} 页。可粘贴到备忘录中。</p>
          <div class="export-modal-btn" @click="showExportModal = false"><span>好的</span></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useNotebookStore } from '../store/notebook.js'
import { inject } from 'vue'

const store = useNotebookStore()
const router = useRouter()
const showToast = inject('showToast')

// 每次进入统计页时都重新读取数据
store.init()

// ── 搜索 ──────────────────────────────────────────────
const searchText = ref('')

const searchSuggestions = computed(() => {
  const query = (searchText.value || '').trim().toLowerCase()
  if (!query) return []
  const results = []
  for (let pi = 0; pi < store.pages.length; pi++) {
    for (let si = 0; si < 16; si++) {
      const w = store.pages[pi]?.words[si]
      if (w && w.text && w.text.toLowerCase().includes(query)) {
        results.push({
          word: w.text, pageIdx: pi, slotIdx: si,
          pageNum: store.pages[pi].id, circles: w.circles || 0
        })
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
  showToast('未找到该单词')
}

function selectSuggestion(item) {
  store.searchTarget = { pageIdx: item.pageIdx, slotIdx: item.slotIdx }
  searchText.value = ''
  router.push('/')
}

function clearSearch() {
  searchText.value = ''
}

// ── 随机测试 ─────────────────────────────────────────
const showQuiz = ref(false)
const quizWords = ref([])

function drawQuiz() {
  const allWords = []
  store.pages.forEach((p, pageIdx) => {
    p.words.forEach((w, slotIdx) => {
      if (w.text) {
        allWords.push({ text: w.text, pageIdx, slotIdx, pageId: p.id, circles: w.circles || 0 })
      }
    })
  })
  if (allWords.length === 0) {
    showToast('单词本尚无单词')
    return
  }
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]]
  }
  const count = Math.min(15, allWords.length)
  quizWords.value = allWords.slice(0, count)
  showQuiz.value = true
}

function closeQuiz() {
  showQuiz.value = false
  quizWords.value = []
}

function jumpToPage(pageIdx, slotIdx) {
  store.searchTarget = { pageIdx, slotIdx }
  closeQuiz()
  router.push('/')
}

// ── 导出 ─────────────────────────────────────────────
const showExportModal = ref(false)

function exportData() {
  if (store.pages.length === 0) {
    showToast('尚无数据可导出')
    return
  }
  let lines = []
  lines.push('===== 单词本数据导出 =====')
  lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(`总页数：${store.pages.length}，总单词数：${store.totalWords}`)
  lines.push('')
  store.pages.forEach(p => {
    const words = p.words.filter(w => w.text)
    if (words.length === 0) return
    lines.push(`——— 第 ${p.id} 面（${words.length}/16 个单词）———`)
    words.forEach(w => {
      const dots = w.circles > 0
        ? ' ' + '●'.repeat(Math.min(w.circles, 10)) + (w.circles > 10 ? `+${w.circles - 10}` : '')
        : ''
      lines.push(`  ${w.text}${dots}`)
    })
    lines.push('')
  })
  const content = lines.join('\n')
  navigator.clipboard.writeText(content).then(() => {
    showExportModal.value = true
  }).catch(() => {
    showToast('复制失败，请重试')
  })
}

// ── 导航 ─────────────────────────────────────────────
function goBack() {
  router.push('/')
}

// ── 自定义长按指令 ────────────────────────────────────
const vLongPress = {
  mounted(el, binding) {
    let timer = null
    const start = () => { timer = setTimeout(() => binding.value(), 500) }
    const cancel = () => clearTimeout(timer)
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchmove', cancel)
    el.addEventListener('mousedown', start)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el._cleanup = () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchend', cancel)
      el.removeEventListener('touchmove', cancel)
      el.removeEventListener('mousedown', start)
      el.removeEventListener('mouseup', cancel)
      el.removeEventListener('mouseleave', cancel)
    }
  },
  unmounted(el) { el._cleanup?.() }
}
</script>

<style scoped>
.stats-root {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: #f0ebe0;
  max-width: 480px;
  margin: 0 auto;
}

/* ── 搜索栏 ───────────────── */
.stats-search-bar {
  padding: 10px 14px;
  background-color: #e6e0d3;
  border-bottom: 1px solid #cfc5ae;
  flex-shrink: 0;
  position: relative;
  z-index: 50;
}
.stats-search-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #fdfbf6;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid #ddd5c0;
}
.back-btn:active { background: #f0ebe0; }
.back-icon { font-size: 26px; color: #7a5c10; line-height: 1; font-weight: 300; }
.stats-search-inner {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #fdfbf6;
  border-radius: 12px;
  padding: 0 12px;
  gap: 8px;
  border: 1px solid #ddd5c0;
}
.stats-search-icon { font-size: 22px; color: #9b8f7a; }
.stats-search-field {
  flex: 1;
  padding: 10px 0;
  font-size: 15px;
  color: #2c2416;
  background: transparent;
  border: none;
  outline: none;
  -webkit-appearance: none;
}
.stats-search-field::placeholder { color: #b8a98a; }
.stats-search-clear { padding: 6px; cursor: pointer; }
.stats-clear-icon { font-size: 20px; color: #9b8f7a; }

/* ── 候选词 ───────────────── */
.stats-suggestions {
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
.stats-suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0ebe0;
  cursor: pointer;
}
.stats-suggestion-item:active { background: #f4efe4; }
.stats-suggestion-item--last { border-bottom: none; }
.stats-suggestion-left { display: flex; align-items: center; gap: 8px; }
.stats-suggestion-word { font-size: 15px; color: #2c2416; font-family: Georgia, serif; }
.stats-suggestion-dots { display: flex; align-items: center; gap: 3px; }
.stats-suggestion-dot { width: 7px; height: 7px; border-radius: 50%; background-color: #c0392b; }
.stats-suggestion-dot-more { font-size: 11px; color: #c0392b; }
.stats-suggestion-page { font-size: 12px; color: #9b8f7a; }
.stats-suggestion-more { padding: 10px 16px; background-color: #f8f4ec; }
.stats-suggestion-more-text { font-size: 12px; color: #b8a98a; font-style: italic; }

/* ── 滚动区域 ─────────────── */
.stats-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.stats-bottom-spacer { height: 32px; }

/* ── 统计卡片 ─────────────── */
.stats-cards-row {
  display: flex;
  gap: 14px;
  padding: 16px 16px 0;
}
.stats-cards-row--single { padding-top: 12px; }
.stats-card {
  flex: 1;
  background: linear-gradient(135deg, #fdfbf6 0%, #f8f4ec 100%);
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(44, 36, 22, 0.08);
  border: 1px solid #e8dfc8;
}
.stats-card--accent {
  background: linear-gradient(135deg, #7a5c10 0%, #a07820 100%);
  border-color: #7a5c10;
}
.stats-card-num {
  font-size: 34px;
  font-weight: 700;
  color: #2c2416;
  line-height: 1;
}
.stats-card--accent .stats-card-num { color: #fff8e8; }
.stats-card-label { font-size: 13px; color: #8b7355; }
.stats-card--accent .stats-card-label { color: rgba(255, 248, 232, 0.8); }

/* ── 随机测试按钮 ─────────── */
.stats-quiz-btn {
  margin: 16px 16px 0;
  background-color: #7a5c10;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(122, 92, 16, 0.3);
  cursor: pointer;
  user-select: none;
}
.stats-quiz-btn:active { opacity: 0.85; }
.stats-quiz-btn-icon { font-size: 28px; }
.stats-quiz-btn-text { font-size: 16px; color: #fff8e8; font-weight: 600; }

/* ── 忘记单词列表 ─────────── */
.stats-section {
  margin: 16px 16px 0;
  background: #fdfbf6;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e8dfc8;
}
.stats-section-header {
  padding: 14px 18px 10px;
  border-bottom: 1px solid #f0ebe0;
  background: #f8f4ec;
}
.stats-section-title { font-size: 14px; font-weight: 600; color: #5a4a36; }
.stats-forgotten-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0ebe0;
  gap: 10px;
}
.stats-forgotten-row:last-child { border-bottom: none; }
.stats-rank { font-size: 12px; color: #b8a98a; width: 20px; text-align: center; flex-shrink: 0; }
.stats-forgotten-word {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 16px;
  color: #2c2416;
  min-width: 120px;
  flex-shrink: 0;
}
.stats-dots-wrap {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background-color 0.15s;
}
.stats-dots-wrap:active { opacity: 0.7; background: #f0ebe0; }
.stats-dot { width: 9px; height: 9px; border-radius: 50%; background-color: #c0392b; }
.stats-dot-overflow { font-size: 12px; color: #c0392b; }
.stats-page-label {
  font-size: 12px;
  color: #9b8f7a;
  flex-shrink: 0;
  background-color: #f0ebe0;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ── 空状态 ───────────────── */
.stats-empty {
  margin: 20px 16px 0;
  padding: 40px 20px;
  text-align: center;
  background: #fdfbf6;
  border-radius: 14px;
  border: 1px solid #e8dfc8;
}
.stats-empty-text { font-size: 15px; color: #b8a98a; font-style: italic; }

/* ── 导出按钮 ─────────────── */
.stats-export-btn {
  margin: 16px 16px 0;
  background-color: #3d6b5e;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(61, 107, 94, 0.28);
  cursor: pointer;
  user-select: none;
}
.stats-export-btn:active { opacity: 0.85; }
.stats-export-icon { font-size: 26px; }
.stats-export-text { font-size: 16px; color: #e8f5f0; font-weight: 600; }

/* ── 测试弹窗 ─────────────── */
.quiz-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(30, 22, 10, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.quiz-modal {
  background-color: #fdfbf6;
  border-radius: 20px;
  width: min(420px, 92vw);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.3);
}
.quiz-header {
  padding: 20px 24px 14px;
  border-bottom: 1px solid #ede6d8;
  background-color: #f8f4ec;
}
.quiz-title { font-size: 18px; color: #2c2416; font-weight: 700; }
.quiz-list { flex: 1; overflow-y: auto; }
.quiz-item {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f0ebe0;
  gap: 12px;
}
.quiz-item:last-child { border-bottom: none; }
.quiz-num { font-size: 13px; color: #c4b49a; width: 22px; text-align: center; flex-shrink: 0; }
.quiz-circles-wrap {
  min-width: 44px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  padding: 5px 8px;
  background-color: #f4efe4;
  border-radius: 14px;
  cursor: pointer;
}
.quiz-circles-wrap:active { opacity: 0.7; }
.quiz-dot { width: 9px; height: 9px; border-radius: 50%; background-color: #c0392b; flex-shrink: 0; }
.quiz-dot-overflow { font-size: 11px; color: #c0392b; font-weight: 600; }
.quiz-dot-add-icon { font-size: 14px; color: #b8a98a; }
.quiz-word { flex: 1; font-family: Georgia, serif; font-size: 17px; color: #2c2416; font-weight: 500; }
.quiz-page-tag {
  background-color: #f0ebe0;
  padding: 4px 10px;
  border-radius: 14px;
  flex-shrink: 0;
  cursor: pointer;
}
.quiz-page-tag:active { background: #e6e0d3; }
.quiz-page-text { font-size: 13px; color: #8b7355; font-weight: 500; }
.quiz-actions {
  display: flex;
  padding: 14px 18px;
  gap: 12px;
  border-top: 1px solid #ede6d8;
  background-color: #f8f4ec;
}
.quiz-action-btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 30px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  font-size: 15px;
  font-weight: 500;
}
.quiz-action-btn--primary { background-color: #7a5c10; color: #fff8e8; }
.quiz-action-btn--primary:active { opacity: 0.8; }
.quiz-action-btn--close { border: 1.5px solid #e0c8c8; color: #9b7070; }
.quiz-action-btn--close:active { background: #f8f0f0; }

/* ── 导出成功弹窗 ─────────── */
.nb-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(30, 22, 10, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.export-modal {
  background: #fdfbf6;
  border-radius: 18px;
  width: min(320px, 88vw);
  padding: 28px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}
.export-modal-title { font-size: 18px; font-weight: 700; color: #2c6e49; }
.export-modal-content { font-size: 14px; color: #5a4a36; text-align: center; margin: 0; line-height: 1.6; }
.export-modal-btn {
  background: #3d6b5e;
  color: #e8f5f0;
  padding: 12px 40px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.export-modal-btn:active { opacity: 0.8; }
</style>
