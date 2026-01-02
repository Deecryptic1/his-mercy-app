/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  User, Eye, EyeOff, Key, Plus, Edit3, Trash2, Volume2,
  BarChart2, Trophy, BookOpen, LogOut, Play, Users, Loader2, School, Globe
} from 'lucide-react';
import Confetti from 'react-confetti';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import logo from './logo.jpg';

// Config
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : 'https://school-app-backend-d4fi.onrender.com/api';

const socket = io(API_URL.replace('/api', ''));

// Bee Animations (enhanced for mobile)
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(8deg); } }
  @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes squash { 0% { transform: scale(1, 1); } 40% { transform: scale(1.8, 0.3); } 100% { transform: scale(1, 1); } }
  .animate-float { animation: float 10s ease-in-out infinite; }
  .animate-pop { animation: pop 0.3s ease-in-out; }
  .animate-slide-in { animation: slideIn 0.5s ease-out forwards; }
  .animate-squash { animation: squash 0.6s ease-out; }
  .transition-all { transition: all 300ms ease; }
`;
document.head.appendChild(styleTag);

const InteractiveBee = ({ size = 'text-6xl', delay = '0s' }) => {
  const [position, setPosition] = useState({
    top: Math.random() * 60 + 20 + '%',
    left: Math.random() * 60 + 20 + '%'
  });
  const [squashing, setSquashing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleTap = (e) => {
    e.stopPropagation();
    setSquashing(true);
    setShowConfetti(true);
    setTimeout(() => {
      setSquashing(false);
      setShowConfetti(false);
      setPosition({
        top: Math.random() * 60 + 20 + '%',
        left: Math.random() * 60 + 20 + '%'
      });
    }, 800);
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={120}
          gravity={0.35}
          initialVelocityY={-12}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 50
          }}
        />
      )}
      <div
        className={`fixed opacity-30 cursor-pointer z-10 ${squashing ? 'animate-squash' : 'animate-float'}`}
        style={{ top: position.top, left: position.left, animationDelay: delay }}
        onClick={handleTap}
      >
        <div className={size}>🐝</div>
      </div>
    </>
  );
};

const BackgroundBees = () => (
  <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
    <InteractiveBee size="text-5xl sm:text-9xl" delay="0s" />
    <InteractiveBee size="text-4xl sm:text-8xl" delay="1s" />
    <InteractiveBee size="text-3xl sm:text-7xl" delay="2s" />
    <InteractiveBee size="text-4xl sm:text-8xl" delay="0.5s" />
    <InteractiveBee size="text-2xl sm:text-6xl" delay="3s" />
    <InteractiveBee size="text-5xl sm:text-9xl" delay="4s" />
  </div>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('login');
  const [loading, setLoading] = useState(true);

  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', username: '', password: '', role: 'student', school_code: '', individual: false
  });
  const [showPassword, setShowPassword] = useState(false);

  // Data
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [words, setWords] = useState([]);
  const [newWordForm, setNewWordForm] = useState({ word: '', definition: '', synonyms: '', antonyms: '', usage: '', etymology: '', category: 'General' });
  const [editingWordId, setEditingWordId] = useState(null);

  const [practiceWords, setPracticeWords] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceScore, setPracticeScore] = useState(0);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [students, setStudents] = useState([]);

  // Admin
  const [schools, setSchools] = useState([]);
  const [newSchoolForm, setNewSchoolForm] = useState({ name: '', code: '', signup_fee: 0 });
  const [newClassForm, setNewClassForm] = useState({ name: '' });
  const [users, setUsers] = useState([]);

  // Live Test
  const [liveTestActive, setLiveTestActive] = useState(false);
  const [liveWord, setLiveWord] = useState(null);
  const [liveTimer, setLiveTimer] = useState(0);
  const [liveAnswer, setLiveAnswer] = useState('');
  const [liveFeedback, setLiveFeedback] = useState(null);

  const isMasterAdmin = currentUser && currentUser.username === 'creator'; // Change to your master admin username

  const fetchWithAuth = async (endpoint, options = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (res.status === 401) {
      setCurrentUser(null);
      setActiveView('login');
      toast.error('Session expired');
    }
    return res;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('login');
    toast.success('Logged out successfully!');
  };

  const handleLogin = async () => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentUser(data.user);
      setActiveView(data.user.role + '_dash');
      toast.success(`Welcome back, ${data.user.name}!`);
    } else {
      toast.error(data.error || 'Login failed');
    }
  };

  const handleRegister = async () => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm)
    });
    const data = await res.json();

    if (res.ok) {
      if (data.payment_pending && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.success('Registration successful! Please login.');
        setActiveView('login');
      }
    } else {
      toast.error(data.error || 'Registration failed');
    }
  };

  const fetchClasses = async () => {
    const res = await fetchWithAuth('/classes');
    if (res.ok) setClasses(await res.json());
  };

  const fetchWords = async (classId) => {
    const res = await fetchWithAuth(`/words/${classId}`);
    if (res.ok) {
      const json = await res.json();
      setWords(json.words || json);
    }
  };

  const fetchLeaderboard = async () => {
    const res = await fetchWithAuth('/leaderboard/school');
    if (res.ok) setLeaderboard((await res.json()).leaderboard || []);
  };

  const fetchSchools = async () => {
    const res = await fetchWithAuth('/schools');
    if (res.ok) setSchools(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetchWithAuth('/users');
    if (res.ok) setUsers(await res.json());
  };

  const fetchStudents = async (classId) => {
    const res = await fetchWithAuth(`/classes/${classId}/students`);
    if (res.ok) setStudents((await res.json()).students || []);
  };

  const startPractice = async () => {
    const classId = selectedClass || currentUser?.class_id;
    if (!classId) return toast.error('No class selected');
    await fetchWords(classId);
    if (words.length === 0) return toast.error('No words available');
    const shuffled = [...words].sort(() => 0.5 - Math.random()).slice(0, 15);
    setPracticeWords(shuffled);
    setPracticeIndex(0);
    setPracticeScore(0);
    setPracticeInput('');
    setPracticeFeedback(null);
    setActiveView('practice');
  };

  const submitPractice = () => {
    const current = practiceWords[practiceIndex];
    const correct = practiceInput.trim().toLowerCase() === current.word.toLowerCase();
    setPracticeFeedback(correct ? 'correct' : 'wrong');
    if (correct) setPracticeScore(prev => prev + 1);

    setTimeout(() => {
      if (practiceIndex + 1 >= practiceWords.length) {
        toast.success(`Practice Complete! Score: ${practiceScore + (correct ? 1 : 0)}/${practiceWords.length}`);
        setActiveView(currentUser.role + '_dash');
      } else {
        setPracticeIndex(prev => prev + 1);
        setPracticeInput('');
        setPracticeFeedback(null);
      }
    }, 1500);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartLiveTest = async () => {
    const classId = selectedClass;
    if (!classId) return toast.error('Select a class');
    await fetchWords(classId);
    if (words.length === 0) return toast.error('No words in class');

    socket.emit('startTest', { classId, mode: 'live', words, timer: 60 });
    toast.success('Live test started!');
  };

  const handleSubmitLiveAnswer = () => {
    if (!liveWord || !liveAnswer.trim()) return;
    socket.emit('submitAnswer', {
      classId: currentUser.class_id,
      studentId: currentUser._id,
      word: liveWord.word,
      answer: liveAnswer,
      timeTaken: 60 - liveTimer
    });
    setLiveFeedback('submitted');
    setLiveAnswer('');
  };

  const handleSaveWord = async () => {
    if (!selectedClass) return toast.error('Select a class');
    const method = editingWordId ? 'PUT' : 'POST';
    const url = editingWordId ? `${API_URL}/words/${editingWordId}` : `${API_URL}/words`;
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newWordForm, class_id: selectedClass })
    });
    if (res.ok) {
      toast.success(editingWordId ? 'Word updated' : 'Word added');
      fetchWords(selectedClass);
      setNewWordForm({ word: '', definition: '', synonyms: '', antonyms: '', usage: '', etymology: '', category: 'General' });
      setEditingWordId(null);
    } else {
      toast.error('Save failed');
    }
  };

  const handleEditWord = (word) => {
    setNewWordForm(word);
    setEditingWordId(word._id);
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm('Delete this word?')) return;
    const res = await fetch(`${API_URL}/words/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      toast.success('Word deleted');
      fetchWords(selectedClass);
    } else {
      toast.error('Delete failed');
    }
  };

  const handleCreateSchool = async () => {
    const res = await fetch(`${API_URL}/schools`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchoolForm)
    });
    if (res.ok) {
      toast.success('School created');
      fetchSchools();
      setNewSchoolForm({ name: '', code: '', signup_fee: 0 });
    } else {
      toast.error('Create failed');
    }
  };

  const handleCreateClass = async () => {
    const res = await fetch(`${API_URL}/classes`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClassForm)
    });
    if (res.ok) {
      toast.success('Class created');
      fetchClasses();
      setNewClassForm({ name: '' });
    } else {
      toast.error('Create failed');
    }
  };

  const handleEnrollStudent = async (studentId, classId) => {
    const res = await fetch(`${API_URL}/enroll`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, class_id: classId })
    });
    if (res.ok) {
      toast.success('Student enrolled');
      fetchStudents(classId);
    } else {
      toast.error('Enrollment failed');
    }
  };

 useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'GET',
        credentials: 'include', // Critical
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.accessToken) {
          setCurrentUser(data.user);
          setActiveView(data.user.role + '_dash');
          if (data.user.class_id) setSelectedClass(data.user.class_id);
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };
  checkAuth();
}, []);

  useEffect(() => {
    if (currentUser) {
      fetchClasses();
      fetchLeaderboard();
      if (currentUser.role === 'admin') {
        fetchSchools();
        fetchUsers();
      }
      if (currentUser.class_id) fetchWords(currentUser.class_id);
    }
  }, [currentUser]);

  useEffect(() => {
    socket.on('testStarted', ({ timer }) => {
      setLiveTestActive(true);
      setLiveTimer(timer);
      toast.success('Live test started!');
    });

    socket.on('newWord', (word) => {
      setLiveWord(word);
      setLiveAnswer('');
      setLiveFeedback(null);
      speak(word.definition);
    });

    return () => {
      socket.off('testStarted');
      socket.off('newWord');
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-100 to-green-100">
        <Loader2 className="animate-spin text-yellow-600" size={64} />
      </div>
    );
  }

  // Login / Register (mobile-friendly)
  if (activeView === 'login' || activeView === 'register') {
    const isRegister = activeView === 'register';
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden bg-gradient-to-b from-yellow-100 to-green-100">
        <Toaster position="top-center" />
        <BackgroundBees />

        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-[3rem] shadow-2xl w-full max-w-md min-w-[320px] border-4 border-white relative z-30 transition-all duration-300 animate-slide-in">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-24 sm:w-32 h-24 sm:h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-white overflow-hidden transition-transform duration-300 hover:scale-105">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-yellow-500 text-center uppercase tracking-tighter drop-shadow-sm">
              Un<span className="text-4xl sm:text-6xl inline-block align-middle hover:scale-125 transition-transform animate-float">🐝</span>lievable<br />
              <span className="text-xl sm:text-2xl text-green-800">Spellings</span>
            </h1>
          </div>

          {isRegister && (
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <input type="text" placeholder="Full Name" className="w-full bg-gray-50 border-2 pl-4 p-3 rounded-2xl transition-all duration-300 focus:border-yellow-400" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="School Code (optional)" className="flex-1 bg-gray-50 border-2 pl-4 p-3 rounded-2xl transition-all duration-300 focus:border-yellow-400" value={registerForm.school_code} onChange={e => setRegisterForm({ ...registerForm, school_code: e.target.value, individual: false })} />
                <button onClick={() => setRegisterForm({ ...registerForm, individual: true, school_code: '' })} className={`px-4 py-3 rounded-2xl font-bold transition-all duration-300 ${registerForm.individual ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  Individual
                </button>
              </div>
              <select className="w-full p-3 border rounded-xl bg-gray-50 transition-all duration-300 focus:border-yellow-400" value={registerForm.role} onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-yellow-500 transition-colors duration-300" size={20} />
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-gray-50 border-2 border-gray-100 pl-12 p-3 rounded-2xl font-bold outline-none focus:border-yellow-400 focus:bg-white transition-all duration-300 text-gray-700"
                value={isRegister ? registerForm.username : loginForm.username}
                onChange={e => isRegister ? setRegisterForm({ ...registerForm, username: e.target.value }) : setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </div>

            <div className="relative group">
              <Key className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-yellow-500 transition-colors duration-300" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-gray-50 border-2 border-gray-100 pl-12 pr-12 p-3 rounded-2xl font-bold outline-none focus:border-yellow-400 focus:bg-white transition-all duration-300 text-gray-700"
                value={isRegister ? registerForm.password : loginForm.password}
                onChange={e => isRegister ? setRegisterForm({ ...registerForm, password: e.target.value }) : setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-green-600 transition-colors duration-300">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              onClick={isRegister ? handleRegister : handleLogin}
              className="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg tracking-wide"
            >
              {isRegister ? 'JOIN THE HIVE 🐝' : 'ENTER THE HIVE 🐝'}
            </button>
          </div>

          <p className="text-center mt-6 text-gray-600 text-sm sm:text-base">
            {isRegister ? (
              <>Already have an account? <button onClick={() => setActiveView('login')} className="text-green-600 font-bold hover:underline transition-all duration-300">Login</button></>
            ) : (
              <>New here? <button onClick={() => setActiveView('register')} className="text-green-600 font-bold hover:underline transition-all duration-300">Register</button></>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Common Dashboard Layout
  const DashboardLayout = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-green-100 p-4 sm:p-8">
      <Toaster position="top-center" />
      <BackgroundBees />
      <div className="max-w-6xl mx-auto relative z-30 space-y-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-green-700">
              {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard
            </h1>
            <p className="text-gray-600">Welcome, {currentUser.name}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 transition-all duration-300 hover:bg-red-600 active:scale-95">
            <LogOut size={20} /> Logout
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Student Dashboard
  if (activeView === 'student_dash') {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button onClick={startPractice} className="bg-orange-500 text-white p-8 rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-center">
            <Play size={64} className="mx-auto mb-4" />
            <h3 className="text-2xl font-black">Start Practice</h3>
          </button>

          <div className="bg-purple-500 text-white p-8 rounded-3xl shadow-xl transition-all duration-300">
            <Trophy size={64} className="mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-4">My Rank</h3>
            <p className="text-5xl font-black">
              #{leaderboard.find(e => e.student._id === currentUser._id)?.rank || '--'}
            </p>
          </div>

          <div className="bg-blue-500 text-white p-8 rounded-3xl shadow-xl transition-all duration-300">
            <BarChart2 size={64} className="mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-4">Top 10 Leaderboard</h3>
            <div className="space-y-3 text-sm">
              {leaderboard.slice(0, 10).map((e, i) => (
                <div key={i} className="bg-white/20 p-3 rounded-xl">
                  #{e.rank} {e.student.name} — {e.avgPercentage}%
                </div>
              ))}
            </div>
          </div>
        </div>

        {liveTestActive && liveWord && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-2xl w-full text-center shadow-2xl">
              <h2 className="text-3xl font-black mb-8">Live Test</h2>
              <p className="text-2xl mb-8">{liveWord.definition}</p>
              <input
                type="text"
                placeholder="Type answer..."
                value={liveAnswer}
                onChange={e => setLiveAnswer(e.target.value)}
                className="w-full p-4 text-2xl text-center border-4 border-yellow-400 rounded-2xl mb-6"
                autoFocus
              />
              <button onClick={handleSubmitLiveAnswer} className="bg-green-500 text-white font-black py-4 px-12 rounded-2xl text-xl hover:bg-green-600">
                Submit Answer
              </button>
              {liveFeedback && <p className="text-2xl mt-6 text-green-600">Submitted!</p>}
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // Teacher Dashboard
  if (activeView === 'teacher_dash') {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Word Bank */}
          <div className="bg-white p-6 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><BookOpen size={28} /> Word Bank</h2>
            <select className="w-full p-4 border-2 rounded-xl mb-6 focus:border-yellow-500 transition-all" value={selectedClass} onChange={e => {
              setSelectedClass(e.target.value);
              fetchWords(e.target.value);
            }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>

            {selectedClass && (
              <>
                <div className="space-y-4 mb-6">
                  <input placeholder="Word" value={newWordForm.word} onChange={e => setNewWordForm({ ...newWordForm, word: e.target.value })} className="w-full p-4 border-2 rounded-xl focus:border-yellow-500 transition-all" />
                  <textarea placeholder="Definition" value={newWordForm.definition} onChange={e => setNewWordForm({ ...newWordForm, definition: e.target.value })} className="w-full p-4 border-2 rounded-xl focus:border-yellow-500 transition-all h-32" />
                </div>
                <button onClick={handleSaveWord} className="w-full bg-green-500 text-white font-black py-4 rounded-2xl hover:bg-green-600 transition-all">
                  {editingWordId ? 'Update Word' : 'Add Word'}
                </button>

                <div className="mt-8 space-y-4 max-h-96 overflow-y-auto">
                  {words.map(w => (
                    <div key={w._id} className="p-6 border-2 rounded-2xl flex justify-between items-center hover:shadow-lg transition-all">
                      <div>
                        <p className="text-xl font-bold">{w.word}</p>
                        <p className="text-gray-600">{w.definition}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleEditWord(w)} className="text-blue-600 hover:text-blue-800"><Edit3 size={24} /></button>
                        <button onClick={() => handleDeleteWord(w._id)} className="text-red-600 hover:text-red-800"><Trash2 size={24} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Live Test & Enrollment */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Play size={28} /> Start Live Test</h2>
              <select className="w-full p-4 border-2 rounded-xl mb-6 focus:border-yellow-500 transition-all" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <button onClick={handleStartLiveTest} disabled={!selectedClass} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl hover:bg-red-600 disabled:opacity-50 transition-all">
                Start Live Test
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Users size={28} /> Enroll Students</h2>
              <select className="w-full p-4 border-2 rounded-xl mb-6 focus:border-yellow-500 transition-all" value={selectedClass} onChange={e => {
                setSelectedClass(e.target.value);
                fetchStudents(e.target.value);
              }}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {selectedClass && students.length > 0 && (
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s._id} className="p-4 border-2 rounded-xl flex justify-between items-center hover:shadow-md transition-all">
                      <p>{s.name} ({s.username})</p>
                      <button onClick={() => handleEnrollStudent(s._id, selectedClass)} className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-all">
                        Enroll
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin Dashboard (School Admin vs Master Admin)
  if (activeView === 'admin_dash') {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* School Management */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><School size={32} /> School Management</h2>
            <div className="space-y-4 mb-8">
              <input placeholder="School Name" value={newSchoolForm.name} onChange={e => setNewSchoolForm({ ...newSchoolForm, name: e.target.value })} className="w-full p-4 border-2 rounded-xl focus:border-yellow-500 transition-all" />
              <input placeholder="School Code" value={newSchoolForm.code} onChange={e => setNewSchoolForm({ ...newSchoolForm, code: e.target.value })} className="w-full p-4 border-2 rounded-xl focus:border-yellow-500 transition-all" />
              <input type="number" placeholder="Signup Fee (₦)" value={newSchoolForm.signup_fee} onChange={e => setNewSchoolForm({ ...newSchoolForm, signup_fee: Number(e.target.value) })} className="w-full p-4 border-2 rounded-xl focus:border-yellow-500 transition-all" />
              <button onClick={handleCreateSchool} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all">
                Create New School
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4">Existing Schools</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {schools.map(s => (
                <div key={s._id} className="p-6 border-2 rounded-2xl bg-gradient-to-r from-yellow-50 to-green-50 transition-all hover:shadow-lg">
                  <p className="font-bold text-lg">{s.name}</p>
                  <p className="text-sm text-gray-600">Code: {s.code} | Fee: ₦{s.signup_fee}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Class Management */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Plus size={32} /> Class Management</h2>
            <div className="space-y-4 mb-8">
              <input placeholder="Class Name (e.g., JSS1)" value={newClassForm.name} onChange={e => setNewClassForm({ ...newClassForm, name: e.target.value })} className="w-full p-4 border-2 rounded-xl focus:border-yellow-500 transition-all" />
              <button onClick={handleCreateClass} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all">
                Create New Class
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4">All Classes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {classes.map(c => (
                <div key={c._id} className="p-6 border-2 rounded-2xl text-center bg-gradient-to-br from-purple-100 to-pink-100 hover:shadow-xl transition-all">
                  <p className="font-bold text-lg">{c.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Master Admin Only - Full User List */}
          {isMasterAdmin && (
            <div className="bg-white p-8 rounded-3xl shadow-2xl lg:col-span-2">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Globe size={32} /> Master Admin Panel</h2>
              <p className="text-gray-600 mb-6">You have full access to all users across all schools.</p>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {users.map(u => (
                  <div key={u._id} className="p-6 border-2 rounded-2xl flex justify-between items-center hover:shadow-lg transition-all">
                    <div>
                      <p className="font-bold">{u.name} ({u.username})</p>
                      <p className="text-sm text-gray-600">Role: {u.role} | School: {u.school_id?.name || 'Individual'}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-white font-bold ${u.payment_pending ? 'bg-red-500' : 'bg-green-500'}`}>
                      {u.payment_pending ? 'Payment Pending' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Practice Mode
  if (activeView === 'practice') {
    const current = practiceWords[practiceIndex];
    if (!current) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center p-4">
        <Toaster />
        <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-4xl w-full shadow-2xl text-center">
          <div className="flex justify-between text-lg sm:text-xl font-bold mb-8">
            <span>Word {practiceIndex + 1}/{practiceWords.length}</span>
            <span>Score: {practiceScore}</span>
          </div>

          <button onClick={() => speak(current.definition)} className="mx-auto mb-8 bg-yellow-400 p-6 sm:p-8 rounded-full shadow-2xl hover:scale-110 transition-all">
            <Volume2 size={48} className="sm:hidden" />
            <Volume2 size={64} className="hidden sm:block" />
          </button>

          <p className="text-2xl sm:text-3xl mb-12 leading-relaxed px-4">{current.definition}</p>

          <input
            autoFocus
            type="text"
            placeholder="Type the word..."
            value={practiceInput}
            onChange={e => setPracticeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitPractice()}
            className="w-full text-3xl sm:text-4xl text-center border-b-8 border-yellow-400 pb-4 outline-none mb-8"
          />

          {practiceFeedback && (
            <div className={`text-5xl sm:text-6xl font-black mb-8 ${practiceFeedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {practiceFeedback === 'correct' ? '✓ Correct!' : `✗ ${current.word}`}
            </div>
          )}

          <button onClick={submitPractice} className="bg-green-500 text-white font-black text-2xl py-6 px-12 rounded-2xl shadow-xl hover:bg-green-600 transition-all">
            Submit
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;