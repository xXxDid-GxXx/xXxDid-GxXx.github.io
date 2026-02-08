/**
 * Main application entry point
 * Handles smooth scrolling, form validation, section-based grid line animation
 */

class Portfolio {
  constructor() {
    this.form = null;
    this.gridLine = null;
    this.sections = [];
    this.currentSectionIndex = -1;
    this.isAnimating = false;
    this.init();
  }

  init() {
    // Initialize smooth scroll for navigation links
    this.initSmoothScroll();

    // Initialize contact form
    this.initContactForm();

    // Initialize section-based grid line animation
    this.initGridLine();

    // Initialize project items animation
    this.initProjectsAnimation();

    // Initialize project preview on hover
    this.initProjectPreview();


    // Initialize image lightbox
    this.initLightbox();

    // Initialize scroll to top button
    this.initScrollToTop();

    // Initialize scroll appear animations
    this.initScrollAppear();

    // Initialize contact section animation
    this.initContactAnimation();

    // Initialize mobile scroll reveal
    this.initMobileReveal();
  }

  /**
   * Smooth scroll for anchor links
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');

        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });
  }

  /**
   * Initialize section-based grid line animation
   */
  initGridLine() {
    this.gridLine = document.querySelector('.grid-line');
    if (!this.gridLine) return;

    // Get all full-height sections
    this.sections = Array.from(document.querySelectorAll('.section-fullheight'));

    // Animate on first load
    setTimeout(() => {
      this.animateGridLine(0);
    }, 100);

    // Update grid line based on scroll position
    const updateGridLine = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Find which section we should activate (when scrolled 50% into it)
      for (let i = 0; i < this.sections.length; i++) {
        const section = this.sections[i];
        const rect = section.getBoundingClientRect();
        const sectionTop = scrollY + rect.top;

        // Check if we're at least 50vh (50%) into this section
        // The threshold should be: top of section + 50vh
        const threshold = sectionTop + (viewportHeight * 0.5);

        // Trigger when we pass the threshold and this section index is greater than current
        if (scrollY + viewportHeight >= threshold && i > this.currentSectionIndex) {
          // Trigger animation for this section
          this.animateGridLine(i);
          break;
        }
      }
    };

    // Update on scroll with throttling for better performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateGridLine();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Animate grid line to extend through the current section
   */
  animateGridLine(sectionIndex) {
    if (this.isAnimating || sectionIndex === this.currentSectionIndex) return;

    this.isAnimating = true;
    this.currentSectionIndex = sectionIndex;

    // Calculate total height to bottom of current section
    let totalHeight = 0;
    for (let i = 0; i <= sectionIndex; i++) {
      totalHeight += this.sections[i].offsetHeight;
    }

    // Get current height to ensure we only animate forward
    const currentHeight = parseFloat(this.gridLine.style.height) || 0;

    // Only animate if we're extending (not shrinking)
    if (totalHeight > currentHeight) {
      this.gridLine.style.transition = 'height 1.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
      requestAnimationFrame(() => {
        this.gridLine.style.height = `${totalHeight}px`;
      });

      // Trigger UI grid animation when entering second section (index 1)
      if (sectionIndex === 1) {
        const uiGrid = document.querySelector('.ui-grid-bg');
        const splineIframe = document.querySelector('.project-preview iframe');
        if (uiGrid) {
          uiGrid.classList.add('visible');
        }
        // Show Spline 3D after UI grid animation finishes (0.8s)
        if (splineIframe) {
          setTimeout(() => {
            splineIframe.classList.add('visible');
          }, 800);
        }
      }

      // Mark animation as complete after duration
      setTimeout(() => {
        this.isAnimating = false;
      }, 1400);
    } else {
      this.isAnimating = false;
    }
  }

  /**
   * Initialize project items animation on scroll
   */
  initProjectsAnimation() {
    const projectsSection = document.querySelector('.projects-section');
    const sectionTitle = projectsSection?.querySelector('.section-title');
    const projectItems = document.querySelectorAll('.project-item');

    if (!projectItems.length) return;

    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    // Observer for section title
    if (sectionTitle) {
      const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            titleObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);
      titleObserver.observe(sectionTitle);
    }

    // Observer for project items
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    projectItems.forEach(item => observer.observe(item));
  }

  /**
   * Initialize contact section animation
   */
  initContactAnimation() {
    const contactSection = document.querySelector('.contact-section');
    const contactCard = document.querySelector('.contact-card');
    if (!contactSection || !contactCard) return;

    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          contactCard.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    observer.observe(contactSection);
  }

  /**
   * Initialize project preview images on hover
   */
  initProjectPreview() {
    const projectItems = document.querySelectorAll('.project-item');
    const projectImages = document.querySelectorAll('.project-image');
    const splineIframe = document.querySelector('.project-preview iframe');

    if (!projectItems.length) return;

    projectItems.forEach(item => {
      const projectId = item.getAttribute('data-project');

      item.addEventListener('mouseenter', () => {
        // Hide Spline 3D
        if (splineIframe) {
          splineIframe.classList.add('hidden');
        }
        // Find matching image and show it
        projectImages.forEach(img => {
          if (img.getAttribute('data-project') === projectId) {
            img.classList.add('active');
          }
        });
      });

      item.addEventListener('mouseleave', () => {
        // Show Spline 3D
        if (splineIframe) {
          splineIframe.classList.remove('hidden');
        }
        // Hide all images
        projectImages.forEach(img => {
          img.classList.remove('active');
        });
      });
    });
  }


  /**
   * Initialize image lightbox for expanding images
   */
  initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxTitle = lightbox.querySelector('.lightbox-title');

    // Drag state
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 50;
    let originY = 50;

    // Get all expandable images
    const expandableImages = document.querySelectorAll(
      '.project-section-image img, .project-section-diagram img'
    );

    // Open lightbox on image click
    expandableImages.forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
        lightboxImage.classList.remove('zoomed', 'dragging');
        lightboxImage.style.transformOrigin = '50% 50%';
        originX = 50;
        originY = 50;

        // Get title from sibling element
        if (lightboxTitle) {
          const parent = img.parentElement;
          const titleEl = parent.querySelector('.project-image-title, .project-diagram-title');
          lightboxTitle.textContent = titleEl ? titleEl.textContent : '';
        }

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    // Toggle zoom on lightbox image click
    lightboxImage.addEventListener('click', (e) => {
      if (isDragging) return;
      e.stopPropagation();

      if (!lightboxImage.classList.contains('zoomed')) {
        // Zoom in at click position
        const rect = lightboxImage.getBoundingClientRect();
        originX = ((e.clientX - rect.left) / rect.width) * 100;
        originY = ((e.clientY - rect.top) / rect.height) * 100;
        lightboxImage.style.transformOrigin = `${originX}% ${originY}%`;
        lightboxImage.classList.add('zoomed');
      } else {
        // Zoom out
        lightboxImage.classList.remove('zoomed');
        lightboxImage.style.transformOrigin = '50% 50%';
        originX = 50;
        originY = 50;
      }
    });

    // Drag to pan when zoomed
    lightboxImage.addEventListener('mousedown', (e) => {
      if (!lightboxImage.classList.contains('zoomed')) return;
      e.preventDefault();
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      lightboxImage.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!lightboxImage.classList.contains('dragging')) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isDragging = true;
      }

      // Adjust transform origin based on drag
      originX = Math.max(0, Math.min(100, originX - deltaX * 0.1));
      originY = Math.max(0, Math.min(100, originY - deltaY * 0.1));
      lightboxImage.style.transformOrigin = `${originX}% ${originY}%`;

      startX = e.clientX;
      startY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
      lightboxImage.classList.remove('dragging');
      setTimeout(() => { isDragging = false; }, 10);
    });

    // Close lightbox on close button click
    lightboxClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeLightbox(lightbox, lightboxImage);
    });

    // Close lightbox on background click (only when not zoomed)
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        this.closeLightbox(lightbox, lightboxImage);
      }
    });

    // Close lightbox on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        this.closeLightbox(lightbox, lightboxImage);
      }
    });
  }

  /**
   * Close the lightbox modal
   */
  closeLightbox(lightbox, lightboxImage) {
    lightbox.classList.remove('active');
    if (lightboxImage) {
      lightboxImage.classList.remove('zoomed', 'dragging');
      lightboxImage.style.transformOrigin = '50% 50%';
    }
    document.body.style.overflow = '';
  }

  /**
   * Initialize scroll to top button
   */
  initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (!scrollToTopBtn) return;

    // Show button after scrolling down
    let hasScrolled = false;

    const updateButtonVisibility = () => {
      if (window.scrollY > 100) {
        if (!hasScrolled) {
          hasScrolled = true;
          scrollToTopBtn.classList.add('visible');
        }
      }
    };

    // Check on scroll
    window.addEventListener('scroll', updateButtonVisibility, { passive: true });

    // Scroll to top on click
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // Hide button after scrolling
      setTimeout(() => {
        hasScrolled = false;
        scrollToTopBtn.classList.remove('visible');
      }, 500);
    });
  }

  /**
   * Initialize scroll appear animations for project page elements
   */
  initScrollAppear() {
    // Select elements to animate on the project page
    const animatableElements = document.querySelectorAll(
      '.project-section-image, .project-section-info, .project-section-diagram, .project-info-block, .more-projects-title, .more-projects-card, .more-projects-btn'
    );

    if (!animatableElements.length) return;

    // Add scroll-appear class to all elements
    animatableElements.forEach((el, index) => {
      el.classList.add('scroll-appear');
      // Add stagger delay based on position within parent
      const parent = el.parentElement;
      const siblings = Array.from(parent.children).filter(child =>
        child.classList.contains('scroll-appear')
      );
      const siblingIndex = siblings.indexOf(el);
      if (siblingIndex > 0 && siblingIndex <= 4) {
        el.classList.add(`delay-${siblingIndex}`);
      }
    });

    // Create intersection observer
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    animatableElements.forEach(el => observer.observe(el));
  }

  /**
   * Mobile scroll reveal: content appears from bottom one by one
   */
  initMobileReveal() {
    if (window.innerWidth > 768) return;

    const selectors = [
      // Home page
      '.hero-text',
      '.hero-portrait-cell',
      '.hero-button-cell',
      '.projects-section .section-title',
      '.project-link',
      '.contact-card .section-title',
      '.form-grid',
      '.contact-form > .form-group',
      '.form-footer',
      '.contact-form > button',
      // Project pages
      '.project-hero-image',
      '.project-info-upper',
      '.project-info-lower',
      '.project-section-image',
      '.project-section-info',
      '.project-section-diagram',
      '.more-projects-title',
      '.more-projects-card',
      '.more-projects-container > .btn',
      // Shared
      '.footer'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    if (!elements.length) return;

    // Group elements by closest section for stagger delays
    const sectionMap = new Map();
    elements.forEach(el => {
      const section = el.closest('section, footer, .contact-card');
      if (!section) return;
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section).push(el);
    });

    // Add mobile-reveal class and stagger delays within each group
    sectionMap.forEach((sectionEls) => {
      sectionEls.forEach((el, i) => {
        el.classList.add('mobile-reveal');
        if (i > 0 && i <= 5) {
          el.classList.add(`reveal-delay-${i}`);
        }
      });
    });

    // Observe elements and reveal when scrolled into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  /**
   * Contact form validation and submission
   */
  initContactForm() {
    this.form = document.getElementById('contact-form');
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Real-time validation on blur
    const inputs = this.form.querySelectorAll('.form-input');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        // Clear error on input
        if (input.classList.contains('error')) {
          this.clearFieldError(input);
        }
      });
    });
  }

  /**
   * Validate individual form field
   */
  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let errorMessage = '';

    // Check required fields
    if (field.hasAttribute('required') && !value) {
      errorMessage = 'This field is required';
    }

    // Email validation
    if (fieldName === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Name validation (basic)
    if ((fieldName === 'name' || fieldName === 'surname') && value) {
      if (value.length < 2) {
        errorMessage = 'Must be at least 2 characters';
      }
    }

    if (errorMessage) {
      this.showFieldError(field, errorMessage);
      return false;
    } else {
      this.clearFieldError(field);
      return true;
    }
  }

  /**
   * Show field error
   */
  showFieldError(field, message) {
    field.classList.add('error');
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  /**
   * Clear field error
   */
  clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  /**
   * Validate entire form
   */
  validateForm() {
    const requiredFields = this.form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit() {
    // Clear previous feedback
    this.clearFormFeedback();

    // Validate form
    if (!this.validateForm()) {
      this.showFormFeedback('Please correct the errors above', 'error');
      return;
    }

    // Check reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
      const recaptchaResponse = grecaptcha.getResponse();
      if (!recaptchaResponse) {
        this.showFormFeedback('Please complete the CAPTCHA', 'error');
        return;
      }
    }

    // Get form action URL
    const formAction = this.form.getAttribute('action');
    if (!formAction || formAction.includes('YOUR_FORM_ID')) {
      this.showFormFeedback('Form not configured. Please set up Formspree.', 'error');
      return;
    }

    // Disable submit button
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      // Submit form data to Formspree
      const formData = new FormData(this.form);
      // Remove reCAPTCHA response so Formspree doesn't try to verify it server-side
      formData.delete('g-recaptcha-response');
      const response = await fetch(formAction, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Show success message
        this.showFormFeedback(
          'Thank you for your message! I will get back to you soon.',
          'success'
        );

        // Reset form
        this.form.reset();

        // Reset reCAPTCHA
        if (typeof grecaptcha !== 'undefined') {
          grecaptcha.reset();
        }

        // Clear all field errors
        const inputs = this.form.querySelectorAll('.form-input');
        inputs.forEach((input) => this.clearFieldError(input));
      } else {
        const data = await response.json().catch(() => null);
        console.error('Formspree error:', response.status, response.statusText, data);
        if (data && data.errors) {
          this.showFormFeedback(data.errors.map(e => e.message).join(', '), 'error');
        } else {
          this.showFormFeedback(`Something went wrong (${response.status}). Please try again.`, 'error');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.showFormFeedback('Network error. Please check your connection and try again.', 'error');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  /**
   * Show form feedback message
   */
  showFormFeedback(message, type = 'success') {
    const feedback = this.form.querySelector('.form-feedback');
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = `form-feedback ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.clearFormFeedback();
    }, 5000);
  }

  /**
   * Clear form feedback
   */
  clearFormFeedback() {
    const feedback = this.form.querySelector('.form-feedback');
    if (feedback) {
      feedback.className = 'form-feedback';
      feedback.textContent = '';
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();
  });
} else {
  new Portfolio();
}
