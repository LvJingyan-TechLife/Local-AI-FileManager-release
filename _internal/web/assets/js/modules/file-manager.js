(function() {
    'use strict';

    class FileManager {
        constructor(api, toast, categoryManager) {
            this.api = api;
            this.toast = toast;
            this.categoryManager = categoryManager;
            this.currentFiles = []; // 已上传的文档列表
            this.pendingUploads = []; // 待上传的文件列表
            this.filteredDocuments = [];
            this.currentView = 'list'; // 当前视图模式：list 或 tree
            
            // 使用全局状态管理文档状态
            this.initDocumentState();
        }
        
        // 初始化文档状态管理
        initDocumentState() {
            console.log('[DOC] 初始化文档状态管理');
            
            // 确保全局状态存在
            if (window.StateManager) {
                // 初始化文档状态
                window.StateManager.setState('documentState.currentDocuments', []);
                window.StateManager.setState('documentState.pendingUploads', []);
                window.StateManager.setState('documentState.selectedDocuments', []);
                window.StateManager.setState('documentState.uploadProgress', null);
                window.StateManager.setState('documentState.isLoading', false);
                
                console.log('[DOC] 文档状态初始化完成');
            }
        }
        
        // 获取当前文档列表（从全局状态）
        getCurrentDocuments() {
            if (window.StateManager) {
                return window.StateManager.getState('documentState.currentDocuments') || [];
            }
            return this.currentFiles;
        }
        
        // 更新文档列表（并更新全局状态）
        updateDocumentList(docs) {
            this.filteredDocuments = docs;
            this.currentFiles = docs;
            
            if (window.StateManager) {
                window.StateManager.setState('documentState.currentDocuments', docs);
            }
        }
        
        // 获取选中的文档（从全局状态）
        getSelectedDocuments() {
            if (window.StateManager) {
                return window.StateManager.getState('documentState.selectedDocuments') || [];
            }
            return [];
        }
        
        // 设置选中的文档（并更新全局状态）
        setSelectedDocuments(docIds) {
            if (window.StateManager) {
                window.StateManager.setState('documentState.selectedDocuments', docIds);
            }
        }
        
        // 更新选中的文档列表（从树形视图或列表视图）
        updateSelectedDocuments() {
            console.log('[FILE-MANAGER] 更新选中的文档列表');
            
            // 从树形视图收集选中的文档
            const selectedDocs = [];
            
            // 检查树形视图
            const treeView = document.querySelector('.tree-view');
            if (treeView) {
                const checkedFileCheckboxes = treeView.querySelectorAll('.file-checkbox:checked');
                checkedFileCheckboxes.forEach(checkbox => {
                    selectedDocs.push(checkbox.dataset.docId);
                });
                console.log('[FILE-MANAGER] 从树形视图找到选中的文档数:', checkedFileCheckboxes.length);
            }
            
            // 检查列表视图
            const tableCheckboxes = document.querySelectorAll('.doc-checkbox:checked');
            if (tableCheckboxes.length > 0) {
                tableCheckboxes.forEach(checkbox => {
                    selectedDocs.push(checkbox.value);
                });
                console.log('[FILE-MANAGER] 从列表视图找到选中的文档数:', tableCheckboxes.length);
            }
            
            // 去重
            const uniqueDocs = [...new Set(selectedDocs)];
            console.log('[FILE-MANAGER] 最终选中的文档数:', uniqueDocs.length, '| 文档ID:', uniqueDocs);
            
            // 更新全局状态
            this.setSelectedDocuments(uniqueDocs);
            
            // 更新统计信息
            const selectedCountElement = document.getElementById('selectedCount');
            if (selectedCountElement) {
                selectedCountElement.textContent = uniqueDocs.length;
            }
        }
        
        // 设置加载状态（并更新全局状态）
        setLoadingState(isLoading) {
            if (window.StateManager) {
                window.StateManager.setState('documentState.isLoading', isLoading);
            }
        }
        
        // 获取加载状态（从全局状态）
        getLoadingState() {
            if (window.StateManager) {
                return window.StateManager.getState('documentState.isLoading') || false;
            }
            return false;
        }
        
        // 设置上传进度（并更新全局状态）
        setUploadProgress(progress) {
            if (window.StateManager) {
                window.StateManager.setState('documentState.uploadProgress', progress);
            }
        }
        
        // 获取上传进度（从全局状态）
        getUploadProgress() {
            if (window.StateManager) {
                return window.StateManager.getState('documentState.uploadProgress');
            }
            return null;
        }

        // 加载文档列表
        async loadDocuments() {
            console.log('[FILE-MANAGER] 开始加载文档列表');
            const tbody = document.getElementById('docTableBody');
            const docCount = document.getElementById('docCount');

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="loading-spinner" style="border-color: var(--primary-color); border-top-color: transparent; margin: 0 auto;"></div>
                        <p style="margin-top: 12px; color: var(--text-muted);">加载中...</p>
                    </td>
                </tr>
            `;

            try {
                const response = await this.api.getDocuments();
                const docs = response.data?.documents || [];
                const total = response.data?.total || 0;
                console.log('[FILE-MANAGER] 成功获取文档列表 | 文档数:', docs.length, '总数:', total);

                // 更新所有数据源
                this.updateDocumentList(docs);
                
                // 更新文档计数（使用total显示实际总数）
                docCount.textContent = `共 ${total} 个文档`;
                console.log('[FILE-MANAGER] 更新文档计数:', total);

                // 使用applyFilters来统一更新所有视图（列表和树形）
                this.applyFilters();

                this.toast.success('文档列表已刷新');
            } catch (error) {
                console.error('[FILE-MANAGER] 加载文档失败:', error);
                this.toast.error('加载文档失败: ' + error.message);
                
                // 显示错误状态
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            加载失败，请重试
                        </td>
                    </tr>
                `;
            }
        }

        // 加载分类统计
        async loadCategoryStats() {
            try {
                const response = await this.api.getDocuments();
                const docs = response.data?.documents || [];
                const total = response.data?.total || 0;
                console.log('[FILE-MANAGER] 加载分类统计 | 当前页文档数:', docs.length, '总数:', total);
                
                const categoryStats = {};
                docs.forEach(doc => {
                    const category = doc.category || '未分类';
                    categoryStats[category] = (categoryStats[category] || 0) + 1;
                });

                this.updateCategoryStats(categoryStats);
            } catch (error) {
                console.error('加载分类统计失败:', error);
            }
        }

        // 更新分类统计显示
        updateCategoryStats(stats) {
            const statsContainer = document.getElementById('categoryStats');
            if (!statsContainer) return;

            const statsHtml = Object.entries(stats).map(([category, count]) => `
                <div class="stat-item">
                    <span class="stat-category">${this.escapeHtml(category)}</span>
                    <span class="stat-count">${count}</span>
                </div>
            `).join('');

            statsContainer.innerHTML = statsHtml || '<div class="no-stats">暂无统计数据</div>';
        }

        // 删除单个文档
        async deleteDocument(docId) {
            if (!confirm('确定要删除这个文档吗？')) {
                return;
            }

            try {
                await this.api.deleteDocument(docId);
                this.toast.success('文档删除成功');
                await this.loadDocuments();
                await this.loadCategoryStats();
            } catch (error) {
                this.toast.error('删除文档失败: ' + error.message);
            }
        }

        // 查看文档
        async viewDocument(docId) {
            console.log('[FILE-MANAGER] 开始查看文档 | 文档ID:', docId);
            
            try {
                // 显示加载状态
                this.setLoadingState(true);
                
                // 获取文档详情
                console.log('[FILE-MANAGER] 调用API获取文档详情 | 文档ID:', docId);
                const response = await this.api.getDocument(docId);
                const doc = response.document;
                
                if (!doc) {
                    console.error('[FILE-MANAGER] 文档详情获取失败：文档不存在 | 文档ID:', docId);
                    this.toast.error('文档不存在');
                    return;
                }
                
                console.log('[FILE-MANAGER] 文档详情获取成功 | 文档ID:', docId, '| 文档标题:', doc.title || doc.filename);
                
                // 创建并显示文档详情模态框
                this.showDocumentModal(doc);
                
            } catch (error) {
                console.error('[FILE-MANAGER] 查看文档失败 | 文档ID:', docId, '| 错误:', error);
                this.toast.error('查看文档失败: ' + error.message);
            } finally {
                // 隐藏加载状态
                this.setLoadingState(false);
            }
        }
        
        // 显示文档详情模态框
        showDocumentModal(doc) {
            console.log('[FILE-MANAGER] 显示文档详情模态框 | 文档ID:', doc.id);
            
            // 创建模态框HTML结构
            const modalHtml = `
                <div class="modal-backdrop" id="docModalBackdrop">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">${this.escapeHtml(doc.title || doc.filename || '文档详情')}</h3>
                            <button class="modal-close" id="docModalClose">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="doc-details">
                                <div class="detail-item">
                                    <span class="detail-label">文件名:</span>
                                    <span class="detail-value">${this.escapeHtml(doc.filename || '-')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">标题:</span>
                                    <span class="detail-value">${this.escapeHtml(doc.title || '-')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">分类:</span>
                                    <span class="detail-value">${this.escapeHtml(doc.category || '未分类')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">主要分类:</span>
                                    <span class="detail-value">${this.escapeHtml(doc.major_category || '未分类')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">文档ID:</span>
                                    <span class="detail-value">${this.escapeHtml(doc.id || '-')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">块数量:</span>
                                    <span class="detail-value">${doc.chunk_count || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">状态:</span>
                                    <span class="detail-value">
                                        <span class="tag ${doc.vector_status ? 'success' : 'warning'}">
                                            ${doc.vector_status ? '已向量化' : '待处理'}
                                        </span>
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">创建时间:</span>
                                    <span class="detail-value">${doc.create_time ? new Date(doc.create_time).toLocaleString() : '-'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">文件大小:</span>
                                    <span class="detail-value">${doc.file_size ? this.formatFileSize(doc.file_size) : '-'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">文件类型:</span>
                                    <span class="detail-value">${this.escapeHtml(doc.file_type || '-')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="docModalConfirm">确定</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加模态框到页面
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // 添加事件监听器
            const backdrop = document.getElementById('docModalBackdrop');
            const closeBtn = document.getElementById('docModalClose');
            const confirmBtn = document.getElementById('docModalConfirm');
            
            const closeModal = () => {
                console.log('[FILE-MANAGER] 关闭文档详情模态框');
                backdrop.remove();
            };
            
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeModal();
                }
            });
            
            closeBtn.addEventListener('click', closeModal);
            confirmBtn.addEventListener('click', closeModal);
            
            // 按ESC键关闭模态框
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            
            document.addEventListener('keydown', handleEsc);
            
            console.log('[FILE-MANAGER] 文档详情模态框显示完成 | 文档ID:', doc.id);
        }
        
        // 格式化文件大小
        formatFileSize(bytes) {
            if (!bytes || bytes < 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // 切换视图（列表/树形）
        async switchView(view) {
            console.log('[FILE-MANAGER] 开始切换视图 | 目标视图:', view);
            
            const docTable = document.getElementById('docTable');
            const docListContainer = document.querySelector('.doc-list-section-enhanced');
            const tableWrapper = document.querySelector('.table-wrapper-enhanced');
            
            if (!docTable || !docListContainer) {
                console.error('[FILE-MANAGER] 视图切换失败：未找到必要的DOM元素');
                this.toast.error('视图切换失败：界面元素缺失');
                return;
            }
            
            if (view === 'list') {
                console.log('[FILE-MANAGER] 切换到列表视图');
                this.currentView = 'list';
                
                // 显示表格容器
                if (tableWrapper) {
                    tableWrapper.style.display = 'block';
                }
                
                // 显示列表视图
                docTable.style.display = 'table';
                
                // 移除树形视图相关元素
                const treeView = docListContainer.querySelector('.tree-view');
                if (treeView) {
                    console.log('[FILE-MANAGER] 移除现有树形视图元素');
                    treeView.remove();
                }
                
                // 应用当前筛选条件，确保列表显示正确数据
                console.log('[FILE-MANAGER] 应用当前筛选条件到列表视图');
                this.applyFilters();
                
                console.log('[FILE-MANAGER] 列表视图切换完成');
                this.toast.info('已切换到列表视图');
            } else if (view === 'tree') {
                console.log('[FILE-MANAGER] 切换到树形视图');
                
                // 隐藏表格容器
                if (tableWrapper) {
                    tableWrapper.style.display = 'none';
                }
                
                // 隐藏列表视图
                docTable.style.display = 'none';
                
                // 重新获取最新文档数据，确保树形视图显示的是最新内容
                try {
                    const response = await this.api.getDocuments();
                    const docs = response.data?.documents || [];
                    const total = response.data?.total || 0;
                    console.log('[FILE-MANAGER] 切换到树形视图时获取最新文档 | 文档数:', docs.length, '总数:', total);
                    
                    // 更新所有数据源
                    this.updateDocumentList(docs);
                    
                    // 更新文档计数
                    const docCount = document.getElementById('docCount');
                    if (docCount) {
                        docCount.textContent = `共 ${total} 个文档`;
                    }
                } catch (error) {
                    console.error('[FILE-MANAGER] 切换到树形视图时获取文档失败:', error);
                    this.toast.error('获取文档列表失败');
                }
                
                // 检查是否已经存在树形视图
                let treeView = docListContainer.querySelector('.tree-view');
                if (!treeView) {
                    console.log('[FILE-MANAGER] 创建新的树形视图容器');
                    treeView = document.createElement('div');
                    treeView.className = 'tree-view';
                    docListContainer.appendChild(treeView);
                } else {
                    // 确保树形视图可见
                    treeView.style.display = 'block';
                }
                
                // 生成树形视图内容
                console.log('[FILE-MANAGER] 生成树形视图内容 | 文档数:', this.filteredDocuments.length);
                this.generateTreeView(treeView);
                
                // 将统计信息移动到树形视图下方
                const statsFooter = docListContainer.querySelector('.table-stats-footer');
                if (statsFooter) {
                    docListContainer.appendChild(statsFooter);
                }
                
                console.log('[FILE-MANAGER] 树形视图切换完成');
                this.toast.info('已切换到树形视图');
            } else {
                console.error('[FILE-MANAGER] 无效的视图类型:', view);
                this.toast.error('无效的视图类型');
            }
        }
        
        // 生成树形视图
        generateTreeView(container) {
            console.log('[FILE-MANAGER] 开始生成树形视图');
            
            // 验证容器是否有效
            if (!container || !(container instanceof HTMLElement)) {
                console.error('[FILE-MANAGER] 树形视图容器无效');
                this.toast.error('树形视图渲染失败：容器无效');
                return;
            }
            
            const docs = this.filteredDocuments;
            console.log('[FILE-MANAGER] 用于生成树形视图的文档数:', docs.length);
            
            // 如果没有文档，显示空状态
            if (docs.length === 0) {
                console.log('[FILE-MANAGER] 无文档可显示，显示空状态');
                container.innerHTML = '<div class="tree-empty">暂无文档</div>';
                return;
            }
            
            // 按分类分组文档
            console.log('[FILE-MANAGER] 开始按分类分组文档');
            const categoryGroups = {};
            
            docs.forEach(doc => {
                if (!doc) return; // 跳过无效文档
                
                const category = doc.category || '未分类';
                if (!categoryGroups[category]) {
                    categoryGroups[category] = [];
                }
                categoryGroups[category].push(doc);
            });
            
            const categoryCount = Object.keys(categoryGroups).length;
            console.log('[FILE-MANAGER] 分类分组完成 | 分类数:', categoryCount, '| 分类详情:', Object.keys(categoryGroups));
            
            // 生成树形HTML
            console.log('[FILE-MANAGER] 开始生成树形HTML结构');
            let treeHtml = '<div class="tree-container">';
            
            // 按分类排序
            const sortedCategories = Object.entries(categoryGroups).sort(([a], [b]) => {
                // 确保'未分类'始终在最后
                if (a === '未分类') return 1;
                if (b === '未分类') return -1;
                return a.localeCompare(b);
            });
            
            sortedCategories.forEach(([category, files]) => {
                console.log('[FILE-MANAGER] 生成分类节点 | 分类:', category, '| 文档数:', files.length);
                
                treeHtml += `
                    <div class="tree-node category-node">
                        <div class="tree-node-header">
                            <span class="tree-toggle">▶</span>
                            <span class="tree-node-title">${this.escapeHtml(category)}</span>
                            <span class="file-count">${files.length}</span>
                        </div>
                        <div class="tree-children">
                `;
                
                // 按文件名排序
                const sortedFiles = files.sort((a, b) => {
                    const nameA = a.title || a.filename || '';
                    const nameB = b.title || b.filename || '';
                    return nameA.localeCompare(nameB);
                });
                
                sortedFiles.forEach(doc => {
                    treeHtml += `
                        <div class="tree-node file-node" data-id="${doc.id}">
                            <div class="tree-node-header">
                                <span class="tree-icon">📄</span>
                                <span class="tree-node-title">${this.escapeHtml(doc.title || doc.filename || '-')}</span>
                                <span class="tree-node-meta">
                                    ${doc.chunk_count || 0} 块 | ${doc.vector_status ? '已向量化' : '待处理'}
                                </span>
                                <div class="tree-action-buttons">
                                    <button class="data-action-btn view" onclick="app.fileManager.viewDocument('${doc.id}')" title="查看">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                    <button class="data-action-btn delete" onclick="app.fileManager.deleteDocument('${doc.id}')" title="删除">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                treeHtml += `
                        </div>
                    </div>
                `;
            });
            
            treeHtml += '</div>';
            
            // 更新已有的统计信息，不重新生成HTML
            const docCount = document.getElementById('docCount');
            const selectedCount = document.getElementById('selectedCount');
            if (docCount) {
                docCount.textContent = `共 ${docs.length} 个文档`;
            }
            if (selectedCount) {
                selectedCount.textContent = `已选择 0 个`;
            }
            
            console.log('[FILE-MANAGER] 树形HTML结构生成完成');
            
            // 更新容器内容
            console.log('[FILE-MANAGER] 更新树形视图容器内容');
            container.innerHTML = treeHtml;
            
            // 添加树形节点展开/折叠功能
            console.log('[FILE-MANAGER] 添加树形节点交互功能');
            const categoryNodes = container.querySelectorAll('.category-node');
            console.log('[FILE-MANAGER] 找到分类节点数:', categoryNodes.length);
            
            categoryNodes.forEach((node, index) => {
                const header = node.querySelector('.tree-node-header');
                const children = node.querySelector('.tree-children');
                const toggle = node.querySelector('.tree-toggle');
                
                if (!header || !children || !toggle) {
                    console.warn('[FILE-MANAGER] 分类节点结构不完整 | 索引:', index);
                    return;
                }
                
                // 默认折叠
                children.style.display = 'none';
                
                header.addEventListener('click', (e) => {
                    // 如果点击的是复选框，不触发展开/折叠
                    if (e.target.classList.contains('tree-checkbox')) {
                        return;
                    }
                    
                    const categoryName = header.querySelector('.tree-node-title').textContent;
                    console.log('[FILE-MANAGER] 点击分类节点 | 分类:', categoryName, '| 当前状态:', children.style.display);
                    
                    if (children.style.display === 'none') {
                        children.style.display = 'block';
                        toggle.textContent = '▼';
                        toggle.classList.add('expanded');
                        console.log('[FILE-MANAGER] 展开分类 | 分类:', categoryName);
                    } else {
                        children.style.display = 'none';
                        toggle.textContent = '▶';
                        toggle.classList.remove('expanded');
                        console.log('[FILE-MANAGER] 折叠分类 | 分类:', categoryName);
                    }
                });
                
                // 分类复选框已移除，相关事件处理代码已删除
            });
            
            // 文件复选框已移除，相关事件处理代码已删除
            
            console.log('[FILE-MANAGER] 树形视图生成完成');
        }

        // 删除选中的文档
        async deleteSelectedDocuments() {
            console.log('[DELETE] 开始执行删除选中文档操作');
            
            const checkboxes = document.querySelectorAll('.doc-checkbox:checked');
            console.log('[DELETE] 找到选中的复选框数量:', checkboxes.length);
            
            if (checkboxes.length === 0) {
                console.log('[DELETE] 未选中任何文档，提示用户');
                this.toast.warning('请选择要删除的文档');
                return;
            }

            console.log('[DELETE] 准备显示确认对话框，文档数量:', checkboxes.length);
            const confirmed = confirm(`确定要删除选中的 ${checkboxes.length} 个文档吗？`);
            console.log('[DELETE] 用户确认结果:', confirmed);
            
            if (!confirmed) {
                console.log('[DELETE] 用户取消删除操作');
                return;
            }

            const docIds = Array.from(checkboxes).map(cb => cb.value);
            console.log('[DELETE] 要删除的文档ID列表:', docIds);
            
            const deletePromises = docIds.map(docId => this.api.deleteDocument(docId));
            
            try {
                console.log('[DELETE] 开始批量删除文档');
                await Promise.all(deletePromises);
                console.log('[DELETE] 批量删除完成');
                this.toast.success(`成功删除 ${docIds.length} 个文档`);
                
                console.log('[DELETE] 开始重新加载文档列表');
                await this.loadDocuments();
                console.log('[DELETE] 文档列表加载完成');
                
                console.log('[DELETE] 开始加载分类统计');
                await this.loadCategoryStats();
                console.log('[DELETE] 分类统计加载完成');
            } catch (error) {
                console.error('[DELETE] 删除文档失败:', error);
                this.toast.error('删除文档失败: ' + error.message);
            }
            
            console.log('[DELETE] 删除选中文档操作完成');
        }

        // 全选/取消全选文档
        selectAllDocuments(checked) {
            const checkboxes = document.querySelectorAll('.doc-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = checked;
            });
        }

        // 搜索文档
        performDocSearch() {
            console.log('[FILE-MANAGER] 开始执行文档搜索');
            
            // 获取搜索输入内容（用于日志）
            const searchInput = document.getElementById('docSearchInput');
            const searchTerm = searchInput ? searchInput.value : '';
            
            console.log('[FILE-MANAGER] 搜索关键词:', searchTerm);
            
            // 使用统一的筛选方法，确保搜索与其他筛选条件一致
            this.applyFilters();
            
            console.log('[FILE-MANAGER] 文档搜索执行完成');
        }

        // 应用所有筛选条件
        applyFilters() {
            console.log('[FILE-MANAGER] 开始应用所有筛选条件');
            
            // 获取当前所有筛选条件
            const searchInput = document.getElementById('docSearchInput');
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            
            const statusFilter = document.getElementById('statusFilter');
            const statusValue = statusFilter ? statusFilter.value : '';
            
            const timeFilter = document.getElementById('timeFilter');
            const timeValue = timeFilter ? timeFilter.value : '';
            
            const categoryFilter = document.getElementById('categorySelector');
            const categoryValue = categoryFilter ? categoryFilter.value : '';
            
            console.log('[FILE-MANAGER] 筛选条件:');
            console.log('[FILE-MANAGER] - 搜索关键词:', searchTerm);
            console.log('[FILE-MANAGER] - 状态筛选:', statusValue);
            console.log('[FILE-MANAGER] - 时间筛选:', timeValue);
            console.log('[FILE-MANAGER] - 分类筛选:', categoryValue);
            
            // 从全局状态获取完整文档列表
            const allDocs = this.getCurrentDocuments();
            console.log('[FILE-MANAGER] 总文档数:', allDocs.length);
            
            // 应用所有筛选条件
            this.filteredDocuments = allDocs.filter(doc => {
                let visible = true;
                
                // 搜索过滤
                if (searchTerm) {
                    const searchableText = (doc.title || doc.filename || '').toLowerCase() + 
                                           (doc.category || '').toLowerCase() + 
                                           (doc.major_category || '').toLowerCase();
                    visible = visible && searchableText.includes(searchTerm);
                }
                
                // 状态过滤
                if (statusValue) {
                    if (statusValue === 'processed') {
                        visible = visible && doc.vector_status;
                    } else if (statusValue === 'pending') {
                        visible = visible && !doc.vector_status;
                    } else if (statusValue === 'error') {
                        visible = visible && doc.vector_status === 'error';
                    }
                }
                
                // 分类过滤
                if (categoryValue && categoryValue !== 'all') {
                    visible = visible && (doc.category === categoryValue || doc.major_category === categoryValue);
                }
                
                // 时间过滤
                if (timeValue) {
                    visible = visible && this.filterByTime(doc, timeValue);
                }
                
                return visible;
            });
            
            console.log('[FILE-MANAGER] 筛选后文档数:', this.filteredDocuments.length);
            
            // 更新列表视图
            console.log('[FILE-MANAGER] 更新列表视图');
            this.updateListView();
            
            // 更新树形视图（如果当前是树形视图）
            const treeView = document.querySelector('.tree-view');
            if (treeView) {
                console.log('[FILE-MANAGER] 更新树形视图');
                this.generateTreeView(treeView);
            }
            
            console.log('[FILE-MANAGER] 所有筛选条件应用完成');
        }
        
        // 更新列表视图显示
        updateListView() {
            console.log('[FILE-MANAGER] 开始更新列表视图');
            
            const tbody = document.getElementById('docTableBody');
            const docCount = document.getElementById('docCount');
            
            if (!tbody) {
                console.error('[FILE-MANAGER] 更新列表视图失败：未找到表格体元素');
                return;
            }
            
            // 更新文档计数
            const documentCount = this.filteredDocuments.length;
            console.log('[FILE-MANAGER] 要显示的文档数:', documentCount);
            
            if (docCount) {
                docCount.textContent = `共 ${documentCount} 个文档`;
                console.log('[FILE-MANAGER] 更新文档计数显示为:', documentCount);
            }
            
            if (documentCount === 0) {
                console.log('[FILE-MANAGER] 无文档可显示，显示空状态');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            暂无文档
                        </td>
                    </tr>
                `;
                return;
            }
            
            // 重新生成表格内容
            console.log('[FILE-MANAGER] 开始生成文档表格内容');
            
            const tableRows = this.filteredDocuments.map(doc => {
                const rowHtml = `
                    <tr data-id="${doc.id}">
                        <td><input type="checkbox" class="doc-checkbox" value="${doc.id}"></td>
                        <td>${doc.id || '-'}</td>
                        <td>
                            <div class="doc-info">
                                <div class="doc-title">${this.escapeHtml(doc.title || doc.filename || '-')}</div>
                                <div class="doc-filename">${this.escapeHtml(doc.filename || '-')}</div>
                            </div>
                        </td>
                        <td><span class="tag ${doc.category ? 'info' : 'warning'}">${this.escapeHtml(doc.category || '未分类')}</span></td>
                        <td><span class="tag info">${this.escapeHtml(doc.major_category || '未分类')}</span></td>
                        <td>${doc.chunk_count || 0}</td>
                        <td><span class="tag ${doc.vector_status ? 'success' : 'warning'}">${doc.vector_status ? '已向量化' : '待处理'}</span></td>
                        <td>
                            <div class="data-action-buttons">
                                <button class="data-action-btn view" onclick="app.fileManager.viewDocument('${doc.id}')" title="查看">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                                <button class="data-action-btn delete" onclick="app.fileManager.deleteDocument('${doc.id}')" title="删除">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return rowHtml;
            }).join('');
            
            console.log('[FILE-MANAGER] 表格内容生成完成，更新DOM');
            tbody.innerHTML = tableRows;
            
            console.log('[FILE-MANAGER] 列表视图更新完成');
        }
        
        // 按时间过滤文档
        filterByTime(doc, timeValue) {
            console.log('[FILE-MANAGER] 开始时间过滤 | 文档ID:', doc.id, '| 时间过滤条件:', timeValue);
            
            if (!doc.create_time) {
                console.log('[FILE-MANAGER] 文档无创建时间，默认显示 | 文档ID:', doc.id);
                return true;
            }
            
            const docDate = new Date(doc.create_time);
            const now = new Date();
            
            let result = true;
            
            switch (timeValue) {
                case 'today':
                    result = docDate.toDateString() === now.toDateString();
                    console.log('[FILE-MANAGER] 今日过滤 | 文档创建时间:', docDate.toDateString(), '| 结果:', result);
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    result = docDate >= weekAgo;
                    console.log('[FILE-MANAGER] 最近7天过滤 | 文档创建时间:', docDate.toISOString(), '| 7天前:', weekAgo.toISOString(), '| 结果:', result);
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    result = docDate >= monthAgo;
                    console.log('[FILE-MANAGER] 最近30天过滤 | 文档创建时间:', docDate.toISOString(), '| 30天前:', monthAgo.toISOString(), '| 结果:', result);
                    break;
                default:
                    console.log('[FILE-MANAGER] 默认不过滤时间 | 时间值:', timeValue);
                    result = true;
            }
            
            console.log('[FILE-MANAGER] 时间过滤完成 | 结果:', result);
            return result;
        }

        // 添加自定义分类
        async addCustomCategory() {
            console.log('[FILE-MANAGER] 开始添加自定义分类');
            
            const categoryName = prompt('请输入新分类名称:');
            if (!categoryName || !categoryName.trim()) {
                console.log('[FILE-MANAGER] 用户取消或输入空分类名称');
                return;
            }
            
            const trimmedName = categoryName.trim();
            console.log('[FILE-MANAGER] 用户输入的分类名称:', trimmedName);
            
            try {
                // 调用分类管理器添加分类
                console.log('[FILE-MANAGER] 调用分类管理器添加分类 | 分类名称:', trimmedName);
                await this.categoryManager.addCategory(trimmedName);
                
                console.log('[FILE-MANAGER] 自定义分类添加成功 | 分类名称:', trimmedName);
                this.toast.success(`分类 "${trimmedName}" 添加成功`);
                
                // 刷新分类列表
                console.log('[FILE-MANAGER] 刷新分类列表');
                await this.loadCategories();
                
            } catch (error) {
                console.error('[FILE-MANAGER] 添加自定义分类失败 | 分类名称:', trimmedName, '| 错误:', error);
                this.toast.error('添加分类失败: ' + error.message);
            }
        }

        // 清空文件列表
        clearFileList() {
            this.pendingUploads = [];
            // 更新全局状态中的待上传文件列表
            if (window.StateManager) {
                window.StateManager.setState('documentState.pendingUploads', []);
            }
            this.updateFileList();
        }
        
        // 自动分类方法
        autoClassify(fileName) {
            console.log('[AUTO-CLASSIFY] ======== 开始自动分类 ========');
            console.log('[AUTO-CLASSIFY] 文件名:', fileName);
            
            // 获取所有分类
            const allCategories = this.categoryManager.getAllCategories();
            console.log('[AUTO-CLASSIFY] 所有可用分类总数:', allCategories.length);
            console.log('[AUTO-CLASSIFY] 小分类列表完整输出:', allCategories);
            
            // 将文件名转换为小写，便于匹配
            const lowerFileName = fileName.toLowerCase();
            console.log('[AUTO-CLASSIFY] 文件名(小写):', lowerFileName);
            
            // 移除文件名中的常见后缀和版本号信息，减少干扰
            const cleanedFileName = lowerFileName
                .replace(/(_v?\d+\.\d+|_\d{4}|_update|_final|_draft|_version|_rev)\b/g, '')
                .replace(/\.\w+$/, ''); // 移除文件扩展名
            console.log('[AUTO-CLASSIFY] 清理后的文件名:', cleanedFileName);
            
            // 按分类名称长度降序排序，确保匹配到最长的分类名称
            const sortedCategories = [...allCategories].sort((a, b) => b.length - a.length);
            console.log('[AUTO-CLASSIFY] 按长度排序后的分类总数:', sortedCategories.length);
            console.log('[AUTO-CLASSIFY] 排序后分类列表:', sortedCategories);
            
            // 遍历所有分类，找到匹配的分类
            for (const category of sortedCategories) {
                const lowerCategory = category.toLowerCase();
                console.log('[AUTO-CLASSIFY] 开始检查分类:', category, '(小写:', lowerCategory, ')');
                
                // 1. 首先尝试精确匹配（分类名称包含在文件名中）
                console.log('[AUTO-CLASSIFY]  1. 精确匹配检查: 文件名是否包含分类名？');
                console.log('[AUTO-CLASSIFY]  文件名(小写):', lowerFileName);
                console.log('[AUTO-CLASSIFY]  分类名(小写):', lowerCategory);
                console.log('[AUTO-CLASSIFY]  包含检查结果:', lowerFileName.includes(lowerCategory));
                
                if (lowerFileName.includes(lowerCategory)) {
                    console.log('[AUTO-CLASSIFY]  精确匹配成功！返回分类:', category);
                    return category;
                } else {
                    console.log('[AUTO-CLASSIFY]  精确匹配失败');
                }
                
                // 2. 尝试清理后的文件名精确匹配
                console.log('[AUTO-CLASSIFY]  2. 清理文件名精确匹配: 清理后的文件名是否包含分类名？');
                console.log('[AUTO-CLASSIFY]  清理后的文件名:', cleanedFileName);
                console.log('[AUTO-CLASSIFY]  分类名(小写):', lowerCategory);
                console.log('[AUTO-CLASSIFY]  包含检查结果:', cleanedFileName.includes(lowerCategory));
                
                if (cleanedFileName.includes(lowerCategory)) {
                    console.log('[AUTO-CLASSIFY]  清理文件名精确匹配成功！返回分类:', category);
                    return category;
                } else {
                    console.log('[AUTO-CLASSIFY]  清理文件名精确匹配失败');
                }
                
                // 3. 如果精确匹配失败，尝试匹配分类名称中的关键词
                console.log('[AUTO-CLASSIFY]  3. 关键词匹配检查: 文件名是否包含分类的所有关键词？');
                // 将分类名称拆分为关键词
                const categoryKeywords = lowerCategory.split(/[^\u4e00-\u9fa5a-z0-9]+/).filter(Boolean);
                console.log('[AUTO-CLASSIFY]  分类关键词:', categoryKeywords);
                
                if (categoryKeywords.length > 0) {
                    // 检查文件名是否包含分类名称中的所有关键词
                    const allKeywordsMatched = categoryKeywords.every(keyword => {
                        const matched = lowerFileName.includes(keyword);
                        console.log('[AUTO-CLASSIFY]    关键词', keyword, '匹配结果:', matched);
                        return matched;
                    });
                    
                    if (allKeywordsMatched) {
                        console.log('[AUTO-CLASSIFY]  关键词匹配成功！返回分类:', category);
                        return category;
                    } else {
                        console.log('[AUTO-CLASSIFY]  关键词匹配失败');
                    }
                } else {
                    console.log('[AUTO-CLASSIFY]  分类无有效关键词，跳过关键词匹配');
                }
                
                // 4. 尝试清理后的文件名关键词匹配
                console.log('[AUTO-CLASSIFY]  4. 清理文件名关键词匹配: 清理后的文件名是否包含分类的所有关键词？');
                
                if (categoryKeywords.length > 0) {
                    // 检查清理后的文件名是否包含分类名称中的所有关键词
                    const allKeywordsMatched = categoryKeywords.every(keyword => {
                        const matched = cleanedFileName.includes(keyword);
                        console.log('[AUTO-CLASSIFY]    关键词', keyword, '匹配结果:', matched);
                        return matched;
                    });
                    
                    if (allKeywordsMatched) {
                        console.log('[AUTO-CLASSIFY]  清理文件名关键词匹配成功！返回分类:', category);
                        return category;
                    } else {
                        console.log('[AUTO-CLASSIFY]  清理文件名关键词匹配失败');
                    }
                }
                
                // 5. 尝试更灵活的匹配方式：如果文件名包含分类名称中的任何一个关键词
                console.log('[AUTO-CLASSIFY]  5. 灵活匹配检查: 文件名是否包含分类的任何关键词？');
                const categoryWords = lowerCategory.split(/[^\u4e00-\u9fa5a-z0-9]+/).filter(Boolean);
                console.log('[AUTO-CLASSIFY]  分类词:', categoryWords);
                
                if (categoryWords.length > 0) {
                    const anyKeywordMatched = categoryWords.some(keyword => {
                        const matched = lowerFileName.includes(keyword) && keyword.length > 1;
                        console.log('[AUTO-CLASSIFY]    灵活匹配关键词', keyword, '匹配结果:', matched);
                        return matched;
                    });
                    
                    if (anyKeywordMatched) {
                        const matchedKeywords = categoryWords.filter(k => lowerFileName.includes(k) && k.length > 1);
                        console.log('[AUTO-CLASSIFY]  灵活匹配成功！返回分类:', category, '| 匹配关键词:', matchedKeywords);
                        return category;
                    } else {
                        console.log('[AUTO-CLASSIFY]  灵活匹配失败');
                    }
                } else {
                    console.log('[AUTO-CLASSIFY]  分类无有效分类词，跳灵活匹配');
                }
                
                // 6. 尝试清理后的文件名灵活匹配
                console.log('[AUTO-CLASSIFY]  6. 清理文件名灵活匹配: 清理后的文件名是否包含分类的任何关键词？');
                
                if (categoryWords.length > 0) {
                    const anyKeywordMatched = categoryWords.some(keyword => {
                        const matched = cleanedFileName.includes(keyword) && keyword.length > 1;
                        console.log('[AUTO-CLASSIFY]    灵活匹配关键词', keyword, '匹配结果:', matched);
                        return matched;
                    });
                    
                    if (anyKeywordMatched) {
                        const matchedKeywords = categoryWords.filter(k => cleanedFileName.includes(k) && k.length > 1);
                        console.log('[AUTO-CLASSIFY]  清理文件名灵活匹配成功！返回分类:', category, '| 匹配关键词:', matchedKeywords);
                        return category;
                    } else {
                        console.log('[AUTO-CLASSIFY]  清理文件名灵活匹配失败');
                    }
                }
                
                // 7. 特殊情况处理：针对常见的文档类型进行特殊匹配
                console.log('[AUTO-CLASSIFY]  7. 特殊文档类型匹配检查');
                const specialPatterns = {
                    '技术架构设计': /架构|架构设计|系统架构/g,
                    'API接口规范': /api|接口|接口规范|api规范/g,
                    '数据库设计文档': /数据库|数据设计|db|database/g,
                    '员工手册': /员工|手册|人力资源|人事/g,
                    '产品需求文档': /需求|产品需求|prd|requirements/g,
                    '项目管理计划': /项目管理|项目计划|pm|project/g,
                    '营销策划方案': /营销|策划|营销策划|市场推广/g,
                    '行政管理制度': /行政|管理|制度|行政制度/g,
                    '业务流程文档': /业务流程|流程|工作流/g,
                    '市场调研报告': /市场调研|调研报告|市场分析/g,
                    '财务报表': /财务|报表|financial|report/g,
                    '培训课程资料': /培训|课程|学习|教育/g
                };
                
                if (specialPatterns[category]) {
                    const matched = specialPatterns[category].test(cleanedFileName);
                    console.log('[AUTO-CLASSIFY]    特殊模式匹配结果:', matched);
                    if (matched) {
                        console.log('[AUTO-CLASSIFY]  特殊文档类型匹配成功！返回分类:', category);
                        return category;
                    }
                } else {
                    console.log('[AUTO-CLASSIFY]    无特殊模式定义');
                }
                
                console.log('[AUTO-CLASSIFY] 所有匹配方式均失败，继续检查下一个分类');
            }
            
            // 如果没有匹配的分类，返回空字符串
            console.log('[AUTO-CLASSIFY] 未找到匹配分类 | 文件名:', fileName, '| 返回默认分类');
            return '';
        }

        // 添加文件
        addFile(file) {
            console.log('[FILE-MANAGER] ===== addFile方法开始 =====');
            console.log('[FILE-MANAGER] 接收到的文件:', {name: file.name, size: file.size, type: file.type});
            
            // 验证file对象是否有效
            if (!file || !file.name) {
                console.error('[FILE-MANAGER] 无效的文件对象:', file);
                return;
            }
            
            // 调用自动分类方法
            console.log('[FILE-MANAGER] 准备调用autoClassify方法');
            const autoCategory = this.autoClassify(file.name);
            console.log('[FILE-MANAGER] autoClassify调用完成 | 结果:', autoCategory);
            
            // 创建包含分类信息的文件对象
            console.log('[FILE-MANAGER] 创建fileWithCategory对象');
            const fileWithCategory = {
                file: file,
                autoCategory: autoCategory
            };
            
            // 添加到待上传列表
            console.log('[FILE-MANAGER] 将文件添加到pendingUploads列表');
            console.log('[FILE-MANAGER] 添加前列表长度:', this.pendingUploads.length);
            this.pendingUploads.push(fileWithCategory);
            console.log('[FILE-MANAGER] 添加后列表长度:', this.pendingUploads.length);
            
            // 更新全局状态
            console.log('[FILE-MANAGER] 更新全局状态documentState.pendingUploads');
            if (window.StateManager) {
                window.StateManager.setState('documentState.pendingUploads', this.pendingUploads);
                console.log('[FILE-MANAGER] 全局状态更新完成');
            } else {
                console.warn('[FILE-MANAGER] window.StateManager不存在，无法更新全局状态');
            }
            
            // 更新文件列表显示
            console.log('[FILE-MANAGER] 调用updateFileList方法');
            this.updateFileList();
            console.log('[FILE-MANAGER] updateFileList调用完成');
            
            console.log('[FILE-MANAGER] ===== addFile方法结束 =====');
        }

        // 移除文件
        removeFile(index) {
            console.log('[FILE] 移除文件 | 索引:', index, '| 文件名:', this.pendingUploads[index]?.file?.name);
            this.pendingUploads.splice(index, 1);
            // 更新全局状态
            if (window.StateManager) {
                window.StateManager.setState('documentState.pendingUploads', this.pendingUploads);
            }
            this.updateFileList();
        }

        // 初始化文件列表事件监听器
        initFileListListeners() {
            const fileList = document.getElementById('fileList');
            if (!fileList || fileList.dataset.listenersInitialized) return;
            
            // 使用箭头函数确保this指向正确
            const handleRemoveClick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                e.preventDefault(); // 阻止默认行为
                
                if (e.target.closest('.remove-file')) {
                    const button = e.target.closest('.remove-file');
                    const index = parseInt(button.dataset.index, 10);
                    if (!isNaN(index)) {
                        console.log('[FILE] 移除文件索引:', index);
                        console.log('[FILE] 移除前文件数量:', this.currentFiles.length);
                        this.removeFile(index);
                        console.log('[FILE] 移除后文件数量:', this.currentFiles.length);
                    } else {
                        console.error('[FILE] 无效的文件索引:', button.dataset.index);
                    }
                }
            };
            
            // 添加事件监听器
            fileList.addEventListener('click', handleRemoveClick);
            fileList.dataset.listenersInitialized = 'true';
            console.log('[FILE] 文件列表事件监听器已初始化');
        }
        
        // 更新文件列表显示
        updateFileList() {
            const fileList = document.getElementById('fileList');
            const uploadBtn = document.getElementById('uploadBtn');
            
            if (!fileList) return;
            
            // 初始化事件监听器（仅一次）
            this.initFileListListeners();

            if (this.pendingUploads.length === 0) {
                fileList.innerHTML = '<div class="empty-state">暂未选择文件</div>';
                if (uploadBtn) {
                    uploadBtn.disabled = true;
                    uploadBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        开始上传
                    `;
                }
                return;
            }

            fileList.innerHTML = this.pendingUploads.map((fileObj, index) => {
                const file = fileObj.file;
                const autoCategory = fileObj.autoCategory;
                return `
                    <div class="file-item">
                        <div class="file-info">
                            <span class="file-name">${this.escapeHtml(file.name)}</span>
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                            ${autoCategory ? `<span class="file-category">自动分类: ${this.escapeHtml(autoCategory)}</span>` : ''}
                        </div>
                        <button class="remove-file" data-index="${index}">
                            <span>✕</span>
                        </button>
                    </div>
                `;
            }).join('');

            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                开始上传 (${this.pendingUploads.length})
            `;
            }
        }

        // 上传文件
        async uploadFiles() {
            if (this.pendingUploads.length === 0) {
                this.toast.warning('请先选择要上传的文件');
                return;
            }

            const categorySelect = document.getElementById('uploadCategorySelect');
            const category = categorySelect ? categorySelect.value : '';

            const progressContainer = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressPercent = document.getElementById('progressPercent');
            const uploadBtn = document.getElementById('uploadBtn');

            if (!progressContainer || !progressFill || !progressPercent || !uploadBtn) {
                this.toast.error('上传界面元素缺失');
                return;
            }

            // 显示进度条
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            progressPercent.textContent = '0%';

            // 禁用上传按钮
            uploadBtn.disabled = true;

            let completed = 0;
            let success = 0;
            let failed = 0;
            
            // 支持的文件类型
            const supportedFileTypes = [
                '.txt', '.md', '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
                '.ppt', '.pptx', '.rtf', '.html', '.htm', '.csv', '.json'
            ];

            for (const fileObj of this.pendingUploads) {
                try {
                    const file = fileObj.file;
                    console.log(`[UPLOAD] 开始上传文件 ${file.name}`);
                    
                    // 检查文件大小，确保不超过服务器限制
                    if (file.size > 50 * 1024 * 1024) { // 50MB限制
                        console.error(`[UPLOAD] 文件 ${file.name} 大小超过限制 (${file.size} > 50MB)`);
                        this.toast.error(`文件 ${file.name} 大小超过限制 (最大50MB)`);
                        failed++;
                        continue;
                    }
                    
                    // 检查文件类型
                    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                    if (!supportedFileTypes.includes(fileExtension)) {
                        console.error(`[UPLOAD] 文件 ${file.name} 类型不支持 (${fileExtension})`);
                        this.toast.error(`文件 ${file.name} 类型不支持 (仅支持${supportedFileTypes.join(', ')})`);
                        failed++;
                        continue;
                    }
                    
                    // 构建完整的元数据格式
            // 不指定分类，让后端使用自己的自动分类器
            console.log(`[UPLOAD] 不指定分类，由后端进行自动分类 | 文件名: ${file.name}`);
            
            const metadata = {
                title: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名作为标题
                filename: file.name,
                file_type: file.type || 'application/octet-stream',
                size: file.size,
                description: ''
            };

                    // 上传前添加更长的延迟，避免服务器压力过大
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    console.log(`[UPLOAD] 文件 ${file.name} 元数据:`, metadata);
                    const result = await this.api.uploadFile(file, metadata);
                    console.log(`[UPLOAD] 文件 ${file.name} 上传结果:`, result);
                    
                    if (result.status === 'success') {
                        success++;
                        console.log(`[UPLOAD] 文件 ${file.name} 上传成功`);
                    } else if (result.status === 'duplicate') {
                        console.log(`[UPLOAD] 文件 ${file.name} 已存在，跳过`);
                        success++;
                    } else {
                        failed++;
                        console.error(`[UPLOAD] 文件 ${file.name} 上传失败:`, result.message || '未知错误');
                        this.toast.error(`文件 ${file.name} 上传失败: ${result.message || '未知错误'}`);
                    }
                } catch (error) {
                    console.error(`[UPLOAD] 文件 ${file.name} 上传失败:`, error);
                    console.error(`[UPLOAD] 错误详情:`, error.stack);
                    
                    if (error.message.includes('422')) {
                        console.error(`[UPLOAD] HTTP 422错误: 服务器无法处理请求，可能是元数据格式错误或文件问题`);
                        this.toast.error(`文件 ${file.name} 上传失败: 服务器无法处理请求 (HTTP 422)`);
                    } else {
                        this.toast.error(`文件 ${file.name} 上传失败: ${error.message}`);
                    }
                    failed++;
                }
                
                completed++;
                const percent = Math.round((completed / this.pendingUploads.length) * 100);
                
                progressFill.style.width = `${percent}%`;
                progressPercent.textContent = `${percent}%`;
            }

            // 重置界面
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                开始上传 (${this.currentFiles.length})
            `;
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
                progressPercent.textContent = '0%';
            }, 1000);

            // 显示结果
            if (success > 0) {
                this.toast.success(`成功上传 ${success} 个文件`);
            }
            if (failed > 0) {
                this.toast.error(`上传失败 ${failed} 个文件`);
            }

            // 清空文件列表并刷新
            console.log('[UPLOAD] 清空文件列表并刷新文档');
            this.clearFileList();
            console.log('[UPLOAD] 开始加载文档列表');
            await this.loadDocuments();
            console.log('[UPLOAD] 文档列表刷新完成');
        }

        // 工具方法：转义HTML
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 工具方法：格式化文件大小
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // 测试自动分类功能
        testAutoClassify() {
            console.log('=================== 开始自动分类测试 ===================');
            
            // 测试用例：包含小分类关键词的文件名，涵盖各种常见的命名模式
            const testFiles = [
                // 基础命名模式
                '技术架构设计文档.pdf',
                'API接口规范.docx',
                '数据库设计文档.xlsx',
                '员工手册.pdf',
                '产品需求文档.docx',
                '项目管理计划.pptx',
                '营销策划方案.pdf',
                '行政管理制度.docx',
                
                // 包含版本号和日期
                '技术架构设计_v2.1.pdf',
                'API接口规范_v1.0_final.docx',
                '数据库设计文档_20230515.xlsx',
                '员工手册_2023版.pdf',
                '产品需求文档_Update.docx',
                '项目管理计划_RevA.pptx',
                '营销策划方案_Draft.pdf',
                '行政管理制度_20240101.docx',
                
                // 包含额外描述
                '公司技术架构设计文档_final.pdf',
                '系统API接口规范与开发指南.docx',
                '客户数据库设计文档_优化版.xlsx',
                '新员工入职手册_2024.pdf',
                '电商平台产品需求文档_完整版.docx',
                '软件开发项目管理计划_详细版.pptx',
                '2024年度营销策划方案_最终版.pdf',
                '公司行政管理制度_修订版.docx',
                
                // 使用英文或混合命名
                'Tech_Architecture_Design.pdf',
                'API_Interface_Spec_v1.2.docx',
                'Database_Design_Doc_2023.xlsx',
                'Employee_Handbook_2024.pdf',
                'Product_Requirements_Document.docx',
                'Project_Management_Plan.pptx',
                'Marketing_Plan_2024.pdf',
                'Admin_Rules_Regulations.docx',
                
                // 特殊情况和边缘案例
                '架构设计文档.pdf',
                '系统接口规范.docx',
                '数据设计文档.xlsx',
                '人事手册.pdf',
                '产品需求说明书.docx',
                '项目计划.pptx',
                '营销方案.pdf',
                '行政制度.docx'
            ];
            
            // 执行测试
            testFiles.forEach(fileName => {
                console.log(`\n测试文件名: ${fileName}`);
                const result = this.autoClassify(fileName);
                console.log(`分类结果: ${result}`);
                
                if (result) {
                    const majorCategory = this.categoryManager.getMajorCategory(result);
                    console.log(`对应大类: ${majorCategory}`);
                } else {
                    console.log('无匹配分类');
                }
            });
            
            console.log('\n=================== 自动分类测试结束 ===================');
        }
    }

    // 将 FileManager 挂载到全局对象
    window.FileManager = FileManager;

})();