// 多设备云端同步管理服务 (Cloud Sync Engine)
import { reactive } from 'vue'

const SYNC_CONFIG_KEY = 'vocab_sync_config'

// 同步引擎状态
export const syncState = reactive({
  status: 'idle', // 'idle' | 'syncing' | 'pulling' | 'synced' | 'error' | 'unconfigured'
  message: '尚未同步',
  lastSyncTime: null,
  configured: false,
  mode: 'vercel_kv', // 'vercel_kv' | 'github_gist' | 'custom_api'
  syncKey: 'main',
  githubToken: '',
  gistId: '',
  autoSync: true
})

// 读取同步配置
export function loadSyncConfig() {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY)
    if (raw) {
      const cfg = JSON.parse(raw)
      Object.assign(syncState, cfg)
    }
  } catch (e) {
    console.error('读取同步配置失败:', e)
  }
}

// 保存同步配置
export function saveSyncConfig() {
  try {
    const cfg = {
      mode: syncState.mode,
      syncKey: syncState.syncKey || 'main',
      githubToken: syncState.githubToken || '',
      gistId: syncState.gistId || '',
      autoSync: syncState.autoSync !== false
    }
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg))
  } catch (e) {
    console.error('保存同步配置失败:', e)
  }
}

// ── Vercel KV 同步处理 ──────────────────────────
async function fetchVercelKV(syncKey) {
  const resp = await fetch(`/api/sync?key=${encodeURIComponent(syncKey)}`)
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`)
  }
  return await resp.json()
}

async function saveVercelKV(syncKey, payload) {
  const resp = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: syncKey,
      pages: payload.pages,
      updatedAt: payload.updatedAt || Date.now()
    })
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`)
  }
  return await resp.json()
}

// ── GitHub Gist 同步处理 ────────────────────────
async function getOrCreateGist(token, gistId) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  }

  if (gistId) {
    const resp = await fetch(`https://api.github.com/gists/${gistId}`, { headers })
    if (resp.ok) {
      const gist = await resp.json()
      const file = gist.files['vocab_notebook.json']
      if (file && file.content) {
        return { gistId, data: JSON.parse(file.content) }
      }
      return { gistId, data: null }
    }
  }

  // 搜索已有包含 vocab_notebook.json 的 Gist 或新建
  const listResp = await fetch('https://api.github.com/gists', { headers })
  if (listResp.ok) {
    const gists = await listResp.json()
    const found = gists.find(g => g.files && g.files['vocab_notebook.json'])
    if (found) {
      syncState.gistId = found.id
      saveSyncConfig()
      const detailResp = await fetch(`https://api.github.com/gists/${found.id}`, { headers })
      const detail = await detailResp.json()
      const content = detail.files['vocab_notebook.json'].content
      return { gistId: found.id, data: content ? JSON.parse(content) : null }
    }
  }

  // 创建新的私有 Gist
  const createResp = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: 'Vocabulary Notebook Cloud Sync Backup',
      public: false,
      files: {
        'vocab_notebook.json': {
          content: JSON.stringify({ version: 4, updatedAt: Date.now(), pages: [] })
        }
      }
    })
  })

  if (!createResp.ok) {
    throw new Error('创建 GitHub Gist 失败，请检查 Token 权限 (需勾选 gist 权限)')
  }

  const created = await createResp.json()
  syncState.gistId = created.id
  saveSyncConfig()
  return { gistId: created.id, data: null }
}

async function saveToGist(token, gistId, payload) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  }

  const content = JSON.stringify({
    version: 4,
    updatedAt: payload.updatedAt || Date.now(),
    pages: payload.pages
  })

  const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      files: {
        'vocab_notebook.json': { content }
      }
    })
  })

  if (!resp.ok) {
    throw new Error('保存到 GitHub Gist 失败')
  }
}

// ── 核心同步接口 ────────────────────────────────

let syncDebounceTimer = null

export class CloudSyncService {
  constructor(store) {
    this.store = store
    loadSyncConfig()
    this.initListeners()
  }

  initListeners() {
    // 页面唤醒/切回前台时，自动检查云端更新
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && syncState.autoSync) {
          this.pullFromCloud(true, false)
        }
      })
      window.addEventListener('focus', () => {
        if (syncState.autoSync) {
          this.pullFromCloud(true, false)
        }
      })
    }

    // 前台定时轮询（每 20 秒检查一次云端更新，保证两台设备同时开着时也能同步）
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible' && syncState.autoSync) {
          this.pullFromCloud(true, false)
        }
      }, 20000)
    }
  }

  // 防抖推送到云端（用户打点、加词、删词后调用）
  schedulePush() {
    if (!syncState.autoSync) return
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
    syncDebounceTimer = setTimeout(() => {
      this.pushToCloud(false)
    }, 1500)
  }

  // 从云端拉取数据
  async pullFromCloud(silent = false, force = false) {
    if (!silent) syncState.status = 'pulling'

    try {
      let cloudData = null

      if (syncState.mode === 'github_gist' && syncState.githubToken) {
        const res = await getOrCreateGist(syncState.githubToken, syncState.gistId)
        cloudData = res.data
      } else {
        // 默认走 Vercel KV API
        const res = await fetchVercelKV(syncState.syncKey || 'main')
        if (!res.configured) {
          syncState.configured = false
          syncState.status = 'unconfigured'
          syncState.message = '未配置云端 (本地运行)'
          return { success: false, reason: 'unconfigured' }
        }
        syncState.configured = true
        if (res.found && res.data) {
          cloudData = res.data
        }
      }

      const hasCloudData = cloudData && Array.isArray(cloudData.pages) && cloudData.pages.length > 0

      // 计算云端与本地的有效打点数量
      const cloudCircles = hasCloudData
        ? cloudData.pages.reduce((sum, p) => sum + (p.words || []).reduce((s, w) => s + (w.circles || 0), 0), 0)
        : 0
      const localCircles = this.store.pages.reduce(
        (sum, p) => sum + (p.words || []).reduce((s, w) => s + (w.circles || 0), 0),
        0
      )

      const localUpdated = typeof this.store.updatedAt === 'number' ? this.store.updatedAt : 0
      const cloudUpdated = typeof cloudData?.updatedAt === 'number' ? cloudData.updatedAt : 0
      const isLocalVirgin = this.store.isDefault === true || localUpdated <= 1000

      if (!hasCloudData) {
        // 云端尚无数据，且本地已真正有过修改时才初始化云端
        if (!isLocalVirgin || localCircles > 0) {
          await this.pushToCloud(true)
          syncState.status = 'synced'
          syncState.lastSyncTime = Date.now()
          syncState.message = '已初始化云端并同步'
          return { success: true, action: 'pushed_initial' }
        }
        syncState.status = 'synced'
        syncState.message = '云端为空，等待本地录入'
        return { success: true, action: 'none' }
      }

      // 核心防洗白判定：
      // 1. 如果用户手动点“强制从云端拉取更新” (force)
      // 2. 如果本地是出厂状态 (isLocalVirgin)
      // 3. 如果本地圆圈数为 0，而云端圆圈数 > 0（绝不允许用未打点的空状态冲毁有打点记录的云端！）
      // 4. 如果云端时间戳较新 (cloudUpdated > localUpdated)
      const shouldPull =
        force ||
        isLocalVirgin ||
        (localCircles === 0 && cloudCircles > 0) ||
        cloudUpdated > localUpdated

      if (shouldPull) {
        this.store.applyCloudData(cloudData)
        syncState.status = 'synced'
        syncState.lastSyncTime = Date.now()
        syncState.message = `已从云端同步 (${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})`
        return { success: true, action: 'pulled', pagesCount: cloudData.pages.length }
      } else if (localUpdated > cloudUpdated && !isLocalVirgin) {
        // 只有本地真实修改过且时间戳更新，才允许推送上云
        await this.pushToCloud(true)
        return { success: true, action: 'pushed_newer' }
      } else {
        syncState.status = 'synced'
        syncState.lastSyncTime = Date.now()
        syncState.message = '已是最新状态'
        return { success: true, action: 'equal' }
      }
    } catch (err) {
      console.warn('云端同步检查失败:', err)
      syncState.status = 'error'
      syncState.message = `同步出错: ${err.message}`
      return { success: false, error: err }
    }
  }

  // 推送本地数据到云端
  async pushToCloud(silent = false) {
    // 终极安全防线：若本地是出厂默认未修改状态，严禁推送覆盖云端
    if (this.store.isDefault === true && (this.store.updatedAt || 0) <= 1000) {
      console.warn('拦截向云端推送出厂默认状态')
      return { success: false, reason: 'virgin_blocked' }
    }

    if (!silent) syncState.status = 'syncing'

    try {
      const payload = {
        pages: this.store.pages,
        updatedAt: Date.now()
      }

      if (syncState.mode === 'github_gist' && syncState.githubToken) {
        const { gistId } = await getOrCreateGist(syncState.githubToken, syncState.gistId)
        await saveToGist(syncState.githubToken, gistId, payload)
      } else {
        const res = await saveVercelKV(syncState.syncKey || 'main', payload)
        if (!res.configured) {
          syncState.configured = false
          syncState.status = 'unconfigured'
          syncState.message = '未配置云端 (本地运行)'
          return { success: false, reason: 'unconfigured' }
        }
      }

      this.store.updatedAt = payload.updatedAt
      this.store.isDefault = false
      this.store.saveLocalOnly()

      syncState.status = 'synced'
      syncState.lastSyncTime = Date.now()
      syncState.message = `已同步到云端 (${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})`
      return { success: true }
    } catch (err) {
      console.error('推送到云端失败:', err)
      syncState.status = 'error'
      syncState.message = `上传失败: ${err.message}`
      return { success: false, error: err }
    }
  }
}
