// ==================== Multi-language Support ====================

const translations = {
  'zh-CN': {
    welcome: '欢迎来到意念大学！每天必上的学习网站！',
    home: '首页',
    allCourses: '所有教程',
    training: '远骋班',
    app: '手机APP',
    activities: '校园活动',
    community: '问答社区',
    vip: '开通VIP',
    login: '登录',
    register: '免费注册',
    searchPlaceholder: '搜索教程，如：PS入门、AutoCAD、Python...',
    search: '搜索',
    hotSearch: '热搜：',
    subscriptionTitle: '订阅计划',
    subscriptionDesc: '选择适合您的订阅计划',
    monthly: '月付',
    yearly: '年付（省20%）',
    freePlan: '免费版',
    starterPlan: '基础版',
    proPlan: '专业版',
    enterprisePlan: '企业版',
    apiTokens: 'API Tokens',
    aiFeatures: 'AI 功能',
    support: '技术支持',
    footerCopyright: '© 2026 意念大学 - 每天必上的意念大学网站 版权所有',
    dailyVisit: '每天必上的意念大学网站',
    brandName: '意念大学'
  },
  'en': {
    welcome: 'Welcome to Mind University! Your daily learning destination!',
    home: 'Home',
    allCourses: 'All Courses',
    training: 'Training',
    app: 'Mobile App',
    activities: 'Activities',
    community: 'Community',
    vip: 'Get VIP',
    login: 'Login',
    register: 'Register',
    searchPlaceholder: 'Search tutorials, e.g., Photoshop, AutoCAD, Python...',
    search: 'Search',
    hotSearch: 'Hot:',
    subscriptionTitle: 'Subscription Plans',
    subscriptionDesc: 'Choose the plan that fits your needs',
    monthly: 'Monthly',
    yearly: 'Yearly (Save 20%)',
    freePlan: 'Free',
    starterPlan: 'Starter',
    proPlan: 'Pro',
    enterprisePlan: 'Enterprise',
    apiTokens: 'API Tokens',
    aiFeatures: 'AI Features',
    support: 'Support',
    footerCopyright: '© 2026 Mind University - Your Daily Learning Platform. All rights reserved.',
    dailyVisit: 'Your daily learning destination',
    brandName: 'Mind University'
  },
  'ja': {
    welcome: 'マインド大学へようこそ！毎日訪れる学習プラットフォーム',
    home: 'ホーム',
    allCourses: 'すべての講座',
    training: 'トレーニング',
    app: 'モバイルアプリ',
    activities: 'アクティビティ',
    community: 'コミュニティ',
    vip: 'VIP取得',
    login: 'ログイン',
    register: '無料登録',
    searchPlaceholder: 'チュートリアル検索：Photoshop、AutoCAD、Python...',
    search: '検索',
    hotSearch: '人気：',
    subscriptionTitle: 'サブスクリプション',
    subscriptionDesc: 'ニーズに合ったプランを選択',
    monthly: '月額',
    yearly: '年額（20%お得）',
    freePlan: '無料',
    starterPlan: 'スターター',
    proPlan: 'プロ',
    enterprisePlan: 'エンタープライズ',
    apiTokens: 'APIトークン',
    aiFeatures: 'AI機能',
    support: 'サポート',
    footerCopyright: '© 2026 マインド大学 - 毎日訪れる学習プラットフォーム',
    dailyVisit: '毎日訪れる学習プラットフォーム',
    brandName: 'マインド大学'
  },
  'ko': {
    welcome: '마인드 대학교에 오신 것을 환영합니다! 매일 방문하는 학습 플랫폼',
    home: '홈',
    allCourses: '모든 강의',
    training: '트레이닝',
    app: '모바일 앱',
    activities: '활동',
    community: '커뮤니티',
    vip: 'VIP 구독',
    login: '로그인',
    register: '무료 가입',
    searchPlaceholder: '튜토리얼 검색: Photoshop, AutoCAD, Python...',
    search: '검색',
    hotSearch: '인기:',
    subscriptionTitle: '구독 플랜',
    subscriptionDesc: '필요에 맞는 플랜을 선택하세요',
    monthly: '월간',
    yearly: '연간 (20% 할인)',
    freePlan: '무료',
    starterPlan: '스타터',
    proPlan: '프로',
    enterprisePlan: '엔터프라이즈',
    apiTokens: 'API 토큰',
    aiFeatures: 'AI 기능',
    support: '지원',
    footerCopyright: '© 2026 마인드 대학교 - 매일 방문하는 학습 플랫폼',
    dailyVisit: '매일 방문하는 학습 플랫폼',
    brandName: '마인드 대학교'
  },
  'fr': {
    welcome: 'Bienvenue à l\'Université Mind! Votre destination d\'apprentissage quotidienne!',
    home: 'Accueil',
    allCourses: 'Tous les cours',
    training: 'Formation',
    app: 'Application mobile',
    activities: 'Activités',
    community: 'Communauté',
    vip: 'Obtenir VIP',
    login: 'Connexion',
    register: 'S\'inscrire',
    searchPlaceholder: 'Rechercher des tutoriels, ex: Photoshop, AutoCAD, Python...',
    search: 'Rechercher',
    hotSearch: 'Populaire:',
    subscriptionTitle: 'Plans d\'abonnement',
    subscriptionDesc: 'Choisissez le plan qui vous convient',
    monthly: 'Mensuel',
    yearly: 'Annuel (20% d\'économie)',
    freePlan: 'Gratuit',
    starterPlan: 'Starter',
    proPlan: 'Pro',
    enterprisePlan: 'Entreprise',
    apiTokens: 'Jetons API',
    aiFeatures: 'Fonctionnalités IA',
    support: 'Support',
    footerCopyright: '© 2026 Université Mind - Votre destination d\'apprentissage quotidienne',
    dailyVisit: 'Votre destination d\'apprentissage quotidienne',
    brandName: 'Université Mind'
  },
  'de': {
    welcome: 'Willkommen an der Mind-Universität! Ihr tägliches Lernziel!',
    home: 'Startseite',
    allCourses: 'Alle Kurse',
    training: 'Schulung',
    app: 'Mobile App',
    activities: 'Aktivitäten',
    community: 'Community',
    vip: 'VIP werden',
    login: 'Anmelden',
    register: 'Kostenlos registrieren',
    searchPlaceholder: 'Tutorials suchen, z.B. Photoshop, AutoCAD, Python...',
    search: 'Suchen',
    hotSearch: 'Beliebt:',
    subscriptionTitle: 'Abonnementpläne',
    subscriptionDesc: 'Wählen Sie den passenden Plan',
    monthly: 'Monatlich',
    yearly: 'Jährlich (20% sparen)',
    freePlan: 'Kostenlos',
    starterPlan: 'Starter',
    proPlan: 'Profi',
    enterprisePlan: 'Unternehmen',
    apiTokens: 'API-Token',
    aiFeatures: 'KI-Funktionen',
    support: 'Support',
    footerCopyright: '© 2026 Mind-Universität - Ihr tägliches Lernziel',
    dailyVisit: 'Ihr tägliches Lernziel',
    brandName: 'Mind-Universität'
  },
  'ar': {
    welcome: 'مرحبًا بكم في جامعة العقل! وجهتك اليومية للتعلم!',
    home: 'الرئيسية',
    allCourses: 'جميع الدورات',
    training: 'التدريب',
    app: 'تطبيق الجوال',
    activities: 'الأنشطة',
    community: 'المجتمع',
    vip: 'اشترك VIP',
    login: 'تسجيل الدخول',
    register: 'تسجيل مجاني',
    searchPlaceholder: 'البحث عن الدورات، مثل: Photoshop، AutoCAD، Python...',
    search: 'بحث',
    hotSearch: 'الأكثر شعبية:',
    subscriptionTitle: 'خطط الاشتراك',
    subscriptionDesc: 'اختر الخطة المناسبة لك',
    monthly: 'شهري',
    yearly: 'سنوي (وفر 20%)',
    freePlan: 'مجاني',
    starterPlan: 'المبتدئ',
    proPlan: 'احترافي',
    enterprisePlan: 'الشركات',
    apiTokens: 'رموز API',
    aiFeatures: 'ميزات الذكاء الاصطناعي',
    support: 'الدعم',
    footerCopyright: '© 2026 جامعة العقل - وجهتك اليومية للتعلم',
    dailyVisit: 'وجهتك اليومية للتعلم',
    brandName: 'جامعة العقل',
    direction: 'rtl'
  }
};

// Language mapping from country to default language
const countryLanguageMap = {
  'CN': 'zh-CN', 'TW': 'zh-CN', 'HK': 'zh-CN', 'MO': 'zh-CN',
  'JP': 'ja',
  'KR': 'ko',
  'US': 'en', 'GB': 'en', 'AU': 'en', 'CA': 'en', 'NZ': 'en',
  'FR': 'fr',
  'DE': 'de', 'AT': 'de', 'CH': 'de',
  'SA': 'ar', 'AE': 'ar', 'QA': 'ar', 'KW': 'ar', 'BH': 'ar', 'OM': 'ar', 'EG': 'ar'
};

let currentLanguage = 'zh-CN';

// ==================== IP-based Language Detection ====================

async function detectUserLanguage() {
  // Try to get from localStorage first
  const savedLang = localStorage.getItem('minduniversity_language');
  if (savedLang) {
    currentLanguage = savedLang;
    applyLanguage(currentLanguage);
    return;
  }

  // Try browser language
  const browserLang = navigator.language || navigator.userLanguage;
  if (translations[browserLang]) {
    currentLanguage = browserLang;
    applyLanguage(currentLanguage);
    return;
  }

  // Try IP-based detection (free API)
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code;
    const detectedLang = countryLanguageMap[countryCode] || 'zh-CN';
    currentLanguage = detectedLang;
    applyLanguage(currentLanguage);
  } catch (error) {
    // Fallback to Chinese
    currentLanguage = 'zh-CN';
    applyLanguage(currentLanguage);
  }
}

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  // Update document direction for Arabic
  document.documentElement.dir = t.direction || 'ltr';
  document.documentElement.lang = lang;

  // Update translatable elements
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // Update placeholders
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  // Save preference
  localStorage.setItem('minduniversity_language', lang);
}

function changeLanguage(lang) {
  currentLanguage = lang;
  applyLanguage(lang);
}

// ==================== Subscription System ====================

const subscriptionPlans = {
  free: {
    name: 'freePlan',
    price: 0,
    currency: '¥',
    tokens: 50000,
    features: ['基础课程访问', '50K API Tokens/月', '社区支持', '基础搜索']
  },
  starter: {
    name: 'starterPlan',
    price: 99,
    currency: '¥',
    tokens: 500000,
    features: ['所有课程访问', '500K API Tokens/月', '优先支持', '高级搜索', '离线下载', '无广告']
  },
  pro: {
    name: 'proPlan',
    price: 299,
    currency: '¥',
    tokens: 2000000,
    features: ['所有课程访问', '2M API Tokens/月', '24/7支持', 'AI 分析', '批量导出', '团队协作', '自定义域名']
  },
  enterprise: {
    name: 'enterprisePlan',
    price: 999,
    currency: '¥',
    tokens: Infinity,
    features: ['无限API Tokens', '专属客户经理', '定制开发', 'SLA保证', '企业级安全', 'SSO登录', 'API优先级']
  }
};

function showSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (!modal) return;

  const t = translations[currentLanguage];
  let plansHTML = '';

  for (const [key, plan] of Object.entries(subscriptionPlans)) {
    const priceText = plan.price === 0 ? t.freePlan : `${plan.currency}${plan.price}`;
    const tokensText = plan.tokens === Infinity ? '∞' : formatNumber(plan.tokens);
    
    plansHTML += `
      <div class="plan-card ${key === 'pro' ? 'featured' : ''}">
        ${key === 'pro' ? '<div class="plan-badge">推荐</div>' : ''}
        <h3>${t[plan.name]}</h3>
        <div class="price">${priceText}<span class="period">/月</span></div>
        <div class="tokens">${t.apiTokens}: ${tokensText}</div>
        <ul class="features">
          ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
        </ul>
        <button class="plan-btn" onclick="selectPlan('${key}')">选择此计划</button>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal-content subscription-modal">
      <div class="modal-header">
        <h3>${t.subscriptionTitle}</h3>
        <span class="modal-close" onclick="hideSubscriptionModal()">×</span>
      </div>
      <p class="subscription-desc">${t.subscriptionDesc}</p>
      <div class="plans-container">
        ${plansHTML}
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
}

function hideSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.style.display = 'none';
}

function selectPlan(planKey) {
  const plan = subscriptionPlans[planKey];
  alert(`已选择: ${plan.name}\n价格: ¥${plan.price}/月\nTokens: ${plan.tokens}`);
  // Redirect to payment page or show payment modal
}

// ==================== API Token Billing ====================

const tokenRates = {
  'gpt-4': 0.03,        // ¥ per 1K tokens
  'gpt-3.5-turbo': 0.002,
  'claude-3': 0.015,
  'claude-3.5': 0.008
};

function calculateTokenCost(model, inputTokens, outputTokens = 0) {
  const rate = tokenRates[model] || 0.01;
  const totalTokens = inputTokens + outputTokens;
  const cost = (totalTokens / 1000) * rate;
  return {
    totalTokens,
    cost: cost.toFixed(4),
    currency: '¥'
  };
}

function updateTokenUsage(userId, model, tokens) {
  // In production, this would call your backend API
  const usage = calculateTokenCost(model, tokens);
  console.log(`Token usage: ${usage.totalTokens} tokens, cost: ${usage.currency}${usage.cost}`);
  
  // Update UI
  const tokenDisplay = document.querySelector('.token-usage');
  if (tokenDisplay) {
    const remaining = parseInt(tokenDisplay.dataset.remaining) - tokens;
    tokenDisplay.dataset.remaining = remaining;
    tokenDisplay.textContent = formatNumber(remaining);
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', function() {
  // Detect language on page load
  detectUserLanguage();
  
  // Add language switcher to top bar
  addLanguageSwitcher();
  
  // Add subscription modal to page
  addSubscriptionModal();
});

function addLanguageSwitcher() {
  // Sync header language switcher with current language
  const headerSwitcher = document.getElementById('headerLangSwitcher');
  if (headerSwitcher) {
    const select = headerSwitcher.querySelector('select');
    if (select) select.value = currentLang;
  }
}

function addSubscriptionModal() {
  // Subscription is now displayed in footer, no modal needed
  // showSubscription function handles the tier selection
}

// Scroll to footer subscription section
function showSubscription(tier) {
  const footer = document.querySelector('.footer');
  if (footer) {
    footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Highlight the selected tier
    document.querySelectorAll('.sub-tier').forEach(el => el.style.outline = 'none');
    const selected = document.querySelector(`.sub-tier.${tier}`);
    if (selected) selected.style.outline = '3px solid var(--blue-primary)';
  }
}

// Scroll to footer (used by header subscribe button)
function scrollToFooter() {
  const footer = document.querySelector('.footer');
  if (footer) {
    footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
