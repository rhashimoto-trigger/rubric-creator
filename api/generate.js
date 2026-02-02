export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'APIキーが設定されていません' } });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',  // ← GPT-5 mini
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
      console.error('OpenAI API error:', data);
      return res.status(response.status).json({ 
        error: { 
          message: data.error?.message || 'API呼び出しに失敗しました' 
        } 
      });
    }

    // レスポンス形式を統一（Anthropic形式に合わせる）
    const formattedData = {
      content: [
        {
          type: 'text',
          text: data.choices[0].message.content
        }
      ]
    };

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error('Error in generate API:', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || 'サーバーエラーが発生しました' 
      } 
    });
  }
}
