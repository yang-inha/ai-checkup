// ─── 규칙 기반 평가 엔진 v2 ───
// 점수: 규칙 기반 (키워드·패턴 매칭) → 애매하면 AI 위임
// 설명: AI가 판정 근거 + 개선 예시 생성

// ─── 키워드 사전 ───
const RULES = {
  // 미션 1: 가게 소개글
  1: {
    specificity: {
      // 4개 카테고리 중 2개 이상이면 1점
      categories: {
        shopName: ['가게', '매장', '점', '식당', '카페', '가맹', '상호', '이름', '호점', '본점'],
        menu: ['메뉴', '음식', '요리', '떡볶이', '커피', '치킨', '국수', '삼겹살', '피자', '빵', '케이크', '디저트', '라떼', '아메리카노', '김밥', '순대', '튀김', '냉면', '찌개', '비빔밥', '햄버거', '샌드위치', '파스타', '스테이크', '초밥', '라멘', '분식', '한식', '중식', '양식', '일식'],
        location: ['동', '시', '구', '읍', '면', '리', '로', '길', '위치', '근처', '앞', '옆', '건너편', '지하철', '버스', '제주', '서울', '부산', '노형', '연동', '이도', '삼도', '중앙', '시장', '골목'],
        customer: ['젊은', '학생', '가족', '직장인', '관광객', '동네', '주민', '20대', '30대', '40대', '50대', '60대', '어르신', '시니어', '아이', '아기', '엄마', '여성', '남성', '커플', '단체', '혼밥', '혼술', '맛집', '단골'],
      },
      threshold: 2,
    },
    context: {
      keywords: ['네이버', '인스타', '인스타그램', '소개', '홍보', '플레이스', '블로그', '카카오', '배민', '배달의민족', '요기요', '쿠팡이츠', '당근', '당근마켓', 'sns', 'SNS', '포스팅', '게시글', '리뷰', '광고', '전단', '홈페이지'],
    },
    resultCondition: {
      keywords: ['자', '줄', '짧', '길', '분량', '톤', '느낌', '따뜻', '친근', '정중', '유쾌', '센스', '재미', '감성', '깔끔', '간결', '전문', '캐주얼', '격식', '반말', '존댓말', '이모티콘', '해시태그', '문장', '단어'],
    },
  },
  // 미션 2: 리뷰 답글
  2: {
    original_content: {
      // 리뷰 원문 관련 키워드 2개 이상
      keywords: ['맛있', '맛이', '서비스', '느리', '느렸', '바쁜', '바빠', '음식', '리뷰', '손님', '고객', '별점', '평가', '후기'],
      threshold: 2,
    },
    tone: {
      keywords: ['톤', '진정', '진심', '정중', '친근', '따뜻', '과하지', '겸손', '느낌', '분위기', '스타일', '정성', '예의', '격식', '부드럽', '자연스럽'],
    },
    direction: {
      keywords: ['사과', '감사', '개선', '노력', '죄송', '칭찬', '반성', '보완', '시정', '약속', '인정', '수용', '공감', '이해', '환영', '재방문', '다시'],
    },
  },
  // 미션 3: AI 답변 판별
  3: {
    doubt: {
      // 버튼 선택 or 텍스트에서 의심 표현
      positiveChoices: ['no', 'partially'],
      keywords: ['아니', '못 믿', '거짓', '과장', '위험', '글쎄', '조심', '확인', '의심', '가짜', '허위', '부정확', '잘못', '오류', '틀릴', '틀린', '엉터리', '뻥', '거품'],
    },
    fact_check: {
      keywords: ['확인', '검증', '검색', '통계', '출처', '데이터', '근거', '알아봐', '알아보', '찾아', '조사', '비교', '공식', '뉴스', '기사', '정부', '논문', '자료', '증거', '팩트', '사실'],
    },
    risk_awareness: {
      keywords: ['보장', '위험', '무조건', '과장', '틀릴', '조심', '함부로', '섣부', '맹신', '맹목', '의존', '리스크', '실패', '손해', '피해', '주의', '경계', '신중', '성급'],
    },
  },
};

// ─── 규칙 기반 판정 함수 ───
function evaluateByRules(missionId, input, criticalChoice) {
  const rules = RULES[missionId];
  if (!rules) return {};

  const lower = input.toLowerCase();
  const results = {};

  for (const [criteriaKey, rule] of Object.entries(rules)) {
    if (missionId === 3 && criteriaKey === 'doubt') {
      // 미션3 의심능력: 버튼 + 키워드 복합 판정
      const choiceOk = rule.positiveChoices.includes(criticalChoice);
      const keywordOk = rule.keywords.some(kw => lower.includes(kw));
      if (choiceOk || keywordOk) {
        results[criteriaKey] = { score: 1, method: 'rule' };
      } else if (criticalChoice === 'yes' && !keywordOk) {
        results[criteriaKey] = { score: 0, method: 'rule' };
      } else {
        results[criteriaKey] = { score: null, method: 'ambiguous' };
      }
      continue;
    }

    if (rule.categories) {
      // 카테고리 기반 (미션1 구체적 정보)
      let matched = 0;
      for (const [catName, catKeywords] of Object.entries(rule.categories)) {
        if (catKeywords.some(kw => lower.includes(kw))) matched++;
      }
      if (matched >= rule.threshold) {
        results[criteriaKey] = { score: 1, method: 'rule', matchedCategories: matched };
      } else if (matched === 0) {
        results[criteriaKey] = { score: 0, method: 'rule', matchedCategories: 0 };
      } else {
        results[criteriaKey] = { score: null, method: 'ambiguous', matchedCategories: matched };
      }
    } else if (rule.keywords) {
      // 키워드 매칭
      const threshold = rule.threshold || 1;
      const matchCount = rule.keywords.filter(kw => lower.includes(kw)).length;
      if (matchCount >= threshold) {
        results[criteriaKey] = { score: 1, method: 'rule', matchCount };
      } else if (matchCount === 0) {
        results[criteriaKey] = { score: 0, method: 'rule', matchCount: 0 };
      } else {
        results[criteriaKey] = { score: null, method: 'ambiguous', matchCount };
      }
    }
  }

  return results;
}

// ─── AI 위임: 애매한 항목만 판정 요청 ───
async function resolveAmbiguous(apiKey, mission, userInput, shopType, ambiguousItems) {
  const itemsDesc = ambiguousItems.map(([key, info]) => {
    const criteria = mission.evaluationCriteria.find(c => c.key === key);
    return `- ${key}: ${criteria?.label || key} (${criteria?.desc || ''})`;
  }).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `사용자가 다음 미션에 대해 입력한 내용을 평가해주세요.

[미션] ${mission.title}
[사용자 업종] ${shopType || '미입력'}
[사용자 입력] ${userInput}

아래 항목에 대해서만 0(미충족) 또는 1(충족)로 판정해주세요.
${itemsDesc}

반드시 JSON으로만 응답하세요: {"${ambiguousItems.map(([k]) => k).join('": 0, "')}": 0}`
      }],
    }),
  });

  if (!res.ok) return {};
  const data = await res.json();
  const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}

// ─── AI 설명 생성: 확정된 점수 기반 ───
async function generateExplanation(apiKey, mission, userInput, shopType, finalScores) {
  const scoreDesc = mission.evaluationCriteria.map(c => {
    const s = finalScores[c.key];
    return `- ${c.label}: ${s === 1 ? '충족(1점)' : '미충족(0점)'} — 기준: ${c.desc}`;
  }).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `당신은 소상공인 AI 교육 코치입니다. 아래 평가 결과를 바탕으로 피드백을 작성해주세요.

[미션] ${mission.title}
[사용자 업종] ${shopType || '미입력'}
[사용자 입력] ${userInput}

[평가 결과]
${scoreDesc}

반드시 아래 JSON으로만 응답하세요:
{
  "feedback": "2~3문장. 잘한 점 먼저 언급하고, 미충족 항목은 왜 중요한지 짧게 설명. 업종에 맞춘 표현 사용.",
  "improved_example": "같은 상황에서 이렇게 쓰면 좋았을 예시 프롬프트. 사용자 업종 반영."
}`
      }],
    }),
  });

  if (!res.ok) return { feedback: '', improved_example: '' };
  const data = await res.json();
  const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { feedback: '피드백 생성에 실패했습니다.', improved_example: '' };
  }
}

// ─── 메인 핸들러 ───
export async function POST(request) {
  try {
    const { mission, userInput, shopType, criticalChoice } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // 1단계: 규칙 기반 판정
    const ruleResults = evaluateByRules(mission.id, userInput, criticalChoice);

    // 2단계: 애매한 항목 추출
    const ambiguousItems = Object.entries(ruleResults).filter(([, v]) => v.score === null);
    let aiScores = {};

    if (ambiguousItems.length > 0) {
      // 애매한 항목만 AI에게 위임
      aiScores = await resolveAmbiguous(apiKey, mission, userInput, shopType, ambiguousItems);
    }

    // 3단계: 최종 점수 확정
    const finalScores = {};
    for (const [key, result] of Object.entries(ruleResults)) {
      if (result.score !== null) {
        finalScores[key] = result.score;
      } else {
        finalScores[key] = aiScores[key] !== undefined ? aiScores[key] : 0;
      }
    }

    // 4단계: AI 설명 생성 (확정된 점수 기반)
    const explanation = await generateExplanation(apiKey, mission, userInput, shopType, finalScores);

    return Response.json({
      scores: finalScores,
      feedback: explanation.feedback || '',
      improved_example: explanation.improved_example || '',
      _debug: {
        ruleResults,
        ambiguousCount: ambiguousItems.length,
        aiResolved: Object.keys(aiScores),
      },
    });
  } catch (e) {
    console.error('Evaluate error:', e.message, e.stack);
    return Response.json({ error: 'Server error', detail: e.message }, { status: 500 });
  }
}
