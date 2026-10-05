// localStorage 持久化封装与版本迁移管理
import initialPages from '../data/initialPages.json'

const STORAGE_KEY_V5 = 'vocab_notebook_v5'

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V5)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 如果数据有效且包含至少 38 面（平移 12 格调整后的完整数据），正常加载
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length >= 38) {
        return parsed
      }
    }
  } catch (e) {
    console.error('读取 v5 本地缓存失败:', e)
  }

  // 首次打开或从旧版本升级：采用平移后的最新 38 面数据，并以最新时间戳推送到云端
  const initialData = {
    version: 5,
    updatedAt: Date.now(),
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(initialData)
  return initialData
}

export function saveStorage(data) {
  try {
    const payload = {
      version: 5,
      updatedAt: data.updatedAt || Date.now(),
      pages: data.pages
    }
    localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(payload))
  } catch (e) {
    console.error('本地保存失败:', e)
  }
}

// 强制重置为内置的最新 38 面底库数据
export function resetToInitialData() {
  const freshData = {
    version: 5,
    updatedAt: Date.now(),
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(freshData)
  return freshData
}
