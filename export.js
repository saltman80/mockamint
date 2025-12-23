// Export page functionality

document.addEventListener('DOMContentLoaded', function() {
    // File format checkboxes
    const fileFormatCheckboxes = document.querySelectorAll('input[name="fileFormat"]');
    const packagingCheckboxes = document.querySelectorAll('input[name="packaging"]');
    
    fileFormatCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateExportOptions);
    });
    
    packagingCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateExportOptions);
    });
    
    // Platform selection
    const platformCards = document.querySelectorAll('.platform-card');
    let selectedPlatform = 'shopify';
    
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
    
    // Publish destination dropdown
    const destinationSelect = document.getElementById('destinationSelect');
    if (destinationSelect) {
        destinationSelect.addEventListener('change', updateExportSummary);
    }
    
    // Schedule publish toggle
    const scheduleToggle = document.getElementById('scheduleToggle');
    const scheduleDatetime = document.getElementById('scheduleDatetime');
    
    if (scheduleToggle) {
        scheduleToggle.addEventListener('change', function() {
            if (scheduleDatetime) {
                scheduleDatetime.style.display = this.checked ? 'flex' : 'none';
            }
        });
    }
    
    // Date and time inputs
    const dateInput = document.getElementById('publishDate');
    const timeInput = document.getElementById('publishTime');
    
    if (dateInput) {
        dateInput.addEventListener('change', updateExportSummary);
    }
    
    if (timeInput) {
        timeInput.addEventListener('change', updateExportSummary);
    }
    
    // Product selection
    const productCards = document.querySelectorAll('.product-card');
    const selectedProducts = new Set(['shirt', 'mug', 'cap']); // Default selection
    
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
    
    // Export bundle button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
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
            
            console.log('Exporting bundle:', exportData);
            
            // Show confirmation
            showExportConfirmation(exportData);
        });
    }
    
    // Downloadable assets
    const downloadButtons = document.querySelectorAll('.download-asset-btn');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const assetType = this.dataset.assetType;
            console.log('Downloading:', assetType);
            // Implement download logic
        });
    });
    
    // Helper functions
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
        const confirmationText = document.getElementById('confirmationText');
        if (confirmationText) {
            const productNames = Array.from(selectedProducts).map(id => {
                const card = document.querySelector(`[data-product-id="${id}"]`);
                return card ? card.querySelector('.product-name').textContent : id;
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
        // Show success message or loading state
        const btn = document.getElementById('exportBtn');
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
    
    // Initialize
    updateExportSummary();
});

// Platform integration handlers
const platformIntegrations = {
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

// File format handlers
const formatHandlers = {
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

// Packaging handlers
const packagingHandlers = {
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

// Export utility functions
window.exportUtils = {
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
