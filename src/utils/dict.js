// 单词查询工具库（支持完整释义提取、JSONP 降级、音标清洗与高速缓存）

/**
 * 将单条释义文本转换为结构化对象 { pos, meaning }
 */
export function parseTranslationLine(raw) {
  if (!raw) return null
  const line = raw.trim()
  if (!line) return null

  // 1. 标准词性开头，如: v. 检查，核对... 或 adj. 困难的...
  const posMatch = line.match(/^([a-zA-Z]+\.)\s*(.*)$/)
  if (posMatch) {
    return {
      pos: posMatch[1],
      meaning: posMatch[2].replace(/[；;]+$/, '').replace(/[\.]{3,}$|……$/, '').trim()
    }
  }

  // 2. 中文短语/词条冒号开头，如: 习惯于：熟悉某事物...
  const colonMatch = line.match(/^([^：:\n]{1,10})[：:]\s*(.*)$/)
  if (colonMatch) {
    return {
      pos: colonMatch[1].trim(),
      meaning: colonMatch[2].replace(/[；;]+$/, '').replace(/[\.]{3,}$|……$/, '').trim()
    }
  }

  // 3. 其他常规释义
  return {
    pos: '释义',
    meaning: line.replace(/[；;]+$/, '').replace(/[\.]{3,}$|……$/, '').trim()
  }
}

/**
 * 将复合长释义（分号连接）拆解为按词性排列的结构化数组（用于 Suggest 降级）
 */
export function parseExplainToLines(explain) {
  if (!explain) return []
  const raw = explain.trim()
  const parts = raw.split(/;\s*(?=(?:[a-zA-Z]+\.\s*|[^;；：:\n]{1,10}[：:]))/)
  const results = []

  for (let part of parts) {
    const item = parseTranslationLine(part)
    if (item && item.meaning) {
      results.push(item)
    }
  }
  return results
}

/**
 * 获取单词发音音频 URL (有道发音 CDN，国内高速直连)
 * @param {string} word - 单词
 * @param {number} type - 1 为英音，2 为美音（默认美音）
 */
export function getAudioUrl(word, type = 2) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`
}

/**
 * 播放单词发音
 */
export function playWordAudio(word, type = 2) {
  const url = getAudioUrl(word, type)
  const audio = new Audio(url)
  return audio.play().catch(err => {
    console.warn('播放发音失败:', err)
  })
}

/**
 * 清洗音标，转换冷门 Unicode 组合字符为全平台兼容字符，杜绝手机端因缺少生僻字形导致的方框乱码
 */
export function cleanPhonetic(raw) {
  if (!raw) return ''
  let p = raw.trim()
  p = p
    .replace(/\u02C8/g, "'") // ˈ 重音符转标准单引号
    .replace(/\u02CC/g, ',')  // ˌ 次重音符转标准逗号
    .replace(/\u02D0/g, ':')  // ː 长音符转标准冒号
    .replace(/\u0279/g, 'r')  // ɹ 转 r
    .replace(/\u026B/g, 'l')  // ɫ 转 l
    .replace(/\u0261/g, 'g')  // ɡ 转 g
    .replace(/[\u0300-\u036F]/g, '') // 移除所有组合变音符号（如成节辅音点 U+0329）

  if (!p.startsWith('/') && !p.startsWith('[')) {
    p = `/${p}/`
  }
  return p
}

// 内存高速缓存
const dictCache = new Map()
const phoneticCache = new Map()

/**
 * 通过有道 fsearch 接口获取【完整未截断】的释义与原生音标
 */
async function fetchYoudaoFsearch(word) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)

  try {
    const res = await fetch(`/api/youdao/fsearch?q=${encodeURIComponent(word)}`, {
      signal: controller.signal
    })
    if (!res.ok) return null
    const xmlText = await res.text()

    const lines = []
    const translationRegex = /<translation><content><!\[CDATA\[(.*?)\]\]><\/content><\/translation>/g
    let match
    while ((match = translationRegex.exec(xmlText)) !== null) {
      const raw = match[1].trim()
      if (raw.startsWith('【名】') || raw.startsWith('【人名】')) continue
      const parsed = parseTranslationLine(raw)
      if (parsed && parsed.meaning) {
        lines.push(parsed)
      }
    }

    if (lines.length === 0) return null

    // 提取原生音标
    const phoneticMatch = xmlText.match(/<phonetic-symbol>(.*?)<\/phonetic-symbol>/)
    const rawPhonetic = phoneticMatch ? phoneticMatch[1].trim() : ''
    const phonetic = cleanPhonetic(rawPhonetic)

    return {
      found: true,
      word,
      phonetic,
      lines
    }
  } catch (e) {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * JSONP 降级查询（仅在代理不可用时作为备选）
 */
function fetchYoudaoSuggestJSONP(word) {
  return new Promise((resolve, reject) => {
    const callbackName = 'youdao_dict_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
    const script = document.createElement('script')
    let timeoutId = null

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (script.parentNode) script.parentNode.removeChild(script)
      delete window[callbackName]
    }

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('查询超时，请检查网络连接'))
    }, 4000)

    window[callbackName] = (data) => {
      cleanup()
      resolve(data)
    }

    script.onerror = () => {
      cleanup()
      reject(new Error('网络请求失败'))
    }

    script.src = `https://dict.youdao.com/suggest?doctype=json&num=5&callback=${callbackName}&q=${encodeURIComponent(word)}`
    document.body.appendChild(script)
  })
}

/**
 * 异步获取单词音标 (IPA 国际音标，带超时保护与内存缓存)
 */
export async function fetchPhonetic(word) {
  const cleanWord = (word || '').trim().toLowerCase()
  if (!cleanWord || cleanWord.includes(' ')) return null
  if (phoneticCache.has(cleanWord)) return phoneticCache.get(cleanWord)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 1200)

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
      signal: controller.signal
    })
    if (!res.ok) return null
    const data = await res.json()
    const phonetic = data[0]?.phonetic || data[0]?.phonetics?.find(p => p.text)?.text || null
    const cleaned = cleanPhonetic(phonetic)
    if (cleaned) phoneticCache.set(cleanWord, cleaned)
    return cleaned
  } catch (e) {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 查询单词详情（优先完整释义，带降级与高速缓存）
 * @param {string} rawWord - 目标查询词
 * @returns {Promise<{ found: boolean, word: string, phonetic?: string, lines: Array<{pos: string, meaning: string}> }>}
 */
export async function queryWord(rawWord) {
  const word = (rawWord || '').trim()
  if (!word) {
    return { found: false, word: '', lines: [], phonetic: '' }
  }

  const cacheKey = word.toLowerCase()
  if (dictCache.has(cacheKey)) {
    return JSON.parse(JSON.stringify(dictCache.get(cacheKey)))
  }

  // 1. 优先尝试获取【完整无截断】释义与原生音标
  const fullResult = await fetchYoudaoFsearch(word)
  if (fullResult && fullResult.found && fullResult.lines.length > 0) {
    if (fullResult.phonetic) {
      phoneticCache.set(cacheKey, fullResult.phonetic)
    }
    dictCache.set(cacheKey, fullResult)
    return fullResult
  }

  // 2. 降级方案：使用 JSONP 查询建议
  try {
    const data = await fetchYoudaoSuggestJSONP(word)
    const entries = data?.data?.entries || []
    
    if (entries.length === 0) {
      return { found: false, word, lines: [], phonetic: '' }
    }

    const targetEntry = entries.find(
      e => e.entry.toLowerCase() === word.toLowerCase()
    ) || entries[0]

    const parsedLines = parseExplainToLines(targetEntry.explain)
    const result = {
      found: parsedLines.length > 0,
      word: targetEntry.entry || word,
      phonetic: phoneticCache.get(targetEntry.entry?.toLowerCase() || cacheKey) || '',
      lines: parsedLines
    }

    if (result.found) {
      dictCache.set(cacheKey, result)
    }

    return result
  } catch (error) {
    console.error('queryWord error:', error)
    throw error
  }
}
