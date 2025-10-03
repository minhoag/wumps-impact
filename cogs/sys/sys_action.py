"""
Business logic for system operations.
Handles server management, process control, and log management.
"""
import os
import subprocess
from typing import List, Dict, Tuple


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
        print(f"Debug: Attempting to clear log directory: {log_dir}")

        if not os.path.exists(log_dir):
            print(f"Debug: Directory {log_dir} does not exist")
            return 0, 1

        if not os.path.isdir(log_dir):
            print(f"Debug: {log_dir} is not a directory")
            return 0, 1

        files_cleared = 0
        errors = 0

        try:
            # Get list of files
            files = [f for f in os.listdir(log_dir) if os.path.isfile(os.path.join(log_dir, f))]
            print(f"Debug: Found {len(files)} files to clear")

            for filename in files:
                file_path = os.path.join(log_dir, filename)
                try:
                    # Truncate the file (make it empty) instead of deleting
                    with open(file_path, 'w') as f:
                        f.truncate(0)
                    files_cleared += 1
                    print(f"Debug: Cleared file: {filename}")
                except Exception as e:
                    print(f"Debug: Failed to clear {filename}: {e}")
                    errors += 1

            print(f"Debug: Successfully cleared {files_cleared} files, {errors} errors")
            return files_cleared, errors

        except Exception as e:
            print(f"Unexpected error accessing log directory {log_dir}: {e}")
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
            # Make executable and start
            os.chmod(server_name, 0o755)
            # Server configurations from bash script
            server_configs = {
                "nodeserver": ["-i", "9001.3.1.1"],
                "gateserver": ["-i", "9001.1.1.1"],
                "dbgate": ["-i", "9001.4.1.1"],
                "dispatch": ["-i", "9001.5.1.1"],
                "gameserver": ["-i", "9001.2.1.1"],
                "multiserver": ["-i", "9001.7.1.1"],
                "muipserver": ["-i", "9001.6.1.1"]
            }
            if server_name in server_configs:
                cmd = ["nohup", f"./{server_name}"] + server_configs[server_name]
                subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
                return True
        except Exception as e:
            print(f"Error starting {server_name}: {e}")
            return False
        return False

    @staticmethod
    def start_sdk_server() -> bool:
        """Start SDK server."""
        sdk_dir = "../sdk"
        if os.path.exists(sdk_dir):
            original_dir = os.getcwd()
            try:
                os.chdir(sdk_dir)
                subprocess.run(["screen", "-dmS", "sdk", "java", "-jar", "sdkserver.jar"], check=True)
                return True
            finally:
                os.chdir(original_dir)  # Always go back
        return False

    @classmethod
    def get_server_statuses(cls) -> Dict[str, Dict[str, str]]:
        """Get status of all servers and log files."""
        server_statuses = {}
        for server in cls.STATUS_LIST:
            pid = cls.get_server_pid(server)
            if pid:
                cpu = ""
                mem = ""
                try:
                    result = subprocess.run(["ps", "-p", pid, "-o", "pcpu,pmem"], capture_output=True, text=True, check=True)
                    lines = result.stdout.strip().splitlines()
                    if len(lines) >= 2:
                        cpu, mem = lines[1].split()
                except subprocess.CalledProcessError:
                    pass
                if cpu and mem:
                    server_statuses[server] = {
                        "name": f"RUNNING {server}",
                        "value": f"PID: {pid}\nCPU: {cpu}%\nMEM: {mem}%"
                    }
                else:
                    server_statuses[server] = {
                        "name": f"RUNNING {server}",
                        "value": f"PID: {pid}"
                    }
            else:
                server_statuses[server] = {
                    "name": f"STOPPED {server}",
                    "value": "Not running"
                }

        # Check SDK server
        sdk_running = False
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True, check=True)
            sdk_running = any('sdk' in line for line in result.stdout.splitlines())
        except subprocess.CalledProcessError:
            pass
        if sdk_running:
            server_statuses["sdk"] = {
                "name": "RUNNING SDK Server",
                "value": "Running"
            }
        else:
            server_statuses["sdk"] = {
                "name": "STOPPED SDK Server",
                "value": "Not running"
            }

        # Log file monitoring
        gameserver_log = "/gio/bin/log/gameserver.log"
        log_size = cls.get_log_file_size(gameserver_log)
        server_statuses["log_gameserver"] = {
            "name": "GAMESERVER LOG",
            "value": f"Size: {log_size}"
        }

        # Check and clean large log file
        if cls.check_and_clean_large_log(gameserver_log):
            print("Automatically cleaned gameserver.log (exceeded 2GB)")

        return server_statuses

    @classmethod
    def do_start_servers(cls, servers: List[str], start_sdk: bool = False) -> List[str]:
        """Start multiple servers. Returns list of results."""
        results = []
        for server in servers:
            if cls.start_server(server):
                results.append(f"Started {server}")
            else:
                results.append(f"Failed to start {server}")
        if start_sdk:
            if cls.start_sdk_server():
                results.append("Started SDK server")
            else:
                results.append("Failed to start SDK server")
        results.append("Server startup complete!")
        return results

    @classmethod
    def do_force_stop_all(cls) -> List[str]:
        """Force stop all servers. Returns list of results."""
        results = []
        for server in cls.STOP_SERVER_ORDER:
            pid = cls.get_server_pid(server)
            if pid:
                if cls.kill_process(pid, force=True):
                    results.append(f"Force stopped {server} (PID: {pid})")
                else:
                    results.append(f"Failed to force stop {server}")
            else:
                results.append(f"{server} is not running")

        # Stop SDK server
        stopped_sdk = False
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True, check=True)
            for line in result.stdout.splitlines():
                if 'sdk' in line:
                    screen_id = line.split('.')[0].strip()
                    if screen_id:
                        subprocess.run(["kill", "-9", screen_id], check=True)
                        subprocess.run(["screen", "-wipe"], check=True)
                        stopped_sdk = True
                        break
        except subprocess.CalledProcessError:
            pass

        if stopped_sdk:
            results.append("Force stopped SDK server")
        else:
            results.append("SDK server not running or failed to stop")

        results.append("All servers force stopped!")
        return results

    @classmethod
    def do_clear_logs(cls) -> Tuple[List[str], int, int]:
        """Clear all log files by truncating them. Returns (messages, files_cleared, errors)."""
        log_dir = "/gio/bin/log"
        messages = ["Clearing log files..."]

        files_cleared, errors = cls.clear_log_directory(log_dir)
        if files_cleared > 0:
            messages.append(f"Successfully cleared {files_cleared} log files")
        elif errors == 0:
            messages.append("No log files found to clear")
        else:
            messages.append("Failed to clear log files")

        return messages, files_cleared, errors
