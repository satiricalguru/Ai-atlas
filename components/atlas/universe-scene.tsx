'use client';
import {Canvas,useFrame} from '@react-three/fiber';
import {createContext,useContext,useMemo,useRef,type RefObject} from 'react';
import * as THREE from 'three';
import type {MotionValue} from 'motion/react';

export type ChipRefs=RefObject<Record<string,HTMLDivElement|null>>;
const ChipCtx=createContext<ChipRefs|null>(null);
const Ctx=createContext<{chips:ChipRefs|null;shared:RefObject<{chipAlpha:number}>;stage:RefObject<THREE.Group|null>}|null>(null);
export const orbits=[
 {radius:1.42,tilt:[1.32,.1,-.3] as const,speed:.16,ids:['chatgpt','claude','gemini','deepseek']},
 {radius:1.76,tilt:[1.18,-.38,.24] as const,speed:-.11,ids:['kimi','cursor','perplexity','grok']},
 {radius:2.1,tilt:[1.45,.26,-.08] as const,speed:.075,ids:['copilot','mistral','meta','qwen']},
];

const noise=`vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*snoise(p);p*=1.9;a*=.45;}return s;}`;
const particleVertex=`uniform float uTime;uniform float uSwirl;uniform float uMorph;uniform float uBreath;uniform float uPixelRatio;uniform float uSize;uniform float uOpacity;uniform float uMouseStrength;uniform vec3 uMouse;
attribute vec3 aTarget;attribute vec4 aRandom;varying float vAlpha;${noise}
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
void main(){vec3 p=position;float lat=clamp(p.y,-1.,1.);
 p.xz=rot(uSwirl*(lat*3.4)+uSwirl*uTime*.42*(1.25-abs(lat)))*p.xz;
 p*=1.+uSwirl*.075*sin(lat*15.-uTime*1.7);
 vec3 q=p*1.6+vec3(uTime*.11);
 p+=vec3(snoise(q),snoise(q+17.1),snoise(q+31.7))*(uBreath+uSwirl*.055);
 vec3 d=p-uMouse;float dist=length(d);
 p+=normalize(d+vec3(1e-4))*uMouseStrength*pow(smoothstep(.62,0.,dist),2.)*.3;
 vec3 g=aTarget;float gr=length(g.xz);
 g.xz=rot(uTime*(.05+.07/(gr+.5)))*g.xz;
 g.yz=rot(-1.08)*g.yz;
 float m=smoothstep(aRandom.z*.45,aRandom.z*.45+.55,uMorph);m=m*m*(3.-2.*m);
 vec3 dir=normalize(p+vec3(1e-4));
 p=mix(p,g,m)+dir*sin(m*3.14159)*(.25+.45*aRandom.y);
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
 vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);float scale=length((modelViewMatrix*vec4(1.,0.,0.,0.)).xyz);
 float facing=clamp((mv.z-c.z)/scale*.5+.5,0.,1.);
 float twinkle=.72+.28*sin(uTime*(.8+aRandom.y*2.2)+aRandom.y*60.);
 vAlpha=mix(.38,.78,mix(facing,.8,m))*twinkle*uOpacity*(aRandom.w>.5?.55:1.);
 gl_PointSize=uSize*aRandom.x*uPixelRatio/-mv.z;}`;
const particleFragment=`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.08,d);gl_FragColor=vec4(vec3(1.),a*vAlpha);}`;

const ringVertex=`uniform float uPixelRatio;uniform float uTime;attribute float aSeed;varying float vSeed;void main(){vSeed=aSeed;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=1.7*uPixelRatio;}`;
const ringFragment=`uniform float uAlpha;uniform float uTime;varying float vSeed;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);float pulse=.45+.55*smoothstep(.85,1.,sin(vSeed*6.2831*3.-uTime*.9));gl_FragColor=vec4(vec3(1.),a*uAlpha*pulse);}`;

const starVertex=`attribute float aScale;attribute float aSeed;uniform float uTime;uniform float uPixelRatio;varying float vTwinkle;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;vTwinkle=.35+.65*sin(uTime*(.5+aSeed*1.4)+aSeed*40.);gl_PointSize=aScale*uPixelRatio*(18./-mv.z);}`;
const starFragment=`uniform float uAlpha;varying float vTwinkle;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;gl_FragColor=vec4(vec3(1.),a*vTwinkle*uAlpha);}`;

function rng(seed:number){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

function particleGeometry(count:number){
 const rand=rng(11);const gauss=()=>Math.sqrt(-2*Math.log(rand()+1e-9))*Math.cos(Math.PI*2*rand());
 const pos=new Float32Array(count*3),target=new Float32Array(count*3),rnd=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  let x:number,y:number,z:number;
  if(rand()<.6){const lat=(rand()*2-1)*Math.PI/2,lon=rand()*Math.PI*2;y=Math.sin(lat);const c=Math.cos(lat);x=c*Math.cos(lon);z=c*Math.sin(lon);}
  else{y=rand()*2-1;const c=Math.sqrt(1-y*y),lon=rand()*Math.PI*2;x=c*Math.cos(lon);z=c*Math.sin(lon);}
  x+=gauss()*.012;y+=gauss()*.012;z+=gauss()*.012;const len=Math.hypot(x,y,z);
  const dust=rand()<.055;const r=dust?1.05+Math.pow(rand(),2)*.7:1+gauss()*.026;
  pos[i*3]=x/len*r;pos[i*3+1]=y/len*r;pos[i*3+2]=z/len*r;
  let tx:number,ty:number,tz:number;
  if(rand()<.14){const br=Math.abs(gauss())*.22;const th=rand()*Math.PI*2,ph=Math.acos(2*rand()-1);tx=br*Math.sin(ph)*Math.cos(th);ty=br*Math.cos(ph)*.55;tz=br*Math.sin(ph)*Math.sin(th);}
  else{const arm=Math.floor(rand()*3);const gr=.08+Math.pow(rand(),1.5)*2.45;const a=arm/3*Math.PI*2+gr*2.15+gauss()*(.1+.16/(gr+.4));const sc=.05+gr*.055;
   tx=Math.cos(a)*gr+gauss()*sc;tz=Math.sin(a)*gr+gauss()*sc;ty=gauss()*.045*(1.4-gr/2.5);}
  target[i*3]=tx;target[i*3+1]=ty;target[i*3+2]=tz;
  rnd[i*4]=.55+Math.pow(rand(),3.2)*2.1;rnd[i*4+1]=rand();rnd[i*4+2]=rand();rnd[i*4+3]=dust?1:0;
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aTarget',new THREE.BufferAttribute(target,3));g.setAttribute('aRandom',new THREE.BufferAttribute(rnd,4));
 g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),4);return g;
}
function ringGeometry(radius:number,count:number){const pos=new Float32Array(count*3),seed=new Float32Array(count);for(let i=0;i<count;i++){const a=i/count*Math.PI*2;pos[i*3]=Math.cos(a)*radius;pos[i*3+1]=Math.sin(a)*radius;seed[i]=i/count;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));return g;}
function starGeometry(count:number){const rand=rng(7);const pos=new Float32Array(count*3),scale=new Float32Array(count),seeds=new Float32Array(count);
 for(let i=0;i<count;i++){const r=6+Math.pow(rand(),.7)*10;const th=rand()*Math.PI*2;const ph=Math.acos(2*rand()-1);pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*.65;pos[i*3+2]=r*Math.cos(ph)-6;scale[i]=.5+Math.pow(rand(),4)*2.6;seeds[i]=rand();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aScale',new THREE.BufferAttribute(scale,1));g.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));return g;}

const uniformsOf=(o:THREE.Points|null)=>(o?.material as THREE.ShaderMaterial|undefined)?.uniforms;
const clamp01=(v:number)=>Math.min(1,Math.max(0,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};

function Stars({count}:{count:number}){
 const ref=useRef<THREE.Points>(null);const geometry=useMemo(()=>starGeometry(count),[count]);
 const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader:starVertex,fragmentShader:starFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixelRatio:{value:1},uAlpha:{value:.6}}}),[]);
 useFrame(({clock,gl},dt)=>{const u=uniformsOf(ref.current);if(u){u.uTime.value=clock.elapsedTime;u.uPixelRatio.value=gl.getPixelRatio();}if(ref.current)ref.current.rotation.y+=Math.min(dt,.05)*.008;});
 return <points ref={ref} geometry={geometry} material={material}/>;
}

const world=new THREE.Vector3(),view=new THREE.Vector3(),center=new THREE.Vector3(),screen=new THREE.Vector3();
function Satellite({id,angle,radius}:{id:string;angle:number;radius:number}){
 const group=useRef<THREE.Group>(null);const chip=useRef<HTMLDivElement|null>(null);const ctx=useContext(Ctx);
 useFrame(({camera,size})=>{chip.current=ctx?.chips?.current?.[id]??null;const stage=ctx?.stage.current;if(!group.current||!chip.current||!stage||!ctx)return;const el=chip.current;const alpha=ctx.shared.current.chipAlpha;
  if(alpha<.01){el.style.visibility='hidden';return;}el.style.visibility='visible';
  group.current.getWorldPosition(world);view.copy(world).applyMatrix4(camera.matrixWorldInverse);center.setFromMatrixPosition(stage.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
  const R=stage.scale.x;const dz=(view.z-center.z)/(radius*R);const depth=clamp01(dz*.5+.5);const hidden=dz<0&&Math.hypot(view.x-center.x,view.y-center.y)<R*.97;
  screen.copy(world).project(camera);const x=(screen.x*.5+.5)*size.width,y=(-screen.y*.5+.5)*size.height;
  el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${(.74+depth*.3).toFixed(3)})`;
  el.style.opacity=String(alpha*(hidden?.1:.3+depth*.7));el.style.zIndex=String(Math.round(depth*100));
  el.style.filter=!hidden&&depth<.35?`blur(${((.35-depth)*4).toFixed(2)}px)`:'none';});
 return <group ref={group} position={[Math.cos(angle)*radius,Math.sin(angle)*radius,0]}/>;
}

function Orbit({radius,tilt,speed,ids,index,compact}:{radius:number;tilt:readonly [number,number,number];speed:number;ids:string[];index:number;compact:boolean}){
 const spin=useRef<THREE.Group>(null);const ring=useRef<THREE.Points>(null);const ctx=useContext(Ctx);
 const geometry=useMemo(()=>ringGeometry(radius,compact?260:520),[radius,compact]);
 const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader:ringVertex,fragmentShader:ringFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uAlpha:{value:0},uTime:{value:0},uPixelRatio:{value:1}}}),[]);
 useFrame(({clock,gl},dt)=>{if(spin.current)spin.current.rotation.z+=Math.min(dt,.05)*speed;const u=uniformsOf(ring.current);if(u&&ctx){u.uAlpha.value=ctx.shared.current.chipAlpha*(.42-index*.08);u.uTime.value=clock.elapsedTime+index*2;u.uPixelRatio.value=gl.getPixelRatio();}});
 return <group rotation={tilt as unknown as [number,number,number]}>
  <points ref={ring} geometry={geometry} material={material}/>
  <group ref={spin} rotation={[0,0,index*1.1]}>{ids.map((id,i)=><Satellite key={id} id={id} radius={radius} angle={i/ids.length*Math.PI*2}/>)}</group>
 </group>;
}

const ray=new THREE.Ray(),hit=new THREE.Vector3(),inverse=new THREE.Matrix4(),unit=new THREE.Sphere(new THREE.Vector3(),1.08),raycaster=new THREE.Raycaster();
function Globe({compact,progress}:{compact:boolean;progress?:MotionValue<number>}){
 const stage=useRef<THREE.Group>(null);const spin=useRef<THREE.Group>(null);const points=useRef<THREE.Points>(null);const intro=useRef(0);const mouse=useRef({strength:0,x:0,y:0,z:0});
 const shared=useRef({chipAlpha:0});const chips=useContext(ChipCtx);
 const geometry=useMemo(()=>particleGeometry(compact?11000:26000),[compact]);
 const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uSwirl:{value:0},uMorph:{value:0},uBreath:{value:.018},uPixelRatio:{value:1},uSize:{value:compact?22:17},uOpacity:{value:0},uMouseStrength:{value:0},uMouse:{value:new THREE.Vector3(9,9,9)}}}),[compact]);
 const ctx=useMemo(()=>({chips,shared,stage}),[chips]);
 useFrame(({camera,size,pointer,clock,gl},delta)=>{
  const dt=Math.min(delta,.05);const p=clamp01(progress?.get()??0);const t=clock.elapsedTime;
  intro.current=Math.min(1,intro.current+dt*.45);const e=1-Math.pow(1-intro.current,4);
  const cam=camera as THREE.PerspectiveCamera;const h=Math.tan(THREE.MathUtils.degToRad(cam.fov/2))*cam.position.z;const aspect=size.width/size.height;
  const k=smooth(0,.2,p);const heroY=(.5-(compact?.8:.7))*2*h;const heroR=Math.min(.19*2*h,.36*2*h*aspect);const midR=Math.min(.3*2*h,.33*2*h*aspect);
  const swirl=smooth(.36,.6,p),morph=smooth(.56,.84,p);
  shared.current.chipAlpha=smooth(.04,.12,p)*(1-smooth(.36,.45,p))*e;
  if(stage.current){stage.current.position.y=THREE.MathUtils.damp(stage.current.position.y,THREE.MathUtils.lerp(heroY,0,k),6,dt);stage.current.scale.setScalar(THREE.MathUtils.damp(stage.current.scale.x,THREE.MathUtils.lerp(heroR,midR,k)*(.82+.18*e)*(1-morph*(compact?.42:.08)),6,dt));
   stage.current.rotation.x=THREE.MathUtils.damp(stage.current.rotation.x,(-pointer.y*.14+.18)*(1-morph),2.5,dt);stage.current.rotation.z=THREE.MathUtils.damp(stage.current.rotation.z,pointer.x*-.05*(1-morph),2.5,dt);}
  if(spin.current)spin.current.rotation.y+=dt*(.1+swirl*.08)*(1-morph*.85)+pointer.x*dt*.04;
  if(points.current&&spin.current){raycaster.setFromCamera(pointer,camera);inverse.copy(spin.current.matrixWorld).invert();ray.copy(raycaster.ray).applyMatrix4(inverse);
   const onGlobe=ray.intersectSphere(unit,hit)!==null&&morph<.5;const m=mouse.current;if(onGlobe){m.x=hit.x;m.y=hit.y;m.z=hit.z;}m.strength=THREE.MathUtils.damp(m.strength,onGlobe?1:0,5,dt);
   const u=uniformsOf(points.current);if(u){u.uTime.value=t;u.uSwirl.value=swirl;u.uMorph.value=morph;u.uPixelRatio.value=gl.getPixelRatio();u.uOpacity.value=e*(.58+morph*.14)*(1-smooth(.9,1,p)*.85);u.uMouseStrength.value=m.strength;(u.uMouse.value as THREE.Vector3).set(m.x,m.y,m.z);}}
  cam.position.z=THREE.MathUtils.damp(cam.position.z,10-morph*1.2,3,dt);
 });
 return <Ctx.Provider value={ctx}><group ref={stage}>
  <group ref={spin}><points ref={points} geometry={geometry} material={material}/></group>
  {orbits.map((o,i)=><Orbit key={i} index={i} {...o} compact={compact}/>)}
 </group></Ctx.Provider>;
}

export default function UniverseScene({active=true,compact=false,progress,chips}:{active?:boolean;compact?:boolean;progress?:MotionValue<number>;chips?:ChipRefs}){
 return <Canvas dpr={[1,compact?1.6:2]} frameloop={active?'always':'never'} camera={{position:[0,0,10],fov:35}} gl={{alpha:true,antialias:false,powerPreference:'high-performance'}} eventSource={typeof document==='undefined'?undefined:document.documentElement} eventPrefix="client" style={{position:'absolute',inset:0}}>
  <Stars count={compact?400:900}/>
  <ChipCtx.Provider value={chips??null}><Globe compact={compact} progress={progress}/></ChipCtx.Provider>
 </Canvas>;
}
