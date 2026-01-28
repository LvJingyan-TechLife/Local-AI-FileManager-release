(function() {
    'use strict';

    const API_BASE = 'http://localhost:9988';

    class APIClient {
        constructor(baseUrl = API_BASE) {
            this.baseUrl = baseUrl;
            this.timeout = 30000;
        }

        async request(method, endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            if (options.body && typeof options.body === 'object') {
                config.body = JSON.stringify(options.body);
            }

            try {
                const response = await fetch(url, config);
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: '请求失败' }));
                    throw new Error(error.message || `HTTP ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error(`[API] ${method} ${url} Error:`, error);
                throw error;
            }
        }

        async getDocuments(page = 1, pageSize = 1000) {
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: pageSize.toString()
            });
            return this.request('GET', `/api/v1/files?${params.toString()}`);
        }

        async uploadFile(file, metadata = {}) {
            console.log('[UPLOAD] 开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
            console.log('[UPLOAD] 元数据:', metadata);
            
            // 检查文件是否有效
            if (!file || !(file instanceof File)) {
                console.error('[UPLOAD] 无效的文件对象:', file);
                throw new Error('无效的文件对象');
            }
            
            const formData = new FormData();
            
            try {
                // 添加文件到FormData
                formData.append('file', file);
                console.log('[UPLOAD] FormData已添加文件:', file.name, '大小:', file.size);
            } catch (error) {
                console.error('[UPLOAD] 添加文件到FormData失败:', error);
                throw new Error('文件处理失败: ' + error.message);
            }

            // 添加所有必要的元数据字段
            if (metadata.title) {
                formData.append('title', String(metadata.title));
                console.log('[UPLOAD] 添加title:', String(metadata.title));
            } else {
                // 至少使用文件名作为标题
                formData.append('title', String(file.name.replace(/\.[^/.]+$/, '')));
                console.log('[UPLOAD] 使用文件名作为title:', String(file.name.replace(/\.[^/.]+$/, '')));
            }
            
            if (metadata.filename) {
                formData.append('filename', String(metadata.filename));
                console.log('[UPLOAD] 添加filename:', String(metadata.filename));
            } else {
                formData.append('filename', String(file.name));
                console.log('[UPLOAD] 使用文件原名为filename:', String(file.name));
            }
            
            if (metadata.description) {
                formData.append('description', String(metadata.description));
                console.log('[UPLOAD] 添加description:', String(metadata.description));
            } else {
                formData.append('description', '');
                console.log('[UPLOAD] 使用空description');
            }
            
            if (metadata.category) {
                formData.append('category', String(metadata.category));
                console.log('[UPLOAD] 添加category:', String(metadata.category));
            } else {
                console.log('[UPLOAD] 不添加category字段，由后端进行自动分类');
            }
            
            if (metadata.file_type) {
                formData.append('file_type', String(metadata.file_type));
                console.log('[UPLOAD] 添加file_type:', String(metadata.file_type));
            } else {
                formData.append('file_type', String(file.type || 'application/octet-stream'));
                console.log('[UPLOAD] 使用文件类型:', String(file.type || 'application/octet-stream'));
            }
            
            if (metadata.size) {
                formData.append('size', String(metadata.size));
                console.log('[UPLOAD] 添加size:', String(metadata.size));
            } else {
                formData.append('size', String(file.size));
                console.log('[UPLOAD] 使用文件大小:', String(file.size));
            }

            const url = `${this.baseUrl}/api/v1/files/upload`;
            console.log('[UPLOAD] 上传URL:', url);
            
            try {
                console.log('[UPLOAD] 发送POST请求...');
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                
                console.log('[UPLOAD] 服务器响应状态:', response.status, response.statusText);
                console.log('[UPLOAD] 响应头:', [...response.headers.entries()]);
                
                if (!response.ok) {
                    console.error('[UPLOAD] 服务器返回错误状态:', response.status);
                    
                    // 尝试获取服务器错误详情
                    let errorDetails = '上传失败';
                    try {
                        const errorJson = await response.json();
                        errorDetails = JSON.stringify(errorJson);
                        console.error('[UPLOAD] 服务器错误详情:', errorJson);
                    } catch (parseError) {
                        console.error('[UPLOAD] 解析错误响应失败:', parseError);
                        errorDetails = `HTTP ${response.status} - ${response.statusText}`;
                    }
                    
                    throw new Error(errorDetails);
                }
                
                const result = await response.json();
                console.log('[UPLOAD] 上传成功, 响应:', result);
                return result;
            } catch (error) {
                console.error('[UPLOAD] 上传过程出错:', error.message);
                console.error('[UPLOAD] 错误堆栈:', error.stack);
                throw error;
            }
        }

        async deleteDocument(id) {
            console.log('[DELETE] 开始删除文档, ID:', id);
            return this.request('DELETE', `/api/v1/files/${id}`);
        }

        async getDocument(id) {
            console.log('[GET] 开始获取文档详情, ID:', id);
            return this.request('GET', `/api/v1/files/${id}`);
        }

        async search(query, options = {}) {
            console.log('[SEARCH-API] 开始搜索请求:', query, '选项:', options);
            const body = {
                query: query,
                k: options.k || 5
            };

            if (options.category) {
                body.category = options.category;
            }

            const url = `/api/v1/search`;
            console.log('[SEARCH-API] 搜索URL:', url);
            console.log('[SEARCH-API] 搜索参数:', body);
            
            try {
                const response = await this.request('POST', url, { body: body });
                console.log('[SEARCH-API] 搜索响应:', JSON.stringify(response, null, 2));
                
                // 专门记录文件名信息
                if (response.results && Array.isArray(response.results)) {
                    const filenames = response.results.map((result, index) => 
                        `结果${index}: filename=${result.metadata?.filename || '未知'}, title=${result.metadata?.title || '未知'}`
                    );
                    console.log('[SEARCH-API] 搜索结果文件名列表:', filenames.join('; '));
                }
                
                return response;
            } catch (error) {
                console.error('[SEARCH-API] 搜索请求失败:', error);
                throw error;
            }
        }

        async detectLanguage(text) {
            return this.request('POST', '/api/v1/nlp/detect', { body: { text } });
        }

        async segmentText(text, language = '') {
            return this.request('POST', '/api/v1/nlp/segment', { body: { text, language } });
        }

        async ragQuestion(question, options = {}) {
            console.log('[RAG-QUESTION] 开始RAG问答请求:', question, '选项:', options);
            const params = {
                question,
                k: options.k || 5,
                content_type: options.content_type || 'all',
                stream: options.stream || false
            };

            if (options.model_provider) {
                params.model_provider = options.model_provider;
            }
            if (options.model_name) {
                params.model_name = options.model_name;
            }

            console.log('[RAG-QUESTION] 请求参数:', params);
            try {
                const response = await this.request('POST', '/api/v1/rag/question', { body: params });
                console.log('[RAG-QUESTION] 响应:', JSON.stringify(response, null, 2));
                
                // 记录来源文档信息
                if (response.references && Array.isArray(response.references)) {
                    const referencesInfo = response.references.map((ref, index) => 
                        `引用${index}: filename=${ref.metadata?.filename || '未知'}, title=${ref.metadata?.title || '未知'}`
                    );
                    console.log('[RAG-QUESTION] 来源文档信息:', referencesInfo.join('; '));
                }
                
                return response;
            } catch (error) {
                console.error('[RAG-QUESTION] 请求失败:', error);
                throw error;
            }
        }

        async ragChat(question, history = [], options = {}) {
            console.log('[RAG-CHAT] 开始RAG对话请求:', question, '历史记录长度:', history.length, '选项:', options);
            const params = {
                question,
                history,
                k: options.k || 5,
                stream: options.stream || false
            };

            if (options.model_provider) {
                params.model_provider = options.model_provider;
            }
            if (options.model_name) {
                params.model_name = options.model_name;
            }
            if (options.search_mode) {
                params.search_mode = options.search_mode;
            }

            console.log('[RAG-CHAT] 请求参数:', params);
            try {
                const response = await this.request('POST', '/api/v1/rag/chat', { body: params });
                console.log('[RAG-CHAT] 响应:', JSON.stringify(response, null, 2));
                
                // 记录来源文档信息
                if (response.references && Array.isArray(response.references)) {
                    const referencesInfo = response.references.map((ref, index) => 
                        `引用${index}: filename=${ref.metadata?.filename || '未知'}, title=${ref.metadata?.title || '未知'}`
                    );
                    console.log('[RAG-CHAT] 来源文档信息:', referencesInfo.join('; '));
                }
                
                return response;
            } catch (error) {
                console.error('[RAG-CHAT] 请求失败:', error);
                throw error;
            }
        }

        async ragRetrieve(query, options = {}) {
            console.log('[RAG-RETRIEVE] 开始RAG检索请求:', query, '选项:', options);
            
            const params = {
                query,
                k: options.k || 5,
                content_type: options.content_type || 'all',
                search_mode: options.search_mode || 'semantic'
            };
            
            console.log('[RAG-RETRIEVE] 请求参数:', params);
            console.log('[RAG-RETRIEVE] 请求URL:', '/api/v1/rag/retrieve');
            
            try {
                const response = await this.request('POST', '/api/v1/rag/retrieve', { body: params });
                console.log('[RAG-RETRIEVE] 响应:', JSON.stringify(response, null, 2));
                
                // 记录检索结果中的文件名信息
                if (response.results && Array.isArray(response.results)) {
                    const filenames = response.results.map((result, index) => 
                        `结果${index}: filename=${result.metadata?.filename || '未知'}, title=${result.metadata?.title || '未知'}`
                    );
                    console.log('[RAG-RETRIEVE] 检索结果文件名列表:', filenames.join('; '));
                }
                
                return response;
            } catch (error) {
                console.error('[RAG-RETRIEVE] 请求失败:', error);
                throw error;
            }
        }

        async ragServiceInfo() {
            return this.request('GET', '/api/v1/rag/info');
        }

        async ragModels() {
            console.log('[🔄函数进入] ragModels - 开始时间:', new Date().toISOString());
            console.log('[🔄函数进入] ragModels - baseUrl:', this.baseUrl);
            console.log('[🔄函数进入] ragModels - 请求路径:', '/api/v1/rag/models');
            
            console.log('[API客户端] 开始获取模型列表');
            try {
                console.log('[API客户端] 准备发送GET请求到:', `${this.baseUrl}/api/v1/rag/models`);
                const result = await this.request('GET', '/api/v1/rag/models');
                console.log('[API客户端] API请求成功，响应数据:', result);
                console.log('[API客户端] 响应数据类型:', typeof result);
                console.log('[API客户端] 响应是否为null/undefined:', result === null, result === undefined);
                return result;
            } catch (error) {
                console.error('[API客户端] API请求失败，错误详情:', error);
                console.error('[API客户端] 错误消息:', error.message);
                console.error('[API客户端] 错误堆栈:', error.stack);
                throw error;
            }
        }

        async ragConfig() {
            return this.request('GET', '/api/v1/rag/config');
        }

        /**
         * ⚠️ 已废弃 - 请使用 ragRetrieve() 方法代替
         * 
         * 语义搜索接口 - 已被 ragRetrieve 替代
         * 
         * 原因说明：
         * 1. 该接口返回结果数量有限（默认10条，最大50条）
         * 2. 不支持精确搜索模式，只能进行语义搜索
         * 3. 不支持跨库搜索（content_type参数）
         * 4. 返回的数据格式与 ragRetrieve 不一致
         * 
         * 推荐替代方案：
         * - 使用 ragRetrieve(query, { k: 10000, content_type: 'all', search_mode: 'exact' })
         * - 支持精确搜索和语义搜索切换
         * - 支持返回更多结果（最多10000条）
         * - 支持跨库搜索（中文库+英文库）
         * 
         * 接口信息：
         * - 路径: POST /api/v1/search
         * - 后端处理器: api/handlers/search_handler.py
         * - 路由: @router.post("/", response_model=FileSearchResponse)
         * 
         * 参数说明：
         * @param {string} query - 搜索查询文本
         * @param {object} options - 可选参数
         * @param {number} options.k - 返回结果数量（默认10，最大50）
         * @param {string} options.category - 分类过滤（可选）
         * 
         * 返回格式：
         * {
         *   status: "success",
         *   message: "Search completed successfully",
         *   query: "搜索查询",
         *   results: [...],
         *   total_results: 结果数量,
         *   knowledge_graph_expansion: {...},
         *   suggestions: {...},
         *   fuzzy_detection: {...}
         * }
         * 
         * 使用示例（已废弃）：
         * const results = await api.semanticSearch("中科亿海微", { k: 10 });
         * 
         * 推荐使用（新方法）：
         * const results = await api.ragRetrieve("中科亿海微", {
         *     k: 10000,
         *     content_type: 'all',
         *     search_mode: 'exact'
         * });
         */
        async semanticSearch(query, options = {}) {
            const params = {
                query,
                k: options.k || 10
            };
            return this.request('POST', '/api/v1/search', { body: params });
        }

        async chatWithContext(question, context, options = {}) {
            console.log('[API-DEBUG] chatWithContext调用开始');
            console.log('[API-DEBUG] chatWithContext参数:');
            console.log('[API-DEBUG]   question:', question);
            console.log('[API-DEBUG]   context数量:', context?.length || 0);
            console.log('[API-DEBUG]   options:', options);
            
            const params = {
                question,
                context,
                model_provider: options.model_provider || undefined,
                model_name: options.model_name || undefined,
                stream: options.stream || false
            };
            
            console.log('[API-DEBUG] chatWithContext请求参数:');
            console.log('[API-DEBUG]   question长度:', question.length);
            console.log('[API-DEBUG]   context数组长度:', context?.length || 0);
            console.log('[API-DEBUG]   stream:', params.stream);
            console.log('[API-DEBUG]   model_provider:', params.model_provider);
            console.log('[API-DEBUG]   model_name:', params.model_name);
            console.log('[API-DEBUG] chatWithContext请求URL:', '/api/v1/rag/chat_with_context');
            
            try {
                const response = await this.request('POST', '/api/v1/rag/chat_with_context', { body: params });
                console.log('[API-DEBUG] chatWithContext调用成功');
                console.log('[API-DEBUG] chatWithContext响应:', response);
                console.log('[API-DEBUG] 响应中是否有answer:', !!response?.answer);
                console.log('[API-DEBUG] 响应中是否有sources:', !!response?.sources);
                console.log('[API-DEBUG] sources数量:', response?.sources?.length || 0);
                return response;
            } catch (error) {
                console.error('[API-DEBUG] chatWithContext调用失败:', error);
                throw error;
            }
        }

        async chatWithContextStream(question, context, options = {}) {
            const params = {
                question,
                context,
                model_provider: options.model_provider || undefined,
                model_name: options.model_name || undefined,
                stream: true
            };

            const url = `${this.baseUrl}/api/v1/rag/chat_with_context`;
            console.log('[Stream] 请求URL:', url);
            console.log('[Stream] 请求参数:', params);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: '请求失败' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return response.body;
        }

        async ragStream(question, options = {}) {
            const params = {
                question,
                k: options.k || 5,
                content_type: options.content_type || 'all',
                stream: true
            };

            if (options.model_provider) {
                params.model_provider = options.model_provider;
            }
            if (options.model_name) {
                params.model_name = options.model_name;
            }
            if (options.search_mode) {
                params.search_mode = options.search_mode;
            }

            const url = `${this.baseUrl}/api/v1/rag/stream`;
            console.log('[Stream] 请求URL:', url);
            console.log('[Stream] 请求参数:', params);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: '请求失败' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return response.body;
        }

        async generateDocument(topic, requirements, length, context = []) {
            return this.request('POST', '/api/v1/docgen/generate', {
                body: {
                    topic,
                    requirements,
                    length,
                    context
                }
            });
        }

        async exportDocument(content, format, filename) {
            return this.request('POST', '/api/v1/docgen/export', {
                body: {
                    content,
                    format,
                    filename
                }
            });
        }

        async generateOutline(params, stream = true, onChunk = null) {
            console.log('[DOCGEN-API] 开始生成大纲请求:', params, '流式:', stream);
            // 文档生成接口在bs_server服务（9989端口）中
            const url = 'http://localhost:9989/api/generate/outline';
            
            // 如果是流式请求，我们需要使用不同的处理方式
            if (stream) {
                return new Promise((resolve, reject) => {
                    // 创建一个fetch请求
                    const controller = new AbortController();
                    const signal = controller.signal;
                    
                    const config = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...params,
                            stream: true
                        }),
                        signal
                    };
                    
                    fetch(url, config)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`);
                            }
                            
                            // 检查是否是事件流响应
                            if (!response.headers.get('content-type').includes('text/event-stream')) {
                                // 如果不是事件流，尝试解析为JSON
                                return response.json().then(resolve).catch(reject);
                            }
                            
                            // 获取响应的可读流
                            const reader = response.body.getReader();
                            const decoder = new TextDecoder();
                            let buffer = '';
                            
                            // 最终结果
                            let finalResult = null;
                            
                            // 读取流的函数
                            function read() {
                                return reader.read().then(({ done, value }) => {
                                    if (done) {
                                        resolve(finalResult);
                                        return;
                                    }
                                    
                                    // 解码新数据
                                    buffer += decoder.decode(value, { stream: true });
                                    
                                    // 处理事件流
                                    const events = buffer.split('\n\n');
                                    buffer = events.pop(); // 保留不完整的事件
                                    
                                    for (const event of events) {
                                        if (!event) continue;
                                        
                                        // 解析事件数据
                                        const lines = event.split('\n');
                                        let data = '';
                                        
                                        for (const line of lines) {
                                            if (line.startsWith('data:')) {
                                                data += line.substring(5).trim();
                                            }
                                        }
                                        
                                        if (data) {
                                            // 检查是否是完成信号
                                            if (data === '[DONE]') {
                                                resolve(finalResult);
                                                return;
                                            }
                                            
                                            try {
                                                // 解析JSON数据
                                                const parsedData = JSON.parse(data);
                                                
                                                // 处理不同类型的数据
                                                if (parsedData.type === 'token') {
                                                    // AI生成内容或思考过程
                                                    if (onChunk) {
                                                        onChunk({
                                                            success: true,
                                                            type: 'token',
                                                            content: parsedData.content || '',
                                                            thinking: parsedData.thinking || '',
                                                            done: parsedData.done || false
                                                        });
                                                    }
                                                    
                                                    // 累积内容作为最终结果
                                                    if (parsedData.content) {
                                                        finalResult = (finalResult || '') + parsedData.content;
                                                    }
                                                } else if (parsedData.type === 'complete') {
                                                    // 完成信号
                                                    resolve(finalResult || '');
                                                    return;
                                                } else if (parsedData.type === 'error') {
                                                    // 错误信息
                                                    console.error('[API] 收到错误:', parsedData.message);
                                                    if (onChunk) {
                                                        onChunk({
                                                            success: false,
                                                            type: 'error',
                                                            data: parsedData.message
                                                        });
                                                    }
                                                }
                                            } catch (e) {
                                                // 如果解析失败，尝试作为纯文本处理（兼容旧格式）
                                                console.warn('[API] JSON解析失败，尝试纯文本处理:', e);
                                                finalResult = data;
                                                if (onChunk) {
                                                    onChunk({
                                                        success: true,
                                                        type: 'content',
                                                        data: data
                                                    });
                                                }
                                            }
                                        }
                                    }
                                    
                                    // 继续读取
                                    return read();
                                }).catch(error => {
                                    reject(error);
                                });
                            }
                            
                            // 开始读取
                            read();
                        })
                        .catch(error => {
                            console.error('[API] POST', url, 'Error:', error);
                            reject(error);
                        });
                });
            } else {
                // 非流式请求（保持原有逻辑）
                const config = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...params,
                        stream: false
                    })
                };
                try {
                    const response = await fetch(url, config);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return await response.json();
                } catch (error) {
                    console.error('[API] POST', url, 'Error:', error);
                    throw error;
                }
            }
        }

        async generateContent(params, stream = true, onChunk = null) {
            console.log('[DOCGEN-API] 开始生成内容请求:', params, '流式:', stream);
            const url = 'http://localhost:9989/api/generate/content';
            
            if (stream) {
                return new Promise((resolve, reject) => {
                    const controller = new AbortController();
                    const signal = controller.signal;
                    
                    const config = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...params,
                            stream: true
                        }),
                        signal
                    };
                    
                    fetch(url, config)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`);
                            }
                            
                            if (!response.headers.get('content-type').includes('text/event-stream')) {
                                return response.json().then(resolve).catch(reject);
                            }
                            
                            const reader = response.body.getReader();
                            const decoder = new TextDecoder();
                            let buffer = '';
                            let finalResult = null;
                            
                            function read() {
                                return reader.read().then(({ done, value }) => {
                                    if (done) {
                                        resolve(finalResult);
                                        return;
                                    }
                                    
                                    buffer += decoder.decode(value, { stream: true });
                                    
                                    const events = buffer.split('\n\n');
                                    buffer = events.pop();
                                    
                                    for (const event of events) {
                                        if (!event) continue;
                                        
                                        const lines = event.split('\n');
                                        let data = '';
                                        
                                        for (const line of lines) {
                                            if (line.startsWith('data:')) {
                                                data += line.substring(5).trim();
                                            }
                                        }
                                        
                                        if (data) {
                                            if (data === '[DONE]') {
                                                resolve(finalResult);
                                                return;
                                            }
                                            
                                            try {
                                                const parsedData = JSON.parse(data);
                                                
                                                if (parsedData.type === 'token') {
                                                    if (onChunk) {
                                                        onChunk({
                                                            success: true,
                                                            type: 'token',
                                                            content: parsedData.content || '',
                                                            thinking: parsedData.thinking || '',
                                                            done: parsedData.done || false,
                                                            chapter_index: parsedData.chapter_index || 0
                                                        });
                                                    }
                                                    
                                                    if (parsedData.content) {
                                                        finalResult = (finalResult || '') + parsedData.content;
                                                    }
                                                } else if (parsedData.type === 'chapter_start') {
                                                    if (onChunk) {
                                                        onChunk({
                                                            success: true,
                                                            type: 'chapter_start',
                                                            chapter_index: parsedData.chapter_index || 0
                                                        });
                                                    }
                                                } else if (parsedData.type === 'chapter_complete') {
                                                    if (onChunk) {
                                                        onChunk({
                                                            success: true,
                                                            type: 'chapter_complete',
                                                            chapter_index: parsedData.chapter_index || 0
                                                        });
                                                    }
                                                } else if (parsedData.type === 'error') {
                                                    console.error('[API] 收到错误:', parsedData.message);
                                                    if (onChunk) {
                                                        onChunk({
                                                            success: false,
                                                            type: 'error',
                                                            data: parsedData.message
                                                        });
                                                    }
                                                }
                                            } catch (e) {
                                                console.warn('[API] JSON解析失败:', e);
                                                finalResult = data;
                                                if (onChunk) {
                                                    onChunk({
                                                        success: true,
                                                        type: 'content',
                                                        data: data
                                                    });
                                                }
                                            }
                                        }
                                    }
                                    
                                    return read();
                                }).catch(error => {
                                    reject(error);
                                });
                            }
                            
                            read();
                        })
                        .catch(error => {
                            console.error('[API] POST', url, 'Error:', error);
                            reject(error);
                        });
                });
            } else {
                const config = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...params,
                        stream: false
                    })
                };
                try {
                    const response = await fetch(url, config);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return await response.json();
                } catch (error) {
                    console.error('[API] POST', url, 'Error:', error);
                    throw error;
                }
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.APIClient = APIClient;
    }
})();