"""Add only the PG settings to the existing allowlist loader; never read .env.local."""
import argparse
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile

MARKER = '# SmartNF PG environment 276'
BLOCK = r'''        # SmartNF PG environment 276
        SMARTNF_TOSS_CLIENT_KEY=*|SMARTNF_TOSS_SECRET_KEY=*|SMARTNF_TOSS_WEBHOOK_TOKEN=*)
            task_pg_name=${task_line%%=*}
            task_pg_value=${task_line#*=}
            case "$task_pg_value" in
                \'*\'|\"*\") task_pg_value=${task_pg_value:1:-1} ;;
            esac
            export "$task_pg_name=$task_pg_value"
            unset task_pg_name task_pg_value
            ;;
'''


def patch_launcher(launcher):
    launcher = Path(launcher)
    raw = launcher.read_bytes()
    source = raw.decode('utf-8-sig').replace('\r\n', '\n')
    if MARKER in source:
        if BLOCK not in source:
            raise ValueError('기존 PG 설정 블록이 변경되어 자동 수정을 중단합니다.')
        return 'PG 설정이 이미 반영되어 있습니다.'
    needle = '        DB_URL=*)'
    if (source.count('case "$task_line" in') != 1 or source.count(needle) != 1
            or '지원하지 않는 설정 줄' not in source
            or any(name + '=*' in source for name in (
                'SMARTNF_TOSS_CLIENT_KEY', 'SMARTNF_TOSS_SECRET_KEY', 'SMARTNF_TOSS_WEBHOOK_TOKEN'))):
        raise ValueError('예상한 실행 스크립트 형식과 달라 변경하지 않았습니다. run_local.sh만 확인이 필요합니다.')
    backup = launcher.with_name(launcher.name + '.before-pg-276')
    if backup.exists():
        raise ValueError('기존 .before-pg-276 백업이 있어 변경하지 않았습니다.')
    bash = shutil.which('bash')
    if not bash:
        raise ValueError('Git Bash에서 다시 실행하세요. 실행 스크립트를 변경하지 않았습니다.')
    updated = source.replace(needle, BLOCK + needle, 1)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=launcher.parent, prefix='.smartnf-pg-', suffix='.sh', delete=False) as output:
            temporary = Path(output.name)
            output.write(updated.encode('utf-8'))
        checked = subprocess.run([bash, '-n', temporary.as_posix()], capture_output=True, timeout=10)
        if checked.returncode:
            raise ValueError('수정본 Bash 구문 검사 실패로 기존 파일을 유지했습니다.')
        if launcher.read_bytes() != raw:
            raise ValueError('확인 중 실행 스크립트가 변경되어 수정을 중단합니다.')
        with backup.open('xb') as output:
            output.write(raw)
        os.chmod(temporary, stat.S_IMODE(launcher.stat().st_mode))
        os.replace(temporary, launcher)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return 'PG 환경변수 허용·전달 설정 완료. 원본은 run_local.sh.before-pg-276으로 백업했습니다.'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--launcher', type=Path, default=Path('run_local.sh'))
    args = parser.parse_args()
    try:
        print(patch_launcher(args.launcher))
    except (ValueError, OSError, UnicodeError, subprocess.SubprocessError):
        print('자동 수정하지 못했습니다. run_local.sh 형식 또는 백업 파일을 확인하세요. .env.local은 보내지 마세요.')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
