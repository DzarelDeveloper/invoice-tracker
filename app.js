// Invoice Tracker Application
class InvoiceTracker {
    constructor() {
        this.invoices = this.loadInvoices();
        this.currentDeleteId = null;
        this.lastInvoiceNumber = this.getLastInvoiceNumber();
        this.initializeApp();
        this.setupEventListeners();
        this.initializeNotifications();
        this.checkOverdueInvoices(); // Check setiap hari
        setInterval(() => this.checkOverdueInvoices(), 3600000); // 1 hour
    }

    // Inisialisasi aplikasii
    initializeApp() {
        this.updateDashboard();
        this.renderInvoiceTable();
        this.setDefaultDate();
    }

    // Setup event listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('invoice-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addInvoice();
        });

        // Clear form button
        document.getElementById('clear-form').addEventListener('click', () => {
            this.clearForm();
        });

        // Clear all invoices
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAllInvoices();
        });

        // Status filter
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filterInvoices(e.target.value);
        });
        
        // Modal event listeners
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });
        
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('confirmation-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmation-modal') {
                this.hideModal();
            }
        });
    }

    // Set tanggal default ke hari ini
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoice-date').value = today;
    }

    // Load invoices from localStorage
    loadInvoices() {
        const stored = localStorage.getItem('invoices');
        return stored ? JSON.parse(stored) : [];
    }

    // Save invoices to localStorage
    saveInvoices() {
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
    }

    // Get last invoice number
    getLastInvoiceNumber() {
        const numbers = this.invoices.map(inv => {
            const match = inv.number.match(/INV-(\d+)/);
            return match ? parseInt(match[1]) : 0;
        });
        return Math.max(0, ...numbers);
    }

    // Generate next invoice number
    generateInvoiceNumber() {
        this.lastInvoiceNumber++;
        return `INV-${String(this.lastInvoiceNumber).padStart(3, '0')}`;
    }

    // Generate unique ID for invoice
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Add new invoice
    addInvoice() {
        // Get form values
        const clientName = document.getElementById('client-name').value.trim();
        const amount = parseFloat(document.getElementById('invoice-amount').value);
        const currency = document.getElementById('currency').value;
        const status = document.getElementById('invoice-status').value;
        const date = document.getElementById('invoice-date').value;
        const dueDate = document.getElementById('due-date').value;
        const notes = document.getElementById('notes').value;

        // Validation
        if (!clientName || !amount || !status || !date || !dueDate) {
            this.showToast('Mohon lengkapi semua field yang wajib diisi!', 'error');
            return;
        }

        // Create new invoice object
        const newInvoice = {
            id: this.generateId(),
            number: this.generateInvoiceNumber(),
            client: clientName,
            amount: amount,
            currency: currency,
            status: status,
            date: date,
            dueDate: dueDate,
            notes: notes,
            isPaid: status === 'completed',
            createdAt: new Date().toISOString()
        };

        // Add to invoices array
        this.invoices.unshift(newInvoice);
        this.saveInvoices();

        // Update UI
        this.updateDashboard();
        this.renderInvoiceTable();
        this.updateRemindersList();
        this.clearForm();

        // Show success message
        this.showToast(`Invoice ${newInvoice.number} berhasil ditambahkan! ✅`);
    }

    // Clear form
    clearForm() {
        const form = document.getElementById('invoice-form');
        form.reset();
        this.setDefaultDate();
        
        // Set default due date (7 hari dari sekarang)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];
        
        // Reset status select
        document.getElementById('invoice-status').value = '';
        
        // Reset currency format
        const amountInput = document.getElementById('invoice-amount');
        amountInput.placeholder = '1000000';
    }

    // Delete invoice
    showDeleteModal(id) {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (!invoice) return;
        
        this.currentDeleteId = id;
        
        // Update modal content
        document.getElementById('delete-invoice-details').innerHTML = `
            <p><strong>Nomor:</strong> ${invoice.number}</p>
            <p><strong>Client:</strong> ${invoice.client}</p>
            <p><strong>Jumlah:</strong> ${this.formatCurrency(invoice.amount)}</p>
            <p><strong>Status:</strong> ${this.getStatusText(invoice.status)}</p>
        `;
        
        // Show modal
        document.getElementById('confirmation-modal').classList.add('show');
    }
    
    // Confirm delete
    confirmDelete() {
        if (this.currentDeleteId) {
            this.invoices = this.invoices.filter(invoice => invoice.id !== this.currentDeleteId);
            this.saveInvoices();
            this.updateDashboard();
            this.renderInvoiceTable();
            this.showToast('Invoice berhasil dihapus! 🗑️');
            this.hideModal();
        }
    }
    
    // Hide modal
    hideModal() {
        document.getElementById('confirmation-modal').classList.remove('show');
        this.currentDeleteId = null;
    }
    
    // Get status text
    getStatusText(status) {
        const statusMap = {
            'completed': '✅ Completed',
            'in-progress': '🔄 In Progress',
            'not-paid': '❌ Not Paid'
        };
        return statusMap[status] || status;
    }
    
    // Update invoice status
    updateInvoiceStatus(id, newStatus) {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (invoice) {
            invoice.status = newStatus;
            this.saveInvoices();
            this.updateDashboard();
            this.renderInvoiceTable();
            this.showToast(`Status invoice berhasil diubah ke ${this.getStatusText(newStatus)}! ✅`);
        }
    }

    // Clear all invoices
    clearAllInvoices() {
        if (this.invoices.length === 0) {
            this.showToast('Tidak ada invoice untuk dihapus!', 'error');
            return;
        }

        if (confirm('Apakah Anda yakin ingin menghapus SEMUA invoice? Aksi ini tidak dapat dibatalkan!')) {
            this.invoices = [];
            this.saveInvoices();
            this.updateDashboard();
            this.renderInvoiceTable();
            this.showToast('Semua invoice berhasil dihapus!');
        }
    }

    // Update dashboard statistics
    updateDashboard() {
        const stats = this.calculateStats();
        
        // Update counts
        document.getElementById('completed-count').textContent = stats.completed.count;
        document.getElementById('progress-count').textContent = stats.inProgress.count;
        document.getElementById('unpaid-count').textContent = stats.notPaid.count;
        document.getElementById('total-count').textContent = stats.total.count;

        // Update amounts
        document.getElementById('completed-amount').textContent = this.formatCurrency(stats.completed.amount);
        document.getElementById('progress-amount').textContent = this.formatCurrency(stats.inProgress.amount);
        document.getElementById('unpaid-amount').textContent = this.formatCurrency(stats.notPaid.amount);
        document.getElementById('total-amount').textContent = this.formatCurrency(stats.total.amount);
        
        // Update quick stats
        this.updateQuickStats(stats);
    }
    
    // Update quick statistics
    updateQuickStats(stats) {
        // Average amount
        const averageAmount = stats.total.count > 0 ? stats.total.amount / stats.total.count : 0;
        document.getElementById('average-amount').textContent = 
            `${this.formatCurrency(stats.totalIDR.amount / (stats.totalIDR.count || 1), 'IDR')}
             / ${this.formatCurrency(stats.totalUSD.amount / (stats.totalUSD.count || 1), 'USD')}`;
        
        // Latest invoice
        const latestInvoice = this.invoices.length > 0 ? this.invoices[0].number : '-';
        document.getElementById('latest-invoice').textContent = latestInvoice;
        
        // Pending amount (In Progress + Not Paid)
        const pendingAmount = stats.inProgress.amount + stats.notPaid.amount;
        document.getElementById('pending-amount').textContent = this.formatCurrency(pendingAmount);

        // Due soon count
        document.getElementById('due-soon-count').textContent = stats.dueSoon.count;
    }

    // Calculate statistics
    calculateStats() {
        const stats = {
            completed: { count: 0, amount: 0 },
            inProgress: { count: 0, amount: 0 },
            notPaid: { count: 0, amount: 0 },
            total: { count: 0, amount: 0 },
            dueSoon: { count: 0, amount: 0 },
            totalIDR: { count: 0, amount: 0 },
            totalUSD: { count: 0, amount: 0 }
        };

        const today = new Date();
        this.invoices.forEach(invoice => {
            stats.total.count++;
            stats.total.amount += invoice.amount;

            // Update currency totals
            if (invoice.currency === 'IDR') {
                stats.totalIDR.count++;
                stats.totalIDR.amount += invoice.amount;
            } else {
                stats.totalUSD.count++;
                stats.totalUSD.amount += invoice.amount;
            }

            switch (invoice.status) {
                case 'completed':
                    stats.completed.count++;
                    stats.completed.amount += invoice.amount;
                    break;
                case 'in-progress':
                    stats.inProgress.count++;
                    stats.inProgress.amount += invoice.amount;
                    break;
                case 'not-paid':
                    stats.notPaid.count++;
                    stats.notPaid.amount += invoice.amount;
                    break;
            }

            // Check for due soon invoices
            if (!invoice.isPaid) {
                const dueDate = new Date(invoice.dueDate);
                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntilDue <= 7 && daysUntilDue > 0) {
                    stats.dueSoon.count++;
                    stats.dueSoon.amount += invoice.amount;
                }
            }
        });

        return stats;
    }

    // Format currency
    formatCurrency(amount, currency = 'IDR') {
        const formatOptions = {
            IDR: {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            },
            USD: {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
            }
        };

        return new Intl.NumberFormat('id-ID', formatOptions[currency]).format(amount);
    }

    // Format date
    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }

    // Get status badge HTML
    getStatusBadge(status) {
        const statusConfig = {
            'completed': { 
                class: 'status-completed', 
                icon: '✅', 
                text: 'Completed' 
            },
            'in-progress': { 
                class: 'status-in-progress', 
                icon: '🔄', 
                text: 'In Progress' 
            },
            'not-paid': { 
                class: 'status-not-paid', 
                icon: '❌', 
                text: 'Not Paid' 
            }
        };

        const config = statusConfig[status];
        return `<span class="status-badge ${config.class}">
                    ${config.icon} ${config.text}
                </span>`;
    }

    // Render invoice table
    renderInvoiceTable(filteredInvoices = null) {
        const tbody = document.getElementById('invoice-tbody');
        const invoicesToRender = filteredInvoices || this.invoices;

        if (invoicesToRender.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="6">
                        <div class="empty-message">
                            <span class="empty-icon">📋</span>
                            <p>${filteredInvoices ? 'Tidak ada invoice dengan filter tersebut' : 'Belum ada invoice. Tambahkan invoice pertama Anda!'}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = invoicesToRender.map(invoice => `
            <tr>
                <td><strong>${invoice.number}</strong></td>
                <td>${invoice.client}</td>
                <td>${this.formatDate(invoice.date)}</td>
                <td class="amount-cell">${this.formatCurrency(invoice.amount, invoice.currency)}</td>
                <td>
                    <div class="status-container" id="status-${invoice.id}">
                        ${this.getStatusBadge(invoice.status)}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-status-btn" onclick="invoiceTracker.toggleStatusEdit('${invoice.id}')">
                            ✏️ Edit
                        </button>
                        <button class="delete-btn" onclick="invoiceTracker.showDeleteModal('${invoice.id}')">
                            🗑️ Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Toggle status edit
    toggleStatusEdit(id) {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (!invoice) return;
        
        const statusContainer = document.getElementById(`status-${id}`);
        const isEditing = statusContainer.querySelector('.status-select');
        
        if (isEditing) {
            // Save changes
            const newStatus = isEditing.value;
            if (newStatus !== invoice.status) {
                this.updateInvoiceStatus(id, newStatus);
            } else {
                // Cancel edit
                statusContainer.innerHTML = this.getStatusBadge(invoice.status);
            }
        } else {
            // Start editing
            statusContainer.innerHTML = `
                <select class="status-select" onchange="invoiceTracker.updateInvoiceStatus('${id}', this.value)">
                    <option value="completed" ${invoice.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                    <option value="in-progress" ${invoice.status === 'in-progress' ? 'selected' : ''}>🔄 In Progress</option>
                    <option value="not-paid" ${invoice.status === 'not-paid' ? 'selected' : ''}>❌ Not Paid</option>
                </select>
            `;
        }
    }

    // Filter invoices by status
    filterInvoices(status) {
        if (!status) {
            this.renderInvoiceTable();
            return;
        }

        const filteredInvoices = this.invoices.filter(invoice => invoice.status === status);
        this.renderInvoiceTable(filteredInvoices);
    }

    // Check overdue invoices once per day
    checkOverdueInvoices() {
        const today = new Date();
        const overdueInvoices = this.invoices.filter(invoice => {
            if (invoice.isPaid) return false;
            const dueDate = new Date(invoice.dueDate);
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilDue <= 0;
        });

        const dueSoonInvoices = this.invoices.filter(invoice => {
            if (invoice.isPaid) return false;
            const dueDate = new Date(invoice.dueDate);
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilDue > 0 && daysUntilDue <= 7;
        });

        // Tampilkan notifikasi untuk invoice jatuh tempo
        if (overdueInvoices.length > 0) {
            this.showSystemNotification(
                '⚠️ Invoice Jatuh Tempo!',
                `Terdapat ${overdueInvoices.length} invoice yang sudah jatuh tempo.\nTotal: ${this.formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0))}`,
                'overdue'
            );
        }

        // Tampilkan notifikasi untuk invoice yang akan jatuh tempo
        if (dueSoonInvoices.length > 0) {
            this.showSystemNotification(
                '📅 Invoice Jatuh Tempo Dalam 7 Hari',
                `Terdapat ${dueSoonInvoices.length} invoice yang akan jatuh tempo minggu ini.\nTotal: ${this.formatCurrency(dueSoonInvoices.reduce((sum, inv) => sum + inv.amount, 0))}`,
                'due-soon'
            );
        }

        this.updateRemindersList();
        this.updateDashboard();
    }

    // Add new method for system notifications
    showSystemNotification(title, message, type = 'info') {
        if (!("Notification" in window)) return;

        // Cek izin notifikasi
        if (Notification.permission === "granted") {
            const options = {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>',
                tag: `invoice-${type}`, // Prevent duplicate notifications
                renotify: true, // Allow updating existing notification
                requireInteraction: true, // Notification stays until user interacts
                silent: false // Play sound
            };

            const notification = new Notification(title, options);

            // Tambah event listener untuk notifikasi
            notification.onclick = () => {
                // Focus ke window aplikasi saat notifikasi diklik
                window.focus();
                notification.close();
            };
        }
    }

    // Initialize notifications
    initializeNotifications() {
        // Minta izin notifikasi saat pertama kali
        if ("Notification" in window) {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }

        // Cek invoice jatuh tempo saat tab aktif
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkOverdueInvoices();
            }
        });
    }

    // Send payment reminder (update fungsi ini)
    sendReminder(invoiceId) {  // Ubah parameter menjadi invoiceId
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        try {
            // Tampilkan notifikasi desktop
            this.showDesktopNotification(invoice);
            
            // Tambahkan ke riwayat pengingat
            invoice.reminders = invoice.reminders || [];
            invoice.reminders.push({
                date: new Date().toISOString(),
                type: 'manual'
            });
            
            // Update status pengingat
            invoice.lastReminderDate = new Date().toISOString();
            invoice.reminderSent = true;
            
            // Simpan perubahan
            this.saveInvoices();
            
            // Update UI
            this.updateRemindersList();
            this.showToast(`Pengingat untuk invoice ${invoice.number} berhasil dikirim! 📬`);
            
        } catch (error) {
            console.error('Error sending reminder:', error);
            this.showToast('Gagal mengirim pengingat, silakan coba lagi', 'error');
        }
    }

    // Tambahkan fungsi baru untuk notifikasi desktop
    showDesktopNotification(invoice) {
        if (!("Notification" in window)) {
            this.showToast("Browser tidak mendukung notifikasi desktop", "error");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(`Pengingat Invoice ${invoice.number}`, {
                body: `${invoice.client}\nJumlah: ${this.formatCurrency(invoice.amount, invoice.currency)}\nJatuh Tempo: ${this.formatDate(invoice.dueDate)}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.showDesktopNotification(invoice);
                }
            });
        }
    }

    // Update fungsi updateRemindersList
    updateRemindersList() {
        const remindersGrid = document.getElementById('reminders-grid');
        const today = new Date();
        
        const reminders = this.invoices
            .filter(invoice => !invoice.isPaid)
            .map(invoice => {
                const dueDate = new Date(invoice.dueDate);
                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                return { invoice, daysUntilDue };
            })
            .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

        remindersGrid.innerHTML = reminders.length ? reminders.map(({ invoice, daysUntilDue }) => `
            <div class="reminder-card ${this.getReminderUrgency(daysUntilDue)}">
                <div class="reminder-header">
                    <span class="reminder-title">${invoice.number} - ${invoice.client}</span>
                    <span class="reminder-date">${this.formatDate(invoice.dueDate)}</span>
                </div>
                <div class="reminder-content">
                    <p>${this.formatCurrency(invoice.amount, invoice.currency)}</p>
                    <p class="payment-status ${this.getPaymentStatusClass(daysUntilDue)}">
                        ${this.getPaymentStatusText(daysUntilDue)}
                    </p>
                    ${invoice.lastReminderDate ? 
                        `<p class="reminder-sent">Terakhir diingatkan: ${this.formatDate(invoice.lastReminderDate)}</p>` 
                        : ''}
                </div>
                <div class="reminder-actions">
                    <button class="reminder-btn send-reminder" onclick="invoiceTracker.sendReminder('${invoice.id}')">
                        ${invoice.reminderSent ? '📬 Kirim Ulang' : '📧 Kirim Pengingat'}
                    </button>
                    <button class="reminder-btn mark-paid" onclick="invoiceTracker.markAsPaid('${invoice.id}')">
                        ✅ Tandai Lunas
                    </button>
                </div>
            </div>
        `).join('') : '<p class="empty-message">Tidak ada pengingat pembayaran yang aktif</p>';
    }

    // Get reminder urgency class
    getReminderUrgency(daysUntilDue) {
        if (daysUntilDue <= 0) return 'urgent';
        if (daysUntilDue <= 7) return 'upcoming';
        return 'scheduled';
    }

    // Get payment status class
    getPaymentStatusClass(daysUntilDue) {
        if (daysUntilDue <= 0) return 'payment-overdue';
        if (daysUntilDue <= 7) return 'payment-due-soon';
        return 'payment-upcoming';
    }

    // Get payment status text
    getPaymentStatusText(daysUntilDue) {
        if (daysUntilDue <= 0) return `⚠️ Terlambat ${Math.abs(daysUntilDue)} hari`;
        if (daysUntilDue === 1) return '⏰ Jatuh tempo besok';
        return `🕒 Jatuh tempo dalam ${daysUntilDue} hari`;
    }

    // Mark invoice as paid
    markAsPaid(id) {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (invoice) {
            invoice.isPaid = true;
            invoice.status = 'completed';
            this.saveInvoices();
            this.updateDashboard();
            this.updateRemindersList();
            this.renderInvoiceTable();
            this.showToast(`Invoice ${invoice.number} ditandai sebagai lunas! 💰`);
        }
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceTracker = new InvoiceTracker();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Auto-format currency input
    const amountInput = document.getElementById('invoice-amount');
    amountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value) {
            e.target.value = value;
        }
    });

    // Auto-generate invoice number suggestion
    const invoiceNumberInput = document.getElementById('invoice-number');
    invoiceNumberInput.addEventListener('focus', (e) => {
        if (!e.target.value) {
            const date = new Date();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const random = Math.floor(Math.random() * 100).toString().padStart(3, '0');
            e.target.value = `INV-${year}${month}-${random}`;
            e.target.select();
        }
    });

    // Currency format on input
    const currencySelect = document.getElementById('currency');
    currencySelect.addEventListener('change', () => {
        const currency = currencySelect.value;
        amountInput.placeholder = currency === 'IDR' ? '1000000' : '1000.00';
    });

    // Enhanced form validation
    const form = document.getElementById('invoice-form');
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', (e) => {
            if (e.target.value.trim() === '') {
                e.target.style.borderColor = '#f56565';
            } else {
                e.target.style.borderColor = '#48bb78';
            }
        });

        input.addEventListener('input', (e) => {
            if (e.target.style.borderColor === 'rgb(245, 101, 101)') {
                e.target.style.borderColor = '#e2e8f0';
            }
        });
    });
});