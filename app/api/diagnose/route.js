export async function POST(request) {
  const { scores, missions, shopType, totalScore } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  const systemPrompt = `당신은 소상공인 AI 교육 전문가입니다. 진단 결과를 바탕으로 맞춤형 진단 메시지를 작성해주세요.
반드시 아래 JSON 형식으로만 응답하세요.
{
  "diagnosis": "2줄 진단 메시지. 첫 줄은 위로/격려, 둘째 줄은 의욕 고취. 업종에 맞춘 구체적 표현 사용.",
  "recommendation": "1~2문장의 맞춤 학습 추천. 업종과 약한 미션을 고려한 구체적 제안."
}`;

  const missionResults = missions
    .map((m) => {
      const ms = scores[m.id] || {};
      const mt = Object.values(ms).reduce((s, v) => s + v, 0);
      return `- ${m.title}: ${mt}/3점`;
    })
    .join('\n');

  const userMessage = `[업종] ${shopType || '미입력'}
[총점] ${totalScore}/9점
[미션별 결과]
${missionResults}

이 소상공인에게 맞는 따뜻한 진단 메시지와 학습 추천을 JSON으로 주세요.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await res.json();
    const text = data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    if (!text) {
      return Response.json({ error: 'Empty response' }, { status: 500 });
    }

    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return Response.json(result);
  } catch (e) {
    console.error('Diagnose API error:', e);
    return Response.json({ error: 'API call failed' }, { status: 500 });
  }
}
