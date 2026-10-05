// localStorage 持久化封装与版本迁移管理
import initialPages from '../data/initialPages.json'

const STORAGE_KEY_V6 = 'vocab_notebook_v6'

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V6)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 如果数据有效且包含至少 38 面（compare 在第 38 面第 3 格的完整数据），正常加载
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length >= 38) {
        return parsed
      }
    }
  } catch (e) {
    console.error('读取 v6 本地缓存失败:', e)
  }

  // 首次打开或升级：采用 compare 在 38 面第 3 格的最新排布，并以最新时间戳推送到云端
  const initialData = {
    version: 6,
    updatedAt: Date.now(),
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(initialData)
  return initialData
}

export function saveStorage(data) {
  try {
    const payload = {
      version: 6,
      updatedAt: data.updatedAt || Date.now(),
      pages: data.pages
    }
    localStorage.setItem(STORAGE_KEY_V6, JSON.stringify(payload))
  } catch (e) {
    console.error('本地保存失败:', e)
  }
}

// 强制重置为内置的最新 38 面底库数据
export function resetToInitialData() {
  const freshData = {
    version: 6,
    updatedAt: Date.now(),
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(freshData)
  return freshData
}
