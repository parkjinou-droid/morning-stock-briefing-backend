// /api/briefing - 아침 주식 브리핑 (CORS 포함)
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 네이버 금융 뉴스 크롤링
    const response = await axios.get('https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const news = [];
    $('ul.recentlySeen li dd.articleSubject a, dl dd a').each((i, el) => {
      if (i >= 5) return false;
      const title = $(el).text().trim();
      if (title) news.push(title);
    });

    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    const briefingLines = [
      `📅 ${today} 주식 브리핑`,
      '',
      '📰 오늘의 주요 주식 뉴스:',
      ...(news.length > 0 ? news.map((n, i) => `  ${i+1}. ${n}`) : ['  뉴스를 가져오지 못했습니다.']),
      '',
      '⚠️ 주식 투자는 본인 판단 하에 진행하세요.'
    ];

    return res.status(200).json({
      success: true,
      briefing: briefingLines.join('\n'),
      newsCount: news.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ briefing API 오류:', error.message);
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    return res.status(200).json({
      success: true,
      briefing: `📅 ${today} 주식 브리핑\n\n네이버 금융 접속에 실패했습니다.\n잠시 후 다시 시도해 주세요.`,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
};
