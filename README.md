# 📊 모닝 주식 브리핑 - 백엔드 API

Vercel Serverless 환경에서 실행되는 네이버 금융 크롤링 백엔드 API

## 🚀 배포 상태

[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

## 📡 API 엔드포인트

### 1. 네이버 금융 데이터

```
GET /api/naver-finance
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "dow": {
      "value": 44300.31,
      "change": -0.98,
      "changeValue": -435.69
    },
    "sp500": {
      "value": 5919.23,
      "change": -0.76,
      "changeValue": -45.32
    },
    "nasdaq": {
      "value": 18872.45,
      "change": -1.15,
      "changeValue": -219.78
    }
  },
  "cached": false,
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

### 2. 헬스 체크

```
GET /api/health
```

## 🔧 기술 스택

- 런타임: Node.js (Vercel Serverless)
- 크롤링: Axios + Cheerio
- 배포: Vercel
- 캐싱: 메모리 (5분)

## 📋 사용 방법

### 프론트엔드 연동

```javascript
const API_URL = 'https://[YOUR_VERCEL_URL].vercel.app/api/naver-finance';

async function fetchMarketData() {
  const response = await fetch(API_URL);
  const result = await response.json();
  
  if (result.success) {
    console.log('다우:', result.data.dow);
    console.log('S&P500:', result.data.sp500);
    console.log('나스닥:', result.data.nasdaq);
  }
}
```

## ⚙️ 설정

- 캐시 시간: 5분
- 타임아웃: 30초
- 요청 빈도: 제한 없음 (Vercel Free 배포)

## 📝 라이선스

MIT
