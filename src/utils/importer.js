// 解析文本格式单词本（与导出格式完全兼容）
export function parseNotebookText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, msg: '输入内容为空' }
  }

  const lines = rawText.split(/\r?\n/)
  let currentId = null
  const pages = []
  let currentPageWords = []
  let wordCount = 0
  let circleCount = 0

  for (const line of lines) {
    // 匹配页面标记，例如：——— 第 1 面（16/16 个单词）——— 或 ——— 第 1 面 ———
    const matchPage = line.match(/^———\s*第\s*(\d+)\s*面/)
    if (matchPage) {
      if (currentId !== null) {
        while (currentPageWords.length < 16) {
          currentPageWords.push({ text: '', circles: 0 })
        }
        pages.push({ id: currentId, words: currentPageWords })
      }
      currentId = parseInt(matchPage[1], 10)
      currentPageWords = []
      continue
    }

    if (currentId !== null && line.trim()) {
      const trimmed = line.trim()
      // 跳过无关说明行
      if (trimmed.startsWith('=====') || trimmed.startsWith('导出时间') || trimmed.startsWith('总页数')) {
        continue
      }

      // 匹配圆点打点部分：单词 + 空格 + ●●●(+N)?
      const dotMatch = trimmed.match(/^(.*?)\s+(●+(\+\d+)?)$/)
      if (dotMatch) {
        const text = dotMatch[1].trim()
        const dotPart = dotMatch[2]
        let circles = 0
        const plusMatch = dotPart.match(/\+(\d+)$/)
        if (plusMatch) {
          const plusNum = parseInt(plusMatch[1], 10)
          const dotsOnly = dotPart.replace(/\+\d+$/, '')
          circles = (dotsOnly.match(/●/g) || []).length + plusNum
        } else {
          circles = (dotPart.match(/●/g) || []).length
        }
        currentPageWords.push({ text, circles })
        wordCount++
        circleCount += circles
      } else {
        // 无打点纯单词
        currentPageWords.push({ text: trimmed, circles: 0 })
        wordCount++
      }
    }
  }

  if (currentId !== null) {
    while (currentPageWords.length < 16) {
      currentPageWords.push({ text: '', circles: 0 })
    }
    pages.push({ id: currentId, words: currentPageWords })
  }

  if (pages.length === 0 || wordCount === 0) {
    return { success: false, msg: '未能识别出有效的页面或单词内容，请检查格式' }
  }

  return {
    success: true,
    pages,
    pageCount: pages.length,
    wordCount,
    circleCount
  }
}
