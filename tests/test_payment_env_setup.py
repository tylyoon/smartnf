"""Verify launcher compatibility, literal values, and preservation of the original."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools/business'))
from setup_payment_env import BLOCK, patch_launcher

BASE = '''#!/usr/bin/env bash
set -euo pipefail
fail() { printf '%s\\n' "$1" >&2; exit 1; }
while IFS= read -r task_line || [[ -n "$task_line" ]]; do
    task_line=${task_line%$'\\r'}
    case "$task_line" in
        ''|'#'*) continue ;;
        DB_URL=*) task_db_url=${task_line#*=} ;;
        *) fail ".env.local에 지원하지 않는 설정 줄이 있습니다." ;;
    esac
done < .env.local
[[ "$SMARTNF_TOSS_CLIENT_KEY" == "$EXPECTED_CLIENT" ]]
[[ "$SMARTNF_TOSS_SECRET_KEY" == "$EXPECTED_SECRET" ]]
'''


class PaymentEnvSetupTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.launcher = self.root / 'run_local.sh'
        self.launcher.write_text(BASE)

    def run_launcher(self, env_text, client, secret):
        (self.root / '.env.local').write_bytes(env_text.encode())
        return subprocess.run(['bash', self.launcher.as_posix()], cwd=self.root, capture_output=True,
            env={**os.environ, 'EXPECTED_CLIENT': client, 'EXPECTED_SECRET': secret})

    def test_plain_and_quoted_values_are_exported_without_quotes(self):
        patch_launcher(self.launcher)
        result = self.run_launcher("SMARTNF_TOSS_CLIENT_KEY='test_gck_sample'\r\nSMARTNF_TOSS_SECRET_KEY=\"test_gsk_sample\"\r\n", 'test_gck_sample', 'test_gsk_sample')
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertEqual(result.stdout, b'')
        result = self.run_launcher('SMARTNF_TOSS_CLIENT_KEY=test_gck_sample\nSMARTNF_TOSS_SECRET_KEY=test_gsk_sample\n', 'test_gck_sample', 'test_gsk_sample')
        self.assertEqual(result.returncode, 0)

    def test_shell_expression_is_literal_and_not_executed(self):
        patch_launcher(self.launcher)
        value = 'test_gck_$(touch SHOULD_NOT_EXIST)'
        result = self.run_launcher('SMARTNF_TOSS_CLIENT_KEY='+value+'\nSMARTNF_TOSS_SECRET_KEY=test_gsk_sample\n', value, 'test_gsk_sample')
        self.assertEqual(result.returncode, 0)
        self.assertFalse((self.root / 'SHOULD_NOT_EXIST').exists())

    def test_backup_and_repeated_setup_preserve_original(self):
        original = self.launcher.read_bytes()
        patch_launcher(self.launcher)
        changed = self.launcher.read_bytes()
        self.assertEqual(self.launcher.with_name('run_local.sh.before-pg-276').read_bytes(), original)
        self.assertEqual(changed.decode().replace(BLOCK, ''), BASE)
        patch_launcher(self.launcher)
        self.assertEqual(self.launcher.read_bytes(), changed)

    def test_unknown_setting_is_still_rejected(self):
        patch_launcher(self.launcher)
        result = self.run_launcher('UNSUPPORTED_KEY=value\n', '', '')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('지원하지 않는 설정 줄', result.stderr.decode())

    def test_unrecognized_launcher_is_not_modified(self):
        self.launcher.write_text('#!/bin/bash\necho unrelated\n')
        before = self.launcher.read_bytes()
        with self.assertRaises(ValueError):patch_launcher(self.launcher)
        self.assertEqual(self.launcher.read_bytes(), before)
        self.assertFalse(self.launcher.with_name('run_local.sh.before-pg-276').exists())

    def test_existing_backup_is_not_overwritten(self):
        backup = self.launcher.with_name('run_local.sh.before-pg-276')
        backup.write_text('keep this backup')
        before = self.launcher.read_bytes()
        with self.assertRaises(ValueError):patch_launcher(self.launcher)
        self.assertEqual(self.launcher.read_bytes(), before)
        self.assertEqual(backup.read_text(), 'keep this backup')


if __name__ == '__main__':
    unittest.main()
