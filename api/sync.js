// Vercel Serverless Function: /api/sync
// 支持 Vercel KV (Upstash Redis) 云端多设备持久化同步

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

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!kvUrl || !kvToken) {
    return res.status(200).json({
      configured: false,
      msg: 'Vercel KV 未配置环境变量 (KV_REST_API_URL / KV_REST_API_TOKEN)。请在 Vercel 控制台 Storage 绑定 KV 数据库。'
    })
  }

  // 同步 key，默认 notebook_main_sync
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const queryKey = urlObj.searchParams.get('key') || 'default'
  const redisKey = `vocab_sync_${queryKey}`

  try {
    if (req.method === 'GET') {
      const resp = await fetch(`${kvUrl}/get/${encodeURIComponent(redisKey)}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      })
      const data = await resp.json()
      if (data && data.result) {
        let parsed = data.result
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
        msg: '云端尚无此 key 的数据'
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
        return res.status(400).json({ error: '无效的数据负载' })
      }

      const payload = {
        pages: body.pages,
        updatedAt: body.updatedAt || Date.now(),
        clientDeviceId: body.deviceId || 'unknown'
      }

      const resp = await fetch(`${kvUrl}/set/${encodeURIComponent(redisKey)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await resp.json()
      return res.status(200).json({
        configured: true,
        success: true,
        updatedAt: payload.updatedAt,
        result
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Sync API Error:', err)
    return res.status(500).json({ error: err.message || '内部服务错误' })
  }
}
