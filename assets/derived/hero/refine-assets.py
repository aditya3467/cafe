from pathlib import Path
import numpy as np,cv2,json
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[3];out=root/'assets/derived/hero';src=root/'Coffee_pouring_into_waffle_cup_0f483f6d_frames'
im=np.array(Image.open(src/'frame_000001.png').convert('RGB'));h,w=im.shape[:2];alpha=np.array(Image.open(out/'cup-segmentation-mask.png'))
# Subpixel rim refinement: a smooth curve through reviewed source coordinates.
pts=np.array(json.loads((out/'cup-mask-control-points.json').read_text())['points'][:19]);xs=np.arange(449,849);curve=np.polynomial.polynomial.polyval((xs-649)/200,np.polynomial.polynomial.polyfit((pts[:,0]-649)/200,pts[:,1],6))
for x,top in zip(xs,curve):
 for y in range(165,229):alpha[y,x]=round(255*np.clip(y+.5-top,0,1))
Image.fromarray(alpha).save(out/'cup-segmentation-mask.png');rgba=np.dstack([im,alpha]);rgba[alpha==0,:3]=0;Image.fromarray(rgba).save(out/'cup-empty-registered.png')
star=np.array(Image.open(out/'gemini-removal-mask.png'));clean=cv2.inpaint(im,star,4,cv2.INPAINT_TELEA)
core=cv2.dilate((alpha>0).astype(np.uint8)*255,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))
cv2.ellipse(core,(650,622),(320,70),0,0,360,255,-1)
# Fit only to samples outside the reconstruction region and its blend surround.
region=cv2.dilate(core,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(61,61)))
x=np.linspace(-1,1,w);fit=np.empty_like(im,dtype=np.float32)
for y in range(h):
 valid=(region[y]==0)&(star[y]==0)
 for ch in range(3):fit[y,:,ch]=np.polynomial.polynomial.polyval(x,np.polynomial.polynomial.polyfit(x[valid][::4],im[y,valid,ch][::4],4))
# Fit the tabletop jointly in x/y so the removed shadow is not carried
# through every horizontal row as a dark interpolation band.
yy,xx=np.mgrid[500:h:4,0:w:4];vx=(xx.ravel()-640)/640;vy=(yy.ravel()-610)/110
ok=(core[yy,xx].ravel()==0)&~((yy.ravel()>550)&(yy.ravel()<695)&(xx.ravel()>180)&(xx.ravel()<1120))
terms=[(i,j) for i in range(5) for j in range(5-i)]
mat=np.array([vx**i*vy**j for i,j in terms]).T
yall,xall=np.mgrid[500:h,0:w];xa=(xall-640)/640;ya=(yall-610)/110
for ch in range(3):
 coeff=np.linalg.lstsq(mat[ok],im[yy,xx,ch].ravel()[ok],rcond=None)[0]
 fit[500:,:,ch]=sum(c*xa**i*ya**j for c,(i,j) in zip(coeff,terms))
fit=cv2.GaussianBlur(fit,(0,0),2)
dist=cv2.distanceTransform(255-core,cv2.DIST_L2,5);t=np.clip(1-dist/35,0,1);blend=t*t*(3-2*t)
vertical=np.clip((np.arange(h)-500)/45,0,1);vertical=vertical*vertical*(3-2*vertical);blend=np.maximum(blend,vertical[:,None])
plate=np.clip(clean*(1-blend[:,:,None])+fit*blend[:,:,None],0,255).astype(np.uint8)
Image.fromarray(plate).save(out/'hero-background-plate.png');Image.fromarray(core).save(out/'background-reconstruction-mask.png')
a=alpha[:,:,None].astype(np.float32)/255
comp=lambda bg:np.clip(im*a+np.array(bg,dtype=np.float32)*(1-a),0,255).astype(np.uint8)
composite=comp(plate);Image.fromarray(composite).save(out/'hero-registered-composite.png')
panels=[im,*[comp(np.full_like(im,c)) for c in [(245,232,213),(199,145,86),(23,13,8)]],plate,composite]
labels=['A. Original frame 1','B. Cup on cream','C. Cup on caramel','D. Cup on espresso','E. Reconstructed plate (review candidate)','F. Registered composite (detached shadow removed)']
sheet=Image.new('RGB',(2560,2310),(23,13,8));d=ImageDraw.Draw(sheet)
for i,(p,label) in enumerate(zip(panels,labels)):
 xx=i%2*1280;yy=i//2*770;sheet.paste(Image.fromarray(p),(xx,yy+50));d.text((xx+20,yy+16),label,fill=(245,232,213))
sheet.save(out/'hero-asset-comparison.png')
for name,box in {'rim':(435,165,860,315),'waffle-left':(468,315,570,535),'waffle-base':(520,505,780,570)}.items():
 crops=[Image.fromarray(p).crop(box).resize(((box[2]-box[0])*2,(box[3]-box[1])*2),Image.Resampling.NEAREST) for p in [im,panels[1],panels[3],composite]];cw,ch=crops[0].size;review=Image.new('RGB',(cw*2,(ch+30)*2),(23,13,8));dr=ImageDraw.Draw(review)
 for j,crop in enumerate(crops):
  xx=j%2*cw;yy=j//2*(ch+30);review.paste(crop,(xx,yy+30));dr.text((xx+8,yy+8),['Original 200%','Cream 200%','Espresso 200%','Composite 200%'][j],fill='white')
 review.save(out/f'qc-{name}-200pct.png')
print('Refined derivatives saved.')
