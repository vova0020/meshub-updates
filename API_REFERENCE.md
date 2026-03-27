# MES Hub Update Server — API Reference

Базовый URL: `http://<host>:3100`

---

## Компоненты

| Имя | Описание | Файл обновления |
|---|---|---|
| `backend` | Backend сервис | `backend.zip` |
| `frontend` | Frontend приложение | `frontend.zip` |
| `service` | Go-сервис | `meshub-service.exe` |

---

## Endpoints

### GET /health
Проверка доступности сервера. Авторизация не нужна.

```
GET /health
```

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /api/check — Проверка обновлений

Используйте этот endpoint при старте системы или по расписанию, чтобы узнать, есть ли новая версия.

```
GET /api/check?version=1.0.0&license=<ключ>&component=backend
```

**Query параметры:**

| Параметр | Обязательный | Описание |
|---|---|---|
| `version` | да | Текущая версия вашей системы |
| `license` | да | Лицензионный ключ |
| `component` | нет | Конкретный компонент. Если не указан — проверяются все три |

**Ответ (есть обновление):**
```json
{
  "hasUpdates": true,
  "currentVersion": "1.0.0",
  "updates": {
    "backend": {
      "version": "1.0.1",
      "releaseDate": "2024-01-15T10:00:00.000Z",
      "changelog": "- Исправлена ошибка в модуле заказов",
      "size": 5242880,
      "breaking": false
    }
  }
}
```

**Ответ (обновлений нет):**
```json
{
  "hasUpdates": false,
  "currentVersion": "1.0.1",
  "updates": {}
}
```

> ⚠️ Если `breaking: true` — обновление содержит несовместимые изменения. Требуется ручное вмешательство перед установкой.

---

### GET /api/versions/:component — Список всех версий

```
GET /api/versions/backend
```

**Ответ:**
```json
{
  "versions": [
    {
      "version": "1.0.1",
      "releaseDate": "2024-01-15T10:00:00.000Z",
      "changelog": "- Исправлена ошибка в модуле заказов"
    },
    {
      "version": "1.0.0",
      "releaseDate": "2024-01-01T10:00:00.000Z",
      "changelog": "🎉 Первый релиз"
    }
  ]
}
```

Версии отсортированы от новой к старой по `releaseDate`.

---

### GET /api/version/:component/:version — Манифест версии

Возвращает полный `manifest.json` для конкретной версии.

```
GET /api/version/backend/1.0.1
```

**Ответ:**
```json
{
  "version": "1.0.1",
  "releaseDate": "2024-01-15T10:00:00.000Z",
  "changelog": "- Исправлена ошибка в модуле заказов",
  "files": [
    {
      "name": "backend.zip",
      "size": 5242880,
      "checksum": "sha256-хэш-файла"
    }
  ],
  "breaking": false
}
```

Используйте `checksum` для проверки целостности скачанного файла (SHA256).

---

### GET /api/download/:component/:version — Скачать обновление

```
GET /api/download/backend/1.0.1?license=<ключ>
```

**Query параметры:**

| Параметр | Обязательный | Описание |
|---|---|---|
| `license` | да | Лицензионный ключ |

**Ответ:** бинарный файл

| Компонент | Имя файла |
|---|---|
| `backend` | `backend.zip` |
| `frontend` | `frontend.zip` |
| `service` | `meshub-service.exe` |

---

## Коды ошибок

| Код | Причина |
|---|---|
| `401` | Не передан `license` |
| `404` | Компонент или версия не найдены |
| `429` | Превышен rate limit (100 запросов / 15 мин с одного IP) |
| `500` | Внутренняя ошибка сервера |

**Формат ошибки:**
```json
{ "error": "описание ошибки" }
```

---

## Типичный сценарий интеграции

```
1. GET /health                                    → убедиться, что сервер доступен
2. GET /api/check?version=X&license=Y&component=Z → проверить наличие обновления
3. Если hasUpdates = true:
   a. GET /api/version/:component/:version        → получить манифест (размер, checksum)
   b. GET /api/download/:component/:version?license=Y → скачать файл
   c. Проверить SHA256 скачанного файла по полю checksum из манифеста
   d. Если breaking = true — уведомить администратора перед установкой
```

---

## Заметки

- Сервер сам определяет «последнюю версию» по semver-сортировке папок в `updates/<component>/`
- `size` в `/api/check` — суммарный размер всех файлов из манифеста в байтах
- Все скачивания логируются на сервере с первыми 8 символами лицензии
