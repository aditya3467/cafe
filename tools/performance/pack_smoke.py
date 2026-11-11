import subprocess
for label,url,device in [('webp-before','http://127.0.0.1:8004/cafe/','desktop'),('packed-main','http://127.0.0.1:8000/','desktop'),('packed-main','http://127.0.0.1:8000/','mobile')]:
 subprocess.run(['node','tools/performance/profile.mjs',label,url,device,'cdn','cold'],check=True)
