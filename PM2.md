# 🚀 Запуск через PM2

PM2 - это production process manager для Node.js приложений с балансировкой нагрузки.

## 📦 Установка PM2

```bash
# Глобальная установка PM2
sudo npm install -g pm2

# Проверка версии
pm2 --version
```

## 🎯 Быстрый старт

### Вариант 1: Простой запуск

```bash
cd /var/www/meshub-updates

# Запуск приложения
pm2 start server.js --name meshub-updates

# Сохранить список процессов
pm2 save

# Настроить автозапуск при перезагрузке
pm2 startup
# Выполните команду которую покажет PM2
```

### Вариант 2: С конфигурацией (рекомендуется)

```bash
cd /var/www/meshub-updates

# Запуск с конфигурацией
pm2 start ecosystem.config.js

# Сохранить
pm2 save

# Автозапуск
pm2 startup
```

## 🔧 Управление процессом

```bash
# Список процессов
pm2 list

# Статус
pm2 status

# Подробная информация
pm2 show meshub-updates

# Мониторинг в реальном времени
pm2 monit

# Логи в реальном времени
pm2 logs meshub-updates

# Последние 100 строк логов
pm2 logs meshub-updates --lines 100

# Очистить логи
pm2 flush
```

## 🔄 Перезапуск и остановка

```bash
# Перезапуск
pm2 restart meshub-updates

# Остановка
pm2 stop meshub-updates

# Удаление из PM2
pm2 delete meshub-updates

# Перезапуск всех процессов
pm2 restart all

# Остановка всех процессов
pm2 stop all
```

## 📊 Мониторинг

```bash
# Веб-интерфейс мониторинга (опционально)
pm2 install pm2-logrotate

# Настройка ротации логов
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 🔄 Обновление приложения

```bash
cd /var/www/meshub-updates

# Остановить процесс
pm2 stop meshub-updates

# Обновить код
git pull
# или загрузить новые файлы

# Установить зависимости
npm install --production

# Перезапустить
pm2 restart meshub-updates

# Или reload без даунтайма
pm2 reload meshub-updates
```

## 🆘 Troubleshooting

### Процесс постоянно перезапускается

```bash
# Проверить логи ошибок
pm2 logs meshub-updates --err

# Проверить использование памяти
pm2 monit

# Увеличить лимит памяти в ecosystem.config.js
# max_memory_restart: '1G'
```

### Не запускается после перезагрузки

```bash
# Проверить автозапуск
pm2 startup

# Пересохранить список процессов
pm2 save --force

# Проверить сохраненные процессы
pm2 resurrect
```

### Проверка портов

```bash
# Проверить что порт 3100 свободен
sudo netstat -tulpn | grep 3100

# Если занят - убить процесс
sudo kill -9 <PID>
```

## 📈 Продвинутые настройки

### Кластерный режим (несколько инстансов)

Отредактируйте `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'meshub-updates',
    script: './server.js',
    instances: 2,  // или 'max' для всех CPU
    exec_mode: 'cluster',
    // ...
  }]
};
```

```bash
pm2 reload ecosystem.config.js
```

### Переменные окружения

```bash
# Запуск с переменными
pm2 start server.js --name meshub-updates --env production

# Или в ecosystem.config.js добавить:
env_production: {
  NODE_ENV: 'production',
  PORT: 3100,
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'password'
}
```

## 🔐 Запуск от непривилегированного пользователя

```bash
# Создать пользователя
sudo useradd -r -s /bin/bash meshub

# Передать права на папку
sudo chown -R meshub:meshub /var/www/meshub-updates

# Переключиться на пользователя
sudo su - meshub

# Запустить PM2
cd /var/www/meshub-updates
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ✅ Проверка работы

```bash
# Статус PM2
pm2 status

# Проверка endpoint
curl http://localhost:3100/health

# Проверка логов
pm2 logs meshub-updates --lines 20
```

## 📋 Полезные команды

```bash
# Информация о системе
pm2 info meshub-updates

# Метрики
pm2 describe meshub-updates

# Сброс счетчиков перезапусков
pm2 reset meshub-updates

# Обновить PM2
npm install -g pm2@latest
pm2 update
```

## 🎯 Рекомендуемая конфигурация для production

```javascript
module.exports = {
  apps: [{
    name: 'meshub-updates',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3100
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
```

## 🔗 Полезные ссылки

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)

---

**Готово!** Сервер запущен через PM2 и будет автоматически перезапускаться при сбоях и перезагрузке системы. 🎉
