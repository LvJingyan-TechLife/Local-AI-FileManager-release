(function() {
    'use strict';

    class ChatManager {
        constructor(apiClient, toastManager) {
            this.api = apiClient;
            this.toast = toastManager;
            this.currentModel = null;
            this.availableModels = [];
            this.ragEventsInitialized = false;
            
            // 使用全局状态管理聊天历史
            this.initChatState();
        }
        
        // 日志记录方法
        log(level, message, data = null) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp: timestamp,
                level: level,
                message: message,
                component: 'ChatManager',
                data: data
            };
            
            // 控制台输出（带颜色）
            const colorMap = {
                DEBUG: 'color: #6c757d;',
                INFO: 'color: #007bff;',
                WARNING: 'color: #ffc107;',
                ERROR: 'color: #dc3545;',
                CRITICAL: 'color: #dc3545; font-weight: bold;'
            };
            
            const color = colorMap[level] || 'color: #28a745;';
            console.log(`%c[${timestamp}] [${level}] ${message}`, color, data);
            
            // 尝试使用localStorage存储日志（前端限制，无法直接写入文件）
            try {
                const logs = JSON.parse(localStorage.getItem('rag_chat_logs') || '[]');
                logs.push(logEntry);
                
                // 限制日志数量，只保留最近1000条
                if (logs.length > 1000) {
                    logs.splice(0, logs.length - 1000);
                }
                
                localStorage.setItem('rag_chat_logs', JSON.stringify(logs));
            } catch (error) {
                console.error('日志存储失败:', error);
            }
        }
        
        // 初始化聊天状态管理
        initChatState() {
            console.log('[CHAT] 初始化聊天状态管理');
            
            // 确保全局状态存在
            if (window.StateManager) {
                // 初始化聊天历史状态
                const existingHistory = window.StateManager.getState('chatState.chatHistory');
                if (!existingHistory) {
                    window.StateManager.setState('chatState.chatHistory', []);
                }
                
                // 初始化其他聊天状态
                window.StateManager.setState('chatState.isStreaming', false);
                window.StateManager.setState('chatState.currentStreamingContainer', null);
                
                console.log('[CHAT] 聊天状态初始化完成');
            }
        }
        
        // 获取聊天历史（从全局状态）
        getChatHistory() {
            if (window.StateManager) {
                return window.StateManager.getState('chatState.chatHistory') || [];
            }
            return [];
        }
        
        // 添加消息到聊天历史（并更新全局状态）
        addToChatHistory(message) {
            if (window.StateManager) {
                const history = this.getChatHistory();
                history.push(message);
                
                // 限制历史记录数量
                if (history.length > 100) {
                    history.shift(); // 移除最早的消息
                }
                
                window.StateManager.setState('chatState.chatHistory', history);
            }
        }
        
        // 清空聊天历史
        clearChatHistory() {
            if (window.StateManager) {
                window.StateManager.setState('chatState.chatHistory', []);
            }
        }
        
        // 设置流式状态
        setStreamingState(isStreaming, container = null) {
            if (window.StateManager) {
                window.StateManager.setState('chatState.isStreaming', isStreaming);
                window.StateManager.setState('chatState.currentStreamingContainer', container);
            }
        }
        
        // 获取流式状态
        getStreamingState() {
            if (window.StateManager) {
                return {
                    isStreaming: window.StateManager.getState('chatState.isStreaming') || false,
                    container: window.StateManager.getState('chatState.currentStreamingContainer')
                };
            }
            return { isStreaming: false, container: null };
        }

        initRagEvents() {
            if (this.ragEventsInitialized) {
                console.log('[INIT] initRagEvents 已经初始化过，跳过重复初始化');
                return;
            }
            
            console.log('[INIT] 🚀 initRagEvents 开始执行 - 当前时间:', new Date().toISOString());
            console.log('[INIT] 页面DOM状态检查:');
            console.log('[INIT] - document.readyState:', document.readyState);
            console.log('[INIT] - document.body存在:', !!document.body);
            console.log('[INIT] - document.body中的元素数量:', document.body ? document.body.children.length : 0);
            
            // 验证函数被正确调用
            console.log('[INIT] ✓ initRagEvents函数被正确调用');
            console.log('[INIT] this对象的类型:', typeof this);
            console.log('[INIT] this对象的方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
            console.log('[INIT] 开始检查DOM元素...');
            
            // CSS样式诊断函数
            const diagnoseElement = (element, name) => {
                if (!element) {
                    console.log(`[DIAG] ${name} 不存在`);
                    return;
                }
                
                const styles = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                
                console.log(`[DIAG] ${name} CSS诊断:`, {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    pointerEvents: styles.pointerEvents,
                    position: styles.position,
                    top: styles.top,
                    left: styles.left,
                    width: styles.width,
                    height: styles.height,
                    zIndex: styles.zIndex,
                    clientWidth: rect.width,
                    clientHeight: rect.height,
                    offsetWidth: element.offsetWidth,
                    offsetHeight: element.offsetHeight,
                    disabled: element.disabled,
                    readonly: element.readOnly
                });
            };
            
            // 检查所有可能的发送按钮
            const sendChatBtn = document.getElementById('sendChatBtn');
            console.log('[INIT] 查找sendChatBtn元素:', sendChatBtn);
            
            // CSS诊断
            diagnoseElement(sendChatBtn, 'sendChatBtn');
            
            console.log('[INIT] sendChatBtn元素详情:', {
                id: sendChatBtn?.id,
                className: sendChatBtn?.className,
                tagName: sendChatBtn?.tagName,
                onclick: sendChatBtn?.onclick,
                disabled: sendChatBtn?.disabled,
                style: sendChatBtn?.style?.display
            });

            // 直接绑定发送按钮事件，不使用克隆替换的方式
            if (sendChatBtn) {
                console.log('[INIT] 绑定sendChatBtn事件监听器...');
                sendChatBtn.addEventListener('click', () => this.sendChatMessage());
                console.log('[INIT] ✓ sendChatBtn事件绑定成功');
            } else {
                console.error('[INIT] ❌ sendChatBtn元素不存在');
            }

            // 检查聊天输入框
            const chatInput = document.getElementById('chatInput');
            console.log('[INIT] 查找chatInput元素:', chatInput);
            diagnoseElement(chatInput, 'chatInput');

            // 直接绑定输入框事件，不使用克隆替换的方式
            if (chatInput) {
                console.log('[INIT] 绑定chatInput事件监听器...');
                chatInput.addEventListener('keypress', (e) => {
                    console.log('[INIT] chatInput检测到按键:', e.key);
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        console.log('[INIT] Enter键被按下，调用sendChatMessage...');
                        this.sendChatMessage();
                    }
                });
                console.log('[INIT] ✓ chatInput事件绑定成功');
            } else {
                console.error('[INIT] ❌ chatInput元素不存在');
            }

            // 检查DOM元素是否已加载
            console.log('[INIT] 检查DOM加载状态:', document.readyState);
            
            // 打印聊天区域DOM结构，用于调试
            const chatPanel = document.getElementById('chat-panel');
            if (chatPanel) {
                console.log('[INIT] 聊天面板DOM结构:', chatPanel.innerHTML.substring(0, 200));
            } else {
                console.error('[INIT] 聊天面板不存在');
            }

            const loadRagInfoBtn = document.getElementById('loadRagInfo');
            if (loadRagInfoBtn) {
                loadRagInfoBtn.addEventListener('click', () => this.loadRagInfo());
                console.log('[INIT] loadRagInfoBtn 事件绑定成功');
            }

            const toggleRetrievalBtn = document.getElementById('toggleRetrieval');
            if (toggleRetrievalBtn) {
                toggleRetrievalBtn.addEventListener('click', () => {
                    const sidebar = document.getElementById('retrievalSidebar');
                    const btn = document.getElementById('toggleRetrieval');
                    if (sidebar) sidebar.classList.toggle('collapsed');
                    if (btn) btn.classList.toggle('expanded');
                });
                console.log('[INIT] toggleRetrievalBtn 事件绑定成功');
            }

            const sidebarExpandBtn = document.getElementById('sidebarExpandBtn');
            if (sidebarExpandBtn) {
                sidebarExpandBtn.addEventListener('click', () => {
                    const sidebar = document.getElementById('retrievalSidebar');
                    if (sidebar) sidebar.classList.remove('collapsed');
                });
                console.log('[INIT] sidebarExpandBtn 事件绑定成功');
            }

            this.ragEventsInitialized = true;
            console.log('[INIT] ✓ initRagEvents 初始化完成，已设置 ragEventsInitialized = true');
        }

        async sendChatMessage() {
            console.log('[SEND] 🔥 发送消息函数被调用 - 执行时间:', new Date().toISOString());
            console.log('[SEND] 函数调用栈:', new Error().stack.split('\n').slice(1, 5).join('\n'));
            
            // 隐藏欢迎屏幕 - 对话开始时隐藏welcome-content
            this.hideWelcomeScreen();
            
            // 检查输入框元素
            const input = document.getElementById('chatInput');
            console.log('[SEND] 查找chatInput元素:', input);
            console.log('[SEND] chatInput元素存在性检查:', {
                exists: !!input,
                id: input?.id,
                value: input?.value,
                disabled: input?.disabled,
                readOnly: input?.readOnly
            });
            
            if (!input) {
                console.error('[SEND] ❌ 错误：chatInput 元素不存在');
                console.log('[SEND] 尝试查找替代输入框...');
                // 尝试查找其他可能的输入框
                const alternativeInputs = [
                    document.querySelector('.chat-input'),
                    document.querySelector('input[placeholder*="问题"]'),
                    document.querySelector('input[placeholder*="输入"]'),
                    document.querySelector('textarea')
                ];
                
                for (let i = 0; i < alternativeInputs.length; i++) {
                    const altInput = alternativeInputs[i];
                    console.log(`[SEND] 替代输入框 ${i + 1}:`, altInput);
                    if (altInput && altInput.value.trim()) {
                        console.log(`[SEND] ✓ 找到替代输入框 ${i + 1}，内容: "${altInput.value.trim()}"`);
                        return this.processMessage(altInput.value.trim(), altInput);
                    }
                }
                
                console.error('[SEND] ❌ 所有输入框都找不到或内容为空');
                this.toast.error('找不到聊天输入框或输入内容为空');
                return;
            }
            
            const message = input.value.trim();
            console.log('[SEND] 输入内容:', message);
            
            if (!message) {
                console.log('[SEND] 输入为空，不发送消息');
                this.toast.warning('请输入问题');
                return;
            }
            
            await this.processMessage(message, input);
        }

        async processMessage(message, inputElement) {
            try {
                // 清空输入框
                inputElement.value = '';
                
                // 添加用户消息到聊天记录
                this.addChatMessage('user', message);
                
                // 获取当前选择的模型信息
                const provider = document.getElementById('settingsModelProvider')?.value || 'ollama';
                const modelName = document.getElementById('settingsModelName')?.value || 'deepseek-r1:1.5b';
                
                console.log('[SEND] 发送消息到API - 提供商:', provider, '模型:', modelName);
                
                // 检查是否启用流式响应
                const useStreaming = document.getElementById('settingsStreamOutput')?.checked || false;
                
                if (useStreaming) {
                    await this.processStreamingMessage(message, provider, modelName);
                } else {
                    await this.processNormalMessage(message, provider, modelName);
                }
                
            } catch (error) {
                console.error('[SEND] 发送消息失败:', error);
                this.toast.error('发送消息失败: ' + error.message);
            }
        }

        async processNormalMessage(message, provider, modelName) {
            // 清空之前的检索片段
            const retrievalContent = document.getElementById('retrievalContent');
            if (retrievalContent) {
                retrievalContent.innerHTML = '<div class="empty-hint">检索中...</div>';
            }
            
            // 显示加载状态
            const loadingMsg = this.addChatMessage('assistant', '正在思考中...', true);
            
            try {
                this.log('INFO', '开始处理非流式消息', { messageLength: message.length, provider: provider, modelName: modelName });
                
                // 固定使用精确搜索模式
                const searchMode = 'precise';
                
                this.log('DEBUG', '使用固定搜索模式', { searchMode: searchMode });
                
                // 精确搜索模式：先检索上下文，然后使用chat_with_context端点
                this.log('INFO', '精确搜索模式：先检索上下文');
                
                // 1. 获取前端显示的上下文
                const displayedContext = this.getDisplayedContext();
                this.log('INFO', `从前端获取到 ${displayedContext.length} 个已显示的上下文片段`);
                
                // 2. 检索新的上下文
                this.log('DEBUG', '开始调用ragRetrieve接口');
                
                const settings = window.StateManager?.getState('modelSettings') || {};
                this.log('DEBUG', '获取到的完整设置:', JSON.stringify(settings));
                const retrieveCount = settings.retrieveCount || '5';
                this.log('DEBUG', 'retrieveCount原始值:', retrieveCount, '类型:', typeof retrieveCount);
                const k = retrieveCount === 'all' ? 10000 : parseInt(retrieveCount);
                
                this.log('DEBUG', '使用检索设置', { retrieveCount, k });
                
                const retrievalResults = await this.api.ragRetrieve(message, {
                    k: k,
                    content_type: 'all'
                });
                
                this.log('DEBUG', 'ragRetrieve调用完成', {
                    hasResults: !!retrievalResults?.results,
                    resultsCount: retrievalResults?.results?.length || 0
                });
                
                let response;
                let combinedContext = [];
                
                if (!retrievalResults || !retrievalResults.results || retrievalResults.results.length === 0) {
                    this.log('WARNING', '未找到新的检索结果，仅使用前端显示的上下文');
                    
                    // 仅使用前端显示的上下文
                    combinedContext = displayedContext;
                } else {
                    // 将新检索结果转换为chat_with_context所需的格式
                    this.log('DEBUG', '准备转换检索结果格式', { originalResultsCount: retrievalResults.results.length });
                    
                    const newContext = retrievalResults.results.map(result => ({
                        content: result.content,
                        score: result.score,
                        source: result.source || result.metadata?.filename || result.filename || '未知来源',
                        chunk_index: result.chunk_index || 0,
                        document_id: result.document_id || '',
                        filename: result.filename || result.metadata?.filename || result.file_name || '',
                        metadata: result.metadata || {},
                    }));
                    
                    this.log('DEBUG', '新检索结果转换完成', { newContextCount: newContext.length });
                    
                    // 合并上下文：前端显示的上下文 + 新检索的上下文
                    combinedContext = [...displayedContext, ...newContext];
                    this.log('INFO', '上下文合并完成', {
                        displayedContextCount: displayedContext.length,
                        newContextCount: newContext.length,
                        combinedContextCount: combinedContext.length
                    });
                    
                    // 注意：不在这里更新侧边栏，避免与chatWithContext返回的sources重复
                    // 侧边栏将在chatWithContext返回后更新
                }
                
                // 使用chat_with_context端点
                this.log('DEBUG', '开始调用chatWithContext接口', {
                    messageLength: message.length,
                    contextCount: combinedContext.length,
                    stream: false
                });
                
                response = await this.api.chatWithContext(message, combinedContext, {
                    model_provider: provider,
                    model_name: modelName,
                    stream: false
                });
                
                this.log('DEBUG', 'chatWithContext调用完成', {
                    hasAnswer: !!response?.answer,
                    hasSources: !!response?.sources
                });
                
                // 更新右侧片段显示
                if (response.sources) {
                    this.updateRetrievalSidebar(response.sources);
                }
                
                // 移除加载消息
                if (loadingMsg) {
                    loadingMsg.remove();
                }
                
                // 添加AI回复
                if (response.answer) {
                    this.addChatMessage('assistant', response.answer);
                    
                    // 更新聊天历史
                    if (window.StateManager) {
                        const chatHistory = window.StateManager.getState('chatState.chatHistory') || [];
                        chatHistory.push({ role: 'user', content: message });
                        chatHistory.push({ role: 'assistant', content: response.answer });
                        
                        // 保持历史记录不超过20条
                        if (chatHistory.length > 20) {
                            chatHistory.splice(0, chatHistory.length - 20);
                        }
                        window.StateManager.setState('chatState.chatHistory', chatHistory);
                    }
                } else {
                    throw new Error('AI回复为空');
                }
            } catch (error) {
                if (loadingMsg) {
                    loadingMsg.remove();
                }
                throw error;
            }
        }

        async processStreamingMessage(message, provider, modelName) {
            // 清空之前的检索片段
            const retrievalContent = document.getElementById('retrievalContent');
            if (retrievalContent) {
                retrievalContent.innerHTML = '<div class="empty-hint">检索中...</div>';
            }
            
            // 创建流式消息容器
            const streamingContainer = this.createStreamingMessage();
            
            try {
                this.log('INFO', '开始处理流式消息', { messageLength: message.length, provider: provider, modelName: modelName });
                
                // 固定使用精确搜索模式
                const searchMode = 'precise';
                
                this.log('DEBUG', '使用固定搜索模式', { searchMode: searchMode });
                
                let responseStream;
                this.log('DEBUG', '准备执行精确搜索');
                
                // 精确搜索模式：先检索上下文，然后使用chat_with_context端点
                this.log('INFO', '精确搜索模式：先检索上下文');
                
                // 1. 获取前端显示的上下文
                const displayedContext = this.getDisplayedContext();
                this.log('INFO', `从前端获取到 ${displayedContext.length} 个已显示的上下文片段`);
                
                // 2. 检索新的上下文
                this.log('DEBUG', '开始调用ragRetrieve接口');
                
                const settings = window.StateManager?.getState('modelSettings') || {};
                const retrieveCount = settings.retrieveCount || '5';
                const k = retrieveCount === 'all' ? 10000 : parseInt(retrieveCount);
                
                this.log('DEBUG', '使用检索设置', { retrieveCount, k });
                
                const retrievalResults = await this.api.ragRetrieve(message, {
                    k: k,
                    content_type: 'all'
                });
                
                this.log('DEBUG', 'ragRetrieve调用完成', {
                    hasResults: !!retrievalResults?.results,
                    resultsCount: retrievalResults?.results?.length || 0
                });
                
                let combinedContext = [];
                
                // 检查检索结果是否有效
                if (!retrievalResults || !retrievalResults.results || retrievalResults.results.length === 0) {
                    this.log('WARNING', '未找到新的检索结果，仅使用前端显示的上下文');
                    // 仅使用前端显示的上下文
                    combinedContext = displayedContext;
                    
                    // 使用chat_with_context端点
                    responseStream = await this.api.chatWithContextStream(message, combinedContext, {
                        model_provider: provider,
                        model_name: modelName
                    });
                } else {
                    // 将新检索结果转换为chat_with_context所需的格式
                    this.log('DEBUG', '准备转换检索结果格式', { originalResultsCount: retrievalResults.results.length });
                    
                    const newContext = retrievalResults.results.map(result => ({
                        content: result.content,
                        score: result.score,
                        source: result.source || result.metadata?.filename || result.filename || '未知来源',
                        chunk_index: result.chunk_index || 0,
                        document_id: result.document_id || '',
                        filename: result.filename || result.metadata?.filename || result.file_name || '',
                        metadata: result.metadata || {},

                    }));
                    
                    this.log('DEBUG', '新检索结果转换完成', { newContextCount: newContext.length });
                    
                    // 合并上下文：前端显示的上下文 + 新检索的上下文
                    combinedContext = [...displayedContext, ...newContext];
                    this.log('INFO', '上下文合并完成', {
                        displayedContextCount: displayedContext.length,
                        newContextCount: newContext.length,
                        combinedContextCount: combinedContext.length
                    });
                    
                    // 注意：不在这里更新侧边栏，避免与streaming响应中的sources事件重复
                    // 侧边栏将在processStreamResponse方法中处理sources事件时更新
                    
                    // 使用chat_with_context端点
                    responseStream = await this.api.chatWithContextStream(message, combinedContext, {
                        model_provider: provider,
                        model_name: modelName
                    });
                    
                    this.log('DEBUG', 'chat_with_context流式响应已获取');
                }
                
                // 处理流式数据
                await this.processStreamResponse(responseStream, streamingContainer, message);
                
            } catch (error) {
                this.log('ERROR', '流式处理失败', { errorMessage: error.message, stack: error.stack });
                this.addStreamingError(streamingContainer, error.message);
            }
        }

        createStreamingMessage() {
            const chatContainer = document.getElementById('chatMessages');
            if (!chatContainer) {
                console.error('[STREAM] 聊天容器不存在');
                return null;
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message assistant streaming';
            
            messageDiv.innerHTML = `
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
                            <span class="response-label">💬 AI回复</span>
                        </div>
                        <div class="response-content"></div>
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            return messageDiv;
        }

        async processStreamResponse(stream, container, originalMessage) {
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            
            let fullThinking = '';
            let fullResponse = '';
            let isComplete = false;
            let chunkCount = 0;
            
            try {
                while (!isComplete) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        break;
                    }
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        
                        if (line.startsWith('data: ')) {
                            try {
                                chunkCount++;
                                const data = JSON.parse(line.slice(6));
                                

                                
                                await this.handleStreamChunk(data, container);
                                
                                if (data.type === 'complete') {
                                    isComplete = true;
                                }
                                
                                if (data.type === 'token' && data.content) {
                                    fullResponse += data.content;
                                }
                                
                                if (data.type === 'token' && data.thinking) {
                                    fullThinking += data.thinking;
                                }
                            } catch (parseError) {
                                console.error('[STREAM] 解析数据失败:', parseError, '原始行:', line);
                            }
                        }
                    }
                }
                
                // 更新聊天历史
                if (window.StateManager) {
                    const chatHistory = window.StateManager.getState('chatState.chatHistory') || [];
                    chatHistory.push({ role: 'user', content: originalMessage });
                    chatHistory.push({ role: 'assistant', content: fullResponse });
                    
                    // 保持历史记录不超过20条
                    if (chatHistory.length > 20) {
                        chatHistory.splice(0, chatHistory.length - 20);
                    }
                    window.StateManager.setState('chatState.chatHistory', chatHistory);
                }
                
            } catch (error) {
                console.error('[STREAM] 流式读取失败:', error);
                throw error;
            } finally {
                reader.releaseLock();
            }
        }

        async handleStreamChunk(data, container) {
            const thinkingContent = container.querySelector('.thinking-content');
            const responseContent = container.querySelector('.response-content');
            
            if (data.type === 'token') {
                // 处理thinking内容 - 累加显示
                if (data.thinking && data.thinking.trim()) {
                    if (thinkingContent) {
                        thinkingContent.textContent += data.thinking;
                        thinkingContent.style.display = 'block';
                        requestAnimationFrame(() => {
                            thinkingContent.scrollTop = thinkingContent.scrollHeight;
                        });
                    }
                }
                
                // 处理正式回复内容 - 简化累加显示（与thinking字段一致）
                if (data.content && data.content.trim()) {
                    if (responseContent) {
                        responseContent.textContent += data.content;
                        responseContent.style.display = 'block';
                    }
                }
                
                // 如果是完成状态，隐藏thinking部分
                if (data.done) {
                    const thinkingSection = container.querySelector('.thinking-section');
                    if (thinkingSection) {
                        thinkingSection.style.opacity = '0.6';
                        thinkingSection.style.fontStyle = 'italic';
                    }
                }
            }
            
            // 处理sources数据，更新右侧片段显示
            if (data.type === 'sources' && data.sources) {
                this.updateRetrievalSidebar(data.sources);
            }
            
            // 滚动到最新消息
            const chatContainer = document.getElementById('chatMessages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }

        addStreamingError(container, errorMessage) {
            if (container) {
                const responseContent = container.querySelector('.response-content');
                if (responseContent) {
                    responseContent.innerHTML = `<span style="color: #e74c3c;">❌ 错误: ${errorMessage}</span>`;
                    responseContent.style.display = 'block';
                }
            }
        }

        addChatMessage(role, content, isLoading = false) {
            const chatContainer = document.getElementById('chatMessages');
            if (!chatContainer) {
                console.error('[CHAT] 聊天容器不存在');
                return null;
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${role} ${isLoading ? 'loading' : ''}`;
            
            const avatar = role === 'user' ? '👤' : '🤖';
            const timestamp = new Date().toLocaleTimeString();
            
            messageDiv.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
            
            chatContainer.appendChild(messageDiv);
            
            // 滚动到底部
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            return messageDiv;
        }

        async performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) {
                this.toast.warning('请输入搜索关键词');
                return;
            }

            console.log('[SEARCH] 开始执行搜索', { query: query });

            // 清空之前的检索片段
            const retrievalContent = document.getElementById('retrievalContent');
            if (retrievalContent) {
                retrievalContent.innerHTML = '<div class="empty-hint">检索中...</div>';
            }

            const category = document.getElementById('categoryFilter').value;
            const resultsContainer = document.getElementById('searchResults');
            const originalContent = resultsContainer.innerHTML;

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="loading-spinner" style="border-color: var(--primary-color); border-top-color: transparent;"></div>
                    <p style="margin-top: 16px;">正在搜索...</p>
                </div>
            `;

            try {
                const settings = window.StateManager?.getState('modelSettings') || {};
                const retrieveCount = settings.retrieveCount || '5';
                const k = retrieveCount === 'all' ? 10000 : parseInt(retrieveCount);
                
                this.log('DEBUG', '搜索使用检索设置', { retrieveCount, k });
                
                const results = await this.api.search(query, {
                    k: k,
                    category: category || null
                });

                console.log('[SEARCH] 搜索结果完整数据:', JSON.stringify(results, null, 2));

                if (!results.results || results.results.length === 0) {
                    resultsContainer.innerHTML = `
                        <div class="empty-state">
                            <span class="empty-icon">🔍</span>
                            <p>未找到相关结果</p>
                            <p style="font-size: 12px; color: var(--text-muted);">试试其他关键词</p>
                        </div>
                    `;
                    return;
                }

                // 遍历搜索结果，添加详细的文件名日志
                results.results.forEach((result, index) => {
                    console.log(`[SEARCH] 搜索结果${index}文件名详情:`, {
                        'result.title': result.title,
                        'result.metadata?.filename': result.metadata?.filename,
                        'result.metadata?.file_name': result.metadata?.file_name,
                        'result.metadata?.title': result.metadata?.title
                    });
                });

                resultsContainer.innerHTML = results.results.map((result, index) => {
                    // 确定显示标题
                    const displayTitle = result.title || result.metadata?.filename || result.metadata?.file_name || result.metadata?.title || '无标题';
                    console.log(`[SEARCH] 结果${index}显示标题:`, displayTitle);
                    
                    return `
                        <div class="search-result" data-index="${index}">
                            <div class="result-header">
                                <h4>${this.escapeHtml(displayTitle)}</h4>
                                <div class="result-meta">
                                    <span class="similarity">相似度: ${(result.similarity * 100).toFixed(1)}%</span>
                                    <span class="category">${this.escapeHtml(result.category || '未分类')}</span>
                                </div>
                            </div>
                            <div class="result-content collapsed">
                                <p>${this.escapeHtml(result.content || result.snippet || '无内容')}</p>
                            </div>
                            <div class="result-actions">
                                <button class="toggle-btn" onclick="app.chatManager.viewFullContent(${index})">
                                    <span class="toggle-text">展开</span>
                                    <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (error) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">❌</span>
                        <p>搜索失败</p>
                        <p style="font-size: 12px; color: var(--text-muted);">${error.message}</p>
                    </div>
                `;
                this.toast.error('搜索失败: ' + error.message);
            }
        }

        viewFullContent(index) {
            const resultsContainer = document.getElementById('searchResults');
            const resultElement = resultsContainer.querySelector(`[data-index="${index}"]`);
            
            if (resultElement) {
                const contentDiv = resultElement.querySelector('.result-content');
                const toggleBtn = resultElement.querySelector('.toggle-btn');
                
                if (contentDiv && toggleBtn) {
                    const isCollapsed = contentDiv.classList.contains('collapsed');
                    
                    if (isCollapsed) {
                        contentDiv.classList.remove('collapsed');
                        contentDiv.style.maxHeight = 'none';
                        toggleBtn.querySelector('.toggle-text').textContent = '折叠';
                        toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
                    } else {
                        contentDiv.classList.add('collapsed');
                        contentDiv.style.maxHeight = '80px';
                        toggleBtn.querySelector('.toggle-text').textContent = '展开';
                        toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
                    }
                }
            }
        }

        async loadRagInfo() {
            try {
                const info = await this.api.ragServiceInfo();
                const models = await this.api.ragModels();
                const config = await this.api.ragConfig();

                let message = `服务状态: ${info.status}\n`;
                message += `RAG版本: ${info.version}\n`;
                message += `向量存储: ${info.vector_store_type || 'ChromaDB'}\n`;
                message += `可用模型: ${models.available_models?.join(', ') || '默认模型'}\n`;

                if (config.default_model) {
                    message += `默认模型: ${config.default_model}`;
                }

                this.toast.info(message.replace(/\n/g, ' | '));
            } catch (error) {
                this.toast.error('获取服务信息失败: ' + error.message);
            }
        }

        clearChatHistory() {
            this.chatHistory = [];
            const chatContainer = document.getElementById('chatMessages');
            if (chatContainer) {
                chatContainer.innerHTML = '';
            }
            // 清空历史后重新显示欢迎屏幕
            this.showWelcomeScreen();
            this.toast.info('聊天历史已清空');
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 获取前端已经显示的相关文段内容作为上下文
        getDisplayedContext() {
            this.log('DEBUG', '开始提取前端显示的上下文');
            
            const retrievalFragments = document.querySelectorAll('.retrieval-fragment');
            this.log('DEBUG', `找到 ${retrievalFragments.length} 个.retrieval-fragment元素`);
            
            const displayedContext = [];
            
            retrievalFragments.forEach((fragment, index) => {
                this.log('DEBUG', `处理第 ${index + 1} 个片段`);
                
                const fragmentContent = fragment.querySelector('.fragment-content p');
                const fragmentTitle = fragment.querySelector('.fragment-title .title-text');
                const fragmentScore = fragment.querySelector('.similarity-score');
                
                this.log('DEBUG', `片段 ${index + 1} DOM元素检查:`, {
                    hasContent: !!fragmentContent,
                    hasTitle: !!fragmentTitle,
                    hasScore: !!fragmentScore
                });
                
                if (fragmentContent) {
                    const content = fragmentContent.textContent;
                    const title = fragmentTitle ? fragmentTitle.textContent : '未知文档';
                    const scoreText = fragmentScore ? fragmentScore.textContent : '0%';
                    const score = parseFloat(scoreText.replace('%', '')) / 100;
                    
                    const contextItem = {
                        content: content,
                        score: score,
                        title: title,
                        source: title,
                        chunk_index: index,
                        document_id: `displayed_${index}`,
                        filename: title,
                        metadata: { title: title }
                    };
                    
                    displayedContext.push(contextItem);
                    
                    this.log('DEBUG', `成功提取片段 ${index + 1} 的上下文:`, {
                        title: title,
                        contentLength: content.length,
                        score: score
                    });
                } else {
                    this.log('WARNING', `片段 ${index + 1} 缺少.content元素，跳过`);
                }
            });
            
            this.log('INFO', `成功提取 ${displayedContext.length} 个显示的上下文片段`);
            
            return displayedContext;
        }

        updateRetrievalSidebar(sources) {
            console.log('[RETRIEVAL] 开始更新右侧片段显示，来源数量:', sources.length);
            console.log('[RETRIEVAL] 来源数据详情:', JSON.stringify(sources, null, 2));
            
            const retrievalContent = document.getElementById('retrievalContent');
            if (!retrievalContent) {
                console.error('[RETRIEVAL] 找不到retrievalContent元素');
                return;
            }

            if (!sources || sources.length === 0) {
                retrievalContent.innerHTML = '<div class="empty-hint">暂无相关内容</div>';
                return;
            }

            // 生成片段HTML
            const fragmentsHtml = sources.map((source, index) => {
                const content = source.content || source.text || '';
                
                // 添加详细的文件名获取日志
                console.log(`[RETRIEVAL] 来源${index}文件名获取详情:`, {
                    'source.metadata?.title': source.metadata?.title,
                    'source.title': source.title,
                    'source.filename': source.filename,
                    'source.metadata?.filename': source.metadata?.filename,
                    'source.metadata?.file_name': source.metadata?.file_name
                });
                
                const title = source.metadata?.title || source.title || source.filename || source.metadata?.filename || source.metadata?.file_name || '未知文档';
                const filename = source.metadata?.filename || source.filename || source.metadata?.file_name || '';
                const score = source.score || source.similarity || 0;
                const chunkId = source.chunk_id || source.chunkIndex || '';
                const documentId = source.document_id || source.documentId || '';
                
                // 显示完整内容
                const displayContent = content;

                return `
                    <div class="retrieval-fragment" data-index="${index}">
                        <div class="fragment-header">
                            <div class="fragment-title">
                                <svg class="fragment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <span class="title-text">${this.escapeHtml(title)}</span>
                            </div>
                            <div class="fragment-meta">
                                <span class="similarity-score">${(score * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="fragment-content">
                            <p>${this.escapeHtml(displayContent)}</p>
                        </div>
                        <div class="fragment-footer">
                            ${filename ? `<span class="filename">📄 ${this.escapeHtml(filename)}</span>` : ''}
                            ${chunkId ? `<span class="chunk-id">片段: ${chunkId}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // 更新侧边栏标题
            const retrievalTitle = document.getElementById('retrievalTitle');
            if (retrievalTitle) {
                retrievalTitle.textContent = `📚 相关片段：${sources.length}`;
            }
            
            retrievalContent.innerHTML = `
                <div class="retrieval-fragments">
                    ${fragmentsHtml}
                </div>
            `;

            console.log('[RETRIEVAL] 右侧片段显示已更新');
        }

        hideWelcomeScreen() {
            console.log('[WELCOME] 隐藏欢迎屏幕');
            const welcomeScreen = document.querySelector('.welcome-screen');
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
                console.log('[WELCOME] ✓ 欢迎屏幕已隐藏');
            } else {
                console.log('[WELCOME] 未找到welcome-screen元素');
            }
        }

        showWelcomeScreen() {
            console.log('[WELCOME] 显示欢迎屏幕');
            const welcomeScreen = document.querySelector('.welcome-screen');
            if (welcomeScreen) {
                welcomeScreen.style.display = 'flex';
                console.log('[WELCOME] ✓ 欢迎屏幕已显示');
            } else {
                console.log('[WELCOME] 未找到welcome-screen元素');
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.ChatManager = ChatManager;
    }
})();