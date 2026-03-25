# Инструкция по подготовке обновлений для загрузки

## 📦 Backend

### Что включить в ZIP архив:
```
backend-1.0.1.zip
├── mes-backend-windows.exe      # Скомпилированный бинарник
├── package.json                 # Только @prisma/client и prisma
├── prisma/
│   └── schema.prisma            # Схема БД
└── uploads/
    └── .gitkeep
```

### Команды для создания:
```bash
cd clientHub/becend
# Убедитесь что есть только нужные файлы
zip -r backend-1.0.1.zip mes-backend-windows.exe package.json prisma/ uploads/
```

**Размер:** ~5-10 MB

---

## 🎨 Frontend

### Что включить в ZIP архив:
```
frontend-1.0.1.zip
├── src/                         # Все исходники React
├── public/                      # Статические файлы
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── index.html
```

### Команды для создания:
```bash
cd clientHub/client
# Убедитесь что нет node_modules, dist, .env
zip -r frontend-1.0.1.zip src/ public/ package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html
```

**Размер:** ~2-5 MB

---

## 🔧 Go Service

### Что загрузить:
- Один файл: `meshub-service.exe`
- Скомпилированный бинарник Go сервиса

### Команды для создания:
```bash
cd goService
go build -o meshub-service.exe
```

**Размер:** ~8-15 MB

---

## ⚠️ Важно

### НЕ включать в архивы:
- ❌ `node_modules/` - устанавливается автоматически
- ❌ `dist/` - собирается автоматически
- ❌ `.env` - создается автоматически
- ❌ `.git/` - не нужен
- ❌ Исходники TypeScript для backend (только .exe)

### Проверка перед загрузкой:
1. Проверьте размер архива (не должен быть слишком большим)
2. Убедитесь что версия в package.json совпадает с версией обновления
3. Проверьте что все необходимые файлы включены
4. Протестируйте архив локально перед загрузкой

---

## 📝 Процесс загрузки через веб-интерфейс

1. Откройте админ-панель: `http://your-server:3100/admin.html`
2. Выберите вкладку (Backend/Frontend/Go Service)
3. Укажите версию (например, `1.0.1`)
4. Напишите changelog:
   ```
   - Исправлена ошибка с авторизацией
   - Добавлена поддержка темной темы
   - Оптимизирована работа с БД
   ```
5. Выберите подготовленный ZIP/EXE файл
6. Нажмите "Загрузить"
7. Дождитесь завершения загрузки

---

## 🔍 Структура на сервере после загрузки

```
/var/www/updates/
├── backend/
│   └── 1.0.1/
│       ├── backend.zip          # Ваш архив
│       └── manifest.json        # Создается автоматически
├── frontend/
│   └── 1.0.1/
│       ├── frontend.zip         # Ваш архив
│       └── manifest.json        # Создается автоматически
└── goservice/
    └── 1.0.1/
        ├── meshub-service.exe   # Ваш файл
        └── manifest.json        # Создается автоматически
```

---

## 🔐 Manifest.json (создается автоматически)

```json
{
  "version": "1.0.1",
  "releaseDate": "2024-01-15T10:00:00Z",
  "changelog": "- Исправлена ошибка...",
  "files": [
    {
      "name": "backend.zip",
      "size": 5242880,
      "checksum": "abc123..."
    }
  ],
  "breaking": false
}
```

---

## ✅ Проверка загруженных обновлений

### API запросы:
```bash
# Список версий Backend
curl http://your-server:3100/api/versions/backend

# Список версий Frontend
curl http://your-server:3100/api/versions/frontend

# Список версий Go Service
curl http://your-server:3100/api/versions/goservice

# Проверка обновлений
curl "http://your-server:3100/api/check?version=1.0.0&license=YOUR_LICENSE&component=backend"
```

### Через веб-интерфейс:
- Загруженные версии отображаются под формой загрузки
- Показывается версия, дата и changelog
