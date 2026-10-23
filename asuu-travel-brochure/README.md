# Asuu.Travel — A5 танилцуулга (2 нүүр)

Хэвлэлд бэлэн PDF: `asuu-travel-taniltsuulga-v3.pdf` (A5, 148 × 210 мм, 2 нүүр).

- `index.html` — танилцуулгын эх загвар (HTML/CSS). Текст, хэмжээ, өнгийг эндээс засна.
- `assets/cover.jpg` — нүүрний зураг
- `assets/logo.png` — лого
- `assets/qr.svg` — QR код → https://asuu.travel/mn/providers
- `render.cjs` — HTML-ээс PDF үүсгэх скрипт (Chromium / Playwright)

## Дахин PDF үүсгэх

```bash
NODE_PATH=/opt/node-tools/node_modules node render.cjs
```

Эсвэл `index.html`-ийг Chrome-оор нээж **Print → Save as PDF** (цаас: A5, margins: None,
"Background graphics" асаалттай) гэж хадгална.

Үсгийн фонт: DejaVu Sans (анхны PDF-тэй ижил). Өнгө, зай хэмжээг анхны PDF-ийн
зурах командуудаас (ReportLab) шууд авсан.
