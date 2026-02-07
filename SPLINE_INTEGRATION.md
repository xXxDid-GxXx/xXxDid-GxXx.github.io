# Spline Integration

Your portfolio now uses your custom Spline Rubik's cube instead of Three.js!

## What Changed

### ✅ Added
- Spline viewer script from CDN
- Your custom Rubik's cube from Spline
- URL: `https://prod.spline.design/rubik39scube-1b94c18b988a6175cc05c86c3cdb52ac/scene.splinecode`

### ❌ Removed
- Three.js dependency (lighter bundle!)
- `src/scripts/cube.js` (no longer needed)
- Canvas element (replaced with `<spline-viewer>`)

## How It Works

The Spline viewer loads directly from CDN, so:
- ✅ No npm dependencies for 3D
- ✅ Smaller bundle size
- ✅ Your custom interactive cube
- ✅ All Spline features work (interactions, animations)

## Updating Your Spline Scene

If you want to change the 3D cube:

1. Edit your scene in Spline: https://my.spline.design/rubik39scube-1b94c18b988a6175cc05c86c3cdb52ac/
2. Make your changes
3. Export and get new URL
4. Update in [index.html](index.html) line 83:
```html
<spline-viewer url="YOUR_NEW_URL_HERE"></spline-viewer>
```

## Customizing the Viewer

### Size
Edit [src/styles/main.css](src/styles/main.css) line 356:
```css
spline-viewer {
  width: 100%;
  height: 100%;
  min-height: 500px; /* Change this */
}
```

### Background
The Spline viewer uses your scene's background. To change it, edit in Spline editor.

### Interactions
All interactions are controlled in your Spline scene. The viewer automatically supports:
- Mouse rotation
- Touch gestures
- Scroll behaviors
- Click events

## No Installation Needed!

Since Spline loads from CDN, you can now run:
```bash
npm install  # Only installs Vite
npm run dev
```

Much faster and lighter! 🚀
