// Landing Page JavaScript Functionality

class LandingPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTheme();
    this.setupLanguage();
    this.setupAnimations();
    this.setupSmoothScrolling();
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Language selector
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => this.changeLanguage(e.target.value));
    }

    // Tab functionality for usage examples
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => this.showTab(e.target.textContent.toLowerCase()));
    });

    // Copy code functionality
    window.copyCode = (button) => this.copyCode(button);

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => this.smoothScroll(e));
    });

    // Parallax effect for hero background
    this.setupParallax();

    // Navbar scroll effect
    this.setupNavbarScroll();
  }

  setupTheme() {
    // Get saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // Add transition effect
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 300);
  }

  setupLanguage() {
    // Initialize with detected language
    const currentLang = i18n.getCurrentLanguage();
    this.updateLanguageSelector(currentLang);
    i18n.updatePageContent();
  }

  changeLanguage(lang) {
    i18n.setLanguage(lang);
    this.updateLanguageSelector(lang);
  }

  updateLanguageSelector(lang) {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = lang;
    }
  }

  setupAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.feature-card, .provider-card, .download-option');
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });

    // Add staggered animation for feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.1}s`;
    });
  }

  setupSmoothScrolling() {
    // Enable smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  smoothScroll(e) {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      const headerOffset = 80; // Account for fixed navbar
      const elementPosition = targetElement.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  setupParallax() {
    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector('.hero');
      
      if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
      }
      
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick);
  }

  setupNavbarScroll() {
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
      }
      
      if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
        // Scrolling down
        navbar.classList.remove('scroll-up');
        navbar.classList.add('scroll-down');
      } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
        // Scrolling up
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
      }
      
      lastScroll = currentScroll;
    });
  }

  showTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    const clickedTab = document.querySelector(`.tab-button:nth-child(${this.getTabIndex(tabName)})`);
    if (clickedTab) {
      clickedTab.classList.add('active');
    }

    // Show corresponding content
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
      targetContent.classList.add('active');
    }
  }

  getTabIndex(tabName) {
    const tabs = ['javascript', 'python', 'curl'];
    return tabs.indexOf(tabName) + 1;
  }

  async copyCode(button) {
    const codeBlock = button.nextElementSibling;
    const code = codeBlock.textContent;

    try {
      await navigator.clipboard.writeText(code);
      
      // Show feedback
      const originalText = button.textContent;
      button.textContent = '✅';
      button.style.background = 'rgba(16, 185, 129, 0.2)';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'rgba(255, 255, 255, 0.1)';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show feedback
      const originalText = button.textContent;
      button.textContent = '✅';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  }

  // Utility method to add floating animation to elements
  addFloatingAnimation(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      el.style.animation = `float 6s ease-in-out infinite ${index * 0.5}s`;
    });
  }

  // Method to create sparkle effect
  createSparkles(container) {
    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'sparkles';
    sparkleContainer.style.position = 'absolute';
    sparkleContainer.style.top = '0';
    sparkleContainer.style.left = '0';
    sparkleContainer.style.right = '0';
    sparkleContainer.style.bottom = '0';
    sparkleContainer.style.pointerEvents = 'none';
    sparkleContainer.style.overflow = 'hidden';

    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.position = 'absolute';
      sparkle.style.width = '4px';
      sparkle.style.height = '4px';
      sparkle.style.background = '#fbbf24';
      sparkle.style.borderRadius = '50%';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.animation = `sparkle 3s linear infinite ${Math.random() * 3}s`;
      sparkleContainer.appendChild(sparkle);
    }

    container.style.position = 'relative';
    container.appendChild(sparkleContainer);
  }
}

// CSS animations for floating and sparkle effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
  }

  .navbar.scroll-down {
    transform: translateY(-100%);
  }

  .navbar.scroll-up {
    transform: translateY(0);
  }

  .navbar {
    transition: transform 0.3s ease;
  }

  /* Terminal typing animation improvements */
  .terminal-line {
    overflow: hidden;
    white-space: nowrap;
  }

  /* Enhanced hover effects */
  .feature-card:hover .feature-icon,
  .provider-card:hover .provider-icon {
    transform: scale(1.1);
    transition: transform 0.3s ease;
  }

  .download-option:hover .download-icon {
    transform: rotate(5deg) scale(1.1);
    transition: transform 0.3s ease;
  }

  /* Button animations */
  .btn {
    position: relative;
    overflow: hidden;
  }

  .btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .btn:hover::before {
    left: 100%;
  }

  /* Code block enhancements */
  .code-block {
    position: relative;
  }

  .code-block::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .code-block:hover::before {
    opacity: 1;
  }
`;

document.head.appendChild(styleSheet);

// Initialize the landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const landingPage = new LandingPage();
  
  // Add floating animation to icons
  landingPage.addFloatingAnimation('.feature-icon, .provider-icon');
  
  // Add sparkles to hero section
  setTimeout(() => {
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
      landingPage.createSparkles(heroVisual);
    }
  }, 1000);
});

// Handle window resize for responsive adjustments
window.addEventListener('resize', () => {
  // Recalculate parallax on resize
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.transform = 'translateY(0)';
  }
});

// Preload critical resources
const preloadResources = () => {
  const criticalResources = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Initialize preloading
preloadResources();