# -*- coding: utf-8 -*-
"""
PyInstaller打包脚本

用于将本地文件AI管理系统打包成独立的可执行文件
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


def check_dependencies():
    """检查依赖是否安装"""
    print("检查依赖...")
    
    try:
        import PyInstaller
        print("  ✓ PyInstaller 已安装")
        return True
    except ImportError:
        print("  ✗ PyInstaller 未安装")
        return False


def install_pyinstaller():
    """安装PyInstaller"""
    print("\n正在安装 PyInstaller...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pyinstaller"],
            check=True,
            capture_output=True
        )
        print("  ✓ PyInstaller 安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ✗ PyInstaller 安装失败: {e}")
        return False


def clean_build():
    """清理旧的构建文件"""
    print("\n清理旧的构建文件...")
    
    project_root = Path(__file__).parent.parent
    
    dirs_to_clean = ['build']
    files_to_clean = ['FileManagementSystem.exe']
    
    for dir_name in dirs_to_clean:
        dir_path = project_root / dir_name
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print(f"  ✓ 已删除: {dir_name}")
        else:
            print(f"  - 跳过: {dir_name} (不存在)")
    
    for file_name in files_to_clean:
        file_path = project_root / file_name
        if file_path.exists():
            file_path.unlink()
            print(f"  ✓ 已删除: {file_name}")
        else:
            print(f"  - 跳过: {file_name} (不存在)")


def build_executable():
    """构建可执行文件"""
    print("\n开始打包应用程序...")
    
    project_root = Path(__file__).parent
    spec_file = project_root / "build.spec"
    
    if not spec_file.exists():
        print(f"  ✗ 未找到配置文件: {spec_file}")
        return False
    
    try:
        cmd = [sys.executable, "-m", "PyInstaller", "--clean", str(spec_file)]
        print(f"  执行命令: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, cwd=project_root)
        
        if result.returncode == 0:
            print("  ✓ 打包成功")
            return True
        else:
            print("  ✗ 打包失败")
            return False
    except Exception as e:
        print(f"  ✗ 打包异常: {e}")
        return False


def print_summary():
    """打印打包结果摘要"""
    print("\n" + "=" * 60)
    print("打包完成！")
    print("=" * 60)
    print("\n可执行文件位置:")
    print("  dist/FileManagementSystem.exe")
    print("\n使用说明:")
    print("  1. 将 dist/FileManagementSystem.exe 复制到目标机器")
    print("  2. 双击运行即可启动服务")
    print("  3. 访问 http://localhost:9989 查看前端界面")
    print("\n注意事项:")
    print("  - 首次运行会自动创建必要的目录")
    print("  - 确保端口9988和9989未被占用")
    print("  - 日志文件会保存在 logs 目录下")
    print("  - AI模型文件会自动下载到 models 目录")
    print("=" * 60)


def main():
    """主函数"""
    print("=" * 60)
    print("本地文件AI管理系统 - PyInstaller打包")
    print("=" * 60)
    
    if not check_dependencies():
        if not install_pyinstaller():
            print("\n错误: 无法安装PyInstaller")
            sys.exit(1)
    
    clean_build()
    
    if not build_executable():
        print("\n错误: 打包失败")
        sys.exit(1)
    
    print_summary()


if __name__ == "__main__":
    main()
