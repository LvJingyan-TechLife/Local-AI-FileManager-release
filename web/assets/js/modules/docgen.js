(function() {
    'use strict';

    // 文档生成管理器
    class DocGenManager {
        constructor(api, toast) {
            this.api = api;
            this.toast = toast;
            this.currentOutline = null;
            this.searchResults = [];
            this.isInitialized = false; // 添加标志位，确保初始化只执行一次
            this.eventsBound = false; // 添加标志位，确保事件只绑定一次
            this.generateCount = 0; // 用于计数generateOutline方法的调用次数
            this.isGenerating = false; // 用于防止并发调用
            this.lastGenerateTime = null; // 用于防止快速连续调用
        }

        // 初始化文档生成功能
        init() {
            if (this.isInitialized) {
                console.log('[DOCGEN] 已经初始化，跳过重复初始化');
                return;
            }
            console.log('[DOCGEN] 初始化文档生成功能', new Date().toISOString());
            console.trace('[DOCGEN] init调用栈');
            this.bindEvents();
            this.initSearchResults();
            this.isInitialized = true;
        }

        // 获取元素的完整路径，用于调试
        getElementPath(element) {
            if (!element) return '';
            
            let path = '';
            let current = element;
            
            while (current) {
                let selector = current.tagName.toLowerCase();
                if (current.id) {
                    selector += `#${current.id}`;
                    path = `${selector} > ${path}`;
                    break; // ID是唯一的，可以直接返回
                } else if (current.className) {
                    const classes = current.className.split(' ').filter(cls => cls);
                    selector += `.${classes.join('.')}`;
                }
                
                // 确定元素在父元素中的位置
                const siblings = current.parentNode ? [...current.parentNode.children] : [];
                const index = siblings.indexOf(current) + 1;
                if (siblings.length > 1) {
                    selector += `:nth-child(${index})`;
                }
                
                path = `${selector} > ${path}`;
                current = current.parentNode;
            }
            
            return path.replace(/ > $/, ''); // 移除末尾的 >
        }
        
        // 绑定事件
        bindEvents() {
            console.log('[DOCGEN] bindEvents被调用', new Date().toISOString());
            console.log('[DOCGEN] 当前eventsBound状态:', this.eventsBound);
            
            // 确保只绑定一次事件
            if (this.eventsBound) {
                console.log('[DOCGEN] 事件已经绑定，跳过重复绑定');
                return;
            }
            
            console.log('[DOCGEN] 开始绑定事件');
            
            // 初始化事件处理器引用
            if (!this.outlineClickHandler) {
                this.outlineClickHandler = () => {
                    console.log('[DOCGEN] 生成大纲按钮点击', new Date().toISOString());
                    console.trace('[DOCGEN] 点击事件处理栈');
                    this.generateOutline();
                };
            }
            
            if (!this.searchClickHandler) {
                this.searchClickHandler = () => {
                    console.log('[DOCGEN] 搜索按钮点击', new Date().toISOString());
                    this.performSearch();
                };
            }
            
            if (!this.searchKeyPressHandler) {
                this.searchKeyPressHandler = (e) => {
                    if (e.key === 'Enter') {
                        console.log('[DOCGEN] 搜索输入框回车', new Date().toISOString());
                        this.performSearch();
                    }
                };
            }
            
            if (!this.contentClickHandler) {
                this.contentClickHandler = () => {
                    console.log('[DOCGEN] 生成内容按钮点击', new Date().toISOString());
                    console.trace('[DOCGEN] 点击事件处理栈');
                    this.generateContent();
                };
            }
            
            if (!this.contentClickHandler) {
                this.contentClickHandler = () => {
                    console.log('[DOCGEN] 生成内容按钮点击', new Date().toISOString());
                    console.trace('[DOCGEN] 点击事件处理栈');
                    this.generateContent();
                };
            }
            
            // 调试：查看选择器匹配了多少个面板
            const allPanels = document.querySelectorAll('#docgen-panel');
            console.log(`[DOCGEN] 匹配到 ${allPanels.length} 个docgen-panel面板`);
            
            // 只使用第一个面板（主面板）
            const mainPanel = allPanels[0];
            console.log('[DOCGEN] 使用组件面板:', mainPanel);
            if (mainPanel) {
                console.log('[DOCGEN] 找到主面板:', mainPanel);
                
                // 在主面板内查找生成大纲按钮
                const generateOutlineBtn = mainPanel.querySelector('.panel-container #component-generateOutlineBtn');
                if (generateOutlineBtn) {
                    // 先移除可能存在的事件监听器
                    generateOutlineBtn.removeEventListener('click', this.outlineClickHandler);
                    // 添加事件监听器，使用once: false确保可以重复点击（但会被isGenerating保护）
                    generateOutlineBtn.addEventListener('click', this.outlineClickHandler, { 
                        capture: false, 
                        once: false,
                        passive: true
                    });
                    console.log('[DOCGEN] 成功绑定主面板的生成大纲按钮事件');
                } else {
                    console.warn('[DOCGEN] 在主面板中未找到生成大纲按钮');
                }
                
                // 在主面板内查找生成内容按钮
                const generateDocBtn = mainPanel.querySelector('.panel-container #component-generateDocBtn');
                if (generateDocBtn) {
                    // 先移除可能存在的事件监听器
                    generateDocBtn.removeEventListener('click', this.contentClickHandler);
                    // 添加事件监听器
                    generateDocBtn.addEventListener('click', this.contentClickHandler, { 
                        capture: false, 
                        once: false,
                        passive: true
                    });
                    console.log('[DOCGEN] 成功绑定主面板的生成内容按钮事件');
                } else {
                    console.warn('[DOCGEN] 在主面板中未找到生成内容按钮');
                }
                
                // 在主面板内查找搜索按钮
                const genSearchBtn = mainPanel.querySelector('.panel-container #component-genSearchBtn');
                if (genSearchBtn) {
                    // 先移除可能存在的事件监听器
                    genSearchBtn.removeEventListener('click', this.searchClickHandler);
                    // 添加事件监听器
                    genSearchBtn.addEventListener('click', this.searchClickHandler, { 
                        capture: false, 
                        once: false,
                        passive: true
                    });
                    console.log('[DOCGEN] 成功绑定主面板的搜索按钮事件');
                } else {
                    console.warn('[DOCGEN] 在主面板中未找到搜索按钮');
                }
                
                // 在主面板内查找搜索输入框
                const genSearchQuery = mainPanel.querySelector('.panel-container #component-genSearchQuery');
                if (genSearchQuery) {
                    // 先移除可能存在的事件监听器
                    genSearchQuery.removeEventListener('keypress', this.searchKeyPressHandler);
                    // 添加事件监听器
                    genSearchQuery.addEventListener('keypress', this.searchKeyPressHandler, { 
                        capture: false, 
                        once: false,
                        passive: true
                    });
                    console.log('[DOCGEN] 成功绑定主面板的搜索输入框事件');
                } else {
                    console.warn('[DOCGEN] 在主面板中未找到搜索输入框');
                }
            } else {
                console.warn('[DOCGEN] 未找到主面板');
            }
            
            this.eventsBound = true;
            console.log('[DOCGEN] 事件绑定完成');
        }

        // 初始化搜索结果列表
        initSearchResults() {
            // 这里可以添加初始化搜索结果的逻辑
        }

        // 执行文档生成搜索
        async performSearch() {
            // 只从主文档面板中获取搜索输入框和结果容器
            const query = document.querySelector('#docgen-panel > .panel-container #component-genSearchQuery').value;
            const resultsContainer = document.querySelector('#docgen-panel > .panel-container #component-genSearchResults');
            
            if (!query) {
                this.toast.show('请输入搜索关键词', 'warning');
                return;
            }
            
            try {
                this.toast.show('正在搜索...', 'info');
                // 显示加载状态
                resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
                
                // 获取用户设置的检索数量
                const settings = window.StateManager?.getState('modelSettings') || {};
                const retrieveCount = settings.retrieveCount || '5';
                const k = retrieveCount === 'all' ? 10000 : parseInt(retrieveCount);
                
                console.log('[DOCGEN-SEARCH] 使用检索设置:', { retrieveCount, k });
                
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
                this.searchResults = results;
                
                // 显示搜索结果
                this.renderSearchResults(results, resultsContainer);
                this.toast.show(`找到 ${results.length} 个相关文档`, 'success');
            } catch (error) {
                console.error('[DOCGEN] 搜索失败:', error);
                this.toast.show('搜索失败，请稍后重试', 'error');
            }
        }

        // 渲染搜索结果
        renderSearchResults(results, container) {
            console.log('[DEBUG] 搜索结果数据:', results);
            if (!results || results.length === 0) {
                container.innerHTML = '<div class="alert alert-info">未找到相关内容</div>';
                return;
            }
            
            const html = `
                <h4 class="search-results-title">搜索结果 (${results.length})</h4>
                <div class="gen-search-results-list" style="overflow-y: auto; max-height: calc(100% - 40px);">
                    ${results.map((result, index) => {
                        console.log(`[DEBUG] 结果${index}完整数据:`, result);
                        console.log(`[DEBUG] 结果${index}的metadata:`, result.metadata);
                        console.log(`[DEBUG] 结果${index}的filename:`, result.metadata?.filename);
                        const filename = result.metadata?.filename || result.filename || '未命名文档';
                        console.log(`[DEBUG] 最终使用的filename:`, filename);
                        return `
                        <div class="gen-search-result-item" data-index="${index}">
                            <div class="gen-result-title">
                                <strong>${filename}</strong>
                            </div>
                            <div class="gen-result-content">
                                ${result.content || ''}
                            </div>
                            <div class="gen-result-meta">
                                <span class="score">相关度: ${(result.score * 100).toFixed(2)}%</span>
                                <span class="page">块索引: ${result.metadata?.chunk_index || 'N/A'}</span>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `;
            
            container.innerHTML = html;
        }

        // 生成大纲
        async generateOutline() {
            // 立即设置生成状态，防止并发调用
            if (this.isGenerating) {
                console.log('[DOCGEN] 已经在生成中，跳过本次调用');
                return;
            }
            this.isGenerating = true;
            
            // 增加调用计数
            this.generateCount++;
            console.log(`[DOCGEN] 生成大纲方法被调用 ${this.generateCount} 次`, new Date().toISOString());
            console.trace('[DOCGEN] generateOutline调用栈');
            
            // 获取当前时间
            const now = Date.now();
            
            // 防止快速连续调用 - 500毫秒内只允许调用一次
            if (this.lastGenerateTime && now - this.lastGenerateTime < 500) {
                console.log('[DOCGEN] 调用太频繁，跳过本次调用');
                console.log('[DOCGEN] - lastGenerateTime:', this.lastGenerateTime);
                console.log('[DOCGEN] - 时间差:', now - this.lastGenerateTime);
                this.isGenerating = false;
                return;
            }
            
            // 更新最后调用时间
            this.lastGenerateTime = now;
            
            // 只从主文档面板中获取输入字段
        const topic = document.querySelector('#docgen-panel > .panel-container #component-genTopic').value;
        const requirements = document.querySelector('#docgen-panel > .panel-container #component-genRequirements').value;

            if (!topic) {
                this.toast.show('请输入文档主题', 'warning');
                this.isGenerating = false;
                return;
            }

            if (!requirements) {
                this.toast.show('请输入文档生成要求', 'warning');
                this.isGenerating = false;
                return;
            }

            try {
                this.toast.show('正在生成大纲...', 'info');

                // 收集参数
                const docType = document.querySelector('#docgen-panel > .panel-container #component-genDocType').value;
                const length = document.querySelector('#docgen-panel > .panel-container #component-genLength').value;
                const numberingFormat = document.querySelector('#docgen-panel > .panel-container #component-genNumberingFormat').value;
                const chapterCount = document.querySelector('#docgen-panel > .panel-container #component-genChapterCount').value;
                
                // 从设置面板获取模型参数
                const modelProvider = document.querySelector('#settings-panel #settingsModelProvider').value || 'ollama';
                const modelName = document.querySelector('#settings-panel #settingsModelName').value || 'deepseek-r1:1.5b';
                
                const params = {
                    doc_type: docType,
                    length: length,
                    number_format: numberingFormat,
                    chapter_count: parseInt(chapterCount),
                    topic: topic,
                    requirements: requirements,
                    search_results: this.searchResults,
                    model_provider: modelProvider,
                    model_name: modelName,
                    stream: true
                };

                // 显示生成中的UI - 使用智能对话风格
                const outlineContainer = document.getElementById('component-outlineTree');
                if (outlineContainer) {
                    outlineContainer.innerHTML = `
                        <div class="chat-message assistant streaming">
                            <div class="message-avatar">🤖</div>
                            <div class="message-content">
                                <div class="thinking-section">
                                    <div class="thinking-header">
                                        <span class="thinking-label">🤔 AI正在思考...</span>
                                    </div>
                                    <div class="thinking-content"></div>
                                </div>
                                <div class="response-section">
                                    <div class="response-header">
                                        <span class="response-label">💬 AI生成的大纲</span>
                                    </div>
                                    <div class="response-content"></div>
                                </div>
                                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                    `;
                }

                // 调用后端API (使用流式响应)
                const response = await this.api.generateOutline(params, true, (chunk) => {
                    // 实时处理流式数据并更新UI
                    console.log('[DOCGEN] 接收到大纲流数据:', chunk);
                    
                    if (chunk.success) {
                        // 直接处理流式数据，与智能对话保持一致
                        this.handleStreamChunk(chunk);
                    }
                });

                this.currentOutline = response;
                this.toast.show('大纲生成成功', 'success');
            } catch (error) {
                console.error('[DOCGEN] 大纲生成失败:', error);
                this.toast.show('大纲生成失败，请稍后重试', 'error');
            } finally {
                // 无论成功还是失败，都重置生成状态
                this.isGenerating = false;
                console.log('[DOCGEN] 生成状态重置为false');
            }
        }

        // 生成内容
        async generateContent() {
            // 立即设置生成状态，防止并发调用
            if (this.isGenerating) {
                console.log('[DOCGEN] 已经在生成中，跳过本次调用');
                return;
            }
            this.isGenerating = true;
            
            console.log('[DOCGEN] 生成内容方法被调用', new Date().toISOString());
            console.trace('[DOCGEN] generateContent调用栈');
            
            // 只从主文档面板中获取输入字段
            const topic = document.querySelector('#docgen-panel > .panel-container #component-genTopic').value;
            const requirements = document.querySelector('#docgen-panel > .panel-container #component-genRequirements').value;
            const chapterCount = parseInt(document.querySelector('#docgen-panel > .panel-container #component-genChapterCount').value);

            if (!topic) {
                this.toast.show('请输入文档主题', 'warning');
                this.isGenerating = false;
                return;
            }

            if (!requirements) {
                this.toast.show('请输入文档生成要求', 'warning');
                this.isGenerating = false;
                return;
            }

            if (!this.currentOutline) {
                this.toast.show('请先生成大纲', 'warning');
                this.isGenerating = false;
                return;
            }

            try {
                this.toast.show(`正在生成${chapterCount}个章节的内容...`, 'info');

                // 收集参数
                const docType = document.querySelector('#docgen-panel > .panel-container #component-genDocType').value;
                const length = document.querySelector('#docgen-panel > .panel-container #component-genLength').value;
                
                // 从设置面板获取模型参数
                const modelProvider = document.querySelector('#settings-panel #settingsModelProvider').value || 'ollama';
                const modelName = document.querySelector('#settings-panel #settingsModelName').value || 'deepseek-r1:1.5b';
                
                // 清空生成结果容器
                const resultContainer = document.getElementById('component-genResult');
                if (resultContainer) {
                    resultContainer.innerHTML = '';
                    
                    // 创建统一的思考内容块
                    const thinkingContainer = document.createElement('div');
                    thinkingContainer.className = 'thinking-container';
                    thinkingContainer.innerHTML = `
                        <div class="chat-message assistant streaming">
                            <div class="message-avatar">🤖</div>
                            <div class="message-content">
                                <div class="thinking-section">
                                    <div class="thinking-header">
                                        <span class="thinking-label">🤔 AI正在思考...</span>
                                    </div>
                                    <div class="thinking-content"></div>
                                </div>
                                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                    `;
                    resultContainer.appendChild(thinkingContainer);
                }

                const params = {
                    doc_type: docType,
                    length: length,
                    outline: this.currentOutline,
                    topic: topic,
                    requirements: requirements,
                    search_results: this.searchResults,
                    model_provider: modelProvider,
                    model_name: modelName,
                    chapter_count: chapterCount,
                    stream: true
                };

                // 调用后端API (使用流式响应)
                await this.api.generateContent(params, true, (chunk) => {
                    // 实时处理流式数据并更新UI
                    console.log('[DOCGEN] 接收到内容流数据:', chunk);
                    
                    if (chunk.success) {
                        // 直接处理流式数据，与智能对话保持一致
                        this.handleContentStreamChunk(chunk);
                    } else if (chunk.type === 'error') {
                        // 处理错误信息
                        console.error('[DOCGEN] 收到错误:', chunk.data);
                        this.toast.show(chunk.data || '内容生成失败，请稍后重试', 'error');
                    }
                });

                this.toast.show('内容生成成功', 'success');
            } catch (error) {
                console.error('[DOCGEN] 内容生成失败:', error);
                this.toast.show('内容生成失败，请稍后重试', 'error');
            } finally {
                // 无论成功还是失败，都重置生成状态
                this.isGenerating = false;
                console.log('[DOCGEN] 生成状态重置为false');
            }
        }

        // 处理内容流式数据块
        handleContentStreamChunk(chunk) {
            const resultContainer = document.getElementById('component-genResult');
            if (!resultContainer) return;

            // 获取统一的思考内容容器
            const thinkingContainer = resultContainer.querySelector('.thinking-container .thinking-content');
            const thinkingSection = resultContainer.querySelector('.thinking-container .thinking-section');

            // 获取或创建统一的章节内容容器（所有章节内容都在这个容器中）
            let unifiedContentContainer = resultContainer.querySelector('.unified-chapters-content');
            if (!unifiedContentContainer) {
                unifiedContentContainer = document.createElement('div');
                unifiedContentContainer.className = 'unified-chapters-content';
                unifiedContentContainer.innerHTML = `
                    <div class="chat-message assistant streaming">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="response-section">
                                <div class="response-header">
                                    <span class="response-label">💬 AI生成的内容</span>
                                </div>
                                <div class="response-content"></div>
                            </div>
                            <div class="message-time">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                `;
                resultContainer.appendChild(unifiedContentContainer);
            }

            // 获取统一容器的回复内容区域
            const streamingContainer = unifiedContentContainer.querySelector('.chat-message.assistant.streaming');
            if (!streamingContainer) return;

            const responseContent = streamingContainer.querySelector('.response-content');

            // 处理token类型的数据
            if (chunk.type === 'token') {
                // 处理thinking内容 - 所有章节的思考内容都放在统一的思考块中
                if (chunk.thinking && chunk.thinking) {
                    if (thinkingContainer) {
                        thinkingContainer.textContent += chunk.thinking;
                        thinkingContainer.style.display = 'block';
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                thinkingContainer.scrollTop = thinkingContainer.scrollHeight;
                            });
                        });
                    }
                }
                
                // 处理正式回复内容 - 所有章节内容都追加到统一容器中
                if (chunk.content && chunk.content) {
                    if (responseContent) {
                        responseContent.textContent += chunk.content;
                        responseContent.style.display = 'block';
                    }
                }
                
                // 如果是完成状态，调整思考部分样式
                if (chunk.done) {
                    if (thinkingSection) {
                        thinkingSection.style.opacity = '0.6';
                        thinkingSection.style.fontStyle = 'italic';
                    }
                    if (streamingContainer) {
                        streamingContainer.classList.remove('streaming');
                    }
                }
            }

            // 滚动到底部
            resultContainer.scrollTop = resultContainer.scrollHeight;
        }

        // 处理流式数据块，与智能对话保持一致
        handleStreamChunk(chunk) {
            // 尝试先查找大纲容器，没有则使用生成结果容器
            let outlineContainer = document.getElementById('component-outlineTree');
            if (!outlineContainer) {
                // 如果没有大纲容器，使用生成结果容器
                outlineContainer = document.getElementById('component-genResult');
            }
            if (!outlineContainer) return;

            // 获取智能对话风格的容器
            const streamingContainer = outlineContainer.querySelector('.chat-message.assistant.streaming');
            if (!streamingContainer) return;

            // 获取思考过程和回复内容容器
            const thinkingContent = streamingContainer.querySelector('.thinking-content');
            const responseContent = streamingContainer.querySelector('.response-content');

            // 处理token类型的数据（与智能对话一致）
            if (chunk.type === 'token') {
                // 处理thinking内容 - 累加显示
                if (chunk.thinking && chunk.thinking) {
                    if (thinkingContent) {
                        thinkingContent.textContent += chunk.thinking;
                        thinkingContent.style.display = 'block';
                        console.log('[DEBUG] thinkingContent scrollHeight:', thinkingContent.scrollHeight, 'scrollTop:', thinkingContent.scrollTop);
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                thinkingContent.scrollTop = thinkingContent.scrollHeight;
                                console.log('[DEBUG] After scroll - scrollHeight:', thinkingContent.scrollHeight, 'scrollTop:', thinkingContent.scrollTop);
                            });
                        });
                    }
                }
                
                // 处理正式回复内容 - 累加显示
                if (chunk.content && chunk.content) {
                    if (responseContent) {
                        responseContent.textContent += chunk.content;
                        responseContent.style.display = 'block';
                    }
                }
                
                // 如果是完成状态，调整思考部分样式
                if (chunk.done) {
                    const thinkingSection = streamingContainer.querySelector('.thinking-section');
                    if (thinkingSection) {
                        thinkingSection.style.opacity = '0.6';
                        thinkingSection.style.fontStyle = 'italic';
                    }
                }
            } else if (chunk.type === 'error') {
                // 错误信息
                console.error('[DOCGEN] 收到错误:', chunk.data);
                if (responseContent) {
                    responseContent.innerHTML = `<span style="color: red;">❌ 错误: ${chunk.data}</span>`;
                    responseContent.style.display = 'block';
                }
            }

            // 滚动到底部
            outlineContainer.scrollTop = outlineContainer.scrollHeight;
        }

        // 渲染大纲结果
        renderOutline(outline) {
            // 将大纲渲染到outlineTree中，而不是genResult
        const outlineTreeContainer = document.getElementById('component-outlineTree');
            if (outlineTreeContainer) {
                if (!outline) {
                    outlineTreeContainer.innerHTML = '<p class="result-placeholder">生成的大纲为空</p>';
                } else {
                    // 对原始内容进行基本的HTML转义，防止XSS
                    const escapeHtml = (text) => {
                        return text
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                    };
                    // 使用智能对话风格显示大纲结果
                    const formattedContent = escapeHtml(outline).replace(/\n/g, '<br>');
                    outlineTreeContainer.innerHTML = `
                        <div class="chat-message assistant">
                            <div class="message-avatar">🤖</div>
                            <div class="message-content">
                                <div class="response-section">
                                    <div class="response-header">
                                        <span class="response-label">💬 AI生成的大纲</span>
                                    </div>
                                    <div class="response-content">${formattedContent}</div>
                                </div>
                                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // 构建大纲HTML（解析原始内容为树形结构，一行一个节点）
        buildOutlineHtml(rawContent) {
            if (!rawContent) {
                return '<p class="result-placeholder">生成的大纲为空</p>';
            }

            // 解析原始内容，提取标题结构
            const lines = rawContent.split('\n');
            const outlineItems = [];
            const stack = [];

            // 对原始内容进行基本的HTML转义，防止XSS
            const escapeHtml = (text) => {
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };

            lines.forEach(line => {
                
                if (!line) return;

                // 解析不同级别的标题
                let level = 0;
                let title = line;

                // 处理数字编号格式（如1. 一级标题, 1.1. 二级标题）
                const numberingMatch = line.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
                if (numberingMatch) {
                    const numbering = numberingMatch[1];
                    title = numberingMatch[2];
                    level = numbering.split('.').length - 1;
                } else {
                    // 处理其他可能的格式（如# 标题, ## 二级标题等）
                    const hashtagMatch = line.match(/^(\#{1,6})\s+(.+)$/);
                    if (hashtagMatch) {
                        level = hashtagMatch[1].length - 1;
                        title = hashtagMatch[2];
                    }
                }

                // 创建大纲项
                const outlineItem = {
                    level: level,
                    title: escapeHtml(title),
                    children: []
                };

                // 根据级别构建树形结构
                if (stack.length === 0) {
                    // 第一个节点或顶级节点
                    outlineItems.push(outlineItem);
                    stack.push(outlineItem);
                } else {
                    const parent = stack[stack.length - 1];
                    
                    if (level > parent.level) {
                        // 子节点
                        parent.children.push(outlineItem);
                        stack.push(outlineItem);
                    } else {
                        // 同级或上级节点
                        stack.pop();
                        while (stack.length > 0) {
                            const ancestor = stack[stack.length - 1];
                            if (level <= ancestor.level) {
                                stack.pop();
                            } else {
                                break;
                            }
                        }
                        
                        if (stack.length > 0) {
                            stack[stack.length - 1].children.push(outlineItem);
                        } else {
                            outlineItems.push(outlineItem);
                        }
                        stack.push(outlineItem);
                    }
                }
            });

            // 递归构建HTML结构
            const buildTreeHtml = (items, level = 0) => {
                if (!items || items.length === 0) return '';

                let html = `<ul class="outline-level-${level}">`;
                
                items.forEach(item => {
                    // 每个节点单独一行显示
                    html += `<li class="outline-item level-${item.level}">`;
                    html += `<div class="outline-title">${item.title}</div>`;
                    
                    if (item.children && item.children.length > 0) {
                        html += buildTreeHtml(item.children, level + 1);
                    }
                    
                    html += '</li>';
                });
                
                html += '</ul>';
                return html;
            };

            return buildTreeHtml(outlineItems);
        }
    }

    // 导出到全局命名空间
    window.DocGenManager = DocGenManager;

})();
