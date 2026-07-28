import { parseStringPromise } from 'xml2js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const dataGoKey = process.env.DATA_GO_KR_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const { prompt, image } = req.body;

    // 1. 공공데이터포털 복지서비스 Open API 호출
    let publicWelfareDataText = "";
    if (dataGoKey) {
      try {
        const publicApiUrl = `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001?serviceKey=${encodeURIComponent(dataGoKey)}&callTp=L&pageNo=1&numOfRows=10`;
        const apiRes = await fetch(publicApiUrl);
        const xmlText = await apiRes.text();
        
        const parsedXml = await parseStringPromise(xmlText);
        
        if (parsedXml && parsedXml.wantedList && parsedXml.wantedList.servList) {
          const list = parsedXml.wantedList.servList;
          publicWelfareDataText = list.map(item => {
            const name = item.servNm ? item.servNm[0] : '';
            const desc = item.servDgst ? item.servDgst[0] : '';
            const url = item.servDtlLink ? item.servDtlLink[0] : '';
            return `- 정책명: ${name}\n  설명: ${desc}\n  링크: ${url}`;
          }).join('\n\n');
        }
      } catch (e) {
        console.warn("공공데이터 API 호출 실패 (Gemini 단독 모드로 계속 진행):", e.message);
      }
    }

    // 2. Gemini API 요청 본문 구성
    const contents = [];
    const parts = [];

    if (image) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: image
        }
      });
    }

    let finalPrompt = prompt;
    if (publicWelfareDataText) {
      finalPrompt = `[실시간 공공데이터포털 복지 서비스 참고 정보]\n${publicWelfareDataText}\n\n[사용자 요청]\n${prompt}`;
    }

    if (finalPrompt) {
      parts.push({
        text: finalPrompt
      });
    }

    contents.push({ parts });

    // 3. Gemini API 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts.map(p => p.text).join('');
      return res.status(200).json({ 
        text: generatedText,
        hasPublicData: Boolean(publicWelfareDataText)
      });
    } else {
      return res.status(500).json({ error: 'Gemini API 응답 형식이 올바르지 않습니다.', raw: data });
    }
  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류 발생', details: error.message });
  }
}
