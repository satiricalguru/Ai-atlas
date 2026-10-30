'use client';
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export function Modal({title,children,onClose,wide=false}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;el?.showModal();const focus=document.activeElement as HTMLElement;return()=>{el?.close();focus?.focus();};},[]);
 return <dialog ref={ref} className={`atlas-modal ${wide?'modal-wide':''}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-head"><div><span className="eyebrow">AI ATLAS / WORKSPACE</span><h2>{title}</h2></div><button onClick={onClose} className="icon-button" aria-label="Close dialog"><X size={16}/></button></div>{children}</dialog>;
}
