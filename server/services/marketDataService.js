const axios = require('axios');
const { Stock, Kline } = require('../models');

class MarketDataService {
  constructor() {
    this.baseUrl = process.env.MARKET_DATA_BASE_URL || 'https://api.market.example.com';
    this.apiKey = process.env.MARKET_DATA_API_KEY;
    this.cache = new Map();
    this.cacheExpiry = 5000; // 5秒缓存
    this.realtimeInterval = null;
  }

  // 获取实时行情
  async getRealtimeQuote(symbol, market = 'SH') {
    const cacheKey = `quote:${market}:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheExpiry) {
      return cached.data;
    }

    // 模拟数据 (实际应调用真实行情API，如东方财富/新浪财经)
    const mockQuote = this.generateMockQuote(symbol, market);
    
    this.cache.set(cacheKey, { data: mockQuote, time: Date.now() });
    
    // 更新数据库中的实时快照
    await Stock.findOneAndUpdate(
      { symbol, market },
      { $set: { quote: mockQuote } },
      { upsert: false }
    );

    return mockQuote;
  }

  // 批量获取行情
  async getBatchQuotes(symbols, market = 'SH') {
    const quotes = {};
    for (const symbol of symbols) {
      quotes[symbol] = await this.getRealtimeQuote(symbol, market);
    }
    return quotes;
  }

  // 获取K线数据
  async getKlineData(symbol, market, period = 'day', limit = 200) {
    // 先查数据库
    let klines = await Kline.getKlineData(symbol, market, period, limit);
    
    if (klines.length === 0) {
      // 生成模拟K线数据
      klines = this.generateMockKlines(symbol, market, period, limit);
      // 保存到数据库
      await Kline.bulkUpsert(klines);
    }

    return klines;
  }

  // 获取分时数据
  async getIntradayData(symbol, market = 'SH') {
    const stock = await Stock.findOne({ symbol, market });
    if (!stock) throw new Error('股票不存在');

    // 生成分时数据 (当日240分钟)
    const intraday = [];
    const basePrice = stock.quote?.close || 10;
    let currentPrice = basePrice;
    const now = new Date();
    const marketOpen = new Date(now);
    marketOpen.setHours(9, 30, 0, 0);
    const marketClose = new Date(now);
    marketClose.setHours(15, 0, 0, 0);

    // 模拟240个数据点
    for (let i = 0; i < 240; i++) {
      const time = new Date(marketOpen.getTime() + (i * 60000));
      if (time > marketClose) break;

      // 午休跳过
      const minutes = time.getHours() * 60 + time.getMinutes();
      if (minutes >= 690 && minutes < 780) continue; // 11:30-13:00

      const change = (Math.random() - 0.48) * basePrice * 0.005;
      currentPrice = Math.max(basePrice * 0.9, Math.min(basePrice * 1.1, currentPrice + change));
      
      const avgPrice = basePrice * (1 + (Math.random() - 0.5) * 0.02);
      const volume = Math.floor(Math.random() * 5000 + 500);

      intraday.push({
        time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
        price: parseFloat(currentPrice.toFixed(2)),
        avgPrice: parseFloat(avgPrice.toFixed(2)),
        volume,
        change: parseFloat((currentPrice - basePrice).toFixed(2)),
        changePercent: parseFloat(((currentPrice - basePrice) / basePrice * 100).toFixed(2))
      });
    }

    // 添加分时均价
    let totalAmount = 0;
    let totalVolume = 0;
    return intraday.map(item => {
      totalAmount += item.price * item.volume;
      totalVolume += item.volume;
      return {
        ...item,
        avgPrice: parseFloat((totalAmount / totalVolume).toFixed(2))
      };
    });
  }

  // 获取大盘指数
  async getMarketIndices() {
    const indices = [
      { symbol: '000001', market: 'SH', name: '上证指数' },
      { symbol: '399001', market: 'SZ', name: '深证成指' },
      { symbol: '399006', market: 'SZ', name: '创业板指' },
      { symbol: '000300', market: 'SH', name: '沪深300' },
      { symbol: '000688', market: 'SH', name: '科创50' }
    ];

    const results = await Promise.all(
      indices.map(idx => this.getRealtimeQuote(idx.symbol, idx.market))
    );

    return indices.map((idx, i) => ({
      ...idx,
      ...results[i]
    }));
  }

  // 获取板块行情
  async getSectors() {
    const sectors = [
      { name: '科技', change: 2.35, topStock: '中芯国际', volume: '156亿' },
      { name: '医药', change: -0.82, topStock: '恒瑞医药', volume: '98亿' },
      { name: '新能源', change: 1.56, topStock: '宁德时代', volume: '203亿' },
      { name: '消费', change: -0.35, topStock: '贵州茅台', volume: '87亿' },
      { name: '金融', change: 0.78, topStock: '招商银行', volume: '134亿' },
      { name: '半导体', change: 3.12, topStock: '北方华创', volume: '112亿' },
      { name: '军工', change: 1.05, topStock: '中航沈飞', volume: '76亿' },
      { name: '地产', change: -1.25, topStock: '万科A', volume: '65亿' }
    ];
    return sectors;
  }

  // 获取涨跌统计
  async getMarketStats() {
    const stocks = await Stock.find({ status: 'active' });
    let limitUp = 0, limitDown = 0, upCount = 0, downCount = 0, flatCount = 0;
    
    stocks.forEach(s => {
      const pct = s.quote?.changePercent || 0;
      if (pct > 9.8) limitUp++;
      else if (pct < -9.8) limitDown++;
      else if (pct > 0) upCount++;
      else if (pct < 0) downCount++;
      else flatCount++;
    });

    return { limitUp, limitDown, upCount, downCount, flatCount, total: stocks.length };
  }

  // 启动实时行情推送
  startRealTimeFeed() {
    if (this.realtimeInterval) return;
    
    this.realtimeInterval = setInterval(async () => {
      try {
        // 获取热门股票的最新行情
        const hotStocks = await Stock.find({ isHot: true, status: 'active' }).limit(50);
        for (const stock of hotStocks) {
          const quote = this.generateMockQuote(stock.symbol, stock.market);
          stock.quote = quote;
          await stock.save();
          
          // 通过 Socket.io 推送
          const app = require('../app');
          const io = app.get('io');
          if (io) {
            io.to(`stock:${stock.symbol}`).emit('quote:update', {
              symbol: stock.symbol,
              market: stock.market,
              ...quote
            });
          }
        }
      } catch (error) {
        console.error('实时行情推送错误:', error.message);
      }
    }, 3000); // 每3秒更新一次
  }

  // 停止实时推送
  stopRealTimeFeed() {
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
    }
  }

  // 生成模拟行情
  generateMockQuote(symbol, market) {
    const base = 10 + Math.random() * 100;
    const change = (Math.random() - 0.48) * 5;
    const price = parseFloat((base + change).toFixed(2));
    const close = parseFloat(base.toFixed(2));
    const high = parseFloat((price * (1 + Math.random() * 0.02)).toFixed(2));
    const low = parseFloat((price * (1 - Math.random() * 0.02)).toFixed(2));
    const open = parseFloat((close * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2));
    const volume = Math.floor(Math.random() * 1000000 + 100000);
    const amount = parseFloat((volume * price / 10000).toFixed(2));

    return {
      price,
      open,
      high,
      low,
      close,
      volume,
      amount,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat((change / base * 100).toFixed(2)),
      amplitude: parseFloat(((high - low) / close * 100).toFixed(2)),
      turnover: parseFloat((Math.random() * 5).toFixed(2)),
      bidPrice: [price - 0.01, price - 0.02, price - 0.03, price - 0.04, price - 0.05],
      bidVolume: [100, 200, 300, 400, 500],
      askPrice: [price + 0.01, price + 0.02, price + 0.03, price + 0.04, price + 0.05],
      askVolume: [150, 250, 350, 450, 550],
      timestamp: new Date()
    };
  }

  // 生成模拟K线
  generateMockKlines(symbol, market, period, count) {
    const klines = [];
    let basePrice = 10 + Math.random() * 100;
    const now = new Date();

    for (let i = count; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'day') date.setDate(date.getDate() - i);
      else if (period === 'week') date.setDate(date.getDate() - i * 7);
      else if (period === 'month') date.setMonth(date.getMonth() - i);
      else date.setMinutes(date.getMinutes() - i);

      const change = (Math.random() - 0.48) * basePrice * 0.03;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 500000 + 50000);

      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

      klines.push({
        symbol,
        market,
        period,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
        amount: parseFloat((volume * close / 10000).toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat((change / basePrice * 100).toFixed(2)),
        timestamp: date,
        date: dateStr
      });

      basePrice = close;
    }

    // 计算均线
    for (let i = 0; i < klines.length; i++) {
      if (i >= 4) klines[i].ma5 = klines.slice(i - 4, i + 1).reduce((s, k) => s + k.close, 0) / 5;
      if (i >= 9) klines[i].ma10 = klines.slice(i - 9, i + 1).reduce((s, k) => s + k.close, 0) / 10;
      if (i >= 19) klines[i].ma20 = klines.slice(i - 19, i + 1).reduce((s, k) => s + k.close, 0) / 20;
      if (i >= 59) klines[i].ma60 = klines.slice(i - 59, i + 1).reduce((s, k) => s + k.close, 0) / 60;
    }

    return klines;
  }
}

module.exports = new MarketDataService();
