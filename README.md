# MES Hub Update Server

Быстрый и безопасный сервер для распространения обновлений MES Hub.

## 🚀 Быстрый старт

### Установка зависимостей:
```bash
npm install
```

### Запуск сервера:
```bash
npm start
```

### Запуск в режиме разработки:
```bash
npm run dev
```

## 📁 Структура хранилища

```
updateServer/
├── server.js
├── package.json
└── updates/
    ├── backend/
    │   ├── 1.0.0/
    │   │   ├── backend.zip
    │   │   └── manifest.json
    │   └── 1.0.1/
    │       ├── backend.zip
    │       └── manifest.json
    ├── frontend/
    │   ├── 1.0.0/
    │   │   ├── frontend.zip
    │   │   └── manifest.json
    │   └── 1.0.1/
    │       ├── frontend.zip
    │       └── manifest.json
    └── service/
        ├── 1.0.0/
        │   ├── meshub-service.exe
        │   └── manifest.json
        └── 1.0.1/
            ├── meshub-service.exe
            └── manifest.json
```

## 📝 Формат manifest.json

```json
{
  "version": "1.0.1",
  "releaseDate": "2024-01-15T10:00:00Z",
  "changelog": "- Исправлена ошибка в модуле заказов\n- Добавлена поддержка новых станков\n- Улучшена производительность",
  "files": [
    {
      "path": "mes-backend-windows.exe",
      "size": 5242880,
      "sha256": "abc123def456...",
      "required": true
    },
    {
      "path": "prisma/schema.prisma",
      "size": 4096,
      "sha256": "def456abc123...",
      "required": true,
      "requiresMigration": true
    }
  ],
  "minGoServiceVersion": "1.0.0",
  "breaking": false
}
```

## 🌐 API Endpoints

### 1. Проверка обновлений
```
GET /api/check?version=1.0.0&license=xxx&component=backend
```

**Response:**
```json
{
  "hasUpdates": true,
  "currentVersion": "1.0.0",
  "updates": {
    "backend": {
      "version": "1.0.1",
      "releaseDate": "2024-01-15T10:00:00Z",
      "changelog": "...",
      "size": 5242880,
      "breaking": false
    }
  }
}
```

### 2. Информация о версии
```
GET /api/version/:component/:version
```

**Response:** manifest.json

### 3. Скачать обновление
```
GET /api/download/:component/:version?license=xxx
```

**Response:** Файл (ZIP или EXE)

### 4. Список версий
```
GET /api/versions/:component
```

**Response:**
```json
{
  "versions": [
    {
      "version": "1.0.1",
      "releaseDate": "2024-01-15T10:00:00Z",
      "changelog": "..."
    },
    {
      "version": "1.0.0",
      "releaseDate": "2024-01-01T10:00:00Z",
      "changelog": "..."
    }
  ]
}
```

### 5. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## 🔐 Безопасность

- **Rate Limiting**: 100 запросов за 15 минут с одного IP
- **Helmet**: Защита HTTP заголовков
- **CORS**: Настроенный CORS
- **License Check**: Проверка лицензии перед скачиванием
- **Compression**: Сжатие ответов

## 📦 Как добавить новую версию

1. Создайте папку с версией:
```bash
mkdir -p updates/backend/1.0.1
```

2. Поместите файлы:
```bash
# Для backend
cp backend.zip updates/backend/1.0.1/

# Для frontend
cp frontend.zip updates/frontend/1.0.1/

# Для service
cp meshub-service.exe updates/service/1.0.1/
```

3. Создайте manifest.json:
```bash
cat > updates/backend/1.0.1/manifest.json << EOF
{
  "version": "1.0.1",
  "releaseDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "changelog": "- Ваши изменения здесь",
  "files": [],
  "minGoServiceVersion": "1.0.0",
  "breaking": false
}
EOF
```

4. Сервер автоматически обнаружит новую версию!

## 🚀 Деплой на сервер

### Вариант 1: PM2 (рекомендуется)
```bash
npm install -g pm2
pm2 start server.js --name meshub-updates
pm2 save
pm2 startup
```

### Вариант 2: Systemd
```bash
sudo nano /etc/systemd/system/meshub-updates.service
```

```ini
[Unit]
Description=MES Hub Update Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/meshub-updates
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable meshub-updates
sudo systemctl start meshub-updates
```

### Вариант 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3100
CMD ["node", "server.js"]
```

```bash
docker build -t meshub-updates .
docker run -d -p 3100:3100 -v ./updates:/app/updates meshub-updates
```

## 🔧 Переменные окружения

```bash
PORT=3100                    # Порт сервера
NODE_ENV=production          # Режим работы
```

## 📊 Мониторинг

Проверка работоспособности:
```bash
curl http://localhost:3100/health
```

## 📝 Логирование

Все скачивания логируются:
```
[DOWNLOAD] backend v1.0.1 - License: abc12345...
```

## 🎯 Production Ready

- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS
- ✅ Compression
- ✅ Error handling
- ✅ Health checks
- ✅ Logging
- ✅ License validation
