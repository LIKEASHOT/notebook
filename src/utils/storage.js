// localStorage 持久化封装与版本迁移管理
import initialPages from '../data/initialPages.json'

const STORAGE_KEY_V7 = 'vocab_notebook_v7'
const BACKUP_KEY_V7 = 'vocab_notebook_backup_v7'

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V7)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 如果数据有效且包含至少 38 面，正常加载
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length >= 38) {
        return parsed
      }
    }
  } catch (e) {
    console.error('读取 v7 本地缓存失败:', e)
  }

  // 检查是否有本地历史有效备份（优先使用本地有打点记录的备份）
  try {
    const backupRaw = localStorage.getItem(BACKUP_KEY_V7)
    if (backupRaw) {
      const backupParsed = JSON.parse(backupRaw)
      if (backupParsed && Array.isArray(backupParsed.pages) && backupParsed.pages.length >= 38) {
        saveStorage(backupParsed)
        return backupParsed
      }
    }
  } catch (e) {}

  // 首次打开：采用出厂 38 面纯净数据
  // 注意：初始时间戳必须是固定极小值 1，且标记 isDefault = true
  // 严禁设为 Date.now()，否则会假装成“最新数据”而覆灭云端！
  const initialData = {
    version: 7,
    updatedAt: 1,
    isDefault: true,
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(initialData)
  return initialData
}

export function saveStorage(data) {
  try {
    const payload = {
      version: 7,
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      isDefault: data.isDefault === true,
      pages: data.pages
    }
    localStorage.setItem(STORAGE_KEY_V7, JSON.stringify(payload))

    // 如果当前数据包含有效打点，自动保留一份坚不可摧的本地镜像备份
    const circleCount = (payload.pages || []).reduce(
      (sum, p) => sum + (p.words || []).reduce((s, w) => s + (w.circles || 0), 0),
      0
    )
    if (circleCount > 0) {
      localStorage.setItem(BACKUP_KEY_V7, JSON.stringify(payload))
    }
  } catch (e) {
    console.error('本地保存失败:', e)
  }
}

// 强制重置为内置的最新 38 面底库数据
export function resetToInitialData() {
  const freshData = {
    version: 7,
    updatedAt: Date.now(),
    isDefault: false,
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(freshData)
  return freshData
}

// 全盘扫描本地可能存在的所有历史版本和备份，用于打捞找回意外被覆写的打点
export function scanLocalHistory() {
  const candidates = []
  const keysToCheck = [
    BACKUP_KEY_V7,
    STORAGE_KEY_V7,
    'vocab_notebook_v6',
    'vocab_notebook_v5',
    'vocab_notebook_v4',
    'vocab_notebook_v3',
    'vocab_notebook'
  ]

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('vocab_') && !keysToCheck.includes(k) && !k.includes('config')) {
        keysToCheck.push(k)
      }
    }
  } catch (e) {}

  for (const k of keysToCheck) {
    try {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const pages = parsed.pages || (Array.isArray(parsed) ? parsed : null)
      if (Array.isArray(pages) && pages.length >= 10) {
        let totalWords = 0
        let totalCircles = 0
        pages.forEach(p => {
          (p.words || []).forEach(w => {
            if (w.text) totalWords++
            if (w.circles > 0) totalCircles += (w.circles || 0)
          })
        })
        candidates.push({
          key: k,
          version: parsed.version || '历史版本',
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : null,
          totalWords,
          totalCircles,
          pages
        })
      }
    } catch (e) {}
  }

  // 排序：圆圈打点越多、时间越新的排在前面
  candidates.sort((a, b) => {
    if (b.totalCircles !== a.totalCircles) {
      return b.totalCircles - a.totalCircles
    }
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  })

  return candidates
}

