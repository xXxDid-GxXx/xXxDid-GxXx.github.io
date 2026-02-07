# Quick Start Guide

Get your portfolio running in 2 minutes.

## 1. Install

```bash
npm install
```

## 2. Add Your Portrait

Replace [src/assets/portrait.jpg](src/assets/portrait.jpg) with your photo:
- Size: 800×1067px (3:4 aspect ratio)
- Format: JPG or WebP
- Keep file size under 500KB

## 3. Update Content

Edit [index.html](index.html):

**Your name and description** (line ~30):
```html
<h1 class="hero-title">
  Hi! My name is<br>
  <strong>Your Name</strong>
</h1>
<p class="hero-description">
  Your personal description here...
</p>
```

**Projects** (line ~50):
```html
<h3 class="project-title">Your Project Name</h3>
<span class="project-tag">category</span>
```

## 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 5. Deploy

### GitHub Pages
```bash
npm run deploy
```

Then enable GitHub Pages in your repository settings.

### Cloudflare Pages
```bash
npm run build
```

Upload the `dist/` folder to Cloudflare Pages.

---

## Common Customizations

### Change Colors

Edit [src/styles/main.css](src/styles/main.css) line 8:
```css
:root {
  --color-bg: #FFFFFF;    /* Background */
  --color-text: #000000;  /* Text */
}
```

### Add More Projects

Copy this block in [index.html](index.html):
```html
<article class="project-item" data-project="project-id">
  <div class="project-content">
    <h3 class="project-title">Project Name</h3>
    <span class="project-tag">tag</span>
  </div>
  <svg class="project-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2"/>
  </svg>
</article>
```

### Connect Contact Form

See [README.md](README.md#form-integration) for form integration options.

---

Need more help? Check [README.md](README.md) or [CONTRIBUTING.md](CONTRIBUTING.md)
