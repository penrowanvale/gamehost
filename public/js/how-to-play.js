

class HowToPlayManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupFAQInteraction();
    this.setupScrollAnimations();
  }

  setupFAQInteraction() {
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', (e) => {
        const faqItem = e.currentTarget.parentElement;
        const isActive = faqItem.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(item => {
          item.classList.remove('active');
        });

        if (!isActive) {
          faqItem.classList.add('active');
        }
      });
    });
  }

  setupScrollAnimations() {
    
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

    document.querySelectorAll('.instruction-section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(section);
    });

    ['.faq-section', '.support-section'].forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
      }
    });
  }

  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

const howToPlayManager = new HowToPlayManager();

document.addEventListener('DOMContentLoaded', () => {
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});