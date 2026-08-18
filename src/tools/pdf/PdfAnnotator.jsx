import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
// THE FIX: Grab the modern .mjs worker using Vite's special asset URL loader
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'; 

import { PDFDocument } from 'pdf-lib';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer, Square, Pentagon, Paintbrush, Eraser, ZoomIn, ZoomOut, 
  Trash2, Download, Eye, EyeOff, Plus, Undo2, Redo2, 
  ChevronLeft, ChevronRight, FileText, Upload, Maximize, Minimize, X 
} from 'lucide-react';

// Wire up the modern Vite worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/* ── shared helpers ──────────────────────────────────────────────────────── */
let _pid=0;
const puid=()=>`p${++_pid}_${Date.now()}`;
const PCOLORS=['#3b82f6','#ec4899','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316'];
const ptInBox=(p,a)=>p.x>=a.x&&p.x<=a.x+a.w&&p.y>=a.y&&p.y<=a.y+a.h;
const ptInPoly=(p,pts)=>{let i=false;for(let a=0,b=pts.length-1;a<pts.length;b=a++){const xi=pts[a].x,yi=pts[a].y,xj=pts[b].x,yj=pts[b].y;if(((yi>p.y)!==(yj>p.y))&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)i=!i;}return i;};
const ptNearBrush=(p,a,r)=>a.strokes.some(s=>s.pts.some(sp=>Math.hypot(sp.x-p.x,sp.y-p.y)<r));
const hitTestP=(p,anns,r=12)=>{for(let i=anns.length-1;i>=0;i--){const a=anns[i];if(!a.visible)continue;if(a.type==='bbox'&&ptInBox(p,a))return a.id;if(a.type==='polygon'&&a.pts.length>=3&&ptInPoly(p,a.pts))return a.id;if(a.type==='brush'&&ptNearBrush(p,a,r))return a.id;}return null;};
const smoothP=(ctx,pts)=>{if(pts.length<2)return;ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++)ctx.quadraticCurveTo(pts[i].x,pts[i].y,(pts[i].x+pts[i+1].x)/2,(pts[i].y+pts[i+1].y)/2);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);};

const drawAnnP=(ctx,a,hov,sel,z)=>{
  if(!a.visible)return;
  ctx.save();const lw=(sel?2.5:1.5)/z,col=a.color;
  if(a.type==='bbox'){
    ctx.globalAlpha=hov||sel?.38:.22;ctx.fillStyle=col;ctx.fillRect(a.x,a.y,a.w,a.h);
    ctx.globalAlpha=1;ctx.strokeStyle=sel?'#fff':col;ctx.lineWidth=lw;ctx.strokeRect(a.x,a.y,a.w,a.h);
    if(sel)[[a.x,a.y],[a.x+a.w,a.y],[a.x,a.y+a.h],[a.x+a.w,a.y+a.h]].forEach(([hx,hy])=>{ctx.fillStyle='#fff';ctx.fillRect(hx-4/z,hy-4/z,8/z,8/z);ctx.strokeStyle=col;ctx.lineWidth=1.5/z;ctx.strokeRect(hx-4/z,hy-4/z,8/z,8/z);});
    ctx.font=`bold ${11/z}px sans-serif`;const tw=ctx.measureText(a.label).width,tp=5/z,th=17/z;
    ctx.fillStyle=col;ctx.fillRect(a.x,a.y-th,tw+tp*2,th);ctx.fillStyle='#fff';ctx.fillText(a.label,a.x+tp,a.y-th/2+4/z);
  }
  else if(a.type==='polygon'){
    if(a.pts.length<3){ctx.restore();return;}
    ctx.beginPath();ctx.moveTo(a.pts[0].x,a.pts[0].y);a.pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
    ctx.globalAlpha=hov||sel?.38:.22;ctx.fillStyle=col;ctx.fill();
    ctx.globalAlpha=1;ctx.strokeStyle=sel?'#fff':col;ctx.lineWidth=lw;ctx.stroke();
    if(sel)a.pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,4/z,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5/z;ctx.stroke();});
    const cx=a.pts.reduce((s,p)=>s+p.x,0)/a.pts.length,cy=a.pts.reduce((s,p)=>s+p.y,0)/a.pts.length;
    ctx.font=`bold ${11/z}px sans-serif`;const tw=ctx.measureText(a.label).width+8/z;
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(cx-tw/2,cy-8/z,tw,16/z);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(a.label,cx,cy+4/z);ctx.textAlign='left';
  }
  else if(a.type==='brush'){
    ctx.globalAlpha=hov||sel?.95:.72;ctx.strokeStyle=col;ctx.lineCap='round';ctx.lineJoin='round';
    a.strokes.forEach(s=>{if(s.pts.length<2)return;ctx.lineWidth=s.size;ctx.beginPath();smoothP(ctx,s.pts);ctx.stroke();});
  }
  ctx.restore();
};

/* ── main component ─────────────────────────────────────────────────────── */
export default function PdfAnnotator() {
  const wrapperRef   = useRef(null);
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const pdfPageRef   = useRef(null); 

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfBytes, setPdfBytes] = useState(null); // Keep original bytes for saving
  const [pdfDoc,   setPdfDoc]   = useState(null);  
  const [numPages, setNumPages] = useState(0);
  const [pageNum,  setPageNum]  = useState(1);
  const [pageInfo, setPageInfo] = useState(null); 
  const [pdfName,  setPdfName]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [exporting, setExporting] = useState(false);

  const [pageAnns,  setPageAnns]  = useState({});   
  const [tool,      setTool]      = useState('bbox');
  const [brushSz,   setBrushSz]   = useState(14);
  const [labels,    setLabels]    = useState([
    {id:'l1',name:'Highlight',color:'#f59e0b'},
    {id:'l2',name:'Comment',  color:'#3b82f6'},
    {id:'l3',name:'Error',    color:'#ef4444'},
  ]);
  const [actLbl,  setActLbl]  = useState('l1');
  const [selId,   setSelId]   = useState(null);
  const [hovId,   setHovId]   = useState(null);
  const [zoom,    setZoom]    = useState(1);
  const [pan,     setPan]     = useState({x:40,y:20});
  const [newLbl,  setNewLbl]  = useState('');
  const [polyLen, setPolyLen] = useState(0);

  // Refs
  const rTool=useRef('bbox'),rBrush=useRef(14),rAnns=useRef([]),rLbls=useRef(labels);
  const rAct=useRef('l1'),rSel=useRef(null),rHov=useRef(null);
  const rZ=useRef(1),rP=useRef({x:40,y:20});
  useEffect(()=>{rTool.current=tool;},[tool]);
  useEffect(()=>{rBrush.current=brushSz;},[brushSz]);
  useEffect(()=>{rLbls.current=labels;},[labels]);
  useEffect(()=>{rAct.current=actLbl;},[actLbl]);
  useEffect(()=>{rSel.current=selId;},[selId]);
  useEffect(()=>{rHov.current=hovId;},[hovId]);
  useEffect(()=>{rZ.current=zoom;},[zoom]);
  useEffect(()=>{rP.current=pan;},[pan]);

  useEffect(()=>{
    const cur=pageAnns[pageNum]||[];
    rAnns.current=cur;
  },[pageAnns,pageNum]);

  const dp=useRef({
    drawing:false,bboxS:null,bboxE:null,
    polyPts:[],polyCur:null,
    curStroke:[],eraserPos:null,
    panning:false,panStart:null,panOrigin:null,spaceDown:false,
  });
  const histRef=useRef({}),futRef=useRef({});

  // Fullscreen hooks
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFs = async () => {
    if (!document.fullscreenElement && wrapperRef.current) {
      await wrapperRef.current.requestFullscreen().catch(err => console.error(err));
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const pushH=useCallback(prev=>{
    histRef.current[pageNum]=[...(histRef.current[pageNum]||[]).slice(-20),prev];
    futRef.current[pageNum]=[];
  },[pageNum]);

  const undo=useCallback(()=>{
    const h=histRef.current[pageNum]||[];
    if(!h.length)return;
    const prev=h.pop();
    futRef.current[pageNum]=[...futRef.current[pageNum]||[],rAnns.current];
    rAnns.current=prev;
    setPageAnns(pa=>({...pa,[pageNum]:prev}));setSelId(null);
  },[pageNum]);

  const redo=useCallback(()=>{
    const f=futRef.current[pageNum]||[];
    if(!f.length)return;
    const next=f.pop();
    histRef.current[pageNum]=[...histRef.current[pageNum]||[],rAnns.current];
    rAnns.current=next;
    setPageAnns(pa=>({...pa,[pageNum]:next}));
  },[pageNum]);

  /* ── render ────────────────────────────────────────────────────────────── */
  const render=useCallback(()=>{
    const cv=canvasRef.current;if(!cv)return;
    const ctx=cv.getContext('2d');
    const z=rZ.current,p=rP.current,d=dp.current,t=rTool.current;
    const lbl=rLbls.current.find(l=>l.id===rAct.current);
    const col=lbl?.color||'#f59e0b',bsz=rBrush.current;

    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(z,z);

    if(pdfPageRef.current){
      ctx.fillStyle='#fff';
      ctx.fillRect(0,0,pdfPageRef.current.width,pdfPageRef.current.height);
      ctx.drawImage(pdfPageRef.current,0,0);
      ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=20/z;
      ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1/z;
      ctx.strokeRect(0,0,pdfPageRef.current.width,pdfPageRef.current.height);
      ctx.shadowBlur=0;
    }

    rAnns.current.forEach(a=>drawAnnP(ctx,a,a.id===rHov.current,a.id===rSel.current,z));

    if(t==='bbox'&&d.bboxS&&d.bboxE){
      const x=Math.min(d.bboxS.x,d.bboxE.x),y=Math.min(d.bboxS.y,d.bboxE.y);
      const w=Math.abs(d.bboxE.x-d.bboxS.x),h=Math.abs(d.bboxE.y-d.bboxS.y);
      ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=col;ctx.fillRect(x,y,w,h);
      ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=2/z;
      ctx.setLineDash([6/z,3/z]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);
      ctx.font=`${11/z}px monospace`;ctx.fillStyle=col;ctx.fillText(`${Math.round(w)}×${Math.round(h)}`,x+3/z,y-5/z);
      ctx.restore();
    }

    if(t==='polygon'&&d.polyPts.length>0){
      ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2/z;ctx.lineCap='round';ctx.lineJoin='round';
      if(d.polyPts.length>=3){
        ctx.beginPath();ctx.moveTo(d.polyPts[0].x,d.polyPts[0].y);d.polyPts.forEach(pt=>ctx.lineTo(pt.x,pt.y));
        if(d.polyCur)ctx.lineTo(d.polyCur.x,d.polyCur.y);
        ctx.closePath();ctx.globalAlpha=.1;ctx.fillStyle=col;ctx.fill();ctx.globalAlpha=1;
      }
      ctx.beginPath();ctx.moveTo(d.polyPts[0].x,d.polyPts[0].y);d.polyPts.forEach(pt=>ctx.lineTo(pt.x,pt.y));ctx.stroke();
      if(d.polyCur){
        const last=d.polyPts[d.polyPts.length-1];
        ctx.save();ctx.setLineDash([4/z,4/z]);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(d.polyCur.x,d.polyCur.y);ctx.stroke();ctx.restore();
      }
      d.polyPts.forEach((pt,i)=>{
        ctx.beginPath();ctx.arc(pt.x,pt.y,(i===0?7:4)/z,0,Math.PI*2);
        ctx.fillStyle=i===0?'#fff':col;ctx.globalAlpha=1;ctx.fill();
        ctx.strokeStyle=col;ctx.lineWidth=1.5/z;ctx.stroke();
      });
      ctx.restore();
    }

    if(t==='brush'&&d.curStroke.length>1){
      ctx.save();ctx.globalAlpha=.78;ctx.strokeStyle=col;
      ctx.lineWidth=bsz;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();smoothP(ctx,d.curStroke);ctx.stroke();ctx.restore();
    }

    if((t==='brush'||t==='eraser')&&d.eraserPos){
      ctx.save();ctx.lineWidth=1.5/z;
      ctx.strokeStyle=t==='eraser'?'rgba(0,0,0,.7)':col;
      ctx.fillStyle=t==='eraser'?'rgba(0,0,0,.05)':'transparent';
      ctx.setLineDash([3/z,3/z]);
      ctx.beginPath();ctx.arc(d.eraserPos.x,d.eraserPos.y,bsz/2,0,Math.PI*2);
      ctx.fill();ctx.stroke();ctx.restore();
    }

    ctx.restore();
  },[]);

  useEffect(()=>{render();},[pageAnns,pageNum,zoom,pan,selId,hovId,pageInfo,render]);

  useEffect(()=>{
    const resize=()=>{
      const cv=canvasRef.current,c=containerRef.current;
      if(!cv||!c)return;cv.width=c.clientWidth;cv.height=c.clientHeight;render();
    };
    resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);
  },[render]);

  /* ── PDF rendering ──────────────────────────────────────────────────────── */
  const renderPdfPage=useCallback(async(doc,num)=>{
    if(!doc)return;
    setLoading(true);
    try{
      const page=await doc.getPage(num);
      const scale=2; 
      const viewport=page.getViewport({scale});
      const offscreen=document.createElement('canvas');
      offscreen.width=viewport.width;offscreen.height=viewport.height;
      await page.render({canvasContext:offscreen.getContext('2d'),viewport}).promise;
      pdfPageRef.current=offscreen;
      const c=containerRef.current;
      const displayW=viewport.width/scale,displayH=viewport.height/scale;
      if(c){
        const sc=Math.min((c.clientWidth-80)/displayW,(c.clientHeight-80)/displayH,1.5);
        rZ.current=sc;rP.current={x:40,y:20};setZoom(sc);setPan({x:40,y:20});
      }
      setPageInfo({w:displayW,h:displayH});
    }catch(e){console.error('PDF render error:',e);}
    setLoading(false);render();
  },[render]);

  const loadPdf=async file=>{
    if(!file||(!file.name.endsWith('.pdf')&&file.type!=='application/pdf'))return;
    setLoading(true);setPdfName(file.name);
    try{
      const bytes=await file.arrayBuffer();
      setPdfBytes(bytes); 
      const doc=await pdfjs.getDocument({data:bytes}).promise;
      setPdfDoc(doc);setNumPages(doc.numPages);setPageNum(1);
      setPageAnns({});rAnns.current=[];setSelId(null);
      await renderPdfPage(doc,1);
    }catch(e){console.error('PDF load error:',e);}
    setLoading(false);
  };

  useEffect(()=>{
    if(pdfDoc) renderPdfPage(pdfDoc,pageNum);
    setSelId(null);
  },[pdfDoc,pageNum,renderPdfPage]);

  /* ── Export Engine (Overlay Method) ────────────────────────────────────── */
  const exportPdf = async () => {
    if (!pdfBytes) return;
    setExporting(true);
    try {
      const outDoc = await PDFDocument.load(pdfBytes);
      const pages = outDoc.getPages();

      for (let i = 1; i <= numPages; i++) {
        const anns = pageAnns[i];
        if (!anns || !anns.length) continue;

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        // Render annotations to a transparent offscreen canvas
        const tempCv = document.createElement('canvas');
        tempCv.width = viewport.width;
        tempCv.height = viewport.height;
        const tCtx = tempCv.getContext('2d');
        
        tCtx.scale(2, 2); 
        anns.forEach(a => drawAnnP(tCtx, a, false, false, 1));

        // Stamp it onto the PDF
        const pngDataUrl = tempCv.toDataURL('image/png');
        const pngImage = await outDoc.embedPng(pngDataUrl);
        
        const pdfPage = pages[i - 1];
        const { width, height } = pdfPage.getSize();
        
        pdfPage.drawImage(pngImage, {
          x: 0, y: 0,
          width: width, height: height,
        });
      }

      const pdfBytesOut = await outDoc.save();
      const blob = new Blob([pdfBytesOut], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Annotated_${pdfName}`;
      a.click();
    } catch (e) {
      console.error("Export failed", e);
    }
    setExporting(false);
  };

  /* ── coords ─────────────────────────────────────────────────────────────── */
  const toImg=useCallback(e=>{
    const r=canvasRef.current.getBoundingClientRect();
    return{x:(e.clientX-r.left-rP.current.x)/rZ.current,y:(e.clientY-r.top-rP.current.y)/rZ.current};
  },[]);

  const getLbl=()=>{const l=rLbls.current.find(l=>l.id===rAct.current);return{name:l?.name||'Highlight',color:l?.color||'#f59e0b'};};

  const completeP=useCallback(ann=>{
    pushH([...rAnns.current]);
    const next=[...rAnns.current,ann];
    rAnns.current=next;
    setPageAnns(pa=>({...pa,[pageNum]:next}));
    rSel.current=ann.id;setSelId(ann.id);
  },[pushH,pageNum]);

  /* ── mouse events ────────────────────────────────────────────────────────── */
  const onDown=useCallback(e=>{
    if(e.button===1||(e.button===0&&dp.current.spaceDown)){
      dp.current.panning=true;dp.current.panStart={x:e.clientX,y:e.clientY};dp.current.panOrigin={...rP.current};return;
    }
    if(e.button!==0)return;
    const pt=toImg(e),t=rTool.current,d=dp.current;
    if(t==='select'){setSelId(hitTestP(pt,rAnns.current,rBrush.current/2));return;}
    if(t==='bbox'){d.drawing=true;d.bboxS=pt;d.bboxE=pt;return;}
    if(t==='polygon'){
      const pts=d.polyPts;
      if(pts.length>=3){const dist=Math.hypot(pt.x-pts[0].x,pt.y-pts[0].y);if(dist<14/rZ.current){const lbl=getLbl();completeP({id:puid(),type:'polygon',label:lbl.name,color:lbl.color,pts:[...pts],visible:true});d.polyPts=[];d.polyCur=null;setPolyLen(0);render();return;}}
      d.polyPts=[...pts,pt];setPolyLen(d.polyPts.length);render();return;
    }
    if(t==='brush'){d.drawing=true;d.curStroke=[pt];render();return;}
    if(t==='eraser'){
      d.eraserPos=pt;
      const hit=hitTestP(pt,rAnns.current,rBrush.current/2);
      if(hit){pushH(rAnns.current);const next=rAnns.current.filter(x=>x.id!==hit);rAnns.current=next;setPageAnns(pa=>({...pa,[pageNum]:next}));if(rSel.current===hit){rSel.current=null;setSelId(null);}}
      render();
    }
  },[toImg,completeP,pushH,render,pageNum]);

  const onMove=useCallback(e=>{
    const d=dp.current,pt=toImg(e),t=rTool.current;
    if(d.panning){const np={x:d.panOrigin.x+(e.clientX-d.panStart.x),y:d.panOrigin.y+(e.clientY-d.panStart.y)};rP.current=np;setPan(np);render();return;}
    if(t==='eraser'||t==='brush')d.eraserPos=pt;
    if(t==='bbox'&&d.drawing){d.bboxE=pt;render();return;}
    if(t==='polygon'){d.polyCur=pt;render();return;}
    if(t==='brush'&&d.drawing){d.curStroke=[...d.curStroke,pt];render();return;}
    if(t==='eraser'&&e.buttons===1){
      const hit=hitTestP(pt,rAnns.current,rBrush.current/2);
      if(hit){pushH(rAnns.current);const next=rAnns.current.filter(x=>x.id!==hit);rAnns.current=next;setPageAnns(pa=>({...pa,[pageNum]:next}));if(rSel.current===hit){rSel.current=null;setSelId(null);}}
      render();return;
    }
    if(!d.drawing&&t!=='polygon'){const hit=hitTestP(pt,rAnns.current,rBrush.current/2);if(hit!==rHov.current){rHov.current=hit;setHovId(hit);}}
    render();
  },[toImg,pushH,render,pageNum]);

  const onUp=useCallback(e=>{
    const d=dp.current,pt=toImg(e),t=rTool.current;
    if(d.panning){d.panning=false;return;}
    if(t==='bbox'&&d.drawing&&d.bboxS){
      d.drawing=false;
      const x=Math.min(d.bboxS.x,pt.x),y=Math.min(d.bboxS.y,pt.y);
      const w=Math.abs(pt.x-d.bboxS.x),h=Math.abs(pt.y-d.bboxS.y);
      if(w>4&&h>4){const lbl=getLbl();completeP({id:puid(),type:'bbox',label:lbl.name,color:lbl.color,x,y,w,h,visible:true});}
      d.bboxS=null;d.bboxE=null;render();return;
    }
    if(t==='brush'&&d.drawing&&d.curStroke.length>1){
      d.drawing=false;const lbl=getLbl();
      completeP({id:puid(),type:'brush',label:lbl.name,color:lbl.color,strokes:[{pts:d.curStroke,size:rBrush.current}],visible:true});
      d.curStroke=[];render();
    }
  },[toImg,completeP,render]);

  const onDbl=useCallback(()=>{
    const d=dp.current;if(rTool.current!=='polygon'||d.polyPts.length<3)return;
    const lbl=getLbl();completeP({id:puid(),type:'polygon',label:lbl.name,color:lbl.color,pts:[...d.polyPts],visible:true});
    d.polyPts=[];d.polyCur=null;setPolyLen(0);render();
  },[completeP,render]);

  const onWheel=useCallback(e=>{
    e.preventDefault();const f=e.deltaY>0?.88:1.14;
    const r=canvasRef.current.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
    const nz=Math.max(.06,Math.min(12,rZ.current*f));
    const np={x:mx-(mx-rP.current.x)*(nz/rZ.current),y:my-(my-rP.current.y)*(nz/rZ.current)};
    rZ.current=nz;rP.current=np;setZoom(nz);setPan(np);render();
  },[render]);

  useEffect(()=>{
    const kd=e=>{
      if(e.code==='Space'){dp.current.spaceDown=true;e.preventDefault();}
      if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){undo();}
      if((e.ctrlKey||e.metaKey)&&(e.key==='Z'||e.key==='y')){redo();}
      if((e.key==='Delete'||e.key==='Backspace')&&rSel.current&&e.target.tagName!=='INPUT'){
        pushH(rAnns.current);const next=rAnns.current.filter(x=>x.id!==rSel.current);
        rAnns.current=next;setPageAnns(pa=>({...pa,[pageNum]:next}));rSel.current=null;setSelId(null);
      }
      if(e.key==='Escape'){dp.current.polyPts=[];dp.current.drawing=false;dp.current.bboxS=null;setPolyLen(0);render();}
      if(!e.ctrlKey&&!e.metaKey&&e.target.tagName!=='INPUT'){
        const map={v:'select',b:'bbox',p:'polygon',n:'brush',e:'eraser'};
        if(map[e.key])setTool(map[e.key]);
      }
    };
    const ku=e=>{if(e.code==='Space')dp.current.spaceDown=false;};
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);};
  },[undo,redo,pushH,render,pageNum]);

  const addLabel=()=>{
    if(!newLbl.trim()) return;
    const id=`l${Date.now()}`;
    setLabels(l=>[...l,{id,name:newLbl.trim(),color:PCOLORS[l.length%PCOLORS.length]}]);
    setActLbl(id); setNewLbl('');
  };

  const TOOLS=[
    {id:'select',  Icon:MousePointer, tip:'Select  V'},
    {id:'bbox',    Icon:Square,       tip:'BBox    B'},
    {id:'polygon', Icon:Pentagon,     tip:'Polygon P'},
    {id:'brush',   Icon:Paintbrush,   tip:'Brush   N'},
    {id:'eraser',  Icon:Eraser,       tip:'Eraser  E'},
  ];
  const cursors={select:'default',bbox:'crosshair',polygon:'crosshair',brush:'none',eraser:'none'};
  const totalAnns = Object.values(pageAnns).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div 
      ref={wrapperRef} 
      className={`flex flex-col overflow-hidden bg-[#07070f] ${isFullscreen ? 'w-full h-full fixed inset-0 z-50 rounded-none border-none' : 'h-[700px] rounded-2xl border border-white/10'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-teal-400 tracking-tight flex items-center gap-2"><FileText size={16}/> PDF Annotator</span>
          {pdfName && <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">{pdfName}</span>}
          {totalAnns > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/20 text-teal-400">{totalAnns} total</span>}
        </div>

        {/* Page Nav */}
        {pdfDoc && (
          <div className="flex items-center gap-3 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum === 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft size={14}/></button>
            <span className="text-[11px] font-mono text-slate-300">Page {pageNum} of {numPages}</span>
            <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum === numPages} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight size={14}/></button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button onClick={undo} title="Undo Ctrl+Z" className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"><Undo2 size={14}/></button>
          <button onClick={redo} title="Redo Ctrl+Shift+Z" className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"><Redo2 size={14}/></button>
          <div className="w-px h-4 bg-white/10 mx-1"/>
          
          <button onClick={toggleFs} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all mr-1">
            {isFullscreen ? <Minimize size={15}/> : <Maximize size={15}/>}
          </button>

          <button onClick={exportPdf} disabled={exporting || !pdfDoc || totalAnns === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 disabled:opacity-25 transition-all">
            <Download size={12}/> {exporting ? 'Baking PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Tool panel */}
        <div className="w-11 flex flex-col items-center py-3 gap-1 bg-black/30 border-r border-white/5 flex-shrink-0">
          {TOOLS.map(({id,Icon,tip})=>(
            <button key={id} title={tip} onClick={()=>setTool(id)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                ${tool===id?'bg-teal-500 text-white shadow-lg shadow-teal-500/30':'text-slate-500 hover:text-white hover:bg-white/10'}`}>
              <Icon size={15}/>
            </button>
          ))}

          {(tool==='brush'||tool==='eraser')&&<>
            <div className="w-6 h-px bg-white/10 my-1"/>
            <p className="text-[8px] text-slate-600 uppercase tracking-wide">Size</p>
            {[4,10,18,30].map(s=>(
              <button key={s} onClick={()=>setBrushSz(s)} title={`${s}px`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${brushSz===s?'bg-white/15 ring-1 ring-white/30':'hover:bg-white/5'}`}>
                <div className="rounded-full bg-slate-400 transition-all" style={{width:Math.max(3,s/5),height:Math.max(3,s/5),backgroundColor:brushSz===s?'white':'#94a3b8'}}/>
              </button>
            ))}
          </>}

          <div className="flex-1"/>
          <button onClick={()=>{const nz=Math.min(12,rZ.current*1.25);rZ.current=nz;setZoom(nz);render();}} title="Zoom in +"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"><ZoomIn size={13}/></button>
          <button onClick={()=>{const nz=Math.max(.05,rZ.current*.8);rZ.current=nz;setZoom(nz);render();}} title="Zoom out -"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"><ZoomOut size={13}/></button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#07070f]"
          style={{cursor:cursors[tool]||'default'}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onDoubleClick={onDbl} onWheel={onWheel} onContextMenu={e=>e.preventDefault()}
          onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadPdf(e.dataTransfer.files[0]);}}
        >
          {!pdfDoc&&(
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center">
                <FileText size={28} className="text-slate-700"/>
              </div>
              <p className="text-sm text-slate-600">Drop a PDF or click Load to begin</p>
            </div>
          )}
          <canvas ref={canvasRef} className={`absolute inset-0 ${loading?'opacity-50 blur-sm transition-all':''}`}/>

          {loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="px-4 py-2 bg-black/50 text-white rounded-lg backdrop-blur-md animate-pulse text-sm">Rendering PDF...</span>
             </div>
          )}

          {!pdfDoc&&(
            <label className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-xl shadow-teal-500/20 transition-all z-10">
              <Upload size={15}/>Load Document
              <input type="file" accept="application/pdf" className="hidden" onChange={e=>loadPdf(e.target.files[0])}/>
            </label>
          )}

          {tool==='polygon'&&polyLen>0&&(
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/75 border border-white/10 rounded-full text-xs text-slate-400 pointer-events-none backdrop-blur-sm">
              {polyLen} pts · double-click or click ● to close · Esc to cancel
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-52 flex flex-col bg-black/30 border-l border-white/5 flex-shrink-0 min-h-0">

          {/* Labels */}
          <div className="flex-shrink-0 border-b border-white/5">
            <div className="px-3 py-2"><p className="text-[10px] uppercase tracking-widest text-slate-600">Markup Styles</p></div>
            <div className="px-2 space-y-0.5 max-h-40 overflow-y-auto pb-1">
              {labels.map(l=>(
                <button key={l.id} onClick={()=>setActLbl(l.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-left
                    ${actLbl===l.id?'bg-white/10':'hover:bg-white/5'}`}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:l.color}}/>
                  <span className="text-xs text-slate-300 flex-1 truncate">{l.name}</span>
                  {actLbl===l.id&&<div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0"/>}
                </button>
              ))}
            </div>
            <div className="px-2 py-2 flex gap-1">
              <input value={newLbl} onChange={e=>setNewLbl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addLabel()}
                placeholder="Add style…"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 min-w-0"/>
              <button onClick={addLabel} disabled={!newLbl.trim()}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 flex-shrink-0 transition-all">
                <Plus size={12}/>
              </button>
            </div>
          </div>

          {/* Annotations list */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-600">Page {pageNum} Edits</p>
              {(pageAnns[pageNum]||[]).length>0&&(
                <button onClick={()=>{pushH(pageAnns[pageNum]);setPageAnns(pa=>({...pa,[pageNum]:[]}));setSelId(null);}}
                  className="text-[10px] text-slate-600 hover:text-red-400 transition-colors">Clear</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {!(pageAnns[pageNum]||[]).length&&<p className="text-[10px] text-slate-700 text-center pt-6">No edits on this page</p>}
              {[...(pageAnns[pageNum]||[])].reverse().map(a=>(
                <div key={a.id} onClick={()=>setSelId(s=>s===a.id?null:a.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group
                    ${selId===a.id?'bg-white/10 ring-1 ring-white/15':'hover:bg-white/5'}`}>
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{backgroundColor:a.color}}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate leading-tight">{a.label}</p>
                    <p className="text-[9px] text-slate-600 capitalize">{a.type}</p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={ev=>{ev.stopPropagation();setPageAnns(pa=>({...pa,[pageNum]:pa[pageNum].map(x=>x.id===a.id?{...x,visible:!x.visible}:x)}));}}
                      className="p-0.5 text-slate-500 hover:text-white transition-colors">
                      {a.visible?<Eye size={11}/>:<EyeOff size={11}/>}
                    </button>
                    <button onClick={ev=>{
                      ev.stopPropagation();pushH(pageAnns[pageNum]);
                      setPageAnns(pa=>({...pa,[pageNum]:pa[pageNum].filter(x=>x.id!==a.id)}));
                      if(selId===a.id)setSelId(null);
                    }} className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={11}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}