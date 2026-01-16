# -*- coding: utf-8 -*-
"""
初始化脚本

用于初始化发布包环境，创建必要的目录和配置文件
"""

import os
import sys
import shutil
from pathlib import Path


def init_environment():
    """初始化发布包环境"""
    print("=" * 60)
    print("本地文件AI管理系统 - 环境初始化")
    print("=" * 60)
    
    project_root = Path(__file__).parent.parent
    
    print(f"\n项目根目录: {project_root}")
    
    directories = [
        "data/database",
        "data/vector_db",
        "data/file_storage",
        "logs",
        "models"
    ]
    
    print("\n创建必要的目录...")
    for dir_path in directories:
        full_path = project_root / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ {dir_path}")
    
    env_example = project_root / "config" / ".env.example"
    env_file = project_root / "config" / ".env"
    
    print("\n检查配置文件...")
    if not env_file.exists():
        if env_example.exists():
            shutil.copy(env_example, env_file)
            print(f"  ✓ 已创建配置文件: config/.env")
            print(f"  ⚠ 请根据实际情况修改 config/.env 中的配置")
        else:
            print(f"  ✗ 未找到配置模板文件: {env_example}")
    else:
        print(f"  ✓ 配置文件已存在: config/.env")
    
    print("\n创建 .gitkeep 文件...")
    gitkeep_dirs = [
        "data/database",
        "data/vector_db",
        "data/file_storage",
        "logs",
        "models"
    ]
    for dir_path in gitkeep_dirs:
        gitkeep_file = project_root / dir_path / ".gitkeep"
        if not gitkeep_file.exists():
            gitkeep_file.touch()
            print(f"  ✓ {dir_path}/.gitkeep")
    
    print("\n" + "=" * 60)
    print("环境初始化完成!")
    print("=" * 60)
    print("\n后续步骤:")
    print("  1. 安装依赖: pip install -r requirements.txt")
    print("  2. 修改配置: 编辑 config/.env 文件")
    print("  3. 启动服务: python scripts/startall.py")
    print("=" * 60)


if __name__ == "__main__":
    init_environment()
