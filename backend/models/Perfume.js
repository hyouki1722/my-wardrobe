const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 例如：嬌蘭 我的玫色印記
  brand: { type: String, required: true },
  family: { type: String, required: true }, // 香調：玫瑰、木質、柑橘等
  concentration: { type: String, enum: ['EDC', 'EDT', 'EDP', 'Parfum'] }, // 濃度
  suitableWeather: [{ type: String, enum: ['Sunny', 'Rainy', 'Cloudy', 'Cold', 'Hot'] }], // 適合天氣
  suitableOccasion: [{ type: String, enum: ['Work', 'Casual', 'Date', 'Formal'] }], // 適合情境
  tags: [{ type: String }], // 自訂標籤，例如：優雅、知性
  usageCount: { type: Number, default: 0 }, // 記錄使用次數，用於「被遺忘的寶藏」演算法
  lastUsed: { type: Date }
});

module.exports = mongoose.model('Perfume', perfumeSchema);