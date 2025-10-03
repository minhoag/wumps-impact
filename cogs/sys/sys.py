# cogs/sys/sys.py

import discord
from discord import app_commands, Interaction
from discord.ext import commands
from cogs.check import is_whitelist
from cogs.sys.sys_view import SysView
import os
import subprocess
import asyncio
import time
from typing import List
class SYS(commands.Cog):
    """Cog for handling System commands."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

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

    sys = app_commands.Group(name="sys", description="System commands for Genshin Impact 3.4 server management")

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
    def start_server(server_name: str) -> bool:
        """Start a specific server."""
        try:
            # Set environment variables like in the bash script
            env = os.environ.copy()
            env["ASAN_OPTIONS"] = "poison_heap=false:poison_partial=false:poison_array_cookie=false:allow_user_poisoning=false:alloc_dealloc_mismatch=false:new_delete_type_mismatch=false:detect_leaks=false:check_printf=false:detect_container_overflow=false:detect_deadlocks=false:detect_write_exec=false:detect_odr_violation=0:strict_string_checks=false:strict_memcmp=false:intercept_strstr=false:intercept_strspn=false:intercept_strtok=false:intercept_strpbrk=false:intercept_strlen=false:intercept_strndup=false:intercept_strchr=false:intercept_memcmp=false:intercept_memmem=false:intercept_intrin=false:intercept_stat=false:intercept_send=false:replace_intrin=false:replace_str=false:report_globals=0:malloc_context_size=0:allocator_release_to_os_interval_ms=5000:quarantine_size_mb=16:max_malloc_fill_size=512:max_redzone=64:abort_on_error=0:halt_on_error=0"

            # Find ASan library
            asan_lib = ""
            try:
                result = subprocess.run(["find", "/usr/lib*", "/lib*", "-name", "libasan.so*", "-print", "-quit"],
                                      capture_output=True, text=True)
                if result.returncode == 0 and result.stdout.strip():
                    asan_lib = result.stdout.strip()
            except:
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
        try:
            # Change to SDK directory and start with screen
            sdk_dir = "../sdk"
            if os.path.exists(sdk_dir):
                os.chdir(sdk_dir)
                subprocess.run(["screen", "-dmS", "sdk", "java", "-jar", "sdkserver.jar"])
                os.chdir("../")  # Go back
                return True
        except Exception as e:
            print(f"Error starting SDK server: {e}")
        return False

    async def wait_for_servers_to_stop(self, server_list: List[str], interaction: Interaction, timeout: int = 30):
        """Wait for servers to stop gracefully."""
        start_time = time.time()
        stopped_servers = []

        while time.time() - start_time < timeout and len(stopped_servers) < len(server_list):
            for server in server_list:
                if server in stopped_servers:
                    continue

                pid = self.get_server_pid(server)
                if not pid:
                    stopped_servers.append(server)
                    await interaction.followup.send(f"{server} stopped", ephemeral=True)

            if len(stopped_servers) < len(server_list):
                await asyncio.sleep(2)

        # Force kill remaining servers
        for server in server_list:
            if server not in stopped_servers:
                pid = self.get_server_pid(server)
                if pid:
                    self.kill_process(pid, force=True)
                    await interaction.followup.send(f"Force stopped {server}", ephemeral=True)

    @sys.command(name="start", description="Start all servers")
    @is_whitelist
    async def start_servers(self, interaction: Interaction):
        """Start all servers in the correct order."""
        await interaction.response.defer(ephemeral=True)

        started_servers = []
        for server in self.START_SERVER_ORDER:
            if self.start_server(server):
                started_servers.append(server)
                await interaction.followup.send(f"Started {server}", ephemeral=True)
            else:
                await interaction.followup.send(f"Failed to start {server}", ephemeral=True)

        # Start SDK server
        if self.start_sdk_server():
            await interaction.followup.send("Started SDK server", ephemeral=True)
        else:
            await interaction.followup.send("Failed to start SDK server", ephemeral=True)

        await interaction.followup.send("Server startup complete!", ephemeral=True)

    @sys.command(name="stop", description="Stop all servers gracefully")
    @is_whitelist
    async def stop_servers(self, interaction: Interaction):
        """Stop all servers in the correct order."""
        confirm_embed = SysView.create_stop_confirmation_embed()
        confirm_view = SysView(timeout=30)

        await interaction.response.send_message(embed=confirm_embed, view=confirm_view, ephemeral=True)

        # Wait for confirmation
        confirmed = await confirm_view.wait_for_confirmation(interaction, "Server stop")

        if not confirmed:
            return  # Operation was cancelled or timed out

        # Proceed with stop
        await interaction.followup.send("Stopping servers...", ephemeral=True)

        stopped_servers = []
        for server in self.STOP_SERVER_ORDER:
            pid = self.get_server_pid(server)
            if pid:
                if self.kill_process(pid):
                    stopped_servers.append(server)
                    await interaction.followup.send(f"Sent stop signal to {server} (PID: {pid})", ephemeral=True)
                else:
                    await interaction.followup.send(f"Failed to stop {server}", ephemeral=True)
            else:
                await interaction.followup.send(f"{server} is not running", ephemeral=True)

        # Wait for servers to stop
        if stopped_servers:
            await self.wait_for_servers_to_stop(stopped_servers, interaction)

        await interaction.followup.send("All servers stopped!", ephemeral=True)

    @sys.command(name="stop_all", description="Force stop all servers")
    @is_whitelist
    async def stop_all_servers(self, interaction: Interaction):
        """Force stop all servers immediately."""
        confirm_embed = SysView.create_stop_all_confirmation_embed()
        confirm_view = SysView(timeout=30)

        await interaction.response.send_message(embed=confirm_embed, view=confirm_view, ephemeral=True)

        # Wait for confirmation
        confirmed = await confirm_view.wait_for_confirmation(interaction, "Force stop all servers")

        if not confirmed:
            return  # Operation was cancelled or timed out

        # Proceed with force stop
        await interaction.followup.send("Force stopping all servers...", ephemeral=True)

        for server in self.STOP_SERVER_ORDER:
            pid = self.get_server_pid(server)
            if pid:
                if self.kill_process(pid, force=True):
                    await interaction.followup.send(f"Force stopped {server} (PID: {pid})", ephemeral=True)
                else:
                    await interaction.followup.send(f"Failed to force stop {server}", ephemeral=True)
            else:
                await interaction.followup.send(f"{server} is not running", ephemeral=True)

        # Stop SDK server
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                if 'sdk' in line:
                    screen_id = line.split('.')[0].strip()
                    if screen_id:
                        subprocess.run(["kill", "-9", screen_id])
                        subprocess.run(["screen", "-wipe"])
                        await interaction.followup.send("Force stopped SDK server", ephemeral=True)
                        break
        except:
            await interaction.followup.send("Failed to stop SDK server", ephemeral=True)

        await interaction.followup.send("All servers force stopped!", ephemeral=True)

    @sys.command(name="restart", description="Restart all servers")
    @is_whitelist
    async def restart_servers(self, interaction: Interaction):
        """Restart all servers (stop then start)."""
        confirm_embed = SysView.create_restart_confirmation_embed()
        confirm_view = SysView(timeout=30)

        await interaction.response.send_message(embed=confirm_embed, view=confirm_view, ephemeral=True)

        # Wait for confirmation
        confirmed = await confirm_view.wait_for_confirmation(interaction, "Server restart")

        if not confirmed:
            return  # Operation was cancelled or timed out

        # Proceed with restart
        await interaction.followup.send("Restarting servers...", ephemeral=True)

        # Stop servers first
        await interaction.followup.send("Stopping servers...", ephemeral=True)
        for server in self.STOP_SERVER_ORDER:
            pid = self.get_server_pid(server)
            if pid:
                self.kill_process(pid)

        # Force stop any remaining
        await asyncio.sleep(5)
        for server in self.STOP_SERVER_ORDER:
            pid = self.get_server_pid(server)
            if pid:
                self.kill_process(pid, force=True)

        # Stop SDK
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                if 'sdk' in line:
                    screen_id = line.split('.')[0].strip()
                    if screen_id:
                        subprocess.run(["kill", "-9", screen_id])
                        subprocess.run(["screen", "-wipe"])
                        break
        except:
            pass

        await interaction.followup.send("Servers stopped, starting...", ephemeral=True)

        # Start servers
        started_servers = []
        for server in self.START_SERVER_ORDER:
            if self.start_server(server):
                started_servers.append(server)
                await interaction.followup.send(f"Started {server}", ephemeral=True)

        if self.start_sdk_server():
            await interaction.followup.send("Started SDK server", ephemeral=True)

        await interaction.followup.send("Server restart complete!", ephemeral=True)

    @sys.command(name="status", description="Check server status")
    @is_whitelist
    async def server_status(self, interaction: Interaction):
        """Check the status of all servers."""
        await interaction.response.defer(ephemeral=True)

        server_statuses = {}

        for server in self.STATUS_LIST:
            pid = self.get_server_pid(server)
            if pid:
                # Get CPU and memory usage
                cpu, mem = "", ""
                try:
                    result = subprocess.run(
                        ["ps", "-p", pid, "-o", "pcpu,pmem"],
                        capture_output=True, text=True
                    )
                    if result.returncode == 0:
                        lines = result.stdout.strip().split('\n')
                        if len(lines) >= 2:
                            cpu, mem = lines[1].split()
                except:
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
        try:
            result = subprocess.run(["screen", "-ls"], capture_output=True, text=True)
            sdk_running = any('sdk' in line for line in result.stdout.split('\n'))
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
        except:
            server_statuses["sdk"] = {
                "name": "UNKNOWN SDK Server",
                "value": "Status unknown"
            }

        status_embed = SysView.create_status_embed(interaction, server_statuses)
        await interaction.followup.send(embed=status_embed, ephemeral=True)

    @sys.command(name="restart_system", description="Restart the entire system")
    @is_whitelist
    async def restart_system(self, interaction: Interaction):
        """Restart the entire system."""
        confirm_embed = SysView.create_system_reboot_confirmation_embed()
        confirm_view = SysView(timeout=30)

        await interaction.response.send_message(embed=confirm_embed, view=confirm_view, ephemeral=True)

        # Wait for confirmation
        confirmed = await confirm_view.wait_for_confirmation(interaction, "System reboot")

        if not confirmed:
            return  # Operation was cancelled or timed out

        # Proceed with system reboot
        await interaction.followup.send("System reboot initiated...", ephemeral=True)
        # Give time for the message to send
        await asyncio.sleep(2)
        os.system("sudo reboot")


async def setup(bot: commands.Bot):
    await bot.add_cog(SYS(bot))