"""Local browser-test fixture. Real workers, temporary DB, test identities only."""
import json
import os
import sys
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from http.cookies import SimpleCookie

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/business'))
from trade import process
from documents import handle
from trade_payments import process as payment_process

temporary=tempfile.TemporaryDirectory()
directory=Path(temporary.name)
os.environ['SMARTNF_DOCUMENT_DIR']=str(directory/'documents')


class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):
        pass

    def do_GET(self):
        path=self.path.split('?')[0]
        if path.startswith('/preview/business'):
            suffix=path.removeprefix('/preview/').strip('/')
            file=ROOT/'src/main/resources/templates/preview'/(suffix+'.html')
            if not file.is_file():
                self.send_error(404);return
            content=file.read_text().replace('th:content="${_csrf.token}"','content="fixture"').replace('th:content="${_csrf.headerName}"','content="X-CSRF-TOKEN"')
            content=content.replace('<header th:replace="~{fragments/layout :: header}"></header>','<header data-account-key="fixture"></header>')
            raw=content.encode();mime='text/html'
        else:
            file=(ROOT/'src/main/resources/static'/path.lstrip('/')).resolve()
            if not file.is_relative_to(ROOT/'src/main/resources/static') or not file.is_file():
                self.send_error(404);return
            raw=file.read_bytes();mime={'.js':'text/javascript','.css':'text/css'}.get(file.suffix,'application/octet-stream')
        self.send_response(200);self.send_header('Content-Type',mime+'; charset=utf-8');self.end_headers();self.wfile.write(raw)

    def do_POST(self):
        try:
            cookie=SimpleCookie(self.headers.get('Cookie',''))
            member=int(cookie['fixtureMember'].value)
            if self.headers.get('X-CSRF-TOKEN')!='fixture':
                self.send_error(403);return
            data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            op=self.path.rsplit('/',1)[-1]
            if 'business-documents' in self.path:
                result=handle(directory/'documents',member,op,data)
            elif 'business-payments' in self.path:
                result=payment_process(directory/'trade.sqlite',member,op,data)
            else:
                result=process(directory/'trade.sqlite',member,op,data)
        except Exception as exc:
            result={'error':str(exc)}
        raw=json.dumps(result,ensure_ascii=False).encode()
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(raw)


server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
print(server.server_port,flush=True)
try:
    server.serve_forever()
finally:
    server.server_close();temporary.cleanup()
