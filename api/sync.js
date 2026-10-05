// Vercel Serverless Function: /api/sync
// 支持 Vercel KV / Upstash Redis 官方标准 REST API 协议

function getKvCredentials() {
  // 1. 检查常见标准变量名
  let url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  let token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) return { url, token }

  // 2. 自动搜索任何可能带自定义前缀的 Upstash / Redis 环境变量
  const keys = Object.keys(process.env)
  const urlKey = keys.find(
    k => (k.includes('REST') && k.includes('URL')) || (k.includes('UPSTASH') && k.endsWith('_URL'))
  )
  const tokenKey = keys.find(
    k => (k.includes('REST') && k.includes('TOKEN')) || (k.includes('UPSTASH') && k.endsWith('_TOKEN'))
  )

  if (urlKey && tokenKey) {
    return { url: process.env[urlKey], token: process.env[tokenKey] }
  }

  return { url: null, token: null }
}

async function runUpstashCommand(url, token, commandArgs) {
  const endpoint = url.replace(/\/+$/, '')
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commandArgs)
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Upstash HTTP ${resp.status}: ${text}`)
  }

  const data = await resp.json()
  if (data && data.error) {
    throw new Error(`Upstash Redis Error: ${data.error}`)
  }
  return data.result
}

export default async function handler(req, res) {
  // 跨域支持
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { url: kvUrl, token: kvToken } = getKvCredentials()

  if (!kvUrl || !kvToken) {
    return res.status(200).json({
      configured: false,
      msg: 'Vercel KV 未配置环境变量 (KV_REST_API_URL / UPSTASH_REDIS_REST_URL)。请确保已绑定并在 Vercel 重新部署。'
    })
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const queryKey = urlObj.searchParams.get('key') || 'main'
  const redisKey = `vocab_sync_${queryKey}`

  try {
    if (req.method === 'GET') {
      const rawResult = await runUpstashCommand(kvUrl, kvToken, ['GET', redisKey])
      if (rawResult) {
        let parsed = rawResult
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed)
          } catch (e) {}
        }
        return res.status(200).json({
          configured: true,
          found: true,
          data: parsed
        })
      }
      return res.status(200).json({
        configured: true,
        found: false,
        msg: '云端数据库中尚无此 key 的数据'
      })
    }

    if (req.method === 'POST') {
      let body = req.body
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body)
        } catch (e) {}
      }

      if (!body || !body.pages) {
        return res.status(400).json({ error: '无效的数据负载，缺少 pages 属性' })
      }

      const payload = {
        version: 4,
        pages: body.pages,
        updatedAt: body.updatedAt || Date.now(),
        clientDeviceId: body.deviceId || 'unknown'
      }

      const strPayload = JSON.stringify(payload)
      const redisResult = await runUpstashCommand(kvUrl, kvToken, ['SET', redisKey, strPayload])

      return res.status(200).json({
        configured: true,
        success: true,
        updatedAt: payload.updatedAt,
        redisResult
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Sync API Error:', err)
    return res.status(500).json({
      configured: true,
      error: err.message || '内部服务错误'
    })
  }
}
