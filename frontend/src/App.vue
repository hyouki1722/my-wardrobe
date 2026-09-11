<template>
  <div class="app-layout">
    <!-- ============================================== -->
    <!-- 頂端 Header（含 RWD 漢堡按鈕） -->
    <!-- ============================================== -->
    <header class="main-header">
      <div class="nav-container">
        <div class="logo-area">
          <h1>✨ MyWardrobe 智慧衣櫥</h1>
          <p class="subtitle">色彩美學診斷 ✕ 穿搭經濟學 ✕ 精品香氛</p>
        </div>

        <!-- 手機端漢堡選單按鈕 -->
        <button class="hamburger-btn" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="選單">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <!-- 電腦端導覽按鈕列 -->
        <nav class="desktop-nav">
          <button :class="['nav-link', { active: currentTab === 'wardrobe' }]" @click="currentTab = 'wardrobe'">
            👗 數位衣櫥 ({{ clothes.length }})
          </button>
          <button :class="['nav-link', { active: currentTab === 'analytics' }]" @click="currentTab = 'analytics'; fetchAnalytics()">
            🎨 品項與色彩診斷
          </button>
          <button :class="['nav-link', { active: currentTab === 'economics' }]" @click="currentTab = 'economics'; fetchReport()">
            📊 穿搭經濟學 (CPW)
          </button>
          <button :class="['nav-link', { active: currentTab === 'perfumes' }]" @click="currentTab = 'perfumes'">
            🌸 典藏香氛庫
          </button>
        </nav>
      </div>

      <!-- 手機端抽屜式選單 (Drawer) -->
      <div :class="['mobile-drawer', { open: mobileMenuOpen }]">
        <div class="drawer-header">
          <span>功能選單</span>
          <button class="close-drawer" @click="mobileMenuOpen = false">✕</button>
        </div>
        <div class="drawer-links">
          <button :class="['drawer-btn', { active: currentTab === 'wardrobe' }]" @click="switchTab('wardrobe')">
            👗 數位衣櫥 ({{ clothes.length }})
          </button>
          <button :class="['drawer-btn', { active: currentTab === 'analytics' }]" @click="switchTab('analytics'); fetchAnalytics()">
            🎨 品項數量與色彩診斷
          </button>
          <button :class="['drawer-btn', { active: currentTab === 'economics' }]" @click="switchTab('economics'); fetchReport()">
            📊 本月穿搭經濟報表
          </button>
          <button :class="['drawer-btn', { active: currentTab === 'perfumes' }]" @click="switchTab('perfumes')">
            🌸 典藏香氛庫 ({{ perfumes.length }})
          </button>
        </div>
      </div>
      <!-- 遮罩 -->
      <div v-if="mobileMenuOpen" class="drawer-overlay" @click="mobileMenuOpen = false"></div>
    </header>

    <!-- ============================================== -->
    <!-- 頂端快速統計摘要列（所有分頁皆可看到） -->
    <!-- ============================================== -->
    <section class="summary-strip">
      <div class="strip-item">
        <span class="strip-label">衣櫥總單品</span>
        <span class="strip-value">{{ clothes.length }} 件</span>
      </div>
      <div class="strip-divider"></div>
      <div class="strip-item color-preview" @click="switchTab('analytics'); fetchAnalytics()">
        <span class="strip-label">主要色彩占比 TOP 3</span>
        <div class="top3-chips" v-if="colorData && colorData.topThree.length > 0">
          <span v-for="(t, idx) in colorData.topThree" :key="idx" class="mini-chip">
            {{ t.color }} ({{ t.percentage }}%)
          </span>
        </div>
        <span v-else class="strip-sub">點擊查看色彩診斷</span>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 分頁 1：品項數量統計 ＆ 色彩診斷建議 -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'analytics'" class="view-panel">
      <!-- 1. 9大品項即時總數看板 -->
      <div class="analytics-card">
        <h3 class="panel-title">📦 各品項在庫總數統計</h3>
        <div class="category-stat-grid" v-if="colorData">
          <div v-for="(cnt, cat) in colorData.categoryCounts" :key="cat" class="cat-stat-box">
            <span class="cat-name">{{ cat }}</span>
            <span class="cat-count">{{ cnt }} <small>件</small></span>
          </div>
        </div>
      </div>

      <!-- 2. 色彩佔比前三名與多樣化穿搭建議 -->
      <div class="analytics-card color-insight-card" v-if="colorData">
        <h3 class="panel-title">🎨 衣櫥色彩深度解析</h3>
        <p class="panel-subtitle">系統依據您目前的服裝色系，計算出核心主色調與前三名占比：</p>

        <div class="top3-ranking">
          <div v-for="(item, rank) in colorData.topThree" :key="item.color" class="rank-item">
            <div class="rank-badge">NO.{{ rank + 1 }}</div>
            <div class="rank-details">
              <h4>{{ item.color }}</h4>
              <p>共 {{ item.count }} 件 · 佔整體 <strong>{{ item.percentage }}%</strong></p>
              <div class="progress-bg">
                <div class="progress-fill" :style="{ width: item.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="color-advice-box">
          <div class="advice-header">
            <span class="bulb-icon">💡</span>
            <h4>多樣化穿搭美學：色彩擴充建議</h4>
          </div>
          <p class="advice-content">{{ colorData.colorAdvice }}</p>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 分頁 2：數位衣櫥主畫面 (支援 RWD 單欄切換) -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'wardrobe'" class="view-panel">
      <div class="filter-bar">
        <div class="category-scroll-wrap">
          <button 
            v-for="cat in categoryOptions" 
            :key="cat"
            :class="['pill-btn', { active: selectedCategory === cat }]"
            @click="selectedCategory = cat; fetchClothes()"
          >
            {{ cat === '' ? '全部' : cat }}
          </button>
        </div>

        <div class="actions-row">
          <select v-model="selectedSeason" @change="fetchClothes" class="select-box">
            <option value="">全部季節</option>
            <option value="春夏">春夏</option>
            <option value="秋冬">秋冬</option>
            <option value="四季">四季</option>
          </select>
          <button class="primary-btn" @click="openUploadModal">📸 拍照上傳</button>
        </div>
      </div>

      <div class="cards-grid">
        <div v-for="item in clothes" :key="item._id" class="cloth-card">
          <div class="card-img-wrap">
            <img :src="item.webSearchImage || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80'" class="cloth-img" />
            <span class="badge-season" :class="item.season">{{ item.season }}</span>
            <span class="badge-cat">{{ item.category }}</span>
          </div>

          <div class="card-body">
            <div class="brand-line">
              <span class="brand-tag">{{ item.brand }}</span>
              <span class="cost-per-wear">單次 NT$ {{ calcCPW(item.price, item.wearCount) }}</span>
            </div>
            
            <h3 class="cloth-title">{{ item.name }}</h3>

            <div class="attribute-box">
              <p>🧵 <strong>材質：</strong>{{ item.material }}</p>
              <p>🎨 <strong>顏色：</strong>{{ item.color }} ({{ item.style }})</p>
              <p>💰 <strong>原價：</strong>NT$ {{ item.price.toLocaleString() }} · 穿 {{ item.wearCount }} 次</p>
            </div>

            <div class="scent-advice">
              🌸 <strong>適配香調：</strong>
              <span>{{ item.matchingPerfume || '純粹白麝香、清新柑橘木質調' }}</span>
            </div>

            <div class="card-footer">
              <button class="wear-btn" @click="logWear(item._id)">✨ 今日穿搭打卡</button>
              <button class="edit-btn" @click="openEditModal(item)">✏️ 微調</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 分頁 3：穿搭經濟學報表 -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'economics'" class="view-panel">
      <div v-if="reportData" class="report-container">
        <div v-if="reportData.mvp" class="mvp-banner">
          <div class="mvp-badge">🏆 本月最值得投資單品 (MVP)</div>
          <div class="mvp-content">
            <img :src="reportData.mvp.webSearchImage" class="mvp-img" />
            <div class="mvp-info">
              <h2>{{ reportData.mvp.name }}</h2>
              <div class="mvp-stats">
                <div class="stat-pill">穿搭：<strong>{{ reportData.mvp.wearCount }} 次</strong></div>
                <div class="stat-pill highlight">單次穿搭成本僅：<strong>NT$ {{ reportData.mvp.costPerWear }}</strong></div>
              </div>
              <p class="mvp-review">💡 {{ reportData.mvp.evaluation }}</p>
            </div>
          </div>
        </div>

        <div class="neglected-section">
          <h3 class="section-title">🚨 衣櫥遺珠（閒置單品）重生搭配提案</h3>
          <div class="neglected-grid">
            <div v-for="neg in reportData.neglected" :key="neg._id" class="neglected-card">
              <img :src="neg.webSearchImage" class="neg-thumb" />
              <div class="neg-info">
                <h4>{{ neg.name }}</h4>
                <p class="neg-desc">材質：{{ neg.material }} | 季節：{{ neg.season }}</p>
                <div class="rescue-box">
                  <p>{{ neg.rescueSuggestion }}</p>
                </div>
                <button class="wear-now-btn" @click="logWear(neg._id)">👗 今日穿它出門！</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- 分頁 4：典藏香氛庫 -->
    <!-- ============================================== -->
    <section v-if="currentTab === 'perfumes'" class="view-panel">
      <div class="filter-bar">
        <input v-model="searchQuery" @input="fetchPerfumes" class="search-input" placeholder="🔍 搜尋香水名稱、品牌、香調..." />
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
    <!-- 彈窗：拍照上傳並智慧解析 / 手動微調 -->
    <!-- ============================================== -->
    <div v-if="showUploadModal" class="modal-backdrop">
      <div class="modal-box">
        <h2>📸 智慧辨識與電商圖比對</h2>
        <div class="upload-dropzone" @click="$refs.cameraInput.click()">
          <input type="file" ref="cameraInput" accept="image/*" @change="onFileSelected" style="display: none;" />
          <div v-if="!userUploadPreview" class="empty-upload">
            <span class="upload-icon">📷</span>
            <p>點擊拍照或上傳衣服圖片</p>
          </div>
          <div v-else class="preview-split">
            <div class="split-col">
              <small>原始照片</small>
              <img :src="userUploadPreview" class="comp-img" />
            </div>
            <div class="arrow-sym">➔</div>
            <div class="split-col">
              <small>電商標準白底圖</small>
              <img :src="editFormData.webSearchImage" class="comp-img result-img" />
            </div>
          </div>
        </div>

        <div class="quick-chips">
          <button type="button" @click="runAnalysis('西裝外套')">西裝外套</button>
          <button type="button" @click="runAnalysis('碎花洋裝')">碎花洋裝</button>
          <button type="button" @click="runAnalysis('純棉襯衫')">純棉襯衫</button>
          <button type="button" @click="runAnalysis('瑪莉珍鞋')">瑪莉珍鞋</button>
          <button type="button" @click="runAnalysis('珍珠項鍊')">珍珠飾品</button>
        </div>

        <div class="form-grid">
          <div class="form-group full-width">
            <label>服飾名稱：</label>
            <input v-model="editFormData.name" />
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
            <label>顏色：</label>
            <input v-model="editFormData.color" placeholder="米白、曜石黑、灰等" />
          </div>

          <div class="form-group">
            <label>材質：</label>
            <input v-model="editFormData.material" />
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
            <label>購入金額 (NTD)：</label>
            <input type="number" v-model.number="editFormData.price" />
          </div>

          <div class="form-group full-width">
            <label>推薦香水：</label>
            <input v-model="editFormData.matchingPerfume" />
          </div>
        </div>

        <div class="modal-btns">
          <button class="cancel-btn" @click="showUploadModal = false">取消</button>
          <button class="save-btn" @click="saveClothing">儲存至衣櫥</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

// 設定環境變數動態網址，若無環境變數則預設使用 localhost 測試
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const currentTab = ref('wardrobe')
const mobileMenuOpen = ref(false)

const clothes = ref([])
const perfumes = ref([])
const reportData = ref(null)
const colorData = ref(null)

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
  material: '純棉',
  season: '春夏',
  price: 1500,
  style: '極簡俐落',
  color: '米白',
  occasion: '日常',
  matchingPerfume: '',
  webSearchImage: ''
})

const switchTab = (tab) => {
  currentTab.value = tab
  mobileMenuOpen.value = false
}

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

const runAnalysis = async (keyword) => {
  editFormData.name = keyword
  try {
    const res = await axios.post(`${API_BASE}/api/clothes/smart-analyze`, { hint: keyword })
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
      editFormData.matchingPerfume = data.matchingPerfume
      editFormData.webSearchImage = data.webImage
    }
  } catch (err) {
    console.error(err)
  }
}

const logWear = async (id) => {
  try {
    await axios.post(`${API_BASE}/api/clothes/wear/${id}`)
    alert('🎉 今日穿搭打卡成功！單次成本已重新計算。')
    fetchClothes()
    fetchAnalytics()
    if (currentTab.value === 'economics') fetchReport()
  } catch (err) {
    alert('打卡失敗！')
  }
}

const fetchClothes = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedCategory.value) params.append('category', selectedCategory.value)
    if (selectedSeason.value) params.append('season', selectedSeason.value)
    const res = await axios.get(`${API_BASE}/api/clothes?${params.toString()}`)
    clothes.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchAnalytics = async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/wardrobe/color-analytics`)
    colorData.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchReport = async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/wardrobe/monthly-report`)
    reportData.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchPerfumes = async () => {
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    const res = await axios.get(`${API_BASE}/api/perfumes?${params.toString()}`)
    perfumes.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const saveClothing = async () => {
  try {
    if (editFormData._id) {
      await axios.put(`${API_BASE}/api/clothes/${editFormData._id}`, editFormData)
    } else {
      await axios.post(`${API_BASE}/api/clothes`, editFormData)
    }
    showUploadModal.value = false
    fetchClothes()
    fetchAnalytics()
  } catch (err) {
    alert('儲存失敗！')
  }
}

onMounted(() => {
  fetchClothes()
  fetchAnalytics()
  fetchPerfumes()
})
</script>

<style scoped>
.app-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", sans-serif;
  color: #1e293b;
}

/* ================== 頂端導航與手機漢堡選單 ================== */
.main-header {
  background: white;
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 14px;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-area h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

/* 電腦端選單 */
.desktop-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  border: none;
  background: transparent;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.nav-link.active, .nav-link:hover {
  background: #0f766e;
  color: white;
}

/* 手機漢堡按鈕 (預設隱藏) */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hamburger-btn .bar {
  width: 100%;
  height: 3px;
  background: #0f172a;
  border-radius: 2px;
}

/* 手機側邊抽屜式選單 */
.mobile-drawer {
  position: fixed;
  top: 0;
  right: -280px;
  width: 260px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: right 0.3s ease;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.mobile-drawer.open {
  right: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
}

.close-drawer {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-btn {
  text-align: left;
  border: none;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
}

.drawer-btn.active {
  background: #0f766e;
  color: white;
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

/* ================== 頂部快速摘要列 ================== */
.summary-strip {
  background: white;
  border-radius: 10px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
}

.strip-item {
  display: flex;
  flex-direction: column;
}

.strip-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
}

.strip-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f766e;
}

.strip-divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
}

.color-preview {
  cursor: pointer;
  flex: 1;
}

.top3-chips {
  display: flex;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.mini-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
}

/* ================== 色彩診斷與品項統計樣式 ================== */
.analytics-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
}

.panel-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  margin-bottom: 16px;
}

.category-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.cat-stat-box {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.cat-name {
  display: block;
  font-size: 0.78rem;
  color: #475569;
  font-weight: 600;
}

.cat-count {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f766e;
}

.cat-count small {
  font-size: 0.75rem;
}

.top3-ranking {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 10px;
}

.rank-badge {
  background: #0f766e;
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 6px;
}

.rank-details {
  flex: 1;
}

.rank-details h4 {
  font-size: 0.95rem;
  color: #0f172a;
}

.rank-details p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 2px 0 6px 0;
}

.progress-bg {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0f766e;
  border-radius: 3px;
}

.color-advice-box {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  padding: 16px;
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e40af;
  margin-bottom: 6px;
}

.advice-content {
  font-size: 0.92rem;
  line-height: 1.6;
  color: #1e3a8a;
}

/* ================== 衣櫥與卡片 ================== */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.category-scroll-wrap {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.pill-btn {
  border: 1px solid #cbd5e1;
  background: white;
  padding: 6px 12px;
  border-radius: 18px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.pill-btn.active {
  background: #0f766e;
  color: white;
  border-color: #0f766e;
}

.actions-row {
  display: flex;
  gap: 8px;
}

.select-box, .search-input {
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
}

.primary-btn {
  background: #0f766e;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.85rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 18px;
}

.cloth-card, .perfume-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-img-wrap {
  position: relative;
  width: 100%;
  height: 220px;
  background: #f8fafc;
}

.cloth-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-season {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
}
.badge-season.春夏 { background: #dcfce7; color: #166534; }
.badge-season.秋冬 { background: #ffedd5; color: #9a3412; }
.badge-season.四季 { background: #e0e7ff; color: #3730a3; }

.badge-cat {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.75);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
}

.card-body {
  padding: 14px;
}

.brand-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.brand-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
}

.cost-per-wear {
  font-size: 0.78rem;
  font-weight: 800;
  color: #0f766e;
  background: #ccfbf1;
  padding: 2px 6px;
  border-radius: 4px;
}

.cloth-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.attribute-box {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.82rem;
  margin-bottom: 10px;
}
.attribute-box p { margin: 2px 0; }

.scent-advice {
  border-top: 1px dashed #e2e8f0;
  padding-top: 8px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  gap: 6px;
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
  font-size: 0.85rem;
}

.edit-btn {
  background: #e2e8f0;
  border: none;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
}

/* ================== 彈窗上傳 ================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  width: 92%;
  max-width: 580px;
  padding: 20px;
  border-radius: 12px;
  max-height: 90vh;
  overflow-y: auto;
}

.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  background: #f8fafc;
  margin-bottom: 12px;
  cursor: pointer;
}

.upload-icon { font-size: 2rem; }

.preview-split {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.comp-img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.result-img { border: 2px solid #0f766e; }

.quick-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.quick-chips button {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.full-width { grid-column: span 2; }

.form-group label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 7px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 0.85rem;
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.cancel-btn {
  background: #e2e8f0;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.save-btn {
  background: #0f766e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

/* ================== RWD 手機版專屬優化 ================== */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }

  .summary-strip {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .strip-divider {
    display: none;
  }

  .category-stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: span 1;
  }
}
</style>