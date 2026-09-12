# Imagine • Multi-Prompt AI Batch Studio

> Современное мультиплатформенное приложение для пакетной генерации и редактирования изображений на базе нейросетей (Boogu-Image Turbo 1.5K UHD).

[![Deploy to GitHub Pages](https://github.com/whatrushki/imagine/actions/workflows/deploy-gh-pages.yml/badge.svg)](https://github.com/whatrushki/imagine/actions/workflows/deploy-gh-pages.yml)
[![Build and Publish Multiplatform Release](https://github.com/whatrushki/imagine/actions/workflows/release.yml/badge.svg)](https://github.com/whatrushki/imagine/actions/workflows/release.yml)

---

## ✨ Возможности

- **ChatGPT-подобный интерфейс**: компактный ввод промптов с автоматическим свёртыванием в теги, чистая компоновка, плавная боковая панель.
- **Пакетная матричная генерация**: автоматическое перемножение N фотографий на M промптов (до 100+ параллельных/очередных задач).
- **Непрерывная очередь**: отправка новой пачки не стирает текущую очередь, задачи динамически дописываются в активный пул.
- **Интеллектуальные ретраи**: автоматический повтор при сетевых сбоях (до 5 попыток с экспоненциальной задержкой).
- **Фоновая работа в мобильном браузере**:
  - Screen Wake Lock API
  - Бесшумный звуковой цикл для удержания фоновой активности вкладки (iOS / Android)
  - Web Worker Heartbeat
  - Постоянное сохранение всех исходников и результатов в IndexedDB
- **Мобильный UX & True Fullscreen**:
  - Экран очереди: текущее генерируемое фото сверху, прогресс-бар по центру, плоский список задач снизу.
  - Полноэкранный просмотр (edge-to-edge): свайпы влево/вправо для перелистывания, свайп вниз/вверх для закрытия, интерактивный слайдер «До / После».
- **Экспорт**: сохранение отдельных файлов напрямую в галерею устройства или выгрузка всех результатов единым ZIP-архивом.

---

## 📱 Платформы

- **Web / PWA**: адаптивное веб-приложение с поддержкой оффлайн-кэширования и установки в качестве приложения.
- **Desktop (Windows)**: сборка установщика `.exe` (Electron).
- **Android**: мобильное приложение `.apk` (`app.what.imagine`).

---

## 🚀 Быстрый старт

### Требования
- Node.js 20+
- npm

### Установка и локальный запуск
```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

### Сборка веб-версии
```bash
npm run build
```

---

## 📦 CI / CD Автоматизация

В проекте настроены два GitHub Actions workflow:

1. **Deploy to GitHub Pages (`deploy-gh-pages.yml`)**:
   Срабатывает автоматически при каждом `push` в ветку `main` и публикует PWA на GitHub Pages.

2. **Build and Publish Multiplatform Release (`release.yml`)**:
   Срабатывает при создании тега `v*` (или публикации релиза):
   - Собирает Windows-установщик `Imagine-Setup.exe`
   - Собирает Android APK `Imagine.apk` (пакет `app.what.imagine`)
   - Автоматически прикрепляет собранные бинарники к GitHub Release.