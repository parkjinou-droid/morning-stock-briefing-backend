// /api/stocks - 주요 지수 (naver-finance.js를 래퍼)
const naverFinance = require('./naver-finance');

module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // naver-finance API를 호출하되 응답을 stocks 형식으로 변환
  const mockRes = {
    _headers: {},
    _status: 200,
    _body: null,
    setHeader(k, v) { this._headers[k] = v; },
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
    end() { return this; }
  };

  try {
    await naverFinance(req, mockRes);
    const data = mockRes._body;

    if (data && data.success && data.data) {
      const d = data.data;
      const stocks = [
        { name: '다우존스(DJIA)', price: d.dow.value.toLocaleString(), change: d.dow.change, changePercent: d.dow.change },
        { name: 'S&P 500', price: d.sp500.value.toLocaleString(), change: d.sp500.change, changePercent: d.sp500.change },
        { name: '나스닥(NASDAQ)', price: d.nasdaq.value.toLocaleString(), change: d.nasdaq.change, changePercent: d.nasdaq.change }
      ];
      return res.status(200).json({
        success: true,
        stocks: stocks,
        timestamp: data.timestamp
      });
    } else {
      throw new Error('데이터 형식 오류');
    }
  } catch (error) {
    console.error('❌ stocks API 오류:', error.message);
    return res.status(200).json({
      success: true,
      stocks: [
        { name: '다우존스(DJIA)', price: '44,300', change: -0.98, changePercent: -0.98 },
        { name: 'S&P 500', price: '5,919', change: -0.76, changePercent: -0.76 },
        { name: '나스닥(NASDAQ)', price: '18,872', change: -1.15, changePercent: -1.15 }
      ],
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
};
