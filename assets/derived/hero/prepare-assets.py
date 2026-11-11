from pathlib import Path
import cv2, numpy as np, json, hashlib
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[3]; out=root/'assets/derived/hero'; src=root/'Coffee_pouring_into_waffle_cup_0f483f6d_frames';out.mkdir(parents=True,exist_ok=True)
im=np.array(Image.open(src/'frame_000001.png').convert('RGB'));h,w=im.shape[:2]
# Hand-traced silhouette control points in original source registration.
points=[[449,222],[452,213],[462,205],[479,198],[505,191],[535,185],[568,181],[607,178],[649,176],[690,177],[731,181],[764,186],[792,193],[816,202],[836,212],[846,221],[848,232],[844,242],[842,256],[837,268],[832,282],[828,298],[824,314],[820,331],[815,349],[811,367],[806,386],[801,405],[796,424],[791,444],[786,463],[781,482],[777,500],[772,519],[767,532],[756,540],[742,545],[725,550],[706,553],[685,555],[663,557],[641,557],[618,555],[597,552],[578,548],[561,543],[548,538],[534,531],[525,522],[521,509],[517,494],[513,477],[509,459],[505,441],[501,423],[496,405],[492,386],[488,368],[484,350],[480,332],[476,314],[471,297],[467,280],[462,264],[456,248],[451,236]]
if (out/'cup-mask-control-points.json').exists(): points=json.loads((out/'cup-mask-control-points.json').read_text())['points']
(out/'cup-mask-control-points.json').write_text(json.dumps({'canvas':[w,h],'points':points,'method':'hand traced initialization; narrow-band GrabCut; 0.45px antialias'},indent=2))
rough=np.zeros((h,w),np.uint8);cv2.fillPoly(rough,[np.array(points,np.int32)],255)
k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9));inner=cv2.erode(rough,k);outer=cv2.dilate(rough,k)
gc=np.full((h,w),cv2.GC_BGD,np.uint8);gc[outer>0]=cv2.GC_PR_BGD;gc[rough>0]=cv2.GC_PR_FGD;gc[inner>0]=cv2.GC_FGD
cv2.grabCut(im,gc,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),5,cv2.GC_INIT_WITH_MASK)
mask=np.where((gc==cv2.GC_FGD)|(gc==cv2.GC_PR_FGD),255,0).astype(np.uint8)
alpha=cv2.GaussianBlur(mask,(3,3),.45);alpha[alpha<3]=0;alpha[alpha>252]=255
Image.fromarray(alpha).save(out/'cup-segmentation-mask.png');rgba=np.dstack([im,alpha]);rgba[alpha==0,:3]=0;Image.fromarray(rgba).save(out/'cup-empty-registered.png')
# Fixed star silhouette mask. Same source coordinates across the complete sequence.
star=np.zeros((h,w),np.uint8);cv2.fillPoly(star,[np.array([[1160,573],[1167,589],[1186,600],[1168,609],[1160,627],[1151,609],[1133,600],[1151,590]])],255);star=cv2.dilate(star,np.ones((3,3),np.uint8))
Image.fromarray(star).save(out/'gemini-removal-mask.png')
# Source-based smooth reconstruction: fit row-wise low order lighting surfaces
# using original unobstructed scene; retain source pixels outside repair zones.
clean=cv2.inpaint(im,star,4,cv2.INPAINT_TELEA)
remove=cv2.dilate(mask,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(35,35)))
cv2.ellipse(remove,(650,608),(236,48),0,0,360,255,-1)
# Quartic horizontal interpolation respects observed left/right glow, per row.
x=np.linspace(-1,1,w); fit=np.empty_like(im,dtype=np.float32)
for y in range(h):
 valid=remove[y]==0
 # Omit the logo from the lighting model.
 valid &= star[y]==0
 for ch in range(3):fit[y,:,ch]=np.polynomial.polynomial.polyval(x,np.polynomial.polynomial.polyfit(x[valid][::4],im[y,valid,ch][::4],4))
fit=cv2.GaussianBlur(fit,(0,0),2)
blend=cv2.GaussianBlur(remove.astype(np.float32)/255,(0,0),10)
# Fully replace all product pixels, feather only outside the repair mask.
blend=np.maximum(blend,(remove>0).astype(np.float32))
plate=np.clip(clean*(1-blend[:,:,None])+fit*blend[:,:,None],0,255).astype(np.uint8)
Image.fromarray(plate).save(out/'hero-background-plate.png')
Image.fromarray(remove).save(out/'background-reconstruction-mask.png')
a=alpha[:,:,None].astype(np.float32)/255
comp=lambda bg: np.clip(im*a+np.array(bg,dtype=np.float32)*(1-a),0,255).astype(np.uint8)
composite=comp(plate);Image.fromarray(composite).save(out/'hero-registered-composite.png')
colors=[(245,232,213),(199,145,86),(23,13,8)]
panels=[im,*[comp(np.full_like(im,c)) for c in colors],plate,composite]
labels=['A. Original frame 1','B. Cup on cream','C. Cup on caramel','D. Cup on espresso','E. Reconstructed plate (draft)','F. Registered composite (no detached shadow)']
sheet=Image.new('RGB',(2560,3*770),(23,13,8));d=ImageDraw.Draw(sheet)
for i,(p,label) in enumerate(zip(panels,labels)):
 xx=(i%2)*1280;yy=(i//2)*770;sheet.paste(Image.fromarray(p),(xx,yy+50));d.text((xx+20,yy+16),label,fill=(245,232,213))
sheet.save(out/'hero-asset-comparison.png')
# Pixel-level edge review, 200% nearest neighbor, preserves diagnostic edge pixels.
regions={'rim':(435,165,860,315),'waffle-left':(468,315,570,535),'waffle-base':(520,505,780,570)}
for name,box in regions.items():
 crops=[Image.fromarray(p).crop(box).resize(((box[2]-box[0])*2,(box[3]-box[1])*2),Image.Resampling.NEAREST) for p in [im,panels[1],panels[3],composite]]
 cw,ch=crops[0].size;review=Image.new('RGB',(cw*2,(ch+30)*2),(23,13,8));dr=ImageDraw.Draw(review)
 for j,crop in enumerate(crops):
  xx=j%2*cw;yy=j//2*(ch+30);review.paste(crop,(xx,yy+30));dr.text((xx+8,yy+8),['Original 200%','Cream 200%','Espresso 200%','Composite 200%'][j],fill='white')
 review.save(out/f'qc-{name}-200pct.png')
framesout=out/'frames-clean';framesout.mkdir(exist_ok=True)
for p in sorted(src.glob('*.png')):
 arr=np.array(Image.open(p).convert('RGB'));result=cv2.inpaint(arr,star,4,cv2.INPAINT_TELEA)
 Image.fromarray(result).save(framesout/p.name)
print('Created',len(list(framesout.glob('*.png'))),'cleaned frames',flush=True)
print('Cutout bounds',Image.fromarray(alpha).getbbox(),'opaque RGB exact:',bool(np.array_equal(rgba[:,:,:3][alpha==255],im[alpha==255])),flush=True)
