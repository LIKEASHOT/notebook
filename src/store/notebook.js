import { defineStore } from 'pinia'
import { loadStorage, saveStorage, resetToInitialData } from '../utils/storage.js'
import { CloudSyncService } from '../utils/sync.js'
import initialPages from '../data/initialPages.json'

function createEmptyPage(id) {
  return {
    id,
    words: Array.from({ length: 16 }, () => ({ text: '', circles: 0 }))
  }
}

export const useNotebookStore = defineStore('notebook', {
  state: () => ({
    pages: [],
    updatedAt: 0,
    searchTarget: null, // { pageIdx, slotIdx } — 统计页跳转
    initialized: false
  }),

  actions: {
    init() {
      if (this.initialized) return
      const data = loadStorage()
      this.pages = data.pages || JSON.parse(JSON.stringify(initialPages))
      this.updatedAt = data.updatedAt || Date.now()
      this.initialized = true

      // 初始化云端同步引擎并尝试静默拉取
      this.syncService = new CloudSyncService(this)
      this.syncService.pullFromCloud(true)
    },

    saveLocalOnly() {
      saveStorage({
        pages: this.pages,
        updatedAt: this.updatedAt
      })
    },

    save() {
      this.updatedAt = Date.now()
      this.saveLocalOnly()
      if (this.syncService) {
        this.syncService.schedulePush()
      }
    },

    // 应用来自云端的数据
    applyCloudData(cloudData) {
      if (cloudData && Array.isArray(cloudData.pages) && cloudData.pages.length > 0) {
        this.pages = cloudData.pages
        this.updatedAt = cloudData.updatedAt || Date.now()
        this.saveLocalOnly()
      }
    },

    // 从文本导入数据并覆盖
    importPages(newPages) {
      if (!Array.isArray(newPages) || newPages.length === 0) return
      this.pages = newPages
      this.save()
    },

    // 重置恢复到内置 37 面最新底库 (data.txt)
    resetToFactory() {
      const fresh = resetToInitialData()
      this.pages = fresh.pages
      this.updatedAt = fresh.updatedAt
      this.save()
    },

    addNewPage() {
      const newPage = createEmptyPage(this.pages.length + 1)
      this.pages.push(newPage)
      this.save()
    },

    setWord(pageIdx, slotIdx, text) {
      this.pages[pageIdx].words[slotIdx].text = text.trim().toLowerCase()
      this.save()
    },

    deleteWord(pageIdx, slotIdx) {
      this.pages[pageIdx].words[slotIdx].text = ''
      this.pages[pageIdx].words[slotIdx].circles = 0
      this.save()
    },

    addCircle(pageIdx, slotIdx) {
      this.pages[pageIdx].words[slotIdx].circles++
      this.save()
    },

    removeCircle(pageIdx, slotIdx) {
      const c = this.pages[pageIdx]?.words[slotIdx]?.circles || 0
      if (c > 0) {
        this.pages[pageIdx].words[slotIdx].circles--
        this.save()
      }
    },

    addForgottenCircle(item) {
      item.circles++
      this.pages[item.pageIdx].words[item.slotIdx].circles = item.circles
      this.save()
    },

    addQuizCircle(item) {
      item.circles++
      this.pages[item.pageIdx].words[item.slotIdx].circles = item.circles
      this.save()
    },

    removeQuizCircle(item) {
      if (item.circles > 0) {
        item.circles--
        this.pages[item.pageIdx].words[item.slotIdx].circles = item.circles
        this.save()
      }
    },

    findWord(word) {
      if (!word) return null
      const target = word.trim().toLowerCase()
      for (let pi = 0; pi < this.pages.length; pi++) {
        for (let si = 0; si < (this.pages[pi]?.words?.length || 16); si++) {
          const w = this.pages[pi]?.words[si]
          if (w && w.text && w.text.toLowerCase() === target) {
            return {
              exists: true,
              pageId: this.pages[pi].id,
              pageIdx: pi,
              slotIdx: si,
              word: w.text,
              circles: w.circles || 0
            }
          }
        }
      }
      return null
    },

    addWordToNotebook(word) {
      const text = (word || '').trim().toLowerCase()
      if (!text) return { success: false, msg: '单词不能为空' }

      const existing = this.findWord(text)
      if (existing) {
        return { success: false, alreadyExists: true, ...existing }
      }

      if (this.pages.length === 0) {
        this.addNewPage()
      }

      // 优先在最后一页寻找空位
      const lastPageIdx = this.pages.length - 1
      const lastPage = this.pages[lastPageIdx]
      let emptySlotIdx = lastPage.words.findIndex(w => !w.text)

      if (emptySlotIdx !== -1) {
        lastPage.words[emptySlotIdx].text = text
        lastPage.words[emptySlotIdx].circles = 0
        this.save()
        return {
          success: true,
          pageId: lastPage.id,
          pageIdx: lastPageIdx,
          slotIdx: emptySlotIdx
        }
      }

      // 若最后一页已满，新建一页并放入第 1 格
      this.addNewPage()
      const newPageIdx = this.pages.length - 1
      const newPage = this.pages[newPageIdx]
      newPage.words[0].text = text
      newPage.words[0].circles = 0
      this.save()
      return {
        success: true,
        pageId: newPage.id,
        pageIdx: newPageIdx,
        slotIdx: 0
      }
    }
  },

  getters: {
    totalWords: (state) =>
      state.pages.reduce((sum, p) => sum + p.words.filter(w => w.text).length, 0),

    totalCircles: (state) =>
      state.pages.reduce((sum, p) =>
        sum + p.words.reduce((s, w) => s + (w.circles || 0), 0), 0),

    allForgotten: (state) => {
      const list = []
      state.pages.forEach((p, pageIdx) => {
        p.words.forEach((w, slotIdx) => {
          if (w.text && w.circles > 0) {
            list.push({ text: w.text, circles: w.circles, pageIdx, slotIdx, pageId: p.id })
          }
        })
      })
      return list.sort((a, b) => b.circles - a.circles)
    }
  }
})
