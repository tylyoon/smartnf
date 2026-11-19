"""Start SmartNF and its local model together using only the Python standard library."""
import argparse
import errno
import http.client
import json
import os
from pathlib import Path
import re
import select
import shutil
import signal
import socket
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
ALIAS = "smartnf-food-parser"
shutdown_requested = False
DEFAULT_MODEL = ROOT / "llm/food-parser/models/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf"


class LaunchError(Exception):
    pass


def integer_setting(name, default, minimum, maximum):
    try:
        value = int(os.environ.get(name, str(default)))
    except ValueError:
        raise LaunchError(f"{name}에는 정수를 입력하세요.") from None
    if not minimum <= value <= maximum:
        raise LaunchError(f"{name} 범위를 확인하세요 ({minimum}~{maximum}).")
    return value


def local_path(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    if os.name == "nt" and re.match(r"^/[a-zA-Z]/", value):
        value = value[1].upper() + ":/" + value[3:]
    path = Path(os.path.expandvars(os.path.expanduser(value)))
    return path if path.is_absolute() else ROOT / path


def model_runner():
    explicit = os.environ.get("SMARTNF_LLM_EXECUTABLE", "").strip()
    if explicit:
        path = local_path(explicit)
        if not path.is_file():
            raise LaunchError("SMARTNF_LLM_EXECUTABLE의 실행 파일 경로를 확인하세요.")
        return [str(path), "serve"] if path.stem.lower() == "llama" else [str(path)]
    for name in ("llama-server", "llama"):
        path = shutil.which(name)
        if path:
            return [path, "serve"] if name == "llama" else [path]
    roots = []
    for variable in ("LOCALAPPDATA", "ProgramFiles", "ProgramW6432"):
        value = os.environ.get(variable)
        if value:
            root = Path(value) / "Microsoft/WinGet" if variable == "LOCALAPPDATA" else Path(value) / "WinGet"
            if root not in roots:
                roots.append(root)
    for root in roots:
        link = root / "Links/llama-server.exe"
        if link.is_file():
            return [str(link)]
        packages = root / "Packages"
        if not packages.is_dir():
            continue
        for package in sorted(packages.glob("ggml.llamacpp_*"), key=lambda path: path.stat().st_mtime, reverse=True):
            candidates = sorted(package.rglob("llama-server.exe"))
            if candidates:
                return [str(candidates[0])]
    raise LaunchError("llama.cpp 실행 파일을 찾지 못했습니다. 설치 상태 또는 SMARTNF_LLM_EXECUTABLE을 확인하세요.")


def model_command(port):
    model = local_path(os.environ["SMARTNF_LLM_MODEL_PATH"]) if os.environ.get("SMARTNF_LLM_MODEL_PATH") else DEFAULT_MODEL
    if not model.is_file():
        raise LaunchError("모델 파일이 없습니다. python llm/food-parser/download_model.py 로 먼저 준비하세요.")
    return [*model_runner(), "--model", str(model), "--alias", ALIAS,
            "--host", "127.0.0.1", "--port", str(port), "--ctx-size", "4096"]


class ProbePending(Exception):
    pass


def socket_code(error):
    code = getattr(error, "winerror", None) or getattr(error, "errno", None)
    if isinstance(code, int):
        return code
    match = re.search(r"(?:WinError|Errno)\s+(\d+)", str(error))
    return int(match.group(1)) if match else None


def network_error(error, port):
    code = socket_code(error)
    label = f"오류 코드 {code}" if code is not None else type(error).__name__
    return LaunchError(f"모델 포트 127.0.0.1:{port} 연결을 확인하지 못했습니다 ({label}).")


def port_is_open(port):
    pending = {errno.EINPROGRESS, errno.EWOULDBLOCK, errno.EALREADY, 10035, 10036, 10037}
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.setblocking(False)
            code = probe.connect_ex(("127.0.0.1", port))
            if code in pending:
                # Windows reports connection refusal through the exceptional set.
                _, writable, exceptional = select.select([], [probe], [probe], 10)
                if not writable and not exceptional:
                    raise LaunchError(f"127.0.0.1:{port} TCP 연결 결과를 10초 안에 확인하지 못했습니다. 모델 준비 중으로 처리하지 않고 중단합니다.") from None
                code = probe.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR)
                if code in pending:
                    raise LaunchError(f"127.0.0.1:{port} TCP 연결이 완료되지 않았습니다 (오류 코드 {code}).") from None
    except OSError as error:
        if isinstance(error, ConnectionRefusedError) or socket_code(error) in (errno.ECONNREFUSED, 10061):
            return False
        raise network_error(error, port) from None
    if code == 0:
        return True
    if code in (errno.ECONNREFUSED, 10061):
        return False
    raise LaunchError(f"모델 포트 127.0.0.1:{port}의 TCP 연결을 확인하지 못했습니다 (오류 코드 {code}).")


def read_status(port, path):
    # Use a direct local connection, without URL/proxy error wrapping.
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
    try:
        connection.request("GET", path, headers={"Accept": "application/json", "Connection": "close"})
        response = connection.getresponse()
        raw = response.read(65537)
        if len(raw) > 65536:
            raise LaunchError("모델 포트에서 예상과 다른 응답을 받았습니다.")
        return response.status, json.loads(raw)
    except (socket.timeout, TimeoutError, ConnectionResetError, ConnectionAbortedError, http.client.RemoteDisconnected):
        raise ProbePending from None
    except OSError as error:
        if isinstance(error, ConnectionRefusedError) or socket_code(error) in (
                errno.ECONNREFUSED, errno.ECONNRESET, errno.ECONNABORTED, errno.ETIMEDOUT,
                10035, 10036, 10037, 10053, 10054, 10060, 10061):
            raise ProbePending from None
        raise network_error(error, port) from None
    except (ValueError, http.client.HTTPException):
        raise LaunchError("모델 포트에서 HTTP·JSON 응답을 확인할 수 없습니다. 다른 서비스인지 확인하세요.") from None
    finally:
        connection.close()


def model_status(port):
    try:
        if not port_is_open(port):
            return "down"
        status, health = read_status(port, "/health")
        if not isinstance(health, dict):
            raise LaunchError("모델 상태 응답을 확인할 수 없습니다.")
        if status == 503 and isinstance(health.get("error"), dict) and health["error"].get("message") == "Loading model":
            return "loading"
        if status != 200 or health.get("status") != "ok":
            raise LaunchError("모델 포트가 사용 중이지만 정상 모델 서버를 확인하지 못했습니다.")
        status, models = read_status(port, "/v1/models")
        if status != 200 or not isinstance(models, dict) or not isinstance(models.get("data"), list):
            raise LaunchError("모델 목록을 확인하지 못했습니다.")
        if not any(isinstance(model, dict) and model.get("id") == ALIAS for model in models["data"]):
            raise LaunchError("다른 모델이 실행 중입니다. 기존 모델 서버를 종료한 뒤 다시 실행하세요.")
        return "ready"
    except ProbePending:
        return "loading"


def start_process(command, output=None):
    options = {"cwd": ROOT}
    if output is not None:
        options.update(stdout=output, stderr=subprocess.STDOUT)
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        options["start_new_session"] = True
    return subprocess.Popen(command, **options)


def stop_process(process):
    if process is None:
        return
    if os.name == "nt":
        if process.poll() is not None:
            return
        try:
            process.send_signal(signal.CTRL_BREAK_EVENT)
            process.wait(timeout=8)
            return
        except (OSError, subprocess.TimeoutExpired):
            try:
                subprocess.run(["taskkill.exe", "/PID", str(process.pid), "/T", "/F"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10, check=False)
            except (OSError, subprocess.TimeoutExpired):
                process.kill()
    else:
        # The isolated group includes Gradle and the application Java process.
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            process.wait(timeout=8)
        except subprocess.TimeoutExpired:
            pass
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    try:
        process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        pass


def wait_ready(port, timeout, owned):
    deadline = time.monotonic() + timeout
    next_message = 0
    while time.monotonic() < deadline:
        check_interrupted()
        if owned is not None and owned.poll() is not None:
            raise LaunchError("모델 서버가 종료되었습니다. logs/local-services/model.log를 확인하세요.")
        if model_status(port) == "ready":
            return
        if time.monotonic() >= next_message:
            print("자체 모델을 준비하고 있습니다...", flush=True)
            next_message = time.monotonic() + 10
        time.sleep(0.5)
    raise LaunchError("모델 준비 시간이 초과됐습니다. 로그 또는 SMARTNF_LLM_STARTUP_TIMEOUT을 확인하세요.")


class ProjectLock:
    def __init__(self, path):
        self.path = path
        self.stream = None

    def __enter__(self):
        self.stream = self.path.open("a+b")
        self.stream.seek(0, 2)
        if self.stream.tell() == 0:
            self.stream.write(b"0")
            self.stream.flush()
        self.stream.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.stream.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.stream.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self.stream.close()
            raise LaunchError("이 프로젝트의 통합 실행이 이미 켜져 있습니다. 기존 터미널을 확인하세요.") from None
        return self

    def __exit__(self, *args):
        self.stream.close()


def interrupted(signum, frame):
    # Record cancellation so a newly spawned child can first be assigned to its owner.
    global shutdown_requested
    shutdown_requested = True


def check_interrupted():
    if shutdown_requested:
        raise KeyboardInterrupt


def supervise(model_only=False):
    model = app = None
    log = None
    try:
        check_interrupted()
        enabled = os.environ.get("SMARTNF_LOCAL_LLM_ENABLED", "true").strip().lower()
        if enabled not in ("true", "false"):
            raise LaunchError("SMARTNF_LOCAL_LLM_ENABLED는 true 또는 false로 설정하세요.")
        if model_only or enabled == "true":
            port = integer_setting("SMARTNF_LLM_PORT", 8091, 1024, 65535)
            timeout = integer_setting("SMARTNF_LLM_STARTUP_TIMEOUT", 300, 1, 1800)
            state = model_status(port)
            if state == "down":
                command = model_command(port)
                log = (ROOT / "logs/local-services/model.log").open("wb")
                print("자체 모델 서버를 시작합니다. 로그: logs/local-services/model.log", flush=True)
                model = start_process(command, log)
            else:
                print("실행 중인 모델 서버를 확인합니다.", flush=True)
            wait_ready(port, timeout, model)
            os.environ["SMARTNF_LOCAL_LLM_ENABLED"] = "true"
            os.environ["SMARTNF_LLM_PORT"] = str(port)
            print(f"자체 모델 준비 완료 · http://127.0.0.1:{port}", flush=True)
        else:
            os.environ["SMARTNF_LOCAL_LLM_ENABLED"] = "false"
        if model_only and model is None:
            print("이미 실행 중인 모델 서버를 사용할 수 있습니다.", flush=True)
            return 0
        check_interrupted()
        if not model_only:
            print("SmartNF를 시작합니다. 웹 서비스와 사진 예약 검색이 함께 실행됩니다. 종료: Ctrl+C", flush=True)
            app = start_process([os.environ.get("SMARTNF_RUNNER_BASH", "bash"), "./gradlew", "bootRun", "--no-daemon"])
        while True:
            check_interrupted()
            if app is not None and app.poll() is not None:
                return app.returncode
            if model is not None and model.poll() is not None:
                raise LaunchError("자체 모델 서버가 종료되어 통합 실행을 마칩니다. 모델 로그를 확인하세요.")
            time.sleep(0.25)
    finally:
        if app is not None or model is not None:
            print("이번 실행에서 시작한 서비스를 종료하는 중입니다...", flush=True)
        # Let the first interrupt finish cleanup before another interrupt arrives.
        handlers = {}
        for name in ("SIGINT", "SIGTERM", "SIGBREAK"):
            if hasattr(signal, name):
                number = getattr(signal, name)
                handlers[number] = signal.signal(number, signal.SIG_IGN)
        try:
            try:
                stop_process(app)
            finally:
                stop_process(model)
                if log is not None:
                    log.close()
        finally:
            for number, handler in handlers.items():
                signal.signal(number, handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-only", action="store_true")
    args = parser.parse_args()
    for name in ("SIGINT", "SIGTERM", "SIGBREAK"):
        if hasattr(signal, name):
            signal.signal(getattr(signal, name), interrupted)
    directory = ROOT / "logs/local-services"
    try:
        directory.mkdir(parents=True, exist_ok=True)
        if args.model_only:
            return supervise(model_only=True)
        with ProjectLock(directory / "run.lock"):
            return supervise()
    except KeyboardInterrupt:
        print("\n이번 실행에서 시작한 서비스를 종료했습니다.", flush=True)
        return 130
    except LaunchError as error:
        print(str(error), file=sys.stderr, flush=True)
        return 1
    except OSError:
        print("실행 파일·프로젝트 경로·로그 폴더 권한을 확인하세요.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
