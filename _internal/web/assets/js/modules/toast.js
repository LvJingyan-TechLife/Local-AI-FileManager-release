(function() {
    'use strict';

    class ToastManager {
        constructor() {
            this.container = document.getElementById('toastContainer');
        }

        show(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };

            toast.innerHTML = `
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
            `;

            this.container.appendChild(toast);

            // 添加点击关闭功能
            toast.addEventListener('click', () => {
                toast.style.animation = 'slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                setTimeout(() => toast.remove(), 300);
            });

            setTimeout(() => {
                // 检查元素是否还存在
                if (toast.parentNode) {
                    toast.style.animation = 'slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }

        success(message) {
            this.show(message, 'success');
        }

        error(message) {
            this.show(message, 'error');
        }

        warning(message) {
            this.show(message, 'warning');
        }

        info(message) {
            this.show(message, 'info');
        }
    }

    if (typeof window !== 'undefined') {
        window.ToastManager = ToastManager;
    }
})();