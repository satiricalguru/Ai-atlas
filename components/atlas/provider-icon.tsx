'use client';
import {useId} from 'react';
import {getProvider} from '@/lib/data';
import {providerLogos} from './logos';
export function ProviderIcon({id,size=32}:{id:string;size?:number}) {const p=getProvider(id);const uid=useId().replace(/[^a-zA-Z0-9]/g,'');const logo=providerLogos[p.id];return <span className={`provider-icon provider-${p.id}${logo?' has-logo':''}`} style={{width:size,height:size,color:logo?undefined:p.color}} aria-hidden="true">{logo?<span className="provider-logo" dangerouslySetInnerHTML={{__html:logo.replaceAll('_R_0_',uid)}}/>:<span>{p.mark}</span>}</span>;}
