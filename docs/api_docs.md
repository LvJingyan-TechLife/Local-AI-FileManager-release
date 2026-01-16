# API接口文档

本文档描述了本地文件AI管理系统的所有API接口。

## 目录

- [文件管理API](#文件管理api)
- [搜索API](#搜索api)
- [RAG对话API](#rag对话api)
- [NLP处理API](#nlp处理api)
- [文档生成API](#文档生成api)

## 文件管理API

### 上传文件

**接口**: `POST /api/v1/files/upload`

**请求参数**:
- `file`: 文件对象（multipart/form-data）

**响应示例**:
```json
{
  "status": "success",
  "message": "文件上传成功",
  "data": {
    "document_id": 1,
    "file_name": "example.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "upload_time": "2024-01-01 12:00:00"
  }
}
```

### 获取文件列表

**接口**: `GET /api/v1/files/list`

**查询参数**:
- `page`: 页码（默认1）
- `page_size`: 每页数量（默认20）
- `category`: 分类筛选（可选）

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "items": [...]
  }
}
```

### 删除文件

**接口**: `DELETE /api/v1/files/{document_id}`

**响应示例**:
```json
{
  "status": "success",
  "message": "文件删除成功"
}
```

## 搜索API

### 语义搜索

**接口**: `GET /api/v1/search`

**查询参数**:
- `query`: 搜索查询文本
- `top_k`: 返回结果数量（默认5）
- `category`: 分类筛选（可选）

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "query": "如何使用RAG技术",
    "results": [
      {
        "document_id": 1,
        "file_name": "RAG技术指南.pdf",
        "chunk_id": "chunk_1",
        "content": "RAG（Retrieval-Augmented Generation）是一种结合检索和生成的AI技术...",
        "similarity": 0.95,
        "metadata": {...}
      }
    ]
  }
}
```

## RAG对话API

### RAG对话

**接口**: `POST /api/v1/rag/chat`

**请求参数**:
```json
{
  "query": "什么是RAG技术？",
  "top_k": 5,
  "stream": true
}
```

**响应**: SSE流式响应

### 文档生成

**接口**: `POST /api/v1/rag/generate`

**请求参数**:
```json
{
  "topic": "人工智能发展史",
  "style": "学术",
  "length": "medium"
}
```

**响应**: SSE流式响应

## NLP处理API

### 语言检测

**接口**: `POST /api/v1/nlp/detect-language`

**请求参数**:
```json
{
  "text": "Hello World, 你好世界"
}
```

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "language": "mixed",
    "languages": [
      {"language": "english", "confidence": 0.5},
      {"language": "chinese", "confidence": 0.5}
    ]
  }
}
```

### 文本分词

**接口**: `POST /api/v1/nlp/segment`

**请求参数**:
```json
{
  "text": "人工智能是计算机科学的一个分支",
  "language": "chinese"
}
```

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "tokens": ["人工智能", "是", "计算机科学", "的", "一个", "分支"]
  }
}
```

## 文档生成API

### 生成大纲

**接口**: `POST /api/v1/docgen/outline`

**请求参数**:
```json
{
  "topic": "机器学习基础",
  "style": "学术",
  "depth": 3
}
```

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "topic": "机器学习基础",
    "outline": [
      {
        "title": "第一章：机器学习概述",
        "sections": [...]
      }
    ]
  }
}
```

### 生成文档

**接口**: `POST /api/v1/docgen/generate`

**请求参数**:
```json
{
  "outline": {...},
  "style": "学术"
}
```

**响应**: SSE流式响应

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |
