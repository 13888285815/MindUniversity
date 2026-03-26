const express = require('express');
const router = express.Router();
const marketDataService = require('../services/marketDataService');

// 获取实时行情
router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { market = 'SH' } = req.query;
    const quote = await marketDataService.getRealtimeQuote(symbol, market);
    res.json({ success: true, data: quote });
  } catch (error) { next(error); }
});

// 批量获取行情
router.post('/quotes', async (req, res, next) => {
  try {
    const { symbols, market = 'SH' } = req.body;
    const quotes = await marketDataService.getBatchQuotes(symbols, market);
    res.json({ success: true, data: quotes });
  } catch (error) { next(error); }
});

// 获取K线数据
router.get('/kline/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { market = 'SH', period = 'day', limit = 200 } = req.query;
    const klines = await marketDataService.getKlineData(symbol, market, period, parseInt(limit));
    res.json({ success: true, data: { klines, period } });
  } catch (error) { next(error); }
});

// 获取分时数据
router.get('/intraday/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { market = 'SH' } = req.query;
    const data = await marketDataService.getIntradayData(symbol, market);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// 获取大盘指数
router.get('/indices', async (req, res, next) => {
  try {
    const indices = await marketDataService.getMarketIndices();
    res.json({ success: true, data: { indices } });
  } catch (error) { next(error); }
});

// 获取板块行情
router.get('/sectors', async (req, res, next) => {
  try {
    const sectors = await marketDataService.getSectors();
    res.json({ success: true, data: { sectors } });
  } catch (error) { next(error); }
});

// 获取市场统计
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await marketDataService.getMarketStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
});

module.exports = router;
