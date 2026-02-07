# Portfolio Structure Guide

Visual reference for understanding the codebase.

## File Responsibility Map

```
portfolio/
│
├── 📄 index.html
│   └─ All page content (hero, projects, contact form)
│      Change: Names, descriptions, project titles
│
├── 📁 src/
│   │
│   ├── 📁 styles/
│   │   └── 📄 main.css
│   │       └─ Complete design system
│   │          - CSS variables (colors, fonts, spacing)
│   │          - Layout (grid, flexbox)
│   │          - Components (buttons, forms, cards)
│   │          - Responsive breakpoints
│   │          Change: Colors, sizes, spacing
│   │
│   ├── 📁 scripts/
│   │   ├── 📄 main.js
│   │   │   └─ Application logic
│   │   │      - Smooth scrolling
│   │   │      - Form validation & submission
│   │   │      - Project interactions
│   │   │      - 3D scene initialization
│   │   │      Change: Form behavior, validation rules
│   │   │
│   │   └── 📄 cube.js
│   │       └─ Three.js 3D scene
│   │          - Rubik cube creation
│   │          - Grid plane
│   │          - Lighting
│   │          - Animation loop
│   │          Change: Cube colors, rotation speed, size
│   │
│   └── 📁 assets/
│       └── 🖼️ portrait.jpg
│           └─ Your portrait image
│              Replace: With your photo (800×1067px)
│
├── ⚙️ Configuration Files
│   ├── 📄 package.json        → Dependencies & npm scripts
│   ├── 📄 vite.config.js      → Build settings
│   ├── 📄 .editorconfig       → Code formatting
│   ├── 📄 .nvmrc              → Node version
│   ├── 📄 .gitignore          → Git ignored files
│   └── 📄 .env.example        → Environment variable template
│
├── 🚀 Deployment
│   ├── 📄 deploy.sh           → Manual deployment script
│   └── 📁 .github/workflows/
│       └── 📄 deploy.yml      → Automatic GitHub Actions
│
└── 📚 Documentation
    ├── 📄 README.md           → Complete guide
    ├── 📄 QUICK_START.md      → 2-minute setup
    ├── 📄 CONTRIBUTING.md     → Development workflow
    ├── 📄 PROJECT_OVERVIEW.md → Architecture & decisions
    └── 📄 STRUCTURE.md        → This file
```

---

## Section Breakdown

### Hero Section
```html
<section class="hero-section">
  ├── <div class="container">
      ├── <div class="hero-grid">
          ├── Left: Text content
          │   ├── Title + name
          │   ├── Description
          │   └── CTA button
          └── Right: Portrait image
</section>
```

**Files involved:**
- Content: [index.html](index.html) lines ~30-45
- Styles: [src/styles/main.css](src/styles/main.css) lines ~230-280
- Script: None (pure CSS animation)

---

### Projects Section
```html
<section class="projects-section">
  ├── <div class="container">
      ├── Section title
      └── <div class="projects-grid">
          ├── Left: Project list
          │   ├── Project 1 (Linear)
          │   ├── Project 2 (UX Audit)
          │   └── Project 3 (Carbon)
          └── Right: 3D cube canvas
</section>
```

**Files involved:**
- Content: [index.html](index.html) lines ~50-100
- Styles: [src/styles/main.css](src/styles/main.css) lines ~282-360
- Script (cube): [src/scripts/cube.js](src/scripts/cube.js) entire file
- Script (init): [src/scripts/main.js](src/scripts/main.js) lines ~30-40

---

### Contact Section
```html
<section class="contact-section">
  ├── <div class="container">
      ├── Section title
      └── <form class="contact-form">
          ├── Name + Surname (grid)
          ├── Email
          ├── Message (textarea)
          ├── Helper text
          ├── Submit button
          └── Feedback message (hidden)
</section>
```

**Files involved:**
- Content: [index.html](index.html) lines ~105-150
- Styles: [src/styles/main.css](src/styles/main.css) lines ~362-450
- Script: [src/scripts/main.js](src/scripts/main.js) lines ~50-200

---

## CSS Architecture

```css
main.css
├── CSS Variables (lines 8-40)
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Grid
│   └── Transitions
│
├── Reset & Base (lines 45-90)
│   ├── Box-sizing reset
│   ├── Smooth scroll
│   ├── Body defaults
│   └── Reduced motion support
│
├── Typography (lines 95-110)
│   └── Heading styles
│
├── Layout (lines 115-140)
│   ├── Container
│   ├── Section padding
│   └── Section titles
│
├── Components (lines 145-450)
│   ├── Buttons
│   ├── Hero section
│   ├── Projects section
│   ├── Contact form
│   └── Footer
│
└── Responsive (lines 455-550)
    ├── Tablet (992px)
    ├── Mobile (768px)
    └── Small mobile (480px)
```

---

## JavaScript Architecture

### main.js
```javascript
Portfolio Class
├── constructor()
│   └── init()
│       ├── initSmoothScroll()    → Anchor link behavior
│       ├── initCubeScene()       → Start 3D rendering
│       ├── initContactForm()     → Form event listeners
│       └── initProjectHovers()   → Project interactions
│
├── Form Methods
│   ├── validateField()           → Single field validation
│   ├── validateForm()            → Entire form validation
│   ├── showFieldError()          → Display error message
│   ├── clearFieldError()         → Remove error message
│   ├── handleFormSubmit()        → Process submission
│   ├── showFormFeedback()        → Success/error message
│   └── clearFormFeedback()       → Hide feedback
│
└── Event Handlers
    ├── submit → handleFormSubmit()
    ├── blur → validateField()
    └── input → clearFieldError()
```

### cube.js
```javascript
CubeScene Class
├── constructor(canvas)
│   └── init()
│       ├── Scene setup
│       ├── Camera setup
│       ├── Renderer setup
│       ├── createGridPlane()
│       ├── createCube()
│       ├── createLights()
│       └── animate()
│
├── Scene Creation
│   ├── createGridPlane()         → Ground grid
│   ├── createCube()              → 3×3×3 Rubik cube
│   └── createLights()            → Ambient + directional
│
├── Animation
│   └── animate()                 → RAF loop
│       ├── Rotate Y-axis
│       ├── Float animation
│       └── Render scene
│
└── Lifecycle
    ├── onResize()                → Handle window resize
    └── destroy()                 → Cleanup on unmount
```

---

## Data Flow

### Page Load
```
1. HTML parsed
   ↓
2. CSS loaded & applied
   ↓
3. JavaScript modules loaded
   ↓
4. Portfolio class initialized
   ↓
5. Event listeners attached
   ↓
6. Three.js scene created
   ↓
7. Animation loop starts
```

### Form Submission
```
1. User clicks Submit
   ↓
2. Event prevented (no page reload)
   ↓
3. validateForm() called
   ├─ validateField() for each required field
   │  ├─ Check if empty
   │  ├─ Check email format
   │  └─ Check min length
   ↓
4. If valid: collect data
   ↓
5. console.log(data)
   ↓
6. Show success message
   ↓
7. Reset form
```

### 3D Cube Animation
```
1. CubeScene initialized
   ↓
2. Scene, camera, renderer created
   ↓
3. Grid plane added to scene
   ↓
4. 27 small cubes created (3×3×3)
   ↓
5. Lights added
   ↓
6. animate() starts
   ├─ Update time
   ├─ Rotate cube.rotation.y
   ├─ Float cube.position.y
   └─ Render frame
   ↓
7. requestAnimationFrame → repeat step 6
```

---

## Modification Quick Reference

| Want to change...        | Edit this file...              | Around line... |
|--------------------------|--------------------------------|----------------|
| Your name                | [index.html](index.html)       | 30-35          |
| Description              | [index.html](index.html)       | 36-40          |
| Projects                 | [index.html](index.html)       | 50-95          |
| Colors                   | [src/styles/main.css](src/styles/main.css)           | 8-15           |
| Font sizes               | [src/styles/main.css](src/styles/main.css)           | 20-30          |
| Spacing                  | [src/styles/main.css](src/styles/main.css)           | 32-40          |
| Portrait image           | [src/assets/portrait.jpg](src/assets/portrait.jpg)   | (replace file) |
| Cube colors              | [src/scripts/cube.js](src/scripts/cube.js)           | 85-95          |
| Rotation speed           | [src/scripts/cube.js](src/scripts/cube.js)           | 140-145        |
| Form validation rules    | [src/scripts/main.js](src/scripts/main.js)           | 80-120         |
| Form submission behavior | [src/scripts/main.js](src/scripts/main.js)           | 160-200        |

---

## Build Process

```
npm run build
     │
     ├─ Vite reads vite.config.js
     │
     ├─ Entry point: index.html
     │   ├─ Finds <link> → src/styles/main.css
     │   └─ Finds <script> → src/scripts/main.js
     │       └─ Finds import → src/scripts/cube.js
     │           └─ Finds import → three (node_modules)
     │
     ├─ Processes all files
     │   ├─ Minify HTML
     │   ├─ Minify + autoprefixCSS
     │   ├─ Bundle + minify JS
     │   └─ Optimize images
     │
     └─ Output to dist/
         ├── index.html
         ├── assets/
         │   ├── index-[hash].js
         │   ├── index-[hash].css
         │   └── portrait-[hash].jpg
         └── (ready to deploy)
```

---

## Responsive Behavior

```
Desktop (1280px+)
├─ Hero: 2-column grid
├─ Projects: 2-column grid
├─ Form: 2-column name fields
└─ Font sizes: Largest

Tablet (768-992px)
├─ Hero: 1-column stack
├─ Projects: 1-column stack
├─ Form: 2-column name fields
└─ Font sizes: Medium

Mobile (< 768px)
├─ Hero: 1-column stack
├─ Projects: 1-column stack
├─ Form: 1-column all fields
└─ Font sizes: Smallest
```

---

This structure is designed to be:
- **Easy to navigate**: Clear file organization
- **Easy to modify**: Logical separation of concerns
- **Easy to understand**: Comprehensive comments
- **Easy to extend**: Modular architecture

For detailed instructions, see [README.md](README.md) or [CONTRIBUTING.md](CONTRIBUTING.md).
