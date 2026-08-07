import { defineStore } from 'pinia'
import { loadStorage, saveStorage } from '../utils/storage.js'

// ============================================================
//  初始单词（共 21 页，332 个单词）
// ============================================================
const INITIAL_WORDS = [
  // 第一面
  'used to', 'expert', 'adventure', 'through', 'fruitful', 'cost', 'challenging', 'have done',
  'repair', 'still', 'different', 'difficult', 'recognise', 'include', 'ocean', 'view',
  // 第二面
  'locate', 'block', 'resident', 'follow', 'tradition', 'against', 'reveal', 'area',
  'design', 'well-being', 'connect', 'mental', 'preference', 'make sth. adj', 'demand', '-ness',
  // 第三面
  'sense', 'list', 'lack', 'play on', 'while', 'pattern', 'consider', 'create',
  'act', 'practical', 'melt', 'stress', 'emotion', 'impact', 'convince', 'since',
  // 第四面
  'energy', 'new energy', 'vehicle', 'establish', 'expert', 'battery', 'industry', 'reflect',
  'electric', 'take advantage of', 'focus', 'truly', 'produce', 'production', 'commitment', 'sustain',
  // 第五面
  'sustainable development', 'front', 'fore-', 'revolution', 'invest', 'research', 'introduce', 'aim',
  'performance', 'battery', 'so far', 'concern', 'major', 'market', 'present', 'presence',
  // 第六面
  'symbol', 'rise', 'rise-rose-risen', 'global', 'industry', 'used to do', 'be used to doing', 'be used to do',
  'convince', 'shine-shone', 'connection', 'independence', 'work out', 'figure out', 'resist', 'release',
  // 第七面
  'work', 'source', 'milestone', 'towards', 'turn', 'head', 'divide', 'affect',
  'desire', 'long for', 'pleasure', 'leave-left-left', 'replace', 'kill', 'offer', 'height',
  // 第八面
  'against', 'dull', 'even', 'match', 'calm', 'please', 'form', 'soil',
  'close', 'provide', 'especially', 'protect', 'benefit', 'possible', 'possibility', 'beauty',
  // 第九面
  'bio-', 'ground', 'exist', 'treasure', 'ancient', 'be honored as', 'a series of', 'carry',
  'closely', 'offer sth. to do sth.', 'envy + doing', 'resolution', 'sink', 'fail', 'fail to do', 'conflict',
  // 第十面
  'law', 'pass', 'identify as', 'circle', 'turn out to be', 'domestic', 'contribute', 'factor',
  'worthwhile', 'raise', 'move', 'condition', 'climate', 'goods', 'meat', 'continue',
  // 第十一面
  'entirely', 'rely on', 'gather', 'likely', 'farm', 'rather than', 'material', 'local',
  'insight', 'promote', 'site', 'experience', 'spirit', 'warn', 'require', 'train',
  // 第十二面
  'have to', 'wealth', 'labour', 'wisdom', 'hardly', 'flow', 'bug', 'skin',
  'bite-bit-bitten', 'broad', 'drop', 're-', 'as adj. as possible', 'patient', 'forward', 'pick',
  // 第十三面
  'sow', 'by', 'judge', 'as long as', 'dependable', 'teach-taught-taught', 'common', 'free',
  'restroom', 'rest', 'comfortable', 'pass away', 'hard', 'event', 'meaning', 'defeat',
  // 第十四面
  'company', 'recover', 'will', 'patient', 'polite', 'heal', 'recently', 'gain',
  'feature', 'important - importance', 'audience', 'appreciate', 'make it adj to sb', 'make', 'prove', 'therefore',
  // 第十五面
  'direct', 'measure', 'probably', 'role', 'no longer', 'function', 'merely', 'active',
  'as', 'gather', 'draw', 'tool', 'practical', 'practice', 'combine', 'theme',
  // 第十六面
  'casual', 'distant', 'text', 'website', 'most', 'resist', 'evolution', 'powerful',
  'power', 'journey', 'guide', 'hesitate', 'wear-wore-worn', 'remove', 'adventure', 'discover',
  // 第十七面
  'lift', 'curious', 'get', 'tough', 'mystery', 'concern', 'imagine', 'fight',
  'seek', 'connect', 'cover', 'environment', 'talent', 'imagination', 'serve', 'gain',
  // 第十八面
  'communicate', 'emotional', 'focus on', 'service', 'remote', 'grow', 'reduce', 'benefit',
  'beyond', 'dimension', 'forward', 'continue', 'challenge', 'rich', 'globe-global', 'pollution',
  // 第十九面
  'climate', 'study', 'find', 'impact', 'ocean', 'risk', 'conservation', 'conversation',
  'effort', 'effect', 'progress', 'improve', 'save', 'notice', 'speed', 'worthy',
  // 第二十面
  'poetry', 'expect', 'shift', 'belong', 'realize', 'trust', 'respect', 'inspiration',
  'fog', 'equation', 'require', 'curious', 'curiosity', 'reward', 'insight', 'far-farther',
  // 第二十一面（12个单词）
  'path', 'light', 'method', 'fly-flew-flown', 'direct', 'seem', 'create', 'meanwhile',
  'mark', 'despite', 'memory', 'root',
]

function createEmptyPage(id) {
  return {
    id,
    words: Array.from({ length: 16 }, () => ({ text: '', circles: 0 }))
  }
}

function loadOrInitData() {
  const stored = loadStorage()
  if (stored && stored.pages && stored.pages.length > 0) return stored

  // 首次：按 INITIAL_WORDS 初始化
  const pages = []
  if (INITIAL_WORDS.length > 0) {
    let idx = 0
    while (idx < INITIAL_WORDS.length) {
      const page = createEmptyPage(pages.length + 1)
      for (let slot = 0; slot < 16 && idx < INITIAL_WORDS.length; slot++) {
        const word = (INITIAL_WORDS[idx] || '').trim().toLowerCase()
        if (word) page.words[slot].text = word
        idx++
      }
      pages.push(page)
    }
    const last = pages[pages.length - 1]
    if (last.words.every(w => w.text)) pages.push(createEmptyPage(pages.length + 1))
  } else {
    pages.push(createEmptyPage(1))
  }
  return { pages }
}

export const useNotebookStore = defineStore('notebook', {
  state: () => ({
    pages: [],
    searchTarget: null, // { pageIdx, slotIdx } — 统计页跳转
  }),

  actions: {
    init() {
      const data = loadOrInitData()
      this.pages = data.pages
    },

    save() {
      saveStorage({ pages: this.pages })
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
