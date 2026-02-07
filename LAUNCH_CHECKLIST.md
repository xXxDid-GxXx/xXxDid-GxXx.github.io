# Launch Checklist

Complete these steps before deploying your portfolio to production.

## Pre-Launch

### Content
- [ ] Replace placeholder portrait image with your professional photo
- [ ] Update name in hero section
- [ ] Update personal description
- [ ] Review and update all project titles
- [ ] Add appropriate project tags
- [ ] Verify contact form fields match your needs
- [ ] Update footer copyright year

### Visual Review
- [ ] Test on desktop (1280px+)
- [ ] Test on tablet (768-992px)
- [ ] Test on mobile (< 768px)
- [ ] Test on actual phone
- [ ] Verify all images load correctly
- [ ] Check 3D cube renders properly
- [ ] Verify colors match brand
- [ ] Check font rendering across browsers

### Technical
- [ ] Run `npm install` successfully
- [ ] Run `npm run dev` - site loads locally
- [ ] Run `npm run build` - build completes without errors
- [ ] Test built site with `npm run preview`
- [ ] Check browser console for errors
- [ ] Verify smooth scrolling works
- [ ] Test form validation (all fields)
- [ ] Test form submission (console logging)

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Accessibility
- [ ] Navigate entire site with keyboard only
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify focus indicators are visible
- [ ] Check color contrast (use WebAIM tool)
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Verify all images have alt text

### Performance
- [ ] Run Lighthouse audit (aim for 90+ all metrics)
- [ ] Check total bundle size (should be < 500KB)
- [ ] Verify images are optimized
- [ ] Check First Contentful Paint < 2s
- [ ] Check Time to Interactive < 3s

### SEO
- [ ] Verify page title is set
- [ ] Add meta description
- [ ] Ensure semantic HTML usage
- [ ] Check heading hierarchy (h1 → h2 → h3)
- [ ] Verify canonical URL (once deployed)

---

## Deployment

### Pre-Deployment
- [ ] Choose hosting platform (GitHub Pages / Cloudflare / Netlify)
- [ ] Prepare custom domain (if using)
- [ ] Run final build: `npm run build`
- [ ] Test production build locally
- [ ] Commit all changes to git

### GitHub Pages
- [ ] Create GitHub repository
- [ ] Push code to main branch
- [ ] Run `npm run deploy` or manual deployment
- [ ] Enable GitHub Pages in repository settings
- [ ] Set source to `gh-pages` branch
- [ ] Wait for deployment (check Actions tab)
- [ ] Visit deployed URL
- [ ] Test all functionality on live site

### Custom Domain (GitHub Pages)
- [ ] Add CNAME file to dist folder
- [ ] Configure DNS A records:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- [ ] Configure DNS CNAME record for www
- [ ] Add custom domain in GitHub Pages settings
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Enable "Enforce HTTPS" in settings

### Cloudflare Pages
- [ ] Create Cloudflare account
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Trigger deployment
- [ ] Wait for build to complete
- [ ] Visit preview URL
- [ ] Test all functionality

### Custom Domain (Cloudflare)
- [ ] Go to Custom Domains in Pages settings
- [ ] Add your domain
- [ ] Cloudflare automatically configures DNS
- [ ] Wait for SSL certificate provisioning
- [ ] Test HTTPS connection

---

## Post-Launch

### Verification
- [ ] Visit live site from different networks
- [ ] Test on mobile data (not just WiFi)
- [ ] Share link with friend for testing
- [ ] Verify all links work
- [ ] Check form submission still works
- [ ] Verify 3D cube loads on live site
- [ ] Test contact form on production

### Analytics (Optional)
- [ ] Set up Google Analytics
- [ ] Add tracking code to index.html
- [ ] Verify tracking is working
- [ ] Set up conversion goals

### Monitoring
- [ ] Bookmark site URL
- [ ] Set up uptime monitoring (optional)
- [ ] Monitor browser console for errors
- [ ] Check Performance regularly

### Documentation
- [ ] Update README with live URL
- [ ] Document any custom modifications
- [ ] Note any environment-specific settings
- [ ] Save deployment credentials securely

---

## Form Backend (Future)

When ready to connect contact form:
- [ ] Choose form service (Formspree / EmailJS / Custom API)
- [ ] Sign up for service
- [ ] Get API key or endpoint
- [ ] Update form action or JavaScript
- [ ] Test form submission
- [ ] Verify emails are received
- [ ] Set up email notifications
- [ ] Test spam protection

---

## Enhancements (Future)

Consider adding these later:
- [ ] Project detail pages
- [ ] Case study content
- [ ] Image galleries for projects
- [ ] Blog section
- [ ] Resume/CV download
- [ ] Social media links
- [ ] Testimonials section
- [ ] Skills/tools section
- [ ] Animation on scroll
- [ ] Dark mode toggle

---

## Common Issues & Solutions

**Issue: 3D cube not showing on live site**
- Check browser WebGL support
- Verify Three.js is bundled correctly
- Check browser console for errors
- Test in different browser

**Issue: Images not loading**
- Verify image paths are correct
- Check build output includes images
- Ensure Vite is processing assets
- Check file extensions are lowercase

**Issue: Form not submitting**
- Check browser console for JS errors
- Verify all required fields are filled
- Test in different browser
- Check form validation logic

**Issue: Styles not applied**
- Hard refresh (Cmd+Shift+R / Ctrl+F5)
- Check CSS is bundled correctly
- Verify CSS path in index.html
- Clear browser cache

**Issue: Site not updating after deployment**
- Clear CDN cache (if using)
- Hard refresh browser
- Check deployment completed successfully
- Verify correct branch is deployed

---

## Final Checks

Before announcing your portfolio:
- [ ] Share with 2-3 people for feedback
- [ ] Fix any critical issues found
- [ ] Take screenshots for social media
- [ ] Prepare short description for sharing
- [ ] Update LinkedIn/resume with new URL
- [ ] Share on social media
- [ ] Add to email signature

---

## Success Criteria

Your portfolio is ready to launch when:
- ✅ All content is accurate and proofread
- ✅ Site works on all major browsers
- ✅ Mobile experience is smooth
- ✅ No console errors
- ✅ Lighthouse score > 90
- ✅ Form validation works
- ✅ All links are functional
- ✅ Site loads in < 3 seconds

---

🚀 **Ready to launch? Run `npm run deploy`**

Good luck with your new portfolio!
