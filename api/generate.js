export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, maxTokens = 3000 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: { message: 'プロンプトが指定されていません' } });
    }

    // Anthropic API key（環境変数から取得）
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: { message: 'APIキーが設定されていません' } });
    }

    // Anthropic APIを呼び出し
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ 
        error: { 
          message: data.error?.message || 'API呼び出しに失敗しました' 
        } 
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in generate API:', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || 'サーバーエラーが発生しました' 
      } 
    });
  }
}
