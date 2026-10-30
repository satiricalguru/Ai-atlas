'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, AdaptiveDpr } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Core({compact}:{compact:boolean}) {
  const group=useRef<THREE.Group>(null);const points=useRef<THREE.Points>(null);
  const positions=useMemo(()=>{
    const n=compact?1200:2700; const out=new Float32Array(n*3); const golden=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<n;i++){const y=1-(i/(n-1))*2;const r=Math.sqrt(1-y*y);const theta=golden*i;out[i*3]=Math.cos(theta)*r*2.05;out[i*3+1]=y*2.05;out[i*3+2]=Math.sin(theta)*r*2.05;}
    return out;
  },[compact]);
  const orbits=useMemo(()=>Array.from({length:4},(_,j)=>Array.from({length:161},(_,i)=>{const t=i/160*Math.PI*2;return new THREE.Vector3(Math.cos(t)*(2.6+j*.18),Math.sin(t)*(2.6+j*.18),0);})),[]);
  useFrame((state,delta)=>{
    const t=state.clock.elapsedTime;
    if(group.current){group.current.rotation.y+=Math.min(delta,.05)*.055;group.current.rotation.x=THREE.MathUtils.lerp(group.current.rotation.x,state.pointer.y*.09+.25,.025); group.current.rotation.z=THREE.MathUtils.lerp(group.current.rotation.z,state.pointer.x*.045-.22,.025);}
    if(points.current)points.current.rotation.y=-t*.025;
  });
  return <group ref={group}>
    <mesh><sphereGeometry args={[2.025,48,32]}/><meshBasicMaterial color="#101a0f" transparent opacity={.86}/></mesh>
    <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} uniforms={{uColor:{value:new THREE.Color('#c5ed88')}}} vertexShader={`varying float vDepth; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vDepth=clamp((position.z+2.05)/4.1,.15,1.);gl_PointSize=1.35*(7.0/-p.z);gl_Position=projectionMatrix*p;}`} fragmentShader={`uniform vec3 uColor;varying float vDepth;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(uColor,(.22+vDepth*.65)*(1.-d));}`}/></points>
    <mesh rotation={[0,0,.25]}><sphereGeometry args={[2.075,28,18]}/><meshBasicMaterial color="#75934d" wireframe transparent opacity={.13}/></mesh>
    {orbits.map((points,i)=><group key={i} rotation={[Math.PI*.34+i*.43,i*.6,.22+i*.28]}><Line points={points} color={i===0?'#dcff8e':'#819367'} lineWidth={i===0?.8:.45} transparent opacity={i===0?.65:.32}/><mesh position={points[(i*39+21)%160]}><sphereGeometry args={[.045,12,12]}/><meshBasicMaterial color="#deff9a"/></mesh></group>)}
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.1,.006,6,100]}/><meshBasicMaterial color="#a7c778" transparent opacity={.65}/></mesh>
  </group>;
}
export default function UniverseScene({active=true,compact=false}:{active?:boolean;compact?:boolean}) {
  return <Canvas dpr={[1,compact?1.2:1.6]} frameloop={active?'always':'never'} camera={{position:[0,0,8.4],fov:47}} gl={{alpha:true,antialias:!compact,powerPreference:'low-power'}} style={{position:'absolute',inset:0}}><Core compact={compact}/><AdaptiveDpr pixelated/></Canvas>;
}
