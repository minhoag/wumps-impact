"""
Business logic for system operations.
Handles server management, process control, and log management.
"""
import os
import subprocess
from typing import List, Dict, Tuple

from utils.logger import logger


class SystemActions:
    """Handles all system-related business logic operations."""

    # Server order from the bash script
    START_SERVER_ORDER = [
        "dispatch", "nodeserver", "dbgate", "oaserver", "multiserver",
        "muipserver", "gameserver", "gateserver", "pathfindingserver", "tothemoonserver"
    ]
    STOP_SERVER_ORDER = [
        "tothemoonserver", "pathfindingserver", "gateserver", "gameserver",
        "multiserver", "muipserver", "oaserver", "dbgate", "nodeserver", "dispatch"
    ]
    STATUS_LIST = [
        "dispatch", "nodeserver", "dbgate", "oaserver", "multiserver",
        "muipserver", "gameserver", "gateserver", "pathfindingserver", "tothemoonserver"
    ]

    @staticmethod
    def get_server_pid(server_name: str) -> str:
        """Get PID of a running server."""
        try:
            result = subprocess.run(
                ["ps", "aux"],
                capture_output=True, text=True, check=True
            )
            for line in result.stdout.split('\n'):
                if f"{server_name} -i" in line:
                    parts = line.split()
                    return parts[1]  # PID is second column
        except subprocess.CalledProcessError:
            pass
        return ""

    @staticmethod
    def kill_process(pid: str, force: bool = False) -> bool:
        """Kill a process by PID."""
        try:
            if force:
                subprocess.run(["kill", "-9", pid], check=True)
            else:
                subprocess.run(["kill", pid], check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    @staticmethod
    def get_log_file_size(file_path: str) -> str:
        """Get the size of a log file in human readable format."""
        if os.path.exists(file_path):
            size_bytes = os.path.getsize(file_path)
            # Convert to appropriate unit
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size_bytes < 1024.0:
                    return ".1f"
                size_bytes /= 1024.0
            return ".1f"
        else:
            return "File not found"

    @staticmethod
    def check_and_clean_large_log(file_path: str, max_size_gb: float = 2.0) -> bool:
        """Check if log file exceeds max size and delete it if it does."""
        if os.path.exists(file_path):
            size_bytes = os.path.getsize(file_path)
            max_size_bytes = max_size_gb * 1024 * 1024 * 1024
            if size_bytes >= max_size_bytes:
                os.remove(file_path)
                return True
        return False

    @staticmethod
    def clear_log_directory(log_dir: str) -> Tuple[int, int]:
        """Clear all files in the log directory by truncating them. Returns (files_cleared, errors)."""
        if not os.path.exists(log_dir):
            return 0, 1

        if not os.path.isdir(log_dir):
            return 0, 1

        files_cleared = 0
        errors = 0

        try:
            # Get list of files
            files = [f for f in os.listdir(log_dir) if os.path.isfile(os.path.join(log_dir, f))]

            for filename in files:
                file_path = os.path.join(log_dir, filename)
                try:
                    # Truncate the file (make it empty) instead of deleting
                    with open(file_path, 'w') as f:
                        f.truncate(0)
                    files_cleared += 1
                except Exception as e:
                    errors += 1

            return files_cleared, errors

        except Exception as e:
            return 0, 1

    @staticmethod
    def start_server(server_name: str) -> bool:
        """Start a specific server."""
        try:
            # Set environment variables like in the bash script
            env = os.environ.copy()
            env["ASAN_OPTIONS"] = "poison_heap=false:poison_partial=false:poison_array_cookie=false:allow_user_poisoning=false:alloc_dealloc_mismatch=false:new_delete_type_mismatch=false:detect_leaks=false:check_printf=false:detect_container_overflow=false:detect_deadlocks=false:detect_write_exec=false:detect_odr_violation=0:strict_string_checks=false:strict_memcmp=false:intercept_strstr=false:intercept_strpbrk=false:intercept_strndup=false:intercept_strchr=false:intercept_memcmp=false:intercept_memmem=false:intercept_intrin=false:intercept_stat=false:intercept_send=false:replace_intrin=false:replace_str=false:report_globals=0:malloc_context_size=0:allocator_release_to_os_interval_ms=5000:quarantine_size_mb=16:max_malloc_fill_size=512:max_redzone=64:abort_on_error=0:halt_on_error=0"
            # Find ASan library
            asan_lib = ""
            try:
                result = subprocess.run(["find", "/usr/lib*", "/lib*", "-name", "libasan.so*", "-print", "-quit"],
                                      capture_output=True, text=True, check=True)
                asan_lib = result.stdout.strip()
            except subprocess.CalledProcessError:
                pass
            if asan_lib:
                env["HOOK_PRELOAD"] = f"{asan_lib}:./hook/build/lib/libhook.so"
            else:
                env["HOOK_PRELOAD"] = "./hook/build/lib/libhook.so"
            # Change to server directory and make executable
            server_dir = "/gio/bin"
            original_dir = os.getcwd()
            try:
                os.chdir(server_dir)
                os.chmod(server_name, 0o755)

                # Server configurations from bash script
                server_configs = {
                    "dispatch": ["-i", "9001.5.1.1"],
                    "nodeserver": ["-i", "9001.3.1.1"],
                    "dbgate": ["-i", "9001.4.1.1"],
                    "oaserver": ["-i", "9001.8.1.1"],  # missing oaserver
                    "multiserver": ["-i", "9001.7.1.1"],
                    "muipserver": ["-i", "9001.6.1.1"],
                    "gameserver": ["-i", "9001.2.1.1"],
                    "gateserver": ["-i", "9001.1.1.1"],
                    "pathfindingserver": ["-i", "9001.9.1.1"],  # missing pathfindingserver
                    "tothemoonserver": ["-i", "9001.10.1.1"]   # missing tothemoonserver
                }
                if server_name in server_configs:
                    cmd = ["nohup", f"./{server_name}"] + server_configs[server_name]
                    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env, cwd=server_dir)
                    return True
            finally:
                os.chdir(original_dir)  # Always restore original directory
        except Exception as e:
            print(f"Error starting {server_name}: {e}")
            return False
        return False

    @staticmethod
    def start_sdk_server() -> bool:
        """Start SDK server."""
        sdk_dir = "/gio/sdk"
        jar_path = os.path.join(sdk_dir, "sdkserver.jar")

        if os.path.exists(jar_path):
            original_dir = os.getcwd()
            try:
                os.chdir(sdk_dir)
                subprocess.run(["screen", "-dmS", "sdk", "java", "-jar", "sdkserver.jar"], check=True)
                return True
            except subprocess.CalledProcessError as e:
                print(f"Error starting SDK server: {e}")
                return False
            finally:
                os.chdir(original_dir)  # Always go back
        else:
            print(f"SDK JAR not found at {jar_path}")
            return False

    @classmethod
    def get_server_statuses(cls) -> Dict[str, Dict[str, str]]:
        """Get status of all servers and log files."""
        server_statuses = {}
        for server in cls.STATUS_LIST:
            pid = cls.get_server_pid(server)
            if pid:
                server_statuses[server] = {
                    "name": f"{server}",
                    "value": "Online"
                }
            else:
                server_statuses[server] = {
                    "name": f"{server}",
                    "value": "Offline"
                }

        # Check SDK server - always runs via screen session
        sdk_running = False
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True, check=True)
            output = result.stdout.strip()
            # Look for screen session named 'sdk' with proper status indicators
            sdk_running = 'sdk' in output and ('Detached' in output or 'Attached' in output)
        except subprocess.CalledProcessError:
            pass
        if sdk_running:
            server_statuses["sdk"] = {
                "name": "SDK Server",
                "value": "Online"
            }
        else:
            server_statuses["sdk"] = {
                "name": "SDK Server",
                "value": "Offline"
            }

        # Event status monitoring
        event_status = cls.get_current_event_status()
        server_statuses["event_status"] = {
            "name": "TRẠNG THÁI SỰ KIỆN",
            "value": event_status
        }

        gameserver_log = "/gio/bin/log/gameserver.log"
        cls.check_and_clean_large_log(gameserver_log)

        return server_statuses

    @classmethod
    def check_running_servers(cls, servers: List[str]) -> Tuple[List[str], List[str]]:
        """Check which servers are already running. Returns (running_servers, stopped_servers)."""
        running = []
        stopped = []

        for server in servers:
            if cls.get_server_pid(server):
                running.append(server)
            else:
                stopped.append(server)

        # Check SDK server - always runs via screen session
        sdk_running = False
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True, check=True)
            output = result.stdout.strip()
            # Look for screen session named 'sdk' with proper status indicators
            sdk_running = 'sdk' in output and ('Detached' in output or 'Attached' in output)
        except subprocess.CalledProcessError:
            pass

        return running, stopped

    @classmethod
    def do_start_servers(cls, servers: List[str], start_sdk: bool = False, force_restart: bool = False) -> Tuple[List[str], bool]:
        """Start multiple servers. Returns (messages, has_running_servers)."""
        running_servers, stopped_servers = cls.check_running_servers(servers)

        # Check if any servers are already running
        has_running = len(running_servers) > 0

        if has_running and not force_restart:
            # Return information about running servers for confirmation
            messages = [f"Các server đang chạy: {', '.join(running_servers)}"]
            if stopped_servers:
                messages.append(f"Các server chưa chạy: {', '.join(stopped_servers)}")
            messages.append("Bạn có muốn khởi động lại các server đang chạy không?")
            return messages, True

        # Start stopped servers
        for server in stopped_servers:
            cls.start_server(server)

        # Start running servers if force restart
        if force_restart:
            for server in running_servers:
                # Kill existing process first
                pid = cls.get_server_pid(server)
                if pid:
                    cls.kill_process(pid, force=True)
                # Start new instance
                cls.start_server(server)

        if start_sdk:
            # Check if SDK is running - use same logic as get_server_statuses
            sdk_running = False
            try:
                result = subprocess.run(["screen", "-ls"], capture_output=True, text=True, check=True)
                output = result.stdout.strip()
                # Look for screen session named 'sdk' with proper status indicators
                sdk_running = 'sdk' in output and ('Detached' in output or 'Attached' in output)
            except subprocess.CalledProcessError:
                pass

            if force_restart or not sdk_running:
                success = cls.start_sdk_server()
                if not success:
                    print("Warning: Failed to start SDK server")

        return ["Đã thành công khởi động server"], False

    @classmethod
    def do_force_stop_all(cls) -> List[str]:
        """Force stop all servers. Returns simplified success message."""
        # Stop all servers in reverse order
        for server in cls.STOP_SERVER_ORDER:
            pid = cls.get_server_pid(server)
            if pid:
                cls.kill_process(pid, force=True)

        # Stop SDK server
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True, check=True)
            for line in result.stdout.splitlines():
                if 'sdk' in line:
                    screen_id = line.split('.')[0].strip()
                    if screen_id:
                        subprocess.run(["kill", "-9", screen_id], check=True)
                        subprocess.run(["screen", "-wipe"], check=True)
                        break
        except subprocess.CalledProcessError:
            pass

        return ["Đã thành công dừng server"]

    @classmethod
    def do_clear_logs(cls) -> Tuple[List[str], int, int]:
        """Clear all log files by truncating them. Returns simplified success message."""
        log_dir = "/gio/bin/log"

        files_cleared, errors = cls.clear_log_directory(log_dir)
        if files_cleared > 0:
            return ["Đã thành công xóa logs"], files_cleared, errors
        elif errors == 0:
            return ["Không có log nào để xóa"], files_cleared, errors
        else:
            return ["Lỗi khi xóa logs"], files_cleared, errors
    

    @classmethod
    def get_current_event_status(cls) -> str:
        """Get the current event status by checking git branch."""
        data_path = "/gio/data/"
        try:
            # Get current branch
            result = subprocess.run(["git", "branch", "--show-current"], cwd=data_path,
                                  capture_output=True, text=True, check=True)
            current_branch = result.stdout.strip()

            # Map branches to events
            branch_to_event = {
                "event/blossom": "Sự kiện Hoa Địa Mạch",
                "develop": "Không có sự kiện đang hoạt động"
            }

            return branch_to_event.get(current_branch, f"Branch: {current_branch}")
        except subprocess.CalledProcessError:
            return "Không thể kiểm tra trạng thái sự kiện"

    @classmethod
    def do_toggle_event(cls, event_name: str) -> bool:
        """Toggle game events by switching git branches."""
        data_path = "/gio/data/"

        # Map events to their branches
        event_branches = {
            "develop": "develop",  # Stop event - go to develop branch
            "laylines": "event/blossom",
        }

        if event_name.lower() not in event_branches:
            return False

        target_branch = event_branches[event_name.lower()]

        try:
            # git checkout target branch
            subprocess.run(["git", "checkout", target_branch], cwd=data_path, check=True)
            # git pull target branch
            subprocess.run(["git", "pull", "origin", target_branch], cwd=data_path, check=True)
            print(f"Successfully toggled event: {event_name}")
        except subprocess.CalledProcessError:
            print(f"Error toggling event: {event_name}")
            return False
        except Exception as e:
            print(f"Error toggling event: {event_name}")
            return False
        return True