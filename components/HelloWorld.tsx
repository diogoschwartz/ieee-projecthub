import React from 'react';
import { GREETING_MESSAGE, WELCOME_SUBTEXT } from '../constants';

export const HelloWorld: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center space-y-8 p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:bg-white/10 hover:border-white/20">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <h1 className="relative text-7xl md:text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-emerald-200 drop-shadow-sm">
          {GREETING_MESSAGE}
        </h1>
      </div>
      
      <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
        {WELCOME_SUBTEXT}
      </p>

      <div className="pt-6">
        <button className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 active:scale-95">
          Get Started
        </button>
      </div>
    </div>
  );
};