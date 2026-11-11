from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[2]
for device in ['desktop','mobile']:
 for network in ['normal','throttled']:
  for label,base in [('baseline','http://127.0.0.1:8002/cafe/'),('optimized','http://127.0.0.1:8003/cafe/')]:
   for repeat in ['cold','warm']:
    print(f'PROFILE {label} {device} {network} {repeat}',flush=True)
    subprocess.run(['node','tools/performance/profile.mjs',label,base,device,network,repeat],cwd=ROOT,check=True)
