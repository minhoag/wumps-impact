"""
Business logic for system operations.
Handles server management, process control, and log management.
"""
import os
import subprocess
from typing import List, Dict, Tuple

from discord import Status
from utils.logger import logger

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
    def is_service_running(service: str) -> bool:
        """Check if service is running"""
        result = subprocess.run(["tmux", "list-session"], capture_output=True, text=True)
        if result.returncode != 0:
            return False
        results = result.stdout.split('\n')
        for result in results:
            if f"{service}_session" in result:
                return True
    
    @staticmethod
    def start_service(service: str) -> Tuple[bool, str]:
        # go to folder
        os.chdir(SERVER_DIR)
        # check if folder exists
        if not os.path.exists(service):
            return False, f"Folder {service} not found"
        cmd = ["tmux", "new-session", "-d", "-s", f"{service}_session",
               f"./{service}"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return False, f"Failed to start {service}"
        return True, f"Started {service}"
    
    @staticmethod
    def stop_service(service: str) -> Tuple[bool, str]:
        cmd = ["tmux", "kill-session", "-t", f"{service}_session"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return False, f"Failed to stop {service}"
        return True, f"Stopped {service}"
    
    @staticmethod
    def clear_logs(service: str) -> Tuple[bool, str]:
        cmd = ["rm", "-rf", f"{SERVER_DIR}/{service}/logs/*"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return False, f"Failed to clear logs for {service}"
        return True, f"Cleared logs for {service}"
    
    def start_server():
        for service in SystemActions.START_SERVER_ORDER:
            if not SystemActions.is_service_running(service):
                SystemActions.start_service(service)
            else:
                print(f"Service {service} is already running")

    def stop_server():
        for service in SystemActions.STOP_SERVER_ORDER:
            if SystemActions.is_service_running(service):
                SystemActions.stop_service(service)
            else:
                print(f"Service {service} is not running")