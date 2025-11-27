import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy,
  limit,
  doc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  LucideGamepad2, 
  LucideTrophy, 
  LucideSmartphone, 
  LucideUser, 
  LucideCheckCircle, 
  LucideAlertTriangle, 
  LucideLock, 
  LucideSettings, 
  LucideDownload, 
  LucideRefreshCw,
  LucideSave,
  LucidePercent
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'bozel-event-v2';

// --- DATA DEFAULT (Jika database kosong) ---
const DEFAULT_PRIZES = [
  { id: 1, label: '500💎', value: 500, color: '#ef4444', weight: 1 },   // Sangat Langka
  { id: 2, label: '355💎', value: 355, color: '#f97316', weight: 5 },   // Langka
  { id: 3, label: '140💎', value: 140, color: '#eab308', weight: 20 },  // Sedang
  { id: 4, label: '100💎', value: 100, color: '#3b82f6', weight: 50 },  // Sering
  { id: 5, label: '70💎',  value: 70,  color: '#a855f7', weight: 100 }, // Paling Sering
];

// --- KOMPONEN UTAMA ---
export default function App() {
  const [view, setView] = useState('landing'); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ name: '', phone: '', consent: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prizeResult, setPrizeResult] = useState(null);
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES); // State untuk hadiah dinamis
  
  // Admin State
  const [isAuth, setIsAuth] = useState(false);

  // Init Firebase Auth & Listen to Prize Config
  useEffect(() => {
    const initApp = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth Error", e);
      }
    };
    initApp();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to Prizes Config Realtime
        const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'game_config');
        const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().prizes) {
            setPrizes(docSnap.data().prizes);
          } else {
            // Jika belum ada config, gunakan default
            setPrizes(DEFAULT_PRIZES);
          }
          setLoading(false);
        }, (err) => {
          console.log("Config fetch error (using default):", err);
          setLoading(false);
        });
        return () => unsubscribeConfig();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- LOGIC ---

  const validatePhone = (phone) => {
    const regex = /^62\d{8,13}$/;
    return regex.test(phone);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userData.name.trim()) return setError('Nama wajib diisi.');
    if (!validatePhone(userData.phone)) return setError('Nomor WA harus diawali 62 (Contoh: 628123456789).');
    if (!userData.consent) return setError('Anda harus menyetujui syarat & ketentuan.');
    
    setLoading(true);

    try {
      if (!auth.currentUser) await signInAnonymously(auth);

      // Cek Duplikasi (Soft Check)
      try {
        const q = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'participants'),
          where('phone', '==', userData.phone)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setError('Nomor ini sudah pernah melakukan spin!');
          setLoading(false);
          return;
        }
      } catch (dbError) {
        console.warn("Skip dup check:", dbError);
      }

      setView('spin');
    } catch (err) {
      console.error("Error:", err);
      setError('Gangguan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const saveResult = async (prize) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'participants'), {
        name: userData.name,
        phone: userData.phone,
        prize_value: prize.value,
        prize_label: prize.label,
        timestamp: serverTimestamp(),
        verified: false,
      });
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // --- RENDER ---

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-orange-500 gap-4">
        <LucideRefreshCw className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-900/20 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        <header className="p-4 flex items-center justify-between bg-gray-900/80 backdrop-blur-md sticky top-0 border-b border-gray-800 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
              <LucideTrophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">BOZEL<span className="text-orange-500">GAMING</span></h1>
          </div>
          <button onClick={() => setView(view === 'admin' ? 'landing' : 'admin')} className="text-gray-600 hover:text-white transition p-2">
            <LucideLock className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-grow flex flex-col p-4">
          {view === 'landing' && (
            <LandingView 
              userData={userData} 
              setUserData={setUserData} 
              onSubmit={handleStart} 
              error={error}
              loading={loading}
            />
          )}
          
          {view === 'spin' && (
            <SpinView 
              prizes={prizes} 
              onFinish={(prize) => {
                setPrizeResult(prize);
                saveResult(prize);
                setTimeout(() => setView('result'), 1000);
              }} 
            />
          )}

          {view === 'result' && (
            <ResultView 
              prize={prizeResult} 
              userData={userData} 
            />
          )}

          {view === 'admin' && (
            <AdminView 
              user={user} 
              appId={appId} 
              db={db}
              isAuth={isAuth}
              setIsAuth={setIsAuth}
              currentPrizes={prizes}
              backToHome={() => setView('landing')}
            />
          )}
        </main>

        <footer className="p-4 text-center text-xs text-gray-600 border-t border-gray-800 mt-auto">
          <p>&copy; 2024 BozelGaming Event.</p>
        </footer>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function LandingView({ userData, setUserData, onSubmit, error, loading }) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center py-6 space-y-2">
        <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-500/20 mb-2">
          Event Terbatas
        </div>
        <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-sm">
          DIAMOND <br/><span className="text-orange-500">GRATIS</span>
        </h2>
        <p className="text-gray-400 text-sm">Putar roda keberuntungan dan menangkan hingga 500 Diamond FreeFire sekarang!</p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Nama Lengkap</label>
            <div className="relative">
              <LucideUser className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                placeholder="Masukkan Nickname"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 transition placeholder-gray-600"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Nomor WhatsApp</label>
            <div className="relative">
              <LucideSmartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({...userData, phone: e.target.value.replace(/\D/g, '')})}
                placeholder="628xxxxxxxxxx"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 transition placeholder-gray-600 font-mono"
              />
            </div>
            <p className="text-[10px] text-gray-500 ml-1">*Gunakan kode negara 62.</p>
          </div>
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="consent"
              checked={userData.consent}
              onChange={(e) => setUserData({...userData, consent: e.target.checked})}
              className="mt-1 w-4 h-4 rounded border-gray-600 text-orange-500 bg-gray-900"
            />
            <label htmlFor="consent" className="text-xs text-gray-400 leading-tight">
              Saya setuju data saya diproses untuk pengiriman hadiah.
            </label>
          </div>
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-pulse">
              <LucideAlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <LucideRefreshCw className="animate-spin w-5 h-5" /> : <><LucideGamepad2 className="w-5 h-5" /> MULAI SPIN</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function SpinView({ prizes, onFinish }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const startSpin = () => {
    if (spinning) return;
    setSpinning(true);

    const totalWeight = prizes.reduce((sum, p) => sum + parseInt(p.weight), 0);
    let random = Math.random() * totalWeight;
    let selectedPrize = null;
    
    for (const prize of prizes) {
      if (random < parseInt(prize.weight)) {
        selectedPrize = prize;
        break;
      }
      random -= parseInt(prize.weight);
    }
    
    if (!selectedPrize) selectedPrize = prizes[prizes.length - 1];

    const segmentAngle = 360 / prizes.length;
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const baseSpins = 360 * 5; 
    const targetRotation = baseSpins + (360 - (prizeIndex * segmentAngle)) + (Math.random() * (segmentAngle - 10) + 5);

    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      onFinish(selectedPrize);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-10">
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="w-8 h-10 bg-white clip-path-triangle shadow-xl"></div>
        </div>
        <div className="absolute inset-0 rounded-full border-8 border-gray-800 shadow-2xl z-10 pointer-events-none"></div>
        <div 
          className="w-full h-full rounded-full overflow-hidden shadow-2xl relative transition-transform cubic-bezier(0.15, 0, 0.2, 1)"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: '5000ms',
            background: `conic-gradient(
              ${prizes.map((p, i) => {
                const start = (i * 100) / prizes.length;
                const end = ((i + 1) * 100) / prizes.length;
                return `${p.color} ${start}% ${end}%`;
              }).join(', ')}
            )`
          }}
        >
          {prizes.map((p, i) => (
            <div 
              key={p.id}
              className="absolute w-full h-full text-white font-bold text-sm md:text-base flex justify-center pt-4"
              style={{ transform: `rotate(${i * (360 / prizes.length)}deg)` }}
            >
              <span className="drop-shadow-md tracking-wider mt-2">{p.label}</span>
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full z-20 shadow-inner flex items-center justify-center border-4 border-gray-800">
           <div className="w-10 h-10 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
        </div>
      </div>
      <button
        onClick={startSpin}
        disabled={spinning}
        className="w-full max-w-xs bg-orange-600 hover:bg-orange-500 text-white font-bold text-xl py-4 rounded-full shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
      >
        {spinning ? 'SEMOGA BERUNTUNG...' : 'PUTAR SEKARANG!'}
      </button>
    </div>
  );
}

function ResultView({ prize, userData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-pop-in space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 animate-pulse"></div>
        <LucideTrophy className="w-24 h-24 text-yellow-400 relative z-10 drop-shadow-2xl" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">SELAMAT!</h2>
        <p className="text-gray-400">Kamu berkesempatan mendapatkan:</p>
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 py-2">
          {prize?.label || '???'}
        </div>
      </div>
      <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700 w-full max-w-xs text-left space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <LucideCheckCircle className="text-green-500 w-5 h-5" />
          <span className="font-bold text-green-400 text-sm">Data Tersimpan</span>
        </div>
        <p className="text-sm text-gray-300">
          Halo <span className="text-white font-semibold">{userData.name}</span>, kami akan menghubungi:
        </p>
        <div className="bg-black/40 p-3 rounded font-mono text-center text-lg tracking-wider text-orange-400">
          +{userData.phone}
        </div>
      </div>
      <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-white text-sm mt-8 underline">
        Kembali ke Awal
      </button>
    </div>
  );
}

// --- ADMIN PANEL (ENHANCED) ---

function AdminView({ user, appId, db, backToHome, isAuth, setIsAuth, currentPrizes }) {
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' or 'settings'
  const [entries, setEntries] = useState([]);
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [editedPrizes, setEditedPrizes] = useState([]);

  // Sync edited prizes with current when loading
  useEffect(() => {
    if (currentPrizes) setEditedPrizes(currentPrizes);
  }, [currentPrizes]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === 'admin123') {
      setIsAuth(true);
      fetchEntries();
    } else {
      alert('Password salah');
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'participants'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
    } catch (error) {
      console.warn("Index error likely, entries might be empty");
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (id, newWeight) => {
    setEditedPrizes(prev => prev.map(p => 
      p.id === id ? { ...p, weight: parseInt(newWeight) || 0 } : p
    ));
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'game_config');
      await setDoc(configRef, { prizes: editedPrizes }, { merge: true });
      alert('Konfigurasi berhasil disimpan! User akan melihat update secara realtime.');
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper utk hitung %
  const totalWeight = editedPrizes.reduce((sum, p) => sum + (p.weight || 0), 0);

  if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <LucideLock className="w-12 h-12 text-gray-600" />
        <h2 className="text-xl font-bold">Admin Access</h2>
        <form onSubmit={handleLogin} className="flex gap-2">
          <input 
            type="password" 
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
            placeholder="Password (admin123)"
          />
          <button className="bg-orange-600 px-4 py-2 rounded text-white font-bold">Login</button>
        </form>
        <button onClick={backToHome} className="text-gray-500 text-sm">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LucideSettings className="w-5 h-5 text-orange-500" /> Dashboard
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('entries')}
            className={`px-3 py-1 rounded text-xs ${activeTab === 'entries' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Pemenang
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded text-xs ${activeTab === 'settings' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Pengaturan Hadiah
          <button
              onClick={backToHome}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200"
            >
              Kembali ke Beranda
            </button>
