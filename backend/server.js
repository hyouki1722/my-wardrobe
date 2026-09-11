require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 初始化 Express 應用程式
const app = express();
const port = process.env.PORT || 3000;

// 啟用 CORS 與 JSON 解析
app.use(cors());
app.use(express.json());

// 設定 multer：將圖片暫存在記憶體中，方便直接轉換給 AI 解析
const upload = multer({ storage: multer.memoryStorage() });

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化 Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 👕 1. 智慧視覺辨識與單品拆解 API (Gemini)
// ==========================================
app.post('/api/clothes/smart-analyze', upload.single('image'), async (req, res) => {
  try {
    console.log("📥 收到圖片上傳請求！");
    if (!req.file) {
      console.log("❌ 錯誤：沒有收到圖片檔案");
      return res.status(400).json({ error: '請上傳圖片' });
    }

    console.log("✅ 圖片接收成功，準備呼叫 Gemini 模型...");
    // 這裡使用 flash 模型以確保速度與視覺辨識能力
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `你是一位專業的服裝鑑定師。請分析這張照片中人物身上所有的衣著單品。
    請以 JSON 陣列格式回傳，找出最明顯的 1~3 件單品。
    每個單品必須包含以下欄位：
    "name" (精確的服飾名稱，如：都會修身西裝外套、卡其休閒長褲),
    "category" (必須是: 上衣, 下裝, 連身洋裝, 連身褲裝, 外套, 鞋子, 飾品, 頭飾, 穿搭配件 其中之一),
    "color" (目測顏色),
    "material" (推測材質，如：針織、純棉、牛仔布、精紡羊毛),
    "season" (推測適配季節：春夏, 秋冬, 或 四季),
    "price" (推測這類單品的合理台幣價格數字),
    "brand" (推測可能風格類似的品牌，如 ZARA, UNIQLO)
    請確保只輸出 JSON 格式，不要包含其他文字說明或 markdown 標籤。`;

    const imageParts = [{
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    }];

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text();
    console.log("🤖 AI 原始回覆：", responseText);
    
    // 清理 markdown 標籤並轉為純 JSON 解析
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const analyzedItems = JSON.parse(responseText);

    console.log("🎉 AI 解析成功！共找出", analyzedItems.length, "件單品");
    res.json({ success: true, items: analyzedItems });
  } catch (error) {
    console.error('💥 AI 解析發生錯誤:', error);
    res.status(500).json({ error: '智慧分析失敗，請確認圖片格式或 API Key' });
  }
});

// ==========================================
// 👗 2. 數位衣櫥 CRUD 操作 API
// ==========================================

// 取得衣櫥所有單品 (支援篩選)
app.get('/api/clothes', async (req, res) => {
  try {
    let query = supabase.from('clothes').select('*');
    if (req.query.category) query = query.eq('category', req.query.category);
    if (req.query.season) query = query.eq('season', req.query.season);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // 映射為前端適用的 _id 格式
    const formattedData = data.map(item => ({ ...item, _id: item.id }));
    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增單品至衣櫥
app.post('/api/clothes', async (req, res) => {
  try {
    const newItem = { ...req.body, wearCount: 0 };
    delete newItem._id; // 交由 Supabase 自動產生 ID
    
    const { data, error } = await supabase.from('clothes').insert([newItem]).select();
    if (error) throw error;
    res.json({ success: true, item: { ...data[0], _id: data[0].id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新單品資訊
app.put('/api/clothes/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;

    const { data, error } = await supabase.from('clothes').update(updateData).eq('id', req.params.id).select();
    if (error) throw error;
    res.json({ success: true, item: { ...data[0], _id: data[0].id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 穿搭打卡 (增加穿著次數)
app.post('/api/clothes/wear/:id', async (req, res) => {
  try {
    // 取得當前 wearCount
    const { data: itemData, error: fetchError } = await supabase.from('clothes').select('wearCount').eq('id', req.params.id).single();
    if (fetchError) throw fetchError;

    const newWearCount = (itemData.wearCount || 0) + 1;

    // 更新 wearCount
    const { data, error } = await supabase.from('clothes').update({ wearCount: newWearCount }).eq('id', req.params.id).select();
    if (error) throw error;
    
    res.json({ success: true, wearCount: data[0].wearCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 🎨 3. 衣櫥分析與報表 API
// ==========================================

// 取得色彩診斷與分類統計
app.get('/api/wardrobe/color-analytics', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clothes').select('category, color');
    if (error) throw error;

    const categoryCounts = {};
    const colorCounts = {};
    
    data.forEach(item => {
      if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      if (item.color) colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
    });

    const totalColors = Object.values(colorCounts).reduce((a, b) => a + b, 0);
    const topThree = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color, count]) => ({
        color,
        count,
        percentage: totalColors > 0 ? Math.round((count / totalColors) * 100) : 0
      }));

    res.json({
      categoryCounts,
      topThree,
      colorAdvice: "您目前的衣櫃色彩相當有個人風格！可以考慮在下一季加入一些對比色系（如大地色或亮色系配件），能讓整體穿搭的層次感更加豐富且具變化性。"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 穿搭經濟學月報表 (MVP 與 閒置單品)
app.get('/api/wardrobe/monthly-report', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clothes').select('*');
    if (error) throw error;

    let mvp = null;
    let lowestCPW = Infinity;
    const neglected = [];

    data.forEach(item => {
      if (!item.wearCount || item.wearCount === 0) {
        neglected.push({ ...item, _id: item.id, rescueSuggestion: '搭配百搭的牛仔褲或素色內搭，週末試著穿它出門吧！' });
      } else {
        const cpw = Math.round(item.price / item.wearCount);
        if (cpw < lowestCPW) {
          lowestCPW = cpw;
          mvp = { ...item, _id: item.id, costPerWear: cpw, evaluation: '這件單品的回報率極高，是您衣櫃裡的超級戰將！' };
        }
      }
    });

    res.json({ mvp, neglected: neglected.slice(0, 4) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 🌸 4. 典藏香氛庫 API
// ==========================================
app.get('/api/perfumes', async (req, res) => {
  try {
    let query = supabase.from('perfumes').select('*');
    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,brand.ilike.%${req.query.search}%,scentType.ilike.%${req.query.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const formattedData = data.map(item => ({ ...item, _id: item.id }));
    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`🚀 MyWardrobe 後端伺服器已啟動於 port ${port}`);
});