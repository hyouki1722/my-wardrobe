require('dotenv').config();
const mongoose = require('mongoose');
const Perfume = require('./models/Perfume');

// 準備您提供的香水清單，並標上對應的演算法屬性
const perfumes = [
  {
    name: '我的玫色印記', brand: '嬌蘭', family: '花香調', concentration: 'EDP',
    suitableWeather: ['Sunny'], suitableOccasion: ['Date', 'Formal'], tags: ['優雅', '知性', '淺色連身裙']
  },
  {
    name: '天鵝絨紫蘭花', brand: 'Tom Ford', family: '東方花香調', concentration: 'EDP',
    suitableWeather: ['Cold'], suitableOccasion: ['Formal', 'Date'], tags: ['奢華', '深色系', '絲絨或皮革']
  },
  {
    name: '月光白雪', brand: '梵克雅寶', family: '木質麝香調', concentration: 'EDP',
    suitableWeather: ['Cold', 'Cloudy'], suitableOccasion: ['Work', 'Casual'], tags: ['簡約', '高領針織衫', '大地色系']
  },
  {
    name: '月夜廣藿香', brand: '梵克雅寶', family: '木質調', concentration: 'EDP',
    suitableWeather: ['Cold', 'Rainy'], suitableOccasion: ['Work', 'Formal'], tags: ['俐落', '西裝外套', '職場正裝']
  },
  {
    name: '隱衫之欲', brand: '配槍茱麗葉', family: '麝香調', concentration: 'EDP',
    suitableWeather: ['Sunny', 'Hot'], suitableOccasion: ['Casual'], tags: ['慵懶休閒', '白襯衫', '棉質單品']
  },
  {
    name: '非香水', brand: '配槍茱麗葉', family: '木質琥珀調', concentration: 'EDP',
    suitableWeather: ['Sunny', 'Rainy', 'Cloudy', 'Cold', 'Hot'], suitableOccasion: ['Casual', 'Work'], tags: ['極簡風', '丹寧牛仔', '百搭']
  },
  {
    name: '修道院玫瑰', brand: 'SMN', family: '花香調', concentration: 'EDC',
    suitableWeather: ['Sunny'], suitableOccasion: ['Date'], tags: ['浪漫', '碎花', '雪紡紗材質']
  },
  {
    name: 'My Burberry', brand: 'BURBERRY', family: '花香調', concentration: 'EDP',
    suitableWeather: ['Rainy', 'Cloudy'], suitableOccasion: ['Work', 'Formal'], tags: ['都會俐落', '經典風衣', '合身剪裁']
  },
  {
    name: '希臘無花果', brand: 'DIPTYQUE', family: '綠意果香木質調', concentration: 'EDP',
    suitableWeather: ['Hot', 'Sunny'], suitableOccasion: ['Casual', 'Date'], tags: ['渡假風', '亞麻材質', '寬鬆剪裁']
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB 連線成功，準備匯入香水資料...');
    // 清空舊資料避免重複
    await Perfume.deleteMany({});
    // 寫入新資料
    await Perfume.insertMany(perfumes);
    console.log('🎉 9 款香水資料匯入完成！');
    process.exit(); // 結束程式
  })
  .catch(err => {
    console.error('匯入失敗：', err);
    process.exit(1);
  });