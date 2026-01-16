/**
 * 全局状态管理文件
 * 统一管理应用程序的全局变量和状态
 */

// 全局状态对象
const AppState = {
    // 当前活跃的标签页
    currentTab: 'chat',
    
    // 模型设置
    modelSettings: {
        provider: 'ollama',
        modelName: 'deepseek-r1:1.5b',
        retrieveCount: 'all',
        streamOutput: false,
        includeContext: true,
        searchMode: 'regular'
    },
    
    // 聊天相关状态
    chatState: {
        isStreaming: false,
        currentStreamingContainer: null,
        chatHistory: []
    },
    
    // 文档管理状态
    documentState: {
        currentDocuments: [],
        selectedDocuments: [],
        uploadProgress: null,
        isLoading: false
    },
    
    // UI状态
    uiState: {
        isInitialized: false,
        toastQueue: [],
        loadingStates: {}
    },
    
    // 应用设置
    appSettings: {
        autoSave: true,
        debugMode: false,
        theme: 'default'
    }
};

// 全局配置常量
const AppConfig = {
    // API配置
    apiBaseUrl: '/api/v1',
    
    // UI配置
    ui: {
        maxChatHistory: 100,
        maxDocumentList: 50,
        toastDuration: 3000,
        animationDuration: 300
    },
    
    // 文件配置
    files: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['.txt', '.pdf', '.doc', '.docx'],
        uploadChunkSize: 1024 * 1024 // 1MB
    },
    
    // 搜索配置
    search: {
        defaultK: 5,
        maxK: 20,
        timeout: 30000 // 30秒
    }
};

// 全局事件管理
const AppEvents = {
    listeners: {},
    
    // 添加事件监听器
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    },
    
    // 移除事件监听器
    off(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
        }
    },
    
    // 触发事件
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('事件处理错误 [' + eventName + ']:', error);
                }
            });
        }
    }
};

// 全局工具函数
const AppUtils = {
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 深度克隆
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 格式化时间
    formatTime(date) {
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // 验证文件类型
    validateFileType(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return AppConfig.files.allowedTypes.includes(ext);
    },
    
    // 验证文件大小
    validateFileSize(fileSize) {
        return fileSize <= AppConfig.files.maxFileSize;
    }
};

// 本地存储管理
const AppStorage = {
    // 设置存储键前缀
    storagePrefix: 'ai_file_manager_',
    
    // 保存数据到localStorage
    set(key, value) {
        try {
            const storageKey = this.storagePrefix + key;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(storageKey, serializedValue);
            console.log('[STORAGE] 保存数据:', value);
            return true;
        } catch (error) {
            console.error('[STORAGE] 保存数据失败:', error);
            return false;
        }
    },
    
    // 从localStorage获取数据
    get(key, defaultValue = null) {
        try {
            const storageKey = this.storagePrefix + key;
            const storedValue = localStorage.getItem(storageKey);
            if (storedValue === null) {
                return defaultValue;
            }
            const parsedValue = JSON.parse(storedValue);
            console.log('[STORAGE] 获取数据:', parsedValue);
            return parsedValue;
        } catch (error) {
            console.error('[STORAGE] 获取数据失败:', error);
            return defaultValue;
        }
    },
    
    // 删除localStorage中的数据
    remove(key) {
        try {
            const storageKey = this.storagePrefix + key;
            localStorage.removeItem(storageKey);
            console.log('[STORAGE] 删除数据:', key);
            return true;
        } catch (error) {
            console.error('[STORAGE] 删除数据失败:', error);
            return false;
        }
    },
    
    // 清空所有应用数据
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('[STORAGE] 清空所有应用数据');
            return true;
        } catch (error) {
            console.error('[STORAGE] 清空数据失败:', error);
            return false;
        }
    },
    
    // 获取所有应用存储的键
    getAllKeys() {
        try {
            const keys = Object.keys(localStorage);
            return keys.filter(key => key.startsWith(this.storagePrefix))
                      .map(key => key.replace(this.storagePrefix, ''));
        } catch (error) {
            console.error('[STORAGE] 获取键列表失败:', error);
            return [];
        }
    }
};

// 状态管理器
const StateManager = {
    // 获取状态
    getState(path) {
        const keys = path.split('.');
        let current = AppState;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    },
    
    // 设置状态
    setState(path, value) {
        const keys = path.split('.');
        let current = AppState;
        
        // 导航到父对象
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 设置最终值
        const finalKey = keys[keys.length - 1];
        current[finalKey] = value;
        
        // 触发状态变更事件
        AppEvents.emit('stateChanged', { path, value, oldValue: this.getState(path) });
        
        console.log('[STATE] 状态更新:', value);
    },
    
    // 更新状态（合并对象）
    updateState(path, updates) {
        const currentState = this.getState(path) || {};
        const newState = { ...currentState, ...updates };
        this.setState(path, newState);
    },
    
    // 重置状态到默认值
    resetState(path) {
        const defaultValues = {
            'modelSettings': AppState.modelSettings,
            'chatState': AppState.chatState,
            'documentState': AppState.documentState,
            'uiState': AppState.uiState,
            'appSettings': AppState.appSettings
        };
        
        if (defaultValues[path]) {
            this.setState(path, AppUtils.deepClone(defaultValues[path]));
        } else {
            console.warn('[STATE] 未找到默认状态:', path);
        }
    }
};

// 应用初始化管理
const AppInit = {
    // 初始化标志
    isInitialized: false,
    
    // 初始化回调
    initCallbacks: [],
    
    // 添加初始化回调
    onInit(callback) {
        this.initCallbacks.push(callback);
    },
    
    // 执行初始化
    async init() {
        if (this.isInitialized) {
            console.log('[INIT] 应用已经初始化过');
            return;
        }
        
        console.log('[INIT] 开始初始化应用...');
        
        try {
            // 恢复保存的设置
            this.restoreSettings();
            
            // 执行所有初始化回调
            for (const callback of this.initCallbacks) {
                await callback();
            }
            
            this.isInitialized = true;
            StateManager.setState('uiState.isInitialized', true);
            
            console.log('[INIT] 应用初始化完成');
            AppEvents.emit('appInitialized');
            
        } catch (error) {
            console.error('[INIT] 应用初始化失败:', error);
        }
    },
    
    // 恢复设置
    restoreSettings() {
        const savedSettings = AppStorage.get('settings');
        if (savedSettings) {
            console.log('[INIT] 恢复保存的设置:', savedSettings);
            
            // 自动更新旧的默认值
            if (savedSettings.retrieveCount === '5') {
                console.log('[INIT] 检测到旧的默认值5，自动更新为all');
                savedSettings.retrieveCount = 'all';
                // 保存更新后的设置
                AppStorage.set('settings', savedSettings);
            }
            
            StateManager.updateState('modelSettings', savedSettings);
        }
    }
};

// 导出到全局对象
if (typeof window !== 'undefined') {
    window.AppState = AppState;
    window.AppConfig = AppConfig;
    window.AppEvents = AppEvents;
    window.AppUtils = AppUtils;
    window.AppStorage = AppStorage;
    window.StateManager = StateManager;
    window.AppInit = AppInit;
}

// 如果在Node.js环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        AppConfig,
        AppEvents,
        AppUtils,
        AppStorage,
        StateManager,
        AppInit
    };
}
