const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const marketDataService = require('../services/marketDataService');
const { authenticateJWT } = require('../middleware/auth');

// 搜索股票
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const stocks = await stockService.searchStocks(q);
    res.json({ success: true, data: { stocks } });
  } catch (error) { next(error); }
});

// 获取股票详情
router.get('/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { market = 'SH' } = req.query;
    const stock = await stockService.getStockDetail(symbol, market);
    res.json({ success: true, data: { stock } });
  } catch (error) { next(error); }
});

// 获取股票列表
router.get('/', async (req, res, next) => {
  try {
    const result = await stockService.getStocks(req.query);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// 涨幅榜
router.get('/rank/gainers', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const stocks = await stockService.getTopGainers(parseInt(limit));
    res.json({ success: true, data: { stocks } });
  } catch (error) { next(error); }
});

// 跌幅榜
router.get('/rank/losers', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const stocks = await stockService.getTopLosers(parseInt(limit));
    res.json({ success: true, data: { stocks } });
  } catch (error) { next(error); }
});

// 成交额榜
router.get('/rank/volume', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const stocks = await stockService.getTopByVolume(parseInt(limit));
    res.json({ success: true, data: { stocks } });
  } catch (error) { next(error); }
});

// 热门股票
router.get('/hot/list', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const stocks = await stockService.getHotStocks(parseInt(limit));
    res.json({ success: true, data: { stocks } });
  } catch (error) { next(error); }
});

// 获取自选股
router.get('/watchlist/my', authenticateJWT, async (req, res, next) => {
  try {
    const watchlist = await stockService.getWatchlist(req.userId);
    res.json({ success: true, data: watchlist });
  } catch (error) { next(error); }
});

// 添加自选股
router.post('/watchlist/add', authenticateJWT, async (req, res, next) => {
  try {
    const result = await stockService.addToWatchlist(req.userId, req.body);
    res.status(201).json({ success: true, message: '已添加到自选', data: result });
  } catch (error) { next(error); }
});

// 移除自选股
router.delete('/watchlist/remove', authenticateJWT, async (req, res, next) => {
  try {
    const { symbol, market } = req.body;
    await stockService.removeFromWatchlist(req.userId, symbol, market);
    res.json({ success: true, message: '已从自选中移除' });
  } catch (error) { next(error); }
});

// 按板块获取股票
router.get('/sector/:sector', async (req, res, next) => {
  try {
    const result = await stockService.getStocksBySector(req.params.sector, req.query);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

module.exports = router;
