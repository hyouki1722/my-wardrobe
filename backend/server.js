require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // 擴大 JSON 限制以接收 Base64 圖片

const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 👕 1. 智慧視覺辨識與單品拆解 API
// ==========================================
app.post('/api/clothes/smart-analyze', upload.single('image'), async (req, res) => {
  try {
    console.log("📥 收到圖片上傳請求！");
    if (!req.file) {
      console.log("❌ 錯誤：沒有收到圖片檔案");
      return res.status(400).json({ error: '請上傳圖片' });
    }

    console.log("✅ 圖片接收成功，準備呼叫 Gemini 模型...");
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    
    const prompt = `你是一位專業的服裝鑑定師。請分析這張照片中人物身上「所有」可見的衣著單品（包含內搭上衣、外搭外套、下裝、鞋款、包包、帽子、飾品等），請盡可能完整且鉅細靡遺地拆解。
    請以 JSON 陣列格式回傳。
    每個單品必須包含以下欄位：
    "name" (精確的服飾名稱，如：都會修身西裝外套、卡其休閒長褲),
    "category" (必須是: 上衣, 下裝, 連身洋裝, 連身褲裝, 外套, 鞋子, 飾品, 頭飾, 穿搭配件 其中之一),
    "color" (目測顏色),
    "material" (推測材質，如：針織、純棉、牛仔布、精紡羊毛、高彈力尼龍混紡),
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
    
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const analyzedItems = JSON.parse(responseText);

    console.log("🎉 AI 解析成功！共找出", analyzedItems.length, "件單品");
    res.json({ success: true, items: analyzedItems });
  } catch (error) {
    console.error('💥 AI 解析發生錯誤:', error);
    res.status(500).json({ error: '智慧分析失敗，請確認 API 狀態' });
  }
});

// ==========================================
// 👗 2. 數位衣櫥 CRUD 操作 API
// ==========================================
app.get('/api/clothes', async (req, res) => {
  try {
    let query = supabase.from('clothes').select('*');
    if (req.query.category) query = query.eq('category', req.query.category);
    if (req.query.season) query = query.eq('season', req.query.season);
    
    const { data, error } = await query;
    if (error) throw error;
    
    const formattedData = data.map(item => ({ ...item, _id: item.id }));
    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clothes', async (req, res) => {
  try {
    const newItem = { ...req.body, wearCount: 0 };
    delete newItem._id; 
    
    const { data, error } = await supabase.from('clothes').insert([newItem]).select();
    if (error) throw error;
    res.json({ success: true, item: { ...data[0], _id: data[0].id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.post('/api/clothes/wear/:id', async (req, res) => {
  try {
    const { data: itemData, error: fetchError } = await supabase.from('clothes').select('wearCount').eq('id', req.params.id).single();
    if (fetchError) throw fetchError;

    const newWearCount = (itemData.wearCount || 0) + 1;
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
      colorAdvice: "您目前的衣櫃色彩相當有個人風格！可以考慮在下一季加入一些對比色系，能讓整體穿搭的層次感更加豐富且具變化性。"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.listen(port, () => {
  console.log(`🚀 MyWardrobe 後端伺服器已啟動於 port ${port}`);
});