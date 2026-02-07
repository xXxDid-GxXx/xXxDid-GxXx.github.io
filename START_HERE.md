# 👋 START HERE

Welcome to your new portfolio! This guide will get you up and running in minutes.

## 📋 Quick Navigation

**Just want to get started?** → See [QUICK_START.md](QUICK_START.md)

**Ready to deploy?** → See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)

**Want to understand the code?** → See [STRUCTURE.md](STRUCTURE.md)

**Need design details?** → See [VISUAL_GUIDE.md](VISUAL_GUIDE.md)

**Looking to contribute?** → See [CONTRIBUTING.md](CONTRIBUTING.md)

**Want the full story?** → See [README.md](README.md)

**Curious about architecture?** → See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

---

## 🎯 What You Have

A complete, production-ready portfolio website featuring:

### ✨ Features
- Modern Swiss design language
- Fully responsive (mobile, tablet, desktop)
- Interactive 3D Rubik cube (Three.js)
- Contact form with validation
- Smooth scrolling & animations
- Zero frameworks - pure HTML/CSS/JS
- Optimized for GitHub Pages & Cloudflare

### 📦 Tech Stack
- **HTML5**: Semantic markup
- **CSS3**: Grid, variables, modern features
- **JavaScript ES6+**: Modules, classes
- **Three.js**: 3D visualization
- **Vite**: Build tool & dev server

---

## 🚀 Getting Started (2 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 3. Customize Your Content

#### Replace Portrait
- Add your photo to [src/assets/portrait.jpg](src/assets/portrait.jpg)
- Recommended: 800×1067px (3:4 ratio)

#### Update Text
Edit [index.html](index.html):

**Your Name** (line 30):
```html
<strong>Your Name</strong>
```

**Description** (line 35):
```html
<p class="hero-description">
  Your personal description here...
</p>
```

**Projects** (line 50+):
```html
<h3 class="project-title">Your Project</h3>
<span class="project-tag">category</span>
```

### 4. Deploy
```bash
npm run build
```

Then deploy the `dist/` folder to:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel

---

## 📚 Documentation Map

```
START_HERE.md (you are here)
│
├─ Getting Started
│  ├─ QUICK_START.md        ← 2-minute setup guide
│  └─ LAUNCH_CHECKLIST.md   ← Pre-deployment checklist
│
├─ Understanding the Code
│  ├─ STRUCTURE.md          ← File organization & data flow
│  ├─ VISUAL_GUIDE.md       ← Design system reference
│  └─ PROJECT_OVERVIEW.md   ← Architecture & decisions
│
└─ Development
   ├─ README.md             ← Complete documentation
   └─ CONTRIBUTING.md       ← Development workflow
```

---

## 🎨 Customization Quick Reference

| I want to...                | Open this file...              | Edit around... |
|-----------------------------|--------------------------------|----------------|
| Change my name/description  | [index.html](index.html)       | lines 30-40    |
| Update projects             | [index.html](index.html)       | lines 50-95    |
| Replace portrait            | [src/assets/](src/assets/)     | portrait.jpg   |
| Change colors               | [src/styles/main.css](src/styles/main.css)           | lines 8-15     |
| Modify fonts/sizes          | [src/styles/main.css](src/styles/main.css)           | lines 16-30    |
| Adjust spacing              | [src/styles/main.css](src/styles/main.css)           | lines 32-40    |
| Change cube colors          | [src/scripts/cube.js](src/scripts/cube.js)           | lines 85-95    |
| Adjust animations           | [src/scripts/cube.js](src/scripts/cube.js)           | lines 140-145  |
| Modify form validation      | [src/scripts/main.js](src/scripts/main.js)           | lines 80-120   |
| Connect form backend        | [src/scripts/main.js](src/scripts/main.js)           | lines 160-200  |

---

## 🛠️ Common Tasks

### Add a New Project
1. Open [index.html](index.html)
2. Find the projects section (line ~50)
3. Copy an existing `<article>` block
4. Update the title, tag, and data-project attribute

### Change Color Scheme
1. Open [src/styles/main.css](src/styles/main.css)
2. Find `:root` variables (line ~8)
3. Update color values
4. Save and refresh browser

### Modify 3D Cube
1. Open [src/scripts/cube.js](src/scripts/cube.js)
2. Find the `colors` array (line ~85)
3. Change hex values
4. Adjust rotation speed (line ~140)

### Connect Contact Form
See [README.md#form-integration](README.md#form-integration) for:
- Formspree integration
- Custom API setup
- Email service options

---

## 🎯 Next Steps

### Immediate (Do Now)
1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Replace portrait image
4. ✅ Update your name and description
5. ✅ Test the site locally

### Short-term (This Week)
1. 🎨 Customize colors to match your brand
2. 📝 Add your actual projects
3. 🧪 Test on different devices
4. 🚀 Deploy to GitHub Pages or Cloudflare
5. 🌐 Set up custom domain (optional)

### Long-term (Future)
1. 📧 Connect contact form to email service
2. 📊 Add analytics tracking
3. 🖼️ Create project detail pages
4. ✍️ Add case studies
5. 📱 Add social media links

---

## 🏗️ Project Structure

```
portfolio/
│
├── 📄 index.html              ← All content (edit this first!)
│
├── 📁 src/
│   ├── 📁 assets/
│   │   └── 🖼️ portrait.jpg   ← Replace with your photo
│   │
│   ├── 📁 scripts/
│   │   ├── main.js            ← Form logic & interactions
│   │   └── cube.js            ← 3D cube animation
│   │
│   └── 📁 styles/
│       └── main.css           ← All styles & design system
│
├── 📁 Documentation/
│   ├── README.md              ← Full documentation
│   ├── QUICK_START.md         ← Fast setup
│   ├── STRUCTURE.md           ← Code organization
│   ├── VISUAL_GUIDE.md        ← Design reference
│   ├── PROJECT_OVERVIEW.md    ← Architecture
│   ├── CONTRIBUTING.md        ← Dev workflow
│   └── LAUNCH_CHECKLIST.md    ← Pre-deploy checks
│
└── ⚙️ Config/
    ├── package.json           ← Dependencies
    ├── vite.config.js         ← Build settings
    ├── deploy.sh              ← Deployment script
    └── .github/workflows/     ← Auto-deployment
```

---

## 🆘 Need Help?

### Common Issues

**Site won't start**
```bash
rm -rf node_modules
npm install
npm run dev
```

**3D cube not showing**
- Check browser console for errors
- Ensure WebGL is supported
- Try a different browser

**Changes not appearing**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
- Clear browser cache
- Restart dev server

**Build fails**
```bash
rm -rf node_modules .vite
npm install
npm run build
```

### Resources
- **HTML/CSS**: [MDN Web Docs](https://developer.mozilla.org)
- **Three.js**: [Official Docs](https://threejs.org/docs)
- **Vite**: [Guide](https://vitejs.dev/guide)
- **Git/GitHub**: [GitHub Docs](https://docs.github.com)

---

## ✅ Pre-Launch Checklist

Before going live, ensure:
- [ ] Portrait image replaced
- [ ] Name and description updated
- [ ] Projects list customized
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] No console errors
- [ ] Form validation works
- [ ] Build completes successfully

**Full checklist:** [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)

---

## 🎉 You're Ready!

You now have everything you need to:
1. ✨ Customize your portfolio
2. 🧪 Test it thoroughly
3. 🚀 Deploy to production
4. 🌐 Share with the world

**Start by running:**
```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and see your portfolio come to life!

---

## 📞 Quick Reference

| Command          | What it does                    |
|------------------|---------------------------------|
| `npm install`    | Install dependencies            |
| `npm run dev`    | Start development server        |
| `npm run build`  | Build for production            |
| `npm run preview`| Preview production build        |
| `npm run deploy` | Deploy to GitHub Pages          |

| File                     | Contains                  |
|--------------------------|---------------------------|
| [index.html](index.html) | All your content          |
| [src/styles/main.css](src/styles/main.css)     | All styles          |
| [src/scripts/main.js](src/scripts/main.js)     | App logic           |
| [src/scripts/cube.js](src/scripts/cube.js)     | 3D visualization    |

---

**Questions?** Check the documentation files above or review the code comments.

**Happy building! 🚀**
