# Portfolio Project Overview

A complete recreation of your Webflow portfolio as a lightweight, static website.

## What You Get

### ✅ Complete Feature Set

1. **Hero Section**
   - Large headline with your name
   - Professional description
   - Call-to-action button with smooth scroll
   - Portrait image with hover effect
   - Fade-in entrance animations

2. **Projects Section**
   - Clean project list layout
   - Interactive hover states
   - 3D floating Rubik cube visualization
   - Grid background plane
   - Prepared for future preview switching

3. **Contact Form**
   - Name, surname, email, message fields
   - Real-time validation with error messages
   - Accessible form design
   - Success/error feedback states
   - Ready for backend integration

4. **Design System**
   - Swiss/International Typographic Style
   - Inter font family (light to bold weights)
   - CSS variable system for easy theming
   - Responsive grid layout
   - High contrast, minimalist aesthetic

### 📁 Project Structure

```
portfolio/
├── src/
│   ├── assets/
│   │   ├── .gitkeep
│   │   └── portrait.jpg          # Replace with your photo
│   ├── scripts/
│   │   ├── main.js               # App logic, form handling
│   │   └── cube.js               # Three.js 3D scene
│   └── styles/
│       └── main.css              # Complete design system
├── index.html                    # Main HTML (all content here)
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Build configuration
├── deploy.sh                     # GitHub Pages deployment
├── README.md                     # Full documentation
├── QUICK_START.md                # 2-minute setup guide
├── CONTRIBUTING.md               # Development guide
└── .editorconfig                 # Code formatting rules
```

### 🎨 Design Language

**Typography:**
- Headings: 72px → 32px (responsive)
- Body: 20px → 16px (responsive)
- Labels: 14px → 12px (responsive)
- Line height: 1.2-1.7 (contextual)
- Letter spacing: -0.03em to 0.05em

**Colors:**
- Background: Pure white (#FFFFFF)
- Text: Pure black (#000000)
- Grays: 100-600 scale for UI elements
- Accent: Iridescent cube (pink, blue, green, yellow)

**Spacing:**
- Scale: 8px → 192px
- Section padding: 128px (desktop) → 64px (mobile)
- Container max-width: 1280px
- Grid gap: 48px → 32px (responsive)

**Motion:**
- Transitions: 150-400ms cubic-bezier easing
- Hover effects: Subtle transform + color changes
- Cube: Slow Y-rotation (0.005 rad/frame) + float
- Respects `prefers-reduced-motion`

### 🛠️ Technology Decisions

**Why Vite?**
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- ES modules support out of the box
- Simple configuration

**Why Three.js?**
- Industry-standard 3D library
- WebGL abstraction
- Great performance
- Extensive documentation

**Why No Framework?**
- Faster load times
- Smaller bundle size (~200KB total)
- No unnecessary abstractions
- Better for static hosting
- Easier to understand and modify

### 📊 Performance Targets

- **Bundle Size**: < 200KB (gzipped)
- **First Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse**: 95+ on all metrics
- **Core Web Vitals**: All green

### 🎯 Browser Support

**Desktop:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Mobile:**
- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+

**Requirements:**
- ES6 modules support
- CSS Grid support
- WebGL for 3D cube

### 🚀 Deployment Options

1. **GitHub Pages** (Free)
   - Custom domain support
   - HTTPS enabled
   - Run `npm run deploy`

2. **Cloudflare Pages** (Free)
   - Global CDN
   - Instant cache purge
   - Analytics included

3. **Netlify** (Free tier)
   - Continuous deployment
   - Form handling built-in
   - Edge functions available

4. **Vercel** (Free tier)
   - Automatic HTTPS
   - Preview deployments
   - Edge network

### 📝 Content Management

**Current State:**
All content is in HTML for simplicity. Easy to find and edit.

**Future Options:**

1. **Headless CMS**
   - Contentful, Sanity, Strapi
   - Requires build-time data fetching
   - Adds complexity but enables non-technical editing

2. **Markdown Files**
   - Store projects as .md files
   - Use Vite plugins to import at build time
   - Good for version control

3. **JSON Configuration**
   - `projects.json` with all data
   - Import in JavaScript
   - Balance of simplicity and structure

### 🔧 Customization Paths

**Easy (no coding):**
- Replace portrait image
- Edit text in HTML
- Change colors in CSS variables
- Add/remove projects

**Medium (basic HTML/CSS):**
- Adjust layout spacing
- Modify font sizes
- Change animation speeds
- Add social media links

**Advanced (JavaScript):**
- Connect form to backend API
- Add project preview images
- Implement project filtering
- Add analytics tracking
- Create project detail pages

### 🎓 Learning Resources

**HTML/CSS:**
- [MDN Web Docs](https://developer.mozilla.org)
- [CSS-Tricks](https://css-tricks.com)
- [Web.dev](https://web.dev)

**Three.js:**
- [Official Docs](https://threejs.org/docs)
- [Three.js Journey](https://threejs-journey.com)
- [Discover Three.js](https://discoverthreejs.com)

**Vite:**
- [Official Guide](https://vitejs.dev/guide)
- [Awesome Vite](https://github.com/vitejs/awesome-vite)

### 🐛 Troubleshooting

**Issue: 3D cube not showing**
- Solution: Check WebGL support, update GPU drivers, try different browser

**Issue: Form validation not working**
- Solution: Check browser console, ensure JavaScript is enabled

**Issue: Styles not applying**
- Solution: Hard refresh (Cmd+Shift+R), clear cache, check CSS path

**Issue: Build fails**
- Solution: Delete `node_modules`, run `npm install` again

### 📞 Support

For issues specific to this codebase:
1. Check [README.md](README.md)
2. Check [CONTRIBUTING.md](CONTRIBUTING.md)
3. Review code comments
4. Inspect browser console

For general web development questions:
- Stack Overflow
- MDN Web Docs
- Web development Discord communities

---

## Next Steps

1. **Immediate:**
   - Replace portrait image
   - Update text content
   - Test locally

2. **Short-term:**
   - Deploy to GitHub Pages
   - Set up custom domain
   - Connect contact form

3. **Long-term:**
   - Add project detail pages
   - Implement case studies
   - Add analytics
   - Create blog section

---

Built with modern web standards and Swiss design principles.
