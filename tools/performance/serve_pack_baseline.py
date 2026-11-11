from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[2]
BEFORE=ROOT/'reports/performance/pack-fix'
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  relative=unquote(urlsplit(path).path).removeprefix('/cafe/').lstrip('/') or 'index.html'
  if relative in ['js/frame-cache.js','js/frame-sequence.js','js/hero-animation.js']:
   return str(BEFORE/('before-'+Path(relative).name))
  return str(ROOT/relative)
ThreadingHTTPServer(('127.0.0.1',8004),Handler).serve_forever()
