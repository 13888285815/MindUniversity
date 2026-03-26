const { Stock, Watchlist } = require('../models');

class StockService {
  // 搜索股票
  async searchStocks(keyword) {
    if (!keyword || keyword.length < 1) throw new Error('请输入搜索关键词');
    return Stock.searchStocks(keyword, 20);
  }

  // 获取股票详情
  async getStockDetail(symbol, market) {
    const stock = await Stock.findOne({ symbol, market });
    if (!stock) throw new Error('股票不存在');
    return stock;
  }

  // 获取热门股票
  async getHotStocks(limit = 10) {
    return Stock.getHotStocks(limit);
  }

  // 获取涨幅榜
  async getTopGainers(limit = 20) {
    return Stock.getTopGainers(limit);
  }

  // 获取跌幅榜
  async getTopLosers(limit = 20) {
    return Stock.getTopLosers(limit);
  }

  // 获取成交额榜
  async getTopByVolume(limit = 20) {
    return Stock.getTopByVolume(limit);
  }

  // 获取自选股列表
  async getWatchlist(userId) {
    let watchlist = await Watchlist.findOne({ user: userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: userId });
    }
    return watchlist.populate('stocks.stock');
  }

  // 添加自选股
  async addToWatchlist(userId, stockData) {
    let watchlist = await Watchlist.findOne({ user: userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: userId });
    }

    // 检查股票是否存在
    const stock = await Stock.findOne({ symbol: stockData.symbol, market: stockData.market });
    if (!stock) {
      throw new Error('股票不存在');
    }

    await watchlist.addStock({
      stock: stock._id,
      symbol: stock.symbol,
      market: stock.market,
      name: stock.name,
      ...stockData
    });

    return watchlist;
  }

  // 移除自选股
  async removeFromWatchlist(userId, symbol, market) {
    const watchlist = await Watchlist.findOne({ user: userId });
    if (!watchlist) throw new Error('自选列表不存在');

    await watchlist.removeStock(symbol, market);
    return watchlist;
  }

  // 获取板块列表
  async getSectors() {
    const sectors = ['科技', '医药', '新能源', '消费', '金融', '半导体', '军工', '地产', '钢铁', '汽车', '传媒', '农业'];
    return sectors;
  }

  // 按板块获取股票
  async getStocksBySector(sector, { page = 1, limit = 20, sort = 'changePercent', order = 'desc' } = {}) {
    const query = { sector, status: 'active' };
    const sortOptions = {};
    sortOptions[`quote.${sort}`] = order === 'asc' ? 1 : -1;

    const [stocks, total] = await Promise.all([
      Stock.find(query).sort(sortOptions).skip((page - 1) * limit).limit(parseInt(limit)).lean(),
      Stock.countDocuments(query)
    ]);

    return {
      stocks,
      sector,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    };
  }

  // 获取股票列表 (分页)
  async getStocks({ page = 1, limit = 20, market, type, sector, search, sort = 'amount', order = 'desc' } = {}) {
    const query = { status: 'active' };
    if (market) query.market = market;
    if (type) query.type = type;
    if (sector) query.sector = sector;
    if (search) {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[`quote.${sort}`] = order === 'asc' ? 1 : -1;

    const [stocks, total] = await Promise.all([
      Stock.find(query).sort(sortOptions).skip((page - 1) * limit).limit(parseInt(limit)).lean(),
      Stock.countDocuments(query)
    ]);

    return {
      stocks,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    };
  }
}

module.exports = new StockService();
