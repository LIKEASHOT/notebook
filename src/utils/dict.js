// 单词查询工具库（对接有道词典开放 API，支持 JSONP 跨域及词性解析）

/**
 * 将释义文本拆解为按词性排列的结构化数组
 * 例如: "adj. 困难的; v. 挑战" -> [{ pos: 'adj.', meaning: '困难的' }, { pos: 'v.', meaning: '挑战' }]
 */
export function parseExplainToLines(explain) {
  if (!explain) return []
  const raw = explain.trim()
  const parts = raw.split(/;\s*(?=(?:[a-zA-Z]+\.\s*|[^;；：:\n]{1,10}[：:]))/)
  const results = []
  const posRegex = /^([a-zA-Z]+\.)\s*(.*)$/

  for (let part of parts) {
    part = part.trim()
    if (!part) continue

    const match = part.match(posRegex)
    if (match) {
      results.push({
        pos: match[1],
        meaning: match[2].trim().replace(/[；;]+$/, '')
      })
    } else {
      const colonMatch = part.match(/^([^：:\n]{1,10})[：:]\s*(.*)$/)
      if (colonMatch) {
        results.push({
          pos: colonMatch[1].trim(),
          meaning: colonMatch[2].trim().replace(/[；;]+$/, '')
        })
      } else {
        results.push({
          pos: '释义',
          meaning: part.replace(/[；;]+$/, '')
        })
      }
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
 * JSONP 查询有道词典单词建议与释义
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
    }, 6000)

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
 * 异步获取单词音标 (IPA 国际音标)
 */
export async function fetchPhonetic(word) {
  try {
    const cleanWord = (word || '').trim().toLowerCase()
    if (!cleanWord || cleanWord.includes(' ')) return null
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
    if (!res.ok) return null
    const data = await res.json()
    const phonetic = data[0]?.phonetic || data[0]?.phonetics?.find(p => p.text)?.text || null
    return phonetic
  } catch (e) {
    return null
  }
}

/**
 * 查询单词详情
 * @param {string} rawWord - 目标查询词
 * @returns {Promise<{ found: boolean, word: string, phonetic?: string, lines: Array<{pos: string, meaning: string}> }>}
 */
export async function queryWord(rawWord) {
  const word = (rawWord || '').trim()
  if (!word) {
    return { found: false, word: '', lines: [], phonetic: '' }
  }

  try {
    const [data, phonetic] = await Promise.all([
      fetchYoudaoSuggestJSONP(word),
      fetchPhonetic(word)
    ])
    const entries = data?.data?.entries || []
    
    if (entries.length === 0) {
      return { found: false, word, lines: [], phonetic: phonetic || '' }
    }

    // 精确优先匹配，否则取第一项
    const targetEntry = entries.find(
      e => e.entry.toLowerCase() === word.toLowerCase()
    ) || entries[0]

    const parsedLines = parseExplainToLines(targetEntry.explain)

    return {
      found: parsedLines.length > 0,
      word: targetEntry.entry || word,
      phonetic: phonetic || '',
      lines: parsedLines
    }
  } catch (error) {
    console.error('queryWord error:', error)
    throw error
  }
}
