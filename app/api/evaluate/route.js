export async function POST(request) {
  const { mission, userInput, shopType } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  const criteriaDesc = mission.evaluationCriteria
    .map((c) => `- ${c.key}: ${c.label} (${c.desc})`)
    .join('\n');

  const systemPrompt = `당신은 소상공인 AI 교육 전문가입니다. 사용자가 AI에게 보낸 프롬프트(또는 답변)를 평가해주세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "scores": { "criteria1_key": 0 or 1, "criteria2_key": 0 or 1, "criteria3_key": 0 or 1 },
  "feedback": "2~3문장의 따뜻한 피드백. 잘한 점 먼저, 개선점은 구체적 예시와 함께.",
  "improved_example": "이렇게 쓰면 더 좋았을 예시 프롬프트"
}`;

  const userMessage = `[미션] ${mission.title}
[시나리오] ${mission.scenario}
[평가기준]
${criteriaDesc}
[사용자 업종] ${shopType || '미입력'}
[사용자 입력]
${userInput}

위 평가기준 각각에 대해 0(미충족) 또는 1(충족)로 점수를 매기고, 피드백과 개선 예시를 JSON으로 주세요.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
    console.error('Evaluate API error:', e);
    return Response.json({ error: 'API call failed' }, { status: 500 });
  }
}
