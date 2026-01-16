@echo off
chcp 65001 >nul
REM 本地文件AI管理系统 - 启动脚本（Windows）

echo ============================================================
echo 本地文件AI管理系统 - 一键启动
echo ============================================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8或更高版本
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist ".venv" (
    echo [提示] 未找到虚拟环境，正在创建...
    python -m venv .venv
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [成功] 虚拟环境创建完成
)

REM 激活虚拟环境
call .venv\Scripts\activate.bat

REM 检查依赖
if not exist ".venv\Lib\site-packages\fastapi" (
    echo [提示] 正在安装依赖...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
)

REM 检查配置文件
if not exist "config\.env" (
    if exist "config\.env.example" (
        echo [提示] 正在创建配置文件...
        copy config\.env.example config\.env >nul
        echo [成功] 配置文件已创建: config\.env
        echo [提示] 请根据实际情况修改配置文件
    ) else (
        echo [错误] 未找到配置模板文件
        pause
        exit /b 1
    )
)

REM 启动服务
echo.
echo [启动] 正在启动所有服务...
python scripts\startall.py

pause
