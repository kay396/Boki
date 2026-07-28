# 복이 (Boki) - 맞춤형 복지 정책 서비스

Vercel 배포용 웹 애플리케이션 프로젝트 파일입니다.

## 프로젝트 구조
- `index.html`: 메인 웹 UI
- `api/generate.js`: Vercel Serverless Function (Gemini API & 공공데이터포털 API 연동)
- `package.json`: 필요 의존성 (`xml2js`)

## Vercel 배포 방법
1. 이 압축파일을 해제한 후 GitHub 저장소에 푸시하거나 Vercel CLI로 배포합니다.
2. Vercel 대시보드의 **Project Settings > Environment Variables**에서 다음 환경 변수를 설정합니다:
   - `GEMINI_API_KEY` (필수): Gemini API 키
   - `DATA_GO_KR_API_KEY` (선택): 공공데이터포털 복지서비스 API 키
