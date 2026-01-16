# 系统调用流程图

## 1. 服务启动流程

```mermaid
flowchart TD
    A[运行 start.py] --> B[获取本机IP地址]
    B --> C[输出服务信息]
    C --> D[启动 FastAPI 应用]
    D --> E[初始化服务容器]
    E --> F[初始化数据库]
    F --> G[初始化向量数据库]
    G --> H[启动 Uvicorn 服务器]
    H --> I[监听 9988 端口]
```

## 2. 文件上传处理流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Router as API路由
    participant FileHandler as FileHandler
    participant Processor as FileProcessor
    participant SQLite as SQLite存储
    participant ChromaDB as ChromaDB向量库

    Client->>Router: POST /files/upload
    Router->>FileHandler: handle_upload()
    FileHandler->>Processor: process_file()
    
    Note over Processor: 1. 文件类型检测
    Note over Processor: 2. 读取文件内容
    
    alt PDF文件
        Processor->>Processor: 调用 pdfplumber 提取文本
    else Word文件(DOCX)
        Processor->>Processor: 调用 python-docx 提取文本
    else Word文件(DOC)
        Processor->>Processor: 调用 mammoth 提取文本
    else Excel文件(XLSX/XLS)
        Processor->>Processor: 调用 pandas 提取文本
    else PowerPoint文件(PPTX/PPT)
        Processor->>Processor: 调用 python-pptx 提取文本
    else RTF文件
        Processor->>Processor: 调用 striprtf 提取文本
    else HTML/HTM文件
        Processor->>Processor: 读取原始文本
    else Markdown文件
        Processor->>Processor: 读取原始文本
    else 纯文本文件
        Processor->>Processor: 读取原始文本
    else JSON/XML文件
        Processor->>Processor: 读取原始文本
    end
    
    Processor->>Processor: 3. 生成MD5哈希
    
    alt 文件已存在
        Processor->>SQLite: check_file_exists(file_hash)
        SQLite-->>Processor: 返回文档ID
        Processor-->>FileHandler: 返回重复提示
        FileHandler-->>Client: 409 Conflict
    else 新文件
        Processor->>Processor: 4. 文本分块
        
        loop 每个分块
            Processor->>SQLite: add_chunk()
        end
        
        Processor->>Processor: 5. 批量向量化
        Processor->>ChromaDB: index_documents()
        ChromaDB-->>Processor: 返回向量ID列表
        
        Processor->>Processor: 6. 更新索引
        Processor->>SQLite: update_document_indexed()
        
        FileHandler-->>Client: 200 OK {chunk_count}
    end
```

## 3. 语义搜索流程

```mermaid
flowchart TD
    A[客户端请求] --> B[POST GET /search 或 GET /search]
    B --> C{请求类型}
    
    C -->|GET with query param| D[解析查询参数]
    C -->|POST with JSON body| E[解析请求体]
    
    D --> F[SearchHandler.search()]
    E --> F
    
    F --> G{搜索模式}
    
    G -->|简单搜索| H[直接调用 ChromaDB.search]
    G -->|综合搜索| I[获取文档元数据]
    
    I --> J[SQLite: get_documents_by_ids]
    J --> K[合并搜索结果与元数据]
    K --> L[格式化输出]
    
    H --> L
    L --> M[返回搜索结果]
```

## 4. 文件删除流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Router as API路由
    participant FileHandler as FileHandler
    participant Processor as FileProcessor
    participant SQLite as SQLite存储
    participant ChromaDB as ChromaDB向量库

    Client->>Router: DELETE /files/{file_id}
    Router->>FileHandler: handle_delete()
    FileHandler->>Processor: delete_file()
    
    Processor->>SQLite: get_document(file_id)
    
    alt 文档存在
        Processor->>SQLite: get_chunks(document_id)
        Processor->>ChromaDB: delete_by_document_id()
        Processor->>SQLite: delete_document()
        FileHandler-->>Client: 200 OK
    else 文档不存在
        FileHandler-->>Client: 404 Not Found
    end
```

## 5. 文件处理核心流程

```mermaid
flowchart TD
    A[开始处理文件] --> B[文件类型检测]
    B --> C{文件类型}
    
    C -->|PDF| D[使用 pdfplumber 提取文本]
    C -->|DOCX| E[使用 python-docx 读取段落]
    C -->|DOC| E2[使用 mammoth 提取文本]
    C -->|XLSX/XLS| F[使用 pandas 提取文本]
    C -->|PPTX/PPT| G[使用 python-pptx 提取文本]
    C -->|RTF| H[使用 striprtf 提取文本]
    C -->|HTML/HTM| I[直接读取文件内容]
    C -->|MD/TXT/JSON/XML| I
    C -->|其他| J[返回错误: 不支持的文件类型]
    
    D --> K[生成文件MD5哈希]
    E --> K
    E2 --> K
    F --> K
    G --> K
    H --> K
    I --> K
    
    K --> L{文件是否已存在}
    
    L -->|是| M[返回已存在信息]
    L -->|否| N[文本分块处理]
    
    N --> O{分块数量}
    
    O -->|≤1| P[单个分块]
    O -->|>1| Q[重叠分块]
    
    M --> O[存储到 SQLite]
    N --> O
    
    O --> P[批量向量化]
    P --> Q[存储到 ChromaDB]
    Q --> R[更新文档索引状态]
    R --> S[返回处理结果]
```

## 6. 组件依赖关系

```mermaid
flowchart TB
    subgraph 服务层
        SF[ServiceFactory]
    end
    
    subgraph 存储层
        SQLite[SQLiteStorageService]
        ChromaDB[ChromaDBStorageService]
    end
    
    subgraph 处理层
        FP[FileProcessor]
    end
    
    subgraph API层
        FH[FileHandler]
        SH[SearchHandler]
    end
    
    subgraph FastAPI
        App[FastAPI 应用]
        Router[API Router]
    end
    
 Router    App -->
    Router --> FH
    Router --> SH
    
    FH --> FP
    SH --> ChromaDB
    
    FP --> SF
    FH --> SF
    SH --> SF
    
    SF --> SQLite
    SF --> ChromaDB
    
    FP --> SQLite
    FP --> ChromaDB
```

## 7. 数据流向图

```mermaid
flowchart LR
    subgraph 输入
        A[用户上传文件]
        B[搜索查询请求]
    end
    
    subgraph 处理
        C[文件处理器]
        D[向量化引擎]
    end
    
    subgraph 存储
        E[SQLite 元数据]
        F[ChromaDB 向量]
    end
    
    subgraph 输出
        G[搜索结果]
        H[文件列表]
    end
    
    A --> C
    B --> D
    
    C --> E
    C --> F
    
    D --> F
    
    F --> G
    E --> H
```

## 8. 核心类关系图

```mermaid
classDiagram
    class ServiceFactory {
        -_sqlite_storage
        -_chroma_storage
        +get_sqlite_storage() SQLiteStorageService
        +get_chromadb_storage() ChromaDBStorageService
    }
    
    class SQLiteStorageService {
        -engine
        -session_factory
        +add_document() int
        +get_document() dict
        +add_chunk() int
        +get_chunks() list
        +check_file_exists() bool
        +delete_document() bool
    }
    
    class ChromaDBStorageService {
        -config
        -_collection
        -_embeddings
        +index_documents() list
        +search() list
        +delete_by_document_id() bool
        +get_vector_count() int
    }
    
    class FileProcessor {
        -file_handler
        -storage
        -embedding
        +process_file() dict
        +delete_file() dict
        +_extract_text() str
        +_chunk_text() list
    }
    
    ServiceFactory --> SQLiteStorageService
    ServiceFactory --> ChromaDBStorageService
    FileProcessor --> SQLiteStorageService
    FileProcessor --> ChromaDBStorageService
```

## 9. API 端点调用顺序

```mermaid
flowchart TD
    subgraph 启动阶段
        A[start.py] --> B[main.py: init_db]
        B --> C[main.py: lifespan]
    end
    
    subgraph 运行时API调用
        D[POST /files/upload]
        E[GET /files/{file_id}]
        F[DELETE /files/{file_id}]
        G[POST /search]
        H[GET /search]
        I[GET /files]
        J[GET /health]
    end
    
    启动阶段 --> 运行时API调用
```

## 10. 并发处理流程

```mermaid
flowchart TD
    A[接收上传请求] --> B[启动新线程]
    B --> C[文件处理线程]
    
    C --> D{处理状态}
    
    D -->|处理中| E[更新任务状态]
    E --> F[进度查询接口返回处理中]
    
    D -->|完成| G[更新任务状态为完成]
    G --> H[存储处理结果]
    H --> I[返回最终结果给客户端]
    
    D -->|失败| J[更新任务状态为失败]
    J --> K[记录错误信息]
    K --> L[返回错误响应]
```
