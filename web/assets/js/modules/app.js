(function() {
    'use strict';

    //不要修改
    class App {
        constructor() {
            console.log('[APP] 🚀 初始化应用');
            
            // 初始化各个管理器
            this.api = new window.APIClient();
            this.toast = new window.ToastManager();
            this.categoryManager = new window.CategoryManager();
            this.fileManager = new window.FileManager(this.api, this.toast, this.categoryManager);
            this.chatManager = new window.ChatManager(this.api, this.toast);
            this.docGenManager = new window.DocGenManager(this.api, this.toast);
            
            this.currentFiles = [];
            this.isInitialized = false;
            this.componentsLoaded = false;
            this.eventsBound = false; // 添加标志位，确保事件只被绑定一次
        }
        
        async init() {
            if (this.isInitialized) {
                console.log('[APP] 应用已经初始化，跳过重复初始化');
                return;
            }
            
            console.log('[APP] 🚀 应用初始化开始 - 时间:', new Date().toISOString());
            console.log('[APP] 初始化的app实例:', this);
            console.log('[APP] 初始化前的DOM状态:');
            console.log('[APP] - document.readyState:', document.readyState);
            console.log('[APP] - window.onload:', typeof window.onload);
            console.log('[APP] - window.AppInit:', window.AppInit);
            console.log('[APP] - docGenManager实例:', this.docGenManager);
            console.log('[APP] - docGenManager.isInitialized:', this.docGenManager.isInitialized);
            
            // 加载HTML组件
            await this.loadComponents();
            
            // 初始化全局状态
            this.initGlobalState();
            
            // 使用全局状态管理系统初始化应用
            if (window.AppInit && typeof window.AppInit.init === 'function') {
                console.log('[APP] 使用AppInit进行初始化');
                
                // 注册初始化回调
                window.AppInit.onInit(async () => {
                    console.log('[APP] AppInit回调执行');
                    console.log('[APP] - 回调中的docGenManager实例:', this.docGenManager);
                    console.log('[APP] - 回调中的docGenManager.isInitialized:', this.docGenManager.isInitialized);
                    
                    // 绑定基础事件
                    this.bindEvents();
                    
                    // 调用RAG事件初始化
                    this.chatManager.initRagEvents();
                    
                    // 初始化文档生成功能
                    this.docGenManager.init();
                    
                    // 连接检查
                    await this.checkConnection();
                    
                    // 加载分类
                    await this.loadCategories();
                    
                    // 更新分类标签
                    this.updateCategoryTabs();
                    
                    // 加载文档
                    this.fileManager.loadDocuments();
                    
                    // 加载分类统计
                    this.fileManager.loadCategoryStats();
                    
                    // 恢复保存的设置
                    this.restoreSettings();
                    
                    // 恢复上次访问的标签页
                    this.restoreLastActiveTab();
                    
                    console.log('[INIT] 🎉 应用初始化全部完成!');
                    
                    this.isInitialized = true;
                });
                
                // 初始化应用
                await window.AppInit.init();
            } else {
                // AppInit不可用时使用传统初始化方式
                console.log('[INIT] AppInit不可用，使用传统初始化方式');
                
                // 绑定基础事件
                this.bindEvents();
                
                // 调用RAG事件初始化
                this.chatManager.initRagEvents();
                
                // 初始化文档生成功能
                this.docGenManager.init();
                
                // 连接检查
                await this.checkConnection();
                
                // 加载分类
                await this.loadCategories();
                
                // 更新分类标签
                this.updateCategoryTabs();
                
                // 加载文档
                this.fileManager.loadDocuments();
                
                // 加载分类统计
                this.fileManager.loadCategoryStats();
                
                // 恢复保存的设置
                this.restoreSettings();
                
                // 恢复上次访问的标签页
                this.restoreLastActiveTab();
                
                console.log('[INIT] 🎉 应用初始化全部完成!');
                
                this.isInitialized = true;
            }
        }
        
        // 初始化全局状态
        initGlobalState() {
            console.log('[STATE] 初始化全局状态');
            
            // 设置默认状态
            if (window.StateManager) {
                // 检查是否有保存的状态
                const savedTab = window.StateManager.getState('uiState.lastActiveTab');
                if (savedTab) {
                    console.log('[STATE] 找到保存的标签页:', savedTab);
                    window.StateManager.setState('currentTab', savedTab);
                } else {
                    console.log('[STATE] 使用默认标签页: chat');
                    window.StateManager.setState('currentTab', 'chat');
                }
                
                // 标记应用已初始化
                window.StateManager.setState('uiState.isInitialized', true);
            }
        }
        
        // 加载HTML组件
        async loadComponents() {
            console.log('[COMPONENTS] 开始加载HTML组件');
            
            if (this.componentsLoaded) {
                console.log('[COMPONENTS] 组件已经加载，跳过重复加载');
                return;
            }
            
            // 定义需要加载的组件
            const components = [
                // { id: 'sidebar', elementId: 'sidebar-container', path: 'components/sidebar.html' },
                // { id: 'topbar', elementId: 'topbar-container', path: 'components/topbar.html' },
                { id: 'chat-panel', elementId: 'chat-panel', path: 'components/chat-panel.html' },
                { id: 'search-panel', elementId: 'search-panel', path: 'components/search-panel.html' },
                // { id: 'documents-panel', elementId: 'documents-panel', path: 'components/documents-panel.html' }, // 已经在index.html中直接定义
                // { id: 'nlp-panel', elementId: 'nlp-panel', path: 'components/nlp-panel.html' }, // 已经在index.html中直接定义
                { id: 'docgen-panel', elementId: 'docgen-panel', path: 'components/docgen-panel.html' }, // 使用组件化方式加载文档生成面板
                // { id: 'settings-panel', elementId: 'settings-panel', path: 'components/settings-panel.html' } // 已经在index.html中直接定义
            ];
            
            try {
                // 并行加载所有组件
                const loadPromises = components.map(async (component) => {
                    try {
                        console.log(`[COMPONENTS] 加载组件: ${component.id} - ${component.path}`);
                        
                        // 使用fetch获取组件内容
                        const response = await fetch(component.path);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const html = await response.text();
                        
                        // 查找目标元素
                        const targetElement = document.getElementById(component.elementId);
                        if (targetElement) {
                            // 替换目标元素的内容
                            targetElement.innerHTML = html;
                            console.log(`[COMPONENTS] ✓ 组件 ${component.id} 加载成功`);
                        } else {
                            console.error(`[COMPONENTS] ✗ 未找到目标元素: ${component.elementId}`);
                        }
                    } catch (error) {
                        console.error(`[COMPONENTS] ✗ 加载组件 ${component.id} 失败:`, error);
                    }
                });
                
                // 等待所有组件加载完成
                await Promise.all(loadPromises);
                
                this.componentsLoaded = true;
                console.log('[COMPONENTS] ✓ 所有组件加载完成');
            } catch (error) {
                console.error('[COMPONENTS] ✗ 组件加载过程中发生错误:', error);
            }
        }
        
        // 恢复上次访问的标签页
        restoreLastActiveTab() {
            console.log('[STATE] 恢复上次访问的标签页');
            
            if (window.StateManager) {
                const lastActiveTab = window.StateManager.getState('uiState.lastActiveTab');
                const currentTab = window.StateManager.getState('currentTab');
                
                if (lastActiveTab && lastActiveTab !== currentTab) {
                    console.log('[STATE] 切换到上次访问的标签页:', lastActiveTab);
                    this.switchTab(lastActiveTab);
                } else {
                    console.log('[STATE] 当前标签页已是最新状态:', currentTab);
                }
            }
        }

        async checkConnection() {
            const statusEl = document.getElementById('connectionStatus');
            try {
                await this.api.getDocuments();
                statusEl.innerHTML = `
                    <span class="status-dot"></span>
                    <span class="status-text">已连接</span>
                `;
                statusEl.classList.remove('disconnected');
            } catch (error) {
                statusEl.innerHTML = `
                    <span class="status-dot" style="background: #dc3545;"></span>
                    <span class="status-text">未连接</span>
                `;
                statusEl.classList.add('disconnected');
            }
        }

        bindEvents() {
            // 检查是否已经绑定过事件，避免重复绑定
            if (this.eventsBound) {
                console.log('[APP] 事件已经绑定，跳过重复绑定');
                return;
            }
            
            // 导航事件
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => this.switchTab(item.dataset.tab));
            });
            
            // 连接状态检查事件
            const connectionStatusEl = document.getElementById('connectionStatus');
            if (connectionStatusEl) {
                connectionStatusEl.addEventListener('click', async () => {
                    console.log('[EVENT] 连接状态按钮点击事件触发');
                    await this.checkConnection();
                });
            }

            // 搜索事件
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    const query = document.getElementById('searchInput').value.trim();
                    console.log('[APP] 搜索按钮点击，开始搜索:', query);
                    this.chatManager.performSearch();
                });
            }
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const query = e.target.value.trim();
                        console.log('[APP] Enter键按下，开始搜索:', query);
                        this.chatManager.performSearch();
                    }
                });
            }

            // 文档管理事件
            const refreshDocsBtn = document.getElementById('refreshDocsBtn');
            if (refreshDocsBtn) {
                refreshDocsBtn.addEventListener('click', async () => {
                    await this.fileManager.loadDocuments();
                    await this.fileManager.loadCategoryStats();
                });
            }
            
            // 标记事件绑定完成
            this.eventsBound = true;
            console.log('[APP] ✓ 所有事件绑定完成');
            
            
            // 使用事件委托绑定分类标签点击事件
            const majorTabsContainer = document.getElementById('majorCategoryTabs');
            if (majorTabsContainer) {
                majorTabsContainer.addEventListener('click', (e) => {
                    const tab = e.target.closest('.category-tab');
                    if (tab) {
                        const category = tab.dataset.category;
                        this.filterByCategory(category);
                    }
                });
            }

            // 使用事件委托绑定删除按钮点击事件，避免元素替换导致的重复绑定
            const deleteDocBtn = document.getElementById('deleteDocBtn');
            if (deleteDocBtn) {
                // 移除可能存在的旧事件监听器（防御性编程）
                deleteDocBtn.replaceWith(deleteDocBtn.cloneNode(true));
                
                // 重新获取删除按钮元素并绑定事件
                const newDeleteDocBtn = document.getElementById('deleteDocBtn');
                newDeleteDocBtn.addEventListener('click', () => {
                    console.log('[EVENT] 删除按钮点击事件触发');
                    this.fileManager.deleteSelectedDocuments();
                });
                console.log('[EVENT] 删除按钮事件监听器已绑定');
            }

            // 视图切换事件
            const viewBtns = document.querySelectorAll('.view-btn');
            viewBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // 使用currentTarget确保获取的是按钮元素，而不是内部的SVG或文本
                    const view = e.currentTarget.dataset.view;
                    this.fileManager.switchView(view);
                    
                    // 更新按钮状态
                    viewBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            const selectAllDocs = document.getElementById('selectAllDocs');
            if (selectAllDocs) {
                selectAllDocs.addEventListener('change', (e) => this.fileManager.selectAllDocuments(e.target.checked));
            }

            const searchDocBtn = document.getElementById('searchDocBtn');
            const docSearchInput = document.getElementById('docSearchInput');
            
            // 搜索按钮事件处理
            if (searchDocBtn) {
                searchDocBtn.addEventListener('click', () => {
                    if (docSearchInput) {
                        this.fileManager.performDocSearch();
                    }
                });
            }

            // 搜索输入框事件处理
            if (docSearchInput) {
                docSearchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.fileManager.performDocSearch();
                });
            }

            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.fileManager.applyFilters());
            }

            const timeFilter = document.getElementById('timeFilter');
            if (timeFilter) {
                timeFilter.addEventListener('change', () => this.fileManager.applyFilters());
            }

            // 分类筛选事件
            const categoryFilter = document.getElementById('categorySelector');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => this.fileManager.applyFilters());
            }

            const addCustomCategoryBtn = document.getElementById('addCustomCategoryBtn');
            if (addCustomCategoryBtn) {
                addCustomCategoryBtn.addEventListener('click', () => this.fileManager.addCustomCategory());
            }

            const clearFilesBtn = document.getElementById('clearFilesBtn');
            if (clearFilesBtn) {
                clearFilesBtn.addEventListener('click', () => this.fileManager.clearFileList());
            }

            // 文件上传事件
            let fileInput = document.getElementById('fileInput');
            if (fileInput) {
                // 使用更可靠的方式防止事件监听器重复绑定
                if (!fileInput._eventsBound) {
                    // 阻止点击事件冒泡，防止重复打开文件选择框
                    fileInput.addEventListener('click', (e) => {
                        console.log('[UPLOAD] 文件输入框点击事件触发');
                        e.stopPropagation();
                        // 不要阻止默认行为，否则文件选择对话框不会弹出
                    });
                    
                    const handleFileChange = (e) => {
                        console.log('[UPLOAD] 文件输入框change事件触发');
                        console.log('[UPLOAD] 选中的文件数量:', e.target.files.length);
                        e.stopPropagation();
                        e.preventDefault();
                        
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                            console.log('[UPLOAD] 开始处理选中的文件');
                            // 清空现有文件列表，只保留本次选择的文件
                            console.log('[UPLOAD] 清空现有文件列表');
                            this.fileManager.clearFileList();
                            console.log('[UPLOAD] 现有文件列表已清空');
                            files.forEach(file => {
                                console.log('[UPLOAD] ===== 开始处理单个文件 =====');
                                console.log('[UPLOAD] 文件名:', file.name);
                                console.log('[UPLOAD] 文件大小:', file.size, '字节');
                                console.log('[UPLOAD] 调用fileManager.addFile开始');
                                this.fileManager.addFile(file);
                                console.log('[UPLOAD] 调用fileManager.addFile完成');
                                console.log('[UPLOAD] ===== 单个文件处理结束 =====');
                            });
                            
                            // 清空文件输入框，但要避免再次触发change事件
                            console.log('[UPLOAD] 准备清空文件输入框');
                            // 直接设置value为''来清空文件输入框，不会触发change事件
                            fileInput.value = '';
                            console.log('[UPLOAD] 文件输入框已重置');
                        }
                    };
                    
                    fileInput.addEventListener('change', handleFileChange);
                    console.log('[UPLOAD] 文件输入框事件监听器已绑定');
                    fileInput._eventsBound = true;
                } else {
                    console.log('[UPLOAD] 文件输入框事件监听器已存在，跳过绑定');
                }
            }

            const uploadBtn = document.getElementById('uploadBtn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    this.fileManager.uploadFiles();
                });
            } else {
                console.error('[EVENT] 上传按钮元素不存在');
            }

            // 上传区域点击事件
            const uploadZone = document.getElementById('uploadZone');
            if (uploadZone) {
                // 标记事件是否已绑定
                if (!uploadZone.dataset.eventsBound) {
                    uploadZone.addEventListener('click', (e) => {
                        console.log('[UPLOAD] 上传区域点击事件触发');
                        console.log('[UPLOAD] 点击目标:', e.target);
                        console.log('[UPLOAD] 点击目标ID:', e.target.id);
                        console.log('[UPLOAD] 点击目标类名:', e.target.className);
                        
                        e.stopPropagation();
                        e.preventDefault();
                        
                        // 检查点击是否来自文件输入元素本身或其后代元素，如果是则不执行任何操作
                        if (e.target.closest('#fileInput')) {
                            console.log('[UPLOAD] 点击来自文件输入框本身或其后代，不执行任何操作');
                            return;
                        }
                        
                        console.log('[UPLOAD] 上传区域被点击，触发文件选择');
                        const fileInput = document.getElementById('fileInput');
                        if (fileInput) {
                            console.log('[UPLOAD] 找到文件输入框，触发点击');
                            fileInput.click();
                        } else {
                            console.error('[UPLOAD] 文件输入元素不存在');
                        }
                    });
                    
                    // 拖拽事件
                    uploadZone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        uploadZone.classList.add('dragover');
                    });

                    uploadZone.addEventListener('dragleave', (e) => {
                        e.preventDefault();
                        uploadZone.classList.remove('dragover');
                    });

                    uploadZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        uploadZone.classList.remove('dragover');
                        
                        const files = Array.from(e.dataTransfer.files);
                        console.log('[UPLOAD] 拖拽文件数量:', files.length);
                        
                        // 清空现有文件列表，只保留本次拖拽的文件
                        this.fileManager.clearFileList();
                        files.forEach(file => {
                            this.fileManager.addFile(file);
                        });
                    });
                    
                    uploadZone.dataset.eventsBound = 'true';
                }
            } else {
                console.error('[EVENT] 上传区域元素不存在');
            }

            // 详情模态框事件
            const closeDetailBtn = document.getElementById('closeDetail');
            if (closeDetailBtn) {
                closeDetailBtn.addEventListener('click', () => {
                    const resultDetail = document.getElementById('resultDetail');
                    if (resultDetail) {
                        resultDetail.style.display = 'none';
                    }
                });
            }

            const closeGenDetailBtn = document.getElementById('component-closeGenDetail');
            if (closeGenDetailBtn) {
                closeGenDetailBtn.addEventListener('click', () => {
                    const genResultDetail = document.getElementById('component-genResultDetail');
                    if (genResultDetail) {
                        genResultDetail.style.display = 'none';
                    }
                });
            }

            // 侧边栏事件
            console.log('[DEBUG] 尝试获取sidebarToggle元素...');
            let sidebarToggle = document.getElementById('sidebarToggle');
            console.log('[DEBUG] 获取到的sidebarToggle元素:', sidebarToggle);
            
            if (sidebarToggle) {
                console.log('[DEBUG] 为sidebarToggle元素添加点击事件监听器...');
                
                // 移除可能存在的旧事件监听器（防御性编程）
                sidebarToggle.replaceWith(sidebarToggle.cloneNode(true));
                
                // 重新获取删除按钮元素并绑定事件
                sidebarToggle = document.getElementById('sidebarToggle');
                
                sidebarToggle.addEventListener('click', () => {
                    console.log('[DEBUG] sidebarToggle点击事件触发！');
                    const sidebar = document.querySelector('.sidebar');
                    const app = document.getElementById('app');
                    console.log('[DEBUG] 获取到的sidebar元素:', sidebar);
                    console.log('[DEBUG] 获取到的app元素:', app);
                    
                    if (sidebar && app) {
                        console.log('[DEBUG] 切换sidebar的collapsed类');
                        console.log('[DEBUG] 切换前的classList:', sidebar.classList);
                        sidebar.classList.toggle('collapsed');
                        console.log('[DEBUG] 切换后的classList:', sidebar.classList);
                        
                        console.log('[DEBUG] 切换app的sidebar-collapsed类');
                        console.log('[DEBUG] 切换前的app classList:', app.classList);
                        app.classList.toggle('sidebar-collapsed');
                        console.log('[DEBUG] 切换后的app classList:', app.classList);
                        
                        console.log('侧边栏切换成功，右侧内容区域自适应调整');
                    } else {
                        console.error('未找到侧边栏或app元素');
                    }
                });
                
                // 添加鼠标悬停和焦点样式（可选，用于调试）
                sidebarToggle.style.outline = '2px solid transparent';
                sidebarToggle.addEventListener('focus', () => {
                    sidebarToggle.style.outline = '2px solid blue';
                    console.log('[DEBUG] sidebarToggle获得焦点');
                });
                
                sidebarToggle.addEventListener('mouseenter', () => {
                    sidebarToggle.style.outline = '2px solid green';
                    console.log('[DEBUG] 鼠标进入sidebarToggle');
                });
                
                sidebarToggle.addEventListener('mouseleave', () => {
                    sidebarToggle.style.outline = '2px solid transparent';
                    console.log('[DEBUG] 鼠标离开sidebarToggle');
                });
                
                console.log('[INIT] sidebarToggle 事件绑定成功');
            } else {
                console.error('[INIT] sidebarToggle 元素不存在');
                
                // 尝试使用querySelector查找
                const sidebarToggleByClass = document.querySelector('.sidebar-toggle');
                console.log('[DEBUG] 使用querySelector查找的结果:', sidebarToggleByClass);
                
                if (sidebarToggleByClass) {
                    console.log('[DEBUG] 为找到的sidebar-toggle类元素添加点击事件监听器...');
                    
                    sidebarToggleByClass.addEventListener('click', () => {
                        console.log('[DEBUG] sidebar-toggle类元素点击事件触发！');
                        const sidebar = document.querySelector('.sidebar');
                        const app = document.getElementById('app');
                        console.log('[DEBUG] 获取到的sidebar元素:', sidebar);
                        console.log('[DEBUG] 获取到的app元素:', app);
                        
                        if (sidebar && app) {
                            console.log('[DEBUG] 切换sidebar的collapsed类');
                            console.log('[DEBUG] 切换前的classList:', sidebar.classList);
                            sidebar.classList.toggle('collapsed');
                            console.log('[DEBUG] 切换后的classList:', sidebar.classList);
                            
                            console.log('[DEBUG] 切换app的sidebar-collapsed类');
                            console.log('[DEBUG] 切换前的app classList:', app.classList);
                            app.classList.toggle('sidebar-collapsed');
                            console.log('[DEBUG] 切换后的app classList:', app.classList);
                            
                            console.log('侧边栏切换成功，右侧内容区域自适应调整');
                        } else {
                            console.error('未找到侧边栏或app元素');
                        }
                    });
                    
                    console.log('[INIT] sidebar-toggle类元素事件绑定成功');
                }
            }

            const menuToggle = document.getElementById('menuToggle');
            if (menuToggle) {
                menuToggle.addEventListener('click', () => {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) sidebar.classList.remove('collapsed');
                });
                console.log('[INIT] menuToggle 事件绑定成功');
            }

            // 文件拖拽事件
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.classList.add('drag-over');
                });

                uploadArea.addEventListener('dragleave', () => {
                    uploadArea.classList.remove('drag-over');
                });

                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('drag-over');
                    const files = Array.from(e.dataTransfer.files);
                    files.forEach(file => this.fileManager.addFile(file));
                });
            }
            // 文档生成搜索事件 - 已移至docgen.js
            // 避免事件监听器冲突
            
            // NLP工具事件
            document.getElementById('detectBtn').addEventListener('click', () => this.detectLanguage());
            document.getElementById('segmentBtn').addEventListener('click', () => this.segmentText());
        }



        async performGenSearch() {
            const query = document.getElementById('genSearchQuery').value.trim();
            const resultsContainer = document.getElementById('genSearchResults');
            
            if (!query) {
                resultsContainer.innerHTML = '<div class="alert alert-warning">请输入搜索关键词</div>';
                return;
            }
            
            try {
                // 显示加载状态
                resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
                
                // 获取用户设置的检索数量
                const settings = window.StateManager?.getState('modelSettings') || {};
                const retrieveCount = settings.retrieveCount || '5';
                const k = retrieveCount === 'all' ? 10000 : parseInt(retrieveCount);
                
                console.log('[GEN-SEARCH] 使用检索设置:', { retrieveCount, k });
                
                // 使用精确搜索模式调用ragRetrieve API
                const response = await this.api.ragRetrieve(query, {
                    k: k,
                    content_type: 'all',
                    search_mode: 'exact'
                });
                
                console.log('[DEBUG] API响应完整数据:', response);
                
                // 从响应中提取results数组
                const results = response?.results || [];
                
                console.log('[DEBUG] 提取的results数组:', results);
                
                // 显示搜索结果
                this.displayGenSearchResults(results, resultsContainer);
            } catch (error) {
                console.error('文档生成搜索失败:', error);
                resultsContainer.innerHTML = '<div class="alert alert-danger">搜索失败，请重试</div>';
            }
        }
        
        displayGenSearchResults(results, container) {
        console.log('[DEBUG] 搜索结果数据:', results);
        if (!results || results.length === 0) {
            container.innerHTML = '<div class="alert alert-info">未找到相关内容</div>';
            return;
        }
            
            const html = `
                <h4 class="search-results-title">搜索结果 (${results.length})</h4>
                <div class="gen-search-results-list">
                    ${results.map((result, index) => `
                        <div class="gen-search-result-item" data-index="${index}">
                            <div class="gen-result-title">
                                <strong>${result.metadata?.filename || result.filename || '未命名文档'}</strong>
                            </div>
                            <div class="gen-result-content">
                                ${result.content || ''}
                            </div>
                            <div class="gen-result-meta">
                                <span class="score">相关度: ${(result.score * 100).toFixed(2)}%</span>
                                <span class="page">块索引: ${result.metadata?.chunk_index || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }
        
        switchTab(tabName) {
            console.log('[SWITCH] 切换到标签:', tabName);
            
            // 从全局状态获取当前标签
            const currentTab = window.StateManager ? window.StateManager.getState('currentTab') : 'chat';
            
            const tabTitles = {
                'chat': '智能对话',
                'search': '语义搜索',
                'documents': '文档管理',
                'nlp': 'NLP工具',
                'docgen': '文档生成',
                'settings': '系统设置'
            };

            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle && tabTitles[tabName]) {
                pageTitle.textContent = tabTitles[tabName];
                console.log('[SWITCH] 页面标题已更新为:', tabTitles[tabName]);
            }

            // 隐藏所有面板 - 移除active类而不是直接设置display
            document.querySelectorAll('.panel').forEach(panel => {
                panel.classList.remove('active');
                console.log('[SWITCH] 隐藏面板:', panel.id);
            });

            // 显示目标面板 - 添加active类而不是直接设置display
            const targetPanel = document.getElementById(`${tabName}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                console.log('[SWITCH] 显示面板:', targetPanel.id);
                
                // 触发一个微任务来确保DOM更新后再进行布局计算
                setTimeout(() => {
                    // 强制重新计算布局
                    targetPanel.offsetHeight;
                }, 0);
            } else {
                console.error('[SWITCH] 未找到面板:', `${tabName}-panel`);
            }

            // 更新导航状态
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
                console.log('[SWITCH] 激活导航项:', activeNavItem);
            } else {
                console.error('[SWITCH] 未找到导航项:', `[data-tab="${tabName}"]`);
            }
            
            // 更新全局状态中的当前标签
            if (window.StateManager) {
                window.StateManager.setState('currentTab', tabName);
            }
            
            // 根据标签类型恢复对应的状态
            this.restoreTabState(tabName, currentTab);
            
            // 触发标签切换事件
            if (window.AppEvents) {
                window.AppEvents.emit('tabChanged', { tabName, previousTab: currentTab });
            }
        }
        
        // 恢复标签页对应的状态
        restoreTabState(tabName, previousTab) {
            console.log('[STATE] 恢复标签状态:', tabName, '前一个标签:', previousTab);
            
            switch (tabName) {
                case 'settings':
                    // 切换到设置标签时，恢复模型设置
                    console.log('[STATE] 恢复设置标签状态');
                    this.restoreModelSettings();
                    break;
                    
                case 'documents':
                    // 切换到文档管理时，刷新文档列表
                    console.log('[STATE] 恢复文档管理标签状态');
                    this.fileManager.loadDocuments();
                    this.fileManager.loadCategoryStats();
                    break;
                    
                case 'chat':
                    // 切换到聊天标签时，恢复聊天状态
                    console.log('[STATE] 恢复聊天标签状态');
                    // 可以在这里恢复聊天历史或其他聊天相关状态
                    break;
                    
                case 'search':
                    // 切换到搜索标签时，恢复搜索相关状态
                    console.log('[STATE] 恢复搜索标签状态');
                    // 可以在这里恢复搜索历史或其他搜索相关状态
                    break;
                    
                case 'nlp':
                case 'docgen':
                    // 切换到其他功能标签时的默认处理
                    console.log('[STATE] 恢复', tabName, '标签状态');
                    break;
                    
                default:
                    console.warn('[STATE] 未知标签类型:', tabName);
            }
            
            // 更新UI状态
            if (window.StateManager) {
                window.StateManager.setState('uiState.lastActiveTab', tabName);
            }
        }

        async loadCategories() {
            try {
                // 这里可以从API获取分类列表，目前使用固定的分类
                const categories = this.categoryManager.getAllCategories();
                const categorySelect = document.getElementById('docCategory');
                
                if (categorySelect) {
                    categorySelect.innerHTML = '<option value="">所有分类</option>' +
                        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
                }
                
                // 不再动态修改uploadCategorySelect，保留HTML中定义的完整结构
            } catch (error) {
                console.error('加载分类失败:', error);
            }
        }

        updateCategoryTabs() {
            const categories = this.categoryManager.getAllCategories();
            const majorCategories = this.categoryManager.getAllMajorCategories();
            
            // 更新大类标签
            const majorTabsContainer = document.getElementById('majorCategoryTabs');
            if (majorTabsContainer) {
                majorTabsContainer.innerHTML = majorCategories.map(majorCat => {
                    const info = this.categoryManager.getMajorCategoryInfo(majorCat);
                    return `
                        <div class="category-tab" data-category="${majorCat}">
                            <span class="category-icon">${info.icon}</span>
                            <span class="category-name">${majorCat}</span>
                        </div>
                    `;
                }).join('');
                // 事件委托已经在bindEvents中处理，不再需要在此绑定
            }
        }

        filterByCategory(majorCategory) {
            // 这里可以实现按大类过滤的逻辑
            console.log('过滤分类:', majorCategory);
            this.toast.info(`已切换到 ${majorCategory} 分类`);
        }

        async detectLanguage() {
            const input = document.getElementById('detectInput').value.trim();
            if (!input) {
                this.toast.warning('请输入要检测的文本');
                return;
            }

            try {
                const result = await this.api.detectLanguage(input);
                document.getElementById('detectResult').innerHTML = `
                    <p><strong>检测结果:</strong> ${result.language || '未知'}</p>
                    <p><strong>置信度:</strong> ${(result.confidence * 100).toFixed(1)}%</p>
                `;
            } catch (error) {
                this.toast.error('语言检测失败: ' + error.message);
            }
        }

        async segmentText() {
            const input = document.getElementById('segmentInput').value.trim();
            if (!input) {
                this.toast.warning('请输入要分词的文本');
                return;
            }

            try {
                const result = await this.api.segmentText(input);
                document.getElementById('segmentResult').innerHTML = `
                    <h4>分词结果:</h4>
                    <p>${result.segments.join(' | ')}</p>
                `;
            } catch (error) {
                this.toast.error('文本分词失败: ' + error.message);
            }
        }

        // 模型设置相关方法
        async handleSettingsProviderChange(provider) {
            console.log('[🔄函数进入] handleSettingsProviderChange - 提供商:', provider);
            console.log('[🔄函数进入] handleSettingsProviderChange - 调用时间:', new Date().toISOString());
            console.log('[🔄函数进入] handleSettingsProviderChange - this对象类型:', typeof this);
            
            console.log('[前端] handleSettingsProviderChange 开始，提供商:', provider);
            const modelNameSelect = document.getElementById('settingsModelName');
            console.log('[前端] 模型选择器元素:', modelNameSelect);

            // 获取当前保存的模型名称（如果存在）
            let savedModelName = '';
            if (window.AppStorage) {
                const savedSettings = window.AppStorage.get('settings');
                if (savedSettings) {
                    savedModelName = savedSettings.modelName || '';
                }
            } else {
                // 降级方案：直接使用localStorage
                try {
                    const savedSettings = localStorage.getItem('app_settings');
                    if (savedSettings) {
                        const settings = JSON.parse(savedSettings);
                        savedModelName = settings.modelName || '';
                    }
                } catch (e) {
                    console.warn('[前端] 解析保存的设置失败:', e);
                }
            }

            if (provider === 'ollama') {
                console.log('[前端] 选择Ollama提供商，加载模型列表');
                // 暂时显示加载状态，但不重置已有值
                modelNameSelect.innerHTML = '<option value="">加载中...</option>';
                console.log('[前端] 开始调用 refreshSettingsModelsList');
                await this.refreshSettingsModelsList();
                console.log('[前端] refreshSettingsModelsList 完成');
                
                // 如果有保存的模型名称，尝试恢复
                if (savedModelName) {
                    const option = Array.from(modelNameSelect.options).find(opt => opt.value === savedModelName);
                    if (option) {
                        modelNameSelect.value = savedModelName;
                        console.log('[前端] 恢复保存的模型:', savedModelName);
                    } else {
                        console.log('[前端] 保存的模型不存在，使用第一个可用模型');
                        if (modelNameSelect.options.length > 0) {
                            modelNameSelect.selectedIndex = 0;
                        }
                    }
                }
            } else if (provider === 'openai') {
                console.log('[前端] 选择OpenAI提供商，添加固定模型选项');
                const options = `
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="gpt-4">gpt-4</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-4o">gpt-4o</option>
                `;
                modelNameSelect.innerHTML = options;
                
                // 如果有保存的模型名称，尝试恢复
                if (savedModelName && savedModelName.trim() !== '') {
                    const option = Array.from(modelNameSelect.options).find(opt => opt.value === savedModelName);
                    if (option) {
                        modelNameSelect.value = savedModelName;
                        console.log('[前端] 恢复保存的OpenAI模型:', savedModelName);
                    } else {
                        console.log('[前端] 保存的OpenAI模型不存在，保持空选状态');
                        // 不自动选择默认模型，保持用户的原始选择
                        modelNameSelect.value = '';
                    }
                } else {
                    console.log('[前端] 没有保存的OpenAI模型名称，使用空选状态');
                    modelNameSelect.value = '';
                }
            } else if (provider === 'lmstudio') {
                console.log('[前端] 选择LM Studio提供商，加载模型列表');
                modelNameSelect.innerHTML = '<option value="">加载中...</option>';
                await this.refreshSettingsModelsList();
                
                // 如果有保存的模型名称，尝试恢复
                if (savedModelName) {
                    const option = Array.from(modelNameSelect.options).find(opt => opt.value === savedModelName);
                    if (option) {
                        modelNameSelect.value = savedModelName;
                        console.log('[前端] 恢复保存的LM Studio模型:', savedModelName);
                    } else {
                        console.log('[前端] 保存的LM Studio模型不存在，使用第一个可用模型');
                        if (modelNameSelect.options.length > 0) {
                            modelNameSelect.selectedIndex = 0;
                        }
                    }
                }
            } else {
                console.log('[前端] 选择其他提供商，显示空选项');
                modelNameSelect.innerHTML = '<option value="">请选择提供商</option>';
            }
        }

        async refreshSettingsModelsList() {
            console.log('[🔄函数进入] refreshSettingsModelsList - 开始时间:', new Date().toISOString());
            console.log('[🔄函数进入] refreshSettingsModelsList - this对象类型:', typeof this);
            
            console.log('[前端] refreshSettingsModelsList 开始');
            const provider = document.getElementById('settingsModelProvider').value;
            console.log('[前端] 当前提供商:', provider);
            const modelNameSelect = document.getElementById('settingsModelName');
            console.log('[前端] 模型选择器元素:', modelNameSelect);

            if (!provider) {
                console.log('[前端] 没有选择提供商，返回');
                return;
            }

            if (provider !== 'ollama' && provider !== 'lmstudio') {
                console.log('[前端] 不是Ollama或LM Studio提供商，跳过模型列表加载');
                return;
            }

            // 获取当前保存的模型名称（优先从全局状态获取）
            let savedModelName = '';
            if (window.StateManager) {
                const currentSettings = window.StateManager.getState('modelSettings');
                if (currentSettings && currentSettings.modelName) {
                    savedModelName = currentSettings.modelName;
                    console.log('[前端] 从全局状态找到保存的模型名称:', savedModelName);
                }
            }
            
            // 如果全局状态没有，尝试从AppStorage获取
            if (!savedModelName) {
                if (window.AppStorage) {
                    const savedSettings = window.AppStorage.get('settings');
                    if (savedSettings) {
                        savedModelName = savedSettings.modelName || '';
                        console.log('[前端] 从AppStorage找到保存的模型名称:', savedModelName);
                    }
                } else {
                    // 降级方案：直接使用localStorage
                    try {
                        const savedSettings = localStorage.getItem('app_settings');
                        if (savedSettings) {
                            const settings = JSON.parse(savedSettings);
                            savedModelName = settings.modelName || '';
                            console.log('[前端] 从localStorage找到保存的模型名称:', savedModelName);
                        }
                    } catch (e) {
                        console.warn('[前端] 解析保存的设置失败:', e);
                    }
                }
            }

            try {
                console.log('[🔄API调用] 准备调用 this.api.ragModels()');
                console.log('[🔄API调用] this.api对象类型:', typeof this.api);
                console.log('[🔄API调用] this.api.ragModels存在:', typeof this.api.ragModels);
                
                console.log('[前端] 开始调用 API 获取模型列表');
                console.log('[前端] API调用前的准备...');
                
                console.log('[🔄函数进入] 即将执行 await this.api.ragModels()');
                const models = await this.api.ragModels();
                console.log('[🔄函数返回] this.api.ragModels() 执行完成');
                console.log('[前端] API响应原始数据:', models);
                console.log('[前端] API响应类型:', typeof models);
                console.log('[前端] API响应是否为null:', models === null);
                console.log('[前端] API响应是否为undefined:', models === undefined);
                
                // 检查数据结构
                if (!models) {
                    console.error('[前端] API响应为空或null');
                    modelNameSelect.innerHTML = '<option value="">API响应为空</option>';
                    this.toast.error('API响应为空，请检查后端服务');
                    return;
                }
                
                console.log('[前端] 检查models对象...');
                console.log('[前端] models.providers 存在吗:', models.providers);
                console.log('[前端] models.providers 类型:', typeof models.providers);
                
                if (models.providers) {
                    console.log('[前端] models.providers 所有键:', Object.keys(models.providers));
                    console.log('[前端] models.providers.' + provider + ' 存在吗:', models.providers[provider]);
                    
                    if (models.providers[provider]) {
                        console.log('[前端] ' + provider + '提供商数据:', models.providers[provider]);
                        console.log('[前端] models.providers.' + provider + '.status:', models.providers[provider].status);
                        console.log('[前端] models.providers.' + provider + '.models 存在吗:', models.providers[provider].models);
                        console.log('[前端] models.providers.' + provider + '.models 类型:', typeof models.providers[provider].models);
                        
                        if (models.providers[provider].status === 'error') {
                            console.error('[前端] ' + provider + '服务返回错误:', models.providers[provider].error);
                            modelNameSelect.innerHTML = '<option value="">服务错误</option>';
                            this.toast.error(`${provider}服务错误: ${models.providers[provider].error}`);
                            return;
                        }
                    }
                }
                
                const providerName = provider === 'lmstudio' ? 'lmstudio' : 'ollama';
                if (models.providers && models.providers[providerName] && models.providers[providerName].models) {
                    const providerModels = models.providers[providerName].models;
                    console.log('[前端] ' + providerName + '模型列表:', providerModels);
                    console.log('[前端] ' + providerName + '模型数量:', providerModels.length);
                    console.log('[前端] ' + providerName + '模型列表类型:', typeof providerModels);

                    if (providerModels.length > 0) {
                        console.log('[前端] 开始添加模型选项到选择器');
                        const options = '<option value="">请选择模型</option>' +
                            providerModels.map(model => `<option value="${model}">${model}</option>`).join('');
                        modelNameSelect.innerHTML = options;
                        console.log('[前端] 模型选项添加完成');
                        console.log('[前端] 选择器当前选项数量:', modelNameSelect.options.length);
                        
                        // 尝试恢复保存的模型名称（严格模式）
                        if (savedModelName && savedModelName.trim() !== '') {
                            const option = Array.from(modelNameSelect.options).find(opt => opt.value === savedModelName);
                            if (option) {
                                modelNameSelect.value = savedModelName;
                                console.log('[前端] 成功恢复保存的模型:', savedModelName);
                            } else {
                                console.log('[前端] 保存的模型不在新列表中，保持空选状态');
                                // 不自动选择第一个，保持用户的原始选择
                                console.log('[前端] 保持空选状态，等待用户手动选择');
                            }
                        } else {
                            console.log('[前端] 没有保存的模型名称，使用空选状态');
                            // 保持空选状态，等待用户选择
                        }
                    } else {
                        console.log('[前端] ' + providerName + '模型列表为空');
                        modelNameSelect.innerHTML = '<option value="">暂无可用模型</option>';
                        this.toast.warning('暂无可用的' + providerName + '模型，请检查' + providerName + '服务');
                    }
                } else {
                    console.log('[前端] 未找到有效的模型数据结构');
                    console.log('[前端] 检查完整models对象:', JSON.stringify(models, null, 2));
                    modelNameSelect.innerHTML = '<option value="">未找到模型数据</option>';
                    this.toast.error('未找到有效的模型数据');
                }
            } catch (error) {
                console.error('[前端] 加载模型列表时发生错误:', error);
                console.error('[前端] 错误消息:', error.message);
                console.error('[前端] 错误堆栈:', error.stack);
                
                modelNameSelect.innerHTML = '<option value="">加载失败</option>';
                this.toast.error('加载模型列表失败: ' + error.message);
            }
        }

        // 废弃的方法，现在使用 restoreModelSettings 替代
        initModelSettings() {
            console.warn('[INIT] initModelSettings 方法已废弃，请使用 restoreModelSettings');
            console.log('[🔄函数进入] initModelSettings - 开始时间:', new Date().toISOString());
            console.log('[🔄函数进入] initModelSettings - this对象类型:', typeof this);
            
            // 直接调用新的恢复方法
            this.restoreModelSettings();
        }

        syncModelSettings() {
            console.log('[🔄函数进入] syncModelSettings - 开始时间:', new Date().toISOString());
            
            console.log('[SYNC] 同步模型设置');
            
            const provider = document.getElementById('settingsModelProvider').value;
            const modelName = document.getElementById('settingsModelName').value;
            
            console.log('[SYNC] 当前提供商:', provider);
            console.log('[SYNC] 当前模型:', modelName);
            
            // 保存模型设置
            this.saveSettings();
            
            console.log('[SYNC] 模型设置同步完成');
        }

        // 保存所有设置到 localStorage
        saveSettings() {
            console.log('[SETTINGS] 保存所有设置');
            
            const settings = {
                provider: document.getElementById('settingsModelProvider')?.value || '',
                modelName: document.getElementById('settingsModelName')?.value || '',
                retrieveCount: document.getElementById('settingsRetrieveCount')?.value || '5',
                streamOutput: document.getElementById('settingsStreamOutput')?.checked || false,
                includeContext: document.getElementById('settingsIncludeContext')?.checked || true,
                searchMode: document.getElementById('settingsSearchMode')?.value || 'regular'
            };
            
            // 使用AppStorage保存设置，同时更新全局状态
            if (window.AppStorage && window.StateManager) {
                const saved = window.AppStorage.set('settings', settings);
                if (saved) {
                    window.StateManager.updateState('modelSettings', settings);
                    console.log('[SETTINGS] 设置已保存:', settings);
                } else {
                    console.error('[SETTINGS] 保存设置失败');
                }
            } else {
                // 降级方案：直接使用localStorage
                try {
                    localStorage.setItem('app_settings', JSON.stringify(settings));
                    console.log('[SETTINGS] 使用降级方案保存设置:', settings);
                } catch (error) {
                    console.error('[SETTINGS] 保存设置失败:', error);
                }
            }
        }

        // 从 localStorage 恢复设置
        restoreSettings() {
            console.log('[SETTINGS] 恢复所有设置');
            
            try {
                // 使用AppStorage恢复设置
                let settings;
                if (window.AppStorage) {
                    settings = window.AppStorage.get('settings');
                    console.log('[SETTINGS] 使用AppStorage获取设置:', settings);
                } else {
                    // 降级方案：直接使用localStorage
                    const savedSettings = localStorage.getItem('app_settings');
                    if (savedSettings) {
                        settings = JSON.parse(savedSettings);
                        console.log('[SETTINGS] 使用降级方案获取设置:', settings);
                    }
                }
                
                if (settings) {
                    console.log('[SETTINGS] 找到保存的设置:', settings);
                    
                    // 自动更新旧的默认值
                    if (settings.retrieveCount === '5') {
                        console.log('[SETTINGS] 检测到旧的默认值5，自动更新为all');
                        settings.retrieveCount = 'all';
                    }
                    
                    // 恢复各种设置
                    const providerEl = document.getElementById('settingsModelProvider');
                    if (providerEl && settings.provider) {
                        providerEl.value = settings.provider;
                    }
                    
                    const modelNameEl = document.getElementById('settingsModelName');
                    if (modelNameEl && settings.modelName) {
                        modelNameEl.value = settings.modelName;
                    }
                    
                    const retrieveCountEl = document.getElementById('settingsRetrieveCount');
                    if (retrieveCountEl && settings.retrieveCount) {
                        retrieveCountEl.value = settings.retrieveCount;
                    }
                    
                    const streamOutputEl = document.getElementById('settingsStreamOutput');
                    if (streamOutputEl && typeof settings.streamOutput === 'boolean') {
                        streamOutputEl.checked = settings.streamOutput;
                    }
                    
                    const includeContextEl = document.getElementById('settingsIncludeContext');
                    if (includeContextEl && typeof settings.includeContext === 'boolean') {
                        includeContextEl.checked = settings.includeContext;
                    }
                    
                    const searchModeEl = document.getElementById('settingsSearchMode');
                    if (searchModeEl && settings.searchMode) {
                        searchModeEl.value = settings.searchMode;
                    }
                    
                    // 更新全局状态
                    if (window.StateManager) {
                        window.StateManager.updateState('modelSettings', settings);
                    }
                    
                    // 保存更新后的设置
                    this.saveSettings();
                    
                    console.log('[SETTINGS] 设置恢复完成');
                } else {
                    console.log('[SETTINGS] 没有找到保存的设置，使用默认值');
                }
            } catch (error) {
                console.error('[SETTINGS] 恢复设置失败:', error);
            }
        }

        // 恢复模型设置并绑定事件
        restoreModelSettings() {
            console.log('[🔄函数进入] restoreModelSettings - 开始时间:', new Date().toISOString());
            
            // 先恢复设置
            this.restoreSettings();
            
            console.log('[INIT] 恢复模型设置');
            console.log('[INIT] 恢复时间:', new Date().toISOString());
            
            // 绑定模型提供商变更事件
            const settingsModelProvider = document.getElementById('settingsModelProvider');
            if (settingsModelProvider) {
                // 保存当前选择值，避免在重新绑定事件时丢失
                const currentProviderValue = settingsModelProvider.value;
                
                // 移除旧的事件监听器，添加新的事件监听器
                const newProviderSelect = settingsModelProvider.cloneNode(true);
                settingsModelProvider.parentNode.replaceChild(newProviderSelect, settingsModelProvider);
                
                // 恢复保存的选择值
                newProviderSelect.value = currentProviderValue;
                
                // 绑定新的事件监听器
                newProviderSelect.addEventListener('change', async (e) => {
                    console.log('[🔄函数进入] settingsModelProvider change事件触发');
                    console.log('[🔄函数进入] 事件目标:', e.target);
                    console.log('[🔄函数进入] 选择的新值:', e.target.value);
                    console.log('[🔄函数进入] 选择时间:', new Date().toISOString());
                    
                    // 先处理提供商变更
                    await this.handleSettingsProviderChange(e.target.value);
                    
                    // 保存设置
                    this.saveSettings();
                });
            }
            
            // 绑定模型名称变更事件
            const settingsModelName = document.getElementById('settingsModelName');
            if (settingsModelName) {
                // 保存当前选择值，避免在重新绑定事件时丢失
                const currentModelValue = settingsModelName.value;
                
                const newModelSelect = settingsModelName.cloneNode(true);
                settingsModelName.parentNode.replaceChild(newModelSelect, settingsModelName);
                
                // 恢复保存的选择值
                newModelSelect.value = currentModelValue;
                
                newModelSelect.addEventListener('change', (e) => {
                    console.log('[🔄函数进入] settingsModelName change事件触发');
                    console.log('[🔄函数进入] 选择的新模型:', e.target.value);
                    this.saveSettings();
                });
            }
            
            // 绑定刷新按钮事件
            const settingsRefreshModelsBtn = document.getElementById('settingsRefreshModelsBtn');
            if (settingsRefreshModelsBtn) {
                settingsRefreshModelsBtn.addEventListener('click', async () => {
                    console.log('[🔄函数进入] settingsRefreshModelsBtn click事件触发');
                    await this.refreshSettingsModelsList();
                });
            }
            
            // 绑定其他设置变更事件
            this.bindSettingsChangeEvents();
            
            console.log('[INIT] 模型设置恢复完成');
        }

        // 绑定其他设置变更事件
        bindSettingsChangeEvents() {
            console.log('[SETTINGS] 绑定其他设置变更事件');
            
            // 检索片段数
            const retrieveCountEl = document.getElementById('settingsRetrieveCount');
            if (retrieveCountEl) {
                retrieveCountEl.addEventListener('change', () => this.saveSettings());
            }
            
            // 流式输出
            const streamOutputEl = document.getElementById('settingsStreamOutput');
            if (streamOutputEl) {
                streamOutputEl.addEventListener('change', () => this.saveSettings());
            }
            
            // 显示信息来源
            const includeContextEl = document.getElementById('settingsIncludeContext');
            if (includeContextEl) {
                includeContextEl.addEventListener('change', () => this.saveSettings());
            }
            
            // 搜索模式
            const searchModeEl = document.getElementById('settingsSearchMode');
            if (searchModeEl) {
                searchModeEl.addEventListener('change', () => this.saveSettings());
            }
            
            console.log('[SETTINGS] 设置变更事件绑定完成');
        }
    }

    if (typeof window !== 'undefined') {
        window.App = App;
        // 创建App实例并挂载到window.app，供全局访问
        window.app = new App();
        // 初始化应用
        window.app.init();
    }
})();