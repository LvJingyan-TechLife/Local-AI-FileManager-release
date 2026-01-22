(function() {
    'use strict';

    class CategoryManager {
        constructor() {
        console.log('[CATEGORY-MANAGER] 构造函数开始执行');
        
        // 初始化分类映射
        this.categoryToMajor = {
            // 🏢 技术研发类
            '技术架构设计': '技术研发类',
            '开发规范文档': '技术研发类',
            'API接口规范': '技术研发类',
            '数据库设计文档': '技术研发类',
            '系统运维手册': '技术研发类',
            '测试用例文档': '技术研发类',
            '技术方案文档': '技术研发类',
            '系统架构图': '技术研发类',
            
            // 💼 业务管理类
            '业务流程文档': '业务管理类',
            '产品需求文档': '业务管理类',
            '市场调研报告': '业务管理类',
            '竞品分析报告': '业务管理类',
            '商业计划书': '业务管理类',
            '运营策略方案': '业务管理类',
            '业务规范文档': '业务管理类',
            
            // 📊 财务法务类
            '财务报表': '财务法务类',
            '预算方案': '财务法务类',
            '合同模板': '财务法务类',
            '法律条款文档': '财务法务类',
            '审计报告': '财务法务类',
            '税务筹划方案': '财务法务类',
            '成本分析报告': '财务法务类',
            
            // 👥 人力资源类
            '招聘流程文档': '人力资源类',
            '培训体系文档': '人力资源类',
            '绩效考核标准': '人力资源类',
            '薪酬福利方案': '人力资源类',
            '员工手册': '人力资源类',
            '组织架构图': '人力资源类',
            '岗位说明书': '人力资源类',
            
            // 📈 市场营销类
            '营销策划方案': '市场营销类',
            '品牌建设方案': '市场营销类',
            '客户分析报告': '市场营销类',
            '营销素材库': '市场营销类',
            '活动策划方案': '市场营销类',
            '新媒体运营方案': '市场营销类',
            '市场推广计划': '市场营销类',
            
            // 📋 项目管理类
            '项目计划书': '项目管理类',
            '需求规格文档': '项目管理类',
            '会议纪要': '项目管理类',
            '项目进度报告': '项目管理类',
            '风险管控方案': '项目管理类',
            '项目复盘报告': '项目管理类',
            '里程碑文档': '项目管理类',
            
            // 🏛️ 行政管理类
            '公司制度': '行政管理类',
            '通知公告': '行政管理类',
            '办公流程文档': '行政管理类',
            '行政记录': '行政管理类',
            '供应商管理文档': '行政管理类',
            '办公资产管理': '行政管理类',
            '流程规范文档': '行政管理类',
            
            // 🎓 培训教育类
            '培训课程资料': '培训教育类',
            '学习指南': '培训教育类',
            '考试题库': '培训教育类',
            '技能认证文档': '培训教育类',
            '在线学习课程': '培训教育类',
            '培训效果评估': '培训教育类',
            
            // 🔒 合规安全类
            '信息安全政策': '合规安全类',
            '合规审计报告': '合规安全类',
            '风险评估报告': '合规安全类',
            '应急预案': '合规安全类',
            '数据安全管理': '合规安全类',
            '合规检查清单': '合规安全类',
            
            // 📎 其他文档
            '个人工作文档': '其他文档',
            '临时工作文件': '其他文档',
            '参考资料库': '其他文档',
            '通用模板': '其他文档',
            '其他文档': '其他文档'
        };
        
        console.log('[CATEGORY-MANAGER] 初始化categoryToMajor完成 | 分类总数:', Object.keys(this.categoryToMajor).length);
        console.log('[CATEGORY-MANAGER] categoryToMajor内容:', this.categoryToMajor);
        
        // 初始化大类信息
        this.majorCategoryInfo = {
            '技术研发类': { icon: '🏢', color: 'blue' },
            '业务管理类': { icon: '💼', color: 'green' },
            '财务法务类': { icon: '📊', color: 'purple' },
            '人力资源类': { icon: '👥', color: 'orange' },
            '市场营销类': { icon: '📈', color: 'pink' },
            '项目管理类': { icon: '📋', color: 'teal' },
            '行政管理类': { icon: '🏛️', color: 'indigo' },
            '培训教育类': { icon: '🎓', color: 'amber' },
            '合规安全类': { icon: '🔒', color: 'red' },
            '其他文档': { icon: '📎', color: 'gray' }
        };
        
        console.log('[CATEGORY-MANAGER] 初始化majorCategoryInfo完成 | 大类总数:', Object.keys(this.majorCategoryInfo).length);
        
        // 验证初始化结果
        const categoryCount = Object.keys(this.categoryToMajor).length;
        if (categoryCount === 0) {
            console.error('[CATEGORY-MANAGER] 严重错误：categoryToMajor初始化后为空');
        } else {
            console.log('[CATEGORY-MANAGER] 构造函数执行完成 | 小分类总数:', categoryCount);
        }
    }
        
        // 获取分类对应的大类
        getMajorCategory(category) {
            return this.categoryToMajor[category] || '其他文档';
        }
        
        // 获取大类信息
        getMajorCategoryInfo(majorCategory) {
            return this.majorCategoryInfo[majorCategory] || { icon: '📎', color: 'gray' };
        }
        
        // 获取所有大类
        getAllMajorCategories() {
            return Object.keys(this.majorCategoryInfo);
        }
        
        // 获取所有分类
    getAllCategories() {
        console.log('[CATEGORY-MANAGER] 开始获取所有小分类 | 当前categoryToMajor:', this.categoryToMajor);
        console.log('[CATEGORY-MANAGER] categoryToMajor类型:', typeof this.categoryToMajor);
        console.log('[CATEGORY-MANAGER] categoryToMajor是否为对象:', this.categoryToMajor instanceof Object);
        
        let categories = [];
        try {
            // 尝试获取所有小分类
            categories = Object.keys(this.categoryToMajor);
            console.log('[CATEGORY-MANAGER] 使用Object.keys获取分类成功 | 小分类总数:', categories.length);
        } catch (error) {
            console.error('[CATEGORY-MANAGER] 使用Object.keys获取分类失败:', error);
            categories = [];
        }
        
        // 检查分类是否为空
        if (!Array.isArray(categories)) {
            console.error('[CATEGORY-MANAGER] 分类列表不是数组类型，重置为空数组');
            categories = [];
        }
        
        console.log('[CATEGORY-MANAGER] 当前获取的小分类列表:', categories);
        console.log('[CATEGORY-MANAGER] 当前获取的小分类总数:', categories.length);
        
        // 如果返回空数组，手动返回所有预定义的小分类
        if (categories.length === 0) {
            console.error('[CATEGORY-MANAGER] 分类列表为空，返回预定义分类');
            return [
                '技术架构设计', '开发规范文档', 'API接口规范', '数据库设计文档', '系统运维手册',
                '测试用例文档', '技术方案文档', '系统架构图', '业务流程文档', '产品需求文档',
                '市场调研报告', '竞品分析报告', '商业计划书', '运营策略方案', '业务规范文档',
                '财务报表', '预算方案', '合同模板', '法律条款文档', '审计报告',
                '税务筹划方案', '成本分析报告', '招聘流程文档', '培训体系文档', '绩效考核标准',
                '薪酬福利方案', '员工手册', '组织架构图', '岗位说明书', '营销策划方案',
                '品牌建设方案', '客户分析报告', '营销素材库', '活动策划方案', '新媒体运营方案',
                '市场推广计划', '项目计划书', '需求规格文档', '会议纪要', '项目进度报告',
                '风险管控方案', '项目复盘报告', '里程碑文档', '公司制度', '通知公告',
                '办公流程文档', '行政记录', '供应商管理文档', '办公资产管理', '流程规范文档',
                '培训课程资料', '学习指南', '考试题库', '技能认证文档', '在线学习课程',
                '培训效果评估', '信息安全政策', '合规审计报告', '风险评估报告', '应急预案',
                '数据安全管理', '合规检查清单', '个人工作文档', '临时工作文件', '参考资料库',
                '通用模板', '其他文档'
            ];
        }
        
        console.log('[CATEGORY-MANAGER] 获取所有小分类完成 | 返回分类数:', categories.length);
        return categories;
    }
    }

    if (typeof window !== 'undefined') {
        window.CategoryManager = CategoryManager;
    }
})();