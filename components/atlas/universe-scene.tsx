'use client';
import {Canvas,useFrame} from '@react-three/fiber';
import {Environment,Lightformer} from '@react-three/drei';
import {createContext,useContext,useMemo,useRef,type RefObject} from 'react';
import * as THREE from 'three';
import type {MotionValue} from 'motion/react';

export type ChipRefs=RefObject<Record<string,HTMLDivElement|null>>;
const Chips=createContext<ChipRefs|null>(null);
export const orbits=[
 {radius:2.45,tilt:[1.3,.08,-.34] as const,speed:.11,ids:['chatgpt','claude','gemini','deepseek']},
 {radius:3.1,tilt:[1.2,-.36,.26] as const,speed:-.075,ids:['kimi','cursor','perplexity','grok']},
 {radius:3.8,tilt:[1.42,.24,-.1] as const,speed:.05,ids:['copilot','mistral','meta','qwen']},
];

const noise=`vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*snoise(p);p*=1.9;a*=.45;}return s;}`;

const coreVertex=`uniform float uTime;varying vec3 vNormal;varying vec3 vView;varying vec3 vPos;${noise}
void main(){vec3 p=position;float n=snoise(normal*1.3+vec3(uTime*.16));p+=normal*n*.045;vec4 mv=modelViewMatrix*vec4(p,1.);vNormal=normalize(normalMatrix*normal);vView=-mv.xyz;vPos=position;gl_Position=projectionMatrix*mv;}`;
const coreFragment=`uniform float uTime;uniform float uEnergy;varying vec3 vNormal;varying vec3 vView;varying vec3 vPos;${noise}
void main(){vec3 n=normalize(vNormal);vec3 v=normalize(vView);float t=uTime*.06;vec3 q=vPos*.42;
 vec3 w=vec3(fbm(q+vec3(t)),fbm(q+vec3(5.2,1.3,2.8)-t),fbm(q+vec3(1.7,9.2,3.1)+t*.6));
 float f=fbm(q+w*1.2);
 vec3 pn=normalize(n+w*.17);
 float facing=max(dot(n,v),0.);float fres=pow(1.-facing,2.4);
 vec3 r=reflect(-v,pn);
 float sky=smoothstep(-.35,.95,r.y);
 float softbox=smoothstep(.55,.9,r.y)*smoothstep(.75,.2,abs(r.x+.25));
 float stripL=smoothstep(.72,.95,-r.x)*smoothstep(.9,.2,abs(r.y));
 float stripR=smoothstep(.82,.98,r.x)*smoothstep(.9,.3,abs(r.y))*.55;
 float floorBounce=smoothstep(-.4,-.95,r.y)*.22;
 vec3 env=vec3(.018,.018,.024)+vec3(.30,.31,.35)*sky+vec3(1.)*softbox*.95+vec3(.92,.94,1.)*(stripL*.75+stripR)+vec3(.45,.55,.95)*floorBounce;
 float bands=.5+.5*sin(f*8.5+t*3.);
 vec3 base=mix(vec3(.02,.02,.026),vec3(.36,.37,.42),pow(bands,5.)*.4);
 vec3 irid=.55+.45*cos(6.2831*(vec3(0.,.33,.67)+f*1.2+fres*1.4+t*.8));
 vec3 col=base*.5+env*.8;
 col=mix(col,col*irid*1.6,clamp(fres*.8,0.,1.)*(.6+.4*uEnergy));
 vec3 L=normalize(vec3(-.55,.8,.75));float spec=pow(max(dot(reflect(-L,pn),v),0.),60.);col+=spec*1.1;
 col+=pow(fres,1.6)*vec3(.6,.68,.95)*.55;
 col*=.82+.18*uEnergy;
 gl_FragColor=vec4(col,1.);}`;

const haloVertex=`varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const haloFragment=`uniform vec3 uColor;uniform float uIntensity;varying vec3 vNormal;void main(){float i=pow(abs(vNormal.z),2.6)*uIntensity;gl_FragColor=vec4(uColor*i,i);}`;

const bandVertex=`varying vec2 vPos;void main(){vPos=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const bandFragment=`uniform float uInner;uniform float uOuter;uniform float uTime;varying vec2 vPos;
float hash(float n){return fract(sin(n)*43758.5453);}
void main(){float r=length(vPos);float t=(r-uInner)/(uOuter-uInner);
 float lanes=.55+.45*sin(t*95.+sin(t*13.)*2.);float grain=hash(floor(t*260.));
 float edge=smoothstep(0.,.12,t)*smoothstep(1.,.7,t);
 float a=edge*(.05+.11*lanes*grain);
 float ang=atan(vPos.y,vPos.x);float sheen=.5+.5*sin(ang*1.+uTime*.25);
 gl_FragColor=vec4(vec3(.86,.88,.95)*(.6+.6*sheen),a);}`;

const starVertex=`attribute float aScale;attribute float aSeed;uniform float uTime;uniform float uPixelRatio;varying float vTwinkle;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
 vTwinkle=.45+.55*sin(uTime*(.6+aSeed*1.6)+aSeed*40.);
 gl_PointSize=aScale*uPixelRatio*(26./-mv.z);}`;
const starFragment=`varying float vTwinkle;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;gl_FragColor=vec4(vec3(1.),a*vTwinkle*.8);}`;

function starGeometry(count:number){let seed=7;const rand=()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
 const g=new THREE.BufferGeometry();const pos=new Float32Array(count*3),scale=new Float32Array(count),seeds=new Float32Array(count);
 for(let i=0;i<count;i++){const r=4.5+Math.pow(rand(),.7)*9;const th=rand()*Math.PI*2;const ph=Math.acos(2*rand()-1);
  pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*.6;pos[i*3+2]=r*Math.cos(ph)-3;
  scale[i]=.6+Math.pow(rand(),4)*3.2;seeds[i]=rand();}
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aScale',new THREE.BufferAttribute(scale,1));g.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));return g;}
const uniformsOf=(mesh:THREE.Mesh|THREE.Points|null)=>(mesh?.material as THREE.ShaderMaterial|undefined)?.uniforms;

function Stars({count}:{count:number}){
 const ref=useRef<THREE.Points>(null);
 const geometry=useMemo(()=>starGeometry(count),[count]);
 const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader:starVertex,fragmentShader:starFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixelRatio:{value:1}}}),[]);
 useFrame(({clock,gl},dt)=>{const u=uniformsOf(ref.current);if(u){u.uTime.value=clock.elapsedTime;u.uPixelRatio.value=gl.getPixelRatio();}if(ref.current)ref.current.rotation.y+=Math.min(dt,.05)*.012;});
 return <points ref={ref} geometry={geometry} material={material}/>;
}

const world=new THREE.Vector3(),screen=new THREE.Vector3();
function Satellite({id,angle,radius}:{id:string;angle:number;radius:number}){
 const group=useRef<THREE.Group>(null);const chip=useRef<HTMLDivElement|null>(null);const chips=useContext(Chips);
 useFrame(({camera,size})=>{chip.current=chips?.current?.[id]??null;if(!group.current||!chip.current)return;const el=chip.current;group.current.getWorldPosition(world);
  const depth=THREE.MathUtils.clamp((world.z+radius)/(radius*2),0,1);screen.copy(world).project(camera);
  const x=(screen.x*.5+.5)*size.width,y=(-screen.y*.5+.5)*size.height;
  el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${(.72+depth*.34).toFixed(3)})`;
  const hidden=world.z<0&&Math.hypot(world.x,world.y)<1.55;el.style.opacity=String(hidden?.06:.28+depth*.72);el.style.zIndex=String(Math.round(depth*100));
  el.style.filter=depth<.35?`blur(${((.35-depth)*4).toFixed(2)}px)`:'none';});
 return <group ref={group} position={[Math.cos(angle)*radius,Math.sin(angle)*radius,0]}><mesh><sphereGeometry args={[.035,16,16]}/><meshStandardMaterial color="#ffffff" metalness={1} roughness={.15}/></mesh></group>;
}

function Orbit({radius,tilt,speed,ids,compact,index}:{radius:number;tilt:readonly [number,number,number];speed:number;ids:string[];compact:boolean;index:number}){
 const spin=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(spin.current)spin.current.rotation.z+=Math.min(dt,.05)*speed;});
 return <group rotation={tilt as unknown as [number,number,number]}>
  <mesh><torusGeometry args={[radius,.0045,8,compact?180:320]}/><meshStandardMaterial color="#d8d8d8" metalness={1} roughness={.22} transparent opacity={.55-index*.1}/></mesh>
  <group ref={spin} rotation={[0,0,index*1.1]}>{ids.map((id,i)=><Satellite key={id} id={id} radius={radius} angle={i/ids.length*Math.PI*2}/>)}</group>
 </group>;
}

function Sculpture({compact,progress}:{compact:boolean;progress?:MotionValue<number>}){
 const rig=useRef<THREE.Group>(null);const core=useRef<THREE.Group>(null);const system=useRef<THREE.Group>(null);const coreMesh=useRef<THREE.Mesh>(null);const bandMesh=useRef<THREE.Mesh>(null);const intro=useRef(0);
 const halo=useMemo(()=>new THREE.ShaderMaterial({vertexShader:haloVertex,fragmentShader:haloFragment,uniforms:{uColor:{value:new THREE.Color('#b9c7ff')},uIntensity:{value:.5}},side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),[]);
 const coreMaterial=useMemo(()=>new THREE.ShaderMaterial({vertexShader:coreVertex,fragmentShader:coreFragment,uniforms:{uTime:{value:0},uEnergy:{value:1}}}),[]);
 const band=useMemo(()=>new THREE.ShaderMaterial({vertexShader:bandVertex,fragmentShader:bandFragment,uniforms:{uInner:{value:1.85},uOuter:{value:2.25},uTime:{value:0}},side:THREE.DoubleSide,transparent:true,depthWrite:false}),[]);
 useFrame(({pointer,camera,clock},delta)=>{
  const dt=Math.min(delta,.05);const p=progress?.get()??0;
  intro.current=Math.min(1,intro.current+dt*.55);const e=1-Math.pow(1-intro.current,4);
  const bandU=uniformsOf(bandMesh.current),coreU=uniformsOf(coreMesh.current);if(bandU)bandU.uTime.value=clock.elapsedTime;if(coreU){coreU.uTime.value=clock.elapsedTime;coreU.uEnergy.value=.85+p*.6;}
  if(rig.current){rig.current.rotation.y=THREE.MathUtils.damp(rig.current.rotation.y,pointer.x*.22+p*.6,2.4,dt);rig.current.rotation.x=THREE.MathUtils.damp(rig.current.rotation.x,-pointer.y*.12+p*.25,2.4,dt);rig.current.position.y=Math.sin(clock.elapsedTime*.4)*.05;}
  if(core.current){const s=(.55+.45*e)*(1+p*.25);core.current.scale.setScalar(s);core.current.rotation.y+=dt*.08;}
  if(system.current){const s=(.7+.3*e)*(1+p*.35);system.current.scale.setScalar(s);system.current.rotation.z=THREE.MathUtils.damp(system.current.rotation.z,p*-.4,3,dt);}
  camera.position.z=THREE.MathUtils.damp(camera.position.z,(compact?14.5:13)-p*2,3,dt);
 });
 return <group ref={rig}>
  <group ref={core}>
   <mesh ref={coreMesh} material={coreMaterial}><sphereGeometry args={[1.42,compact?96:160,compact?96:160]}/></mesh>
   <mesh scale={1.36} material={halo}><sphereGeometry args={[1.42,64,64]}/></mesh>
   <mesh ref={bandMesh} rotation={[1.3,.08,-.34]} material={band}><ringGeometry args={[1.85,2.25,compact?128:256,1]}/></mesh>
  </group>
  <group ref={system}>{orbits.map((o,i)=><Orbit key={i} index={i} {...o} compact={compact}/>)}</group>
 </group>;
}

export default function UniverseScene({active=true,compact=false,progress,chips}:{active?:boolean;compact?:boolean;progress?:MotionValue<number>;chips?:ChipRefs}){
 return <Canvas dpr={[1,compact?1.5:2]} frameloop={active?'always':'never'} camera={{position:[0,0,compact?14.5:13],fov:35}} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} style={{position:'absolute',inset:0}}>
  <Environment resolution={512} frames={1}>
   <color attach="background" args={['#0c0c10']}/>
   <Lightformer form="rect" intensity={3.4} position={[-1,6,1]} scale={[6,2,1]} rotation-x={Math.PI/2}/>
   <Lightformer form="rect" intensity={2.6} position={[-6,1,1]} scale={[2.2,10,1]} rotation-y={Math.PI/2}/>
   <Lightformer form="rect" intensity={1.8} position={[6,0,-1]} scale={[1.4,10,1]} rotation-y={-Math.PI/2}/>
   <Lightformer form="rect" intensity={1.2} position={[0,1,-6]} scale={[10,1.2,1]}/>
   <Lightformer form="rect" intensity={1.4} color="#a8bcff" position={[0,-6,1]} scale={[12,3,1]} rotation-x={-Math.PI/2}/>
   <Lightformer form="circle" intensity={1.1} color="#ffd6bf" position={[-4,-2,5]} scale={2}/>
   <Lightformer form="rect" intensity={.8} position={[3,3,6]} scale={[3,.4,1]}/>
  </Environment>
  <ambientLight intensity={.15}/>
  <Stars count={compact?650:1500}/>
  <Chips.Provider value={chips??null}><Sculpture compact={compact} progress={progress}/></Chips.Provider>
 </Canvas>;
}
