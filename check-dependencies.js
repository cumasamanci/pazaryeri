const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Gerekli tüm bağımlılıklar
const requiredDependencies = [
  'express', 
  'ejs', 
  'morgan',
  'sequelize',
  'mssql',
  'tedious',
  'uuid',
  'axios',
  'dotenv',
  'moment',
  'multer',
  'chart.js'
];

console.log('Bağımlılıklar kontrol ediliyor...');

// package.json'ı kontrol et
let packageJson = {};
const packageJsonPath = path.join(__dirname, 'package.json');

if (fs.existsSync(packageJsonPath)) {
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    console.log('package.json dosyası bulundu.');
  } catch (error) {
    console.error('package.json dosyası okunamadı:', error.message);
    packageJson = { dependencies: {} };
  }
} else {
  console.log('package.json dosyası bulunamadı, yeni oluşturulacak.');
  packageJson = { 
    name: "trendyol-finance-integration",
    version: "1.0.0",
    description: "Trendyol Finans Entegrasyonu",
    main: "src/app.js",
    dependencies: {},
    scripts: {
      "start": "node src/app.js",
      "dev": "nodemon src/app.js"
    }
  };
  
  // package.json dosyasını oluştur
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.json dosyası oluşturuldu.');
}

// Eksik bağımlılıkları belirle
const installedDependencies = packageJson.dependencies || {};
const missingDependencies = requiredDependencies.filter(dep => !installedDependencies[dep]);

if (missingDependencies.length === 0) {
  console.log('Tüm bağımlılıklar yüklü. node_modules klasörü kontrol ediliyor...');
  
  // node_modules klasörünü kontrol et
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('node_modules klasörü bulunamadı, npm install çalıştırılıyor...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('npm install başarıyla tamamlandı.');
    } catch (error) {
      console.error('npm install sırasında hata:', error.message);
    }
  } else {
    console.log('node_modules klasörü mevcut.');
  }
} else {
  console.log(`${missingDependencies.length} adet eksik bağımlılık bulundu, yükleniyor...`);
  console.log('Eksik bağımlılıklar:', missingDependencies.join(', '));
  
  try {
    execSync(`npm install ${missingDependencies.join(' ')}`, { stdio: 'inherit' });
    console.log('Eksik bağımlılıklar başarıyla yüklendi.');
  } catch (error) {
    console.error('Bağımlılıklar yüklenirken hata:', error.message);
  }
}

console.log('Bağımlılık kontrolü tamamlandı.');
console.log('\nUygulamayı başlatmak için: node src/app.js');