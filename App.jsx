import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Sun, Moon, LayoutDashboard, Calendar, CalendarDays, 
  Heart, Target, Menu, X, RefreshCw, ExternalLink, Info, 
  TrendingUp, Activity, BarChart3, AlertCircle, CheckCircle2, ShieldAlert,
  CalendarHeart, Tag, Bell, ShoppingBag, Clock
} from 'lucide-react';

// Saved products are stored locally on this device.
// --- CONSTANTS ---
const CATEGORIES = [
  "Antiques", 
  "Beauty Accessories",
  "Bed & Bath", 
  "Books, Movies & Music", 
  "Business & Industrial", 
  "Car Gadgets", 
  "Clothing, Shoes & Accessories", 
  "Coins & Paper Money", 
  "Collectibles & Art", 
  "Dolls & Bears", 
  "Fashion Accessories", 
  "Health & Beauty", 
  "Home & Garden", 
  "Home & Kitchen Accessories", 
  "Household Items",
  "Jewelry & Watches", 
  "Kitchen Gadgets", 
  "Men's Accessories", 
  "Mobile Accessories", 
  "Motors (eBay Motors)", 
  "Pet Supplies", 
  "Pottery & Glass", 
  "Specialty Services", 
  "Sporting Goods", 
  "Stamps", 
  "Storage & Organization", 
  "Toys & Hobbies", 
  "Women's Accessories"
].sort();

// --- HOLIDAY CALCULATION HELPERS ---
const getEaster = (year) => {
  const f = Math.floor, G = year % 19, C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J, month = 3 + f((L + 40) / 44), day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};
const getNthDayOfMonth = (year, month, dayOfWeek, n) => {
  const d = new Date(year, month, 1);
  d.setDate(d.getDate() + ((dayOfWeek - d.getDay() + 7) % 7) + (n - 1) * 7);
  return d;
};
const getLastDayOfMonth = (year, month, dayOfWeek) => {
  const d = new Date(year, month + 1, 0);
  d.setDate(d.getDate() - ((d.getDay() - dayOfWeek + 7) % 7));
  return d;
};

const currentYear = new Date().getFullYear();
const US_FESTIVALS = [
  { id: 'nyd', name: "New Year's Day", date: new Date(currentYear, 0, 1), researchWeeks: 4, type: "Holiday" },
  { id: 'vday', name: "Valentine's Day", date: new Date(currentYear, 1, 14), researchWeeks: 8, type: "Celebration" },
  { id: 'stp', name: "St. Patrick's Day", date: new Date(currentYear, 2, 17), researchWeeks: 6, type: "Celebration" },
  { id: 'easter', name: "Easter", date: getEaster(currentYear), researchWeeks: 8, type: "Holiday" },
  { id: 'earth', name: "Earth Day", date: new Date(currentYear, 3, 22), researchWeeks: 4, type: "Celebration" },
  { id: 'mothers', name: "Mother's Day", date: getNthDayOfMonth(currentYear, 4, 0, 2), researchWeeks: 8, type: "Celebration" },
  { id: 'memorial', name: "Memorial Day", date: getLastDayOfMonth(currentYear, 4, 1), researchWeeks: 6, type: "Holiday" },
  { id: 'fathers', name: "Father's Day", date: getNthDayOfMonth(currentYear, 5, 0, 3), researchWeeks: 8, type: "Celebration" },
  { id: 'indep', name: "Independence Day", date: new Date(currentYear, 6, 4), researchWeeks: 8, type: "Holiday" },
  { id: 'prime', name: "Summer Shopping Season", date: new Date(currentYear, 6, 15), researchWeeks: 6, type: "Shopping" },
  { id: 'bts', name: "Back to School", date: new Date(currentYear, 7, 15), researchWeeks: 8, type: "Shopping" },
  { id: 'labor', name: "Labor Day", date: getNthDayOfMonth(currentYear, 8, 1, 1), researchWeeks: 6, type: "Holiday" },
  { id: 'halloween', name: "Halloween", date: new Date(currentYear, 9, 31), researchWeeks: 10, type: "Celebration" },
  { id: 'thanks', name: "Thanksgiving", date: getNthDayOfMonth(currentYear, 10, 4, 4), researchWeeks: 8, type: "Holiday" },
  { id: 'blackfri', name: "Black Friday", date: new Date(getNthDayOfMonth(currentYear, 10, 4, 4).getTime() + 86400000), researchWeeks: 10, type: "Shopping" },
  { id: 'cybermon', name: "Cyber Monday", date: new Date(getNthDayOfMonth(currentYear, 10, 4, 4).getTime() + 86400000 * 4), researchWeeks: 10, type: "Shopping" },
  { id: 'xmas', name: "Christmas", date: new Date(currentYear, 11, 25), researchWeeks: 12, type: "Holiday" },
  { id: 'nye', name: "New Year's Eve", date: new Date(currentYear, 11, 31), researchWeeks: 6, type: "Celebration" },
].sort((a, b) => a.date - b.date);

const getActiveResearchWindows = () => {
  const today = new Date();
  return US_FESTIVALS.filter(fest => {
    const researchStart = new Date(fest.date);
    researchStart.setDate(researchStart.getDate() - (fest.researchWeeks * 7));
    return today >= researchStart && today <= fest.date;
  });
};

const getNextFestival = () => {
  const today = new Date();
  return US_FESTIVALS.find(fest => fest.date >= today) || US_FESTIVALS[0];
};

// --- AI GENERATION HELPER (GEMINI API) ---
const generateProductsViaAI = async (type, category = 'All') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; // Set in .env for live AI research
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  
  const timeframe = type === 'weekly' ? '7 days' : '24 hours';
  const categoryPrompt = category !== 'All' 
    ? `4. CRITICAL: The product MUST belong STRICTLY to the requested category: "${category}". Do not output products from any other category.`
    : `4. CRITICAL: Categories must be chosen from this exact list: ${CATEGORIES.join(', ')}.`;

  const electronicsRule = `1. NO ELECTRONICS. Reject anything with a battery, plug, or microchip.`;

  const prompt = `
    Act as an expert e-commerce product researcher specializing in Amazon-to-eBay dropshipping.
    Generate a list of 5 HIGHLY SPECIFIC, realistic, non-branded, generic products that are currently trending.
    
    STRICT RULES:
    ${electronicsRule}
    2. PRICE RANGE: $1 to $10 maximum.
    3. GENERIC ONLY. No brand names.
    ${categoryPrompt}
    5. These must be products gaining traction in the last ${timeframe}.

    Provide a realistic analysis for each.
  `;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "A unique random string ID" },
            name: { type: "STRING", description: "Descriptive generic product name" },
            category: { type: "STRING", description: "Must exactly match one of the allowed categories" },
            priceEst: { type: "STRING", description: "Estimated price between $1 and $10" },
            demandLevel: { type: "STRING", description: "E.g., High, Very High, Surging" },
            trendStatus: { type: "STRING", description: "E.g., New Trend, Steady Growth" },
            competition: { type: "STRING", description: "Low, Medium, or High" },
            whyTrending: { type: "STRING", description: "Short 1-sentence reason why this is trending right now" },
            seasonality: { type: "STRING", description: "E.g., Year-round, Summer, Winter" },
            score: { type: "NUMBER", description: "Recommendation score 0-100" }
          },
          required: ["id", "name", "category", "priceEst", "demandLevel", "trendStatus", "competition", "whyTrending", "seasonality", "score"]
        }
      }
    }
  };

  if (!apiKey) { console.warn('Gemini API key is not configured. Add VITE_GEMINI_API_KEY to .env.'); return null; }
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      return JSON.parse(result.candidates[0].content.parts[0].text);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Error generating products:", error);
    return null;
  }
};

const generateSeasonalProductsViaAI = async (festivalName) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; 
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  
  const prompt = `
    Act as an expert Amazon-to-eBay dropshipping analyst.
    Generate a list of 5 HIGHLY SPECIFIC, generic, non-branded product ideas for the upcoming festival: "${festivalName}".
    
    STRICT RULES:
    1. NO ELECTRONICS or trademarked brands.
    2. PRICE RANGE: $1 to $15 maximum.
    3. GENERIC ONLY.
    4. Must have high relevance to "${festivalName}" and strong seasonal demand.
    
    Provide actionable metadata for eBay listing. Do not hallucinate URLs, use realistic search terms.
  `;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            name: { type: "STRING", description: "Product name" },
            imageKeyword: { type: "STRING", description: "2-3 word simple keyword for Unsplash image search" },
            festival: { type: "STRING", description: "The festival name" },
            category: { type: "STRING", description: "Broad category" },
            priceEst: { type: "STRING", description: "E.g. $5 - $12" },
            demandLevel: { type: "STRING", description: "E.g. High, Very High" },
            competition: { type: "STRING", description: "Low, Medium, or High" },
            evidence: { type: "STRING", description: "Why is it trending for this festival?" },
            listingTitle: { type: "STRING", description: "Optimized eBay title (max 80 chars)" },
            keywords: { type: "ARRAY", items: { type: "STRING" }, description: "3-5 suggested keywords" },
            tags: { type: "ARRAY", items: { type: "STRING" }, description: "EXACTLY 13 relevant eBay search tags" }
          },
          required: ["id", "name", "imageKeyword", "festival", "category", "priceEst", "demandLevel", "competition", "evidence", "listingTitle", "keywords", "tags"]
        }
      }
    }
  };

  if (!apiKey) { console.warn('Gemini API key is not configured. Add VITE_GEMINI_API_KEY to .env.'); return null; }
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      return JSON.parse(result.candidates[0].content.parts[0].text);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Error generating seasonal products:", error);
    return null;
  }
};

const checkCompetitionViaAI = async (productName) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; 
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  
  const prompt = `
    Act as an eBay market analyst. Analyze the dropshipping competition for a generic product: "${productName}".
    Estimate the market saturation, seller count, and barrier to entry for a new dropshipper.
    Keep the analysis professional, brief (3-4 sentences), and formatted as a JSON object.
  `;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          estimatedSellers: { type: "STRING", description: "E.g., 50-100, 500+" },
          saturationLevel: { type: "STRING", description: "Low, Medium, High, or Oversaturated" },
          opportunityRating: { type: "STRING", description: "Good, Fair, or Poor" },
          analysis: { type: "STRING", description: "A brief 3-4 sentence analysis paragraph" }
        }
      }
    }
  };

  if (!apiKey) { console.warn('Gemini API key is not configured. Add VITE_GEMINI_API_KEY to .env.'); return null; }
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Error checking competition:", error);
    return null;
  }
};

// --- COMPONENTS ---

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    brand: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function DropshipDashboard() {
  // State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Data State
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [seasonalData, setSeasonalData] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState({ daily: null, weekly: null, seasonal: null });
  const [activeFestival, setActiveFestival] = useState(null);
  
  // Loading States
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [loadingSeasonal, setLoadingSeasonal] = useState(false);
  
  // Competition State
  const [compQuery, setCompQuery] = useState('');
  const [compResult, setCompResult] = useState(null);
  const [loadingComp, setLoadingComp] = useState(false);

  // Load and persist saved products locally on this device.
  useEffect(() => {
    try { setSavedProducts(JSON.parse(localStorage.getItem('arshad-saved-products') || '[]')); }
    catch { setSavedProducts([]); }
  }, []);

  useEffect(() => {
    localStorage.setItem('arshad-saved-products', JSON.stringify(savedProducts));
  }, [savedProducts]);

  // Dark Mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial Data Load (Simulate one-time fetch or pull from local if desired, we'll force fetch on first visit to tab)
  const refreshDaily = async () => {
    setLoadingDaily(true);
    const data = await generateProductsViaAI('daily', selectedCategory);
    if (data) {
      setDailyData(data);
      setLastUpdated(prev => ({ ...prev, daily: new Date().toLocaleString() }));
    }
    setLoadingDaily(false);
  };

  const refreshWeekly = async () => {
    setLoadingWeekly(true);
    const data = await generateProductsViaAI('weekly', selectedCategory);
    if (data) {
      setWeeklyData(data);
      setLastUpdated(prev => ({ ...prev, weekly: new Date().toLocaleString() }));
    }
    setLoadingWeekly(false);
  };

  const loadSeasonalProducts = async (festival) => {
    setActiveFestival(festival);
    setLoadingSeasonal(true);
    const data = await generateSeasonalProductsViaAI(festival.name);
    if (data) {
      setSeasonalData(data);
      setLastUpdated(prev => ({ ...prev, seasonal: new Date().toLocaleString() }));
    }
    setLoadingSeasonal(false);
  };

  const handleCompetitionCheck = async (e) => {
    e.preventDefault();
    if (!compQuery.trim()) return;
    setLoadingComp(true);
    const result = await checkCompetitionViaAI(compQuery);
    setCompResult(result);
    setLoadingComp(false);
  };

  // Wishlist Handlers
  const toggleSaveProduct = (product) => {
    setSavedProducts(current => current.some(p => p.id === product.id)
      ? current.filter(p => p.id !== product.id)
      : [...current, product]);
  };

  // UI Components
  const ProductCard = ({ product, isSeasonal = false }) => {
    const isSaved = savedProducts.some(p => p.id === product.id);
    const compColor = product.competition.toLowerCase().includes('low') ? 'success' 
                    : product.competition.toLowerCase().includes('high') ? 'danger' 
                    : 'warning';
                    
    const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`;
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(product.name)}`;
    
    const imageUrl = isSeasonal && product.imageKeyword 
      ? `https://source.unsplash.com/400x300/?${encodeURIComponent(product.imageKeyword)}`
      : `https://placehold.co/400x300/${isDarkMode ? '1e293b' : 'f1f5f9'}/${isDarkMode ? '94a3b8' : '64748b'}?text=${encodeURIComponent(product.category || 'Product')}`;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
        {/* Header/Image Area */}
        <div className="relative h-48 bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-b border-slate-200 dark:border-slate-700">
          <img 
            src={imageUrl}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover ${isSeasonal ? 'opacity-80' : 'opacity-60 mix-blend-multiply dark:mix-blend-lighten'}`}
            onError={(e) => { e.target.src = `https://placehold.co/400x300/${isDarkMode ? '1e293b' : 'f1f5f9'}/${isDarkMode ? '94a3b8' : '64748b'}?text=${encodeURIComponent('Product')}`; }}
          />
          <div className={`z-10 text-center p-4 ${isSeasonal ? 'bg-black/40 w-full h-full flex flex-col justify-center' : ''}`}>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight line-clamp-2">{product.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 font-medium">{product.priceEst}</p>
          </div>
          
          <button 
            onClick={() => toggleSaveProduct(product)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors z-20 group"
          >
            <Heart size={18} className={`${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-red-400'}`} />
          </button>
          
          {!isSeasonal && (
            <div className="absolute top-3 left-3 z-20 flex gap-1">
              <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <Target size={12} /> {product.score}/100
              </div>
            </div>
          )}
          {isSeasonal && product.festival && (
            <div className="absolute top-3 left-3 z-20 flex gap-1">
              <div className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <CalendarHeart size={12} /> {product.festival}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="brand">{product.category}</Badge>
            <Badge variant={compColor}>Comp: {product.competition}</Badge>
            {!isSeasonal && <Badge variant="default">{product.seasonality}</Badge>}
            {isSeasonal && <Badge variant="warning">{product.demandLevel}</Badge>}
          </div>

          <div className="space-y-3 flex-1 text-sm">
            {!isSeasonal && (
              <div className="flex items-start gap-2">
                <Activity className="text-indigo-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Demand: </span>
                  <span className="text-slate-600 dark:text-slate-400">{product.demandLevel} ({product.trendStatus})</span>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <TrendingUp className={isSeasonal ? "text-pink-500 mt-0.5 shrink-0" : "text-green-500 mt-0.5 shrink-0"} size={16} />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{isSeasonal ? 'Evidence: ' : 'Why Trending: '}</span>
                <span className="text-slate-600 dark:text-slate-400 italic">"{isSeasonal ? product.evidence : product.whyTrending}"</span>
              </div>
            </div>

            {isSeasonal && (
              <>
                <div className="pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs block mb-1">Listing Title Suggestion:</span>
                  <p className="text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-mono">
                    {product.listingTitle}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs block mb-1">eBay Search Tags (13):</span>
                  <div className="flex flex-wrap gap-1">
                    {product.tags?.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex justify-between items-center w-full">
              <a href={amazonSearchUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-md flex-1 justify-center mr-2 border border-amber-200 dark:border-amber-800">
                <ShoppingBag size={14} /> Amazon USA
              </a>
              <a href={ebaySearchUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md flex-1 justify-center border border-blue-200 dark:border-blue-800">
                <Tag size={14} /> eBay USA
              </a>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Info size={12}/> AI Estimated Research Data
            </span>
          </div>
        </div>
      </div>
    );
  };

  const NavItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
        ${activeTab === id 
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
      {label}
    </button>
  );

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
            <LayoutDashboard size={24} />
            <span>Arshad Shamsi AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Research Tools</div>
        <nav className="flex-1 px-3 space-y-1">
          <NavItem id="dashboard" label="Dashboard" icon={BarChart3} />
          <NavItem id="daily" label="Daily Picks" icon={Calendar} />
          <NavItem id="weekly" label="Weekly Picks" icon={CalendarDays} />
          <NavItem id="seasonal" label="Seasonal Calendar" icon={CalendarHeart} />
          <NavItem id="competition" label="Competition Checker" icon={Target} />
        </nav>

        <div className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8">My Workspace</div>
        <nav className="px-3 pb-6 space-y-1">
          <NavItem id="saved" label={`Saved Products (${savedProducts.length})`} icon={Heart} />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto text-xs text-slate-400">
          <p className="flex items-center gap-1 mb-2"><ShieldAlert size={12}/> Generic items only.</p>
          <p>Strictly no electronics.</p>
          <p>Target price: $1 - $10.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold capitalize">
              {activeTab === 'dashboard' ? 'Overview Dashboard' 
                : activeTab === 'daily' ? "Daily Picks" 
                : activeTab === 'weekly' ? 'Weekly Picks'
                : activeTab === 'seasonal' ? 'Festival & Seasonal Calendar'
                : activeTab === 'competition' ? 'Competition Analysis'
                : 'Wishlist'}
            </h1>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Tab Content */}
        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Active Research Windows Alert */}
              {getActiveResearchWindows().length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-4 shadow-sm">
                  <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-lg shrink-0 mt-0.5">
                    <Bell className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Active Research Windows</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300/80 mt-1 mb-2">It's the optimal time to research and list dropshipping products for these upcoming events:</p>
                    <div className="flex flex-wrap gap-2">
                      {getActiveResearchWindows().map(fest => (
                        <button key={fest.id} onClick={() => { setActiveTab('seasonal'); loadSeasonalProducts(fest); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm">
                          {fest.name} <CalendarHeart size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                  <h3 className="text-indigo-100 font-medium mb-1">Items Analyzed Today</h3>
                  <div className="text-4xl font-bold">1,400+</div>
                  <p className="text-sm mt-2 text-indigo-100/80 flex items-center gap-1">
                    <Info size={14}/> AI Estimated Volume
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Your Saved Products</h3>
                  <div className="text-4xl font-bold text-slate-800 dark:text-white">{savedProducts.length}</div>
                  <button onClick={() => setActiveTab('saved')} className="text-sm text-indigo-500 mt-2 font-medium hover:underline">View Wishlist &rarr;</button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Fastest Category</h3>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">Home & Kitchen</div>
                  <p className="text-sm text-green-500 mt-2 font-medium flex items-center gap-1">
                    <TrendingUp size={14}/> Trending Up
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quick Start</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => { setActiveTab('daily'); if(!dailyData.length) refreshDaily(); }} className="p-6 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors group">
                    <Calendar className="text-indigo-500 mb-3" size={32} />
                    <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Daily Picks</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Find 5 new generic trending products right now.</p>
                  </button>
                  <button onClick={() => setActiveTab('seasonal')} className="p-6 rounded-xl border-2 border-dashed border-pink-200 dark:border-pink-900/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-left transition-colors group">
                    <CalendarHeart className="text-pink-500 mb-3" size={32} />
                    <h3 className="font-bold text-lg mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400">Seasonal Finder</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Next: {getNextFestival().name}</p>
                  </button>
                  <button onClick={() => setActiveTab('competition')} className="p-6 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition-colors group">
                    <Target className="text-emerald-500 mb-3" size={32} />
                    <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Check Competition</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Analyze eBay saturation.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DAILY RESEARCH TAB */}
          {activeTab === 'daily' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex-1">
                  <h2 className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Activity size={20}/> Real-Time AI Generation
                  </h2>
                  <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mt-1">Discovering non-electronic, generic items under $10.</p>
                  {lastUpdated.daily && <p className="text-xs text-slate-500 mt-2">Last checked: {lastUpdated.daily}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700/50 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button 
                    onClick={refreshDaily} 
                    disabled={loadingDaily}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 whitespace-nowrap"
                  >
                    <RefreshCw size={18} className={loadingDaily ? 'animate-spin' : ''} />
                    {loadingDaily ? 'Scanning Market...' : 'Refresh Daily'}
                  </button>
                </div>
              </div>

              {!dailyData.length && !loadingDaily && (
                <div className="text-center py-20 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <Search className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No data generated today</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">Click the refresh button above to instruct the AI to find 5 new trending generic product opportunities.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dailyData.map(item => <ProductCard key={item.id} product={item} />)}
              </div>
            </div>
          )}

          {/* WEEKLY RESEARCH TAB */}
          {activeTab === 'weekly' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50">
                <div className="flex-1">
                  <h2 className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <TrendingUp size={20}/> 7-Day Trend Analysis
                  </h2>
                  <p className="text-sm text-purple-700/80 dark:text-purple-400/80 mt-1">Identifying sustained demand for generic dropship items.</p>
                  {lastUpdated.weekly && <p className="text-xs text-slate-500 mt-2">Last checked: {lastUpdated.weekly}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700/50 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button 
                    onClick={refreshWeekly} 
                    disabled={loadingWeekly}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 whitespace-nowrap"
                  >
                    <RefreshCw size={18} className={loadingWeekly ? 'animate-spin' : ''} />
                    {loadingWeekly ? 'Analyzing Trends...' : 'Refresh Weekly'}
                  </button>
                </div>
              </div>

              {!weeklyData.length && !loadingWeekly && (
                <div className="text-center py-20 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <CalendarDays className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No weekly data found</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">Generate a fresh batch of weekly trending generic products.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {weeklyData.map(item => <ProductCard key={item.id} product={item} />)}
              </div>
            </div>
          )}

          {/* SEASONAL CALENDAR TAB */}
          {activeTab === 'seasonal' && (
            <div className="space-y-6">
              
              {!activeFestival ? (
                <>
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">USA Festival & Event Calendar {currentYear}</h2>
                      <p className="text-pink-100 max-w-xl">Plan your dropshipping inventory ahead of time. Select a festival to discover highly targeted, seasonal generic products ready for listing.</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center shrink-0">
                      <p className="text-sm text-pink-100 uppercase tracking-wider font-semibold mb-1">Next Major Event</p>
                      <p className="text-2xl font-bold">{getNextFestival().name}</p>
                      <p className="text-sm mt-1">{getNextFestival().date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {US_FESTIVALS.map((fest) => {
                      const isActiveWindow = getActiveResearchWindows().some(f => f.id === fest.id);
                      const isPast = fest.date < new Date();
                      
                      return (
                        <button
                          key={fest.id}
                          onClick={() => loadSeasonalProducts(fest)}
                          className={`p-5 rounded-xl border text-left transition-all hover:-translate-y-1 hover:shadow-lg
                            ${isPast 
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70 grayscale' 
                              : isActiveWindow
                                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 ring-2 ring-pink-500/50 shadow-md'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                              {fest.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {isActiveWindow && (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                                <Clock size={10} /> Research Now
                              </span>
                            )}
                          </div>
                          <h3 className={`font-bold text-lg mb-1 ${isPast ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                            {fest.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <Info size={12}/> Start {fest.researchWeeks} weeks prior
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-900/50">
                    <div className="flex-1">
                      <button onClick={() => setActiveFestival(null)} className="text-sm font-medium text-pink-600 hover:text-pink-700 mb-2 flex items-center gap-1">
                         &larr; Back to Calendar
                      </button>
                      <h2 className="font-semibold text-pink-900 dark:text-pink-300 flex items-center gap-2 text-xl">
                        <CalendarHeart size={24}/> {activeFestival.name} Product Ideas
                      </h2>
                      <p className="text-sm text-pink-700/80 dark:text-pink-400/80 mt-1">
                        Event Date: {activeFestival.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => loadSeasonalProducts(activeFestival)} 
                        disabled={loadingSeasonal}
                        className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 whitespace-nowrap shadow-sm"
                      >
                        <RefreshCw size={18} className={loadingSeasonal ? 'animate-spin' : ''} />
                        {loadingSeasonal ? 'Finding Products...' : 'Refresh Ideas'}
                      </button>
                    </div>
                  </div>

                  {loadingSeasonal ? (
                     <div className="text-center py-20 px-4">
                       <RefreshCw className="mx-auto text-pink-400 animate-spin mb-4" size={48} />
                       <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Analyzing Market Trends...</h3>
                       <p className="text-slate-500 mt-2">Discovering high-demand generic products for {activeFestival.name}.</p>
                     </div>
                  ) : !seasonalData.length ? (
                    <div className="text-center py-20 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                      <ShoppingBag className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No products generated yet</h3>
                      <p className="text-slate-500 mt-2 max-w-md mx-auto">Click refresh to generate custom product ideas.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
                         <AlertCircle size={20} className="shrink-0 mt-0.5" />
                         <p><strong>Ready-to-List Suggestions:</strong> These are AI-generated generic product concepts based on current seasonal trends. Use the provided Amazon and eBay links to verify exact availability and current competition before listing.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {seasonalData.map(item => <ProductCard key={item.id} product={item} isSeasonal={true} />)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SAVED PRODUCTS TAB */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="mb-6">
                <p className="text-slate-500 dark:text-slate-400">Your personal research wishlist stored in Firebase. These are items you flagged for further investigation.</p>
              </div>

              {savedProducts.length === 0 ? (
                <div className="text-center py-20 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <Heart className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Your wishlist is empty</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">Browse the Daily, Weekly, or Seasonal research tabs and click the heart icon to save products here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {savedProducts.map(item => <ProductCard key={item.id} product={item} isSeasonal={!!item.festival} />)}
                </div>
              )}
            </div>
          )}

          {/* COMPETITION CHECKER TAB */}
          {activeTab === 'competition' && (
            <div className="max-w-3xl mx-auto mt-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
                <h2 className="text-xl font-bold mb-2">eBay Saturation Analysis</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Enter a generic product name to get an AI estimation of how competitive it is on eBay for dropshipping.</p>
                
                <form onSubmit={handleCompetitionCheck} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={compQuery}
                    onChange={(e) => setCompQuery(e.target.value)}
                    placeholder="e.g., Stainless Steel Garlic Press"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={loadingComp || !compQuery.trim()}
                    className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {loadingComp ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                    {loadingComp ? 'Analyzing...' : 'Analyze'}
                  </button>
                </form>
              </div>

              {compResult && !loadingComp && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Results for</h3>
                      <p className="text-xl font-bold text-slate-800 dark:text-white">"{compQuery}"</p>
                    </div>
                    <Badge variant={compResult.saturationLevel.includes('Low') ? 'success' : compResult.saturationLevel.includes('High') || compResult.saturationLevel.includes('Over') ? 'danger' : 'warning'} className="text-sm px-3 py-1">
                      {compResult.saturationLevel} Saturation
                    </Badge>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">Est. Sellers on eBay</div>
                        <div className="text-2xl font-bold">{compResult.estimatedSellers}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">Opportunity Rating</div>
                        <div className="text-2xl font-bold flex items-center gap-2">
                          {compResult.opportunityRating}
                          {compResult.opportunityRating === 'Good' && <CheckCircle2 className="text-green-500" size={20}/>}
                          {compResult.opportunityRating === 'Poor' && <AlertCircle className="text-red-500" size={20}/>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">AI Market Analysis</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                        {compResult.analysis}
                      </p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Info size={14}/> These figures are AI estimations based on general market trends, not direct eBay API data.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}