'use client';
import { useEffect,useRef } from 'react';
import type { EChartsOption, ECharts } from 'echarts';
import { analytics, type ActivityEvent, type Category, categories, categoryColors, providers } from '@/lib/data';
export function Chart({option,label,height=220}:{option:EChartsOption;label:string;height?:number}){
  const ref=useRef<HTMLDivElement>(null);const chart=useRef<ECharts|null>(null);
  useEffect(()=>{let stopped=false;let observer:ResizeObserver|undefined; const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    import('@/lib/echarts').then(({init})=>{if(stopped||!ref.current)return;chart.current=init(ref.current,undefined,{renderer:'svg'});chart.current.setOption({...option,animation:!reduced,backgroundColor:'transparent',textStyle:{fontFamily:'inherit',color:'#969e91'},aria:{enabled:true}});observer=new ResizeObserver(()=>chart.current?.resize());observer.observe(ref.current);});
    return()=>{stopped=true;observer?.disconnect();chart.current?.dispose();chart.current=null;};
  },[option]);return <div ref={ref} role="img" aria-label={label} style={{height,width:'100%',minWidth:0}}/>;
}
export function TrendChart({data,small=false}:{data:ReturnType<typeof analytics>;small?:boolean}){
  const option:EChartsOption={grid:{top:16,left:small?25:35,right:12,bottom:28},tooltip:{trigger:'axis',backgroundColor:'#20271e',borderColor:'#3b4534',textStyle:{color:'#f0f2eb'},confine:true},xAxis:{type:'category',boundaryGap:false,data:data.trend.map(d=>d.date.slice(5)),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:'#8f9988',fontSize:10,interval:Math.max(0,Math.floor(data.days/6)-1)}},yAxis:{type:'value',splitNumber:3,axisLabel:{color:'#8f9988',fontSize:10},splitLine:{lineStyle:{color:'#252d23',type:'dashed'}}},series:[{type:'line',data:data.trend.map(d=>d.count),smooth:.35,symbol:'circle',symbolSize:5,showSymbol:false,lineStyle:{color:'#d5fa6b',width:2},itemStyle:{color:'#d5fa6b'},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'#d5fa6b30'},{offset:1,color:'#d5fa6b00'}]}}}]};
  return <Chart option={option} label={`Recorded activity over ${data.days} days; ${data.total} interactions.`} height={small?165:245}/>;
}
export function DistributionChart({data,height=185}:{data:ReturnType<typeof analytics>;height?:number}){
  const option:EChartsOption={tooltip:{trigger:'item',backgroundColor:'#20271e',borderColor:'#3b4534',textStyle:{color:'#f0f2eb'}},series:[{type:'pie',radius:['69%','89%'],center:['50%','50%'],avoidLabelOverlap:true,label:{show:false},itemStyle:{borderRadius:3,borderColor:'#131714',borderWidth:4},emphasis:{scaleSize:5},data:data.distribution.map(c=>({name:c.name,value:c.count,itemStyle:{color:c.color}}))}]};
  return <div className="donut-wrap"><Chart option={option} label={`Work distribution: ${data.distribution.map(c=>`${c.name} ${c.count}`).join(', ')}`} height={height}/><div className="donut-center"><strong>{data.distribution.length}</strong><span>work categories</span></div></div>;
}
export function FingerprintChart({events}:{events:ActivityEvent[]}){
  const groups:Category[]=['Coding','Research','Writing','Studying','Data Analysis','Brainstorming'];const counts=groups.map(c=>events.filter(e=>e.category===c).length);const max=Math.max(...counts,1);
  const option:EChartsOption={radar:{indicator:groups.map(name=>({name,max})),radius:'65%',axisName:{color:'#abb39f',fontSize:10},splitNumber:4,splitArea:{areaStyle:{color:['#d5fa6b02','#d5fa6b04']}},axisLine:{lineStyle:{color:'#384332'}},splitLine:{lineStyle:{color:'#2c3727'}}},series:[{type:'radar',data:[{value:counts,name:'Activity fingerprint',areaStyle:{color:'#d5fa6b24'},lineStyle:{color:'#d5fa6b',width:2},itemStyle:{color:'#d5fa6b'},symbolSize:4}]}]};
  return <Chart option={option} label={`AI fingerprint: ${groups.map((c,i)=>`${c}: ${counts[i]}`).join(', ')}`} height={290}/>;
}
export function NetworkChart({events}:{events:ActivityEvent[]}){
  const active=providers.filter(p=>events.some(e=>e.provider===p.id));const cats=categories.filter(c=>events.some(e=>e.category===c));
  const nodes=[...active.map((p,i)=>({name:p.name,x:100,y:40+i*55,symbolSize:25,itemStyle:{color:p.color}})),...cats.map((name,i)=>({name,x:450,y:20+i*40,symbolSize:16,itemStyle:{color:categoryColors[categories.indexOf(name)]}}))];
  const links=active.flatMap(p=>cats.map(c=>({source:p.name,target:c,value:events.filter(e=>e.provider===p.id&&e.category===c).length})).filter(l=>l.value).map(l=>({...l,lineStyle:{width:Math.max(1,Math.min(6,l.value/30)),opacity:.3,color:p.color,curveness:.08}})));
  return <Chart label="Connections from AI applications to recorded work categories" height={365} option={{tooltip:{},series:[{type:'graph',layout:'none',roam:false,data:nodes,links,label:{show:true,position:'right',color:'#c4ccb8',fontSize:11},emphasis:{focus:'adjacency'}}]}}/>;
}
