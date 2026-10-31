'use client';
import dynamic from 'next/dynamic';
import { Component, useEffect, useRef, useState } from 'react';
import { useReducedMotion, type MotionValue } from 'motion/react';
import { ProviderIcon } from './provider-icon';
import { getProvider } from '@/lib/data';
const satellites=['chatgpt','claude','gemini','deepseek','kimi','cursor','perplexity','grok','copilot','mistral','meta','qwen'];
const Scene=dynamic(()=>import('./universe-scene'),{ssr:false,loading:()=>null});
class SceneBoundary extends Component<{children:React.ReactNode},{failed:boolean}> {state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?null:this.props.children;}}
export function StaticGlobe(){const dots=Array.from({length:420},(_,i)=>{const y=1-(i+.5)/420*2;const r=Math.sqrt(1-y*y);const a=i*2.39996;return {x:Math.cos(a)*r,y,z:Math.sin(a)*r};});return <svg className="static-globe" viewBox="-1.2 -1.2 2.4 2.4" aria-hidden="true">{dots.map((d,i)=><circle key={i} cx={d.x} cy={d.y} r={.009} fill="#fff" opacity={d.z>0?.85:.25}/>)}</svg>;}
export function Universe({progress}:{progress?:MotionValue<number>}){
  const ref=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();const [ready,setReady]=useState(false);const [visible,setVisible]=useState(false);const [compact,setCompact]=useState(false);const chips=useRef<Record<string,HTMLDivElement|null>>({});
  useEffect(()=>{
    const canvas=document.createElement('canvas');let gl:WebGL2RenderingContext|null=null;
    try{gl=canvas.getContext('webgl2');setReady(!!gl);gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch{setReady(false);}
    const media=window.matchMedia('(max-width: 767px)');const resize=()=>setCompact(media.matches);resize();media.addEventListener('change',resize);
    let intersecting=false;const update=()=>setVisible(intersecting&&!document.hidden);
    const observer=new IntersectionObserver(([e])=>{intersecting=e.isIntersecting;update();},{rootMargin:'0px'});
    if(ref.current)observer.observe(ref.current);document.addEventListener('visibilitychange',update);
    return()=>{observer.disconnect();media.removeEventListener('change',resize);document.removeEventListener('visibilitychange',update);};
  },[]);
  const live=ready&&!reduced;
  return <div className={`universe${live?' universe-live':''}`} ref={ref} role="img" aria-label="A particle globe of your AI activity, with twelve AI tools in orbit">{live?<SceneBoundary><Scene active={visible} compact={compact} progress={progress} chips={chips}/></SceneBoundary>:<StaticGlobe/>}{live&&<div className="sat-layer" aria-hidden="true">{satellites.map(id=><div key={id} className={`sat-chip${compact?' compact':''}`} ref={el=>{chips.current[id]=el;}}><ProviderIcon id={id} size={compact?18:22}/>{!compact&&<span>{getProvider(id).name}</span>}</div>)}</div>}</div>;
}
