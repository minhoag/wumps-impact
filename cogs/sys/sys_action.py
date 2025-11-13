import os
import subprocess
import libtmux
from utils.logger import logger
from typing import List, Dict
import time
import re

SERVER_DIR = "/gio"
TMUX_PARAM = """
export ASAN_OPTIONS=poison_heap=false:poison_partial=false:poison_array_cookie=false:allow_user_poisoning=false:alloc_dealloc_mismatch=false:new_delete_type_mismatch=false:detect_leaks=false:check_printf=false:detect_container_overflow=false:detect_deadlocks=false:detect_write_exec=false:detect_odr_violation=0:strict_string_checks=false:strict_memcmp=false:intercept_strstr=false:intercept_strspn=false:intercept_strtok=false:intercept_strpbrk=false:intercept_strlen=false:intercept_strndup=false:intercept_strchr=false:intercept_memcmp=false:intercept_memmem=false:intercept_intrin=false:intercept_stat=false:intercept_send=false:replace_intrin=false:replace_str=false:report_globals=0:malloc_context_size=0:allocator_release_to_os_interval_ms=5000:quarantine_size_mb=64:max_malloc_fill_size=512:max_redzone=64;cd ${server_path}/${server}; ./${server} -i $(eval echo \$${server}_appid)
"""
APP_ID = {
    "nodeserver": {
        "appid": "9001.3.1.1",
        "dir": "/gio/nodeserver",
    },
    "dbgate": {
        "appid": "9001.4.1.1",
        "dir": "/gio/dbgate",
    },
    "dispatch": {
        "appid": "9001.5.1.1",
        "dir": "/gio/dispatch",
    },
    "gateserver": {
        "appid": "9001.1.1.1",
        "dir": "/gio/gateserver",
    },
    "gameserver": {
        "appid": "9001.2.1.1",
        "dir": "/gio/gameserver",
    },
    "muipserver": {
        "appid": "9001.6.1.1",
        "dir": "/gio/muipserver",
    },
    "tothemoonserver": {
        "appid": "9001.10.1.1",
        "dir": "/gio/tothemoonserver",
    },
    "pathfindingserver": {
        "appid": "9001.8.1.1",
        "dir": "/gio/pathfindingserver",
    },
    "multiserver": {
        "appid": "9001.7.1.1",
        "dir": "/gio/multiserver",
    },
    "oa_server": {
        "appid": "9001.9.1.1",
        "dir": "/gio/oa_server",
    },
}

class SystemActions:
    def init(self):
        self.tm = libtmux.Server()
    
    # polling every 10 seconds
    def status(self) -> str:
        status = []
        for server_name in APP_ID.keys():
            status.append({
                "name": server_name,
                "value": "ONLINE" if self.is_service_running(server_name) else "OFFLINE",
            })
        return status
    
    def is_service_running(self, server_name: str = None) -> bool:
        """Check if a specific server or any server is running"""
        if server_name:
            # Check specific server using ps -ef | grep pattern (matching bash script)
            if server_name in APP_ID:
                cmd = f"ps -ef | grep '{server_name} -i ' | grep -v grep | grep -v _session"
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                return result.returncode == 0
            return False
        else:
            # Check if any server is running
            for server in APP_ID.keys():
                cmd = f"ps -ef | grep '{server} -i ' | grep -v grep | grep -v _session"
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                if result.returncode == 0:
                    return True
            return False

    def start_server(self, name: str = None) -> List[Dict[str, str]]:
        servers = [(name, APP_ID[name]['dir']) for name in APP_ID.keys()] if name is None else [(name, APP_ID[name]['dir'])]
        status = [] # list of dict: {"name": server_name, "reason": reason}
        for server_name, server_dir in servers:
            logger.info(f"Starting {server_name}...")
            if self.is_service_running(server_name):
                status.append({
                    "name": server_name,
                    "reason": "Server is already running"
                })
                continue
            server_binary = server_dir.split('/')[-1]
            self.tm.cmd("new-session", "-d", "-s", f"{server_binary}_session",
                       TMUX_PARAM.replace("${server}", server_binary).replace("${server_path}", SERVER_DIR))
        return status # empty means all run
    
    def stop_server(self, service_name: str = None) -> List[Dict[str, str]]:
        if service_name:
            names = service_name.split(",")
            servers = [(name, APP_ID[name]['dir']) for name in names if name in APP_ID]
        else:
            servers = [(name, APP_ID[name]['dir']) for name in APP_ID.keys()]
        status = [] # list of dict: {"name": server_name, "reason": reason}
        for server_name, server_dir in servers:
            if self.is_service_running(server_name):
                # Use pgrep to get PID and kill -9 to force kill
                cmd = f"pgrep {server_name} | xargs kill -9"
                subprocess.run(cmd, shell=True, capture_output=True, text=True)

                # Kill tmux session
                server_binary = server_dir.split('/')[-1]
                cmd = f"tmux kill-session -t {server_binary}_session 2>/dev/null"
                subprocess.run(cmd, shell=True, capture_output=True, text=True)
            else:
                status.append({
                    "name": server_name,
                    "reason": "Server is already stopped"
                })
        return status # empty means all stopped

    def restart_server(self, service_name: str = None) -> List[Dict[str, str]]:
        if service_name:
            names = service_name.split(",")
            servers = [(name, APP_ID[name]['dir']) for name in names if name in APP_ID]
        else:
            servers = [(name, APP_ID[name]['dir']) for name in APP_ID.keys()]

        status = [] # list of dict: {"name": server_name, "reason": reason}

        for server_name, server_dir in servers:
            server_binary = server_dir.split('/')[-1]

            if self.is_service_running(server_name):
                # Use pgrep to get PID and kill -9 to force kill
                while self.is_service_running(server_name):
                    cmd = f"pgrep {server_name} | xargs kill -9"
                    subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    time.sleep(1)

                while True:
                    cmd = f"tmux ls 2>/dev/null | grep {server_binary}_session"
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    if result.returncode != 0:  # session not found
                        break
                    time.sleep(1)
                self.tm.cmd("new-session", "-d", "-s", f"{server_binary}_session",
                           TMUX_PARAM.replace("${server}", server_binary).replace("${server_path}", SERVER_DIR))
            else:
                self.tm.cmd("new-session", "-d", "-s", f"{server_binary}_session",
                           TMUX_PARAM.replace("${server}", server_binary).replace("${server_path}", SERVER_DIR))

        return status # empty means all restarted successfully
    
    # event
    def toggle_event(self, branch: str) -> Dict[str, str]:
        """Switch git branch in data folder to toggle events"""
        # Go to data folder, checkout branch, and pull latest changes
        cmd = f"cd {SERVER_DIR}/data && git checkout {branch} && git pull"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        if result.returncode != 0:
            return {
                "name": branch,
                "reason": f"Lỗi khi chuyển branch: {result.stderr}",
            }

        return {
            "name": branch,
            "reason": f"Đã chuyển sang branch {branch}",
        }

    # system action
    def clear_logs(self, service_name: str = None) -> List[Dict[str, str]]:
        if service_name:
            names = service_name.split(",")
            servers = [name for name in names if name in APP_ID]
        else:
            servers = list(APP_ID.keys())

        status = [] # list of dict: {"name": server_name, "reason": reason}

        for server_name in servers:
            server_dir = APP_ID[server_name]['dir']
            log_dir = f"{server_dir}/log"
            if not os.path.exists(log_dir):
                status.append({
                    "name": server_name,
                    "reason": f"Log directory does not exist: {log_dir}",
                })
                continue
            # Remove all files in the log directory
            cmd = f"rm -rf {log_dir}/*"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                logger.info(f"Logs cleared for {server_name}")
            else:
                status.append({
                    "name": server_name,
                    "reason": f"Failed to clear logs: {result.stderr}",
                })
        return status # empty means all logs cleared successfully
    
    def get_system_usage(self) -> Dict[str, str]:
        # Get CPU usage
        cpu_result = subprocess.run("top -b -n2 -d 0.5 | grep 'Cpu(s)' | tail -1",
                                   shell=True, capture_output=True, text=True)
        cpu_line = cpu_result.stdout.strip()
        idle_match = re.search(r'(\d+\.?\d*)\s*id', cpu_line)
        cpu_percent = round(100 - float(idle_match.group(1)), 1) if idle_match else 0

        # Get RAM usage
        ram_result = subprocess.run("free -h", shell=True, capture_output=True, text=True)
        ram_lines = ram_result.stdout.strip().split('\n')
        ram_line = ram_lines[1].split()
        ram_used = ram_line[2]
        ram_total = ram_line[1]

        # Get Storage usage
        storage_result = subprocess.run(f"df -h {SERVER_DIR}", shell=True, capture_output=True, text=True)
        storage_lines = storage_result.stdout.strip().split('\n')
        storage_line = storage_lines[1].split()
        storage_used = storage_line[2]
        storage_total = storage_line[1]

        return {
            'cpu': f"{cpu_percent}%",
            'ram': f"{ram_used}/{ram_total}",
            'storage': f"{storage_used}/{storage_total}"
        }