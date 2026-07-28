export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.',
        details: data
      });
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts.map(p => p.text).join('');
      return res.status(200).json({ text: generatedText });
    } else {
      return res.status(500).json({ error: '올바르지 않은 응답 형식입니다.' });
    }
  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류 발생', details: error.message });
  }
}
