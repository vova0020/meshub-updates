# 🚀 Деплой на Ubuntu Server

Полная инструкция по установке и настройке сервера обновлений на Ubuntu.

## 📋 Требования

- Ubuntu 20.04+ (64-bit)
- Root или sudo доступ
- Домен с DNS записью (опционально, для SSL)

## 1️⃣ Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версии
node --version  # должно быть v18+
npm --version

# Установка Nginx
sudo apt install -y nginx

# Установка Certbot для SSL
sudo apt install -y certbot python3-certbot-nginx

# Установка Git (если нужно)
sudo apt install -y git
```

## 2️⃣ Создание директории

```bash
# Создание папки для приложения
sudo mkdir -p /var/www/meshub-updates
sudo chown -R $USER:$USER /var/www/meshub-updates
cd /var/www/meshub-updates
```

## 3️⃣ Загрузка файлов

### Вариант A: Через Git
```bash
git clone https://github.com/your-repo/meshub.git .
cd updateServer
```

### Вариант B: Через SCP
```bash
# На локальной машине
scp -r updateServer/* user@your-server:/var/www/meshub-updates/
```

### Вариант C: Через FTP/SFTP
Используйте FileZilla или WinSCP для загрузки файлов.

## 4️⃣ Установка зависимостей Node.js

```bash
cd /var/www/meshub-updates
npm install --production
```

## 5️⃣ Настройка .env

```bash
cp .env.example .env
nano .env
```

Заполните:
```env
PORT=3100
NODE_ENV=production

# Базовая аутентификация для админ-панели
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!

# CORS (ваш домен или *)
ALLOWED_ORIGINS=*
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

## 6️⃣ Настройка Nginx

```bash
# Создание конфигурации
sudo nano /etc/nginx/sites-available/meshub-updates
```

Вставьте:
```nginx
server {
    listen 80;
    server_name updates.yourdomain.com;  # Замените на ваш домен

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

Сохраните и активируйте:
```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/meshub-updates /etc/nginx/sites-enabled/

# Удалить дефолтный сайт (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

## 7️⃣ Получение SSL сертификата (опционально)

```bash
# Убедитесь что домен указывает на ваш сервер
sudo certbot --nginx -d updates.yourdomain.com

# Следуйте инструкциям Certbot
# Выберите опцию редиректа HTTP -> HTTPS
```

## 8️⃣ Настройка systemd service

```bash
# Создание service файла
sudo nano /etc/systemd/system/meshub-updates.service
```

Вставьте:
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
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=meshub-updates
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Сохраните и запустите:
```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Запустить сервис
sudo systemctl start meshub-updates

# Включить автозапуск
sudo systemctl enable meshub-updates

# Проверить статус
sudo systemctl status meshub-updates
```

## 9️⃣ Настройка Firewall

```bash
# Разрешить Nginx
sudo ufw allow 'Nginx Full'

# Разрешить SSH (если еще не разрешен)
sudo ufw allow OpenSSH

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

## 🔟 Проверка работы

```bash
# Проверка health endpoint
curl http://localhost:3100/health

# Проверка через домен
curl https://updates.yourdomain.com/health

# Проверка логов
sudo journalctl -u meshub-updates -f
```

## 🌐 Доступ

- **Админ-панель:** https://updates.yourdomain.com/admin.html
- **API:** https://updates.yourdomain.com/api/
- **Health:** https://updates.yourdomain.com/health

При первом входе в админ-панель введите логин/пароль из `.env`

## 🔧 Управление сервисом

```bash
# Запуск
sudo systemctl start meshub-updates

# Остановка
sudo systemctl stop meshub-updates

# Перезапуск
sudo systemctl restart meshub-updates

# Статус
sudo systemctl status meshub-updates

# Логи
sudo journalctl -u meshub-updates -f

# Последние 100 строк логов
sudo journalctl -u meshub-updates -n 100
```

## 📊 Мониторинг

### Проверка использования ресурсов
```bash
# CPU и память
htop

# Дисковое пространство
df -h

# Размер папки updates
du -sh /var/www/meshub-updates/updates
```

### Автоматическая очистка старых версий
```bash
# Создать скрипт очистки
nano /var/www/meshub-updates/cleanup.sh
```

```bash
#!/bin/bash
# Удалить версии старше 90 дней
find /var/www/meshub-updates/updates -type d -mtime +90 -exec rm -rf {} +
```

```bash
chmod +x /var/www/meshub-updates/cleanup.sh

# Добавить в cron (раз в неделю)
sudo crontab -e
# Добавить строку:
0 2 * * 0 /var/www/meshub-updates/cleanup.sh
```

## 🔄 Обновление сервера

```bash
cd /var/www/meshub-updates

# Остановить сервис
sudo systemctl stop meshub-updates

# Обновить код
git pull
# или загрузить новые файлы

# Установить зависимости
npm install --production

# Запустить сервис
sudo systemctl start meshub-updates

# Проверить статус
sudo systemctl status meshub-updates
```

## 🆘 Troubleshooting

### Сервис не запускается
```bash
# Проверить логи
sudo journalctl -u meshub-updates -n 50

# Проверить права доступа
ls -la /var/www/meshub-updates

# Проверить порт
sudo netstat -tulpn | grep 3100
```

### Nginx ошибки
```bash
# Проверить конфигурацию
sudo nginx -t

# Проверить логи
sudo tail -f /var/log/nginx/error.log
```

### Проблемы с SSL
```bash
# Обновить сертификат
sudo certbot renew

# Проверить сертификат
sudo certbot certificates
```

## ✅ Готово!

Сервер обновлений установлен и готов к работе! 🎉

Теперь можно:
1. Открыть админ-панель
2. Загрузить первые обновления
3. Настроить Go Service для проверки обновлений
