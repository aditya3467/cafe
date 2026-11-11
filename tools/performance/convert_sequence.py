"""Non-destructive derivative conversion. Run only after visual quality approval."""
from pathlib import Path
import argparse,subprocess,json,hashlib
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--approved-quality',required=True,type=int,choices=[80,85,90]);args=p.parse_args()
source=ROOT/'assets/derived/hero/frames-clean';out=ROOT/f'assets/derived/hero/frames-webp-q{args.approved_quality}'
out.mkdir(exist_ok=False)
def convert(n):
 name=f'frame_{n:06d}';src=source/(name+'.png');dest=out/(name+'.webp')
 subprocess.run(['cwebp','-quiet','-q',str(args.approved_quality),'-m','6','-sharp_yuv',str(src),'-o',str(dest)],check=True)
 return {'number':n,'file':dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=3) as pool:frames=list(pool.map(convert,range(1,240)))
manifest={'quality':args.approved_quality,'width':1280,'height':720,'count':239,'total_bytes':sum(f['bytes'] for f in frames),'frames':frames}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2));print('Converted:',manifest['count'],'frames;',manifest['total_bytes'],'bytes')
