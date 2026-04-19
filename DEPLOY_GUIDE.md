# 🩺 소상공인 AI활용 체크업 - 배포 가이드

## 전체 과정 요약
GitHub에 코드 올리기 → Vercel에서 연결 → API 키 등록 → 완료!
전체 소요시간: 약 15~20분

---

## STEP 1: Anthropic API 키 발급

1. https://console.anthropic.com 접속
2. 로그인 (없으면 회원가입)
3. 왼쪽 메뉴에서 "API Keys" 클릭
4. "Create Key" 버튼 클릭
5. 이름: `ai-checkup` 입력 → Create
6. 나온 키(`sk-ant-...`)를 **메모장에 복사해서 저장** (한 번만 보여줌!)

💡 API 비용 참고:
- 1인 진단 시 약 4번 API 호출 (미션 3개 + 최종진단 1개)
- 1인당 약 30~50원 수준
- 100명 테스트해도 약 3,000~5,000원

---

## STEP 2: GitHub에 저장소 만들기

1. https://github.com 접속 → 로그인
2. 오른쪽 위 "+" 버튼 → "New repository"
3. Repository name: `ai-checkup`
4. Public 선택
5. "Create repository" 클릭

---

## STEP 3: 코드 올리기

### 방법 A: GitHub 웹에서 직접 올리기 (제일 쉬움)

1. 만든 저장소 페이지에서 "uploading an existing file" 링크 클릭
2. 다운로드한 ai-checkup 폴더 안의 **모든 파일과 폴더**를 드래그앤드롭
3. "Commit changes" 클릭

### 방법 B: 터미널/명령어 (익숙한 경우)
```bash
cd ai-checkup
git init
git add .
git commit -m "소상공인 AI활용 체크업 v2.0"
git remote add origin https://github.com/yang-inha/ai-checkup.git
git push -u origin main
```

---

## STEP 4: Vercel에서 배포

1. https://vercel.com 접속 → 로그인
2. "Add New..." → "Project" 클릭
3. "Import Git Repository"에서 `ai-checkup` 저장소 선택
4. Framework Preset: **Next.js** 자동 감지됨 (확인)
5. ⚠️ 중요! "Environment Variables" 섹션 펼치기:
   - Name: `ANTHROPIC_API_KEY`
   - Value: STEP 1에서 복사한 API 키 (`sk-ant-...`) 붙여넣기
   - "Add" 클릭
6. "Deploy" 클릭
7. 2~3분 기다리면 완료!

---

## STEP 5: 완료! 🎉

배포가 끝나면 Vercel이 URL을 줍니다:
`https://ai-checkup-xxxxx.vercel.app`

이 URL로 누구나 접속해서 AI활용 체크업을 받을 수 있어요!

### 커스텀 도메인 연결 (선택)
Vercel 대시보드 → Settings → Domains에서
`checkup.jejuailab.com` 같은 도메인을 연결할 수 있습니다.

---

## 문제 해결

### "API key not configured" 에러가 나요
→ Vercel 대시보드 → Settings → Environment Variables에서
  `ANTHROPIC_API_KEY`가 제대로 등록되었는지 확인

### 배포 실패 (Build Error)
→ Vercel 대시보드에서 에러 로그 확인 → Claude에게 보여주면 같이 해결!

### API 비용이 걱정돼요
→ console.anthropic.com → Usage에서 실시간 확인 가능
→ 월 사용량 제한(Spending Limit) 설정 가능

---

## 파일 구조 설명

```
ai-checkup/
├── app/
│   ├── layout.js          ← 사이트 기본 설정 (제목, 폰트)
│   ├── globals.css        ← 디자인 스타일
│   ├── page.js            ← ⭐ 메인 앱 (미션, 결과, 진단서)
│   └── api/
│       ├── evaluate/
│       │   └── route.js   ← AI 미션 평가 서버
│       └── diagnose/
│           └── route.js   ← AI 최종 진단 서버
├── package.json           ← 프로젝트 설정
├── next.config.js         ← Next.js 설정
├── .env.example           ← API 키 예시
├── .gitignore             ← Git 제외 파일
└── DEPLOY_GUIDE.md        ← 이 파일!
```

나중에 미션을 바꾸고 싶으면 `app/page.js`의 `MISSIONS` 배열만 수정하면 됩니다!
