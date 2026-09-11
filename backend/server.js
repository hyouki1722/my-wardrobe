const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// 初始化 Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 將 Supabase 的 id 映射為前端 Vue 依賴的 _id
const formatId = (item) => item ? { ...item, _id: item.id } : null;
const formatList = (list) => list ? list.map(formatId) : [];

// ==========================================
// 香氛專區 API
// ==========================================
app.get('/api/perfumes', async (req, res) => {
  try {
    const { occasion, search } = req.query;
    let query = supabase.from('perfumes').select('*').order('createdAt', { ascending: false });

    if (occasion) query = query.eq('occasion', occasion);
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,"scentType".ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(formatList(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/perfumes', async (req, res) => {
  try {
    const { data, error } = await supabase.from('perfumes').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(formatId(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 數位衣櫥與穿搭 API
// ==========================================
app.get('/api/clothes', async (req, res) => {
  try {
    const { category, season, occasion } = req.query;
    let query = supabase.from('clothes').select('*').order('createdAt', { ascending: false });

    if (category) query = query.eq('category', category);
    if (season) query = query.eq('season', season);
    if (occasion) query = query.eq('occasion', occasion);

    const { data, error } = await query;
    if (error) throw error;
    res.json(formatList(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clothes', async (req, res) => {
  try {
    delete req.body._id; // 避免插入不存在的欄位
    const { data, error } = await supabase.from('clothes').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(formatId(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/clothes/:id', async (req, res) => {
  try {
    delete req.body._id;
    const { data, error } = await supabase.from('clothes').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(formatId(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/clothes/wear/:id', async (req, res) => {
  try {
    const { data: cloth, error: fetchErr } = await supabase.from('clothes').select('*').eq('id', req.params.id).single();
    if (fetchErr || !cloth) return res.status(404).json({ error: '找不到該單品' });

    const newCount = (cloth.wearCount || 0) + 1;
    const { data, error } = await supabase.from('clothes').update({ "wearCount": newCount }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, cloth: formatId(data) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 智慧搜圖與特徵分析 API
// ==========================================
app.post('/api/clothes/smart-analyze', upload.single('image'), async (req, res) => {
  try {
    const textHint = (req.body.hint || '').trim();
    const catalog = [
      { keyword: '西裝', name: '都會修身西裝外套', category: '外套', brand: 'Theory', material: '精紡羊毛', season: '秋冬', price: 3200, style: '知性幹練', color: '米白', occasion: '職場', matchingPerfume: 'Narciso Rodriguez Pure Musc', webImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80' },
      { keyword: '洋裝', name: '法式碎花雪紡抓皺洋裝', category: '連身洋裝', brand: 'Reformation', material: '輕盈雪紡真絲', season: '春夏', price: 2800, style: '溫柔浪漫', color: '粉藍/碎花', occasion: '約會', matchingPerfume: 'Miss Dior 花漾女性淡香水', webImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80' }
    ];
    let result = catalog.find(item => textHint.includes(item.keyword)) || catalog[0];

    res.json({ success: true, analyzed: result, message: '解析完成' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 穿搭經濟學與色彩報表 API
// ==========================================
app.get('/api/wardrobe/monthly-report', async (req, res) => {
  try {
    const { data: allClothes, error } = await supabase.from('clothes').select('*');
    if (error) throw error;
    if (allClothes.length === 0) return res.json({ mvp: null, neglected: [], averageCostPerWear: 0 });

    const sorted = [...allClothes].sort((a, b) => {
      if (b.wearCount !== a.wearCount) return b.wearCount - a.wearCount;
      return (a.price / (a.wearCount || 1)) - (b.price / (b.wearCount || 1));
    });

    const mvpItem = sorted[0];
    const mvpCostPerWear = mvpItem.wearCount > 0 ? Math.round(mvpItem.price / mvpItem.wearCount) : mvpItem.price;

    const neglected = sorted.filter(item => item.wearCount <= 1).slice(0, 3).map(item => ({
      ...formatId(item),
      rescueSuggestion: `此款「${item.name}」適合【${item.season}】。推薦以「${item.style}」風格搭配【${item.matchingPerfume}】，重新釋放單品價值！`
    }));

    res.json({
      mvp: { ...formatId(mvpItem), costPerWear: mvpCostPerWear, evaluation: `單次成本僅 NT$ ${mvpCostPerWear}，本月 CP 值最高！` },
      neglected
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/wardrobe/color-analytics', async (req, res) => {
  try {
    const { data: clothes, error } = await supabase.from('clothes').select('*');
    if (error) throw error;

    const categoryCounts = { '上衣': 0, '下裝': 0, '連身洋裝': 0, '連身褲裝': 0, '外套': 0, '鞋子': 0, '飾品': 0, '頭飾': 0, '穿搭配件': 0 };
    const colorMap = {};

    clothes.forEach(item => {
      if (categoryCounts[item.category] !== undefined) categoryCounts[item.category]++;
      if (item.color) {
        const c = item.color.trim();
        colorMap[c] = (colorMap[c] || 0) + 1;
      }
    });

    const sortedColors = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .map(([color, count]) => ({ color, count, percentage: clothes.length > 0 ? Math.round((count / clothes.length) * 100) : 0 }));

    const topThree = sortedColors.slice(0, 3);
    const topNames = topThree.map(t => t.color).join('、');
    
    let advice = '目前衣櫥色彩搭配平衡，能應對多元日常場合！';
    if (topNames.includes('黑') || topNames.includes('白') || topNames.includes('灰')) {
      advice = `目前衣櫥主要以【${topNames}】為主。建議導入「鼠尾草綠、煙燻粉或焦糖駝色」等莫蘭迪色系配件作為跳色。`;
    } else if (topNames.includes('藍') || topNames.includes('冷')) {
      advice = `目前衣櫥色系偏向冷調（如【${topNames}】），建議選用「燕麥奶白、淡鵝黃或玫瑰金」進行冷暖平衡。`;
    }

    res.json({ totalCount: clothes.length, categoryCounts, topThree, colorAdvice: advice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 預設資料初始化
// ==========================================
async function initDefaultData() {
  const { data, error } = await supabase.from('clothes').select('id').limit(1);
  if (!error && data.length === 0) {
    await supabase.from('clothes').insert([
      { name: '都會修身西裝外套', category: '外套', brand: 'Theory', season: '秋冬', price: 3500, "wearCount": 7, style: '知性幹練', color: '米白', occasion: '職場', "webSearchImage": 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80', "matchingPerfume": 'Narciso Rodriguez Pure Musc' },
      { name: '高腰垂墜修身西裝寬褲', category: '下裝', brand: 'UNIQLO', season: '四季', price: 1290, "wearCount": 9, style: '俐落大方', color: '炭黑', occasion: '職場', "webSearchImage": 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80', "matchingPerfume": 'Tom Ford 白麝香淡香精' }
    ]);
    console.log('👗 Supabase 衣櫥預設資料初始化完畢');
  }
}
initDefaultData();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 後端伺服器運行於 http://localhost:${PORT}`));