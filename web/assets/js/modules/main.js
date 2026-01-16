(function() {
    'use strict';

    // 全局应用实例
    let appInstance = null;

    // 应用初始化函数
    async function initializeApp() {
        console.log('[MAIN] 🚀 应用启动开始');
        
        try {
            // 检查必要的依赖是否已加载
            if (typeof window.APIClient === 'undefined') {
                throw new Error('APIClient 未加载');
            }
            if (typeof window.ToastManager === 'undefined') {
                throw new Error('ToastManager 未加载');
            }
            if (typeof window.CategoryManager === 'undefined') {
                throw new Error('CategoryManager 未加载');
            }
            if (typeof window.FileManager === 'undefined') {
                throw new Error('FileManager 未加载');
            }
            if (typeof window.ChatManager === 'undefined') {
                throw new Error('ChatManager 未加载');
            }
            if (typeof window.App === 'undefined') {
                throw new Error('App 未加载');
            }

            console.log('[MAIN] ✓ 所有依赖模块已加载');

            // 创建应用实例
            appInstance = new window.App();
            
            console.log('[MAIN] ✓ 应用实例创建成功');

            // 初始化应用
            await appInstance.init();
            
            // 将应用实例暴露给全局作用域（用于调试和删除按钮功能）
            window.app = appInstance;
            console.log('[MAIN] 应用实例已挂载到window.app');
            
            console.log('[MAIN] 🎉 应用初始化完成！');
            
        } catch (error) {
            console.error('[MAIN] ❌ 应用初始化失败:', error);
            
            // 显示错误信息给用户
            if (document.body) {
                document.body.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: #f8f9fa;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        z-index: 9999;
                    ">
                        <div style="
                            background: white;
                            padding: 40px;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            text-align: center;
                            max-width: 400px;
                        ">
                            <h2 style="color: #dc3545; margin-bottom: 16px;">应用启动失败</h2>
                            <p style="color: #6c757d; margin-bottom: 20px;">${error.message}</p>
                            <button onclick="location.reload()" style="
                                background: #007bff;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                            ">重新加载</button>
                        </div>
                    </div>
                `;
            }
        }
    }

    // DOM加载完成后的初始化
    function onDOMReady() {
        console.log('[MAIN] DOM 加载完成');
        console.log('[MAIN] document.readyState:', document.readyState);
        
        // 如果DOM已经就绪，立即初始化
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initializeApp();
        } else {
            // 否则等待DOMContentLoaded事件
            document.addEventListener('DOMContentLoaded', initializeApp);
        }
    }

    // 监听DOM状态变化
    function checkDOMState() {
        console.log('[MAIN] 检查DOM状态:', document.readyState);
        
        if (document.readyState === 'loading') {
            console.log('[MAIN] DOM 正在加载中...');
        } else if (document.readyState === 'interactive') {
            console.log('[MAIN] DOM 已就绪，可以交互');
        } else if (document.readyState === 'complete') {
            console.log('[MAIN] DOM 完全加载');
        }
    }

    // 全局错误处理
    window.addEventListener('error', (event) => {
        console.error('[MAIN] 全局错误:', event.error);
        
        // 如果应用实例存在，通知Toast管理器
        if (appInstance && appInstance.toast) {
            appInstance.toast.error('应用发生错误: ' + event.error.message);
        }
    });

    // 未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[MAIN] 未处理的Promise错误:', event.reason);
        
        // 如果应用实例存在，通知Toast管理器
        if (appInstance && appInstance.toast) {
            appInstance.toast.error('异步操作失败: ' + event.reason);
        }
        
        // 防止错误在控制台重复显示
        event.preventDefault();
    });

    // 页面卸载时的清理
    window.addEventListener('beforeunload', () => {
        console.log('[MAIN] 页面即将卸载，执行清理...');
        
        // 可以在这里添加清理逻辑
        if (appInstance) {
            console.log('[MAIN] 清理应用实例...');
        }
    });

    // 页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
        console.log('[MAIN] 页面可见性变化:', document.visibilityState);
        
        if (document.visibilityState === 'visible') {
            // 页面变为可见时，可以执行一些恢复操作
            console.log('[MAIN] 页面重新可见');
        } else if (document.visibilityState === 'hidden') {
            // 页面隐藏时，可以执行一些暂停操作
            console.log('[MAIN] 页面隐藏');
        }
    });

    // 启动应用
    checkDOMState();
    onDOMReady();

    // 将应用实例暴露给全局作用域（用于调试和删除按钮功能）
    window.getApp = () => appInstance;
    window.app = appInstance;

    // 开发模式下显示详细信息
    if (typeof window !== 'undefined') {
        console.log('[MAIN] 📋 应用信息:');
        console.log('[MAIN] - 版本: 2.0.0 (重构版)');
        console.log('[MAIN] - 架构: 模块化');
        console.log('[MAIN] - 模块: API, Toast, Categories, FileManager, ChatManager');
        console.log('[MAIN] - 启动时间:', new Date().toLocaleString());
        
        // 检查浏览器兼容性
        if (!window.fetch) {
            console.warn('[MAIN] 警告: 浏览器不支持 fetch API');
        }
        if (!window.Promise) {
            console.warn('[MAIN] 警告: 浏览器不支持 Promise');
        }
        if (!window.localStorage) {
            console.warn('[MAIN] 警告: 浏览器不支持 localStorage');
        }
    }

})();