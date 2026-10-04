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
            type="text"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @input="onSearchInput"
            @keydown.enter="handleSearch"
          />
          <div v-if="searchText" class="stats-search-clear" @click="clearSearch">
            <span class="stats-clear-icon">×</span>
          </div>
        </div>
        <div class="stats-dict-btn" @click="openDictModal('')">
          <span class="stats-dict-btn-text">查词</span>
        </div>
      </div>

      <!-- 候选词下拉框 -->
      <div v-if="searchSuggestions.length > 0" class="stats-suggestions">
        <div
          v-for="(item, i) in searchSuggestions"
          :key="i"
          class="stats-suggestion-item"
          :class="{ 'stats-suggestion-item--last': i === searchSuggestions.length - 1 }"
          @mousedown.prevent="selectSuggestion(item)"
          @touchstart.prevent="selectSuggestion(item)"
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

      <!-- ── 多设备云端同步 ── -->
      <div class="stats-sync-card">
        <div class="stats-sync-header">
          <div class="stats-sync-title-wrap">
            <span class="stats-sync-title">多设备云端同步</span>
            <span class="stats-sync-mode-tag">{{ syncState.mode === 'github_gist' ? 'GitHub Gist' : 'Vercel KV' }}</span>
          </div>
          <div class="stats-sync-badge" :class="'stats-sync-badge--' + syncState.status">
            <span class="stats-sync-badge-dot"></span>
            <span class="stats-sync-badge-text">{{ syncStatusText }}</span>
          </div>
        </div>

        <div class="stats-sync-info-row">
          <span class="stats-sync-info-text">{{ syncState.message }}</span>
        </div>

        <div class="stats-sync-actions">
          <button class="stats-sync-btn stats-sync-btn--primary" :disabled="isSyncing" @click="handleManualPush">
            <span>{{ isPushing ? '正在上传...' : '☁️ 立即同步至云端' }}</span>
          </button>
          <button class="stats-sync-btn stats-sync-btn--secondary" :disabled="isSyncing" @click="handleManualPull">
            <span>{{ isPulling ? '正在拉取...' : '🔄 从云端拉取更新' }}</span>
          </button>
          <button class="stats-sync-btn stats-sync-btn--gear" @click="showSyncSettingsModal = true">
            <span>⚙️ 同步设置</span>
          </button>
        </div>
      </div>

      <!-- ── 数据备份与迁移 ── -->
      <div class="stats-section">
        <div class="stats-section-header">
          <span class="stats-section-title">数据备份与迁移</span>
        </div>
        <div class="stats-backup-row">
          <!-- 导出按钮 -->
          <div class="stats-backup-btn" @click="exportData">
            <span class="stats-backup-icon">📤</span>
            <div class="stats-backup-btn-texts">
              <span class="stats-backup-btn-title">导出全部单词数据</span>
              <span class="stats-backup-btn-desc">复制为文本格式（如 data.txt），可在任何设备备份</span>
            </div>
          </div>

          <!-- 导入按钮 -->
          <div class="stats-backup-btn" @click="openImportModal">
            <span class="stats-backup-icon">📥</span>
            <div class="stats-backup-btn-texts">
              <span class="stats-backup-btn-title">导入文本数据</span>
              <span class="stats-backup-btn-desc">粘贴 data.txt 文本，一键解析并同步替换当前词库</span>
            </div>
          </div>

          <!-- 恢复出厂 37 面数据 -->
          <div class="stats-backup-btn stats-backup-btn--danger" @click="confirmResetToFactory">
            <span class="stats-backup-icon">🔄</span>
            <div class="stats-backup-btn-texts">
              <span class="stats-backup-btn-title">重置恢复为最新 37 面底库</span>
              <span class="stats-backup-btn-desc">恢复至 data.txt 对应的 583 词及 284 处复习打点</span>
            </div>
          </div>
        </div>
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

    <!-- 文本导入弹窗 -->
    <Teleport to="body">
      <div v-if="showImportModal" class="nb-overlay" @click.self="closeImportModal">
        <div class="import-modal" @click.stop>
          <div class="import-modal-header">
            <span class="import-modal-title">📥 导入单词数据</span>
            <span class="import-modal-close" @click="closeImportModal">✕</span>
          </div>

          <p class="import-modal-tip">
            请将导出的文本内容（例如 <code>data.txt</code>）完整粘贴在下方，系统会自动解析出页码与打点标记。
          </p>

          <textarea
            class="import-textarea"
            v-model="importInputText"
            placeholder="粘贴 data.txt 内容..."
            rows="8"
            @input="importParseResult = null"
          ></textarea>

          <!-- 解析结果提示 -->
          <div v-if="importParseResult" class="import-result-box" :class="{ 'import-result-box--err': !importParseResult.success }">
            <template v-if="importParseResult.success">
              <span class="import-result-ok">✓ 成功解析：共 <b>{{ importParseResult.pageCount }}</b> 面，<b>{{ importParseResult.wordCount }}</b> 个单词，<b>{{ importParseResult.circleCount }}</b> 处打点标记</span>
            </template>
            <template v-else>
              <span class="import-result-err">✕ {{ importParseResult.msg }}</span>
            </template>
          </div>

          <div class="import-modal-actions">
            <button class="import-btn import-btn--parse" @click="handleParseImportText">
              <span>🔍 检查解析</span>
            </button>
            <button
              class="import-btn import-btn--confirm"
              :disabled="!importParseResult || !importParseResult.success"
              @click="confirmApplyImport"
            >
              <span>覆盖并保存</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 重置出厂确认弹窗 -->
    <Teleport to="body">
      <div v-if="showResetModal" class="nb-overlay" @click.self="showResetModal = false">
        <div class="confirm-modal" @click.stop>
          <span class="confirm-modal-title">⚠️ 重置底库确认</span>
          <p class="confirm-modal-text">
            确定要将当前所有页面恢复为最新的 37 面（包含 583 个单词及 284 处复习打点）吗？<br/>
            该操作将以 data.txt 为准重置当前数据，并推送到云端。
          </p>
          <div class="confirm-modal-actions">
            <button class="confirm-btn confirm-btn--cancel" @click="showResetModal = false">取消</button>
            <button class="confirm-btn confirm-btn--danger" @click="executeReset">确定重置</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 云端同步设置弹窗 -->
    <Teleport to="body">
      <div v-if="showSyncSettingsModal" class="nb-overlay" @click.self="showSyncSettingsModal = false">
        <div class="sync-settings-modal" @click.stop>
          <div class="sync-modal-header">
            <span class="sync-modal-title">⚙️ 多设备云同步设置</span>
            <span class="sync-modal-close" @click="showSyncSettingsModal = false">✕</span>
          </div>

          <div class="sync-modal-body">
            <!-- 同步模式选择 -->
            <div class="sync-field-group">
              <label class="sync-field-label">云同步通道模式</label>
              <div class="sync-mode-selector">
                <div
                  class="sync-mode-option"
                  :class="{ active: syncSettingsForm.mode === 'vercel_kv' }"
                  @click="syncSettingsForm.mode = 'vercel_kv'"
                >
                  <span class="sync-mode-name">Vercel KV (推荐)</span>
                  <span class="sync-mode-sub">部署环境自带，零门槛多端互通</span>
                </div>
                <div
                  class="sync-mode-option"
                  :class="{ active: syncSettingsForm.mode === 'github_gist' }"
                  @click="syncSettingsForm.mode = 'github_gist'"
                >
                  <span class="sync-mode-name">GitHub Gist</span>
                  <span class="sync-mode-sub">利用 GitHub Token 私有云备份</span>
                </div>
              </div>
            </div>

            <!-- Vercel KV 设置 -->
            <template v-if="syncSettingsForm.mode === 'vercel_kv'">
              <div class="sync-field-group">
                <label class="sync-field-label">设备同步标识码 (Sync Key)</label>
                <input
                  class="sync-input"
                  type="text"
                  v-model="syncSettingsForm.syncKey"
                  placeholder="例如：main 或自定义英文代码"
                />
                <span class="sync-field-hint">两台设备输入相同的标识码即可共享同一份数据（默认 main）。</span>
              </div>
            </template>

            <!-- GitHub Gist 设置 -->
            <template v-if="syncSettingsForm.mode === 'github_gist'">
              <div class="sync-field-group">
                <label class="sync-field-label">GitHub Personal Access Token</label>
                <input
                  class="sync-input"
                  type="password"
                  v-model="syncSettingsForm.githubToken"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
                <span class="sync-field-hint">需带有 gist 权限的 GitHub Token，保存在本地。</span>
              </div>
              <div class="sync-field-group" v-if="syncState.gistId">
                <label class="sync-field-label">当前绑定的 Gist ID</label>
                <span class="sync-field-val">{{ syncState.gistId }}</span>
              </div>
            </template>

            <!-- 自动同步开关 -->
            <div class="sync-field-group sync-field-group--switch">
              <div>
                <span class="sync-field-label">自动双向同步</span>
                <span class="sync-field-hint">修改后自动上传，切回应用时自动拉取最新数据</span>
              </div>
              <input type="checkbox" v-model="syncSettingsForm.autoSync" class="sync-switch" />
            </div>
          </div>

          <div class="sync-modal-actions">
            <button class="sync-modal-btn sync-modal-btn--save" @click="saveSyncSettings">保存设置并测试连接</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 单词查询弹窗 -->
    <DictModal
      v-model="showDictModal"
      :initial-word="dictInitialWord"
      @jump-to-word="onJumpFromDict"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useNotebookStore } from '../store/notebook.js'
import DictModal from '../components/DictModal.vue'
import { syncState, saveSyncConfig } from '../utils/sync.js'
import { parseNotebookText } from '../utils/importer.js'

const store = useNotebookStore()
const router = useRouter()
const showToast = inject('showToast')

store.init()

// ── 查词弹窗状态 ────────────────────────────────────
const showDictModal = ref(false)
const dictInitialWord = ref('')

function openDictModal(word = '') {
  dictInitialWord.value = typeof word === 'string' ? word : ''
  showDictModal.value = true
}

function onJumpFromDict({ pageIdx, slotIdx }) {
  store.searchTarget = { pageIdx, slotIdx }
  router.push('/')
}

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
  const query = (searchText.value || '').trim()
  if (!query) return
  openDictModal(query)
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

// ── 云同步交互 ─────────────────────────────────────────
const isPushing = ref(false)
const isPulling = ref(false)
const isSyncing = computed(() => isPushing.value || isPulling.value)

const syncStatusText = computed(() => {
  if (isPushing.value) return '上传中'
  if (isPulling.value) return '拉取中'
  switch (syncState.status) {
    case 'synced': return '已同步'
    case 'syncing': return '同步中'
    case 'pulling': return '拉取中'
    case 'error': return '出错'
    case 'unconfigured': return '未配置'
    default: return '待同步'
  }
})

async function handleManualPush() {
  if (isSyncing.value) return
  isPushing.value = true
  try {
    const res = await store.syncService?.pushToCloud(false)
    if (res?.success) {
      showToast('已成功同步并推送到云端！')
    } else if (res?.reason === 'unconfigured') {
      showToast('云端尚未绑定数据库，可点击设置查看')
    } else {
      showToast('上传失败，请查看网络或配置')
    }
  } catch (e) {
    showToast('上传失败: ' + e.message)
  } finally {
    isPushing.value = false
  }
}

async function handleManualPull() {
  if (isSyncing.value) return
  isPulling.value = true
  try {
    const res = await store.syncService?.pullFromCloud(false)
    if (res?.success) {
      showToast('已从云端拉取最新数据！')
    } else if (res?.reason === 'unconfigured') {
      showToast('云端尚未绑定数据库')
    } else {
      showToast('拉取完成，已是最新状态')
    }
  } catch (e) {
    showToast('拉取失败: ' + e.message)
  } finally {
    isPulling.value = false
  }
}

// ── 云同步设置弹窗 ─────────────────────────────────────
const showSyncSettingsModal = ref(false)
const syncSettingsForm = reactive({
  mode: syncState.mode || 'vercel_kv',
  syncKey: syncState.syncKey || 'main',
  githubToken: syncState.githubToken || '',
  autoSync: syncState.autoSync !== false
})

async function saveSyncSettings() {
  syncState.mode = syncSettingsForm.mode
  syncState.syncKey = (syncSettingsForm.syncKey || '').trim() || 'main'
  syncState.githubToken = (syncSettingsForm.githubToken || '').trim()
  syncState.autoSync = syncSettingsForm.autoSync !== false
  saveSyncConfig()
  showSyncSettingsModal.value = false
  showToast('设置已保存，正在测试同步...')
  await handleManualPull()
}

// ── 文本导入弹窗 ─────────────────────────────────────
const showImportModal = ref(false)
const importInputText = ref('')
const importParseResult = ref(null)

function openImportModal() {
  importInputText.value = ''
  importParseResult.value = null
  showImportModal.value = true
}

function closeImportModal() {
  showImportModal.value = false
  importInputText.value = ''
  importParseResult.value = null
}

function handleParseImportText() {
  const result = parseNotebookText(importInputText.value)
  importParseResult.value = result
  if (!result.success) {
    showToast(result.msg)
  }
}

function confirmApplyImport() {
  if (!importParseResult.value || !importParseResult.value.success) {
    handleParseImportText()
  }
  if (!importParseResult.value?.success) return

  store.importPages(importParseResult.value.pages)
  closeImportModal()
  showToast(`导入成功！共 ${importParseResult.value.pageCount} 面，${importParseResult.value.wordCount} 个单词`)
}

// ── 重置出厂底库 ─────────────────────────────────────
const showResetModal = ref(false)

function confirmResetToFactory() {
  showResetModal.value = true
}

function executeReset() {
  store.resetToFactory()
  showResetModal.value = false
  showToast('已重置为最新 37 面出厂数据！')
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
  appearance: none;
}
.stats-search-field::-webkit-search-decoration,
.stats-search-field::-webkit-search-cancel-button,
.stats-search-field::-webkit-search-results-button,
.stats-search-field::-webkit-search-results-decoration {
  display: none;
  -webkit-appearance: none;
}
.stats-search-field::placeholder { color: #b8a98a; }
.stats-search-clear { padding: 6px; cursor: pointer; }
.stats-clear-icon { font-size: 20px; color: #9b8f7a; }

.stats-dict-btn {
  background-color: #553e16;
  border-radius: 18px;
  padding: 8px 13px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats-dict-btn:active { opacity: 0.8; }
.stats-dict-btn-text { color: #fff8e8; font-size: 13px; font-weight: 600; }

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
  padding: 10px 14px;
  border-bottom: 1px solid #f0ebe0;
  gap: 10px;
}
.stats-forgotten-row:last-child { border-bottom: none; }
.stats-rank { font-size: 12px; color: #b8a98a; width: 20px; text-align: center; flex-shrink: 0; }
.stats-forgotten-word {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 14px;
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
.stats-dot { width: 7px; height: 7px; border-radius: 50%; background-color: #c0392b; }
.stats-dot-overflow { font-size: 11px; color: #c0392b; }
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

/* ── 测试弹窗 (与主页 14px 保持一致，布局紧凑) ── */
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
  border-radius: 18px;
  width: min(420px, 92vw);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.3);
}
.quiz-header {
  padding: 14px 18px 10px;
  border-bottom: 1px solid #ede6d8;
  background-color: #f8f4ec;
}
.quiz-title { font-size: 15px; color: #2c2416; font-weight: 700; }
.quiz-list { flex: 1; overflow-y: auto; }
.quiz-item {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid #f0ebe0;
  gap: 8px;
}
.quiz-item:last-child { border-bottom: none; }
.quiz-num { font-size: 12px; color: #c4b49a; width: 20px; text-align: center; flex-shrink: 0; }
.quiz-circles-wrap {
  min-width: 36px;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 3px 6px;
  background-color: #f4efe4;
  border-radius: 12px;
  cursor: pointer;
}
.quiz-circles-wrap:active { opacity: 0.7; }
.quiz-dot { width: 7px; height: 7px; border-radius: 50%; background-color: #c0392b; flex-shrink: 0; }
.quiz-dot-overflow { font-size: 10px; color: #c0392b; font-weight: 600; }
.quiz-dot-add-icon { font-size: 12px; color: #b8a98a; }
.quiz-word { flex: 1; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #2c2416; font-weight: 500; }
.quiz-page-tag {
  background-color: #f0ebe0;
  padding: 3px 8px;
  border-radius: 12px;
  flex-shrink: 0;
  cursor: pointer;
}
.quiz-page-tag:active { background: #e6e0d3; }
.quiz-page-text { font-size: 11px; color: #8b7355; font-weight: 500; }
.quiz-actions {
  display: flex;
  padding: 10px 14px;
  gap: 10px;
  border-top: 1px solid #ede6d8;
  background-color: #f8f4ec;
}
.quiz-action-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 24px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
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

/* ── 多设备云同步卡片 ─────────── */
.stats-sync-card {
  margin: 16px 16px 0;
  background: #fdfbf6;
  border-radius: 16px;
  padding: 16px 18px;
  border: 1px solid #e8dfc8;
  box-shadow: 0 2px 8px rgba(44, 36, 22, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stats-sync-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stats-sync-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stats-sync-title {
  font-size: 15px;
  font-weight: 700;
  color: #2c2416;
}
.stats-sync-mode-tag {
  font-size: 11px;
  background: #eee8dc;
  color: #7a5c10;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 500;
}
.stats-sync-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  background: #f0ebe0;
  color: #5a4a36;
}
.stats-sync-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9b8f7a;
}
.stats-sync-badge--synced {
  background: #e6f4ea;
  color: #1e7e34;
}
.stats-sync-badge--synced .stats-sync-badge-dot {
  background: #28a745;
}
.stats-sync-badge--syncing, .stats-sync-badge--pulling {
  background: #fff3cd;
  color: #856404;
}
.stats-sync-badge--syncing .stats-sync-badge-dot, .stats-sync-badge--pulling .stats-sync-badge-dot {
  background: #ffc107;
  animation: pulse 1s infinite alternate;
}
.stats-sync-badge--error {
  background: #f8d7da;
  color: #721c24;
}
.stats-sync-badge--error .stats-sync-badge-dot {
  background: #dc3545;
}
@keyframes pulse {
  from { opacity: 0.4; }
  to { opacity: 1; }
}
.stats-sync-info-row {
  font-size: 13px;
  color: #8b7355;
  background: #fbf8f0;
  padding: 6px 10px;
  border-radius: 8px;
  border-left: 3px solid #7a5c10;
}
.stats-sync-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stats-sync-btn {
  flex: 1;
  min-width: 100px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.stats-sync-btn:active { opacity: 0.8; }
.stats-sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.stats-sync-btn--primary {
  background: #7a5c10;
  color: #fff8e8;
}
.stats-sync-btn--secondary {
  background: #eee8dc;
  color: #4a3b2c;
  border: 1px solid #ddd5c0;
}
.stats-sync-btn--gear {
  flex: 0 0 auto;
  min-width: 0;
  background: #f0ebe0;
  color: #5a4a36;
  border: 1px solid #ddd5c0;
}

/* ── 备份与迁移 ─────────── */
.stats-backup-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
}
.stats-backup-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fbf8f0;
  border: 1px solid #e8dfc8;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.stats-backup-btn:active { background: #f0ebe0; }
.stats-backup-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.stats-backup-btn-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stats-backup-btn-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c2416;
}
.stats-backup-btn-desc {
  font-size: 12px;
  color: #8b7355;
}
.stats-backup-btn--danger {
  border-color: #f0d0d0;
  background: #fff9f9;
}
.stats-backup-btn--danger:active { background: #fbeeed; }
.stats-backup-btn--danger .stats-backup-btn-title {
  color: #b02a37;
}

/* ── 导入弹窗 ─────────── */
.import-modal {
  background: #fdfbf6;
  border-radius: 18px;
  width: min(380px, 92vw);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(44, 36, 22, 0.2);
}
.import-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.import-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c2416;
}
.import-modal-close {
  font-size: 18px;
  color: #8b7355;
  cursor: pointer;
  padding: 4px;
}
.import-modal-tip {
  font-size: 13px;
  color: #6a5845;
  margin: 0;
  line-height: 1.5;
}
.import-modal-tip code {
  background: #eee8dc;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}
.import-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 13px;
  border: 1px solid #ddd5c0;
  border-radius: 10px;
  background: #fff;
  color: #2c2416;
  resize: vertical;
  outline: none;
  font-family: inherit;
}
.import-textarea:focus {
  border-color: #7a5c10;
}
.import-result-box {
  padding: 10px 12px;
  border-radius: 8px;
  background: #e6f4ea;
  border: 1px solid #b7e1cd;
  font-size: 13px;
  color: #1e7e34;
}
.import-result-box--err {
  background: #fce8e6;
  border-color: #fad2cf;
  color: #c5221f;
}
.import-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.import-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.import-btn--parse {
  background: #eee8dc;
  color: #4a3b2c;
  border: 1px solid #ddd5c0;
}
.import-btn--confirm {
  background: #28a745;
  color: #fff;
}
.import-btn--confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* ── 重置确认弹窗 ─────────── */
.confirm-modal {
  background: #fdfbf6;
  border-radius: 18px;
  width: min(320px, 88vw);
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(44, 36, 22, 0.2);
}
.confirm-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #b02a37;
}
.confirm-modal-text {
  font-size: 13px;
  color: #5a4a36;
  line-height: 1.6;
  margin: 0;
}
.confirm-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}
.confirm-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.confirm-btn--cancel {
  background: #eee8dc;
  color: #4a3b2c;
}
.confirm-btn--danger {
  background: #dc3545;
  color: #fff;
}

/* ── 同步设置弹窗 ─────────── */
.sync-settings-modal {
  background: #fdfbf6;
  border-radius: 18px;
  width: min(380px, 92vw);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 8px 32px rgba(44, 36, 22, 0.2);
}
.sync-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sync-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c2416;
}
.sync-modal-close {
  font-size: 18px;
  color: #8b7355;
  cursor: pointer;
  padding: 4px;
}
.sync-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sync-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sync-field-group--switch {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid #f0ebe0;
}
.sync-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a3b2c;
}
.sync-field-hint {
  font-size: 11px;
  color: #8b7355;
  line-height: 1.4;
}
.sync-field-val {
  font-size: 12px;
  color: #2c2416;
  font-family: monospace;
  background: #eee8dc;
  padding: 4px 6px;
  border-radius: 6px;
  word-break: break-all;
}
.sync-mode-selector {
  display: flex;
  gap: 8px;
}
.sync-mode-option {
  flex: 1;
  padding: 10px 8px;
  border-radius: 10px;
  border: 1.5px solid #ddd5c0;
  background: #fbf8f0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all 0.15s;
}
.sync-mode-option.active {
  border-color: #7a5c10;
  background: #f5eedf;
}
.sync-mode-name {
  font-size: 13px;
  font-weight: 600;
  color: #2c2416;
}
.sync-mode-sub {
  font-size: 10px;
  color: #8b7355;
}
.sync-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid #ddd5c0;
  border-radius: 8px;
  background: #fff;
  outline: none;
}
.sync-input:focus {
  border-color: #7a5c10;
}
.sync-switch {
  width: 20px;
  height: 20px;
  accent-color: #7a5c10;
  cursor: pointer;
}
.sync-modal-actions {
  margin-top: 4px;
}
.sync-modal-btn--save {
  width: 100%;
  padding: 11px 0;
  border-radius: 12px;
  background: #7a5c10;
  color: #fff8e8;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
</style>

