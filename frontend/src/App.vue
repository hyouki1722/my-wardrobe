<template>
  <div class="app-layout">
    <!-- 頂端 Header -->
    <header class="main-header">
      <div class="logo-area">
        <h1>✨ MyWardrobe 智慧衣櫥與穿搭經濟學 ✨</h1>
        <p>克服光線色差・材質與季節解析・單次穿搭成本評比・香調搭配建議</p>
      </div>

      <!-- 導覽切換 -->
      <nav class="tab-nav">
        <button :class="['tab-btn', { active: currentTab === 'wardrobe' }]" @click="currentTab = 'wardrobe'">
          👗 數位衣櫥 ({{ clothes.length }})
        </button>
        <button :class="['tab-btn', { active: currentTab === 'economics' }]" @click="currentTab = 'economics'; fetchReport()">
          📊 本月穿搭經濟報表 (CP 值與遺珠)
        </button>
        <button :class="['tab-btn', { active: currentTab === 'perfumes' }]" @click="currentTab = 'perfumes'">
          🌸 典藏香氛庫 ({{ perfumes.length }})
        </button>
      </nav>
    </header>

    <!-- ============================================== -->
    <!-- 畫面 1：數位衣櫥 (9大分類 + 季節材質 + 單次花費) -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'wardrobe'" class="view-panel">
      <!-- 篩選列 -->
      <div class="filter-bar">
        <div class="category-pills">
          <button 
            v-for="cat in categoryOptions" 
            :key="cat"
            :class="['pill-btn', { active: selectedCategory === cat }]"
            @click="selectedCategory = cat; fetchClothes()"
          >
            {{ cat === '' ? '全部品項' : cat }}
          </button>
        </div>

        <div class="right-actions">
          <select v-model="selectedSeason" @change="fetchClothes" class="select-box">
            <option value="">全部季節</option>
            <option value="春夏">春夏 (Spring/Summer)</option>
            <option value="秋冬">秋冬 (Autumn/Winter)</option>
            <option value="四季">四季通用</option>
          </select>
          <button class="primary-btn" @click="openUploadModal">📸 拍照/上傳辨識</button>
        </div>
      </div>

      <!-- 衣櫥卡片網格 -->
      <div class="cards-grid">
        <div v-for="item in clothes" :key="item._id" class="cloth-card">
          <!-- 電商高清棚拍圖 -->
          <div class="card-img-wrap">
            <img :src="item.webSearchImage || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80'" alt="服飾照" class="cloth-img" />
            <span class="badge-season" :class="item.season">{{ item.season }}</span>
            <span class="badge-cat">{{ item.category }}</span>
          </div>

          <div class="card-body">
            <div class="brand-line">
              <span class="brand-tag">{{ item.brand }}</span>
              <span class="cost-per-wear">
                單次穿搭 NT$ {{ calcCPW(item.price, item.wearCount) }}
              </span>
            </div>
            
            <h3 class="cloth-title">{{ item.name }}</h3>

            <!-- 材質與材質特徵 -->
            <div class="attribute-box">
              <p>🧵 <strong>材質成分：</strong>{{ item.material }}</p>
              <p>🎨 <strong>風格色彩：</strong>{{ item.style }} · {{ item.color }}</p>
              <p>💰 <strong>購入金額：</strong>NT$ {{ item.price.toLocaleString() }} (已穿 {{ item.wearCount }} 次)</p>
            </div>

            <!-- 適配香水建議 -->
            <div class="scent-advice">
              🌸 <strong>推薦香調：</strong>
              <span>{{ item.matchingPerfume || '純粹麝香、清新木質調' }}</span>
            </div>

            <!-- 穿搭打卡與編輯按鈕 -->
            <div class="card-footer">
              <button class="wear-btn" @click="logWear(item._id)">✨ 今日穿搭打卡 (+1)</button>
              <button class="edit-btn" @click="openEditModal(item)">✏️ 微調</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 畫面 2：穿搭經濟學報表 (CP 值王者 + 遺珠穿搭救星) -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'economics'" class="view-panel">
      <div v-if="reportData" class="report-container">
        <!-- 本月最超值單品 MVP -->
        <div v-if="reportData.mvp" class="mvp-banner">
          <div class="mvp-badge">🏆 本月最值得投資單品 (MVP)</div>
          <div class="mvp-content">
            <img :src="reportData.mvp.webSearchImage" class="mvp-img" />
            <div class="mvp-info">
              <h2>{{ reportData.mvp.name }} ({{ reportData.mvp.brand }})</h2>
              <div class="mvp-stats">
                <div class="stat-pill">累積穿搭次數：<strong>{{ reportData.mvp.wearCount }} 次</strong></div>
                <div class="stat-pill highlight">單次穿搭成本僅：<strong>NT$ {{ reportData.mvp.costPerWear }} / 次</strong></div>
                <div class="stat-pill">材質：{{ reportData.mvp.material }} ({{ reportData.mvp.season }})</div>
              </div>
              <p class="mvp-review">💡 <strong>專家穿搭點評：</strong>{{ reportData.mvp.evaluation }}</p>
              <p class="mvp-scent">🌸 <strong>完美同調香水：</strong>{{ reportData.mvp.matchingPerfume }}</p>
            </div>
          </div>
        </div>

        <!-- 本月衣櫥遺珠救星推薦 -->
        <div class="neglected-section">
          <h3 class="section-title">🚨 本月衣櫥遺珠（穿搭率極低單品）風格重生建議</h3>
          <p class="section-sub">這些衣服好久沒穿了？千萬別浪費，試試看以下穿搭公式與香氛配對重新穿出門！</p>

          <div class="neglected-grid">
            <div v-for="neg in reportData.neglected" :key="neg._id" class="neglected-card">
              <img :src="neg.webSearchImage" class="neg-thumb" />
              <div class="neg-info">
                <h4>{{ neg.name }}</h4>
                <div class="neg-tags">
                  <span>{{ neg.category }}</span>
                  <span>{{ neg.season }}</span>
                  <span>購入價 NT$ {{ neg.price }}</span>
                </div>
                <div class="rescue-box">
                  💡 <strong>風格穿搭重生公式：</strong>
                  <p>{{ neg.rescueSuggestion }}</p>
                </div>
                <button class="wear-now-btn" @click="logWear(neg._id)">👗 今天就穿它出門！</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 畫面 3：香水專區 (1976 格式) -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'perfumes'" class="view-panel">
      <div class="filter-bar">
        <input v-model="searchQuery" @input="fetchPerfumes" class="search-input" placeholder="🔍 搜尋香水名稱、品牌、前中後調..." />
        <button class="primary-btn" @click="showPerfumeModal = true">＋ 匯入 1976 香水</button>
      </div>

      <div class="cards-grid">
        <div v-for="p in perfumes" :key="p._id" class="perfume-card">
          <div class="tag-row">
            <span class="badge-cat">{{ p.category || '優雅路線' }}</span>
            <span class="brand-tag">{{ p.brand }}</span>
          </div>
          <h3 class="cloth-title">{{ p.name }}</h3>
          <div class="attribute-box">
            <p><strong>香調：</strong>{{ p.scentType }}</p>
            <p><strong>前味：</strong>{{ p.topNotes }}</p>
            <p><strong>中味：</strong>{{ p.middleNotes }}</p>
            <p><strong>後味：</strong>{{ p.baseNotes }}</p>
          </div>
          <p class="desc-text">{{ p.description }}</p>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 彈窗：拍照上傳並智慧解析 / 手動自訂修改 -->
    <!-- ============================================== -->
    <div v-if="showUploadModal" class="modal-backdrop">
      <div class="modal-box">
        <h2>📸 智慧辨識與電商圖比對</h2>
        <p class="modal-sub">上傳手機拍照照片，系統會自動搜尋無色差之電商乾淨棚拍圖、辨識材質與適配季節！</p>

        <!-- 上傳框 -->
        <div class="upload-dropzone" @click="$refs.cameraInput.click()">
          <input type="file" ref="cameraInput" accept="image/*" @change="onFileSelected" style="display: none;" />
          <div v-if="!userUploadPreview" class="empty-upload">
            <span class="upload-icon">📷</span>
            <p>點擊拍照或上傳衣服圖片</p>
          </div>
          <div v-else class="preview-split">
            <div class="split-col">
              <small>手機原始拍攝（光線可能有色差）</small>
              <img :src="userUploadPreview" class="comp-img" />
            </div>
            <div class="arrow-sym">➔</div>
            <div class="split-col">
              <small>自動檢索電商高清標準圖</small>
              <img :src="editFormData.webSearchImage" class="comp-img result-img" />
            </div>
          </div>
        </div>

        <!-- 快速標籤加速檢索 -->
        <div class="quick-chips">
          <span class="chip-label">快速測試特徵：</span>
          <button type="button" @click="runAnalysis('西裝外套')">西裝外套</button>
          <button type="button" @click="runAnalysis('碎花洋裝')">碎花洋裝</button>
          <button type="button" @click="runAnalysis('純棉襯衫')">純棉襯衫</button>
          <button type="button" @click="runAnalysis('瑪莉珍鞋')">瑪莉珍鞋</button>
          <button type="button" @click="runAnalysis('珍珠項鍊')">珍珠飾品</button>
          <button type="button" @click="runAnalysis('喀什米爾圍巾')">羊絨配件</button>
        </div>

        <!-- 表單：皆支援使用者自由手動微調 -->
        <div class="form-grid">
          <div class="form-group full-width">
            <label>服飾品名：</label>
            <input v-model="editFormData.name" placeholder="例如：法式優雅抓皺雪紡洋裝" />
          </div>

          <div class="form-group">
            <label>9 大分類：</label>
            <select v-model="editFormData.category">
              <option value="上衣">上衣</option>
              <option value="下裝">下裝</option>
              <option value="連身洋裝">連身洋裝</option>
              <option value="連身褲裝">連身褲裝</option>
              <option value="外套">外套</option>
              <option value="鞋子">鞋子</option>
              <option value="飾品">飾品</option>
              <option value="頭飾">頭飾</option>
              <option value="穿搭配件">穿搭配件</option>
            </select>
          </div>

          <div class="form-group">
            <label>材質分析（自動對應）：</label>
            <input v-model="editFormData.material" placeholder="如：輕盈雪紡、羊毛、純棉" />
          </div>

          <div class="form-group">
            <label>適配季節：</label>
            <select v-model="editFormData.season">
              <option value="春夏">春夏</option>
              <option value="秋冬">秋冬</option>
              <option value="四季">四季</option>
            </select>
          </div>

          <div class="form-group">
            <label>品牌：</label>
            <input v-model="editFormData.brand" placeholder="如：COS, ZARA, Reformation" />
          </div>

          <div class="form-group">
            <label>購入金額 (NTD)：</label>
            <input type="number" v-model.number="editFormData.price" placeholder="例如：2800" />
          </div>

          <div class="form-group">
            <label>風格定位：</label>
            <input v-model="editFormData.style" placeholder="例如：知性俐落、浪漫法式" />
          </div>

          <div class="form-group full-width">
            <label>推薦搭配香水：</label>
            <input v-model="editFormData.matchingPerfume" placeholder="例如：Narciso Pure Musc 純粹繆思" />
          </div>
        </div>

        <div class="modal-btns">
          <button class="cancel-btn" @click="showUploadModal = false">取消</button>
          <button class="save-btn" @click="saveClothing">確認收入衣櫥</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

const currentTab = ref('wardrobe')
const clothes = ref([])
const perfumes = ref([])
const reportData = ref(null)

const categoryOptions = ['', '上衣', '下裝', '連身洋裝', '連身褲裝', '外套', '鞋子', '飾品', '頭飾', '穿搭配件']
const selectedCategory = ref('')
const selectedSeason = ref('')
const searchQuery = ref('')

const showUploadModal = ref(false)
const showPerfumeModal = ref(false)
const userUploadPreview = ref('')

const editFormData = reactive({
  _id: null,
  name: '',
  category: '上衣',
  brand: 'ZARA',
  material: '100% 純棉',
  season: '春夏',
  price: 1500,
  style: '極簡俐落',
  color: '純白',
  occasion: '日常',
  matchingPerfume: '',
  webSearchImage: ''
})

// 計算單次穿搭成本 (Cost-Per-Wear)
const calcCPW = (price, count) => {
  if (!count || count <= 0) return price
  return Math.round(price / count)
}

const openUploadModal = () => {
  editFormData._id = null
  userUploadPreview.value = ''
  runAnalysis('西裝外套')
  showUploadModal.value = true
}

const openEditModal = (item) => {
  editFormData._id = item._id
  editFormData.name = item.name
  editFormData.category = item.category
  editFormData.brand = item.brand
  editFormData.material = item.material
  editFormData.season = item.season
  editFormData.price = item.price
  editFormData.style = item.style
  editFormData.color = item.color
  editFormData.occasion = item.occasion
  editFormData.matchingPerfume = item.matchingPerfume
  editFormData.webSearchImage = item.webSearchImage
  userUploadPreview.value = item.webSearchImage
  showUploadModal.value = true
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (!file) return
  userUploadPreview.value = URL.createObjectURL(file)
  runAnalysis(editFormData.name || '西裝外套')
}

// 呼叫後端智慧分析與電商圖庫匹配
const runAnalysis = async (keyword) => {
  editFormData.name = keyword
  try {
    const res = await axios.post('http://localhost:3000/api/clothes/smart-analyze', {
      hint: keyword
    })
    if (res.data.success) {
      const data = res.data.analyzed
      editFormData.name = data.name
      editFormData.category = data.category
      editFormData.brand = data.brand
      editFormData.material = data.material
      editFormData.season = data.season
      editFormData.price = data.price
      editFormData.style = data.style
      editFormData.color = data.color
      editFormData.occasion = data.occasion
      editFormData.matchingPerfume = data.matchingPerfume
      editFormData.webSearchImage = data.webImage
    }
  } catch (err) {
    console.error('智慧分析失敗：', err)
  }
}

// 每日打卡
const logWear = async (id) => {
  try {
    await axios.post(`http://localhost:3000/api/clothes/wear/${id}`)
    alert('🎉 今日穿搭打卡成功！單次穿搭成本已重新平攤計算。')
    fetchClothes()
    if (currentTab.value === 'economics') fetchReport()
  } catch (err) {
    alert('打卡失敗！')
  }
}

// 取得衣櫥單品
const fetchClothes = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedCategory.value) params.append('category', selectedCategory.value)
    if (selectedSeason.value) params.append('season', selectedSeason.value)
    const res = await axios.get(`http://localhost:3000/api/clothes?${params.toString()}`)
    clothes.value = res.data
  } catch (err) {
    console.error(err)
  }
}

// 取得穿搭經濟報表
const fetchReport = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/wardrobe/monthly-report')
    reportData.value = res.data
  } catch (err) {
    console.error(err)
  }
}

// 取得香水
const fetchPerfumes = async () => {
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    const res = await axios.get(`http://localhost:3000/api/perfumes?${params.toString()}`)
    perfumes.value = res.data
  } catch (err) {
    console.error(err)
  }
}

// 儲存（新增或修改）
const saveClothing = async () => {
  try {
    if (editFormData._id) {
      await axios.put(`http://localhost:3000/api/clothes/${editFormData._id}`, editFormData)
    } else {
      await axios.post('http://localhost:3000/api/clothes', editFormData)
    }
    showUploadModal.value = false
    fetchClothes()
  } catch (err) {
    alert('儲存衣櫥單品失敗！')
  }
}

onMounted(() => {
  fetchClothes()
  fetchPerfumes()
})
</script>

<style scoped>
.app-layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", sans-serif;
}

.main-header {
  text-align: center;
  margin-bottom: 26px;
}

.logo-area h1 {
  font-size: 2.3rem;
  font-weight: 800;
  color: #0f172a;
}

.logo-area p {
  color: #475569;
  font-size: 1.05rem;
  margin: 6px 0 20px 0;
}

.tab-nav {
  display: inline-flex;
  background: #e2e8f0;
  padding: 5px;
  border-radius: 12px;
  gap: 8px;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 10px 22px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
}

.tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 篩選列 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill-btn {
  border: 1px solid #cbd5e1;
  background: white;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn.active {
  background: #0f766e;
  color: white;
  border-color: #0f766e;
}

.right-actions {
  display: flex;
  gap: 10px;
}

.select-box, .search-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
}

.primary-btn {
  background: #0f766e;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

/* 卡片網格 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

.cloth-card, .perfume-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.card-img-wrap {
  position: relative;
  width: 100%;
  height: 250px;
  background: #f8fafc;
}

.cloth-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-season {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}
.badge-season.春夏 { background: #dcfce7; color: #166534; }
.badge-season.秋冬 { background: #ffedd5; color: #9a3412; }
.badge-season.四季 { background: #e0e7ff; color: #3730a3; }

.badge-cat {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.75);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
}

.card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.brand-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.brand-tag {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.cost-per-wear {
  font-size: 0.82rem;
  font-weight: 800;
  color: #0f766e;
  background: #ccfbf1;
  padding: 2px 8px;
  border-radius: 4px;
}

.cloth-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 10px;
}

.attribute-box {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.88rem;
  margin-bottom: 12px;
}
.attribute-box p { margin: 3px 0; color: #334155; }

.scent-advice {
  border-top: 1px dashed #e2e8f0;
  padding-top: 10px;
  font-size: 0.9rem;
  color: #1e293b;
  margin-bottom: 14px;
}

.card-footer {
  margin-top: auto;
  display: flex;
  gap: 8px;
}

.wear-btn {
  flex: 1;
  background: #0f172a;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}
.wear-btn:hover { background: #334155; }

.edit-btn {
  background: #e2e8f0;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

/* ================== 穿搭經濟學報表樣式 ================== */
.mvp-banner {
  background: linear-gradient(135deg, #0f766e, #115e59);
  color: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 25px rgba(15, 118, 110, 0.2);
  margin-bottom: 36px;
}

.mvp-badge {
  display: inline-block;
  background: #fef08a;
  color: #854d0e;
  font-weight: 800;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.mvp-content {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.mvp-img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  border: 3px solid rgba(255, 255, 255, 0.4);
}

.mvp-info h2 {
  font-size: 1.6rem;
  margin-bottom: 10px;
}

.mvp-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
}
.stat-pill.highlight {
  background: #fef08a;
  color: #713f12;
  font-weight: bold;
}

.mvp-review, .mvp-scent {
  font-size: 0.95rem;
  line-height: 1.6;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
}

.section-sub {
  color: #64748b;
  margin-bottom: 20px;
}

.neglected-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.neglected-card {
  background: white;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.08);
}

.neg-thumb {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
}

.neg-info {
  flex: 1;
}

.neg-info h4 {
  font-size: 1.05rem;
  color: #0f172a;
}

.neg-tags {
  display: flex;
  gap: 6px;
  margin: 6px 0 10px 0;
}
.neg-tags span {
  font-size: 0.75rem;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  color: #475569;
}

.rescue-box {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.85rem;
  color: #9a3412;
  margin-bottom: 12px;
}

.wear-now-btn {
  background: #ea580c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

/* ================== 彈窗上傳與編輯樣式 ================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: white;
  width: 90%;
  max-width: 650px;
  padding: 28px;
  border-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sub {
  font-size: 0.88rem;
  color: #64748b;
  margin: 4px 0 16px 0;
}

.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  margin-bottom: 14px;
}

.upload-icon { font-size: 2.2rem; }

.preview-split {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.split-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.split-col small {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
}

.comp-img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
}

.result-img {
  border: 2px solid #0f766e;
}

.arrow-sym {
  font-size: 1.5rem;
  color: #0f766e;
  font-weight: bold;
}

.quick-chips {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.chip-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.quick-chips button {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 600;
}
.quick-chips button:hover { background: #e2e8f0; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.full-width { grid-column: span 2; }

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 4px;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-sizing: border-box;
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  background: #e2e8f0;
  border: none;
  padding: 9px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.save-btn {
  background: #0f766e;
  color: white;
  border: none;
  padding: 9px 20px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}
</style>