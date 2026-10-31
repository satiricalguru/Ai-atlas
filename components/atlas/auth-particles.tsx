'use client';
import {useEffect,useRef} from 'react';
// A slowly turning sphere of dots for the auth art panel; drifts away from the cursor. Pure 2D canvas, no WebGL.
export function AuthParticles(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n=520;const pts=Array.from({length:n},(_,i)=>{const y=1-(i+.5)/n*2;const r=Math.sqrt(1-y*y);const a=i*2.39996;return {x:Math.cos(a)*r,y,z:Math.sin(a)*r,p:Math.random()*Math.PI*2,ox:0,oy:0};});
  let w=0,h=0,dpr=1,raf=0,t=0,last=performance.now();const mouse={x:-1e4,y:-1e4};
  const resize=()=>{const b=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio,2);w=b.width;h=b.height;canvas.width=w*dpr;canvas.height=h*dpr;};
  const move=(e:PointerEvent)=>{const b=canvas.getBoundingClientRect();mouse.x=e.clientX-b.left;mouse.y=e.clientY-b.top;};
  const leave=()=>{mouse.x=mouse.y=-1e4;};
  const draw=(now:number)=>{
   const dt=Math.min(.05,(now-last)/1000);last=now;if(!reduced)t+=dt;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   const R=Math.min(w,h)*.3,cx=w*.5,cy=h*.3;const ry=t*.06,rx=-.35;const cY=Math.cos(ry),sY=Math.sin(ry),cX=Math.cos(rx),sX=Math.sin(rx);
   for(const q of pts){
    const x1=q.x*cY+q.z*sY,z1=-q.x*sY+q.z*cY;const y2=q.y*cX-z1*sX,z2=q.y*sX+z1*cX;
    const breathe=1+Math.sin(t*.8+q.p)*.012;const persp=1.6/(2.4-z2);
    let px=cx+x1*R*breathe*persp,py=cy+y2*R*breathe*persp;
    const dx=px-mouse.x,dy=py-mouse.y,d=Math.hypot(dx,dy);const push=d<140?(1-d/140)**2*38:0;
    q.ox+=((d?dx/d:0)*push-q.ox)*.12;q.oy+=((d?dy/d:0)*push-q.oy)*.12;px+=q.ox;py+=q.oy;
    if(px<-10||py<-10||px>w+10||py>h+10)continue;
    const front=(z2+1)/2;ctx.globalAlpha=.12+front*.55;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,(1.2+front*2.6)*persp,0,Math.PI*2);ctx.fill();
   }
   if(!reduced)raf=requestAnimationFrame(draw);
  };
  resize();const ro=new ResizeObserver(()=>{resize();if(reduced)draw(performance.now());});ro.observe(canvas);
  window.addEventListener('pointermove',move);document.addEventListener('pointerleave',leave);
  raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);};
 },[]);
 return <canvas ref={ref} className="auth-particles" aria-hidden="true"/>;
}
