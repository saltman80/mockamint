```javascript
/**
 * app.js - MockaMint Studio Core UI Controller
 * 
 * Responsibilities:
 * - Highlight active nav links based on current pathname
 * - Toggle selected states for tag chips, filter buttons, and variant swatches
 * - Track bundle items in-memory and update bundle summary UI
 * - Implement fake generation flow with animated progress
 * - Implement fake export flow with toast/modal and progress animation
 * - Provide lightweight DOM utilities and UI polish
 * 
 * No network requests or localStorage persistence.
 */

(function() {
    'use strict';

    // ============================================
    // State Management
    // ============================================
    const state = {
        bundleItems: [],
        generationQueue: [],
        activeFilters: new Set(),
        activeTags: new Set(),
        selectedVariants: new Map()
    };

    // ============================================
    // Active Navigation Highlighting
    // ============================================
    function initNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a, nav a[href]');
        
        navLinks.forEach(link => {
            link.classList.remove('is-active', 'active');
            
            try {
                const linkPath = new URL(link.href, window.location.origin).pathname;
                const linkPage = linkPath.split('/').pop() || 'index.html';
                const currentPage = currentPath.split('/').pop() || 'index.html';
                
                if (linkPage === currentPage || 
                    (currentPage.includes(linkPage.replace('.html', '')) && linkPage !== 'index.html')) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                }
            } catch (e) {
                console.warn('Invalid link href:', link.href);
            }
        });

        // Click handler for persistent highlighting
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                navLinks.forEach(l => {
                    l.classList.remove('is-active');
                    l.removeAttribute('aria-current');
                });
                this.classList.add('is-active');
                this.setAttribute('aria-current', 'page');
            });
        });
    }

    // ============================================
    // Tag Chip Selection
    // ============================================
    function initTagChips() {
        const tagButtons = document.querySelectorAll('.tag-btn, [data-tag], .tag-chip');
        
        tagButtons.forEach(button => {
            button.addEventListener('click', function() {
                const isSelected = this.classList.contains('is-selected') || 
                                 this.classList.contains('selected');
                
                if (isSelected) {
                    this.classList.remove('is-selected', 'selected');
                    this.setAttribute('aria-pressed', 'false');
                    const tag = this.getAttribute('data-tag') || this.textContent.trim().toLowerCase();
                    state.activeTags.delete(tag);
                } else {
                    this.classList.add('is-selected', 'selected');
                    this.setAttribute('aria-pressed', 'true');
                    const tag = this.getAttribute('data-tag') || this.textContent.trim().toLowerCase();
                    state.activeTags.add(tag);
                }
                
                dispatchStateChange('tags', Array.from(state.activeTags));
            });

            // Initialize aria-pressed
            if (!button.hasAttribute('aria-pressed')) {
                const isSelected = button.classList.contains('is-selected') || 
                                 button.classList.contains('selected');
                button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            }
        });
    }

    // ============================================
    // Filter Button Selection
    // ============================================
    function initFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn, [data-filter], .filter-chip');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter') || this.textContent.trim().toLowerCase();
                const isSelected = this.classList.contains('is-selected');
                
                if (isSelected) {
                    this.classList.remove('is-selected');
                    this.setAttribute('aria-pressed', 'false');
                    state.activeFilters.delete(filter);
                } else {
                    this.classList.add('is-selected');
                    this.setAttribute('aria-pressed', 'true');
                    state.activeFilters.add(filter);
                }
                
                dispatchStateChange('filters', Array.from(state.activeFilters));
            });

            if (!button.hasAttribute('aria-pressed')) {
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // ============================================
    // Variant Swatch Selection
    // ============================================
    function initVariantSwatches() {
        const swatchGroups = document.querySelectorAll('[data-variant-group]');
        
        swatchGroups.forEach(group => {
            const groupName = group.getAttribute('data-variant-group');
            const swatches = group.querySelectorAll('.variant-swatch, [data-variant]');
            
            swatches.forEach(swatch => {
                swatch.addEventListener('click', function() {
                    // Deselect all in group
                    swatches.forEach(s => {
                        s.classList.remove('is-selected');
                        s.setAttribute('aria-selected', 'false');
                    });
                    
                    // Select this one
                    this.classList.add('is-selected');
                    this.setAttribute('aria-selected', 'true');
                    
                    const variantValue = this.getAttribute('data-variant') || 
                                       this.getAttribute('title') ||
                                       this.textContent.trim();
                    
                    state.selectedVariants.set(groupName, variantValue);
                    dispatchStateChange('variants', Object.fromEntries(state.selectedVariants));
                });

                if (!swatch.hasAttribute('aria-selected')) {
                    swatch.setAttribute('aria-selected', 'false');
                }
            });
        });
    }

    // ============================================
    // Bundle Management
    // ============================================
    function initBundleTracking() {
        const addButtons = document.querySelectorAll('[data-bundle-add]');
        const removeButtons = document.querySelectorAll('[data-bundle-remove]');
        
        addButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id') || 
                                this.getAttribute('data-bundle-add');
                const productName = this.getAttribute('data-product-name') || 'Product';
                const productPrice = parseFloat(this.getAttribute('data-product-price') || '0');
                
                addToBundle({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    quantity: 1
                });
            });
        });
        
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id') || 
                                this.getAttribute('data-bundle-remove');
                removeFromBundle(productId);
            });
        });
    }

    function addToBundle(product) {
        const existing = state.bundleItems.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            state.bundleItems.push({...product});
        }
        
        updateBundleSummary();
        showToast(`Added ${product.name} to bundle`, 'success');
        dispatchStateChange('bundle', state.bundleItems);
    }

    function removeFromBundle(productId) {
        const index = state.bundleItems.findIndex(item => item.id === productId);
        
        if (index !== -1) {
            const removed = state.bundleItems.splice(index, 1)[0];
            updateBundleSummary();
            showToast(`Removed ${removed.name} from bundle`, 'info');
            dispatchStateChange('bundle', state.bundleItems);
        }
    }

    function updateBundleSummary() {
        const summaryElements = document.querySelectorAll('[data-bundle-summary]');
        const countElements = document.querySelectorAll('[data-bundle-count]');
        const totalElements = document.querySelectorAll('[data-bundle-total]');
        
        const itemCount = state.bundleItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = state.bundleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        countElements.forEach(el => {
            el.textContent = itemCount;
        });
        
        totalElements.forEach(el => {
            el.textContent = `$${totalPrice.toFixed(2)}`;
        });
        
        summaryElements.forEach(el => {
            el.innerHTML = `
                <div class="bundle-summary-content">
                    <div class="bundle-summary-row">
                        <span class="summary-label">Items:</span>
                        <span class="summary-value">${itemCount}</span>
                    </div>
                    <div class="bundle-summary-row">
                        <span class="summary-label">Total:</span>
                        <span class="summary-value">$${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            `;
        });
    }

    // ============================================
    // Generation Flow (Fake/UI-Only)
    // ============================================
    function initGenerationFlow() {
        const generateButtons = document.querySelectorAll('[data-generate], .btn-generate');
        
        generateButtons.forEach(button => {
            button.addEventListener('click', function() {
                const prompt = document.querySelector('#theme-input, [data-prompt-input]')?.value || 'Untitled Design';
                startGeneration(prompt);
            });
        });
    }

    function startGeneration(prompt) {
        const generationId = 'gen_' + Date.now();
        const generation = {
            id: generationId,
            prompt: prompt,
            status: 'processing',
            progress: 0,
            startTime: Date.now()
        };
        
        state.generationQueue.push(generation);
        
        // Create status card
        createGenerationStatusCard(generation);
        
        // Start progress animation
        animateGenerationProgress(generation);
        
        // Add timeline entry
        addTimelineEntry({
            type: 'generation_started',
            title: 'Generation Started',
            description: `"${prompt}"`,
            timestamp: new Date()
        });
        
        showToast('Generation started', 'success');
    }

    function createGenerationStatusCard(generation) {
        const container = document.querySelector('[data-generation-status-container]');
        if (!container) return;
        
        const card = document.createElement('div');
        card.className = 'generation-status-card';
        card.setAttribute('data-generation-id', generation.id);
        card.innerHTML = `
            <div class="generation-status-header">
                <h3 class="generation-status-title">${escapeHtml(generation.prompt)}</h3>
                <span class="generation-status-badge">Processing</span>
            </div>
            <div class="generation-progress-bar">
                <div class="generation-progress-fill" style="width: 0%"></div>
            </div>
            <div class="generation-status-footer">
                <span class="generation-status-time">Starting...</span>
                <span class="generation-status-percentage">0%</span>
            </div>
        `;
        
        container.appendChild(card);
    }

    function animateGenerationProgress(generation) {
        const card = document.querySelector(`[data-generation-id="${generation.id}"]`);
        if (!card) return;
        
        const progressFill = card.querySelector('.generation-progress-fill');
        const percentageText = card.querySelector('.generation-status-percentage');
        const timeText = card.querySelector('.generation-status-time');
        const badge = card.querySelector('.generation-status-badge');
        
        const duration = 8000; // 8 seconds
        const startTime = Date.now();
        
        function updateProgress() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            
            generation.progress = progress;
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (percentageText) percentageText.textContent = `${Math.round(progress)}%`;
            if (timeText) {
                const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
                timeText.textContent = remaining > 0 ? `${remaining}s remaining` : 'Complete';
            }
            
            if (progress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                generation.status = 'complete';
                if (badge) {
                    badge.textContent = 'Complete';
                    badge.style.backgroundColor = 'var(--color-mint)';
                }
                
                addTimelineEntry({
                    type: 'generation_complete',
                    title: 'Generation Complete',
                    description: `"${generation.prompt}"`,
                    timestamp: new Date()
                });
                
                showToast('Generation complete!', 'success');
            }
        }
        
        requestAnimationFrame(updateProgress);
    }

    // ============================================
    // Export Flow (Fake/UI-Only)
    // ============================================
    function initExportFlow() {
        const exportButtons = document.querySelectorAll('[data-export], .btn-export');
        
        exportButtons.forEach(button => {
            button.addEventListener('click', function() {
                const format = this.getAttribute('data-format') || 'zip';
                startExport(format);
            });
        });
    }

    function startExport(format) {
        showToast('Export started...', 'info');
        
        // Show modal with progress
        const modal = createExportModal(format);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('is-visible');
        }, 10);
        
        // Animate progress
        animateExportProgress(modal, format);
        
        addTimelineEntry({
            type: 'export_started',
            title: 'Export Started',
            description: `Format: ${format.toUpperCase()}`,
            timestamp: new Date()
        });
    }

    function createExportModal(format) {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'export-modal-title');
        modal.innerHTML = `
            <div class="export-modal-overlay"></div>
            <div class="export-modal-content">
                <h2 id="export-modal-title" class="export-modal-title">Exporting Bundle</h2>
                <p class="export-modal-description">Preparing your ${format.toUpperCase()} bundle...</p>
                <div class="export-progress-bar">
                    <div class="export-progress-fill"></div>
                </div>
                <div class="export-modal-footer">
                    <span class="export-progress-text">0%</span>
                </div>
            </div>
        `;
        
        // Close on overlay click
        const overlay = modal.querySelector('.export-modal-overlay');
        overlay.addEventListener('click', () => {
            closeExportModal(modal);
        });
        
        return modal;
    }

    function animateExportProgress(modal, format) {
        const progressFill = modal.querySelector('.export-progress-fill');
        const progressText = modal.querySelector('.export-progress-text');
        const description = modal.querySelector('.export-modal-description');
        
        const duration = 5000; // 5 seconds
        const startTime = Date.now();
        
        function updateProgress() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${Math.round(progress)}%`;
            
            if (progress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                // Show download ready state
                if (description) description.textContent = 'Export complete!';
                
                const footer = modal.querySelector('.export-modal-footer');
                if (footer) {
                    footer.innerHTML = `
                        <button class="btn-download" onclick="window.MockaMintStudio.downloadExport('${format}')">
                            Download ${format.toUpperCase()}
                        </button>
                        <button class="btn-close-modal" onclick="this.closest('.export-modal').remove()">
                            Close
                        </button>
                    `;
                }
                
                addTimelineEntry({
                    type: 'export_complete',
                    title: 'Export Complete',
                    description: `${format.toUpperCase()} bundle ready`,
                    timestamp: new Date()
                });
                
                showToast('Export complete! Ready to download.', 'success');
            }
        }
        
        requestAnimationFrame(updateProgress);
    }

    function closeExportModal(modal) {
        modal.classList.remove('is-visible');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // ============================================
    // Timeline Entries
    // ============================================
    function addTimelineEntry(entry) {
        const timeline = document.querySelector('[data-timeline], .timeline-list');
        if (!timeline) return;
        
        const entryEl = document.createElement('div');
        entryEl.className = 'timeline-entry';
        entryEl.setAttribute('data-entry-type', entry.type);
        
        const timeStr = entry.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        entryEl.innerHTML = `
            <div class="timeline-entry-icon">
                ${getTimelineIcon(entry.type)}
            </div>
            <div class="timeline-entry-content">
                <div class="timeline-entry-header">
                    <h4 class="timeline-entry-title">${escapeHtml(entry.title)}</h4>
                    <span class="timeline-entry-time">${timeStr}</span>
                </div>
                <p class="timeline-entry-description">${escapeHtml(entry.description)}</p>
            </div>
        `;
        
        // Prepend to timeline
        if (timeline.firstChild) {
            timeline.insertBefore(entryEl, timeline.firstChild);
        } else {
            timeline.appendChild(entryEl);
        }
        
        // Animate in
        setTimeout(() => {
            entryEl.classList.add('is-visible');
        }, 10);
    }

    function getTimelineIcon(type) {
        const icons = {
            generation_started: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            generation_complete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            export_started: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
            export_complete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>'
        };
        return icons[type] || icons.generation_started;
    }

    // ============================================
    // Toast Notifications
    // ============================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${escapeHtml(message)}</span>
                <button class="toast-close" aria-label="Close notification">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show
        setTimeout(() => {
            toast.classList.add('is-visible');
        }, 10);
        
        // Auto-hide after 4 seconds
        const autoHideTimeout = setTimeout(() => {
            hideToast(toast);
        }, 4000);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoHideTimeout);
            hideToast(toast);
        });
    }

    function hideToast(toast) {
        toast.classList.remove('is-visible');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    // ============================================
    // Utility Functions
    // ============================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function dispatchStateChange(key, value) {
        window.dispatchEvent(new CustomEvent('mockamint:statechange', {
            detail: { key, value }
        }));
    }

    function downloadExport(format) {
        console.log(`Downloading ${format} bundle...`);
        showToast(`${format.toUpperCase()} download started`, 'success');
        
        // Simulate download
        const link = document.createElement('a');
        link.href = '#';
        link.download = `bundle-${Date.now()}.${format}`;
        link.click();
    }

    // ============================================
    // Initialization
    // ============================================
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        initNavigation();
        initTagChips();
        initFilterButtons();
        initVariantSwatches();
        initBundleTracking();
        initGenerationFlow();
        initExportFlow();
        
        console.log('MockaMint Studio initialized');
    }

    // ============================================
    // Public API
    // ============================================
    window.MockaMintStudio = {
        state,
        addToBundle,
        removeFromBundle,
        startGeneration,
        startExport,
        downloadExport,
        showToast,
        addTimelineEntry
    };

    // Auto-init
    init();

})();
```