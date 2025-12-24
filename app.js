// app.js - UI interactivity for MockaMint Studio

(function() {
    'use strict';

    // ===========================
    // Active Navigation Highlighting
    // ===========================
    function highlightActiveNav() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
        const navLinks = document.querySelectorAll('[data-nav] [data-page]');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === 'index.html' && linkHref === 'index.html') ||
                (currentPage === '' && linkHref === 'index.html')) {
                link.setAttribute('aria-current', 'page');
                link.classList.add('active');
            } else {
                link.removeAttribute('aria-current');
                link.classList.remove('active');
            }
        });
    }

    // ===========================
    // Tag Chip Selection Toggle
    // ===========================
    function initTagChips() {
        const tagChips = document.querySelectorAll('[data-chip]');
        
        tagChips.forEach(chip => {
            // Set initial aria-pressed state
            const isSelected = chip.classList.contains('is-selected');
            chip.setAttribute('aria-pressed', isSelected);
            
            chip.addEventListener('click', function() {
                this.classList.toggle('is-selected');
                const isSelected = this.classList.contains('is-selected');
                this.setAttribute('aria-pressed', isSelected);
                const id = this.getAttribute('data-chip');
                document.dispatchEvent(new CustomEvent('chip:toggled', { detail: { id, selected: isSelected } }));
            });

            chip.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.classList.toggle('is-selected');
                    const isSelected = this.classList.contains('is-selected');
                    this.setAttribute('aria-pressed', isSelected);
                    const id = this.getAttribute('data-chip');
                    document.dispatchEvent(new CustomEvent('chip:toggled', { detail: { id, selected: isSelected } }));
                }
            });
        });
    }

    // ===========================
    // Color Swatch Selection
    // ===========================
    function initColorSwatches() {
        const swatches = document.querySelectorAll('[data-swatch]');
        
        swatches.forEach(swatch => {
            // Set initial aria-pressed state
            const isSelected = swatch.classList.contains('is-selected');
            swatch.setAttribute('aria-pressed', isSelected);
            
            swatch.addEventListener('click', function() {
                // Remove selected from siblings
                const parent = this.parentElement;
                parent.querySelectorAll('[data-swatch]').forEach(s => {
                    s.classList.remove('is-selected');
                    s.setAttribute('aria-pressed', 'false');
                });
                // Add selected to clicked swatch
                this.classList.add('is-selected');
                this.setAttribute('aria-pressed', 'true');
                const id = this.getAttribute('data-swatch');
                document.dispatchEvent(new CustomEvent('chip:toggled', { detail: { id, selected: true } }));
            });

            swatch.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ===========================
    // Filter Controls Toggle
    // ===========================
    function initFilterControls() {
        const filterButtons = document.querySelectorAll('.filter-btn, .filter-option, .filter-toggle, [data-filter]');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                this.classList.toggle('active');
                this.classList.toggle('is-selected');
            });
        });
    }

    // ===========================
    // Design Variant Thumbnail Selection
    // ===========================
    function initDesignVariants() {
        const thumbnails = document.querySelectorAll('.thumbnail, .variant-thumb, .design-option, [data-variant]');
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                // Single selection within parent group
                const parent = this.closest('.thumbnail-gallery, .variant-grid, .design-grid') || this.parentElement;
                if (parent) {
                    parent.querySelectorAll('.thumbnail, .variant-thumb, .design-option, [data-variant]').forEach(t => {
                        t.classList.remove('is-selected', 'active');
                    });
                }
                this.classList.add('is-selected', 'active');
            });

            thumb.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ===========================
    // Toast Notification System
    // ===========================
    function showToast(message, duration = 2000) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification is-visible';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <div class="toast-content">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
                    <circle cx="10" cy="10" r="9" stroke="#9DD9C8" stroke-width="2"/>
                    <path d="M6 10L9 13L14 7" stroke="#9DD9C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${message}</span>
            </div>
        `;

        const toastContainer = document.querySelector('[data-toast-container]');
        if (!toastContainer) {
            console.warn('Toast container [data-toast-container] not found. Toast not shown.');
            return;
        }
        toastContainer.appendChild(toast);

        // Auto-dismiss
        setTimeout(() => {
            toast.classList.remove('is-visible');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);

        document.dispatchEvent(new CustomEvent('toast:shown', { detail: { message } }));
    }

    // ===========================
    // Modal System
    // ===========================
    function showModal(title, content) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2 id="modal-title" class="modal-title">${title}</h2>
                    <button class="modal-close" aria-label="Close modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Add styles if not already in document
        if (!document.querySelector('#modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(45, 45, 45, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                    animation: modal-fade-in 0.2s ease-out;
                }
                .modal-container {
                    background: #FFFFFF;
                    border-radius: 16px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow: auto;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    animation: modal-scale-in 0.2s ease-out;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 32px;
                    border-bottom: 1px solid #E0E0E0;
                }
                .modal-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #2D2D2D;
                    margin: 0;
                }
                .modal-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: #666666;
                    transition: color 0.2s;
                }
                .modal-close:hover {
                    color: #2D2D2D;
                }
                .modal-body {
                    padding: 32px;
                    color: #666666;
                    line-height: 1.6;
                }
                @keyframes modal-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modal-scale-in {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);

        // Close handlers
        const closeBtn = modal.querySelector('.modal-close');
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    // ===========================
    // Progress Bar Updates
    // ===========================
    function updateProgressBar(percentage) {
        const progressBars = document.querySelectorAll('[data-progress="fake"] [data-progress-bar]');
        const progressTexts = document.querySelectorAll('[data-progress="fake"] .summary-value');
        
        progressBars.forEach(bar => {
            bar.style.width = `${percentage}%`;
            bar.style.transition = 'width 0.5s ease-out';
        });

        progressTexts.forEach(text => {
            if (text.querySelector('[data-progress-bar]')) {
                text.querySelector('[data-progress-bar]').textContent = `${percentage}%`;
            }
        });
    }

    function animateProgress(targetPercentage, duration = 2000) {
        const startTime = Date.now();
        const startPercentage = 0;

        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentPercentage = Math.floor(startPercentage + (targetPercentage - startPercentage) * progress);
            
            updateProgressBar(currentPercentage);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        update();
    }

    // ===========================
    // Common Action Triggers
    // ===========================
    function initActionTriggers() {
        // Add to bundle buttons
        const addToBundleButtons = document.querySelectorAll('[data-action="add-to-bundle"]');
        addToBundleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('? Added to bundle');
            });
        });

        // Export buttons
        const exportButtons = document.querySelectorAll('[data-action="export"], .btn-export');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('? Export started...');
                animateProgress(100, 3000);
            });
        });

        // Download buttons
        const downloadButtons = document.querySelectorAll('[data-action="download"], .btn-download');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('?? Download started');
            });
        });

        // Save buttons
        const saveButtons = document.querySelectorAll('[data-action="save"], .btn-save');
        saveButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('? Changes saved');
            });
        });

        // Generate buttons
        const generateButtons = document.querySelectorAll('[data-action="generate"], .btn-generate');
        generateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('? Generating mockups...');
                animateProgress(100, 5000);
            });
        });
    }

    // ===========================
    // Product Carousel Navigation
    // ===========================
    function initProductCarousel() {
        const carousels = document.querySelectorAll('.products-carousel, .carousel-container');
        
        carousels.forEach(carousel => {
            const prevBtn = carousel.querySelector('.carousel-nav-prev, .carousel-prev, .btn-prev');
            const nextBtn = carousel.querySelector('.carousel-nav-next, .carousel-next, .btn-next');
            const track = carousel.querySelector('.carousel-track, .product-list');
            const dots = carousel.querySelectorAll('.carousel-dot');
            
            if (!track) return;

            let currentIndex = 0;
            const items = track.children;
            const totalItems = items.length;

            function updateCarousel() {
                const itemWidth = items[0]?.offsetWidth || 0;
                const gap = 20;
                track.style.transform = `translateX(-${currentIndex * (itemWidth + gap)}px)`;
                
                // Update dots
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentIndex);
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentIndex = Math.max(0, currentIndex - 1);
                    updateCarousel();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentIndex = Math.min(totalItems - 1, currentIndex + 1);
                    updateCarousel();
                });
            }

            dots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                });
            });
        });
    }

    // ===========================
    // Initialization
    // ===========================
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        highlightActiveNav();
        document.dispatchEvent(new CustomEvent('nav:updated'));
        initTagChips();
        initColorSwatches();
        initFilterControls();
        initDesignVariants();
        initActionTriggers();
        initProductCarousel();

        // Expose utility functions globally for inline usage
        window.MockaMint = {
            showToast,
            showModal,
            updateProgressBar,
            animateProgress
        };
    }

    // Start initialization
    init();

})();