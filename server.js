const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3100;

// Basic Auth для админ-панели
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    return next(); // Если не настроено - пропускаем
  }
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Authentication required');
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    res.status(401).send('Invalid credentials');
  }
};

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));
app.use(compression());
app.use(express.json());

// Защита админ-панели
app.use('/admin.html', basicAuth);
app.use('/api/upload', basicAuth);
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов с одного IP
});
app.use('/api/', limiter);

// Путь к хранилищу обновлений
const UPDATES_DIR = process.env.UPDATES_DIR || path.join(__dirname, 'updates');

// Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type } = req.params;
    const { version } = req.body;
    const dir = path.join(UPDATES_DIR, type, version);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { type } = req.params;
    let filename;
    if (type === 'backend') filename = 'backend.zip';
    else if (type === 'frontend') filename = 'frontend.zip';
    else if (type === 'goservice') filename = 'meshub-service.exe';
    else filename = file.originalname;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Утилита для вычисления SHA256
function calculateSHA256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Утилита для чтения manifest.json
function readManifest(component, version) {
  const manifestPath = path.join(UPDATES_DIR, component, version, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// Получить последнюю версию компонента
function getLatestVersion(component) {
  const componentDir = path.join(UPDATES_DIR, component);
  if (!fs.existsSync(componentDir)) {
    return null;
  }
  
  const versions = fs.readdirSync(componentDir)
    .filter(v => fs.statSync(path.join(componentDir, v)).isDirectory())
    .sort((a, b) => {
      // Сортировка по semver
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (aParts[i] > bParts[i]) return -1;
        if (aParts[i] < bParts[i]) return 1;
      }
      return 0;
    });
  
  return versions[0] || null;
}

// API: Проверка обновлений
app.get('/api/check', (req, res) => {
  const { version, license, component } = req.query;
  
  // Проверка лицензии (здесь должна быть реальная проверка)
  if (!license) {
    return res.status(401).json({ error: 'License required' });
  }
  
  try {
    const components = component ? [component] : ['backend', 'frontend', 'service'];
    const updates = {};
    let hasUpdates = false;
    
    components.forEach(comp => {
      const latestVersion = getLatestVersion(comp);
      if (latestVersion && latestVersion !== version) {
        const manifest = readManifest(comp, latestVersion);
        if (manifest) {
          updates[comp] = {
            version: manifest.version,
            releaseDate: manifest.releaseDate,
            changelog: manifest.changelog,
            size: manifest.files.reduce((sum, f) => sum + f.size, 0),
            breaking: manifest.breaking || false
          };
          hasUpdates = true;
        }
      }
    });
    
    res.json({
      hasUpdates,
      currentVersion: version,
      updates
    });
  } catch (error) {
    console.error('Error checking updates:', error);
    res.status(500).json({ error: 'Failed to check updates' });
  }
});

// API: Получить информацию о версии
app.get('/api/version/:component/:version', (req, res) => {
  const { component, version } = req.params;
  
  try {
    const manifest = readManifest(component, version);
    if (!manifest) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(manifest);
  } catch (error) {
    console.error('Error getting version info:', error);
    res.status(500).json({ error: 'Failed to get version info' });
  }
});

// API: Скачать компонент
app.get('/api/download/:component/:version', (req, res) => {
  const { component, version } = req.params;
  const { license } = req.query;
  
  // Проверка лицензии
  if (!license) {
    return res.status(401).json({ error: 'License required' });
  }
  
  try {
    const componentDir = path.join(UPDATES_DIR, component, version);
    if (!fs.existsSync(componentDir)) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    // Определяем файл для скачивания
    let downloadFile;
    if (component === 'backend') {
      downloadFile = path.join(componentDir, 'backend.zip');
    } else if (component === 'frontend') {
      downloadFile = path.join(componentDir, 'frontend.zip');
    } else if (component === 'service') {
      downloadFile = path.join(componentDir, 'meshub-service.exe');
    }
    
    if (!fs.existsSync(downloadFile)) {
      return res.status(404).json({ error: 'Download file not found' });
    }
    
    // Логирование скачивания
    console.log(`[DOWNLOAD] ${component} v${version} - License: ${license.substring(0, 8)}...`);
    
    // Отправка файла
    res.download(downloadFile, path.basename(downloadFile));
  } catch (error) {
    console.error('Error downloading:', error);
    res.status(500).json({ error: 'Failed to download' });
  }
});

// API: Загрузка обновления
app.post('/api/upload/:type', upload.single('file'), (req, res) => {
  const { type } = req.params;
  const { version, changelog } = req.body;
  const file = req.file;

  if (!['backend', 'frontend', 'goservice'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  if (!version || !changelog || !file) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const checksum = calculateSHA256(file.path);
    const manifestPath = path.join(path.dirname(file.path), 'manifest.json');
    
    const manifest = {
      version,
      releaseDate: new Date().toISOString(),
      changelog,
      files: [{
        name: file.filename,
        size: file.size,
        checksum
      }],
      breaking: false
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`[UPLOAD] ${type} v${version} uploaded successfully`);
    
    res.json({ success: true, version, checksum });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// API: Список всех версий
app.get('/api/versions/:component', (req, res) => {
  const { component } = req.params;
  
  try {
    const componentDir = path.join(UPDATES_DIR, component);
    if (!fs.existsSync(componentDir)) {
      return res.json({ versions: [] });
    }
    
    const versions = fs.readdirSync(componentDir)
      .filter(v => fs.statSync(path.join(componentDir, v)).isDirectory())
      .map(v => {
        const manifest = readManifest(component, v);
        return {
          version: v,
          releaseDate: manifest?.releaseDate,
          changelog: manifest?.changelog
        };
      })
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    
    res.json({ versions });
  } catch (error) {
    console.error('Error listing versions:', error);
    res.status(500).json({ error: 'Failed to list versions' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Создание структуры папок при первом запуске
function initializeStorage() {
  ['backend', 'frontend', 'service'].forEach(component => {
    const dir = path.join(UPDATES_DIR, component);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Запуск сервера
initializeStorage();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   MES Hub Update Server v1.0.0                        ║
║   Server: http://localhost:${PORT}                   ║
║   Admin Panel: http://localhost:${PORT}/admin.html   ║
║   Updates: ${UPDATES_DIR}                            ║
╚═══════════════════════════════════════════════════════╝
  `);
});
