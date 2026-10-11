# 圖示精靈圖（sprite）建構流程

```
icons/*.svg          → images/sprite.svg   向量圖示，合併成 <symbol id="icon-檔名">
icons/raster/*.png   → images/sprite.png   點陣圖示（可選，需 Pillow），自動排版成一張圖
                     → assets/icons.css    .icon 基礎樣式與 .sprite-檔名 背景定位
                     → icons/preview.html  本機預覽頁（noindex）
```

## 建構

在專案根目錄執行：

```
python3 scripts/build_sprite.py          # 產生所有輸出
python3 scripts/build_sprite.py --check  # 只檢查輸出是否過期（CI 用，過期回傳 1）
python3 scripts/build_sprite.py --scale 2  # 點陣圖以 @2x 原始檔計算（預設）
```

## 新增圖示

1. 把 SVG 放進 `icons/`，檔名用小寫 kebab-case（例如 `map-pin.svg`），檔名就是 id。
2. 檔案要有 `viewBox`。寫死的顏色（`#16d6e8` 之類）會自動換成 `currentColor`，之後用 CSS `color` 控制；
   若要保留原色，在根元素加 `data-keep-color="true"`。
3. 重新執行建構，然後在頁面中引用：

```html
<link rel="stylesheet" href="/assets/icons.css">
<svg class="icon" aria-hidden="true"><use href="/images/sprite.svg#icon-check"/></svg>
```

點陣圖示用 `<span class="sprite sprite-檔名"></span>`。

`assets/icons.css` 開頭會印出 sprite 版本雜湊，更新圖示後可改用 `/images/sprite.svg?v=<hash>#icon-…` 避免快取。
