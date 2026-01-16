"""
应用配置管理模块

该模块负责集中管理整个应用程序的所有配置参数。采用环境变量优先的设计原则，
支持通过.env文件或系统环境变量进行配置覆盖，实现了配置与代码的分离。

主要配置分类：
    - 项目基础信息（名称、版本、调试模式）
    - 服务器配置（主机地址、端口）
    - 数据库配置（SQLite数据库URL、向量数据库路径）
    - 文件存储配置（上传目录、最大文件大小、允许的扩展名）
    - 向量模型配置（嵌入模型、向量维度）
    - 文本处理配置（分块大小、重叠大小）

技术特点：
    - 使用Pydantic Settings进行配置管理
    - 自动从.env文件加载环境变量
    - 支持类型提示和默认值
    - 使用@lru_cache()实现配置单例

配置优先级（从高到低）：
    1. 系统环境变量
    2. .env文件中的变量
    3. 代码中的默认值

使用示例：
    >>> from config.settings import settings
    >>> print(f"数据库URL: {settings.DATABASE_URL}")
    >>> print(f"向量维度: {settings.VECTOR_DIMENSION}")
"""

import os  # 导入操作系统模块，用于文件路径操作
import sys  # 导入系统模块，用于检测是否为打包模式
from pathlib import Path  # 导入路径操作模块，用于处理文件系统路径
from typing import Optional  # 导入类型提示模块，用于定义可选类型
from pydantic_settings import BaseSettings  # 导入Pydantic设置基类，用于配置管理
from functools import lru_cache  # 导入缓存装饰器，用于实现单例模式


class Settings(BaseSettings):  # 定义应用配置类，继承自Pydantic的BaseSettings
    """
    应用程序配置类

    该类定义了所有应用运行所需的配置参数。继承自pydantic_settings.BaseSettings，
    自动从环境变量和.env文件加载配置。所有字段都提供了合理的默认值，
    允许应用在最小配置下运行。

    配置来源：
        - 构造函数默认值
        - .env环境变量文件（项目根目录）
        - 系统环境变量

    环境变量命名规则：
        - 类属性名自动转换为大写
        - 支持嵌套配置的点分表示法
        - 例如：DATABASE_URL → database_url字段

    Attributes:
        PROJECT_NAME: 项目名称，用于API文档和响应头
        VERSION: 版本号，用于API健康检查和版本管理
        DEBUG: 调试模式开关，开启时输出详细日志
        SERVER_HOST: 服务器监听地址，0.0.0.0表示监听所有网卡
        SERVER_PORT: 服务器端口号
        DATABASE_URL: SQLite数据库连接URL
        VECTOR_DB_PATH: ChromaDB向量数据库存储路径
        UPLOAD_DIR: 上传文件存储目录
        MAX_FILE_SIZE: 最大允许上传文件大小（字节），默认50MB
        ALLOWED_EXTENSIONS: 允许上传的文件扩展名列表
        LOG_DIR: 日志文件存储目录
        EMBEDDING_MODEL: 文本嵌入模型名称
        VECTOR_DIMENSION: 向量维度，与嵌入模型匹配
        CHUNK_SIZE: 文本分块大小（字符数）
        CHUNK_OVERLAP: 分块重叠大小（字符数）
    """
    PROJECT_NAME: str = "File Management System"  # 项目名称，用于API文档和响应头标识
    VERSION: str = "1.0.0"  # 应用版本号，用于版本管理和API健康检查
    DEBUG: bool = True  # 调试模式开关，开启时输出详细日志和错误信息
    
    SERVER_HOST: str = "0.0.0.0"  # 服务器监听地址，0.0.0.0表示监听所有网络接口
    API_PORT: int = 9988  # API服务端口号，用于HTTP服务监听
    
    DATABASE_URL: str = "sqlite:///data/file_management.db"  # SQLite数据库连接URL，存储文件管理相关数据
    KNOWLEDGE_GRAPH_URL: str = "sqlite:///data/knowledge_graph.db"  # 知识图谱数据库连接URL，存储知识图谱数据
    VECTOR_DB_PATH: str = "data/vector_db"  # 向量数据库存储路径，用于ChromaDB向量存储
    
    UPLOAD_DIR: str = "data/file_storage"  # 上传文件存储目录，保存用户上传的原始文件
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 最大允许上传文件大小，默认50MB（50*1024*1024字节）
    ALLOWED_EXTENSIONS: list = [".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".rtf", ".html", ".htm", ".csv", ".json", ".xml", ".md"]  # 允许上传的文件扩展名列表
    
    LOG_DIR: str = "logs"  # 日志文件存储目录，保存应用运行日志
    MODELS_PATH: str = "data/models"  # 模型文件存储路径，保存下载的嵌入模型
    CHINESE_EMBEDDING_MODEL_NAME: str = "bge-base-zh-v1.5"  # 中文文本嵌入模型名称，用于中文文本向量化
    ENGLISH_EMBEDDING_MODEL_NAME: str = "multilingual-MiniLM-L12-v2"  # 英文/多语言嵌入模型名称，用于英文文本向量化
    CHUNK_SIZE: int = 1000  # 文本分块大小，将长文本切分成固定长度的块（字符数）
    CHUNK_OVERLAP: int = 200  # 分块重叠大小，相邻文本块之间的重叠字符数，保持上下文连续性
    
    OLLAMA_MODEL: str = "deepseek-r1:1.5b"  # Ollama本地模型名称，用于本地AI推理
    OLLAMA_BASE_URL: str = "http://localhost:11434"  # Ollama服务基础URL，用于连接本地Ollama服务
    OPENAI_MODEL: str = "gpt-3.5-turbo"  # OpenAI模型名称，用于调用OpenAI API
    OPENAI_API_KEY: str = ""  # OpenAI API密钥，用于身份验证
    LMSTUDIO_MODEL: str = ""  # LM Studio模型名称，用于本地LM Studio推理
    LMSTUDIO_BASE_URL: str = "http://127.0.0.1:1234"  # LM Studio服务基础URL，用于连接本地LM Studio服务
    
    LOG_LEVEL: str = "INFO"  # 全局日志级别，控制日志输出的详细程度（DEBUG/INFO/WARNING/ERROR/CRITICAL）
    LOG_FORMAT: str = "detailed"  # 日志格式类型，detailed表示详细格式包含时间戳、服务名、函数名等
    LOG_TO_FILE: bool = True  # 是否将日志输出到文件，True表示写入日志文件
    LOG_TO_CONSOLE: bool = True  # 是否将日志输出到控制台，True表示在终端显示日志
    LOG_SERVICE_LEVEL: dict = {  # 服务级别日志配置，按服务名称控制不同服务的日志级别
        "api": "INFO",  # API服务日志级别
        "bs_server": "INFO",  # BS服务器日志级别
        "desktop_app": "INFO"  # 桌面应用日志级别
    }
    LOG_MODULE_LEVEL: dict = {  # 模块级别日志配置，按模块路径控制不同模块的日志级别
        "core": "INFO",  # 核心模块日志级别
        "api": "INFO",  # API模块日志级别
        "apps": "INFO"  # 应用模块日志级别
    }
    LOG_FUNCTION_LEVEL: dict = {}  # 函数级别日志配置，按函数名控制特定函数的日志级别（空表示不限制）
    LOG_VARIABLE_LEVEL: bool = False  # 变量级别日志开关，True时输出详细的变量值信息
    
    class Config:  # Pydantic配置内部类
        env_file = ".env"  # 环境变量文件路径，从项目根目录的.env文件加载配置
        case_sensitive = True  # 环境变量是否区分大小写，True表示严格区分

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if getattr(sys, 'frozen', False):
            # 打包后，exe所在目录为项目根目录
            self._base_dir = os.path.dirname(sys.executable)
            # 修改env_file路径为exe所在目录
            self.Config.env_file = os.path.join(self._base_dir, ".env")
        else:
            # 开发模式，config目录的上级目录为项目根目录
            self._base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    @property  # 属性装饰器，将方法转换为属性访问
    def CHINESE_EMBEDDING_MODEL(self) -> str:  # 中文嵌入模型完整路径属性
        models_path = os.path.join(self._base_dir, "models")  # 拼接models目录路径
        return os.path.join(models_path, self.CHINESE_EMBEDDING_MODEL_NAME)  # 返回中文模型完整路径

    @property  # 属性装饰器
    def ENGLISH_EMBEDDING_MODEL(self) -> str:  # 英文嵌入模型完整路径属性
        models_path = os.path.join(self._base_dir, "models")  # 拼接models目录路径
        return os.path.join(models_path, self.ENGLISH_EMBEDDING_MODEL_NAME)  # 返回英文模型完整路径

    @property  # 属性装饰器
    def VECTOR_DIMENSION(self) -> int:  # 向量维度属性，根据模型名称动态计算
        if hasattr(self, '_vector_dimension'):  # 如果已缓存向量维度
            return self._vector_dimension  # 直接返回缓存的值
        if self.CHINESE_EMBEDDING_MODEL_NAME and 'bge' in self.CHINESE_EMBEDDING_MODEL_NAME.lower():  # 如果使用bge模型
            self._vector_dimension = 768  # bge模型的向量维度为768
        else:  # 其他模型
            self._vector_dimension = 384  # 默认向量维度为384
        return self._vector_dimension  # 返回向量维度

    @property
    def DATABASE_URL_ABSOLUTE(self) -> str:
        return os.path.join(self._base_dir, self.DATABASE_URL.replace("sqlite:///", ""))

    @property
    def KNOWLEDGE_GRAPH_URL_ABSOLUTE(self) -> str:
        return os.path.join(self._base_dir, self.KNOWLEDGE_GRAPH_URL.replace("sqlite:///", ""))

    @property
    def VECTOR_DB_PATH_ABSOLUTE(self) -> str:
        return os.path.join(self._base_dir, self.VECTOR_DB_PATH)

    @property
    def UPLOAD_DIR_ABSOLUTE(self) -> str:
        return os.path.join(self._base_dir, self.UPLOAD_DIR)

    @property
    def LOG_DIR_ABSOLUTE(self) -> str:
        return os.path.join(self._base_dir, self.LOG_DIR)


@lru_cache()  # 使用LRU缓存装饰器，实现单例模式
def get_settings() -> Settings:  # 获取应用配置单例的函数
    """
    获取应用配置单例

    该函数使用lru_cache装饰器实现配置对象的单例模式，
    确保在整个应用生命周期中只创建一个Settings实例，
    避免重复解析环境变量和加载配置的开销。

    缓存行为：
        - 首次调用时创建并缓存Settings实例
        - 后续调用直接返回缓存的实例
        - 整个进程生命周期内保持不变

    Returns:
        Settings: 配置单例对象，包含所有应用配置

    Warning:
        - 如果在运行时修改了环境变量，已缓存的配置不会更新
        - 如需重新加载配置，需调用settings.cache_clear()（不推荐）

    Example:
        >>> settings = get_settings()
        >>> print(f"应用名称: {settings.PROJECT_NAME}")
        >>> print(f"调试模式: {settings.DEBUG}")
    """
    return Settings()  # 创建并返回Settings实例


settings = get_settings()  # 创建全局配置单例，供整个应用使用
