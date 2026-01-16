# -*- coding: utf-8 -*-
"""
编译Python源码为.pyc字节码

将所有.py文件编译为.pyc文件，并删除源码文件
注意：.pyc文件仍可被反编译，仅提供基础保护
"""

import os
import sys
import shutil
import compileall
from pathlib import Path


def compile_to_pyc(source_dir, delete_source=False):
    """
    编译指定目录下的所有Python文件为.pyc
    
    Args:
        source_dir: 源代码目录
        delete_source: 是否删除源码文件
    """
    source_path = Path(source_dir)
    
    if not source_path.exists():
        print(f"  ✗ 目录不存在: {source_dir}")
        return False
    
    print(f"\n编译目录: {source_dir}")
    
    try:
        compileall.compile_dir(
            str(source_path),
            force=True,
            optimize=2,
            quiet=0
        )
        print(f"  ✓ 编译完成")
        
        if delete_source:
            delete_py_files(source_path)
        
        return True
    except Exception as e:
        print(f"  ✗ 编译失败: {e}")
        return False


def delete_py_files(directory):
    """
    删除目录下的所有.py文件
    
    Args:
        directory: 目录路径
    """
    dir_path = Path(directory)
    
    print(f"\n删除源码文件...")
    
    py_files = list(dir_path.rglob("*.py"))
    
    for py_file in py_files:
        try:
            py_file.unlink()
            print(f"  ✓ 已删除: {py_file.relative_to(dir_path.parent)}")
        except Exception as e:
            print(f"  ✗ 删除失败 {py_file}: {e}")


def clean_pycache(directory):
    """
    清理__pycache__目录
    
    Args:
        directory: 目录路径
    """
    dir_path = Path(directory)
    
    print(f"\n清理__pycache__目录...")
    
    pycache_dirs = list(dir_path.rglob("__pycache__"))
    
    for pycache_dir in pycache_dirs:
        try:
            shutil.rmtree(pycache_dir)
            print(f"  ✓ 已删除: {pycache_dir.relative_to(dir_path.parent)}")
        except Exception as e:
            print(f"  ✗ 删除失败 {pycache_dir}: {e}")


def main():
    """主函数"""
    print("=" * 60)
    print("Python源码编译为.pyc字节码")
    print("=" * 60)
    
    project_root = Path(__file__).parent.parent
    
    directories_to_compile = [
        "app",
        "config",
        "scripts"
    ]
    
    print("\n将要编译的目录:")
    for dir_name in directories_to_compile:
        print(f"  - {dir_name}")
    
    print("\n警告:")
    print("  1. .pyc文件仍可被反编译，仅提供基础保护")
    print("  2. 建议在编译前备份源码")
    print("  3. 如需更强保护，请使用PyInstaller打包成exe")
    
    confirm = input("\n确认继续? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("\n已取消操作")
        sys.exit(0)
    
    success_count = 0
    total_count = len(directories_to_compile)
    
    for dir_name in directories_to_compile:
        dir_path = project_root / dir_name
        if compile_to_pyc(dir_path, delete_source=True):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"编译完成! ({success_count}/{total_count})")
    print("=" * 60)
    
    if success_count == total_count:
        print("\n所有Python文件已编译为.pyc字节码")
        print("源码文件已删除")
        print("\n注意:")
        print("  - .pyc文件仍可被反编译")
        print("  - 建议使用PyInstaller进行更安全的打包")
        print("  - 运行 build.bat 或 python scripts/build.py 进行打包")


if __name__ == "__main__":
    main()
