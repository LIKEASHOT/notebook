// localStorage 持久化封装与版本迁移管理
import initialPages from '../data/initialPages.json'

const STORAGE_KEY_V4 = 'vocab_notebook_v4'
const LEGACY_KEY_V3 = 'vocab_notebook_v3'

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V4)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 如果数据有效且包含至少 37 面（data.txt 的完整数据），正常加载
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length >= 37) {
        return parsed
      }
    }
  } catch (e) {
    console.error('读取 v4 本地缓存失败:', e)
  }

  // 首次打开或从旧版本升级：采用 data.txt 解析的最新 37 面数据
  const initialData = {
    version: 4,
    updatedAt: Date.now(),
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(initialData)
  return initialData
}

export function saveStorage(data) {
  try {
    const payload = {
      version: 4,
      updatedAt: data.updatedAt || Date.now(),
      pages: data.pages
    }
    localStorage.setItem(STORAGE_KEY_V4, JSON.stringify(payload))
  } catch (e) {
    console.error('本地保存失败:', e)
  }
}

// 强制重置为内置的最新 37 面底库数据
export function resetToInitialData() {
  const freshData = {
    version: 4,
    updatedAt: Date.now(),
    pages: JSON.parse(JSON.stringify(initialPages))
  }
  saveStorage(freshData)
  return freshData
}
