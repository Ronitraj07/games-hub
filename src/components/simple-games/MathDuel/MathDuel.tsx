import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AIDifficulty, GameMode } from '@/components/shared/GameLobby';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Problem { question: string; answer: number; options: number[]; }

const generateProblem = (difficulty: Difficulty): Problem => {
  let a: number, b: number, question: string, answer: number;
  if (difficulty === 'easy') {
    const op = ['+','-'][Math.floor(Math.random()*2)];
    a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1;
    if (op==='-'&&b>a)[a,b]=[b,a];
    answer = op==='+'?a+b:a-b; question=`${a} ${op} ${b} = ?`;
  } else if (difficulty === 'medium') {
    const op = ['+','-','×'][Math.floor(Math.random()*3)];
    a=Math.floor(Math.random()*12)+1; b=Math.floor(Math.random()*12)+1;
    if (op==='-'&&b>a)[a,b]=[b,a];
    answer=op==='+'?a+b:op==='-'?a-b:a*b; question=`${a} ${op} ${b} = ?`;
  } else {
    const op=['×','÷','+','-'][Math.floor(Math.random()*4)];
    a=Math.floor(Math.random()*15)+2; b=Math.floor(Math.random()*10)+2;
    if (op==='÷'){answer=a;a=a*b;}
    else if(op==='-'&&b>a){[a,b]=[b,a];answer=a-b;}
    else{answer=op==='+'?a+b:op==='-'?a-b:a*b;}
    question=`${a} ${op} ${b} = ?`;
  }
  const wrongs=new Set<number>();
  while(wrongs.size<3){const o=Math.floor(Math.random()*10)+1;const w=Math.random()>.5?answer+o:answer-o;if(w!==answer)wrongs.add(w);}
  return{question,answer,options:[answer,...wrongs].sort(()=>Math.random()-.5)};
};

const TOTAL_Q = 10;
const TIME_PER: Record<Difficulty,number> = {easy:15,medium:12,hard:8};
// AI answer delay in seconds per difficulty
const AI_DELAY: Record<AIDifficulty,number> = {easy:10,medium:5,hard:1.5};
const AI_ERROR:  Record<AIDifficulty,number> = {easy:.3,medium:.1,hard:0};

interface OnlineState {
  questions: Problem[];
  current: number;
  p1Email: string; p2Email: string;
  p1Score: number; p2Score: number;
  p1Answered: boolean; p2Answered: boolean;
  status: 'waiting'|'active'|'finished';
  mode: GameMode;
}

export const MathDuel: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const userKey  = user?.email ?? null;

  const [gameMode, setGameMode] = useState<GameMode|null>(null);
  const [aiDiff,   setAiDiff]   = useState<AIDifficulty>('medium');

  // ─── Solo / vs-AI state ───
  const [problem,     setProblem]     = useState<Problem|null>(null);
  const [score,       setScore]       = useState(0);
  const [round,       setRound]       = useState(1);
  const [timeLeft,    setTimeLeft]    = useState(15);
  const [selected,    setSelected]    = useState<number|null>(null);
  const [correct,     setCorrect]     = useState(0);
  const [gameOver,    setGameOver]    = useState(false);
  const [streak,      setStreak]      = useState(0);
  const [showFb,      setShowFb]      = useState(false);
  const [diff,        setDiff]        = useState<Difficulty>('medium');
  // AI race
  const [aiScore,    setAiScore]    = useState(0);
  const [aiAnswered, setAiAnswered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  // ─── Online state ───
  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `mathduel-${userKey?sanitizeFirebasePath(userKey):'guest'}`;
  const initialOnline: OnlineState = {
    questions:[], current:0,
    p1Email:userKey??'', p2Email:'',
    p1Score:0, p2Score:0,
    p1Answered:false, p2Answered:false,
    status:'waiting', mode:'vs-partner',
  };
  const { gameState, updateGameState } = useRealtimeGame<OnlineState>(safeSession,'mathduel',initialOnline);
  const isP1 = gameState?.p1Email === userKey;
  const curQ = gameState?.questions?.[gameState.current];

  const nextLocalQ = useCallback((d: Difficulty) => {
    setProblem(generateProblem(d));
    setSelected(null); setShowFb(false); setTimeLeft(TIME_PER[d]); setAiAnswered(false);
  },[]);

  // Local timer
  useEffect(()=>{
    if(!gameMode||gameMode==='vs-partner'||gameOver||showFb||!problem)return;
    timerRef.current=setInterval(()=>{
      setTimeLeft(p=>{
        if(p<=1){clearInterval(timerRef.current!);handleLocalAnswer(-999);return 0;}
        return p-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current!);
  },[round,gameMode,gameOver,showFb]);

  // AI timer
  useEffect(()=>{
    if(gameMode!=='vs-ai'||showFb||!problem)return;
    const delay = AI_DELAY[aiDiff]*1000;
    aiTimerRef.current=setTimeout(()=>{
      const wrong=Math.random()<AI_ERROR[aiDiff];
      const aiAns=wrong?problem.options.find(o=>o!==problem.answer)||problem.answer:problem.answer;
      if(!showFb){
        if(aiAns===problem.answer){setAiScore(s=>s+5);}
        setAiAnswered(true);
        // If AI beat player
        if(!selected)handleLocalAnswer(-998); // timeout for player
      }
    },delay);
    return()=>{if(aiTimerRef.current)clearTimeout(aiTimerRef.current);};
  },[gameMode,round,showFb]);

  const handleLocalAnswer=useCallback((option:number)=>{
    if(showFb||!problem)return;
    clearInterval(timerRef.current!);
    if(aiTimerRef.current)clearTimeout(aiTimerRef.current!);
    setSelected(option); setShowFb(true);
    const ok=option===problem.answer;
    if(ok){const bonus=timeLeft>(TIME_PER[diff]*.6)?10:5;setScore(s=>s+bonus+(streak>=2?5:0));setCorrect(c=>c+1);setStreak(s=>s+1);playCorrect();}
    else{setStreak(0);playWrong();}
    setTimeout(()=>{
      if(round>=TOTAL_Q)setGameOver(true);
      else{setRound(r=>r+1);nextLocalQ(diff);}
    },800);
  },[showFb,problem,timeLeft,diff,streak,round,nextLocalQ]);

  // Online answer
  const handleOnlineAnswer=(option:number)=>{
    if(!gameState||gameState.status!=='active'||!curQ)return;
    const myAnswered=isP1?gameState.p1Answered:gameState.p2Answered;
    if(myAnswered)return;
    const ok=option===curQ.answer;
    const pts=ok?10:0;
    const updated=isP1
      ?{...gameState,p1Score:gameState.p1Score+pts,p1Answered:true}
      :{...gameState,p2Score:gameState.p2Score+pts,p2Answered:true};
    const bothDone=(isP1?gameState.p2Answered:gameState.p1Answered)||true;
    if(bothDone&&gameState.current+1>=TOTAL_Q){
      updateGameState({...updated,status:'finished'});
    } else if(bothDone){
      updateGameState({...updated,current:gameState.current+1,p1Answered:false,p2Answered:false});
    } else {
      updateGameState(updated);
    }
  };

  const startLocal=(d:Difficulty,mode:GameMode)=>{
    setDiff(d); setGameMode(mode);
    setScore(0);setRound(1);setCorrect(0);setGameOver(false);setStreak(0);setAiScore(0);
    nextLocalQ(d);
  };

  const startOnline=()=>{
    const qs=Array.from({length:TOTAL_Q},()=>generateProblem('medium'));
    updateGameState({...initialOnline,questions:qs,p2Email:'opponent',status:'active',mode:'vs-partner'});
  };

  if(!gameMode) return(
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20}/> Back</Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">🧮 Math Duel</h1>
          <div className="w-10"/>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <GameLobby
            gameName="Math Duel"
            gameIcon="🧮"
            gradient="from-green-500 to-teal-500"
            description="10 questions — fastest correct answer wins!"
            supportsSolo
            supportsAI
            aiLabels={{easy:'answers in ~10s, wrong 30%',medium:'answers in ~5s, wrong 10%',hard:'answers in 1.5s, never wrong'}}
            gameType="MathDuel"
            onStartSolo={()=>startLocal('medium','solo')}
            onStartVsAI={(d)=>{setAiDiff(d);startLocal(d,'vs-ai');}}
            onStartVsPartner={()=>{setGameMode('vs-partner');startOnline();}}
          />
        </div>
      </div>
    </div>
  );

  if(gameOver||gameState?.status==='finished'){
    const isOnline=gameMode==='vs-partner';
    const myFinal=isOnline?(isP1?gameState!.p1Score:gameState!.p2Score):score;
    const oppFinal=isOnline?(isP1?gameState!.p2Score:gameState!.p1Score):aiScore;
    return(
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{(!isOnline&&correct/TOTAL_Q>=.8)||myFinal>oppFinal?'🏆':myFinal===oppFinal?'🤝':'💪'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Duel Over!</h2>
          {gameMode==='vs-ai'&&<p className="text-gray-500 mb-6">{correct}/{TOTAL_Q} correct · AI scored {aiScore}</p>}
          {gameMode==='vs-partner'&&<p className="text-gray-500 mb-6">You: {myFinal} · Partner: {oppFinal}</p>}
          {gameMode==='solo'&&<p className="text-gray-500 mb-6">{correct}/{TOTAL_Q} correct · {diff} mode</p>}
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-green-600 dark:text-green-400">{myFinal}</p>
            <p className="text-gray-500 mt-1">Your Score</p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{setGameMode(null);setGameOver(false);}}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <RefreshCw size={18}/> Play Again
            </button>
            <Link to="/" className="flex-1 glass-btn text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <ArrowLeft size={18}/> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOnlineActive=gameMode==='vs-partner'&&gameState?.status==='active';
  const activeProblem=isOnlineActive?curQ:problem;
  const activeTimeLeft=isOnlineActive?null:timeLeft;
  const activeDiff=isOnlineActive?'medium':diff;
  const timerPct=activeTimeLeft?(activeTimeLeft/TIME_PER[activeDiff])*100:100;

  return(
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={()=>setGameMode(null)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20}/> Back</button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">🧮 Math Duel</h1>
          <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18}/><span className="font-bold">{isOnlineActive?(isP1?gameState?.p1Score:gameState?.p2Score):score}</span></div>
        </div>

        <div className="flex justify-center mb-4">
          <GameModeBadge mode={gameMode} difficulty={gameMode==='vs-ai'?aiDiff:undefined}/>
        </div>

        {gameMode==='vs-ai'&&<div className="glass-card p-3 mb-4 flex justify-around text-sm">
          <span>You: <strong>{score}</strong></span>
          <span>🤖 AI: <strong className={aiAnswered?'text-red-500':''}>{aiScore}</strong></span>
          {aiAnswered&&<span className="text-xs text-red-400">AI answered!</span>}
        </div>}

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">Q {isOnlineActive?gameState!.current+1:round}/{TOTAL_Q}</span>
            {streak>=2&&<span className="text-sm font-bold text-orange-500">🔥 {streak}x streak!</span>}
            {activeTimeLeft&&<span className={`font-bold text-lg ${activeTimeLeft<=3?'text-red-500 animate-pulse':'text-gray-600 dark:text-gray-400'}`}>{activeTimeLeft}s</span>}
          </div>
          {activeTimeLeft&&<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div className={`h-2 rounded-full transition-all ${timerPct>50?'bg-green-500':timerPct>25?'bg-yellow-500':'bg-red-500'}`} style={{width:`${timerPct}%`}}/>
          </div>}

          <div className="text-center py-8 mb-6">
            <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-wide">{activeProblem?.question}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {activeProblem?.options.map((option,i)=>{
              let style='glass-btn border-0 hover:ring-2 hover:ring-green-400';
              if(showFb&&!isOnlineActive){
                if(option===activeProblem.answer)style='bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500';
                else if(option===selected)style='bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500';
                else style='opacity-40 glass-btn border-0';
              }
              return(
                <button key={i}
                  onClick={()=>isOnlineActive?handleOnlineAnswer(option):handleLocalAnswer(option)}
                  disabled={showFb&&!isOnlineActive}
                  className={`${style} rounded-xl py-5 text-2xl font-bold text-gray-800 dark:text-white transition-all hover:scale-105 active:scale-95`}>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
