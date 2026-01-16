# 模型部署指南

本文档介绍如何在本地文件AI管理系统中部署和配置AI模型。

## 目录

- [模型概述](#模型概述)
- [环境准备](#环境准备)
- [模型下载](#模型下载)
- [模型配置](#模型配置)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

## 模型概述

### 系统使用的模型

本系统使用以下AI模型：

1. **嵌入模型（Embedding Model）**
   - 模型: bge-base-zh-v1.5
   - 用途: 文本向量化，用于语义搜索
   - 语言: 中文为主，支持英文
   - 维度: 768

2. **生成模型（Generation Model）**
   - 模型: 可配置（支持多种LLM）
   - 用途: 文档生成、RAG对话
   - 支持: OpenAI API、本地LLM等

### 模型存储位置

- 嵌入模型: `data/models/bge-base-zh-v1.5/`
- 生成模型: 根据配置动态加载

## 环境准备

### 硬件要求

**最低配置**:
- CPU: 4核心
- 内存: 8GB
- 磁盘: 20GB可用空间
- GPU: 可选

**推荐配置**:
- CPU: 8核心
- 内存: 16GB
- 磁盘: 50GB SSD
- GPU: NVIDIA GPU（CUDA支持）

### 软件依赖

```bash
# 核心依赖
pip install torch>=2.0.0
pip install transformers>=4.30.0
pip install sentence-transformers>=2.2.0
pip install langchain>=0.0.300

# 向量数据库
pip install chromadb>=0.4.0
pip install langchain-chroma>=0.1.0

# 嵌入模型
pip install langchain-huggingface>=0.0.1
```

## 模型下载

### 自动下载

首次运行时，系统会自动下载嵌入模型：

```python
from core.ai_model.factory import ModelFactory

# 自动下载并加载模型
model = ModelFactory.get_embedding_model()
```

### 手动下载

如需手动下载模型：

```bash
# 使用Hugging Face CLI
pip install huggingface-hub
huggingface-cli download BAAI/bge-base-zh-v1.5 --local-dir data/models/bge-base-zh-v1.5
```

### 验证模型

验证模型是否正确下载：

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('data/models/bge-base-zh-v1.5')
embeddings = model.encode(["测试文本"])
print(f"Embedding shape: {embeddings.shape}")
```

## 模型配置

### 嵌入模型配置

编辑 `config/ai_model_config.py`:

```python
EMBEDDING_MODEL_CONFIG = {
    "model_name": "bge-base-zh-v1.5",
    "model_path": "data/models/bge-base-zh-v1.5",
    "device": "cuda",  # 或 "cpu"
    "batch_size": 32,
    "max_length": 512,
    "normalize_embeddings": True
}
```

### 生成模型配置

编辑 `config/ai_model_config.py`:

```python
# 使用OpenAI API
GENERATION_MODEL_CONFIG = {
    "provider": "openai",
    "model_name": "gpt-3.5-turbo",
    "api_key": "your-api-key",
    "base_url": "https://api.openai.com/v1",
    "temperature": 0.7,
    "max_tokens": 2000
}

# 或使用本地LLM（如Ollama）
GENERATION_MODEL_CONFIG = {
    "provider": "ollama",
    "model_name": "llama2",
    "base_url": "http://localhost:11434",
    "temperature": 0.7,
    "max_tokens": 2000
}
```

### RAG配置

```python
RAG_CONFIG = {
    "top_k": 5,              # 检索的文档数量
    "chunk_size": 500,       # 文档分块大小
    "chunk_overlap": 50,      # 分块重叠大小
    "similarity_threshold": 0.7,  # 相似度阈值
    "max_context_length": 4000   # 最大上下文长度
}
```

## 性能优化

### GPU加速

如果使用NVIDIA GPU，确保正确安装CUDA：

```bash
# 检查CUDA是否可用
python -c "import torch; print(torch.cuda.is_available())"

# 安装CUDA版本的PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 批处理优化

调整批处理大小以提高吞吐量：

```python
EMBEDDING_MODEL_CONFIG = {
    "batch_size": 64,  # 增加批处理大小
    ...
}
```

### 模型量化

对大模型进行量化以减少内存占用：

```python
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0
)
```

### 缓存策略

启用模型缓存：

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_embedding(text):
    return model.encode(text)
```

## 故障排查

### 模型加载失败

**问题**: 模型加载时出现错误

**解决方案**:
1. 检查模型文件是否完整
2. 验证模型路径配置
3. 检查磁盘空间是否充足
4. 查看日志文件: `logs/core/`

### 内存不足

**问题**: 运行时出现内存不足错误

**解决方案**:
1. 减小批处理大小
2. 使用模型量化
3. 增加系统内存
4. 使用CPU而非GPU

### GPU不可用

**问题**: 无法使用GPU加速

**解决方案**:
1. 检查CUDA是否正确安装
2. 验证GPU驱动是否最新
3. 检查PyTorch是否支持CUDA
4. 回退到CPU模式

### 模型性能差

**问题**: 模型响应速度慢

**解决方案**:
1. 使用GPU加速
2. 优化批处理大小
3. 使用更小的模型
4. 启用模型缓存

### 下载速度慢

**问题**: 模型下载速度很慢

**解决方案**:
1. 使用国内镜像源
2. 手动下载模型文件
3. 使用代理加速

## 模型更新

### 更新嵌入模型

```bash
# 备份旧模型
mv data/models/bge-base-zh-v1.5 data/models/bge-base-zh-v1.5.backup

# 下载新模型
huggingface-cli download BAAI/bge-base-zh-v1.6 --local-dir data/models/bge-base-zh-v1.6

# 更新配置
# 编辑 config/ai_model_config.py
```

### 重新索引文档

更换模型后需要重新索引所有文档：

```python
from core.service_factory import get_sqlite_service, get_multivector_service

sqlite_service = get_sqlite_service()
multivector_service = get_multivector_service()

# 获取所有文档
documents = sqlite_service.get_all_documents()

# 重新索引
for doc in documents:
    multivector_service.add_document(doc)
```

## 最佳实践

1. **定期备份**: 定期备份模型和向量数据库
2. **监控性能**: 监控模型使用情况和性能指标
3. **版本管理**: 记录使用的模型版本
4. **测试验证**: 更新模型后进行充分测试
5. **文档记录**: 记录模型配置和优化经验

## 参考资料

- [Hugging Face文档](https://huggingface.co/docs)
- [Sentence-Transformers文档](https://www.sbert.net/)
- [LangChain文档](https://python.langchain.com/)
- [ChromaDB文档](https://docs.trychroma.com/)
