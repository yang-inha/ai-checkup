'use client';
import { useState, useRef, useEffect } from 'react';

// ─── 미션 데이터 ───
const MISSIONS = [
  {
    id: 1,
    title: '우리 가게 소개글 만들기',
    icon: '🏪',
    scenario:
      "네이버 플레이스에 올릴 '가게 소개글'을 AI에게 부탁해보세요. 어떤 가게인지, 뭘 잘하는지, 어디에 쓸 건지 AI에게 알려주세요.",
    hint: '가게 이름, 대표 메뉴, 위치, 분위기 등을 알려주면 AI가 더 잘 써줄 수 있어요. 오탈자는 걱정하지 않아도 돼요!',
    evaluationCriteria: [
      { key: 'specificity', label: '구체적 정보 포함', desc: '가게명, 메뉴, 위치 등 구체적 정보가 있는지' },
      { key: 'context', label: '맥락 제공', desc: '어디에 쓸 건지(네이버, 인스타 등) 용도를 밝혔는지' },
      { key: 'length', label: '결과물 조건 제시', desc: '분량, 톤앤매너, 느낌 등 원하는 결과물의 조건이 있는지' },
    ],
  },
  {
    id: 2,
    title: '손님 리뷰에 답글 쓰기',
    icon: '💬',
    scenario:
      '손님이 이런 리뷰를 남겼습니다:\n"음식은 맛있는데 서비스가 좀 느렸어요. 바쁜 시간이라 그런 것 같긴 한데..."\n\nAI에게 이 리뷰에 대한 사장님 답글을 부탁해보세요.',
    hint: "위에 있는 손님 리뷰를 복사해서 AI에게 붙여넣기 하거나, 직접 따라 적어주세요. 오탈자는 걱정하지 않아도 돼요! 그리고 '이 리뷰에 대한 답글을 써줘'라고 부탁하면 됩니다. 어떤 느낌(정중하게, 따뜻하게 등)으로 쓰고 싶은지도 함께 말해주면 더 좋아요!",
    evaluationCriteria: [
      { key: 'original_content', label: '원본 리뷰 전달', desc: '리뷰 내용을 AI에게 보여줬는지' },
      { key: 'tone', label: '원하는 톤 설명', desc: '어떤 느낌으로 쓸지 말했는지' },
      { key: 'direction', label: '방향성 제시', desc: '사과, 감사, 개선 등 방향을 제시했는지' },
    ],
  },
  {
    id: 3,
    title: 'AI 답변 판별하기',
    icon: '🔍',
    scenario:
      'AI에게 "제주도에서 장사가 제일 잘 되는 업종이 뭐야?"라고 물었더니 아래처럼 답했습니다. 이 답변을 믿고 바로 사업을 시작해도 될까요?',
    aiResponse:
      '제주도에서 가장 장사가 잘 되는 업종은 카페입니다. 제주도의 관광객 수가 매년 1,500만 명을 넘기 때문에, 관광지 근처에 카페를 열면 월 매출 3,000만 원 이상을 기대할 수 있습니다. 특히 한라봉 주스나 흑돼지 버거 같은 특산품 메뉴를 넣으면 성공이 거의 보장됩니다.',
    hint: "AI 답변이 항상 맞는 것은 아니에요. 숫자나 '보장된다'는 표현을 주의 깊게 살펴보세요.",
    evaluationCriteria: [
      { key: 'doubt', label: '의심 능력', desc: 'AI 답변을 무조건 믿지 않는지' },
      { key: 'fact_check', label: '팩트체크 인식', desc: '검증이 필요하다고 인식하는지' },
      { key: 'risk_awareness', label: '위험 인식', desc: '사업 결정에 AI만 의존하면 안 된다는 인식이 있는지' },
    ],
  },
];

const LEVEL_DEFAULTS = [
  { min: 0, max: 3, level: '씨앗 단계 🌱', color: '#e67e22' },
  { min: 4, max: 6, level: '새싹 단계 🌿', color: '#27ae60' },
  { min: 7, max: 9, level: '열매 단계 🍎', color: '#2980b9' },
];

// ─── API 호출 (서버 라우트 경유) ───
async function evaluateWithAPI(mission, userInput, shopType) {
  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission, userInput, shopType }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function diagnoseWithAPI(scores, missions, shopType, totalScore) {
  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores, missions, shopType, totalScore }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ─── 점수 게이지 ───
function ScoreGauge({ score, max = 9, color }) {
  const pct = (score / max) * 100;
  return (
    <div style={{ textAlign: 'center', margin: '24px 0' }}>
      <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
        <svg viewBox="0 0 160 160" width="160" height="160">
          <circle cx="80" cy="80" r="65" fill="none" stroke="#e8e8e8" strokeWidth="14" />
          <circle cx="80" cy="80" r="65" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={`${pct * 4.08} 408`} transform="rotate(-90 80 80)"
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color }}>{score}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: -4 }}>/ {max}점</div>
        </div>
      </div>
    </div>
  );
}

// ─── 로딩 애니메이션 ───
function LoadingProgress({ messages }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setMsgIdx(0);
    timerRef.current = setInterval(() => {
      setMsgIdx((prev) => prev < messages.length - 1 ? prev + 1 : prev);
    }, 2500);
    return () => clearInterval(timerRef.current);
  }, [messages]);

  const progress = ((msgIdx + 1) / messages.length) * 100;

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-block', width: 48, height: 48, border: '4px solid #e8e4dc',
          borderTop: '4px solid #1a5c3a', borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
      </div>
      <div style={{ fontSize: 16, color: '#444', fontWeight: 700, marginBottom: 12, minHeight: 24 }}>
        {messages[msgIdx]}
      </div>
      <div style={{ width: '80%', height: 6, background: '#e8e4dc', borderRadius: 3, margin: '0 auto' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#1a5c3a', borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>잠시만 기다려주세요</div>
    </div>
  );
}

// ═══════════════════════════════════════
// ─── 메인 컴포넌트 ───
// ═══════════════════════════════════════
export default function AICheckup() {
  const [phase, setPhase] = useState('intro');
  const [currentMission, setCurrentMission] = useState(0);
  const [userInputs, setUserInputs] = useState({});
  const [scores, setScores] = useState({});
  const [aiFeedbacks, setAiFeedbacks] = useState({});
  const [showExample, setShowExample] = useState(false);
  const [shopType, setShopType] = useState('');
  const [customDiagnosis, setCustomDiagnosis] = useState(null);
  const [practiceText, setPracticeText] = useState('');
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [showPractice, setShowPractice] = useState(false);

  const mission = MISSIONS[currentMission];
  const totalScore = Object.values(scores).reduce(
    (sum, ms) => sum + Object.values(ms).reduce((s, v) => s + v, 0), 0
  );
  const levelInfo = LEVEL_DEFAULTS.find((l) => totalScore >= l.min && totalScore <= l.max) || LEVEL_DEFAULTS[0];

  // ─── 스타일 ───
  const containerStyle = {
    maxWidth: 520, margin: '0 auto', minHeight: '100vh',
    background: 'linear-gradient(160deg, #faf9f6 0%, #f0ede6 100%)',
  };
  const cardStyle = {
    background: '#fff', borderRadius: 20, padding: '28px 24px',
    margin: '0 16px', boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
  };
  const btnPrimary = {
    background: '#1a5c3a', color: '#fff', border: 'none', borderRadius: 14,
    padding: '16px 32px', fontSize: 17, fontWeight: 700, cursor: 'pointer',
    width: '100%', boxShadow: '0 4px 16px rgba(26,92,58,0.25)',
  };
  const btnSecondary = {
    ...btnPrimary, background: '#f5f0e8', color: '#1a5c3a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };
  const textareaStyle = {
    width: '100%', minHeight: 120, border: '2px solid #e8e4dc', borderRadius: 14,
    padding: 16, fontSize: 15, fontFamily: "'Noto Sans KR', sans-serif",
    resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
  };

  // ─── 미션 제출 ───
  async function handleSubmit() {
    const input = userInputs[mission.id] || '';
    if (input.trim().length < 1 && !userInputs.criticalChoice) return;

    setPhase('loading_mission');

    let evalInput = input;
    if (mission.id === 3) {
      const choice = userInputs.criticalChoice || '미선택';
      const choiceLabel = { yes: '네, 바로 시작', partially: '일부만 참고', no: '아니요, 위험해요', '미선택': '버튼 미선택' };
      evalInput = `[선택] ${choiceLabel[choice] || choice}\n[이유] ${input}`;
    }

    const result = await evaluateWithAPI(mission, evalInput, shopType);

    if (result && !result.error) {
      setScores((prev) => ({ ...prev, [mission.id]: result.scores || {} }));
      setAiFeedbacks((prev) => ({ ...prev, [mission.id]: result }));
    } else {
      const fallback = {};
      mission.evaluationCriteria.forEach((c) => { fallback[c.key] = 0; });
      setScores((prev) => ({ ...prev, [mission.id]: fallback }));
      setAiFeedbacks((prev) => ({
        ...prev, [mission.id]: {
          feedback: 'AI 분석이 일시적으로 불가능합니다. 결과는 참고용으로 봐주세요.',
          improved_example: '',
        },
      }));
    }

    setPhase('review');
  }

  // ─── 최종 결과 ───
  async function goToResult() {
    setPhase('loading_result');
    const diagnosis = await diagnoseWithAPI(scores, MISSIONS, shopType, totalScore);
    if (diagnosis && !diagnosis.error) {
      setCustomDiagnosis(diagnosis);
    }
    setPhase('result');
  }

  function handleNext() {
    if (currentMission < MISSIONS.length - 1) {
      setCurrentMission((prev) => prev + 1);
      setPhase('mission');
      setShowExample(false);
      setPracticeText('');
      setPracticeSubmitted(false);
      setShowPractice(false);
    } else {
      goToResult();
    }
  }

  // ═══ INTRO ═══
  if (phase === 'intro') {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '48px 16px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🩺</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.4, margin: '8px 0 4px' }}>
            소상공인 AI활용 체크업
          </h1>
          <p style={{ color: '#777', fontSize: 14, margin: 0 }}>AI 활용수준 진단 및 맞춤교육 추천</p>
        </div>
        <div style={cardStyle}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#1a5c3a', fontSize: 15 }}>📋 이 진단은 설문이 아닙니다</p>
          <p style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.8, color: '#444' }}>
            &quot;잘할 수 있다 / 없다&quot;를 묻는 대신,<br />
            <strong>실제로 AI에게 말을 걸어보는</strong> 3가지 미션을 드립니다.
          </p>
          <div style={{ margin: '0 0 16px' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', display: 'block', marginBottom: 8 }}>
              🏪 어떤 가게를 운영하고 계세요? (선택)
            </label>
            <input type="text" placeholder="예: 분식집, 카페, 미용실, 옷가게..."
              value={shopType} onChange={(e) => setShopType(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #e8e4dc', borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>입력하시면 업종에 맞는 맞춤 피드백을 받을 수 있어요!</div>
          </div>
          <div style={{ background: '#faf8f4', borderRadius: 12, padding: '16px 18px', margin: '0 0 16px', borderLeft: '4px solid #1a5c3a' }}>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700 }}>미션 1.</span> 가게 소개글 만들기<br />
              <span style={{ fontWeight: 700 }}>미션 2.</span> 손님 리뷰 답글 쓰기<br />
              <span style={{ fontWeight: 700 }}>미션 3.</span> AI 답변 판별하기
            </div>
          </div>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#999' }}>⏱ 약 5~10분 소요 · 정답이 없으니 편하게 해보세요!</p>
          <button style={btnPrimary} onClick={() => { setPhase('mission'); setCurrentMission(0); }}>
            진단 시작하기
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', margin: '24px 0' }}>
          AI융합연구소 · 소상공인 AI활용 체크업 v2.0
        </p>
      </div>
    );
  }

  // ═══ MISSION ═══
  if (phase === 'mission') {
    const isCritical = mission.id === 3;
    return (
      <div style={containerStyle}>
        <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>미션 {currentMission + 1} / {MISSIONS.length}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {MISSIONS.map((_, i) => (
              <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= currentMission ? '#1a5c3a' : '#ddd' }} />
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', margin: '0 0 16px' }}>
            <span style={{ fontSize: 40 }}>{mission.icon}</span>
            <h2 style={{ fontSize: 21, fontWeight: 800, margin: '8px 0 0' }}>{mission.title}</h2>
          </div>
          <div style={{ background: '#f8f6f1', borderRadius: 14, padding: '18px 16px', margin: '0 0 20px', fontSize: 14, lineHeight: 1.8, color: '#444', whiteSpace: 'pre-line' }}>
            {mission.scenario}
          </div>

          {isCritical && mission.aiResponse && (
            <div style={{ background: '#eef6ff', borderRadius: 14, padding: '18px 16px', margin: '0 0 16px', border: '1px solid #c8ddf5' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3a7bd5', marginBottom: 8 }}>🤖 AI의 답변</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#333' }}>{mission.aiResponse}</div>
            </div>
          )}

          {!isCritical ? (
            <>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', display: 'block', marginBottom: 8 }}>✍️ AI에게 보낼 메시지를 작성해보세요</label>
              <textarea style={textareaStyle} placeholder="여기에 AI에게 할 말을 써보세요..."
                value={userInputs[mission.id] || ''} onChange={(e) => setUserInputs((p) => ({ ...p, [mission.id]: e.target.value }))} />
            </>
          ) : (
            <>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', display: 'block', marginBottom: 8 }}>🤔 이 답변을 믿고 바로 행동해도 될까요?</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'yes', label: '네, 바로 시작!', emoji: '👍' },
                  { key: 'partially', label: '일부만 참고', emoji: '🤔' },
                  { key: 'no', label: '아니요, 위험해요', emoji: '🚫' },
                ].map((opt) => (
                  <button key={opt.key} onClick={() => setUserInputs((p) => ({ ...p, criticalChoice: opt.key }))}
                    style={{
                      flex: 1, padding: '14px 8px',
                      border: userInputs.criticalChoice === opt.key ? '2px solid #1a5c3a' : '2px solid #e8e4dc',
                      borderRadius: 12, background: userInputs.criticalChoice === opt.key ? '#eaf5ee' : '#fff',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#333',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</div>{opt.label}
                  </button>
                ))}
              </div>
              <textarea style={{ ...textareaStyle, minHeight: 80 }} placeholder="왜 그렇게 생각하셨나요? 자유롭게 써보세요..."
                value={userInputs[mission.id] || ''} onChange={(e) => setUserInputs((p) => ({ ...p, [mission.id]: e.target.value }))} />
            </>
          )}

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <button style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}
              onClick={() => setShowExample(!showExample)}>
              {showExample ? '▲ 힌트 닫기' : '💡 힌트 보기'}
            </button>
            {showExample && (
              <div style={{ background: '#fffbf0', borderRadius: 12, padding: '14px 16px', marginTop: 8, border: '1px solid #f0e6cc' }}>
                <div style={{ fontSize: 13, color: '#b8860b', lineHeight: 1.7 }}>{mission.hint}</div>
              </div>
            )}
          </div>

          <button style={{ ...btnPrimary, opacity: (userInputs[mission.id] || '').trim().length < 1 && !userInputs.criticalChoice ? 0.4 : 1 }}
            onClick={handleSubmit} disabled={(userInputs[mission.id] || '').trim().length < 1 && !userInputs.criticalChoice}>
            제출하기
          </button>
        </div>
      </div>
    );
  }

  // ═══ LOADING (미션) ═══
  if (phase === 'loading_mission') {
    const msgs = {
      1: ['📝 소개글 내용을 읽고 있어요...', '🏪 가게 정보가 잘 담겼는지 확인 중...', '💡 맞춤 피드백을 준비하고 있어요...', '✨ 거의 다 됐어요!'],
      2: ['📝 답글 내용을 읽고 있어요...', '💬 리뷰 대응 방식을 분석 중...', '💡 더 좋은 답글 팁을 준비 중이에요...', '✨ 거의 다 됐어요!'],
      3: ['📝 판별 내용을 읽고 있어요...', '🔍 비판적 사고력을 분석 중...', '💡 AI 활용 팁을 정리하고 있어요...', '✨ 거의 다 됐어요!'],
    };
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, margin: '60px 16px' }}>
          <LoadingProgress messages={msgs[mission.id] || msgs[1]} />
        </div>
      </div>
    );
  }

  // ═══ LOADING (최종) ═══
  if (phase === 'loading_result') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, margin: '60px 16px' }}>
          <LoadingProgress messages={[
            '📊 세 가지 미션 결과를 종합하고 있어요...',
            '🏪 업종에 맞는 진단을 작성 중이에요...',
            '📋 맞춤 학습 방향을 정리하고 있어요...',
            '🎯 진단서가 거의 완성됐어요!',
          ]} />
        </div>
      </div>
    );
  }

  // ═══ REVIEW ═══
  if (phase === 'review') {
    const missionScore = scores[mission.id] || {};
    const fb = aiFeedbacks[mission.id] || {};
    const missionTotal = Object.values(missionScore).reduce((s, v) => s + v, 0);

    return (
      <div style={containerStyle}>
        <div style={{ padding: '24px 16px 12px' }}>
          <div style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>미션 {currentMission + 1} 결과</div>
        </div>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{mission.icon}</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{mission.title}</h2>
            <div style={{ fontSize: 32, fontWeight: 800, margin: '8px 0',
              color: missionTotal === 3 ? '#27ae60' : missionTotal >= 2 ? '#e67e22' : '#e74c3c' }}>
              {missionTotal} / 3점
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            {mission.evaluationCriteria.map((c, i) => {
              const passed = missionScore[c.key] === 1;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px',
                  background: passed ? '#eafaf1' : '#fef5f0', borderRadius: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 20, marginRight: 12 }}>{passed ? '✅' : '💭'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{c.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {fb.feedback && (
            <div style={{ background: '#f8f6f1', borderRadius: 14, padding: '18px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', marginBottom: 10 }}>🤖 AI 코치의 피드백</div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{fb.feedback}</div>
            </div>
          )}

          {fb.improved_example && (
            <div style={{ background: '#f0f8f3', borderRadius: 14, padding: '18px 16px', marginBottom: 16, border: '1px solid #c8e6c9' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#27ae60', marginBottom: 8 }}>✨ 이렇게 써보면 어떨까요?</div>
              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7, fontStyle: 'italic' }}>
                &quot;{fb.improved_example}&quot;
              </div>
            </div>
          )}

          {/* 연습 구간 */}
          {fb.improved_example && !showPractice && !practiceSubmitted && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button style={{ ...btnPrimary, background: '#f0f8f3', color: '#1a5c3a', boxShadow: '0 2px 8px rgba(26,92,58,0.1)', border: '2px solid #c8e6c9', flex: 1 }}
                onClick={() => setShowPractice(true)}>
                ✍️ 한번 따라 써볼까요?
              </button>
              <button style={{ ...btnSecondary, flex: 1 }} onClick={handleNext}>
                {currentMission < MISSIONS.length - 1 ? '다음 미션으로 →' : '최종 결과 보기 →'}
              </button>
            </div>
          )}

          {showPractice && !practiceSubmitted && (
            <div style={{ background: '#fefcf7', borderRadius: 14, padding: '18px 16px', marginBottom: 16, border: '2px solid #e8e4dc' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', marginBottom: 10 }}>
                ✍️ 위의 예시를 참고해서, 나만의 버전으로 한번 써보세요!
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>1~2줄이면 충분해요. 채점 없으니 부담 갖지 마세요!</div>
              <textarea style={{ ...textareaStyle, minHeight: 70, borderColor: '#d4edda' }}
                placeholder={fb.improved_example ? fb.improved_example.slice(0, 30) + '...' : '자유롭게 써보세요...'}
                value={practiceText} onChange={(e) => setPracticeText(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={{ ...btnPrimary, flex: 1, opacity: practiceText.trim().length < 1 ? 0.4 : 1 }}
                  disabled={practiceText.trim().length < 1} onClick={() => setPracticeSubmitted(true)}>
                  완료!
                </button>
                <button style={{ ...btnSecondary, flex: 1 }} onClick={() => { setShowPractice(false); handleNext(); }}>
                  건너뛰기
                </button>
              </div>
            </div>
          )}

          {practiceSubmitted && (
            <div style={{ background: '#f0f8f3', borderRadius: 14, padding: '20px 16px', marginBottom: 16, textAlign: 'center', border: '2px solid #c8e6c9' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👏</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a5c3a', marginBottom: 6 }}>잘했어요! 바로 이 감각이에요.</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                AI에게 내 상황을 구체적으로 알려줄수록<br />더 좋은 답변을 받을 수 있다는 걸 기억해두세요!
              </div>
            </div>
          )}

          {(!fb.improved_example || practiceSubmitted) && (
            <button style={btnPrimary} onClick={handleNext}>
              {currentMission < MISSIONS.length - 1 ? '다음 미션으로' : '최종 결과 보기'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══ RESULT ═══
  if (phase === 'result') {
    const diagMsg = customDiagnosis?.diagnosis || '진단이 완료되었습니다.\n아래 미션별 결과를 확인해보세요.';
    const recMsg = customDiagnosis?.recommendation || 'AI 기초 대화법부터 시작해보세요.';

    return (
      <div style={containerStyle}>
        <div style={{ padding: '40px 16px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>AI활용 체크업 결과</h1>
          {shopType && <p style={{ fontSize: 14, color: '#888', margin: '4px 0 0' }}>업종: {shopType}</p>}
        </div>
        <div style={cardStyle}>
          <ScoreGauge score={totalScore} color={levelInfo.color} />
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: levelInfo.color, marginBottom: 8 }}>
            {levelInfo.level}
          </div>
          <div style={{ background: '#f8f6f1', borderRadius: 14, padding: '20px 18px', margin: '16px 0 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, color: '#444', lineHeight: 1.8, fontWeight: 600 }}>
              {diagMsg.split('\n').map((line, i) => (<span key={i}>{line}{i === 0 && <br />}</span>))}
            </div>
          </div>
          <div style={{ borderRadius: 14, padding: '20px 18px', margin: '0 0 20px', border: '2px solid #1a5c3a', background: '#f0f8f3' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', marginBottom: 8 }}>📚 추천 학습 방향</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.7 }}>{recMsg}</div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 12 }}>미션별 상세 결과</div>
          {MISSIONS.map((m, i) => {
            const ms = scores[m.id] || {};
            const mt = Object.values(ms).reduce((s, v) => s + v, 0);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#fafaf8', borderRadius: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{m.title}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: mt === 3 ? '#27ae60' : mt >= 2 ? '#e67e22' : '#e74c3c' }}>{mt}/3</div>
              </div>
            );
          })}

          <button style={{ ...btnSecondary, marginTop: 20, marginBottom: 10, background: '#fff8f0', color: '#b8860b', border: '2px solid #f0e6cc' }}
            onClick={() => setPhase('certificate')}>
            📄 나의 진단서 보기
          </button>
          <button style={{ ...btnPrimary, marginBottom: 10 }} onClick={() => {
            const failedIdx = MISSIONS.findIndex((m) => {
              const ms = scores[m.id] || {};
              return Object.values(ms).reduce((s, v) => s + v, 0) < 2;
            });
            if (failedIdx >= 0) {
              setCurrentMission(failedIdx); setPhase('mission'); setShowExample(false);
              setPracticeText(''); setPracticeSubmitted(false); setShowPractice(false);
              setScores((p) => { const n = { ...p }; delete n[MISSIONS[failedIdx].id]; return n; });
            }
          }}>
            아쉬운 미션 다시 도전하기
          </button>
          <button style={btnSecondary} onClick={() => {
            setPhase('intro'); setCurrentMission(0); setUserInputs({}); setScores({});
            setAiFeedbacks({}); setShowExample(false); setCustomDiagnosis(null);
            setPracticeText(''); setPracticeSubmitted(false); setShowPractice(false);
          }}>
            처음부터 새로 시작하기
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', margin: '20px 0 0' }}>
            사단법인 AI융합연구소 · 소상공인 AI활용 체크업 v2.0<br />jejuailab.com
          </p>
        </div>
      </div>
    );
  }

  // ═══ CERTIFICATE ═══
  if (phase === 'certificate') {
    const diagMsg = customDiagnosis?.diagnosis || '진단이 완료되었습니다.';
    const recMsg = customDiagnosis?.recommendation || 'AI 기초 대화법부터 시작해보세요.';
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    return (
      <div style={{ ...containerStyle, background: '#fff' }}>
        <div style={{ padding: '0 16px' }}>
          <div style={{ background: '#1a5c3a', borderRadius: '0 0 20px 20px', padding: '28px 24px 22px', color: '#fff', marginBottom: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>AI활용 체크업 진단서</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>사단법인 AI융합연구소 · jejuailab.com</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>진단일: {dateStr}{shopType && ` · 업종: ${shopType}`}</div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: '50%', border: `10px solid ${levelInfo.color}` }}>
              <div>
                <div style={{ fontSize: 38, fontWeight: 800, color: levelInfo.color, lineHeight: 1 }}>{totalScore}</div>
                <div style={{ fontSize: 12, color: '#999' }}>/ 9점</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 22, fontWeight: 800, color: levelInfo.color }}>{levelInfo.level}</div>
            <div style={{ marginTop: 12, fontSize: 16, color: '#444', lineHeight: 1.8, padding: '0 16px', fontWeight: 600 }}>
              {diagMsg.split('\n').map((line, i) => (<span key={i}>{line}{i === 0 && <br />}</span>))}
            </div>
          </div>

          <div style={{ background: '#f0f8f3', borderRadius: 12, padding: '16px 20px', marginBottom: 16, borderLeft: '4px solid #1a5c3a' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', marginBottom: 4 }}>📚 추천 학습 방향</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{recMsg}</div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 10 }}>미션별 상세 결과</div>
          {MISSIONS.map((m, i) => {
            const ms = scores[m.id] || {};
            const mt = Object.values(ms).reduce((s, v) => s + v, 0);
            const sc = mt === 3 ? '#27ae60' : mt >= 2 ? '#e67e22' : '#e74c3c';
            return (
              <div key={i} style={{ background: '#fafaf8', borderRadius: 12, padding: '16px 20px', marginBottom: 10, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{m.icon} {m.title}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: sc }}>{mt}/3</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {m.evaluationCriteria.map((c, ci) => {
                    const passed = ms[c.key] === 1;
                    return (
                      <span key={ci} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12,
                        background: passed ? '#eafaf1' : '#fef5f0', color: passed ? '#27ae60' : '#e74c3c' }}>
                        {passed ? '✅' : '💭'} {c.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>사단법인 AI융합연구소 · 소상공인 AI활용 체크업 v2.0 · jejuailab.com</div>
          </div>
          <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={() => setPhase('result')}>
            ← 결과 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
