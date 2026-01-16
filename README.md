# 本地文件AI管理系统 - 发布包

## 📦 打包说明

本发布包使用 PyInstaller 将 Python 应用程序打包为独立的可执行文件，无需安装 Python 环境即可运行。

### 打包特点

✅ **无源码暴露**：所有 Python 代码已编译打包到 exe 中
✅ **完整依赖**：包含所有必需的 Python 库和依赖
✅ **独立运行**：无需安装 Python 环境
✅ **相对路径**：所有配置、数据、日志路径都使用相对路径
✅ **模型分离**：模型文件放在 models 目录，不打包到 exe 中

## 📁 目录结构

```
发布包/
├── FileManagementSystem.exe    # 主程序（可执行文件）
├── config/                     # 配置文件目录
│   ├── settings.py            # 应用配置
│   └── .env.example          # 环境变量模板
├── data/                       # 数据目录
│   ├── database/              # 数据库文件
│   │   └── .gitkeep        # Git 占位文件
│   └── file_management.db    # SQLite 数据库
├── app/                        # 应用文件
│   ├── web/                  # 前端文件（运行时自动复制到 web 目录）
│   │   ├── assets/          # 静态资源
│   │   │   ├── css/        # 样式文件
│   │   │   └── js/         # JavaScript 文件
│   │   ├── pages/           # HTML 页面
│   │   └── public/          # 公共资源
│   └── __init__.py
├── scripts/                    # 脚本目录
│   ├── init.py               # 环境初始化脚本
│   ├── startall.py           # 启动脚本
│   ├── build.py              # 构建脚本
│   └── compile_pyc.py        # 编译脚本
├── web/                        # 前端文件（运行时自动创建）
├── .gitignore                  # Git 忽略文件
├── README.md                   # 中文说明文档
├── README.en.md                # 英文说明文档
├── LICENSE                     # 许可证文件
└── start.bat                   # Windows 启动脚本
```

## 🚀 快速开始

### 1. 环境准备

首次运行前，需要下载模型文件到 `models` 目录：

```bash
# 下载中文嵌入模型
# 从 Hugging Face 下载：https://huggingface.co/BAAI/bge-base-zh-v1.5
# 解压到 models/bge-base-zh-v1.5/

# 下载英文/多语言嵌入模型
# 从 Hugging Face 下载：https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
# 解压到 models/multilingual-MiniLM-L12-v2/
```

### 2. 配置环境

复制环境变量模板并修改：

```bash
# Windows
copy config\.env.example config\.env

# 编辑 config\.env 文件，配置你的 API 密钥等
```

### 3. 启动应用

```bash
# Windows - 双击运行
FileManagementSystem.exe

# 或使用启动脚本
start.bat

# 或命令行运行
.\FileManagementSystem.exe
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **BS 前端界面**: http://localhost:9989
- **File Management API**: http://localhost:9988
- **API 文档**: http://localhost:9988/docs

## ⚙️ 配置说明

### 端口配置

应用使用以下端口，请确保端口未被占用：

- **API 服务端口**: 9988
- **BS 服务端口**: 9989

### 环境变量

在 `config/.env` 文件中配置以下变量：

```env
# AI 模型配置
OPENAI_API_KEY=your_openai_api_key
OLLAMA_MODEL=deepseek-r1:1.5b
LMSTUDIO_MODEL=your_model_name

# 日志配置
LOG_LEVEL=INFO
LOG_TO_FILE=true
LOG_TO_CONSOLE=true
```

### 路径配置

所有路径都使用相对路径，基于 exe 所在目录：

- **数据库**: `data/database/`
- **上传文件**: `data/file_storage/`
- **日志文件**: `logs/`
- **模型文件**: `models/`

## 🔧 故障排除

### 问题 1：端口被占用

**症状**: 启动时提示端口已被使用

**解决方案**:
```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr "9988"
netstat -ano | findstr "9989"

# 结束进程
taskkill /PID <进程ID> /F
```

### 问题 2：模型文件未找到

**症状**: 启动时提示模型文件不存在

**解决方案**:
1. 确保模型文件已下载到 `models` 目录
2. 检查模型目录结构是否正确
3. 在 `config/.env` 中配置正确的模型路径

### 问题 3：权限错误

**症状**: 启动时提示权限不足

**解决方案**:
1. 以管理员身份运行 exe
2. 检查 `data` 和 `logs` 目录的写入权限

### 问题 4：依赖库缺失

**症状**: 启动时提示缺少某个库

**解决方案**:
- 本发布包已包含所有必需的依赖，如果仍然报错，请重新下载完整的发布包

## 📊 系统要求

### 最低配置

- **操作系统**: Windows 10/11 (64位)
- **内存**: 8GB RAM
- **磁盘空间**: 5GB 可用空间
- **网络**: 需要网络连接（用于 AI 模型调用）

### 推荐配置

- **操作系统**: Windows 10/11 (64位)
- **内存**: 16GB RAM
- **磁盘空间**: 10GB 可用空间
- **CPU**: 多核处理器
- **GPU**: NVIDIA GPU（可选，用于加速 AI 推理）

## 📝 日志说明

日志文件保存在 `logs` 目录下：

- `api.log`: API 服务日志
- `bs_server.log`: BS 服务日志
- `app.log`: 应用主日志

日志级别可在 `config/.env` 中配置：
- DEBUG: 详细调试信息
- INFO: 一般信息（默认）
- WARNING: 警告信息
- ERROR: 错误信息
- CRITICAL: 严重错误

## 🔒 安全说明

1. **API 密钥**: 请妥善保管你的 API 密钥，不要将 `.env` 文件提交到版本控制
2. **数据安全**: 上传的文件和数据库都保存在本地，不会上传到云端
3. **网络安全**: 建议在内网环境使用，如需外网访问请配置防火墙

## 📞 技术支持

如遇到问题，请：

1. 查看 `logs` 目录下的日志文件
2. 检查本文档的故障排除部分
3. 联系技术支持并提供日志信息

## 📄 许可证

本软件的使用请遵守相关许可证条款。

## 🔄 更新日志

### v1.0.0 (2026-01-15)
- ✅ 初始发布版本
- ✅ 支持文件上传和管理
- ✅ 支持 AI 驱动的文档搜索
- ✅ 支持自然语言处理
- ✅ 支持 RAG（检索增强生成）
- ✅ 支持多语言文档处理
- ✅ 改进启动日志格式
- ✅ 优化 ChromaDB 模块打包
