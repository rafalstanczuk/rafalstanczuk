'use strict';

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Navbar scroll shadow
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile navigation
const navToggle = document.querySelector('.nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');
const navOverlay = document.querySelector('.nav-overlay');

if (navToggle && navLinksContainer) {
    const closeMenu = () => {
        navLinksContainer.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        navToggle.focus({ preventScroll: true });
    };

    const openMenu = () => {
        navLinksContainer.classList.add('open');
        navToggle.classList.add('open');
        navToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
        const firstLink = navLinksContainer.querySelector('a');
        if (firstLink) firstLink.focus({ preventScroll: true });
    };

    navToggle.addEventListener('click', () => {
        navLinksContainer.classList.contains('open') ? closeMenu() : openMenu();
    });

    navLinksContainer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinksContainer.classList.contains('open')) closeMenu();
        });
    });

    document.addEventListener('click', (e) => {
        if (!navLinksContainer.contains(e.target) && !navToggle.contains(e.target) && navLinksContainer.classList.contains('open')) {
            closeMenu();
        }
    });

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinksContainer.classList.contains('open')) {
            closeMenu();
        }
        if (e.key === 'Tab' && navLinksContainer.classList.contains('open')) {
            const focusable = navLinksContainer.querySelectorAll('a');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinksContainer.classList.contains('open')) {
            closeMenu();
        }
    });
}

// Fade-in animation on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    loadRecommendations();
});

// Recommendations — dynamic loading with groups + lightbox
function loadRecommendations() {
    const container = document.getElementById('recommendations-grid');
    if (!container) return;

    fetch('recommendations/index.txt')
        .then(r => r.text())
        .then(text => {
            const lines = text.trim().split('\n');
            const allFiles = [];
            let currentGroup = null;
            let currentGrid = null;

            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (trimmed.startsWith('## ')) {
                    // Group heading
                    currentGroup = trimmed.slice(3);
                    const heading = document.createElement('h3');
                    heading.className = 'rec-group-title fade-in-up';
                    heading.textContent = currentGroup;
                    container.appendChild(heading);
                    observer.observe(heading);

                    currentGrid = document.createElement('div');
                    currentGrid.className = 'rec-group-grid';
                    container.appendChild(currentGrid);
                } else {
                    // Image file
                    const fileIndex = allFiles.length;
                    allFiles.push(trimmed);

                    const card = document.createElement('div');
                    card.className = 'rec-card fade-in-up';
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', '0');
                    card.setAttribute('aria-label', `${currentGroup || 'Recommendation'} — ${fileIndex + 1}`);

                    const img = document.createElement('img');
                    img.src = `recommendations/${trimmed}`;
                    img.alt = `LinkedIn recommendation from ${currentGroup || 'colleague'}`;
                    img.loading = 'lazy';

                    card.appendChild(img);
                    card.addEventListener('click', () => openRecLightbox(fileIndex));
                    card.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRecLightbox(fileIndex);
                        }
                    });

                    (currentGrid || container).appendChild(card);
                    observer.observe(card);
                }
            });

            if (allFiles.length > 0) initRecLightbox(allFiles);
        })
        .catch(() => {});
}

function initRecLightbox(files) {
    const lightbox = document.getElementById('rec-lightbox');
    const img = document.getElementById('rec-lightbox-img');
    const prevBtn = document.getElementById('rec-prev');
    const nextBtn = document.getElementById('rec-next');
    const closeBtn = document.getElementById('rec-close');
    const backdrop = lightbox.querySelector('.rec-lightbox-backdrop');
    let current = 0;

    function show(index) {
        current = index;
        img.src = `recommendations/${files[current].trim()}`;
        prevBtn.style.visibility = current > 0 ? 'visible' : 'hidden';
        nextBtn.style.visibility = current < files.length - 1 ? 'visible' : 'hidden';
    }

    function close() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.openRecLightbox = function(index) {
        show(index);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    prevBtn.addEventListener('click', () => { if (current > 0) show(current - 1); });
    nextBtn.addEventListener('click', () => { if (current < files.length - 1) show(current + 1); });
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft' && current > 0) show(current - 1);
        if (e.key === 'ArrowRight' && current < files.length - 1) show(current + 1);
    });
}
