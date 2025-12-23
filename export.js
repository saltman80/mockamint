// Export page functionality

// Namespace and init function (idempotent)
window.MockaMint = window.MockaMint || {};
window.MockaMint.exportHelpers = window.MockaMint.exportHelpers || {};

window.MockaMint.initexport = (function() {
    let _initialized = false;

    return function initexport(root = document) {
        if (_initialized && root === document) {
            return { startexport };
        }

        // Query contract selectors
        const startEl = root.querySelector('[data-mm-export-start]');
        const optionsEl = root.querySelector('[data-mm-export-options]');
        const downloadListEl = root.querySelector('[data-mm-download-list]');
        const bundleListEl = root.querySelector('[data-mm-bundle-list]');

        // If the required contract elements are not present, no-op (safe on other pages)
        if (!startEl || !optionsEl) {
            _initialized = true;
            function noopStart(opts = {}) {
                console.warn('MockaMint.initexport: export UI not present on this page. start ignored.', opts);
                return Promise.resolve(null);
            }
            return { startexport: noopStart };
        }

        // Scoped element queries
        const fileFormatCheckboxes = optionsEl.querySelectorAll('input[name="fileFormat"]');
        const packagingCheckboxes = optionsEl.querySelectorAll('input[name="packaging"]');
        const platformCards = optionsEl.querySelectorAll('.platform-card');
        let selectedPlatform = 'shopify';

        const destinationSelect = optionsEl.querySelector('#destinationSelect');
        const scheduleToggle = optionsEl.querySelector('#scheduleToggle');
        const scheduleDatetime = optionsEl.querySelector('#scheduleDatetime');
        const dateInput = optionsEl.querySelector('#publishDate');
        const timeInput = optionsEl.querySelector('#publishTime');

        const productCards = optionsEl.querySelectorAll('.product-card');
        const selectedProducts = new Set(['shirt', 'mug', 'cap']); // Default selection

        // Ensure a progress UI exists (create minimal progress elements if absent)
        let progressContainer = optionsEl.querySelector('.export-progress');
        let progressBar;
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'export-progress';
            progressContainer.setAttribute('role', 'status');
            progressContainer.style.minHeight = '6px';
            progressContainer.style.background = 'transparent';
            progressContainer.style.marginTop = '8px';
            progressBar = document.createElement('div');
            progressBar.className = 'export-progress__bar';
            progressBar.setAttribute('role', 'progressbar');
            progressBar.setAttribute('aria-valuemin', '0');
            progressBar.setAttribute('aria-valuemax', '100');
            progressBar.style.height = '6px';
            progressBar.style.background = 'var(--color-accent, #0b84ff)';
            progressBar.style.width = '0%';
            progressBar.style.transition = 'width 150ms linear';
            progressContainer.appendChild(progressBar);
            optionsEl.appendChild(progressContainer);
        } else {
            progressBar = progressContainer.querySelector('[role="progressbar"]') || progressContainer.querySelector('.export-progress__bar');
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.className = 'export-progress__bar';
                progressBar.setAttribute('role', 'progressbar');
                progressBar.setAttribute('aria-valuemin', '0');
                progressBar.setAttribute('aria-valuemax', '100');
                progressBar.style.height = '6px';
                progressBar.style.background = 'var(--color-accent, #0b84ff)';
                progressBar.style.width = '0%';
                progressBar.style.transition = 'width 150ms linear';
                progressContainer.appendChild(progressBar);
            }
        }

        // Event handlers and UI wiring
        fileFormatCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateExportOptions);
        });

        packagingCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateExportOptions);
        });

        platformCards.forEach(card => {
            card.addEventListener('click', function() {
                platformCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                selectedPlatform = this.dataset.platform;
                updateExportSummary();
            });

            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        if (destinationSelect) {
            destinationSelect.addEventListener('change', updateExportSummary);
        }

        if (scheduleToggle) {
            scheduleToggle.addEventListener('change', function() {
                if (scheduleDatetime) {
                    scheduleDatetime.style.display = this.checked ? 'flex' : 'none';
                }
            });
        }

        if (dateInput) {
            dateInput.addEventListener('change', updateExportSummary);
        }

        if (timeInput) {
            timeInput.addEventListener('change', updateExportSummary);
        }

        productCards.forEach(card => {
            card.addEventListener('click', function() {
                const productId = this.dataset.productId;

                if (selectedProducts.has(productId)) {
                    selectedProducts.delete(productId);
                    this.classList.remove('selected');
                } else {
                    selectedProducts.add(productId);
                    this.classList.add('selected');
                }

                updateExportSummary();
            });
        });

        // Wire start button
        function onStartClick(e) {
            e.preventDefault();
            const formats = getSelectedFormats();
            const packaging = getSelectedPackaging();
            const destination = destinationSelect ? destinationSelect.value : '';
            const scheduled = scheduleToggle ? scheduleToggle.checked : false;

            const exportData = {
                products: Array.from(selectedProducts),
                formats: formats,
                packaging: packaging,
                platform: selectedPlatform,
                destination: destination,
                scheduled: scheduled,
                date: dateInput ? dateInput.value : '',
                time: timeInput ? timeInput.value : ''
            };

            // Use the public startexport API so callers can also programmatically start
            startexport(exportData);
        }

        startEl.addEventListener('click', onStartClick);

        // Downloadable assets (scoped)
        const downloadButtons = optionsEl.querySelectorAll('.download-asset-btn');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const assetType = this.dataset.assetType;
                console.log('Downloading:', assetType);
                // Use namespaced helper if present
                if (window.MockaMint.exportHelpers && window.MockaMint.exportHelpers.exportUtils && typeof window.MockaMint.exportHelpers.exportUtils.downloadFile === 'function') {
                    // Example: window.MockaMint.exportHelpers.exportUtils.downloadFile(url, filename)
                }
            });
        });

        // Helper functions (scoped)
        function getSelectedFormats() {
            const selected = [];
            fileFormatCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selected.push(checkbox.value);
                }
            });
            return selected;
        }

        function getSelectedPackaging() {
            const selected = [];
            packagingCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selected.push(checkbox.value);
                }
            });
            return selected;
        }

        function updateExportOptions() {
            // Update UI based on selected options
            console.log('Export options updated');
        }

        function updateExportSummary() {
            const confirmationText = optionsEl.querySelector('#confirmationText') || document.getElementById('confirmationText');
            if (confirmationText) {
                const productNames = Array.from(selectedProducts).map(id => {
                    const card = optionsEl.querySelector(`[data-product-id="${id}"]`) || document.querySelector(`[data-product-id="${id}"]`);
                    return card ? (card.querySelector('.product-name') ? card.querySelector('.product-name').textContent : id) : id;
                }).join(', ');

                const destination = destinationSelect ? destinationSelect.value : selectedPlatform;
                const scheduled = scheduleToggle && scheduleToggle.checked;
                const date = scheduled && dateInput ? dateInput.value : '';

                let summaryText = `Exporting: ${productNames} to ${destination}`;
                if (scheduled && date) {
                    summaryText += ` on ${date}`;
                }

                confirmationText.textContent = summaryText;
            }
        }

        function showExportConfirmation(data) {
            // Show success message or loading state on the start element
            const btn = startEl;
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Exporting...';
                btn.disabled = true;

                // Simulate export process
                setTimeout(() => {
                    btn.textContent = 'Export Complete ?';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }, 2000);
                }, 1500);
            }
        }

        // The startexport function will be exposed publicly as well
        function startexport(options = {}) {
            return new Promise((resolve) => {
                // Dispatch start event
                const startEvent = new CustomEvent('mm:export:start', { detail: options });
                startEl.dispatchEvent(startEvent);

                // Prepare simulation
                let percent = 0;
                const container = optionsEl || startEl.parentElement || root;
                container.classList.remove('is-complete');
                container.classList.add('is-loading');

                progressContainer.setAttribute('aria-busy', 'true');
                progressBar.setAttribute('aria-valuenow', String(percent));
                progressBar.style.width = percent + '%';

                const files = [];
                const products = options.products || Array.from(selectedProducts);
                const formats = options.formats && options.formats.length ? options.formats : getSelectedFormats();

                // Simulate file generation plan
                products.forEach(p => {
                    formats.forEach(f => {
                        files.push({ product: p, format: f, filename: `${p}.${f}` });
                    });
                });

                // Simulate progress ticks
                const interval = setInterval(() => {
                    percent = Math.min(100, percent + Math.ceil(Math.random() * 15));
                    progressBar.style.width = percent + '%';
                    progressBar.setAttribute('aria-valuenow', String(percent));

                    const progressEvent = new CustomEvent('mm:export:progress', { detail: { percent } });
                    startEl.dispatchEvent(progressEvent);

                    if (percent >= 100) {
                        clearInterval(interval);
                        progressContainer.setAttribute('aria-busy', 'false');
                        container.classList.remove('is-loading');
                        container.classList.add('is-complete');

                        // Dispatch complete with generated files and summary
                        const completeDetail = {
                            files: files,
                            summary: {
                                productCount: products.length,
                                fileCount: files.length,
                                formats: formats,
                                options: options
                            }
                        };
                        const completeEvent = new CustomEvent('mm:export:complete', { detail: completeDetail });
                        startEl.dispatchEvent(completeEvent);

                        // Optionally populate download/bundle lists if present
                        if (downloadListEl) {
                            downloadListEl.innerHTML = '';
                            completeDetail.files.forEach(f => {
                                const item = document.createElement('div');
                                item.className = 'download-item';
                                item.textContent = f.filename;
                                downloadListEl.appendChild(item);
                            });
                        }

                        if (bundleListEl) {
                            bundleListEl.innerHTML = '';
                            const bundleItem = document.createElement('div');
                            bundleItem.className = 'bundle-item';
                            bundleItem.textContent = `Bundle (${completeDetail.fileCount} files)`;
                            bundleListEl.appendChild(bundleItem);
                        }

                        resolve(completeDetail);
                    }
                }, 250);
            });
        }

        // Initialize summary UI state
        updateExportSummary();

        _initialized = true;

        // Return public API for this initialized root
        return { startexport };
    };
})();

// Platform integration handlers (namespaced)
window.MockaMint.exportHelpers.platformIntegrations = {
    shopify: {
        authenticate: function() {
            console.log('Authenticating with Shopify');
            // Implement Shopify OAuth flow
        },
        export: function(products) {
            console.log('Exporting to Shopify:', products);
            // Implement Shopify API integration
        }
    },
    etsy: {
        authenticate: function() {
            console.log('Authenticating with Etsy');
            // Implement Etsy OAuth flow
        },
        export: function(products) {
            console.log('Exporting to Etsy:', products);
            // Implement Etsy API integration
        }
    },
    woocommerce: {
        authenticate: function() {
            console.log('Authenticating with WooCommerce');
            // Implement WooCommerce authentication
        },
        export: function(products) {
            console.log('Exporting to WooCommerce:', products);
            // Implement WooCommerce API integration
        }
    }
};

// File format handlers (namespaced)
window.MockaMint.exportHelpers.formatHandlers = {
    png: function(product) {
        console.log('Generating PNG for:', product);
        // Implement PNG export
    },
    jpg: function(product) {
        console.log('Generating JPG for:', product);
        // Implement JPG export
    },
    pdf: function(product) {
        console.log('Generating PDF for:', product);
        // Implement PDF export
    }
};

// Packaging handlers (namespaced)
window.MockaMint.exportHelpers.packagingHandlers = {
    hangTags: function(product) {
        console.log('Generating hang tags for:', product);
        // Implement hang tag generation
    },
    polyBags: function(product) {
        console.log('Generating poly bag labels for:', product);
        // Implement poly bag label generation
    },
    customBox: function(product) {
        console.log('Generating custom box design for:', product);
        // Implement custom box generation
    }
};

// Export utility functions (namespaced)
window.MockaMint.exportHelpers.exportUtils = {
    downloadFile: function(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    generateZip: function(files) {
        console.log('Generating ZIP archive with files:', files);
        // Implement ZIP generation
    },

    scheduleExport: function(datetime, callback) {
        console.log('Scheduling export for:', datetime);
        // Implement scheduled export
    }
};