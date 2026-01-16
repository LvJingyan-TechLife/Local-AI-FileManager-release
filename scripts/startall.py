# -*- coding: utf-8 -*-
"""
一键启动所有后台服务脚本（发布包版本）

启动 file_management 服务 (端口 9988) 和 bs_server 服务 (端口 9989)

打包模式：
- 使用线程模式启动服务，避免子进程递归问题
- 所有Python代码已打包到exe中
- 配置文件、模型文件、数据文件都在exe所在目录
"""

import subprocess
import sys
import os
import time
import signal
import threading
from datetime import datetime

# ========== 日志样式配置 ==========
class LogStyle:
    # 颜色编码（Windows/Linux/Mac通用）
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    PURPLE = "\033[35m"
    CYAN = "\033[36m"
    GRAY = "\033[37m"
    
    # 样式开关（Windows终端可能不支持颜色，可手动关闭）
    ENABLE_COLOR = True if sys.platform != "win32" else False

    @classmethod
    def get_timestamp(cls):
        """获取格式化时间戳"""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @classmethod
    def colorize(cls, text, color):
        """为文本添加颜色（如果支持）"""
        if cls.ENABLE_COLOR:
            return f"{color}{text}{cls.RESET}"
        return text

    @classmethod
    def info(cls, text):
        """信息级日志"""
        timestamp = cls.get_timestamp()
        prefix = cls.colorize("[INFO] ", cls.BLUE)
        print(f"{timestamp} {prefix}{text}")

    @classmethod
    def success(cls, text):
        """成功级日志"""
        timestamp = cls.get_timestamp()
        prefix = cls.colorize("[SUCCESS] ", cls.GREEN)
        print(f"{timestamp} {prefix}{text}")

    @classmethod
    def warning(cls, text):
        """警告级日志"""
        timestamp = cls.get_timestamp()
        prefix = cls.colorize("[WARNING] ", cls.YELLOW)
        print(f"{timestamp} {prefix}{text}")

    @classmethod
    def error(cls, text):
        """错误级日志"""
        timestamp = cls.get_timestamp()
        prefix = cls.colorize("[ERROR] ", cls.RED)
        print(f"{timestamp} {prefix}{text}")

    @classmethod
    def title(cls, text):
        """标题样式"""
        print("\n" + cls.colorize("="*60, cls.PURPLE))
        print(cls.colorize(text.center(60), cls.PURPLE))
        print(cls.colorize("="*60, cls.PURPLE))

    @classmethod
    def subtitle(cls, text):
        """子标题样式"""
        print(f"\n{cls.colorize('→', cls.CYAN)} {cls.colorize(text, cls.CYAN)}")

    @classmethod
    def detail(cls, text, indent=2):
        """详情文本（带缩进）"""
        print(f"{' '*indent}{cls.colorize(text, cls.GRAY)}")

    @classmethod
    def service_log(cls, name, text):
        """服务运行日志"""
        timestamp = cls.get_timestamp()
        name_colored = cls.colorize(f"[{name}]", cls.PURPLE)
        print(f"{timestamp} {name_colored} {text}")

if getattr(sys, 'frozen', False):
    # 打包模式：exe所在目录为项目根目录
    PROJECT_ROOT = os.path.dirname(sys.executable)
    BASE_DIR = PROJECT_ROOT
else:
    # 开发模式：scripts目录的上级目录为项目根目录
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = BASE_DIR

IS_FROZEN = getattr(sys, 'frozen', False)

processes = []
output_threads = []
service_threads = []


def signal_handler(signum, frame):
    LogStyle.warning("\n正在停止所有服务...")
    for proc in processes:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
            except Exception:
                pass
    
    LogStyle.success("所有服务已停止")
    sys.exit(0)


def output_reader(proc, name):
    try:
        for line in iter(proc.stdout.readline, ''):
            if line:
                LogStyle.service_log(name, line.rstrip())
    except Exception as e:
        LogStyle.error(f"[{name}] 日志读取错误: {e}")


def check_process_alive(proc):
    try:
        return proc.poll() is None
    except Exception:
        return False


def start_service(name, command, cwd):
    LogStyle.subtitle(f"启动 {name}")
    LogStyle.detail(f"命令: {' '.join(command)}")
    LogStyle.detail(f"工作目录: {cwd}")
    
    try:
        startupinfo = None
        if sys.platform == 'win32':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        
        proc = subprocess.Popen(
            command,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            stdin=subprocess.PIPE,
            text=True,
            bufsize=1,
            startupinfo=startupinfo
        )
        
        thread = threading.Thread(target=output_reader, args=(proc, name), daemon=False)
        thread.start()
        output_threads.append((thread, proc))
        
        processes.append(proc)
        LogStyle.success(f"{name} 已启动 (PID: {proc.pid})")
        return proc
    except Exception as e:
        LogStyle.error(f"启动 {name} 失败: {e}")
        return None


def run_service_in_thread(name, target_func, *args):
    LogStyle.subtitle(f"启动 {name}")
    
    def run_wrapper():
        try:
            target_func(*args)
        except Exception as e:
            LogStyle.error(f"{name} 运行错误: {e}")
            import traceback
            traceback.print_exc()
    
    thread = threading.Thread(target=run_wrapper, daemon=False)
    thread.start()
    service_threads.append((thread, name))
    LogStyle.success(f"{name} 已启动 (线程模式)")
    return thread


def wait_for_service(port, name, timeout=30):
    import socket
    LogStyle.subtitle(f"等待 {name} 启动 (端口 {port})")
    
    for i in range(timeout):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            if result == 0:
                LogStyle.success(f"{name} 已就绪 (端口 {port})")
                return True
        except Exception:
            pass
        time.sleep(1)
    
    LogStyle.warning(f"{name} 在 {timeout} 秒内未就绪")
    return False


def main():
    LogStyle.title("本地文件AI管理系统 - 一键启动")
    
    if IS_FROZEN:
        LogStyle.info("【模式】打包模式：使用线程启动服务")
        
        # 设置工作目录
        os.chdir(PROJECT_ROOT)
        
        # 添加Python路径
        sys.path.insert(0, PROJECT_ROOT)
        
        # 创建符号链接或复制web目录，使其与源码中的相对路径匹配
        web_source = os.path.join(PROJECT_ROOT, 'app', 'web')
        web_target = os.path.join(PROJECT_ROOT, 'web')
        if os.path.exists(web_source) and not os.path.exists(web_target):
            try:
                import shutil
                shutil.copytree(web_source, web_target)
                LogStyle.success(f"已创建 web 目录链接: {web_target}")
            except Exception as e:
                LogStyle.warning(f"无法创建 web 目录链接: {e}")
        
        # 导入模块
        import uvicorn
        import api.main as api_main
        import apps.bs_server.server as bs_server
        
        LogStyle.subtitle("启动 API Service (端口 9988)")
        def start_api_service():
            uvicorn.run(api_main.app, host="0.0.0.0", port=9988)
        
        run_service_in_thread("API Service", start_api_service)
        wait_for_service(9988, "API Service")
        
        LogStyle.subtitle("启动 BS Server (端口 9989)")
        def start_bs_service():
            bs_server.app.run(host="0.0.0.0", port=9989, debug=False)
        
        run_service_in_thread("BS Server", start_bs_service)
        wait_for_service(9989, "BS Server")
    else:
        LogStyle.info("【模式】开发模式：使用子进程启动服务")
        python_executable = sys.executable
        
        api_command = [python_executable, "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "9988", "--reload"]
        bs_server_command = [python_executable, "start.py"]
        
        LogStyle.subtitle("启动 API Service (端口 9988)")
        start_service("API Service", api_command, PROJECT_ROOT)
        wait_for_service(9988, "API Service")
        
        LogStyle.subtitle("启动 BS Server (端口 9989)")
        start_service("BS Server", bs_server_command, os.path.join(PROJECT_ROOT, "app", "apps", "bs_server"))
        wait_for_service(9989, "BS Server")
    
    LogStyle.title("所有服务已成功启动")
    
    LogStyle.subtitle("访问地址")
    LogStyle.detail("• BS前端界面: http://localhost:9989")
    LogStyle.detail("• File Management API: http://localhost:9988")
    LogStyle.detail("• API文档: http://localhost:9988/docs")
    
    LogStyle.subtitle("操作提示")
    LogStyle.detail("按 Ctrl+C 停止所有服务")
    print(LogStyle.colorize("="*60, LogStyle.PURPLE))
    
    while True:
        if IS_FROZEN:
            # 线程模式：检查线程是否存活
            alive_count = sum(1 for t, name in service_threads if t.is_alive())
            if alive_count == 0:
                LogStyle.warning("所有服务已停止")
                break
        else:
            # 进程模式：检查进程是否存活
            alive_count = sum(1 for p in processes if check_process_alive(p))
            if alive_count == 0:
                LogStyle.warning("所有服务已停止")
                break
            
            for proc in processes:
                if not check_process_alive(proc):
                    LogStyle.warning(f"服务已意外停止 (PID: {proc.pid})")
        
        try:
            time.sleep(2)
        except KeyboardInterrupt:
            break


if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    main()