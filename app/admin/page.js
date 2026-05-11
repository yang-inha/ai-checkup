'use client';
import { useState } from 'react';

// ─── 목업 데이터 (나중에 Google Sheets 연동으로 교체) ───
const MOCK_DATA = [
  { id: 1, name: '김사장', birthYear: '1972', gender: 'M', phone4: '3842', shopType: '외식업', category: 'food',
    sessions: [
      { date: '2026-04-19', m1: 1, m2: 0, m3: 1, total: 2, level: '씨앗 🌱' },
      { date: '2026-05-03', m1: 2, m2: 1, m3: 2, total: 5, level: '새싹 🌿' },
    ]},
  { id: 2, name: '이대표', birthYear: '1985', gender: 'F', phone4: '7291', shopType: '카페/디저트', category: 'cafe',
    sessions: [
      { date: '2026-04-20', m1: 2, m2: 2, m3: 1, total: 5, level: '새싹 🌿' },
    ]},
  { id: 3, name: '박사장', birthYear: '1968', gender: 'M', phone4: '1155', shopType: '뷰티/미용', category: 'beauty',
    sessions: [
      { date: '2026-04-21', m1: 0, m2: 0, m3: 0, total: 0, level: '씨앗 🌱' },
      { date: '2026-05-05', m1: 1, m2: 1, m3: 1, total: 3, level: '씨앗 🌱' },
      { date: '2026-05-10', m1: 2, m2: 2, m3: 2, total: 6, level: '새싹 🌿' },
    ]},
  { id: 4, name: '최원장', birthYear: '1990', gender: 'F', phone4: '4488', shopType: '교육/상담', category: 'education',
    sessions: [
      { date: '2026-04-22', m1: 3, m2: 2, m3: 3, total: 8, level: '열매 🍎' },
    ]},
  { id: 5, name: '정사장', birthYear: '1978', gender: 'M', phone4: '6633', shopType: '소매/판매', category: 'retail',
    sessions: [
      { date: '2026-04-23', m1: 1, m2: 1, m3: 0, total: 2, level: '씨앗 🌱' },
    ]},
];

const LEVEL_COLORS = {
  '씨앗 🌱': '#e67e22',
  '새싹 🌿': '#27ae60',
  '열매 🍎': '#2980b9',
};

export default function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const data = MOCK_DATA;

  // ─── 통계 계산 ───
  const totalParticipants = data.length;
  const allLatestSessions = data.map(d => d.sessions[d.sessions.length - 1]);
  const avgScore = allLatestSessions.length > 0
    ? (allLatestSessions.reduce((s, sess) => s + sess.total, 0) / allLatestSessions.length).toFixed(1)
    : 0;

  const levelCounts = { '씨앗 🌱': 0, '새싹 🌿': 0, '열매 🍎': 0 };
  allLatestSessions.forEach(s => { if (levelCounts[s.level] !== undefined) levelCounts[s.level]++; });

  const categoryCounts = {};
  data.forEach(d => {
    categoryCounts[d.shopType] = (categoryCounts[d.shopType] || 0) + 1;
  });

  // ─── 필터링 ───
  const filtered = data.filter(d => {
    const latest = d.sessions[d.sessions.length - 1];
    if (filterLevel !== 'all' && latest.level !== filterLevel) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    return true;
  });

  // ─── 성장 표시 ───
  function getGrowth(sessions) {
    if (sessions.length < 2) return null;
    const first = sessions[0].total;
    const last = sessions[sessions.length - 1].total;
    const diff = last - first;
    if (diff > 0) return { text: `+${diff}점`, color: '#27ae60', arrow: '↑' };
    if (diff < 0) return { text: `${diff}점`, color: '#e74c3c', arrow: '↓' };
    return { text: '변동없음', color: '#888', arrow: '→' };
  }

  // ─── 스타일 ───
  const page = { maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: "'Noto Sans KR', sans-serif", color: '#1a1a1a' };
  const card = { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 };
  const statCard = { ...card, flex: 1, textAlign: 'center', padding: '20px 16px' };
  const badge = (color) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color, background: color + '18' });
  const inputStyle = { padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #faf9f6 0%, #f0ede6 100%)' }}>
      <div style={page}>

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#1a5c3a' }}>AI활용 체크업 관리자</h1>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>소상공인 파일럿 사업 대시보드</p>
          </div>
          <div style={{ fontSize: 12, color: '#aaa' }}>사단법인 AI융합연구소</div>
        </div>

        {/* 전체 현황 카드 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>총 참여자</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1a5c3a' }}>{totalParticipants}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>명</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>평균 점수</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1a5c3a' }}>{avgScore}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>/ 9점</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>재진단율</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1a5c3a' }}>
              {totalParticipants > 0 ? Math.round(data.filter(d => d.sessions.length > 1).length / totalParticipants * 100) : 0}%
            </div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{data.filter(d => d.sessions.length > 1).length}명 재진단</div>
          </div>
        </div>

        {/* 단계별 분포 */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>단계별 분포 (최신 진단 기준)</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {Object.entries(levelCounts).map(([level, count]) => {
              const pct = totalParticipants > 0 ? Math.round(count / totalParticipants * 100) : 0;
              const color = LEVEL_COLORS[level] || '#888';
              return (
                <div key={level} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{level}</div>
                  <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}명</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 업종별 분포 */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>업종별 참여 현황</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div key={cat} style={{ padding: '8px 16px', background: '#f8f6f1', borderRadius: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#1a5c3a' }}>{cat}</span>
                <span style={{ color: '#888', marginLeft: 8 }}>{count}명</span>
              </div>
            ))}
          </div>
        </div>

        {/* 필터 */}
        <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>필터:</span>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={inputStyle}>
            <option value="all">전체 단계</option>
            <option value="씨앗 🌱">씨앗 🌱</option>
            <option value="새싹 🌿">새싹 🌿</option>
            <option value="열매 🍎">열매 🍎</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={inputStyle}>
            <option value="all">전체 업종</option>
            <option value="food">외식업</option>
            <option value="cafe">카페/디저트</option>
            <option value="beauty">뷰티/미용</option>
            <option value="tourism">숙박/관광</option>
            <option value="retail">소매/판매</option>
            <option value="education">교육/상담</option>
            <option value="etc">기타 서비스</option>
          </select>
          <span style={{ fontSize: 12, color: '#aaa' }}>{filtered.length}명 표시</span>
        </div>

        {/* 참여자 리스트 */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 16 }}>참여자 리스트</div>
          {filtered.map((user) => {
            const latest = user.sessions[user.sessions.length - 1];
            const growth = getGrowth(user.sessions);
            const isOpen = selectedUser === user.id;
            return (
              <div key={user.id} style={{ marginBottom: 8 }}>
                <div
                  onClick={() => setSelectedUser(isOpen ? null : user.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', background: isOpen ? '#f0f8f3' : '#fafaf8',
                    borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer',
                    border: isOpen ? '1px solid #c8e6c9' : '1px solid #eee',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a5c3a', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                      {user.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>
                        {user.name}
                        <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 6 }}>
                          {user.birthYear}년 · {user.gender === 'M' ? '남' : '여'} · {user.phone4}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {user.shopType} · 진단 {user.sessions.length}회
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {growth && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: growth.color }}>
                        {growth.arrow} {growth.text}
                      </span>
                    )}
                    <span style={badge(LEVEL_COLORS[latest.level] || '#888')}>{latest.level}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: latest.total >= 7 ? '#2980b9' : latest.total >= 4 ? '#27ae60' : '#e67e22' }}>
                      {latest.total}
                    </span>
                    <span style={{ fontSize: 16, color: '#ccc' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* 상세 펼침 - 성장 추적 */}
                {isOpen && (
                  <div style={{ padding: '16px', background: '#fff', border: '1px solid #c8e6c9', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a', marginBottom: 12 }}>진단 이력 (성장 추적)</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16, overflowX: 'auto' }}>
                      {user.sessions.map((sess, si) => {
                        const barH = Math.max(20, (sess.total / 9) * 120);
                        const color = sess.total >= 7 ? '#2980b9' : sess.total >= 4 ? '#27ae60' : '#e67e22';
                        return (
                          <div key={si} style={{ textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color, marginBottom: 4 }}>{sess.total}</div>
                            <div style={{ width: 40, height: barH, background: color, borderRadius: '6px 6px 0 0', margin: '0 auto', opacity: 0.7, transition: 'height 0.5s' }} />
                            <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{sess.date.slice(5)}</div>
                            <div style={{ fontSize: 10, color }}>{sess.level.split(' ')[0]}</div>
                          </div>
                        );
                      })}
                      {user.sessions.length > 1 && (
                        <div style={{ textAlign: 'center', minWidth: 60, alignSelf: 'center' }}>
                          <div style={{ fontSize: 24 }}>
                            {user.sessions[user.sessions.length - 1].total > user.sessions[0].total ? '📈' : '📊'}
                          </div>
                          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                            {user.sessions[0].level.split(' ')[0]} → {user.sessions[user.sessions.length - 1].level.split(' ')[0]}
                          </div>
                        </div>
                      )}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                          <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>날짜</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: '#888' }}>미션1</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: '#888' }}>미션2</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: '#888' }}>미션3</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: '#888' }}>총점</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: '#888' }}>단계</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.sessions.map((sess, si) => (
                          <tr key={si} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', color: '#555' }}>{sess.date}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: sess.m1 === 3 ? '#27ae60' : sess.m1 >= 2 ? '#e67e22' : '#e74c3c' }}>{sess.m1}/3</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: sess.m2 === 3 ? '#27ae60' : sess.m2 >= 2 ? '#e67e22' : '#e74c3c' }}>{sess.m2}/3</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: sess.m3 === 3 ? '#27ae60' : sess.m3 >= 2 ? '#e67e22' : '#e74c3c' }}>{sess.m3}/3</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: '#1a5c3a' }}>{sess.total}/9</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}><span style={badge(LEVEL_COLORS[sess.level] || '#888')}>{sess.level}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 24, paddingBottom: 40 }}>
          사단법인 AI융합연구소 · 소상공인 AI활용 체크업 v3.0 · jejuailab.com
          <br />이 페이지는 관리자 전용입니다.
        </div>
      </div>
    </div>
  );
}
