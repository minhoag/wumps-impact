"""
Business logic for system operations.
Handles server management, process control, and log management.
"""
import os
import subprocess
from typing import List, Dict, Tuple

SERVER_DIR = "/gio"

class SystemActions:
    START_SERVER_ORDER = [
        "dispatch", "nodeserver", "dbgate", "gateserver", "gameserver", "multiserver", "muipserver"
    ]
    STOP_SERVER_ORDER = [
        "muipserver", "multiserver", "gameserver", "gateserver", "dbgate", "nodeserver", "dispatch"
    ]
    STATUS_LIST = [
        "dispatch", "nodeserver", "dbgate", "gateserver", "gameserver", "multiserver", "muipserver"
    ]

    @staticmethod
    def is_server_running(server_name: str) -> bool:
        """Check if server tmux session is running."""
        try:
            result = subprocess.run(["tmux", "has-session", "-t", f"{server_name}_session"],
                                  capture_output=True, text=True)
            return result.returncode == 0
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False



    @staticmethod
    def stop_server(server_name: str) -> bool:
        """Stop a server by sending C-c to its tmux session."""
        try:
            # Check if tmux session exists
            result = subprocess.run(["tmux", "has-session", "-t", f"{server_name}_session"],
                                  capture_output=True, text=True)
            if result.returncode != 0:
                return False  # Not running

            # Send C-c to stop the server gracefully
            subprocess.run(["tmux", "send-keys", "-t", f"{server_name}_session", "C-c"], check=True)
            return True
        except subprocess.CalledProcessError:
            return False

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
            env["ASAN_OPTIONS"] = "poison_heap=false:poison_partial=false:poison_array_cookie=false:allow_user_poisoning=false:alloc_dealloc_mismatch=false:new_delete_type_mismatch=false:detect_leaks=false:check_printf=false:detect_container_overflow=false:detect_deadlocks=false:detect_write_exec=false:detect_odr_violation=0:strict_string_checks=false:strict_memcmp=false:intercept_strstr=false:intercept_strspn=false:intercept_strtok=false:intercept_strpbrk=false:intercept_strlen=false:intercept_strndup=false:intercept_strchr=false:intercept_memcmp=false:intercept_memmem=false:intercept_intrin=false:intercept_stat=false:intercept_send=false:replace_intrin=false:replace_str=false:report_globals=0:malloc_context_size=0:allocator_release_to_os_interval_ms=5000:quarantine_size_mb=64:max_malloc_fill_size=512:max_redzone=64"
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
            server_path = os.path.join(SERVER_DIR, server_name)
            original_dir = os.getcwd()
            try:
                # Check if server executable exists
                if not os.path.exists(server_path):
                    print(f"Server executable not found: {server_path}")
                    return False

                os.chdir(SERVER_DIR)
                os.chmod(server_name, 0o755)

                # Server configurations from bash script
                server_configs = {
                    "dispatch": ["-i", "9001.5.1.1"],
                    "nodeserver": ["-i", "9001.3.1.1"],
                    "dbgate": ["-i", "9001.4.1.1"],
                    "gateserver": ["-i", "9001.1.1.1"],
                    "gameserver": ["-i", "9001.2.1.1"],
                    "multiserver": ["-i", "9001.7.1.1"],
                    "muipserver": ["-i", "9001.6.1.1"]
                }
                if server_name in server_configs:
                    # Check if tmux session already exists
                    try:
                        result = subprocess.run(["tmux", "has-session", "-t", f"{server_name}_session"],
                                              capture_output=True, text=True)
                        if result.returncode == 0:
                            return True  # Already running
                    except (subprocess.CalledProcessError, FileNotFoundError):
                        pass

                    # Start server in tmux session
                    full_server_path = os.path.join(SERVER_DIR, server_name)
                    cmd = ["tmux", "new-session", "-d", "-s", f"{server_name}_session",
                           "bash", "-c", f"exec {full_server_path} {' '.join(server_configs[server_name])}"]
                    print(f"Starting {server_name} with command: {' '.join(cmd)}")
                    print(f"Full server path: {full_server_path}")
                    subprocess.run(cmd, env=env, check=True)
                    return True
            finally:
                os.chdir(original_dir)  # Always restore original directory
        except FileNotFoundError as e:
            print(f"Command not found when starting {server_name}: {e}")
            return False
        except subprocess.CalledProcessError as e:
            print(f"Command failed when starting {server_name}: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error starting {server_name}: {e}")
            return False
        return False

    @staticmethod
    def is_sdk_server_running() -> bool:
        """Check if SDK server tmux session is running."""
        try:
            result = subprocess.run(["tmux", "has-session", "-t", "sdk"], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    @staticmethod
    def get_tmux_sessions() -> List[Dict[str, str]]:
        """Get all running tmux sessions with details."""
        sessions = []
        try:
            # Get list of tmux sessions
            result = subprocess.run(["tmux", "list-sessions"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        # Parse tmux session line: "sdk: 1 windows (created Thu Oct  9 12:34:56 2025)"
                        parts = line.split(':')
                        if len(parts) >= 2:
                            session_name = parts[0].strip()
                            session_info = ':'.join(parts[1:]).strip()
                            sessions.append({
                                'name': session_name,
                                'info': session_info
                            })
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass
        return sessions

    @staticmethod
    def stop_sdk_server() -> bool:
        """Stop SDK server by killing the tmux session."""
        try:
            if SystemActions.is_sdk_server_running():
                subprocess.run(["tmux", "kill-session", "-t", "sdk"], check=True)
                return True
            return False
        except subprocess.CalledProcessError:
            return False

    @staticmethod
    def start_sdk_server() -> Tuple[bool, str]:
        """Start SDK server. Returns (success, message)."""
        # Check if already running
        if SystemActions.is_sdk_server_running():
            return False, "Một session vẫn còn đang chạy"
        
        sdk_dir = "/gio/sdk"
        jar_path = os.path.join(sdk_dir, "sdkserver.jar")

        if os.path.exists(jar_path):
            original_dir = os.getcwd()
            try:
                os.chdir(sdk_dir)
                subprocess.run(["tmux", "new-session", "-d", "-s", "sdk", "java", "-jar", "sdkserver.jar"], check=True)
                return True, "SDK server started successfully"
            except subprocess.CalledProcessError as e:
                print(f"Error starting SDK server: {e}")
                return False, f"Error starting SDK server: {e}"
            finally:
                os.chdir(original_dir)  # Always go back
        else:
            print(f"SDK JAR not found at {jar_path}")
            return False, f"SDK JAR not found at {jar_path}"

    @classmethod
    def get_server_statuses(cls) -> Dict[str, Dict[str, str]]:
        """Get status of all servers and log files."""
        server_statuses = {}
        for server in cls.STATUS_LIST:
            if cls.is_server_running(server):
                server_statuses[server] = {
                    "name": f"{server}",
                    "value": "Online"
                }
            else:
                server_statuses[server] = {
                    "name": f"{server}",
                    "value": "Offline"
                }

        # Check SDK server - runs via tmux session
        sdk_running = cls.is_sdk_server_running()
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
        
        # Get server-related tmux sessions only
        all_tmux_sessions = cls.get_tmux_sessions()
        server_sessions = []
        # Filter to only server-related sessions (end with _session or named 'sdk')
        for session in all_tmux_sessions:
            session_name = session['name']
            if session_name.endswith('_session') or session_name == 'sdk':
                server_sessions.append(session)

        server_statuses["tmux_sessions"] = {
            "name": "TMUX SESSIONS",
            "value": server_sessions,
            "type": "tmux_list"
        }

        gameserver_log = os.path.join(SERVER_DIR, "log", "gameserver.log")
        cls.check_and_clean_large_log(gameserver_log)

        return server_statuses

    @classmethod
    def check_running_servers(cls, servers: List[str]) -> Tuple[List[str], List[str]]:
        """Check which servers are already running. Returns (running_servers, stopped_servers)."""
        running = []
        stopped = []

        for server in servers:
            if cls.is_server_running(server):
                running.append(server)
            else:
                stopped.append(server)

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
                # Stop existing server gracefully first
                cls.stop_server(server)
                # Wait a bit for graceful shutdown
                import time
                time.sleep(1)
                # Start new instance
                cls.start_server(server)

        if start_sdk:
            sdk_running = cls.is_sdk_server_running()
            
            if force_restart and sdk_running:
                # Stop existing session before restart
                cls.stop_sdk_server()
                sdk_running = False
            
            if not sdk_running:
                success, message = cls.start_sdk_server()
                if not success:
                    if message == "Một session vẫn còn đang chạy":
                        return [message], False
                    print(f"Warning: Failed to start SDK server: {message}")

        return ["Đã thành công khởi động server"], False


    @classmethod
    def do_force_stop_all(cls) -> List[str]:
        """Force stop all servers. Returns simplified success message."""
        # Stop all servers in reverse order
        for server in cls.STOP_SERVER_ORDER:
            cls.stop_server(server)

        # Stop SDK server by killing tmux session
        cls.stop_sdk_server()

        return ["Đã thành công dừng server"]

    @classmethod
    def do_clear_logs(cls) -> Tuple[List[str], int, int]:
        """Clear all log files by truncating them. Returns simplified success message."""
        log_dir = os.path.join(SERVER_DIR, "log")

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
            "blossom": "event/blossom",
        }

        if event_name.lower() not in event_branches:
            return False

        target_branch = event_branches[event_name.lower()]

        try:
            subprocess.run(["git", "checkout", target_branch], cwd=data_path, check=True)
            subprocess.run(["git", "pull", "origin", target_branch], cwd=data_path, check=True)
            return True
        except subprocess.CalledProcessError as e:
            return False
        except Exception as e:
            return False
    

    @classmethod
    def do_restart_servers(cls, servers: List[str]) -> Tuple[List[str], bool]:
        """Restart servers with proper stop/start sequence."""
        messages = []

        for server in servers:
            if cls.is_server_running(server):
                # Stop server gracefully
                cls.stop_server(server)

                # Wait for graceful shutdown (check session is gone)
                import time
                timeout = 10
                while timeout > 0:
                    if not cls.is_server_running(server):
                        break
                    time.sleep(1)
                    timeout -= 1

                # Start server
                cls.start_server(server)
                messages.append(f"Đã khởi động lại {server}")
            else:
                # Not running, just start
                cls.start_server(server)
                messages.append(f"Đã khởi động {server}")

        return messages, False