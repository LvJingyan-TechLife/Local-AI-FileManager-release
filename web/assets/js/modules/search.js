(function() {
    'use strict';

    class SearchManager {
        constructor(api, toast, categoryManager) {
            console.log('[SEARCH] 初始化搜索管理器');
            this.api = api;
            this.toast = toast;
            this.categoryManager = categoryManager;
            this.currentResults = [];
            this.isSearching = false;
            this.searchMode = 'semantic';
            this.currentPage = 1;
            this.pageSize = 10;
            this.totalPages = 1;
        }

        async init() {
            console.log('[SEARCH] 初始化搜索功能');
            this.loadCategories();
            this.bindEvents();
        }

        loadCategories() {
            const categorySelect = document.getElementById('categoryFilter');
            if (!categorySelect) return;

            const categories = this.categoryManager.getAllCategories();
            categorySelect.innerHTML = '<option value="">全部分类</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }

        bindEvents() {
            const closeDetailBtn = document.getElementById('closeDetail');

            if (closeDetailBtn) {
                closeDetailBtn.addEventListener('click', () => this.closeDetail());
            }
        }

        async handleSearch() {
            const searchInput = document.getElementById('searchInput');
            const categoryFilter = document.getElementById('categoryFilter');
            const searchMode = document.getElementById('searchMode');
            const searchResults = document.getElementById('searchResults');

            const query = searchInput.value.trim();
            const category = categoryFilter.value;
            const mode = searchMode.value;

            if (!query) {
                this.toast.show('请输入搜索关键词', 'warning');
                return;
            }

            if (this.isSearching) {
                return;
            }

            this.isSearching = true;
            this.showLoading();

            try {
                const startTime = Date.now();
                
                const response = await this.api.ragRetrieve(query, {
                    k: 10000,
                    content_type: 'all',
                    search_mode: mode
                });
                
                const endTime = Date.now();
                const searchTime = ((endTime - startTime) / 1000).toFixed(2);

                console.log('[SEARCH] 搜索结果:', response);

                const results = response?.results || [];
                
                if (results.length > 0) {
                    this.currentResults = results;
                    this.displayResults(results, searchTime, results.length, mode);
                    this.toast.show(`找到 ${results.length} 条结果`, 'success');
                } else {
                    this.showError('未找到相关结果');
                }
            } catch (error) {
                console.error('[SEARCH] 搜索失败:', error);
                this.showError('搜索失败: ' + error.message);
            } finally {
                this.isSearching = false;
            }
        }

        showLoading() {
            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">正在搜索...</div>
                </div>
            `;
        }

        showError(message) {
            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                    <p>${message}</p>
                </div>
            `;
        }

        displayResults(results, searchTime, totalResults, searchMode) {
            const searchResults = document.getElementById('searchResults');

            if (!results || results.length === 0) {
                searchResults.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        <p>未找到相关结果</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">尝试使用其他关键词</p>
                    </div>
                `;
                return;
            }

            this.currentResults = results;
            this.totalPages = Math.ceil(results.length / this.pageSize);
            this.currentPage = 1;

            this.renderResults(searchTime, totalResults, searchMode);
        }

        renderResults(searchTime, totalResults, searchMode) {
            const searchResults = document.getElementById('searchResults');
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            const pageResults = this.currentResults.slice(startIndex, endIndex);

            this.searchTime = searchTime;
            this.totalResults = totalResults;
            this.searchMode = searchMode;

            let html = '';

            pageResults.forEach((result, index) => {
                const globalIndex = startIndex + index;
                const score = result.score || 0;
                const scorePercent = ((1 - score) * 100).toFixed(1);
                const scoreClass = score <= 0.3 ? 'score-high' : score <= 0.6 ? 'score-medium' : 'score-low';

                html += `
                    <div class="search-result-item" data-index="${globalIndex}">
                        <div class="result-header">
                            <div>
                                <div class="result-title">${this.escapeHtml(result.metadata?.title || '未知标题')}</div>
                                <div class="result-filename">${this.escapeHtml(result.metadata?.filename || '未知文件')}</div>
                            </div>
                            <div class="result-score">
                                <span class="score-badge ${scoreClass}">${scorePercent}%</span>
                            </div>
                        </div>
                        <div class="result-content collapsed">
                            ${this.escapeHtml(result.content)}
                        </div>
                        <div class="result-meta">
                            <div class="result-meta-item" data-icon="📄">文档ID: ${result.metadata?.document_id || 'N/A'}</div>
                            <div class="result-meta-item" data-icon="📍">分块: ${result.metadata?.chunk_index || 'N/A'}</div>
                            <button class="toggle-btn" data-expanded="false">
                                <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                                <span class="toggle-text">展开</span>
                            </button>
                        </div>
                    </div>
                `;
            });

            searchResults.innerHTML = html;

            const searchPagination = document.getElementById('searchPagination');
            if (searchPagination) {
                searchPagination.innerHTML = this.renderPagination();
            }

            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                const toggleBtn = item.querySelector('.toggle-btn');
                const contentDiv = item.querySelector('.result-content');
                
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = toggleBtn.dataset.expanded === 'true';
                    
                    if (isExpanded) {
                        contentDiv.classList.add('collapsed');
                        contentDiv.style.maxHeight = '80px';
                        toggleBtn.dataset.expanded = 'false';
                        toggleBtn.querySelector('.toggle-text').textContent = '展开';
                        toggleBtn.querySelector('.toggle-icon').innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
                    } else {
                        contentDiv.classList.remove('collapsed');
                        contentDiv.style.maxHeight = 'none';
                        toggleBtn.dataset.expanded = 'true';
                        toggleBtn.querySelector('.toggle-text').textContent = '折叠';
                        toggleBtn.querySelector('.toggle-icon').innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
                    }
                });
            });

            this.bindPaginationEvents();
        }

        renderPagination() {
            const startItem = (this.currentPage - 1) * this.pageSize + 1;
            const endItem = Math.min(this.currentPage * this.pageSize, this.currentResults.length);
            const modeText = this.searchMode === 'exact' ? '精确搜索' : '语义搜索';

            let html = `
                <div class="pagination-container">
                    <div class="pagination-info">
                        <div class="pagination-stats">
                            <span class="search-stats-count">找到 ${this.totalResults} 条结果 (${modeText})</span>
                            <span class="search-stats-time">耗时 ${this.searchTime} 秒</span>
                        </div>
                        <div class="pagination-range">显示 ${startItem}-${endItem} 条，共 ${this.currentResults.length} 条</div>
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" data-action="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            上一页
                        </button>
                        <div class="pagination-pages">
                            <input type="number" class="pagination-input" value="${this.currentPage}" min="1" max="${this.totalPages}">
                            <span class="pagination-total">/ ${this.totalPages}</span>
                        </div>
                        <button class="pagination-btn" data-action="next" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                            下一页
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                    <div class="pagination-size">
                        <select class="pagination-select" id="pageSizeSelect">
                            <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10条/页</option>
                            <option value="20" ${this.pageSize === 20 ? 'selected' : ''}>20条/页</option>
                            <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50条/页</option>
                            <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100条/页</option>
                        </select>
                    </div>
                </div>
            `;

            return html;
        }

        bindPaginationEvents() {
            const prevBtn = document.querySelector('.pagination-btn[data-action="prev"]');
            const nextBtn = document.querySelector('.pagination-btn[data-action="next"]');
            const pageInput = document.querySelector('.pagination-input');
            const pageSizeSelect = document.getElementById('pageSizeSelect');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.refreshResults();
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.refreshResults();
                    }
                });
            }

            if (pageInput) {
                pageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        let page = parseInt(pageInput.value);
                        if (page < 1) page = 1;
                        if (page > this.totalPages) page = this.totalPages;
                        this.currentPage = page;
                        this.refreshResults();
                    }
                });

                pageInput.addEventListener('change', () => {
                    let page = parseInt(pageInput.value);
                    if (page < 1) page = 1;
                    if (page > this.totalPages) page = this.totalPages;
                    this.currentPage = page;
                    this.refreshResults();
                });
            }

            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => {
                    this.pageSize = parseInt(e.target.value);
                    this.totalPages = Math.ceil(this.currentResults.length / this.pageSize);
                    this.currentPage = 1;
                    this.refreshResults();
                });
            }
        }

        refreshResults() {
            const searchResults = document.getElementById('searchResults');
            const statsElement = searchResults.querySelector('.search-stats');
            const statsHtml = statsElement ? statsElement.outerHTML : '';

            this.renderResults('0.00', this.currentResults.length, this.searchMode);
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    window.SearchManager = SearchManager;
})();
