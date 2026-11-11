from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote,urlsplit
ROOT=Path(__file__).resolve().parents[2]
SNAPSHOT=ROOT/'reports/performance/rollback'
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  relative=unquote(urlsplit(path).path).lstrip('/') or 'index.html'
  candidate=SNAPSHOT/relative
  if relative=='index.html' or relative.startswith(('js/','css/')):
   if candidate.is_file():return str(candidate)
  return str(ROOT/relative)
ThreadingHTTPServer(('127.0.0.1',8001),Handler).serve_forever()
