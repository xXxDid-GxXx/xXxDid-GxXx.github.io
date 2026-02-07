# Contributing to Portfolio

## Development Workflow

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173)

### Making Changes

**File Organization:**
- HTML: [index.html](index.html)
- Styles: [src/styles/main.css](src/styles/main.css)
- Scripts: [src/scripts/](src/scripts/)
- Assets: [src/assets/](src/assets/)

**Code Style:**
- Use 2 spaces for indentation
- Use semantic HTML5 elements
- Follow BEM-like naming for CSS classes
- Comment complex logic in JavaScript
- Keep functions small and focused

### Testing Changes

**Visual Testing:**
1. Test all breakpoints:
   - Desktop: 1280px+
   - Tablet: 768px - 992px
   - Mobile: < 768px

2. Test interactions:
   - Smooth scrolling
   - Form validation
   - Project hovers
   - 3D cube rendering

**Browser Testing:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari
- Mobile Chrome

**Accessibility:**
- Test keyboard navigation (Tab, Enter, Esc)
- Test with screen reader
- Verify color contrast (WCAG AA)
- Test with `prefers-reduced-motion`

### Building

```bash
npm run build
```

Check the `dist/` folder for output.

### Common Tasks

**Adding a new project:**

1. Open [index.html](index.html)
2. Find the projects section (~line 50)
3. Add a new `<article>` block:

```html
<article class="project-item" data-project="new-project">
  <div class="project-content">
    <h3 class="project-title">New Project</h3>
    <span class="project-tag">category</span>
  </div>
  <svg class="project-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</article>
```

**Updating colors:**

Edit CSS variables in [src/styles/main.css](src/styles/main.css):
```css
:root {
  --color-bg: #FFFFFF;
  --color-text: #000000;
  /* ... */
}
```

**Modifying animations:**

Edit [src/scripts/cube.js](src/scripts/cube.js) for 3D animations:
```javascript
// Rotation speed
this.cube.rotation.y += 0.005;

// Float amplitude
this.cube.position.y = 2 + Math.sin(this.time) * 0.2;
```

## Deployment

See [README.md](README.md#deployment) for deployment instructions.

## Questions?

Open an issue or check existing documentation in the README.
