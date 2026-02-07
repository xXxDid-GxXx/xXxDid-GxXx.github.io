# Portfolio — Hlib Didkovskyi

Personal design portfolio built with vanilla HTML/CSS/JS and Vite.

**Repository:** `xXxDid-GxXx/xXxDid-GxXx.github.io`

## Project Structure

```
xXxDid-GxXx.github.io/
├── index.html                      # Landing page (hero, projects list, contact form)
├── projects/                       # Individual project pages
│   ├── carbon-focus.html
│   ├── linear-marketplace.html
│   └── ux-audit.html
├── src/
│   ├── assets/                     # Images grouped by project
│   │   ├── portrait.png
│   │   ├── Carbon Focus/
│   │   ├── Linear Marketplace/
│   │   └── UX Audit/
│   ├── scripts/
│   │   └── main.js                 # All JS (lightbox, scroll, form, animations)
│   └── styles/
│       ├── main.css                # Global + landing page styles
│       └── project.css             # Project page styles
├── vite.config.js
└── package.json
```

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # → dist/
```

## How to Add a New Project

### Step 1 — Prepare images

Create a folder `src/assets/My Project/` with these files:

| File | Purpose |
|---|---|
| `Preview My Project.png` | Hero image (left column on project page + thumbnail on landing) |
| `My Project Logo.png` | Logo displayed in hero bottom-right |
| `My Project 01.png` … `04.png` | Section images (add more if needed) |
| `Footer bg My Project.png` | Footer background image |

### Step 2 — Create the project page

Copy an existing project file (e.g. `projects/carbon-focus.html`) to `projects/my-project.html` and update:

1. **`<head>`** — Change `<title>` and `<meta description>`
2. **Section 1 (Hero)** — Project name, role, goal, tools, timeline, preview image, logo
3. **Section 2 (Info-only)** — Project summary, visual language, process details
4. **Sections 3–N (Mixed/Images)** — Screenshots with descriptions
5. **More Projects** — Links to 2 other projects
6. **Footer** — Update `background-image` to your footer bg

The page uses these section layout types:

| Layout | Class | Description |
|---|---|---|
| Hero | `project-hero` | Left: preview image, Right: project info + logo |
| Info-only | `project-section-info-only` | Text-only, 2×2 grid of info blocks |
| Mixed | `project-section-sticky` | Left: full-height image, Right: text + image |
| Images-right | `project-section-images-right-only` | Right column only, stacked images |

Sections are grouped inside `<div class="project-sticky-container">` (pairs of 2) to create the layered scroll effect.

### Step 3 — Add to the landing page

In `index.html`, add a new entry inside `.projects-list`:

```html
<a href="/projects/my-project.html" class="project-link">
  <article class="project-item" data-project="my-project">
    <svg class="project-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="project-content">
      <h3 class="project-title">My Project</h3>
      <span class="project-tag">category</span>
    </div>
  </article>
</a>
```

And add a preview image inside `.projects-preview`:

```html
<img src="/src/assets/My Project/Preview My Project.png"
     alt="My Project preview"
     class="project-image"
     data-project="my-project">
```

### Step 4 — Update "More Projects" on other pages

Each project page has a "More Projects" section at the bottom linking to 2 other projects. Update these to include your new project where appropriate.

## Prompt for Adding a New Project with Claude

Use this prompt to have Claude create a project page for you:

```
Create a new project page for my portfolio.

Repository: xXxDid-GxXx/xXxDid-GxXx.github.io
Files to edit:
- Create: projects/[project-slug].html
- Edit:   index.html (add to projects list + preview image)
- Edit:   projects/*.html (update "More Projects" sections)
Images at: src/assets/[Project Name]/

Project name: [Name]
Category tag: [e.g. crypto, landing, audit, dashboard]
Role: [e.g. UI/UX Designer]
Goal: [One sentence describing the project goal]
Tools: [e.g. Figma, GPT]
Timeline: [e.g. 4 weeks]

Sections I want:
1. Hero — [brief note about what the preview shows]
2. [Section title] — [what to describe + which images to show]
3. [Section title] — [what to describe + which images to show]
...

Use projects/carbon-focus.html as the template.
My images are already in src/assets/[Project Name]/ with filenames:
- Preview [Project Name].png
- [Project Name] Logo.png
- [Project Name] 01.png through [Project Name] 04.png
- Footer bg [Project Name].png

Also add the project to index.html and update the "More Projects"
sections on the other project pages to include it.
```

### Tips for better results

- **Be specific about section content.** Instead of "add a section about the process", say "Section 3: show the wireframing process — left image is `Project 02.png`, right side should explain the user flow decisions and information architecture."
- **Specify the number of sections.** The sticky scroll effect works best with sections grouped in pairs (2 sections per `project-sticky-container`).
- **Mention which layout type each section should use** (info-only, mixed, or images-right) if you have a preference.
- **Provide the actual text** for project descriptions when possible — Claude can write placeholder copy, but your own words will be more authentic.

## Tech Stack

- HTML5 + CSS3 (Grid, custom properties, scroll snap)
- Vanilla JS (ES modules, Intersection Observer, lightbox with zoom/drag)
- DM Sans from Google Fonts
- Spline 3D (embedded iframe on landing)
- Formspree + reCAPTCHA (contact form)
- Vite (dev server + build)

## Deployment

```bash
npm run build
# Upload dist/ to any static host (GitHub Pages, Cloudflare Pages, Vercel, etc.)
```
