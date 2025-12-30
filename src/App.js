/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, LogOut, Trash2, 
  Volume2, X, Eye, EyeOff, Edit3, 
  BookOpen, Trophy, Clock, Gamepad2, 
  Sparkles, Plus, RefreshCw, Key, Menu,
  SkipForward, StopCircle, Mic, Beaker,
  AlertTriangle, Power, Heart
} from 'lucide-react';
import logo from './logo.jpg'; 

// --- ANIMATION STYLES ---
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
  @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-shake { animation: shake 0.4s ease-in-out; }
  .animate-pop { animation: pop 0.3s ease-in-out; }
  .animate-slide-in { animation: slideIn 0.5s ease-out forwards; }
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
`;
document.head.appendChild(styleTag);

const App = () => {
  // --- SECURITY ---
  useEffect(() => {
    const handleContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, []);

  // --- VOICE ENGINE ---
  const [selectedVoice, setSelectedVoice] = useState(null);
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const profile = 
        available.find(v => v.name === 'Google UK English Female') || 
        available.find(v => v.name === 'Google US English') ||
        available.find(v => v.name.includes('Google') && v.name.includes('Female')) ||
        available.find(v => v.name.includes('Zira')) || 
        available.find(v => v.name.includes('Samantha')) ||
        available.find(v => v.name.includes('Female'));
      setSelectedVoice(profile || available[0]);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    if(!text) return;
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoice) u.voice = selectedVoice;
    u.pitch = 1.0; u.rate = 0.9; u.volume = 1; 
    window.speechSynthesis.speak(u);
  };

  // --- API URL ---
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'  
    : 'https://school-app-backend-d4fi.onrender.com/api'; 
    
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('login'); 
  const [adminTab, setAdminTab] = useState('students'); 
  const [teacherTab, setTeacherTab] = useState('test_control');
  const [showMobileMenu, setShowMobileMenu] = useState(false); 

  // DATABASE DATA
  const [classes, setClasses] = useState([]); 
  const [users, setUsers] = useState([]); 
  const [wordBank, setWordBank] = useState({}); 
  const [results, setResults] = useState([]); 
  const [activeSession, setActiveSession] = useState({ active: false }); 
  const [allSessions, setAllSessions] = useState([]); 

  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'student' });
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'student', class_id: '' });
  const [isAutoID, setIsAutoID] = useState(true); 
  const [newWordForm, setNewWordForm] = useState({ word: '', definition: '', synonyms: '', antonyms: '', usage: '', etymology: '' });
  const [editingWordId, setEditingWordId] = useState(null); 
    
  const [selectedClassForWords, setSelectedClassForWords] = useState('');
  const [adminSelectedTestClass, setAdminSelectedTestClass] = useState(''); 
  
  // Practice Config
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [practiceWordCount, setPracticeWordCount] = useState('10'); 

  const [loadingAI, setLoadingAI] = useState(false); 
  const [feedbackState, setFeedbackState] = useState(null); 
  // Added wordLimit to sessionConfig
  const [sessionConfig, setSessionConfig] = useState({ mode: 'test_standard', globalTimer: 60, timerPerWord: 0, wordLimit: 10 });
  const [testSessions, setTestSessions] = useState({}); 

  const [game, setGame] = useState({ 
    active: false, words: [], index: 0, score: 0, input: '', 
    mode: 'practice', gameType: 'spelling', timeLeft: 0,
    startTime: 0 
  });

  // --- DATA SYNCING ---
  const refreshData = () => {
      fetch(`${API_URL}/classes`)
        .then(r => { if(!r.ok) throw new Error("Err"); return r.json(); })
        .then(data => setClasses(data.map(d => d.name).sort()))
        .catch(e => console.log("Classes offline"));

      fetch(`${API_URL}/results`)
        .then(r => r.json())
        .then(setResults)
        .catch(e => console.log("Results offline"));

      if(currentUser?.role === 'admin') {
          fetch(`${API_URL}/users`).then(r => r.json()).then(setUsers).catch(e => console.log("Users offline"));
          fetch(`${API_URL}/sessions`).then(r => r.json()).then(setAllSessions).catch(console.error);
      }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('hms_user_session');
    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setActiveView(parsedUser.role === 'student' ? 'student_dash' : parsedUser.role === 'teacher' ? 'teacher_dash' : 'admin_dash');
    }
    refreshData();
  }, []);

  useEffect(() => {
      let poller;
      if (currentUser?.role === 'student' && activeView === 'student_dash') {
          poller = setInterval(() => {
              fetch(`${API_URL}/session/${currentUser.class_id}`)
                  .then(r => r.json())
                  .then(data => setActiveSession(data));
          }, 3000); 
      }
      if (currentUser?.role === 'admin' && activeView === 'admin_dash' && adminTab === 'monitor') {
         poller = setInterval(() => {
            fetch(`${API_URL}/sessions`).then(r => r.json()).then(setAllSessions);
         }, 3000);
      }
      return () => clearInterval(poller);
  }, [currentUser, activeView, adminTab]);

  useEffect(() => {
    if (currentUser) refreshData();
    const targetClass = currentUser?.class_id || selectedClassForWords || adminSelectedTestClass;
    if (targetClass) {
        fetch(`${API_URL}/words/${targetClass}`).then(r => r.json())
        .then(data => setWordBank(prev => ({...prev, [targetClass]: data})))
        .catch(console.error);
    }
  }, [currentUser, selectedClassForWords, adminSelectedTestClass]);

  // --- DICTIONARY ---
  const fetchRealDictionaryData = async () => {
    const word = newWordForm.word.trim();
    if(!word) return alert("Please type a word first!");
    setLoadingAI(true);
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!res.ok) throw new Error("Word not found");
        const data = await res.json();
        const entry = data[0];
        const meaning = entry.meanings[0];
        setNewWordForm(prev => ({
            ...prev,
            definition: meaning.definitions[0]?.definition || "Definition not found.",
            usage: meaning.definitions.find(d => d.example)?.example || `Please use "${word}" in a sentence.`,
            synonyms: meaning.synonyms.slice(0, 3).join(", ") || "None found",
            antonyms: meaning.antonyms.slice(0, 3).join(", ") || "None found",
            etymology: entry.origin || `Origin of ${word}`
        }));
    } catch (error) {
        alert("⚠️ Word not found in global dictionary. Please fill manually.");
    } finally {
        setLoadingAI(false);
    }
  };

  // --- USER MGMT ---
  const handleResetPassword = async (userId, userName) => {
      const newPass = prompt(`Enter NEW Password for ${userName}:`);
      if (!newPass) return;
      try {
          await fetch(`${API_URL}/users/${userId}/reset-password`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPassword: newPass })
          });
          alert(`Success! Password updated.`);
      } catch (e) { alert("Server Error."); }
  };

  const handleDeleteUser = async (userId, userName) => {
      if(!window.confirm(`Delete ${userName}?`)) return;
      try {
          const res = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
          if(res.ok) setUsers(prev => prev.filter(u => u._id !== userId));
      } catch(e) { alert("Connection Error."); }
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.password) return alert("All fields required");
    try {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...userForm, role: adminTab.slice(0,-1) }) 
        });
        if (res.ok) {
            alert("User Saved!");
            setUserForm({ name: '', username: '', password: '', role: 'student', class_id: '' });
            refreshData(); 
        } else alert("Save Failed.");
    } catch (e) { alert("Connection Error."); }
  };

  const handleLogin = async () => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin') {
      const masterUser = { _id: 'master', role: 'admin', name: 'Master Admin' };
      setCurrentUser(masterUser);
      localStorage.setItem('hms_user_session', JSON.stringify(masterUser));
      setActiveView('admin_dash');
      refreshData();
      return;
    }
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginForm)
        });
        const data = await response.json();
        if (response.ok) {
            setCurrentUser(data);
            localStorage.setItem('hms_user_session', JSON.stringify(data));
            setActiveView(data.role === 'student' ? 'student_dash' : data.role === 'teacher' ? 'teacher_dash' : 'admin_dash');
            setLoginForm({ username: '', password: '', role: 'student' });
            refreshData();
        } else alert("Login Failed: " + data.message);
    } catch (error) { alert("Server Error."); }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setActiveView('login');
      localStorage.removeItem('hms_user_session');
  };

  const handleAddClass = async () => {
      const name = prompt("Enter new Class Name (e.g., Year 7):");
      if(!name) return;
      try {
        const res = await fetch(`${API_URL}/classes`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name })
        });
        if(res.ok) refreshData(); else alert(`Error`);
      } catch (error) { alert("Connection Failed."); }
  };
    
  const handleDeleteClass = async (name) => {
      if(!window.confirm(`Delete ${name}?`)) return;
      try {
        const all = await fetch(`${API_URL}/classes`).then(r => r.json());
        const target = all.find(c => c.name === name);
        if(target) {
            await fetch(`${API_URL}/classes/${target._id}`, { method: 'DELETE' });
            refreshData();
        }
      } catch (error) { alert("Server Error."); }
  };

  // --- WORD MGMT ---
  const startEditingWord = (wordObj) => {
      setNewWordForm({
          word: wordObj.word, definition: wordObj.definition, synonyms: wordObj.synonyms,
          antonyms: wordObj.antonyms, usage: wordObj.usage, etymology: wordObj.etymology
      });
      setEditingWordId(wordObj._id); 
      document.querySelector('.animate-in')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditing = () => {
      setEditingWordId(null);
      setNewWordForm({ word: '', definition: '', synonyms: '', antonyms: '', usage: '', etymology: '' });
  };

  const handleSaveWord = async (targetClass, source) => {
    if (!targetClass || !newWordForm.word) return alert("Select Class & Word");
    const entry = { ...newWordForm, class_id: targetClass, source };
    try {
        let res;
        const url = editingWordId ? `${API_URL}/words/${editingWordId}` : `${API_URL}/words`;
        const method = editingWordId ? 'PUT' : 'POST';
        res = await fetch(url, {
            method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry)
        });
        if (res.ok) {
            const savedWord = await res.json();
            setWordBank(prev => {
                const currentList = prev[targetClass] || [];
                return editingWordId 
                    ? { ...prev, [targetClass]: currentList.map(w => w._id === editingWordId ? savedWord : w) }
                    : { ...prev, [targetClass]: [...currentList, savedWord] };
            });
            setNewWordForm({ word: '', definition: '', synonyms: '', antonyms: '', usage: '', etymology: '' });
            setEditingWordId(null);
            alert("Success!");
        }
    } catch (e) { alert("Failed to save word"); }
  };

  const handleDeleteWord = async (targetClass, id, userRole) => {
      const word = wordBank[targetClass].find(w => w._id === id);
      if (userRole === 'teacher' && word.source === 'admin') return alert("Permission Denied.");
      try {
          await fetch(`${API_URL}/words/${id}`, { method: 'DELETE' });
          setWordBank(prev => ({ ...prev, [targetClass]: prev[targetClass].filter(w => w._id !== id) }));
      } catch (e) { alert("Failed to delete word"); }
  };

  // --- LIVE EXAM CONTROL ---
  const updateSession = async (targetClass, isActive) => {
      await fetch(`${API_URL}/session`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_id: targetClass, active: isActive, ...sessionConfig })
      });
      setTestSessions(prev => ({ ...prev, [targetClass]: { active: isActive, ...sessionConfig } }));
      if(currentUser.role === 'admin') {
         fetch(`${API_URL}/sessions`).then(r => r.json()).then(setAllSessions);
      }
      if(isActive) alert("Test Started!");
  };

  // --- GAME LOGIC ---
  const startSession = (origin) => {
    const myClass = currentUser.class_id;
    let words = wordBank[myClass] || [];
    if (words.length === 0) return alert("No words found.");

    let mode, gameType, timer;
    let sessionWords = [];

    if (origin === 'test_live') {
        if (!activeSession.active) return alert("Test Locked");
        mode = activeSession.mode; 
        gameType = mode.includes('rush') ? 'spelling' : (mode.split('_')[1] || 'spelling');
        timer = mode === 'test_rush' ? activeSession.globalTimer : activeSession.timerPerWord;
        
        sessionWords = words.filter(w => w.source === 'admin'); 
        sessionWords = sessionWords.sort(() => 0.5 - Math.random());
        // Use teacher defined word limit
        const limit = activeSession.wordLimit === 999 ? sessionWords.length : activeSession.wordLimit;
        sessionWords = sessionWords.slice(0, limit || 10);
        
        if (sessionWords.length === 0) return alert("No approved test words available.");
    } else if (origin === 'practice') {
        mode = 'practice'; gameType = 'spelling'; timer = practiceTimer;
        sessionWords = words.filter(w => w.source === 'admin' || w.source === 'teacher');
        sessionWords = sessionWords.sort(() => 0.5 - Math.random());
        const limit = practiceWordCount === 'all' ? sessionWords.length : parseInt(practiceWordCount);
        sessionWords = sessionWords.slice(0, limit);
        if (sessionWords.length === 0) return alert("Not enough words available.");
    } else {
        mode = 'fun'; gameType = origin; timer = 0;
        sessionWords = words.filter(w => w.source === 'admin' || w.source === 'teacher');
        sessionWords = sessionWords.sort(() => 0.5 - Math.random()).slice(0, 10);
    }

    setGame({
      active: true, words: sessionWords,
      index: 0, score: 0, input: '', mode, gameType, 
      timeLeft: timer, startTime: Date.now()
    });
    setActiveView('game_interface');
  };

  const submitWord = (overrideInput = null) => {
    const currentWord = game.words[game.index];
    let isCorrect = false;

    // 1. Determine Correctness
    if (overrideInput === 'skip' || overrideInput === 'timeout') {
        isCorrect = false;
    } else if (typeof overrideInput === 'boolean') {
        // Direct boolean from Quiz/Origin buttons
        isCorrect = overrideInput; 
    } else {
        // String input from Text Box
        const cleanInput = (overrideInput || game.input).trim().toLowerCase();
        const cleanWord = currentWord.word.toLowerCase();
        if (game.gameType === 'quiz') isCorrect = false; // Should use boolean path
        else if (game.gameType === 'origin') isCorrect = false; // Should use boolean path
        else isCorrect = cleanInput === cleanWord;
    }
    
    // 2. Feedback Animation
    setFeedbackState(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setFeedbackState(null), 500);

    if (game.mode === 'practice' || game.mode === 'fun') speak(isCorrect ? "Correct!" : "Incorrect");

    // 3. Score & Progress
    const nextScore = isCorrect ? game.score + 1 : game.score;
    const nextIdx = game.index + 1;

    if (nextIdx >= game.words.length) {
        finishGame(nextScore);
    } else {
        let nextTime = 0;
        if (game.mode.includes('test')) {
            nextTime = game.mode === 'test_rush' ? game.timeLeft : activeSession.timerPerWord;
        } else {
            nextTime = practiceTimer;
        }

        setGame(prev => ({ 
            ...prev, index: nextIdx, score: nextScore, input: '', timeLeft: nextTime 
        }));
        
        if(game.gameType === 'spelling') setTimeout(() => speak(game.words[nextIdx].word), 800);
    }
  };

  const finishGame = async (finalScore) => {
    // FORCE END: Calculate exact time used so far
    const totalTime = (Date.now() - game.startTime) / 1000; 
    setGame(prev => ({...prev, active: false}));

    if (game.mode.includes('test')) {
        await fetch(`${API_URL}/results`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                student: currentUser.name, class_id: currentUser.class_id, score: finalScore, 
                total: game.words.length, mode: game.mode, date: new Date().toLocaleString(),
                timeTaken: totalTime
            })
        });
        setResults(prev => [...prev, {
            student: currentUser.name, class: currentUser.class_id, score: finalScore, 
            total: game.words.length, mode: game.mode, date: new Date().toLocaleString(),
            timeTaken: totalTime
        }]);
    }
    // Only alert if natural finish, otherwise just exit for "Stop" button
    if (finalScore !== undefined) alert(`Complete! Score: ${finalScore}/${game.words.length}`);
    setActiveView('student_dash');
  };

  useEffect(() => {
    let interval;
    if (game.active && game.timeLeft > 0) {
      interval = setInterval(() => {
        setGame(prev => {
          if (prev.timeLeft <= 1) {
             if (prev.mode === 'test_rush') { finishGame(prev.score); return { ...prev, active: false }; } 
             else { submitWord('timeout'); return { ...prev, timeLeft: 0 }; }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [game.active, game.timeLeft]);

  const currentWord = game.words[game.index];
  
  // FIX: Quiz Options Logic (Always 4 Options)
  const quizOptions = useMemo(() => {
    if (!currentWord || (game.gameType !== 'quiz' && game.gameType !== 'origin')) return [];
    
    const field = game.gameType === 'quiz' ? 'definition' : 'etymology';
    const correctAnswer = currentWord[field];

    // Filter out current word
    const pool = game.words.filter(w => w._id !== currentWord._id);
    
    // Shuffle pool and take 3
    const detractors = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Combine
    const options = [
        { text: correctAnswer, isCorrect: true },
        ...detractors.map(w => ({ text: w[field] || "N/A", isCorrect: false }))
    ];

    // Shuffle final options
    return options.sort(() => Math.random() - 0.5);
  }, [currentWord, game.gameType, game.words.length]);

  const Leaderboard = ({ type, data }) => {
      const sorted = [...data].sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.timeTaken || 9999) - (b.timeTaken || 9999);
      });

      return (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 mb-6">
              <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> {type} Leaderboard</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-yellow-50 text-yellow-900"><tr><th className="p-2">Rank</th><th className="p-2">Name</th><th className="p-2">Score</th><th className="p-2">Time</th></tr></thead>
                    <tbody>
                        {sorted.map((r, i) => (
                            <tr key={i} className={`border-b ${i===0?'bg-yellow-50 font-bold':''}`}><td className="p-2">#{i+1}</td><td className="p-2">{r.student} {type==='School' && <span className="text-xs text-gray-400">({r.class_id})</span>}</td><td className="p-2 text-green-600">{r.score}/{r.total}</td><td className="p-2 text-gray-500">{r.timeTaken ? `${Math.round(r.timeTaken)}s` : 'N/A'}</td></tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      );
  };

  const BackgroundBees = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float delay-100">🐝</div>
        <div className="absolute bottom-20 right-20 text-5xl opacity-20 animate-float delay-200">🐝</div>
    </div>
  );
  
  const WelcomeCard = ({ title, message, color }) => (
      <div className={`p-6 rounded-2xl mb-6 flex items-start gap-4 shadow-sm border-l-8 border-${color}-500 bg-white`}>
          <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}><Heart fill="currentColor" size={24}/></div>
          <div><h2 className={`text-xl font-bold text-${color}-900 mb-1`}>{title}</h2><p className="text-gray-600 leading-relaxed">{message}</p></div>
      </div>
  );

  // --- VIEWS ---
  if (activeView === 'login') return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden bg-gradient-to-b from-yellow-100 to-green-100">
        <BackgroundBees />
        <div className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-md border-4 border-white relative z-10 animate-slide-in">
            <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-white overflow-hidden transform hover:scale-110 transition-transform relative mx-auto animate-pop">
                   <img src={logo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                   <div className="hidden absolute inset-0 items-center justify-center text-6xl animate-bounce z-0">👑🐝</div>
                </div>
                <h2 className="text-green-700 font-bold tracking-widest uppercase mb-2 text-center text-sm">His Mercy Private School</h2>
                <h1 className="text-4xl font-black text-yellow-500 text-center uppercase tracking-tighter drop-shadow-sm">Un<span className="text-6xl inline-block align-middle hover:scale-125 transition-transform animate-float">🐝</span>lievable<br/><span className="text-2xl text-green-800">Spellings</span></h1>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-full mb-6 shadow-inner">
                {['student', 'teacher', 'admin'].map(r => (
                    <button key={r} onClick={() => setLoginForm({...loginForm, role: r})}
                        className={`flex-1 py-3 rounded-full font-black text-sm capitalize transition-all duration-300 ${loginForm.role === r ? 'bg-yellow-400 text-yellow-900 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                        {r}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                <div className="relative group"><User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20}/><input type="text" placeholder="Username" className="w-full bg-gray-50 border-2 border-gray-100 pl-12 p-3 rounded-2xl font-bold outline-none focus:border-yellow-400 focus:bg-white transition-all text-gray-700" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} /></div>
                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-yellow-500 pointer-events-none"><Key size={20}/></div>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full bg-gray-50 border-2 border-gray-100 pl-12 p-3 rounded-2xl font-bold outline-none focus:border-yellow-400 focus:bg-white transition-all text-gray-700" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-green-600">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                </div>
                <button onClick={handleLogin} className="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-wide">ENTER THE HIVE 🐝</button>
            </div>
        </div>
      </div>
  );

  if (activeView === 'admin_dash') {
    const filteredUsers = users.filter(u => u.role === adminTab.slice(0, -1));
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col font-sans">
        <header className="bg-white border-b border-yellow-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-2">
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden text-yellow-900 p-2 rounded hover:bg-yellow-100"><Menu size={24}/></button>
                <img src={logo} alt="Logo" className="w-10 h-10 rounded-full border border-yellow-400" onError={(e) => {e.target.onerror = null; e.target.src="https://cdn-icons-png.flaticon.com/512/3413/3413535.png"}}/><h1 className="text-xl font-black text-yellow-900 flex items-center">Un<span className="text-3xl mx-1 hover:rotate-12 transition-transform">🐝</span>lievable</h1>
            </div>
            <button onClick={handleLogout} className="text-red-500 font-bold flex gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition"><LogOut size={18}/> Exit</button>
        </header>
        <div className="flex flex-1 overflow-hidden relative">
            {showMobileMenu && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowMobileMenu(false)}></div>}
            <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-yellow-200 p-4 flex flex-col gap-2 shadow-2xl transform transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:shadow-none md:z-0`}>
                <div className="flex justify-between items-center mb-4 md:hidden"><span className="font-bold text-yellow-900 text-lg">Menu</span><button onClick={() => setShowMobileMenu(false)} className="text-gray-500 p-2"><X size={24}/></button></div>
                {['students', 'teachers', 'classes', 'curriculum', 'exam_control', 'monitor', 'results'].map(tab => (
                    <button key={tab} onClick={() => { setAdminTab(tab); setShowMobileMenu(false); }} className={`w-full text-left p-3 rounded-xl font-bold capitalize transition-all ${adminTab === tab ? 'bg-yellow-400 text-yellow-900 shadow-md translate-x-2' : 'text-gray-500 hover:bg-yellow-50 hover:translate-x-1'}`}>{tab.replace('_', ' ')}</button>
                ))}
            </nav>
            <main className="flex-1 p-8 overflow-y-auto w-full animate-slide-in">
                {/* WELCOME MESSAGE */}
                <WelcomeCard title="Welcome, Admin!" message="You have full control over the hive. Manage users, curate the curriculum, and monitor live tests to ensure everything runs smoothly. Your leadership makes a difference!" color="yellow"/>
                
                {['students', 'teachers'].includes(adminTab) && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100">
                           <h2 className="font-bold text-lg text-yellow-900 mb-4">Add New {adminTab.slice(0, -1)}</h2>
                           <div className="grid md:grid-cols-3 gap-4 mb-4">
                               <input placeholder="Full Name" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="bg-yellow-50 p-3 rounded-xl outline-none focus:ring-2 ring-yellow-400 transition-all"/>
                               <select value={userForm.class_id} onChange={e => setUserForm({...userForm, class_id: e.target.value})} className="bg-yellow-50 p-3 rounded-xl outline-none focus:ring-2 ring-yellow-400"><option value="">-- Class --</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                               <div className="flex items-center gap-2">
                                   <button onClick={() => setIsAutoID(!isAutoID)} className={`p-3 rounded-xl font-bold border-2 ${isAutoID ? 'bg-yellow-100 border-yellow-400 text-yellow-900' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>{isAutoID ? 'Auto' : 'Manual'}</button>
                                   {isAutoID && <button onClick={() => { if (!userForm.name) return alert("Name needed!"); const rnd = Math.floor(Math.random()*900)+100; const clean = userForm.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g,''); setUserForm(prev => ({...prev, username: `HMS-${clean}-${rnd}`, password: `${clean}@${rnd}`})); }} className="bg-green-100 text-green-800 font-bold rounded-xl flex items-center justify-center px-4 hover:bg-green-200 hover:scale-110 transition-transform"><RefreshCw size={18}/></button>}
                               </div>
                           </div>
                           <div className="grid md:grid-cols-2 gap-4 mb-4">
                               <input placeholder="Username" value={userForm.username} onChange={e => !isAutoID && setUserForm({...userForm, username: e.target.value})} readOnly={isAutoID} className="bg-gray-100 p-3 rounded-xl"/>
                               <input placeholder="Password" value={userForm.password} onChange={e => !isAutoID && setUserForm({...userForm, password: e.target.value})} readOnly={isAutoID} className="bg-gray-100 p-3 rounded-xl"/>
                           </div>
                           <button onClick={handleSaveUser} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 transform active:scale-95 transition-all">SAVE USER</button>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 overflow-x-auto">
                           {filteredUsers.length > 0 ? (
                               <table className="w-full text-left min-w-[600px]"><thead className="bg-yellow-50"><tr><th className="p-3">Name</th><th className="p-3">Class</th><th className="p-3">User</th><th className="p-3">Act</th></tr></thead><tbody>{filteredUsers.map(u => (<tr key={u._id} className="border-b hover:bg-yellow-50 transition-colors"><td className="p-3">{u.name}</td><td className="p-3">{u.class_id}</td><td className="p-3 font-mono">{u.username}</td><td className="p-3 flex gap-2"><button onClick={() => handleResetPassword(u._id, u.name)} className="bg-blue-100 text-blue-600 p-2 rounded hover:scale-110 transition-transform"><Key size={16}/></button><button onClick={() => handleDeleteUser(u._id, u.name)} className="bg-red-100 text-red-600 p-2 rounded hover:scale-110 transition-transform"><Trash2 size={16}/></button></td></tr>))}</tbody></table>
                           ) : <div className="text-center p-8 text-gray-500">No users found.</div>}
                        </div>
                    </div>
                )}
                {adminTab === 'classes' && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 max-w-lg">
                        <div className="flex gap-2 mb-6"><button onClick={handleAddClass} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow hover:bg-green-600 flex justify-center items-center gap-2 transform active:scale-95 transition-all"><Plus/> Add New Class</button></div>
                        <div className="space-y-2">{classes.map(c => <div key={c} className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl font-bold border border-yellow-100 text-yellow-900 shadow-sm hover:scale-105 transition-transform">{c} <button onClick={() => handleDeleteClass(c)} className="text-red-400 hover:text-red-600"><Trash2/></button></div>)}</div>
                    </div>
                )}
                {adminTab === 'curriculum' && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100">
                        <select value={selectedClassForWords} onChange={e => setSelectedClassForWords(e.target.value)} className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-xl font-bold mb-6 text-yellow-900 outline-none focus:ring-2 ring-yellow-400"><option value="">-- Select Class --</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        {selectedClassForWords && (
                            <div className="animate-slide-in">
                                <div className={`p-4 rounded-2xl mb-6 ${editingWordId ? 'bg-orange-50 border-2 border-orange-200' : ''}`}>
                                    <div className="flex gap-2 mb-4">
                                        <input placeholder="Type Word..." value={newWordForm.word} onChange={e => setNewWordForm({...newWordForm, word: e.target.value})} className="flex-1 bg-white border-2 border-yellow-100 p-3 rounded-xl text-lg font-bold outline-none focus:border-yellow-400"/>
                                        <button onClick={fetchRealDictionaryData} disabled={loadingAI} className="bg-purple-100 text-purple-700 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-200 disabled:opacity-50">{loadingAI ? <RefreshCw className="animate-spin"/> : <Sparkles/>} Auto</button>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                                        <textarea placeholder="Definition" value={newWordForm.definition} onChange={e => setNewWordForm({...newWordForm, definition: e.target.value})} className="bg-gray-50 p-3 rounded-xl resize-none h-24"/>
                                        <textarea placeholder="Usage" value={newWordForm.usage} onChange={e => setNewWordForm({...newWordForm, usage: e.target.value})} className="bg-gray-50 p-3 rounded-xl resize-none h-24"/>
                                        <input placeholder="Synonyms" value={newWordForm.synonyms} onChange={e => setNewWordForm({...newWordForm, synonyms: e.target.value})} className="bg-gray-50 p-3 rounded-xl"/>
                                        <input placeholder="Antonyms" value={newWordForm.antonyms} onChange={e => setNewWordForm({...newWordForm, antonyms: e.target.value})} className="bg-gray-50 p-3 rounded-xl"/>
                                        <input placeholder="Origin" value={newWordForm.etymology} onChange={e => setNewWordForm({...newWordForm, etymology: e.target.value})} className="bg-gray-50 p-3 rounded-xl md:col-span-2"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSaveWord(selectedClassForWords, 'admin')} className={`flex-1 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all ${editingWordId ? 'bg-orange-500' : 'bg-green-500 hover:bg-green-600'}`}>{editingWordId ? 'UPDATE' : 'ADD'}</button>
                                        {editingWordId && <button onClick={cancelEditing} className="bg-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-gray-600">CANCEL</button>}
                                    </div>
                                </div>
                                <div className="space-y-2">{(wordBank[selectedClassForWords] || []).filter(w=>w.source==='admin').map(w => (<div key={w._id} className="flex justify-between items-center bg-yellow-50 p-3 rounded-xl border border-yellow-100 hover:scale-[1.01] transition-transform"><div><span className="font-bold text-yellow-900">{w.word}</span><p className="text-xs text-yellow-700 truncate w-64">{w.definition}</p></div><div className="flex gap-2"><button onClick={() => startEditingWord(w)} className="bg-blue-100 text-blue-600 p-2 rounded hover:scale-110 transition-transform"><Edit3 size={16}/></button><button onClick={() => handleDeleteWord(selectedClassForWords, w._id, 'admin')} className="bg-white text-red-400 p-2 rounded hover:scale-110 transition-transform"><Trash2 size={16}/></button></div></div>))}</div>
                            </div>
                        )}
                    </div>
                )}
                {adminTab === 'exam_control' && (
                    <div className="bg-white p-8 rounded-3xl shadow-lg border-b-8 border-red-500">
                        <select className="w-full p-4 bg-red-50 rounded-xl font-bold text-lg mb-6" value={adminSelectedTestClass} onChange={e => setAdminSelectedTestClass(e.target.value)}><option value="">-- Select Target Class --</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        {adminSelectedTestClass && (
                            <div className="animate-slide-in">
                                <div className="grid md:grid-cols-3 gap-6 mb-6">
                                    <div><label className="block font-bold mb-2">Mode</label><select className="w-full p-3 border rounded-lg" value={sessionConfig.mode} onChange={e => setSessionConfig({...sessionConfig, mode: e.target.value})}><option value="test_standard">Standard</option><option value="test_rush">Rush Hour</option><option value="test_unscramble">Unscramble</option><option value="test_quiz">Quiz</option></select></div>
                                    <div><label className="block font-bold mb-2">Timer</label>{sessionConfig.mode === 'test_rush' ? <input type="number" className="w-full p-3 border rounded-lg" value={sessionConfig.globalTimer} onChange={e=>setSessionConfig({...sessionConfig, globalTimer: parseInt(e.target.value)})}/> : <input type="number" className="w-full p-3 border rounded-lg" value={sessionConfig.timerPerWord} onChange={e=>setSessionConfig({...sessionConfig, timerPerWord: parseInt(e.target.value)})}/>}</div>
                                    {/* UPDATED: Test Word Limit */}
                                    <div><label className="block font-bold mb-2">Test Words</label><select className="w-full p-3 border rounded-lg" value={sessionConfig.wordLimit} onChange={e=>setSessionConfig({...sessionConfig, wordLimit: parseInt(e.target.value)})}>
                                        <option value="10">10 Words</option><option value="20">20 Words</option><option value="50">50 Words</option><option value="100">100 Words</option><option value="999">All Words</option>
                                    </select></div>
                                </div>
                                <button onClick={() => updateSession(adminSelectedTestClass, !activeSession.active)} className={`w-full py-6 rounded-2xl font-black text-2xl shadow-xl transform active:scale-95 transition-all ${testSessions[adminSelectedTestClass]?.active ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white hover:bg-green-700'}`}>{testSessions[adminSelectedTestClass]?.active ? 'STOP CLASS TEST' : 'START CLASS TEST'}</button>
                            </div>
                        )}
                    </div>
                )}
                {/* UPDATED: Monitor now iterates CLASSES to avoid ghost tests */}
                {adminTab === 'monitor' && (
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-yellow-200">
                        <h2 className="text-2xl font-black mb-6 text-red-600 flex items-center gap-2"><AlertTriangle/> Live Test Monitor</h2>
                        <div className="grid gap-4">
                            {classes.map(clsName => {
                                const activeSess = allSessions.find(s => s.class_id === clsName && s.active);
                                return (
                                    <div key={clsName} className={`flex justify-between items-center p-4 rounded-xl border ${activeSess ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-gray-50 border-gray-100'}`}>
                                        <div>
                                            <h3 className={`text-xl font-black ${activeSess ? 'text-red-900' : 'text-gray-400'}`}>{clsName}</h3>
                                            <p className="text-xs font-bold uppercase">{activeSess ? `ACTIVE: ${activeSess.mode}` : 'INACTIVE'}</p>
                                        </div>
                                        {activeSess ? (
                                            <button onClick={() => updateSession(clsName, false)} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-red-700 flex items-center gap-2">
                                                <Power size={20}/> FORCE STOP
                                            </button>
                                        ) : <span className="text-gray-300 font-bold">Idle</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {adminTab === 'results' && (
                    <div className="space-y-4">
                        <Leaderboard type="School" data={results} />
                        {classes.map(cls => {
                            const clsResults = results.filter(r => r.class_id === cls);
                            if(clsResults.length === 0) return null;
                            return <Leaderboard key={cls} type={cls} data={clsResults} />
                        })}
                    </div>
                )}
            </main>
        </div>
      </div>
    );
  }

  // --- TEACHER VIEW ---
  if (activeView === 'teacher_dash') {
    const cls = currentUser.class_id;
    const session = testSessions[cls] || {};
    return (
        <div className="min-h-screen bg-green-50 p-6 font-sans">
            <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-4"><img src={logo} alt="Logo" className="w-12 h-12 rounded-full border-2 border-white" onError={(e) => {e.target.onerror = null; e.target.src="https://cdn-icons-png.flaticon.com/512/3413/3413535.png"}}/><h1 className="text-2xl font-black text-green-900">Teacher <span className="text-yellow-500">{cls}</span></h1></div>
                <button onClick={handleLogout} className="bg-white text-red-500 px-6 py-2 rounded-full font-bold shadow-sm">Logout</button>
            </header>
            <div className="flex justify-center gap-4 mb-8">
                <button onClick={() => setTeacherTab('test_control')} className={`px-6 py-2 rounded-full font-bold transition ${teacherTab === 'test_control' ? 'bg-green-600 text-white' : 'bg-white text-gray-500'}`}>Test Control</button>
                <button onClick={() => setTeacherTab('word_jar')} className={`px-6 py-2 rounded-full font-bold transition ${teacherTab === 'word_jar' ? 'bg-green-600 text-white' : 'bg-white text-gray-500'}`}>Word Jar</button>
                <button onClick={() => setTeacherTab('results')} className={`px-6 py-2 rounded-full font-bold transition ${teacherTab === 'results' ? 'bg-green-600 text-white' : 'bg-white text-gray-500'}`}>Results</button>
            </div>
            <div className="max-w-4xl mx-auto grid gap-6 animate-slide-in">
                
                {/* WELCOME MESSAGE */}
                <WelcomeCard title={`Hello, Teacher ${currentUser.name.split(' ')[0]}!`} message="Ready to inspire your students? Manage your class test settings, add practice words to your jar, and track progress here. Let's make learning spelling fun!" color="green"/>
                
                {teacherTab === 'test_control' && (
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border-b-8 border-green-600">
                    <h3 className="text-2xl font-black mb-6 text-green-800 flex items-center gap-2"><Trophy className="text-yellow-500"/> Class Control</h3>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                         <div><label className="font-bold block mb-2">Mode</label><select className="w-full p-3 bg-gray-50 rounded-xl" value={sessionConfig.mode} onChange={e => setSessionConfig({...sessionConfig, mode: e.target.value})}><option value="test_standard">Standard</option><option value="test_rush">Rush Hour</option><option value="test_unscramble">Unscramble</option><option value="test_quiz">Quiz</option></select></div>
                         <div><label className="font-bold block mb-2">Timer</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl" value={sessionConfig.mode === 'test_rush' ? sessionConfig.globalTimer : sessionConfig.timerPerWord} onChange={e=>setSessionConfig(prev => sessionConfig.mode === 'test_rush' ? {...prev, globalTimer: parseInt(e.target.value)} : {...prev, timerPerWord: parseInt(e.target.value)})}/></div>
                         {/* UPDATED: Test Word Limit */}
                         <div><label className="font-bold block mb-2">Limit</label><select className="w-full p-3 bg-gray-50 rounded-xl" value={sessionConfig.wordLimit} onChange={e=>setSessionConfig({...sessionConfig, wordLimit: parseInt(e.target.value)})}>
                            <option value="10">10 Words</option><option value="20">20 Words</option><option value="50">50 Words</option><option value="100">100 Words</option><option value="999">All Words</option>
                         </select></div>
                  </div>
                  <button onClick={() => updateSession(currentUser.class_id, !session.active)} className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 ${session.active ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                      {session.active ? 'STOP TEST' : 'START TEST'}
                  </button>
              </div>
              )}
              {teacherTab === 'word_jar' && (
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-purple-700"><Beaker/> Practice Word Jar</h3>
                    <p className="mb-4 text-sm text-gray-500 bg-gray-50 p-2 rounded">Words added here are for <b>Practice Mode Only</b>. They will not appear in official tests.</p>
                    <div className="p-4 rounded-2xl mb-6 bg-purple-50 border-2 border-purple-100">
                        <div className="flex gap-2 mb-4">
                            <input placeholder="Type Word..." value={newWordForm.word} onChange={e => setNewWordForm({...newWordForm, word: e.target.value})} className="flex-1 bg-white border-2 border-purple-100 p-3 rounded-xl text-lg font-bold outline-none focus:border-purple-400"/>
                            <button onClick={fetchRealDictionaryData} disabled={loadingAI} className="bg-white text-purple-700 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-100 disabled:opacity-50">{loadingAI ? <RefreshCw className="animate-spin"/> : <Sparkles/>} Auto</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                            <textarea placeholder="Definition" value={newWordForm.definition} onChange={e => setNewWordForm({...newWordForm, definition: e.target.value})} className="bg-white p-3 rounded-xl resize-none h-24"/>
                            <textarea placeholder="Usage" value={newWordForm.usage} onChange={e => setNewWordForm({...newWordForm, usage: e.target.value})} className="bg-white p-3 rounded-xl resize-none h-24"/>
                            <input placeholder="Synonyms" value={newWordForm.synonyms} onChange={e => setNewWordForm({...newWordForm, synonyms: e.target.value})} className="bg-white p-3 rounded-xl"/>
                            <input placeholder="Antonyms" value={newWordForm.antonyms} onChange={e => setNewWordForm({...newWordForm, antonyms: e.target.value})} className="bg-white p-3 rounded-xl"/>
                            <input placeholder="Origin" value={newWordForm.etymology} onChange={e => setNewWordForm({...newWordForm, etymology: e.target.value})} className="bg-white p-3 rounded-xl md:col-span-2"/>
                        </div>
                        <button onClick={() => handleSaveWord(currentUser.class_id, 'teacher')} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-700">ADD TO JAR</button>
                    </div>
                    <div className="space-y-2">
                         {(wordBank[currentUser.class_id] || []).filter(w => w.source === 'teacher').map(w => (
                             <div key={w._id} className="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-100">
                                 <div><span className="font-bold text-purple-900">{w.word}</span></div>
                                 <button onClick={() => handleDeleteWord(currentUser.class_id, w._id, 'teacher')} className="bg-white text-red-400 p-2 rounded hover:scale-110"><Trash2 size={16}/></button>
                             </div>
                         ))}
                    </div>
                 </div>
              )}
              {teacherTab === 'results' && (
                  <div className="space-y-4">
                      <Leaderboard type={currentUser.class_id} data={results.filter(r => r.class_id === currentUser.class_id)} />
                  </div>
              )}
          </div>
      </div>
    );
  }

  if (activeView === 'student_dash') return (
      <div className="min-h-screen bg-yellow-50 p-6 flex flex-col items-center font-sans overflow-hidden relative">
        <BackgroundBees />
        <header className="w-full max-w-2xl flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4"><img src={logo} alt="Logo" className="w-14 h-14 rounded-full border-4 border-white shadow-md animate-pop" onError={(e) => {e.target.onerror = null; e.target.src="https://cdn-icons-png.flaticon.com/512/3413/3413535.png"}}/><div className="leading-tight"><h1 className="text-2xl font-black text-green-900">Hi, {currentUser.name.split(' ')[0]}!</h1><p className="text-yellow-600 font-bold tracking-widest text-xs uppercase">Student • {currentUser.class_id}</p></div></div>
            <button onClick={handleLogout} className="bg-white text-red-500 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-red-50">Log Out</button>
        </header>
        <div className="grid gap-6 w-full max-w-md relative z-10 animate-slide-in">
            
            {/* WELCOME MESSAGE */}
            <WelcomeCard title="Ready to Spell?" message="Study hard, play games, and show off your skills! Select practice mode to warm up or wait for your teacher to start a test. You've got this!" color="blue"/>

            <div className="bg-white p-6 rounded-[2rem] shadow-lg border-b-8 border-green-500 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute -right-4 -top-4 text-green-100 opacity-50 group-hover:scale-110 transition-transform"><BookOpen size={100}/></div>
                <h2 className="text-2xl font-black text-green-800 relative z-10">Practice Mode</h2>
                <div className="mt-4 flex flex-col gap-2 relative z-10">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Clock size={16} className="text-green-600"/><span className="font-bold text-sm text-green-800">Timer</span></div><select className="bg-green-50 rounded-lg p-2 text-sm font-bold text-green-800 outline-none" value={practiceTimer} onChange={e => setPracticeTimer(parseInt(e.target.value))}><option value={0}>None</option><option value={3}>3s</option><option value={5}>5s</option><option value={10}>10s</option><option value={30}>30s</option></select></div>
                    {/* UPDATED: Practice Word Limit */}
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles size={16} className="text-green-600"/><span className="font-bold text-sm text-green-800">Words</span></div><select className="bg-green-50 rounded-lg p-2 text-sm font-bold text-green-800 outline-none" value={practiceWordCount} onChange={e => setPracticeWordCount(e.target.value)}><option value="5">5 Words</option><option value="10">10 Words</option><option value="20">20 Words</option><option value="50">50 Words</option><option value="100">100 Words</option><option value="all">All Words</option></select></div>
                </div>
                <button onClick={() => startSession('practice')} className="mt-4 w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-green-600 transform active:scale-95 transition-all relative z-10">Start Studying</button>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-[2rem] shadow-lg border-b-8 border-indigo-800 text-white hover:scale-[1.02] transition-transform duration-300">
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Gamepad2/> Fun Games</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => startSession('unscramble')} className="bg-white/20 hover:bg-white/30 py-2 rounded-xl font-bold text-sm transform active:scale-95 transition-all">🧩 Unscramble</button>
                    <button onClick={() => startSession('quiz')} className="bg-white/20 hover:bg-white/30 py-2 rounded-xl font-bold text-sm transform active:scale-95 transition-all">❓ Quiz</button>
                    <button onClick={() => startSession('blanks')} className="bg-white/20 hover:bg-white/30 py-2 rounded-xl font-bold text-sm transform active:scale-95 transition-all">🔡 Blanks</button>
                    <button onClick={() => startSession('origin')} className="bg-white/20 hover:bg-white/30 py-2 rounded-xl font-bold text-sm transform active:scale-95 transition-all">🌍 Origin</button>
                </div>
            </div>
            <button onClick={() => activeSession.active && startSession('test_live')} className={`p-6 rounded-[2rem] shadow-lg border-b-8 text-left transition-transform ${activeSession.active ? 'bg-yellow-400 border-yellow-600 hover:scale-[1.02] cursor-pointer' : 'bg-gray-200 border-gray-300 grayscale cursor-not-allowed'}`}>
                 <div className="flex items-center gap-4">
                    <div className="bg-white/30 p-3 rounded-full"><Trophy className="text-white" size={32}/></div>
                    <div><h2 className="text-2xl font-black text-white mix-blend-hard-light">{activeSession.active ? 'TAKE TEST' : 'TEST LOCKED'}</h2><p className="text-white/60 text-sm font-bold">{activeSession.active ? "Good luck!" : "Wait for teacher"}</p></div>
                 </div>
            </button>
        </div>
      </div>
  );

  if (activeView === 'game_interface') {
    const currentWord = game.words[game.index];
    const scrambled = currentWord?.word.split('').sort(() => Math.random() - 0.5).join(' ');
    const maskedWord = currentWord?.word.replace(/[aeiou]/gi, '_');
      
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative font-sans transition-colors duration-500 ${feedbackState === 'correct' ? 'bg-green-500' : feedbackState === 'wrong' ? 'bg-red-500' : 'bg-green-600'}`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)', backgroundSize: '24px 24px'}}></div>
            {feedbackState === 'correct' && <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"><div className="text-9xl animate-pop">🎉</div></div>}
            {feedbackState === 'wrong' && <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"><div className="text-9xl animate-shake">❌</div></div>}

            <button onClick={() => setActiveView('student_dash')} className="absolute top-6 right-6 text-white hover:scale-110 transition-transform"><X size={32}/></button>
            <div className={`bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative z-10 text-center border-4 border-yellow-400 ${feedbackState === 'wrong' ? 'animate-shake' : ''}`}>
                <div className="flex justify-between items-center mb-6 text-gray-400 text-xs font-bold tracking-widest">
                    <span className="uppercase text-green-800 bg-green-100 px-2 py-1 rounded">{game.mode} • {game.gameType}</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-mono">{game.timeLeft > 0 ? `${game.timeLeft}s` : '∞'}</span>
                    <span className="text-green-600">{game.index + 1}/{game.words.length}</span>
                </div>
                
                {game.gameType === 'spelling' && (
                    <button onClick={() => speak(currentWord.word)} className="bg-yellow-400 p-8 rounded-full shadow-[0_10px_20px_rgba(250,204,21,0.4)] hover:scale-110 transition-transform mb-6 group active:scale-95"><Volume2 size={48} className="text-yellow-900 group-hover:rotate-12 transition-transform"/></button>
                )}
                {game.gameType === 'unscramble' && <div className="text-5xl font-black text-purple-600 mb-8 tracking-widest uppercase drop-shadow-sm animate-pop break-words">{scrambled}</div>}
                {game.gameType === 'blanks' && <div className="text-5xl font-black text-orange-500 mb-8 tracking-widest uppercase drop-shadow-sm animate-pop break-words">{maskedWord}</div>}
                {(game.gameType === 'quiz' || game.gameType === 'origin') && <div className="text-3xl font-black text-gray-800 mb-8 animate-slide-in break-words">"{currentWord.word}"</div>}
                
                {(game.gameType === 'quiz' || game.gameType === 'origin') ? (
                    <div className="grid gap-3">
                        {/* UPDATED: Quiz uses direct boolean check passed to submitWord */}
                        {quizOptions.map((opt, i) => (
                            <button key={i} onClick={() => submitWord(opt.isCorrect)} className="bg-gray-50 border-2 border-gray-100 p-4 rounded-xl text-left font-bold hover:bg-yellow-100 hover:border-yellow-300 text-gray-700 text-sm transition-all transform active:scale-95 break-words whitespace-normal h-auto">
                                {opt.text}
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        <input autoFocus type="text" value={game.input} onChange={e => setGame({...game, input: e.target.value})} onKeyDown={e => e.key === 'Enter' && submitWord()} className="w-full text-center text-4xl md:text-5xl font-black text-green-900 border-b-4 border-green-200 focus:border-yellow-400 outline-none pb-4 mb-4 uppercase placeholder-gray-200 tracking-wider" placeholder="TYPE HERE"/>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                             <button onClick={() => submitWord('submit')} className="col-span-2 bg-green-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-green-600 transform hover:-translate-y-1 active:translate-y-0 transition-all">SUBMIT</button>
                             <button onClick={() => submitWord('skip')} className="bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"><SkipForward size={18}/> Skip</button>
                             {/* UPDATED: Stop Button ends test completely */}
                             <button onClick={() => finishGame(game.score)} className="bg-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-200 flex items-center justify-center gap-2"><StopCircle size={18}/> Stop</button>
                        </div>
                    </>
                )}

                {(game.mode === 'practice' || game.mode === 'test_rush') && (
                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-2">
                        <button onClick={() => speak(currentWord.definition)} className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 font-bold hover:bg-blue-100 transition flex flex-col items-center"><span className="text-[10px] uppercase text-blue-400 mb-1">Def</span><Mic size={20}/></button>
                        <button onClick={() => speak(currentWord.usage)} className="bg-green-50 p-3 rounded-xl text-xs text-green-800 font-bold hover:bg-green-100 transition flex flex-col items-center"><span className="text-[10px] uppercase text-green-400 mb-1">Use</span><Mic size={20}/></button>
                        <button onClick={() => speak(currentWord.etymology)} className="bg-purple-50 p-3 rounded-xl text-xs text-purple-800 font-bold hover:bg-purple-100 transition flex flex-col items-center"><span className="text-[10px] uppercase text-purple-400 mb-1">Origin</span><Mic size={20}/></button>
                    </div>
                )}
            </div>
        </div>
    );
  }
  return null;
};
export default App;