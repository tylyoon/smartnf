"""Explicit-dependency standalone integration check; authentication is isolated only for this harness."""
from pathlib import Path
import argparse,subprocess,tempfile,os
p=argparse.ArgumentParser();p.add_argument('--classpath',required=True);p.add_argument('--project-dir',type=Path);a=p.parse_args()
root=Path(__file__).resolve().parents[1];project=(a.project_dir or root).resolve();policy=project/'src/main/java/com/onrender/smartnf/web/RecipeTastePolicy.java'
if not policy.is_file():raise SystemExit('기존 194절 이후 프로젝트를 --project-dir로 지정하세요.')
with tempfile.TemporaryDirectory(prefix='smartnf-preferences-') as tmp:
 sources=list((root/'src/main/java').rglob('*.java'))+list((root/'tests/identity-fixtures').glob('*.java'))+[root/'tests/PreferenceIntegrationCheck.java',policy]
 subprocess.run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-cp',a.classpath,'-d',tmp,*map(str,sources)],check=True)
 subprocess.run(['java','-cp',tmp+os.pathsep+a.classpath,'com.onrender.smartnf.web.PreferenceIntegrationCheck'],check=True)
