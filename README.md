# 롤 5대5 구도 분석기 🎮

League of Legends 팀 구성 분석 도구입니다. AI를 활용하여 팀 구성의 강점, 약점, 전략을 분석합니다.

## 🚀 배포 방법

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경변수 설정:
   - `VITE_N8N_WEBHOOK_URL`: n8n 웹훅 URL

### 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 🛠️ 기술 스택

- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **React Markdown** (마크다운 렌더링)
- **n8n** (AI 워크플로우)

## 📝 환경변수

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

## 🎯 기능

- 블루팀/레드팀 챔피언 입력
- AI 기반 팀 구성 분석
- 강점/약점 분석
- 전략 및 승리 조건 제시
- 마크다운 형식 결과 표시