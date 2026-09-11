const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Top', 'Bottom', 'Outerwear', 'Dress', 'Shoes', 'Accessories'] },
  color: { type: String, required: true },
  styleTags: [{ type: String }], // 例如：正裝、休閒、浪漫 (用來與香水配對)
  material: { type: String }, // 例如：絲絨、雪紡、棉質
  usageCount: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 } // 用於計算「最值得的購入」
});

module.exports = mongoose.model('Item', itemSchema);