// Vercel Serverless Function - Health Check

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '모닝 주식 브리핑 백엔드 정상 운영 중',
    endpoints: {
      naver_finance: '/api/naver-finance',
      health: '/api/health'
    }
  });
};
