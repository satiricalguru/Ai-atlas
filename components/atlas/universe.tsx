'use client';
import dynamic from 'next/dynamic';
import { Component, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ProviderIcon } from './provider-icon';
import { ArrowUpRight, Orbit } from 'lucide-react';
const Scene=dynamic(()=>import('./universe-scene'),{ssr:false,loading:()=>null});
class SceneBoundary extends Component<{children:React.ReactNode},{failed:boolean}> {state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?null:this.props.children;}}
export function StaticGlobe(){return <svg className="static-globe" viewBox="0 0 800 520" fill="none" aria-hidden="true"><defs><radialGradient id="pearlFill" cx="28%" cy="20%" r="85%"><stop stopColor="#5a5a5a"/><stop offset=".3" stopColor="#292929"/><stop offset=".7" stopColor="#101010"/><stop offset="1" stopColor="#303030"/></radialGradient><linearGradient id="silverOrbit"><stop stopColor="#777"/><stop offset=".4" stopColor="#eee"/><stop offset=".7" stopColor="#444"/><stop offset="1" stopColor="#999"/></linearGradient></defs><ellipse cx="400" cy="260" rx="235" ry="88" transform="rotate(-22 400 260)" stroke="url(#silverOrbit)" strokeWidth="5"/><circle cx="400" cy="260" r="158" fill="url(#pearlFill)" stroke="#333" strokeWidth=".7"/><path d="M182 312C205 395 644 292 618 205" stroke="url(#silverOrbit)" strokeWidth="5"/></svg>;}
const nodes=[{id:'chatgpt',x:18,y:29,tag:'Writing & thinking'},{id:'claude',x:82,y:29,tag:'Coding & creativity'},{id:'gemini',x:82,y:50,tag:'Research & discovery'},{id:'cursor',x:18,y:71,tag:'Building & debugging'},{id:'perplexity',x:18,y:50,tag:'Answers & exploration'},{id:'copilot',x:82,y:71,tag:'Your coding companion'}];
export function Universe(){
  const ref=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();const [ready,setReady]=useState(false);const [visible,setVisible]=useState(false);const [compact,setCompact]=useState(false);const [selected,setSelected]=useState<string|null>(null);
  useEffect(()=>{
    const canvas=document.createElement('canvas');let gl:WebGL2RenderingContext|null=null;
    try{gl=canvas.getContext('webgl2');setReady(!!gl);gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch{setReady(false);}
    const media=window.matchMedia('(max-width: 767px)');const resize=()=>setCompact(media.matches);resize();media.addEventListener('change',resize);
    let intersecting=false;const update=()=>setVisible(intersecting&&!document.hidden);
    const observer=new IntersectionObserver(([e])=>{intersecting=e.isIntersecting;update();},{rootMargin:'0px'});
    if(ref.current)observer.observe(ref.current);document.addEventListener('visibilitychange',update);
    return()=>{observer.disconnect();media.removeEventListener('change',resize);document.removeEventListener('visibilitychange',update);};
  },[]);
  return <div className="universe" ref={ref} aria-label="Illustrative map of six AI tools connected in one ecosystem"><div className="universe-coordinate coord-top">ATLAS / PERSONAL ECOSYSTEM <span>01—06</span></div><StaticGlobe/>{ready&&!reduced&&<SceneBoundary><Scene active={visible} compact={compact}/></SceneBoundary>}<div className="globe-label"><span className="tiny-star">✳</span><span>YOUR UNIVERSE</span></div>{nodes.map(n=><button key={n.id} className={`orbit-node ${selected===n.id?'selected':''}`} style={{left:`${n.x}%`,top:`${n.y}%`}} onClick={()=>setSelected(selected===n.id?null:n.id)} aria-expanded={selected===n.id} aria-label={`Explore ${n.id}`}><ProviderIcon id={n.id} size={21}/><span>{n.id==='chatgpt'?'ChatGPT':n.id==='copilot'?'Copilot':n.id.charAt(0).toUpperCase()+n.id.slice(1)}</span><span className="node-connector"/>{selected===n.id&&<span className="node-tooltip">{n.tag}<small>Illustrative ecosystem · import supported</small></span>}</button>)}<div className="universe-bottom"><span><Orbit size={12}/> ONE CONNECTED PERSPECTIVE</span><span>INTERACT TO EXPLORE <ArrowUpRight size={12}/></span></div></div>;
}
