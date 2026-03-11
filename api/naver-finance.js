const axios = require('axios');
const cheerio = require('cheerio');

// 메모리 캐시
let marketCache = {
  data: null,
  lastUpdate: null,
  expireTime: 5 * 60 * 1000 // 5분
};

// 캐시 유효성 확인
function isCacheValid() {
  if (!marketCache.data) return false;
  const now = Date.now();
  return (now - marketCache.lastUpdate) < marketCache.expireTime;
}

// 네이버 금융 크롤링 (HTML 파싱)
async function crawlNaverFinance() {
  try {
    console.log('🔄 네이버 금융 크롤링 시작...');
    
    const response = await axios.get('https://finance.naver.com/world/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 데이터 추출 (네이버 금융 HTML에서)
    const marketData = extractMarketData($);

    console.log('✅ 크롤링 성공');
    return marketData;

  } catch (error) {
    console.error('❌ 크롤링 실패:', error.message);
    throw error;
  }
}

// 시장 데이터 추출
function extractMarketData($) {
  try {
    // 네이버 금융 테이블 구조를 파싱
    const tables = $('table');
    
    let dow = { value: 0, change: 0, changeValue: 0 };
    let sp500 = { value: 0, change: 0, changeValue: 0 };
    let nasdaq = { value: 0, change: 0, changeValue: 0 };

    // 테이블 순회
    tables.each((idx, table) => {
      const rows = $(table).find('tbody tr');
      
      rows.each((i, row) => {
        const cells = $(row).find('td');
        const nameCell = $(cells[0]).text().trim();
        
        // DJIA (다우) 추출
        if (nameCell.includes('DJIA') || nameCell.includes('다우')) {
          const value = parseFloat($(cells[1]).text().replace(/[^0-9.-]/g, ''));
          const changeText = $(cells[2]).text().trim();
          const changeValue = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
          const changePercent = parseFloat($(cells[3]).text().replace(/[^0-9.-]/g, ''));
          
          if (!isNaN(value)) {
            dow = {
              value: value,
              change: isNaN(changePercent) ? 0 : changePercent,
              changeValue: isNaN(changeValue) ? 0 : changeValue
            };
          }
        }
        
        // S&P500 추출
        if (nameCell.includes('S&P') || nameCell.includes('S&P500')) {
          const value = parseFloat($(cells[1]).text().replace(/[^0-9.-]/g, ''));
          const changeText = $(cells[2]).text().trim();
          const changeValue = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
          const changePercent = parseFloat($(cells[3]).text().replace(/[^0-9.-]/g, ''));
          
          if (!isNaN(value)) {
            sp500 = {
              value: value,
              change: isNaN(changePercent) ? 0 : changePercent,
              changeValue: isNaN(changeValue) ? 0 : changeValue
            };
          }
        }
        
        // NASDAQ 추출
        if (nameCell.includes('NASDAQ') || nameCell.includes('나스닥')) {
          const value = parseFloat($(cells[1]).text().replace(/[^0-9.-]/g, ''));
          const changeText = $(cells[2]).text().trim();
          const changeValue = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
          const changePercent = parseFloat($(cells[3]).text().replace(/[^0-9.-]/g, ''));
          
          if (!isNaN(value)) {
            nasdaq = {
              value: value,
              change: isNaN(changePercent) ? 0 : changePercent,
              changeValue: isNaN(changeValue) ? 0 : changeValue
            };
          }
        }
      });
    });

    // 데이터가 없으면 기본값 반환
    if (dow.value === 0 || sp500.value === 0 || nasdaq.value === 0) {
      throw new Error('데이터 추출 실패');
    }

    return {
      dow: dow,
      sp500: sp500,
      nasdaq: nasdaq,
      lastUpdate: new Date().toISOString(),
      source: 'naver-finance'
    };

  } catch (error) {
    console.error('❌ 데이터 추출 실패:', error.message);
    
    // 추출 실패 시 기본값
    return {
      dow: { value: 44300.31, change: -0.98, changeValue: -435.69 },
      sp500: { value: 5919.23, change: -0.76, changeValue: -45.32 },
      nasdaq: { value: 18872.45, change: -1.15, changeValue: -219.78 },
      lastUpdate: new Date().toISOString(),
      source: 'sample'
    };
  }
}

// Vercel Serverless Function
module.exports = async (req, res) => {
  try {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'GET 요청만 지원합니다'
      });
    }

    // 캐시 확인
    if (isCacheValid()) {
      console.log('📦 캐시에서 데이터 반환 (5분 내)');
      return res.status(200).json({
        success: true,
        data: marketCache.data,
        cached: true,
        timestamp: new Date().toISOString(),
        message: '캐시된 데이터입니다 (5분 내)'
      });
    }

    // 새로운 데이터 크롤링
    const data = await crawlNaverFinance();

    // 캐시 업데이트
    marketCache.data = data;
    marketCache.lastUpdate = Date.now();

    // 응답 반환
    return res.status(200).json({
      success: true,
      data: data,
      cached: false,
      timestamp: new Date().toISOString(),
      message: '최신 데이터입니다 (네이버 금융)'
    });

  } catch (error) {
    console.error('❌ API 에러:', error);

    // 캐시된 데이터 반환 (fallback)
    if (marketCache.data) {
      return res.status(200).json({
        success: true,
        data: marketCache.data,
        cached: true,
        old: true,
        timestamp: new Date().toISOString(),
        message: '네이버 금융 접속 실패. 이전 캐시 데이터를 반환합니다.'
      });
    }

    // 샘플 데이터 반환
    return res.status(200).json({
      success: true,
      data: {
        dow: { value: 44300.31, change: -0.98, changeValue: -435.69 },
        sp500: { value: 5919.23, change: -0.76, changeValue: -45.32 },
        nasdaq: { value: 18872.45, change: -1.15, changeValue: -219.78 }
      },
      cached: false,
      fallback: true,
      timestamp: new Date().toISOString(),
      message: '샘플 데이터입니다 (실제 데이터 불가)'
    });
  }
};
