/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Trash2, Edit3, BookOpen, Trophy, Gamepad2, Sparkles, Key, Menu, AlertTriangle, Heart, Crown, Zap, School, Plus, RefreshCw, Shield, LayoutDashboard, Eye, EyeOff, DollarSign, ArrowLeft, CreditCard, Users, Globe } from 'lucide-react';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';
import logo from './logo.jpg';

// --- CONFIG ---
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : 'https://school-app-backend-d4fi.onrender.com/api';
const SOCKET_URL = API_URL.replace('/api', '');
const socket = io(SOCKET_URL);

// --- STYLES ---
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes float { 
    0%, 100% { transform: translateY(0px) rotate(0deg); } 
    50% { transform: translateY(-20px) rotate(5deg); } 
  } 
  .animate-float { animation: float 6s ease-in-out infinite; }
`;
document.head.appendChild(styleTag);

// --- HELPERS ---
const BackgroundBees = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float">🐝</div>
    <div className="absolute bottom-20 right-20 text-5xl opacity-20 animate-float">🐝</div>
    <div className="absolute top-1/2 left-1/3 text-3xl opacity-15 animate-float delay-1000">🐝</div>
  </div>
);

const WelcomeCard = ({ title, message, color }) => (
  <div className={`p-6 rounded-2xl mb-6 flex items-start gap-4 shadow-sm border-l-8 border-${color}-500 bg-white`}>
    <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
      <Heart fill="currentColor" size={24}/>
    </div>
    <div>
      <h2 className={`text-xl font-bold text-${color}-900 mb-1`}>{title}</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

const Leaderboard = ({ type, data = [], showTime = true }) => {
  const sorted = [...data].sort((a, b) => (b.score - a.score) || ((a.timeTaken || 9999) - (b.timeTaken || 9999)));
  const getAvatar = (name) => `https://api.dicebear.com/7.x/notionists/svg?seed=${name || 'User'}&backgroundColor=transparent`;

  if (sorted.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-yellow-200 mb-10 text-center"
      >
        <h3 className="font-black text-2xl mb-4 text-gray-500 flex items-center justify-center gap-3">
          <Trophy size={32} className="fill-yellow-500"/>
          {type}
        </h3>
        <p className="text-gray-400">No results yet. Start practicing!</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-white p-8 rounded-3xl shadow-xl border border-yellow-200 mb-10"
    >
      <h3 className="font-black text-2xl mb-8 flex items-center gap-3 text-yellow-700">
        <Trophy size={32} className="fill-yellow-500"/>
        {type}
      </h3>
      <div className="space-y-4">
        {sorted.slice(0, 10).map((r, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
            whileHover={{ scale: 1.03, backgroundColor: "#fefce8" }}
            className="flex justify-between p-4 rounded-2xl border bg-gray-50 items-center transition"
          >
            <div className="flex items-center gap-5">
              <span className="font-black text-2xl text-gray-400 w-10 text-center">#{i + 1}</span>
              {i < 3 && <Crown size={24} className={i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-orange-600'} />}
              <div className="w-12 h-12 rounded-full bg-white border overflow-hidden shadow">
                <img src={getAvatar(r.student_id?.name || 'Unknown')} alt="Avatar"/>
              </div>
              <span className="font-bold text-lg">{r.student_id?.name || 'Anonymous'}</span>
            </div>
            <div className="text-right">
              <div className="font-black text-2xl text-gray-800">{r.score}/{r.total}</div>
              {showTime && <div className="text-sm text-gray-500">{r.timeTaken ? `${Math.round(r.timeTaken)}s` : '—'}</div>}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const AchievementBanner = ({ achievements }) => (
  <motion.div 
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-3xl shadow-2xl mb-8 text-center text-white"
  >
    <h2 className="text-3xl font-black mb-4">🏆 New Achievements Unlocked! 🏆</h2>
    <div className="flex justify-center gap-6 flex-wrap">
      {achievements.map((ach, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.3, type: "spring", stiffness: 300 }}
          className="bg-white/20 px-8 py-4 rounded-2xl font-black text-2xl"
        >
          {ach}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// --- APP ---
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hive_token'));
  const [activeView, setActiveView] = useState('login');
  const [adminTab, setAdminTab] = useState('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [wordBank, setWordBank] = useState({});
  const [results, setResults] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [pricing, setPricing] = useState({ schoolPricePerStudent: 500, individualPrice: 2000 });
  const [viewingSchool, setViewingSchool] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', schoolCode: '' });
  const [regForm, setRegForm] = useState({ schoolName: '', adminName: '', username: '', password: '', studentCount: 0 });
  const [indivRegForm, setIndivRegForm] = useState({ name: '', username: '', password: '' });
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'student', class_id: '', auto: false });
  const [wordForm, setWordForm] = useState({ word: '', definition: '', usage: '', synonyms: '', antonyms: '', etymology: '', category: 'General', target_grade: '' });
  const [pendingPayment, setPendingPayment] = useState(null);
  const [isMasterLogin, setIsMasterLogin] = useState(false);
  const [isIndividualLogin, setIsIndividualLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [game, setGame] = useState({ active: false, words: [], index: 0, score: 0, input: '', mode: 'practice', timeLeft: 30, startTime: 0 });
  const [sessionConfig, setSessionConfig] = useState({ mode: 'test_standard', timer: 60, wordCount: 10 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [multiPlayer, setMultiPlayer] = useState({ active: false, room: '', players: [], scores: {}, currentWord: '', timeLeft: 30, waiting: true });
  const inputRef = useRef(null);

  const correctSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
  const wrongSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-783.mp3');
  const winSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-applause-crowd-cheering-361.mp3');

  const isSoloUser = currentUser?.role === 'individual';

  const studentStats = useMemo(() => {
    if (!currentUser) return { avg: 0, completed: 0, classRank: '—', schoolRank: '—' };
    const myResults = results.filter(r => r.student_id?._id === currentUser._id);
    const avg = myResults.length ? Math.round(myResults.reduce((a, r) => a + (r.score / r.total * 100), 0) / myResults.length) : 0;

    const classResults = results.filter(r => r.class_id === currentUser.class_id);
    const classSorted = [...classResults].sort((a, b) => b.score - a.score);
    const classRank = classSorted.findIndex(r => r.student_id?._id === currentUser._id) + 1 || '—';

    const schoolResults = results.filter(r => r.school_id === currentUser.school_id);
    const schoolSorted = [...schoolResults].sort((a, b) => b.score - a.score);
    const schoolRank = schoolSorted.findIndex(r => r.student_id?._id === currentUser._id) + 1 || '—';

    return { avg, completed: myResults.length, classRank, schoolRank };
  }, [currentUser, results]);

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('hive_token');
      setToken(null);
      setCurrentUser(null);
      setActiveView('login');
      toast.error("Session expired. Please login again.");
    }
    return res.json();
  };

  const refreshData = async () => {
    if (!currentUser || !token) return;
    try {
      if (currentUser.role === 'master') {
        const data = await fetchWithAuth('/master/data');
        setSchools(data.schools || []);
        setUsers(data.users || []);
        setResults(data.results || []);
        setPricing(data.pricing || pricing);
      } else {
        const promises = [];
        promises.push(fetchWithAuth('/results').catch(() => []));
        if (currentUser.role !== 'student') promises.push(fetchWithAuth('/classes').catch(() => []));
        if (currentUser.role === 'admin') promises.push(fetchWithAuth('/users').catch(() => []));
        const [resultData, classData = [], userData = []] = await Promise.all(promises);
        setResults(resultData);
        setClasses(classData);
        if (currentUser.role === 'admin') setUsers(userData);
      }
    } catch (e) {
      toast.error("Failed to load data");
    }
  };

  const fetchWordsForClass = async (classId) => {
    if (!classId) return;
    try {
      const data = await fetchWithAuth(`/words/${classId}`);
      setWordBank(prev => ({ ...prev, [classId]: data }));
    } catch (e) {
      console.error("Word fetch failed");
    }
  };

  useEffect(() => {
    if (currentUser && token) refreshData();
  }, [currentUser, token]);
    const handleLogin = async () => {
    try {
      setLoading(true);

      let payload = {
        username: loginForm.username,
        password: loginForm.password
      };

      if (!isMasterLogin && !isIndividualLogin) {
        payload.schoolCode = loginForm.schoolCode.toUpperCase();
      }

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('hive_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        const dash = data.user.role === 'master' ? 'master_dash' : 
                     data.user.role === 'admin' ? 'admin_dash' :
                     data.user.role === 'teacher' ? 'teacher_dash' :
                     'student_dash';
        setActiveView(dash);
        toast.success(`Welcome, ${data.user.name || data.user.role}!`);
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (e) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSchool = async () => {
    try {
      const res = await fetch(`${API_URL}/register-school`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (data.success) {
        setPendingPayment({
          type: 'school',
          amount: regForm.studentCount * pricing.schoolPricePerStudent,
          id: data.id,
          code: data.code
        });
        setActiveView('payment_gateway');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Registration failed");
    }
  };

  const handleRegisterIndividual = async () => {
    try {
      const res = await fetch(`${API_URL}/register-individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indivRegForm)
      });
      const data = await res.json();
      if (data.success) {
        setPendingPayment({ type: 'individual', amount: pricing.individualPrice, id: data.id });
        setActiveView('payment_gateway');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Registration failed");
    }
  };

  const handleConfirmPayment = async () => {
    try {
      await fetch(`${API_URL}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingPayment)
      });
      toast.success("Payment Confirmed! Account Activated.");
      if (pendingPayment.type === 'school') toast.success(`School Code: ${pendingPayment.code}`);
      setActiveView('login');
      setPendingPayment(null);
    } catch (e) {
      toast.error("Payment confirmation failed");
    }
  };

  const handleAddUser = async () => {
    let payload = { ...userForm };
    if (payload.auto) {
      payload.username = `${payload.name.split(' ')[0].toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      payload.password = '123456';
    }
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        refreshData();
        setUserForm({ name: '', username: '', password: '', role: 'student', class_id: '', auto: false });
        toast.success("User Added Successfully");
      } else {
        toast.error(d.error);
      }
    } catch (e) {
      toast.error("Add user failed");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Delete this user permanently?")) {
      try {
        await fetchWithAuth(`/users/${id}`, { method: 'DELETE' });
        refreshData();
        toast.success("User Deleted");
      } catch (e) {
        toast.error("Delete failed");
      }
    }
  };

  const handleAddClass = async () => {
    const name = prompt("Enter New Class Name:");
    if (name) {
      try {
        await fetchWithAuth('/classes', { method: 'POST', body: JSON.stringify({ name }) });
        refreshData();
        toast.success("Class Added");
      } catch (e) {
        toast.error("Add class failed");
      }
    }
  };

  const fetchAIWords = async () => {
    if (!wordForm.word) return toast.error("Enter a word first");
    setLoadingAI(true);
    try {
      const res = await fetchWithAuth('/generate-ai', {
        method: 'POST',
        body: JSON.stringify({ word: wordForm.word })
      });
      if (res) setWordForm({ ...wordForm, ...res });
      toast.success("AI Details Generated!");
    } catch (e) {
      toast.error("AI Generation Failed");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSaveWord = async () => {
    if (!wordForm.word) return toast.error("Word is required");
    const payload = { ...wordForm, class_id: selectedClass };
    if (currentUser.role === 'master' && !wordForm.target_grade) return toast.error("Target grade required for global words");
    try {
      await fetchWithAuth('/words', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      toast.success("Word Saved");
      setWordForm({ word: '', definition: '', usage: '', synonyms: '', antonyms: '', etymology: '', category: 'General', target_grade: '' });
      if (selectedClass) fetchWordsForClass(selectedClass);
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const handleStartLiveTest = async () => {
    if (!selectedClass) return toast.error("Select a class");
    const words = wordBank[selectedClass] || [];
    if (words.length < sessionConfig.wordCount) {
      toast.error("Not enough words in bank");
      return;
    }
    socket.emit('startTest', {
      classId: selectedClass,
      mode: sessionConfig.mode,
      words: words.slice(0, sessionConfig.wordCount),
      timer: sessionConfig.timer
    });
    setActiveSessions(prev => [...new Set([...prev, selectedClass])]);
    toast.success("Live Test Started!");
  };

  const handleStopLiveTest = (classId) => {
    socket.emit('stopTest', { classId });
    setActiveSessions(prev => prev.filter(c => c !== classId));
    toast.success("Live Test Stopped");
  };

  const startSession = () => {
    const sampleWords = [
      { word: "beautiful", definition: "Pleasing the senses or mind aesthetically" },
      { word: "knowledge", definition: "Facts, information, and skills acquired through experience or education" },
      { word: "success", definition: "The accomplishment of an aim or purpose" },
      { word: "courage", definition: "The ability to do something that frightens one" },
      { word: "friendship", definition: "A relationship of mutual affection between people" },
      { word: "adventure", definition: "An exciting experience" },
      { word: "brilliant", definition: "Exceptionally clever or talented" },
      { word: "delight", definition: "Great pleasure" },
      { word: "fantastic", definition: "Extraordinarily good" },
      { word: "harmony", definition: "Agreement or concord" }
    ];
    setGame({
      active: true,
      words: sampleWords,
      index: 0,
      score: 0,
      input: '',
      timeLeft: 30,
      startTime: Date.now()
    });
    setActiveView('game_interface');
  };

  const submitGameWord = async () => {
    const currentWord = game.words[game.index];
    const isCorrect = game.input.trim().toLowerCase() === currentWord.word.toLowerCase();
    if (isCorrect) correctSound.play();
    else wrongSound.play();

    const newScore = isCorrect ? game.score + 1 : game.score;
    if (game.index + 1 >= game.words.length) {
      const totalTime = (Date.now() - game.startTime) / 1000;

      try {
        await fetchWithAuth('/results', {
          method: 'POST',
          body: JSON.stringify({
            student_id: currentUser._id,
            class_id: currentUser.class_id,
            school_id: currentUser.school_id,
            score: newScore,
            total: game.words.length,
            mode: game.mode,
            timeTaken: totalTime
          })
        });
        await refreshData();
        toast.success(`Result saved! Score: ${newScore}/${game.words.length}`);
      } catch (e) {
        toast.error("Failed to save result");
      }

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
      winSound.play();
      toast.success(`Game Over! Score: ${newScore}/10 🎉`);
      const newAchievements = [];
      if (newScore === 10) newAchievements.push("Perfect Speller 🏆");
      if (newScore >= 8) newAchievements.push("Spelling Master ✨");
      if (newScore >= 6) newAchievements.push("Great Effort! 🌟");
      if (newAchievements.length > 0) {
        setAchievements(prev => [...prev, ...newAchievements]);
        toast.success("New Achievements Unlocked!");
      }
      setActiveView('student_dash');
    } else {
      setGame(prev => ({ ...prev, index: prev.index + 1, score: newScore, input: '', timeLeft: 30 }));
      inputRef.current?.focus();
    }
  };

  const createMultiRoom = () => {
    const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
    socket.emit('createRoom', { roomId, user: currentUser.name });
    setMultiPlayer({ active: true, room: roomId, players: [currentUser.name], scores: {}, waiting: true });
    setActiveView('multi_game');
    toast.success(`Room created: ${roomId} — Share this code!`);
  };

  const joinMultiRoom = () => {
    const roomId = prompt("Enter Room ID:");
    if (roomId) {
      socket.emit('joinRoom', { roomId, user: currentUser.name });
    }
  };

  const submitMultiAnswer = () => {
    const isCorrect = game.input.trim().toLowerCase() === multiPlayer.currentWord.toLowerCase();
    socket.emit('submitAnswer', { room: multiPlayer.room, user: currentUser.name, answer: game.input, isCorrect });
    setGame(prev => ({ ...prev, input: '' }));
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm("Delete entire school and all associated data? This cannot be undone.")) {
      try {
        await fetchWithAuth(`/master/schools/${id}`, { method: 'DELETE' });
        refreshData();
        toast.success("School Deleted");
      } catch (e) {
        toast.error("Delete failed");
      }
    }
  };

  const fetchSchoolDetails = async (id) => {
    try {
      const data = await fetchWithAuth(`/master/school-details/${id}`);
      setViewingSchool(data);
      setAdminTab('school_profile');
    } catch (e) {
      toast.error("Failed to load school details");
    }
  };

  const waiveFeeSchool = async (id) => {
    try {
      await fetchWithAuth(`/master/waive-school/${id}`, { method: 'POST' });
      toast.success("Fee Waived");
      refreshData();
    } catch (e) {
      toast.error("Waive failed");
    }
  };

  const updatePricing = async () => {
    try {
      await fetchWithAuth('/master/pricing', {
        method: 'POST',
        body: JSON.stringify(pricing)
      });
      toast.success("Pricing Updated Globally");
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hive_token');
    setToken(null);
    setCurrentUser(null);
    setActiveView('login');
    toast.success("Logged out");
  };

  useEffect(() => {
    if (game.active && game.timeLeft > 0) {
      const timerId = setTimeout(() => {
        setGame(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (game.active && game.timeLeft === 0) {
      wrongSound.play();
      submitGameWord();
    }
  }, [game.active, game.timeLeft]);

  useEffect(() => {
    socket.on('roomUpdate', ({ players, scores }) => {
      setMultiPlayer(prev => ({ ...prev, players, scores }));
    });

    socket.on('multiGameStart', ({ word }) => {
      setMultiPlayer(prev => ({ ...prev, currentWord: word.word, timeLeft: 30, waiting: false }));
      toast.success("Game started!");
    });

    socket.on('multiNextWord', ({ word }) => {
      setMultiPlayer(prev => ({ ...prev, currentWord: word.word, timeLeft: 30 }));
    });

    socket.on('multiGameEnd', ({ finalScores }) => {
      setMultiPlayer(prev => ({ ...prev, scores: finalScores, waiting: true }));
      toast.success("Game Over!");
      const myScore = finalScores[currentUser.name] || 0;
      const maxScore = Math.max(...Object.values(finalScores));
      if (myScore === maxScore) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
        winSound.play();
        toast.success("You Won! 🎉");
      }
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('multiGameStart');
      socket.off('multiNextWord');
      socket.off('multiGameEnd');
    };
  }, [currentUser]);

  useEffect(() => {
    if (multiPlayer.active && !multiPlayer.waiting && multiPlayer.timeLeft > 0) {
      const timerId = setTimeout(() => {
        setMultiPlayer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [multiPlayer.active, multiPlayer.waiting, multiPlayer.timeLeft]);

  if (activeView === 'payment_gateway' && pendingPayment) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-900 p-6 text-white">
      <div className="bg-white text-gray-900 p-12 rounded-3xl max-w-lg w-full text-center shadow-2xl">
        <CreditCard size={60} className="mx-auto mb-6 text-green-600"/>
        <h1 className="text-4xl font-black mb-4">Payment Gateway</h1>
        <p className="text-lg mb-8">{pendingPayment.type === 'school' ? 'Activate School License' : 'Unlock Individual Access'}</p>
        <div className="bg-green-50 p-6 rounded-2xl mb-8">
          <p className="text-sm font-bold text-green-600 uppercase">Amount Due</p>
          <h2 className="text-5xl font-black text-green-700">₦{pendingPayment.amount.toLocaleString()}</h2>
        </div>
        <button onClick={handleConfirmPayment} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl text-xl hover:bg-green-700 shadow-lg">
          CONFIRM PAYMENT (DEMO)
        </button>
        <button onClick={() => setActiveView('login')} className="mt-6 text-gray-500 underline">
          Cancel
        </button>
      </div>
    </div>
  );

  if (activeView === 'register') return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6"
    >
      <Toaster />
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white p-12 rounded-3xl shadow-2xl max-w-xl w-full"
      >
        <div className="flex gap-2 mb-8 bg-gray-100 p-2 rounded-xl">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsIndividualLogin(false)} 
            className={`flex-1 py-3 rounded-lg font-black text-sm transition ${!isIndividualLogin ? 'bg-white shadow-lg text-purple-700' : 'text-gray-500'}`}
          >
            School Registration
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsIndividualLogin(true)} 
            className={`flex-1 py-3 rounded-lg font-black text-sm transition ${isIndividualLogin ? 'bg-white shadow-lg text-blue-700' : 'text-gray-500'}`}
          >
            Individual Signup
          </motion.button>
        </div>
        <h1 className="text-3xl font-black text-center mb-8">{isIndividualLogin ? 'Solo Learner Account' : 'School Onboarding'}</h1>
        {!isIndividualLogin ? (
          <div className="space-y-5">
            <input 
              name="schoolName"
              placeholder="School Name" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={regForm.schoolName}
              onChange={e => setRegForm({...regForm, schoolName: e.target.value})} 
            />
            <input 
              name="adminName"
              placeholder="Admin Full Name" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={regForm.adminName}
              onChange={e => setRegForm({...regForm, adminName: e.target.value})} 
            />
            <input 
              name="username"
              placeholder="Admin Username" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={regForm.username}
              onChange={e => setRegForm({...regForm, username: e.target.value})} 
            />
            <input 
              name="password"
              type="password" 
              placeholder="Admin Password" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={regForm.password}
              onChange={e => setRegForm({...regForm, password: e.target.value})} 
            />
            <input 
              name="studentCount"
              type="number" 
              placeholder="Expected Student Count" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={regForm.studentCount}
              onChange={e => setRegForm({...regForm, studentCount: Number(e.target.value)})} 
            />
            <div className="bg-yellow-50 p-5 rounded-xl border-2 border-yellow-300">
              <p className="font-black text-yellow-800">Total Cost: ₦{(regForm.studentCount * pricing.schoolPricePerStudent).toLocaleString()}</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegisterSchool} 
              className="w-full bg-green-600 text-white font-black py-5 rounded-xl text-lg hover:bg-green-700"
            >
              PROCEED TO PAYMENT
            </motion.button>
          </div>
        ) : (
          <div className="space-y-5">
            <input 
              name="fullName"
              placeholder="Your Full Name" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={indivRegForm.name}
              onChange={e => setIndivRegForm({...indivRegForm, name: e.target.value})} 
            />
            <input 
              name="username"
              placeholder="Choose Username" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={indivRegForm.username}
              onChange={e => setIndivRegForm({...indivRegForm, username: e.target.value})} 
            />
            <input 
              name="password"
              type="password" 
              placeholder="Create Password" 
              className="w-full p-4 border-2 rounded-xl font-medium" 
              value={indivRegForm.password}
              onChange={e => setIndivRegForm({...indivRegForm, password: e.target.value})} 
            />
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-300">
              <p className="font-black text-blue-800">Annual Fee: ₦{pricing.individualPrice.toLocaleString()}</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegisterIndividual} 
              className="w-full bg-blue-600 text-white font-black py-5 rounded-xl text-lg hover:bg-blue-700"
            >
              PROCEED TO PAYMENT
            </motion.button>
          </div>
        )}
        <button onClick={() => setActiveView('login')} className="w-full text-center mt-8 text-gray-600 font-bold">
          Back to Login
        </button>
      </motion.div>
    </motion.div>
  );

  if (activeView === 'login') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-100 via-green-100 to-blue-100 relative overflow-hidden">
      <Toaster />
      <BackgroundBees />
      <div className="bg-white/95 backdrop-blur-xl p-12 rounded-3xl shadow-2xl w-full max-w-md border-4 border-white z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl border-8 border-white">
            <span className="text-7xl">🐝</span>
          </div>
          <h1 className="text-5xl font-black text-yellow-600">The<span className="text-green-600">Hive</span></h1>
          <p className="text-gray-600 mt-2 font-medium">Spelling Bee Mastery Platform</p>
        </div>
        <div className="space-y-6">
          {!isMasterLogin && !isIndividualLogin && (
            <div className="relative">
              <School className="absolute left-4 top-5 text-gray-500" size={24}/>
              <input
                name="schoolCode"
                placeholder="School Code"
                className="w-full pl-14 pr-4 py-5 bg-gray-50 border-2 rounded-2xl font-bold uppercase tracking-wider"
                value={loginForm.schoolCode}
                onChange={e => setLoginForm({...loginForm, schoolCode: e.target.value.toUpperCase()})}
              />
            </div>
          )}
          <div className="relative">
            <User className="absolute left-4 top-5 text-gray-500" size={24}/>
            <input
              name="username"
              placeholder="Username"
              className="w-full pl-14 pr-4 py-5 bg-gray-50 border-2 rounded-2xl font-bold"
              value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
            />
          </div>
          <div className="relative">
            <Key className="absolute left-4 top-5 text-gray-500" size={24}/>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full pl-14 pr-4 py-5 bg-gray-50 border-2 rounded-2xl font-bold"
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-5 text-gray-500">
              {showPassword ? <EyeOff size={24}/> : <Eye size={24}/>}
            </button>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full font-black py-5 rounded-2xl text-xl shadow-xl transition ${
              isMasterLogin ? 'bg-purple-700 hover:bg-purple-800 text-white' :
              isIndividualLogin ? 'bg-blue-600 hover:bg-blue-700 text-white' :
              'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
            }`}
          >
            {loading ? 'Authenticating...' : isMasterLogin ? 'MASTER ACCESS' : isIndividualLogin ? 'INDIVIDUAL LOGIN' : 'ENTER HIVE'}
          </button>
          <div className="flex justify-between text-sm mt-6">
            <div className="flex gap-4">
              <button onClick={() => {setIsMasterLogin(false); setIsIndividualLogin(!isIndividualLogin);}} className="font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1">
                {isIndividualLogin ? <School size={16}/> : <User size={16}/>}
                {isIndividualLogin ? 'School' : 'Solo'}
              </button>
              <button onClick={() => {setIsMasterLogin(!isMasterLogin); setIsIndividualLogin(false);}} className="font-bold text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <Shield size={16}/> Master
              </button>
            </div>
            <button onClick={() => setActiveView('register')} className="font-bold text-purple-600 hover:underline">
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (activeView === 'master_dash') return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-gray-900 flex text-white">
      <div className="w-80 p-10 border-r border-purple-800 bg-black/70 backdrop-blur">
        <h1 className="text-6xl font-black text-yellow-400 mb-16">MASTER<br/>CONTROL</h1>
        <div className="space-y-4">
          {['overview', 'schools', 'curriculum', 'pricing', 'leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={`w-full text-left py-4 px-6 rounded-2xl font-black text-lg flex items-center gap-4 transition ${
                adminTab === tab ? 'bg-yellow-500/30 text-yellow-300 shadow-xl border border-yellow-600' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab === 'overview' && <LayoutDashboard size={28}/>}
              {tab === 'schools' && <School size={28}/>}
              {tab === 'curriculum' && <Globe size={28}/>}
              {tab === 'pricing' && <DollarSign size={28}/>}
              {tab === 'leaderboard' && <Trophy size={28}/>}
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="absolute bottom-10 left-10 flex items-center gap-3 text-red-400 font-black hover:text-red-300">
          <LogOut size={24}/> LOGOUT
        </button>
      </div>
      <div className="flex-1 p-12 overflow-y-auto">
        {adminTab === 'overview' && (
          <div>
            <h2 className="text-5xl font-black mb-12">System Overview</h2>
            <div className="grid grid-cols-4 gap-8 mb-16">
              <div className="bg-white/10 p-10 rounded-3xl text-center border border-yellow-500/50">
                <h3 className="text-7xl font-black text-yellow-400">{schools.length}</h3>
                <p className="text-gray-300 mt-3">Schools</p>
              </div>
              <div className="bg-white/10 p-10 rounded-3xl text-center">
                <h3 className="text-7xl font-black text-blue-400">{users.length}</h3>
                <p className="text-gray-300 mt-3">Users</p>
              </div>
              <div className="bg-white/10 p-10 rounded-3xl text-center">
                <h3 className="text-7xl font-black text-green-400">₦{schools.reduce((a, s) => a + (s.isPaid ? s.maxStudents * pricing.schoolPricePerStudent : 0), 0).toLocaleString()}</h3>
                <p className="text-gray-300 mt-3">Revenue</p>
              </div>
              <div className="bg-white/10 p-10 rounded-3xl text-center">
                <h3 className="text-7xl font-black text-purple-400">{results.length}</h3>
                <p className="text-gray-300 mt-3">Tests</p>
              </div>
            </div>
          </div>
        )}
        {adminTab === 'schools' && (
          <div>
            <h2 className="text-4xl font-black mb-8">Schools Management</h2>
            <div className="space-y-6">
              {schools.map(s => (
                <div key={s._id} className="bg-white/10 p-8 rounded-3xl flex justify-between items-center hover:bg-white/20 transition">
                  <div onClick={() => fetchSchoolDetails(s._id)} className="cursor-pointer">
                    <h3 className="text-2xl font-black">{s.name}</h3>
                    <p className="text-gray-400">Code: {s.code} | {s.enrolledCount}/{s.maxStudents} students</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-6 py-2 rounded-full font-black ${s.isPaid ? 'bg-green-600/50' : 'bg-red-600/50'}`}>
                      {s.isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                    {!s.isPaid && <button onClick={() => waiveFeeSchool(s._id)} className="bg-blue-600 px-5 py-2 rounded-xl font-bold">WAIVE</button>}
                    <button onClick={() => handleDeleteSchool(s._id)} className="text-red-400"><Trash2 size={28}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {adminTab === 'school_profile' && viewingSchool && (
          <div>
            <button onClick={() => setAdminTab('schools')} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft size={24}/> Back
            </button>
            <div className="bg-white/10 p-10 rounded-3xl">
              <h1 className="text-5xl font-black text-yellow-400 mb-4">{viewingSchool.school.name}</h1>
              <p className="text-xl mb-8">Code: {viewingSchool.school.code}</p>
              <div className="grid grid-cols-3 gap-8">
                <div className="bg-white/20 p-6 rounded-2xl text-center">
                  <h3 className="text-4xl font-black">{viewingSchool.users.length}</h3>
                  <p>Users</p>
                </div>
                <div className="bg-white/20 p-6 rounded-2xl text-center">
                  <h3 className="text-4xl font-black">{viewingSchool.words.length}</h3>
                  <p>Words</p>
                </div>
                <div className="bg-white/20 p-6 rounded-2xl text-center">
                  <h3 className="text-4xl font-black">{viewingSchool.results?.length || 0}</h3>
                  <p>Results</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {adminTab === 'curriculum' && (
          <div>
            <h2 className="text-4xl font-black mb-8">Global Curriculum Editor</h2>
            <div className="bg-white/10 p-10 rounded-3xl mb-10">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <input 
                  name="targetGrade"
                  placeholder="Target Grade (e.g. JSS1)" 
                  className="bg-black/50 p-5 rounded-xl" 
                  value={wordForm.target_grade} 
                  onChange={e => setWordForm({...wordForm, target_grade: e.target.value})} 
                />
                <div className="flex gap-3">
                  <input 
                    name="word"
                    placeholder="Word" 
                    className="flex-1 bg-black/50 p-5 rounded-xl" 
                    value={wordForm.word} 
                    onChange={e => setWordForm({...wordForm, word: e.target.value})} 
                  />
                  <button onClick={fetchAIWords} className="bg-purple-600 px-8 rounded-xl font-black hover:bg-purple-700">
                    {loadingAI ? <RefreshCw className="animate-spin" size={24}/> : 'AI'}
                  </button>
                </div>
              </div>
              <textarea 
                name="definition"
                placeholder="Definition" 
                className="w-full bg-black/50 p-5 rounded-xl h-32 mb-6" 
                value={wordForm.definition} 
                onChange={e => setWordForm({...wordForm, definition: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-6 mb-6">
                <input 
                  name="usage"
                  placeholder="Usage" 
                  className="bg-black/50 p-5 rounded-xl" 
                  value={wordForm.usage} 
                  onChange={e => setWordForm({...wordForm, usage: e.target.value})} 
                />
                <input 
                  name="synonyms"
                  placeholder="Synonyms" 
                  className="bg-black/50 p-5 rounded-xl" 
                  value={wordForm.synonyms} 
                  onChange={e => setWordForm({...wordForm, synonyms: e.target.value})} 
                />
                <input 
                  name="antonyms"
                  placeholder="Antonyms" 
                  className="bg-black/50 p-5 rounded-xl" 
                  value={wordForm.antonyms} 
                  onChange={e => setWordForm({...wordForm, antonyms: e.target.value})} 
                />
                <input 
                  name="etymology"
                  placeholder="Etymology" 
                  className="bg-black/50 p-5 rounded-xl" 
                  value={wordForm.etymology} 
                  onChange={e => setWordForm({...wordForm, etymology: e.target.value})} 
                />
              </div>
              <button onClick={handleSaveWord} className="w-full bg-green-600 py-5 rounded-xl font-black text-xl hover:bg-green-700">
                ADD GLOBAL WORD
              </button>
            </div>
          </div>
        )}
        {adminTab === 'pricing' && (
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black mb-8">Pricing Management</h2>
            <div className="bg-white/10 p-10 rounded-3xl space-y-8">
              <div>
                <label className="block text-gray-300 mb-3 text-lg">Per Student (NGN/year)</label>
                <input 
                  name="schoolPricePerStudent"
                  type="number" 
                  className="w-full bg-black/50 p-6 rounded-xl text-4xl font-black text-white" 
                  value={pricing.schoolPricePerStudent} 
                  onChange={e => setPricing({...pricing, schoolPricePerStudent: Number(e.target.value)})} 
                />
              </div>
              <button onClick={updatePricing} className="w-full bg-yellow-500 text-black font-black py-6 rounded-xl text-2xl hover:bg-yellow-400">
                UPDATE PRICING
              </button>
            </div>
          </div>
        )}
        {adminTab === 'leaderboard' && (
          <div>
            <h2 className="text-4xl font-black mb-12">Global Leaderboard</h2>
            <Leaderboard type="All-Time Champions" data={results} />
          </div>
        )}
      </div>
    </div>
  );

  if (activeView === 'admin_dash') return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <Toaster />
      <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden fixed top-4 right-4 z-50 bg-white p-3 rounded-full shadow-xl">
        <Menu size={28}/>
      </button>
      <div className={`fixed inset-y-0 left-0 bg-white w-80 p-10 shadow-2xl z-40 transform transition md:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-4 mb-12">
          <img src={logo} alt="Logo" className="w-12 h-12 rounded-full border-4 border-yellow-500"/>
          <h1 className="text-3xl font-black text-yellow-600">ADMIN HUB</h1>
        </div>
        <div className="space-y-4">
          {['overview', 'students', 'teachers', 'classes', 'curriculum', 'exam_control', 'monitor', 'results'].map(tab => (
            <button
              key={tab}
              onClick={() => { setAdminTab(tab); setShowMobileMenu(false); }}
              className={`w-full text-left p-5 rounded-2xl font-black flex items-center gap-4 transition ${
                adminTab === tab ? 'bg-yellow-400 text-yellow-900 shadow-xl' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'overview' && <LayoutDashboard size={26}/>}
              {tab === 'students' && <Users size={26}/>}
              {tab === 'teachers' && <BookOpen size={26}/>}
              {tab === 'classes' && <School size={26}/>}
              {tab === 'curriculum' && <Edit3 size={26}/>}
              {tab === 'exam_control' && <Zap size={26}/>}
              {tab === 'monitor' && <AlertTriangle size={26}/>}
              {tab === 'results' && <Trophy size={26}/>}
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="absolute bottom-10 left-10 flex items-center gap-3 text-red-600 font-black">
          <LogOut size={26}/> EXIT
        </button>
      </div>
      <div className="flex-1 md:ml-80 p-12 overflow-y-auto">
        {adminTab === 'overview' && (
          <div>
            <WelcomeCard title="School Command Center" message="Full control over your institution." color="yellow" />
            <div className="grid grid-cols-4 gap-8 mb-12">
              <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
                <p className="text-gray-600 uppercase text-sm font-black mb-3">TOTAL USERS</p>
                <h2 className="text-6xl font-black text-gray-800">{users.length}</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
                <p className="text-gray-600 uppercase text-sm font-black mb-3">CLASSES</p>
                <h2 className="text-6xl font-black text-gray-800">{classes.length}</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
                <p className="text-gray-600 uppercase text-sm font-black mb-3">LIVE SESSIONS</p>
                <h2 className="text-6xl font-black text-green-600">{activeSessions.length}</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
                <p className="text-gray-600 uppercase text-sm font-black mb-3">AVG SCORE</p>
                <h2 className="text-6xl font-black text-blue-600">{results.length ? Math.round(results.reduce((a,r) => a + r.score/r.total*100, 0)/results.length) : 0}%</h2>
              </div>
            </div>
          </div>
        )}
        {['students', 'teachers'].includes(adminTab) && (
          <div>
            <h2 className="text-3xl font-black mb-8">Manage {adminTab}</h2>
            <div className="bg-white p-8 rounded-3xl shadow-xl mb-8">
              <h3 className="text-xl font-black mb-6">Add New {adminTab.slice(0,-1)}</h3>
              <div className="space-y-5">
                <input 
                  name="fullName"
                  placeholder="Full Name" 
                  className="w-full p-4 border-2 rounded-xl" 
                  value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                />
                <select 
                  name="class_id"
                  className="w-full p-4 border-2 rounded-xl" 
                  value={userForm.class_id} 
                  onChange={e => setUserForm({...userForm, class_id: e.target.value})}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="auto" checked={userForm.auto} onChange={e => setUserForm({...userForm, auto: e.target.checked})} />
                  <label htmlFor="auto" className="font-bold">Auto-generate credentials</label>
                </div>
                {!userForm.auto && (
                  <>
                    <input 
                      name="username"
                      placeholder="Username" 
                      className="w-full p-4 border-2 rounded-xl" 
                      value={userForm.username} 
                      onChange={e => setUserForm({...userForm, username: e.target.value})} 
                    />
                    <input 
                      name="password"
                      type="password" 
                      placeholder="Password" 
                      className="w-full p-4 border-2 rounded-xl" 
                      value={userForm.password} 
                      onChange={e => setUserForm({...userForm, password: e.target.value})} 
                    />
                  </>
                )}
                <button onClick={handleAddUser} className="w-full bg-green-600 text-white font-black py-4 rounded-xl">
                  ADD {adminTab.slice(0,-1).toUpperCase()}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {users.filter(u => u.role === adminTab.slice(0,-1)).map(u => (
                <div key={u._id} className="bg-white p-6 rounded-2xl flex justify-between items-center shadow">
                  <div>
                    <p className="font-black text-xl">{u.name}</p>
                    <p className="text-gray-600">{u.username} • {classes.find(c => c._id === u.class_id)?.name || '—'}</p>
                  </div>
                  <button onClick={() => handleDeleteUser(u._id)} className="text-red-600"><Trash2 size={28}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
        {adminTab === 'classes' && (
          <div>
            <h2 className="text-3xl font-black mb-8">Class Management</h2>
            <button onClick={handleAddClass} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl mb-8 flex items-center justify-center gap-3">
              <Plus size={28}/> ADD NEW CLASS
            </button>
            <div className="grid grid-cols-3 gap-6">
              {classes.map(c => (
                <div key={c._id} className="bg-yellow-50 p-8 rounded-3xl border-4 border-yellow-300 text-center">
                  <h3 className="text-2xl font-black text-yellow-800">{c.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
        {adminTab === 'curriculum' && (
          <div>
            <h2 className="text-3xl font-black mb-8">School Curriculum</h2>
            <select 
              name="selectedClass"
              className="w-full p-5 bg-yellow-100 border-4 border-yellow-400 rounded-2xl font-black text-xl mb-8" 
              value={selectedClass} 
              onChange={e => {setSelectedClass(e.target.value); fetchWordsForClass(e.target.value);}}
            >
              <option value="">SELECT CLASS TO EDIT</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {selectedClass && (
              <div className="bg-white p-8 rounded-3xl shadow-xl">
                <div className="flex gap-4 mb-6">
                  <input 
                    name="word"
                    placeholder="Word" 
                    className="flex-1 p-4 border-2 rounded-xl" 
                    value={wordForm.word} 
                    onChange={e => setWordForm({...wordForm, word: e.target.value})} 
                  />
                  <button onClick={fetchAIWords} className="bg-purple-600 text-white px-8 rounded-xl font-black flex items-center gap-2">
                    {loadingAI ? <RefreshCw className="animate-spin" /> : <Sparkles />} AI
                  </button>
                </div>
                <input 
                  name="definition"
                  placeholder="Definition" 
                  className="w-full p-4 border-2 rounded-xl mb-4" 
                  value={wordForm.definition} 
                  onChange={e => setWordForm({...wordForm, definition: e.target.value})} 
                />
                <input 
                  name="usage"
                  placeholder="Usage" 
                  className="w-full p-4 border-2 rounded-xl mb-4" 
                  value={wordForm.usage} 
                  onChange={e => setWordForm({...wordForm, usage: e.target.value})} 
                />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input 
                    name="synonyms"
                    placeholder="Synonyms" 
                    className="p-4 border-2 rounded-xl" 
                    value={wordForm.synonyms} 
                    onChange={e => setWordForm({...wordForm, synonyms: e.target.value})} 
                  />
                  <input 
                    name="antonyms"
                    placeholder="Antonyms" 
                    className="p-4 border-2 rounded-xl" 
                    value={wordForm.antonyms} 
                    onChange={e => setWordForm({...wordForm, antonyms: e.target.value})} 
                  />
                </div>
                <input 
                  name="etymology"
                  placeholder="Etymology" 
                  className="w-full p-4 border-2 rounded-xl mb-6" 
                  value={wordForm.etymology} 
                  onChange={e => setWordForm({...wordForm, etymology: e.target.value})} 
                />
                <button onClick={handleSaveWord} className="w-full bg-green-600 text-white font-black py-5 rounded-xl">
                  SAVE WORD
                </button>
                <div className="mt-8 space-y-4 max-h-96 overflow-y-auto">
                  {(wordBank[selectedClass] || []).map(w => (
                    <div key={w._id} className="bg-yellow-50 p-6 rounded-2xl flex justify-between items-center border-2 border-yellow-200">
                      <div>
                        <p className="font-black text-xl text-yellow-900">{w.word}</p>
                        <p className="text-sm text-yellow-700">{w.definition.substring(0, 100)}...</p>
                      </div>
                      <div className="flex gap-3">
                        <Edit3 size={24} className="text-blue-600 cursor-pointer" />
                        <Trash2 size={24} className="text-red-600 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {adminTab === 'exam_control' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-8 text-center">Live Exam Control</h2>
            <div className="bg-white p-10 rounded-3xl shadow-2xl">
              <select 
                name="selectedClass"
                className="w-full p-5 border-4 border-gray-300 rounded-2xl font-black mb-8" 
                value={selectedClass} 
                onChange={e => {setSelectedClass(e.target.value); fetchWordsForClass(e.target.value);}}
              >
                <option value="">CHOOSE CLASS</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block font-black mb-2">Test Mode</label>
                  <select 
                    name="testMode"
                    className="w-full p-4 border-2 rounded-xl font-bold" 
                    value={sessionConfig.mode} 
                    onChange={e => setSessionConfig({...sessionConfig, mode: e.target.value})}
                  >
                    <option value="test_standard">Standard Spelling</option>
                    <option value="test_rush">Rush Hour (Timed)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black mb-2">Timer (seconds)</label>
                  <input 
                    name="timer"
                    type="number" 
                    className="w-full p-4 border-2 rounded-xl font-bold" 
                    value={sessionConfig.timer} 
                    onChange={e => setSessionConfig({...sessionConfig, timer: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block font-black mb-2">Word Count</label>
                  <select 
                    name="wordCount"
                    className="w-full p-4 border-2 rounded-xl font-bold" 
                    value={sessionConfig.wordCount} 
                    onChange={e => setSessionConfig({...sessionConfig, wordCount: Number(e.target.value)})}
                  >
                    <option value="10">10 Words</option>
                    <option value="20">20 Words</option>
                    <option value="30">30 Words</option>
                  </select>
                </div>
              </div>
              <button onClick={handleStartLiveTest} className="w-full bg-red-600 text-white font-black py-6 rounded-2xl text-2xl hover:bg-red-700 shadow-xl">
                BROADCAST TEST
              </button>
            </div>
          </div>
        )}
        {adminTab === 'monitor' && (
          <div>
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3"><AlertTriangle size={36} className="text-red-600"/> Live Session Monitor</h2>
            <div className="grid gap-6">
              {classes.map(c => {
                const isActive = activeSessions.includes(c._id);
                return (
                  <div key={c._id} className={`p-8 rounded-3xl border-4 ${isActive ? 'bg-red-50 border-red-400 animate-pulse' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black">{c.name}</h3>
                        <p className="text-lg font-bold uppercase ${isActive ? 'text-red-600' : 'text-gray-500'}">{isActive ? 'LIVE' : 'IDLE'}</p>
                      </div>
                      {isActive && <button onClick={() => handleStopLiveTest(c._id)} className="bg-red-600 text-white px-8 py-4 rounded-xl font-black">STOP TEST</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {adminTab === 'results' && (
          <div>
            <h2 className="text-3xl font-black mb-12">School Results & Rankings</h2>
            <Leaderboard type="School-Wide Champions" data={results} />
            {classes.map(c => {
              const classRes = results.filter(r => r.class_id === c._id);
              if (classRes.length === 0) return null;
              return <Leaderboard key={c._id} type={`${c.name} Class Leaders`} data={classRes} />;
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (activeView === 'teacher_dash') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-8 rounded-3xl shadow-xl mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-blue-800">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage your classes and students</p>
          </div>
          <button onClick={handleLogout} className="bg-red-100 text-red-600 px-8 py-4 rounded-xl font-black">
            Logout
          </button>
        </header>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-black mb-6">Start Live Test</h2>
            <select 
              name="selectedClass"
              className="w-full p-4 border-2 rounded-xl mb-6 font-bold" 
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <button onClick={handleStartLiveTest} className="w-full bg-red-600 text-white font-black py-5 rounded-xl text-xl">
              LAUNCH TEST
            </button>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-black mb-6">Class Performance</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.filter(r => classes.some(c => c._id === r.class_id)).map(r => (
                <div key={r._id} className="flex justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-bold">{r.student_id?.name || 'Unknown'}</span>
                  <span className="font-black text-green-600">{r.score}/{r.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (activeView === 'student_dash') return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-green-50 p-8 relative overflow-hidden">
      <Toaster />
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <BackgroundBees />
      <div className="max-w-6xl mx-auto z-10">
        <header className="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-gray-800">Hi, {currentUser?.name || 'Speller'}!</h1>
            <p className="text-xl text-green-600 font-medium">{isSoloUser ? 'Solo Speller' : 'School Student'}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout} 
            className="bg-red-100 text-red-600 px-8 py-4 rounded-2xl font-bold"
          >
            Logout
          </motion.button>
        </header>

        {achievements.length > 0 && <AchievementBanner achievements={achievements} />}

        <div className={`grid grid-cols-2 md:grid-cols-${isSoloUser ? '2' : '4'} gap-8 mb-12`}>
          <motion.div whileHover={{ scale: 1.08 }} className="bg-gradient-to-br from-orange-100 to-orange-200 p-8 rounded-3xl shadow-xl text-center">
            <p className="text-orange-700 uppercase text-sm font-black mb-2">AVG SCORE</p>
            <h2 className="text-6xl font-black text-orange-900">{studentStats.avg}%</h2>
          </motion.div>
          <motion.div whileHover={{ scale: 1.08 }} className="bg-gradient-to-br from-green-100 to-green-200 p-8 rounded-3xl shadow-xl text-center">
            <p className="text-green-700 uppercase text-sm font-black mb-2">COMPLETED</p>
            <h2 className="text-6xl font-black text-green-900">{studentStats.completed}</h2>
          </motion.div>

          {!isSoloUser && (
            <>
              <motion.div whileHover={{ scale: 1.15 }} className="bg-gradient-to-br from-blue-100 to-blue-200 p-8 rounded-3xl shadow-xl text-center">
                <p className="text-blue-700 uppercase text-sm font-black mb-4">CLASS RANK</p>
                <motion.img 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  src="https://png.pngtree.com/png-clipart/20250415/original/pngtree-golden-medal-first-place-with-ribbon-png-image_20819231.png"
                  alt="Class Rank"
                  className="w-24 h-24 mx-auto"
                />
                <h2 className="text-4xl font-black text-blue-900 mt-4">#{studentStats.classRank}</h2>
              </motion.div>
              <motion.div whileHover={{ scale: 1.15 }} className="bg-gradient-to-br from-purple-100 to-purple-200 p-8 rounded-3xl shadow-xl text-center">
                <p className="text-purple-700 uppercase text-sm font-black mb-4">SCHOOL RANK</p>
                <motion.img 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  src="https://png.pngtree.com/png-clipart/20250415/original/pngtree-golden-medal-first-place-with-ribbon-png-image_20819231.png"
                  alt="School Rank"
                  className="w-24 h-24 mx-auto"
                />
                <h2 className="text-4xl font-black text-purple-900 mt-4">#{studentStats.schoolRank}</h2>
              </motion.div>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-10 mb-16">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }} onClick={startSession} className="bg-gradient-to-r from-yellow-400 to-orange-500 p-12 rounded-3xl shadow-2xl text-center">
            <Sparkles size={80} className="mx-auto mb-6 text-white"/>
            <h3 className="text-3xl font-black text-white">Practice Mode</h3>
          </motion.button>

          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }} onClick={createMultiRoom} className="bg-gradient-to-r from-green-500 to-emerald-600 p-12 rounded-3xl shadow-2xl text-center">
            <Gamepad2 size={80} className="mx-auto mb-6 text-white"/>
            <h3 className="text-3xl font-black text-white">Create Multiplayer</h3>
          </motion.button>

          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }} onClick={joinMultiRoom} className="bg-gradient-to-r from-purple-500 to-pink-600 p-12 rounded-3xl shadow-2xl text-center">
            <Users size={80} className="mx-auto mb-6 text-white"/>
            <h3 className="text-3xl font-black text-white">Join Multiplayer</h3>
          </motion.button>
        </div>

        {!isSoloUser && (
          <div className="space-y-16">
            <Leaderboard type="Class Leaderboard" data={results.filter(r => r.class_id === currentUser?.class_id) || []} />
            <Leaderboard type="School Leaderboard" data={results.filter(r => r.school_id === currentUser?.school_id) || []} />
            <Leaderboard type="Global Leaderboard" data={results} />
          </div>
        )}
      </div>
    </div>
  );

  if (activeView === 'game_interface') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-green-100 p-12">
      <motion.div className="text-center mb-8">
        <h1 className="text-7xl font-black text-gray-800">Word {game.index + 1} / {game.words.length}</h1>
        <motion.div 
          animate={{ scale: game.timeLeft <= 10 ? [1, 1.2, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className={`text-5xl font-black mt-6 ${game.timeLeft <= 10 ? 'text-red-600' : 'text-green-600'}`}
        >
          Time: {game.timeLeft}s
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 p-12 rounded-3xl shadow-2xl max-w-4xl w-full text-center mb-12"
      >
        <p className="text-4xl font-medium text-gray-700 leading-relaxed">
          {game.words[game.index]?.definition || 'Loading...'}
        </p>
      </motion.div>

      <input
        ref={inputRef}
        autoFocus
        name="spellingAnswer"
        className="w-full max-w-2xl text-center text-6xl font-black border-b-8 border-gray-800 outline-none bg-transparent mb-16"
        value={game.input}
        onChange={e => setGame({...game, input: e.target.value})}
        onKeyDown={e => e.key === 'Enter' && submitGameWord()}
        placeholder="Type the word..."
      />

      <div className="flex gap-12">
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={submitGameWord} className="bg-green-600 text-white px-16 py-6 rounded-3xl font-black text-3xl shadow-2xl">
          SUBMIT
        </motion.button>
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveView('student_dash')} className="bg-gray-400 text-gray-800 px-16 py-6 rounded-3xl font-black text-3xl">
          QUIT
        </motion.button>
      </div>
    </div>
  );

  if (activeView === 'multi_game') return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <Toaster />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-8">Multiplayer Spelling Battle</h1>
        <p className="text-center text-2xl mb-8">Room: {multiPlayer.room}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {multiPlayer.players.map(player => (
            <motion.div 
              key={player}
              whileHover={{ scale: 1.1 }}
              className="bg-white p-6 rounded-3xl shadow-xl text-center"
            >
              <p className="font-black text-xl">{player}</p>
              <p className="text-4xl font-black text-green-600 mt-2">{multiPlayer.scores[player] || 0}</p>
            </motion.div>
          ))}
        </div>

        {multiPlayer.waiting ? (
          <div className="text-center">
            <h2 className="text-4xl font-black">Waiting for players...</h2>
            <p className="text-xl mt-4">Share the room code!</p>
          </div>
        ) : (
          <>
            <motion.div className="text-center mb-8">
              <h2 className="text-6xl font-black animate-pulse">Time: {multiPlayer.timeLeft}s</h2>
            </motion.div>
            <div className="bg-white/90 p-12 rounded-3xl shadow-2xl max-w-4xl mx-auto text-center mb-8">
              <p className="text-4xl font-medium text-gray-700">{multiPlayer.currentWord}</p>
            </div>
            <input
              ref={inputRef}
              autoFocus
              name="multiplayerAnswer"
              className="w-full max-w-2xl text-center text-6xl font-black border-b-8 border-gray-800 outline-none bg-transparent mb-8 block mx-auto"
              value={game.input}
              onChange={e => setGame({...game, input: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && submitMultiAnswer()}
              placeholder="Your answer..."
            />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={submitMultiAnswer} className="bg-green-600 text-white px-16 py-6 rounded-3xl font-black text-3xl shadow-2xl">
              SUBMIT
            </motion.button>
          </>
        )}
      </div>
    </div>
  );

  return null;
};

export default App;