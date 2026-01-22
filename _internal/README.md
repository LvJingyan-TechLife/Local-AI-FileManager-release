# 本地文件AI管理系统

基于 **RAG（检索增强生成）** 技术的本地化AI文档管理系统，支持文档上传、语义搜索与智能对话，**完全本地部署**，所有数据存储在本地，无需云端依赖。

---

## 核心功能

### 1. 智能对话（RAG问答）

- **流式响应**：回答实时增量显示，体验流畅
- **AI思维可视化**：支持查看模型推理过程（thinking内容）
- **来源引用追溯**：明确标注回答依据的文档片段
- **对话历史管理**：支持历史记录保存与回顾
- **可配置检索**：自定义检索片段数量、相似度阈值等参数
- **精确搜索模式**：支持基于特定文档片段的精准问答

### 2. 文档生成

- **智能大纲生成**：基于搜索结果自动生成文档大纲
- **多文档类型支持**：支持生成 Word、PPT 等多种格式文档
- **灵活配置选项**：
  - 生成长度：简短（~500字）、中等（~2000字）、详细（~5000字）
  - 编号格式：阿拉伯数字（1, 2, 3...）
  - 章节数量：1-20章可调
- **流式输出**：大纲生成过程实时显示，支持AI思维可视化
- **内容参考**：基于已上传文档的搜索结果生成相关内容

### 3. 语义搜索

- **向量相似度匹配**：基于BGE模型的精准语义检索
- **分类筛选**：支持按文档类型、创建时间、分类（大类/小类）等维度筛选
- **结果高亮**：搜索关键词在结果中高亮显示
- **原文预览**：快速查看匹配片段的上下文

### 4. 文档管理

- **多格式支持**：PDF、Word(DOCX/DOC)、Markdown、TXT、Excel(XLSX/XLS)、CSV、JSON、PowerPoint(PPTX/PPT)、RTF、HTML/HTM等
- **自动处理**：文本提取、智能分块、批量向量化
- **智能分类**：基于文件名、扩展名、关键词的自动分类系统（支持11个大类，数十个小类）
- **文件去重**：基于MD5哈希值识别重复文件
- **状态追踪**：实时显示文档处理状态（待处理/已完成/失败）
- **批量操作**：支持单个/批量上传、删除与检索

### 5. 文件上传

- **拖拽上传**：支持文件拖拽到界面上传
- **批量上传**：一次选择多个文件上传
- **进度显示**：实时显示上传与处理进度
- **格式检测**：自动识别文件格式并提示

### 6. 自动分类系统

- **智能分类**：基于文件名、扩展名、内容关键词的自动分类
- **多级分类体系**：支持11个大类，数十个小类的精准分类
- **置信度计算**：为每个分类结果提供置信度评分
- **可扩展规则**：支持自定义分类规则和关键词

#### 支持的分类类型

##### 🏢 技术研发类
- 技术架构设计、开发规范文档、API接口规范、数据库设计文档、系统运维手册、测试用例文档、技术方案文档、系统架构图

##### 💼 业务管理类
- 业务流程文档、产品需求文档、市场调研报告、竞品分析报告、商业计划书、运营策略方案、业务规范文档

##### 📊 财务法务类
- 财务报表、预算方案、合同模板、法律条款文档、审计报告、税务筹划方案、成本分析报告

##### 👥 人力资源类
- 招聘流程文档、培训体系文档、绩效考核标准、薪酬福利方案、员工手册、组织架构图、岗位说明书

##### 📈 市场营销类
- 营销策划方案、品牌建设方案、客户分析报告、营销素材库、活动策划方案、新媒体运营方案、市场推广计划

##### 📋 项目管理类
- 项目计划书、需求规格文档、会议纪要、项目进度报告、风险管控方案、项目复盘报告、里程碑文档

##### 🏛️ 行政管理类
- 公司制度、通知公告、办公流程文档、行政记录、供应商管理文档、办公资产管理、流程规范文档

##### 🎓 培训教育类
- 培训课程资料、学习指南、考试题库、技能认证文档、在线学习课程、培训效果评估

##### 🔒 合规安全类
- 信息安全政策、合规审计报告、风险评估报告、应急预案、数据安全管理、合规检查清单

##### 📎 其他文档
- 个人工作文档、临时工作文件、参考资料库、通用模板

---

## 技术架构

### 系统架构概述

本系统采用前后端分离架构，严格遵循模块化设计原则：

- **File Management Service (端口 9988)**：核心后端服务，基于 FastAPI 构建，提供文档管理、向量检索、RAG对话等核心功能
- **BS Frontend Service (端口 9989)**：前端服务，基于 Flask 构建，提供静态资源服务和API转发功能
- **双服务协同**：BS服务作为前端入口，将用户请求转发到File Management服务处理

### 部署规范

**重要**：系统严格遵循以下部署规范：

1. **统一启动**：必须使用 `startall.py` 脚本启动所有服务，禁止手动单独启动服务
2. **端口管理**：系统仅使用端口 9988 和 9989，禁止使用其他端口
3. **端口冲突检测**：启动前会自动检测端口占用情况，如有冲突需先解决
4. **日志集成**：所有服务均集成完整的日志系统，支持问题追踪和故障排查
5. **优雅关闭**：支持 Ctrl+C 优雅关闭所有服务，确保数据完整性

### 后端技术栈

| 技术 | 用途 |
|------|------|
| FastAPI | 高性能Web框架，提供REST API |
| Flask | BS前端API服务，提供静态资源和API转发 |
| Uvicorn | ASGI服务器，支持异步处理 |
| ChromaDB | 轻量级向量数据库，存储文档向量 |
| SQLite | 本地元数据存储，无需额外数据库服务 |
| sentence-transformers | 嵌入模型（BGE-base-zh-v1.5），文本向量化 |
| pdfplumber | PDF文本提取 |
| python-docx | Word文档读取 |
| python-pptx | PowerPoint文档读取 |
| striprtf | RTF文档读取 |
| pandas | Excel/CSV文件处理 |
| mammoth | Word 97-2003文档读取 |

### 自动分类系统技术实现

| 组件 | 用途 |
|------|------|
| `bs_server/auto_classifier.py` | 自动分类器核心实现 |
| 多维度特征提取 | 文件名、扩展名、内容关键词 |
| 规则引擎 | 基于关键词和扩展名的分类规则 |
| 置信度算法 | 多特征加权的分类置信度计算 |
| 多级分类映射 | 小类到大类的自动映射关系 |

### 文档生成系统技术实现

| 组件 | 用途 |
|------|------|
| `bs_server/generateFile/outline_generator.py` | 文档大纲生成器 |
| 流式输出 | 支持实时显示生成过程和AI思维 |
| 多格式支持 | 支持生成 Word、PPT 等格式 |
| 智能提示词构建 | 根据搜索结果动态构建生成提示词 |

### 前端技术栈

| 技术 | 用途 |
|------|------|
| 原生JavaScript | 无框架依赖，轻量高效 |
| Server-Sent Events (SSE) | 实现流式响应，支持实时数据推送 |
| CSS Variables | 动态主题与响应式设计 |

### 数据存储结构

```
file_management/
├── storage/
│   ├── vectors/
│   │   ├── chinese/      # 中文文档向量索引
│   │   ├── english/      # 英文文档向量索引
│   │   └── chroma.sqlite3 # 向量数据库文件
│   ├── file_management.db # 文档元数据（文件名、路径、哈希等）
│   └── knowledge_graph.db # 知识图谱（可选）
├── models/
│   └── bge-base-zh-v1.5/ # 本地嵌入模型（BGE-base-zh-v1.5）
└── logs/                # 日志文件目录
```

---

## API接口

### 文件管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/files/upload` | 上传文件（支持拖拽/选择文件，自动分类） |
| GET | `/api/v1/files` | 获取文档列表（包含大类和小类分类信息） |
| GET | `/api/v1/files/{file_id}` | 获取文档详情（元数据+内容片段+分类信息） |
| DELETE | `/api/v1/files/{file_id}` | 删除指定文档 |
| GET | `/api/v1/files/stats` | 获取统计信息 |

### 语义搜索

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/search?q=关键词` | 简单搜索（关键词匹配） |
| POST | `/api/v1/search` | 综合搜索（支持分类、相似度筛选） |

### RAG对话

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/rag/chat` | 发送对话请求（非流式） |
| POST | `/api/v1/rag/chat_with_context` | 基于上下文对话（支持流式） |
| POST | `/api/v1/rag/retrieve` | 文档检索 |
| GET | `/api/v1/rag/info` | RAG服务信息 |
| GET | `/api/v1/rag/models` | 可用模型列表 |
| GET | `/api/v1/rag/health` | 健康检查 |

### 文档生成

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/generate/outline` | 生成文档大纲（流式输出） |

### NLP工具

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/nlp/segment` | 文本分词处理 |
| POST | `/api/v1/nlp/detect` | 语言检测（中文/英文） |

---

## 快速开始

### 环境要求

- Python 3.10+
- Ollama（本地模型服务，需提前安装）
- 至少8GB内存（推荐16GB+）

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/LvJingyan-TechLife/Local-AI-FileManager-debug.git
cd Local-AI-FileManager-debug

# 2. 创建虚拟环境
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量
copy config\.env.example .env  # Windows
# cp config/.env.example .env  # Linux/Mac
# 编辑.env文件，设置Ollama模型等参数
```

### 启动服务

```bash
# 使用全局启动脚本（唯一推荐方式）
python startall.py
```

**服务端口说明**：
- File Management API 服务：9988（核心后端服务）
- BS 前端服务：9989（前端界面和API转发）

服务启动后，访问 `http://localhost:9989` 即可使用系统。

**注意事项**：
- 系统严格使用端口 9988 和 9989，请确保这两个端口未被占用
- 如果端口被占用，请先关闭占用该端口的程序
- 禁止手动单独启动服务，必须使用 `startall.py` 启动所有服务

---

## 使用指南

### 1. 上传文档

1. 点击左侧导航栏「文件上传」
2. 拖拽文件到上传区域，或点击「选择文件」按钮
3. 等待处理完成（自动提取文本、分块、向量化）
4. 查看处理结果（成功/失败提示）

### 2. 语义搜索

1. 点击左侧导航栏「语义搜索」
2. 输入搜索关键词（支持中文/英文）
3. 可选：选择分类筛选条件（如文档类型、创建时间）
4. 查看搜索结果列表，点击「查看详情」可展开匹配片段

### 3. 智能对话

1. 点击左侧导航栏「智能对话」
2. 在输入框中输入问题
3. 等待AI生成回答（流式显示，实时更新）
4. 可在右上角配置模型、检索数量等参数
5. 点击「查看来源」可追溯回答依据的文档片段
6. 支持精确搜索模式：选择特定文档片段进行精准问答

### 4. 文档生成

1. 点击左侧导航栏「文档生成」
2. 在左侧搜索框输入关键词，搜索参考内容
3. 配置生成参数：
   - **文档类型**：选择 Word 或 PPT
   - **生成长度**：选择简短、中等或详细
   - **编号格式**：选择阿拉伯数字编号
   - **章节数量**：设置1-20章
4. 点击「生成大纲」按钮
5. 查看AI生成的大纲（支持流式显示和思维过程）
6. 可选择参考内容片段，点击「生成内容」生成完整文档
7. 点击「导出文档」下载生成的文档

---

## 配置说明

### 环境变量 (.env)

```env
# Ollama配置（必选）
OLLAMA_BASE_URL=http://localhost:11434  # Ollama服务地址
OLLAMA_MODEL=qwen2.5:7b                # Ollama模型名称（如qwen2.5:7b、llama3:8b）

# OpenAI配置（可选，用于替代Ollama）
OPENAI_API_KEY=your-api-key            # OpenAI API密钥
OPENAI_MODEL=gpt-4                     # OpenAI模型名称（如gpt-4、gpt-3.5-turbo）

# 数据库配置
CHROMA_PERSIST_DIR=./file_management/storage/vectors  # 向量数据库存储路径

# 其他配置
LOG_LEVEL=INFO                         # 日志级别（DEBUG/INFO/WARNING/ERROR）
```

### RAG参数配置

可在 `file_management/ai_model/config.py` 中调整以下参数：

- `retrieval_k`: 检索片段数量（默认5，建议1-10）
- `similarity_threshold`: 相似度阈值（默认0.5，建议0.3-0.7）
- `context_max_length`: 上下文最大长度（默认2048，避免模型过载）
- `prompt_template`: 提示词模板（自定义回答格式）

---

## 项目结构

```
本地文件AI管理系统/
├── config/              # 配置文件目录
│   ├── .env.example     # 环境变量示例
│   └── requirements.txt # 项目依赖
├── logs/                # 日志文件目录
│   ├── bs_server.log    # BS前端服务日志
│   ├── outline_generator.log # 文档生成日志
│   └── ...              # 其他日志文件
├── src/                 # 源代码目录
│   ├── bs_app/          # 前端应用（HTML/JS/CSS）
│   │   ├── index.html   # 主页面
│   │   ├── styles.css   # 样式文件（响应式设计）
│   │   └── js/          # 前端JavaScript模块
│   │       ├── api.js   # API调用封装
│   │       ├── app.js   # 应用主逻辑
│   │       ├── categories.js # 分类管理
│   │       ├── chat.js  # 聊天功能
│   │       ├── docgen.js # 文档生成功能
│   │       ├── file-manager.js # 文件管理
│   │       └── main.js  # 入口文件
│   ├── bs_server/       # BS端服务器
│   │   ├── auto_classifier.py # 自动分类器核心实现
│   │   ├── hybrid_classifier.py # 混合分类器（可选）
│   │   ├── generateFile/ # 文档生成模块
│   │   │   ├── __init__.py
│   │   │   └── outline_generator.py # 大纲生成器
│   │   └── server.py    # 服务器启动脚本（Flask）
│   ├── desktop_app/     # 桌面应用（可选）
│   │   ├── api_client.py # API客户端
│   │   └── main.py      # 桌面应用入口
│   └── file_management/ # 核心后端
│       ├── ai_model/    # AI模型层（Ollama/OpenAI实现）
│       │   ├── base.py  # 模型基类
│       │   ├── config.py # 模型配置
│       │   ├── factory.py # 模型工厂
│       │   ├── ollama_model.py # Ollama模型实现
│       │   └── openai_model.py # OpenAI模型实现
│       ├── api/         # API层
│       │   ├── handlers/ # API处理器
│       │   │   ├── file_handler.py # 文件管理API
│       │   │   ├── nlp_handler.py # NLP工具API
│       │   │   ├── rag_handler.py # RAG对话API
│       │   │   └── search_handler.py # 搜索API
│       │   └── router.py # 路由聚合
│       ├── config/      # 全局配置
│       │   └── settings.py # 配置加载
│       ├── services/    # 业务服务层
│       │   ├── nlp/     # NLP服务
│       │   ├── content_detector.py # 内容检测
│       │   ├── embedding_manager.py # 嵌入管理
│       │   ├── file_processor.py # 文件处理（包含自动分类调用）
│       │   ├── multivector_storage.py # 多向量存储
│       │   ├── rag_service.py # RAG服务
│       │   └── service_factory.py # 服务工厂
│       ├── main.py      # 后端主入口
│       └── start.py     # 启动脚本
├── .gitignore           # Git忽略配置
├── LICENSE              # 许可证文件
├── README.md            # 本文档
└── startall.py          # 全局启动脚本
```

---

## 扩展开发

### 添加新模型

1. 继承 `ai_model/base.py` 中的 `BaseModel` 类
2. 实现 `chat(self, question: str, context: str) -> str` 和 `stream_chat(self, question: str, context: str) -> Generator` 方法
3. 在 `ai_model/factory.py` 的 `ModelFactory` 类中注册新模型

### 添加新处理器

1. 在 `api/handlers/` 下创建新处理器（如 `new_handler.py`）
2. 定义API路由（使用 `@router.post()` 等装饰器）
3. 在 `api/router.py` 中导入并注册新路由

### 自定义提示词

修改 `file_management/ai_model/config.py` 中的 `prompt_template` 变量：

```python
prompt_template = """
基于以下上下文回答问题。

上下文：
{context}

问题：
{question}

请提供详细的回答，并标注信息来源。
"""
```

---

## 常见问题

### Q: Ollama连接失败？

- 确保Ollama服务已启动：执行 `ollama serve`
- 检查 `.env` 文件中的 `OLLAMA_BASE_URL` 是否正确（默认 `http://localhost:11434`）
- 确保Ollama模型已下载（如 `ollama pull deepseek-r1:1.5b`）

### Q: 向量检索无结果？

- 检查文档是否已成功上传并处理（状态为"已完成"）
- 尝试降低相似度阈值（如从0.5调整到0.3）
- 确认嵌入模型是否正确加载（BGE模型路径是否正确）

### Q: 如何查看日志？

日志文件位于 `file_management/logs/` 目录：

- `ollama.log`: Ollama模型调用日志
- `rag_handler.log`: RAG处理日志
- `api.log`: API请求日志
- `bs_server.log`: BS前端服务日志
- `outline_generator.log`: 文档生成日志

### Q: 支持哪些文档格式？

目前支持：PDF、Word(DOCX/DOC)、Markdown、TXT、Excel(XLSX/XLS)、CSV、JSON、PowerPoint(PPTX/PPT)、RTF、HTML/HTM等。如需支持其他格式，可在 `src/file_management/services/file_processor.py` 中扩展文本提取逻辑。

### Q: 自动分类系统如何工作？

自动分类系统基于文件名、扩展名和内容关键词进行分类：
1. 首先分析文件名中的关键词和文件扩展名
2. 然后提取文件内容并检测关键词
3. 根据预定义的规则进行匹配和分类
4. 最后计算分类置信度并返回结果

### Q: 如何自定义分类规则？

可以在 `src/bs_server/auto_classifier.py` 文件中修改分类规则：
- 编辑 `category_to_major` 映射表调整大类和小类的关系
- 修改 `classification_rules` 添加或调整分类关键词和扩展名

### Q: 分类结果不准确怎么办？

可以通过以下方式优化分类结果：
1. 增加更具体的关键词到分类规则中
2. 调整分类规则的优先级
3. 检查文件内容是否清晰可提取
4. 对于特殊文件可以手动指定分类

### Q: 文档生成功能如何使用？

文档生成功能基于已上传的文档内容生成新文档：
1. 首先上传相关文档到系统
2. 在文档生成页面搜索参考内容
3. 选择参考内容片段
4. 配置生成参数（文档类型、长度、章节数等）
5. 点击生成大纲，AI会基于参考内容生成结构化大纲
6. 可进一步生成完整文档并导出

### Q: 文档生成支持哪些格式？

目前支持生成以下格式：
- Word文档（.docx）
- PowerPoint演示文稿（.pptx）

---

## 许可证
# 许可协议：CC BY-NC-4.0 非商业署名许可 + 商业授权补充

## 核心规则
1. **个人/非商业使用**：
   可自由复制、修改、分享本项目，需保留原作者署名（标注项目来源及作者信息）。
2. **商业使用限制**：
   禁止任何商业公司（含企业、盈利机构）未经授权的使用（包括但不限于：集成到商业产品、用于付费服务、企业内部部署等）。
3. **商业授权方式**：
   商业公司如需使用本项目，需联系 [530240412@qq.com/MLvjingyan(微信号)] 协商付费授权，授权条款以双方签订的协议为准。

## 免责声明
本项目仅作技术交流使用，作者不对软件的功能完整性、安全性及使用风险承担法律责任。

（CC BY-NC-4.0 官方文本参考：https://creativecommons.org/licenses/by-nc/4.0/legalcode）