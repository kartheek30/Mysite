// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {

    // ===== NAVBAR SCROLL =====
    const navbar = document.querySelector('.navbar');
    const backToTop = document.querySelector('.back-to-top');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Navbar
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Back to top
        if (scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== MOBILE MENU =====
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.mobile-overlay');

    function toggleMenu() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }

    hamburger.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', toggleMenu);

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ===== SCROLL REVEAL =====
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                // Stagger delay for cards in a grid
                const parent = entry.target.parentElement;
                const siblings = parent ? parent.querySelectorAll('.reveal, .reveal-left, .reveal-right') : [];
                let index = Array.from(siblings).indexOf(entry.target);
                if (index < 0) index = 0;

                setTimeout(() => {
                    entry.target.classList.add('active');
                }, index * 100);

                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

    // ===== COUNTER ANIMATION =====
    const counters = document.querySelectorAll('[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.floor(eased * target);
            el.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    // ===== PORTFOLIO FILTER =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            portfolioCards.forEach((card, i) => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.animation = `fadeInUp 0.5s ${i * 0.08}s both`;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ===== ACTIVE NAV LINK ON SCROLL =====
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-links a[href="#${id}"]`);

            if (link) {
                if (scrollPos >= top && scrollPos < top + height) {
                    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
                    link.classList.add('active-link');
                }
            }
        });
    });

    // ===== SUPABASE CONFIG =====
    const supabaseUrl = 'https://tmpczvzvzcjqpetfnsux.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcGN6dnp2emNqcXBldGZuc3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTk1MTEsImV4cCI6MjA4ODYzNTUxMX0.L0kKBtibuh019XnTx3clyNodIdV2NdntzKwJfoG8aXQ';
    const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // ===== FORM SUBMIT =====
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('.btn-primary');
            const originalText = btn.innerHTML;

            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                service: document.getElementById('service').value,
                message: document.getElementById('message').value
            };

            try {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                btn.disabled = true;

                const { error } = await _supabase
                    .from('messages')
                    .insert([formData]);

                if (error) throw error;

                // Send email notification via Edge Function
                await _supabase.functions.invoke('send-contact-email', {
                    body: formData
                });

                btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                btn.style.background = '#22C55E';
                btn.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.35)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.boxShadow = '';
                    btn.disabled = false;
                    contactForm.reset();
                }, 3000);

            } catch (error) {
                console.error('Error:', error);
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error!';
                btn.style.background = '#EF4444';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // ===== TILT EFFECT ON CARDS =====
    const tiltCards = document.querySelectorAll('.service-card, .pricing-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ===== TYPED TEXT EFFECT =====
    const typedEl = document.querySelector('.typed-text');
    if (typedEl) {
        const words = ['Modern Websites', 'Landing Pages', 'Business Sites', 'Digital Experiences'];
        let wordIdx = 0;
        let charIdx = 0;
        let isDeleting = false;

        function type() {
            const current = words[wordIdx];
            if (isDeleting) {
                typedEl.textContent = current.substring(0, charIdx - 1);
                charIdx--;
            } else {
                typedEl.textContent = current.substring(0, charIdx + 1);
                charIdx++;
            }

            let speed = isDeleting ? 50 : 100;

            if (!isDeleting && charIdx === current.length) {
                speed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                speed = 500;
            }

            setTimeout(type, speed);
        }

        type();
    }
});

// ===== ANIMATION KEYFRAMES =====
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .active-link {
        color: var(--primary) !important;
    }

    .active-link::after {
        width: 100% !important;
    }
`;
document.head.appendChild(styleSheet);
