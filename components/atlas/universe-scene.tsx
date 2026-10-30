'use client';
import {Canvas,useFrame} from '@react-three/fiber';
import {useMemo,useRef} from 'react';
import * as THREE from 'three';

const vertex=`varying vec3 vNormal;varying vec3 vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}`;
const pearl=`varying vec3 vNormal;varying vec3 vView;void main(){vec3 n=normalize(vNormal);vec3 v=normalize(vView);float facing=max(dot(n,v),0.);float rim=pow(1.-facing,3.);vec3 left=normalize(vec3(-.8,.65,1.1));vec3 right=normalize(vec3(.9,-.2,.6));float key=pow(max(dot(n,normalize(left+v)),0.),32.);float fill=pow(max(dot(n,normalize(right+v)),0.),20.);float broad=pow(max(dot(n,left),0.),2.);vec3 color=vec3(.018)+vec3(.075)*broad+vec3(.35)*key+vec3(.11)*fill+vec3(.24)*rim;gl_FragColor=vec4(color,1.);}`;
const silver=`varying vec3 vNormal;varying vec3 vView;void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(vView);float strip=pow(abs(dot(n,normalize(vec3(-.6,.8,1.)))),5.);float highlight=pow(max(dot(reflect(-normalize(vec3(-1.,1.,2.)),n),v),0.),16.);float edge=pow(1.-abs(dot(n,v)),2.);gl_FragColor=vec4(vec3(.14+strip*.48+highlight*.5+edge*.16),1.);}`;
function Sculpture({compact}:{compact:boolean}){
 const rig=useRef<THREE.Group>(null);const orbit=useRef<THREE.Group>(null);const time=useRef(0);
 const pearlMaterial=useMemo(()=>({vertexShader:vertex,fragmentShader:pearl}),[]);
 const silverMaterial=useMemo(()=>({vertexShader:vertex,fragmentShader:silver,side:THREE.DoubleSide}),[]);
 useFrame(({pointer},delta)=>{
  const dt=Math.min(delta,.04);time.current+=dt;
  if(rig.current){rig.current.rotation.y=THREE.MathUtils.damp(rig.current.rotation.y,pointer.x*.12,3,dt);rig.current.rotation.x=THREE.MathUtils.damp(rig.current.rotation.x,-pointer.y*.07,3,dt);rig.current.position.y=Math.sin(time.current*.35)*.035;}
  if(orbit.current){orbit.current.rotation.z=-.35+Math.sin(time.current*.12)*.08;orbit.current.rotation.x=1.15+Math.sin(time.current*.16)*.06;}
 });
 return <group ref={rig}>
  <mesh><sphereGeometry args={[1.65,compact?64:96,compact?48:64]}/><shaderMaterial {...pearlMaterial}/></mesh>
  <group ref={orbit} rotation={[1.15,0,-.35]}>
   <mesh><ringGeometry args={[2.22,2.32,compact?160:256]}/><shaderMaterial {...silverMaterial}/></mesh>
   <mesh><torusGeometry args={[2.32,.008,8,compact?160:256]}/><meshBasicMaterial color="#a4a4a4"/></mesh>
   <mesh position={[2.27,0,.014]}><sphereGeometry args={[.045,16,16]}/><meshBasicMaterial color="#e5e5e5"/></mesh>
  </group>
 </group>;
}
export default function UniverseScene({active=true,compact=false}:{active?:boolean;compact?:boolean}){
 return <Canvas dpr={[1,compact?1.5:1.75]} frameloop={active?'always':'never'} camera={{position:[0,0,7.8],fov:43}} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} style={{position:'absolute',inset:0}}><Sculpture compact={compact}/></Canvas>;
}
