"""Serve the deployed snapshot, optionally overlaying only the performance fix."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote,urlsplit
import argparse
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--candidate',action='store_true');args=parser.parse_args()
SNAPSHOT=ROOT/'reports/performance/live-snapshot'
OVERLAY={'js/frame-cache.js','js/frame-sequence.js','js/hero-animation.js'}
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  requested=unquote(urlsplit(path).path)
  if requested.startswith('/cafe/'):requested=requested[6:]
  relative=requested.lstrip('/') or 'index.html'
  if args.candidate and relative in OVERLAY:return str(ROOT/relative)
  candidate=SNAPSHOT/relative
  if candidate.is_file():return str(candidate)
  return str(ROOT/relative)
ThreadingHTTPServer(('127.0.0.1',8003 if args.candidate else 8002),Handler).serve_forever()
