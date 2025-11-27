import React, { useState, useEffect, useCallback } from 'react';
// Import Wajib untuk Firebase
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  query, 
  onSnapshot,
  setLogLevel
} from 'firebase/firestore';
import { 
  LucideSettings, 
  LucideLogOut, 
  LucideUser 
} from 'lucide-react'; 

// --- 1. SETUP KONFIGURASI GLOBAL (WAJIB DARI LINGKUNGAN CANVAS) ---
const firebaseConfig = {
  apiKey: "AIzaSyDtI5ferhfNg0MvIrPK9dhFln0wqW3BKfQ",
  authDomain: "bozelgaming-diamond-ff-gratis.firebaseapp.com",
  projectId: "bozelgaming-diamond-ff-gratis",
  storageBucket: "bozelgaming-diamond-ff-gratis.firebasestorage.app",
  messagingSenderId: "145175146392",
  appId: "1:145175146392:web:495b1e8fe14e41139cc5ed",
  measurementId: "G-HQC3ZSHQ78"
};

// --- CSS STYLE ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
  body {
    font-family: 'Inter', sans-serif;
    background-color: #0d1117; 
    color: #f0f8ff;
    min-height: 100vh;
  }
  .wheel {
    transition: transform 5s cubic-bezier(0.25, 0.1, 0.25, 1);
  }
`;

export default function App() {
  // --- STATE UTAMA UNTUK FIREBASE/AUTENTIKASI ---
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState(null);

  // --- 2. STATE GAME ANDA (PENTING: Masukkan semua state game di sini) ---
  const [currentView, setCurrentView] = useState('home'); // 'home', 'login', 'admin'
  const [prizes, setPrizes] = useState([]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries', 'settings' (untuk Admin)

  // --- 3. FUNGSI FIREBASE (JANGAN DIUBAH) ---
  useEffect(() => {
    setLogLevel('Debug');
    if (Object.keys(firebaseConfig).length === 0) {
      setError("Konfigurasi Firebase tidak ditemukan. Aplikasi tidak dapat berjalan.");
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
          console.log("User terautentikasi:", user.uid);
        } else {
          console.log("User tidak terautentikasi, mencoba sign in...");
          if (initialAuthToken) {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase Error:", e);
      setError(e.message);
      setIsAuthReady(true);
    }
  }, []);

  // --- 4. DATA FETCHING DARI FIRESTORE ---
  useEffect(() => {
    if (!isAuthReady || !db) return;

    // Path ke koleksi hadiah (public data)
    const prizesCollectionPath = `artifacts/${appId}/public/data/prizes`;
    const q = query(collection(db, prizesCollectionPath));

    // Mendengarkan perubahan data secara real-time
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPrizes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        weight: doc.data().weight || 1, // Pastikan ada weight
      }));
      // Mengurutkan hadiah agar tampilan konsisten (sort berdasarkan nama)
      setPrizes(fetchedPrizes.sort((a, b) => a.name.localeCompare(b.name)));
    }, (err) => {
      console.error("Error fetching prizes:", err);
      setError("Gagal memuat data hadiah dari server.");
    });

    return () => unsubscribe();
  }, [isAuthReady, db]); 

  // --- 5. FUNGSI GAME ANDA (PENTING: Masukkan fungsi game di sini) ---

  const handleSpin = useCallback(() => {
    if (isSpinning || prizes.length === 0) return;

    setIsSpinning(true);
    setSpinResult(null);

    // Total berat untuk weighted selection
    const totalWeight = prizes.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;

    let selectedPrize = null;
    let cumulativeWeight = 0;
    
    // Pilih hadiah berdasarkan weight
    for (const prize of prizes) {
      cumulativeWeight += prize.weight;
      if (randomNum <= cumulativeWeight) {
        selectedPrize = prize;
        break;
      }
    }
    
    if (!selectedPrize) {
        // Fallback jika perhitungan gagal (ambil acak)
        selectedPrize = prizes[Math.floor(Math.random() * prizes.length)];
    }

    // Hitung posisi putaran
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const anglePerSegment = 360 / prizes.length;
    const targetAngle = 360 * 10 + (360 - (prizeIndex * anglePerSegment + anglePerSegment / 2));
    
    setWheelRotation(targetAngle);
    
    setTimeout(() => {
      setIsSpinning(false);
      setSpinResult(selectedPrize);
      // Di sini Anda bisa menyimpan data pemenang ke Firestore
      // saveWinnerToFirestore(selectedPrize.name); 
    }, 5000); // Durasi putaran
  }, [isSpinning, prizes]);

  const backToHome = () => {
    setCurrentView('home');
  };

  const attemptAdminLogin = () => {
    // Implementasi sederhana untuk demo:
    // Ganti "superadmin" dengan password yang lebih aman atau gunakan Firebase Authentication
    if (adminPassword === 'superadmin') {
      setIsAdminLoggedIn(true);
      setCurrentView('admin');
      setAdminPassword('');
    } else {
      alert("Password salah. Gunakan 'superadmin' untuk demo.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('home');
  };
  
  // --- 6. LOGIKA RENDER (Tampilan per Layar) ---
  
  // Menampilkan Error Setup
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-red-900/50">
        <h1 className="text-xl font-bold text-red-400">Kesalahan Fatal Setup</h1>
        <p className="mt-2 text-sm text-red-200">Aplikasi gagal memulai: {error}</p>
        <p className="mt-2 text-xs text-red-300">
          User ID: <span className="font-mono">{userId || "N/A"}</span>
        </p>
      </div>
    );
  }

  // Menampilkan Loading Screen
  if (!isAuthReady || !db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="ml-4 text-lg text-gray-400">Memuat Konfigurasi Server...</p>
      </div>
    );
  }

  // Komponen Helper untuk tampilan Game Utama
  const GameHomeView = () => {
    if (prizes.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-yellow-500">Hadiah Belum Ditetapkan</h2>
                <p className="mt-2 text-gray-400">Silakan masuk sebagai admin untuk menambahkan hadiah.</p>
                <button
                    onClick={() => setCurrentView('login')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 shadow-md"
                >
                    Masuk Admin
                </button>
            </div>
        );
    }
    
    const anglePerSegment = 360 / prizes.length;

    return (
      <div className="flex flex-col items-center justify-center p-6 w-full max-w-md bg-gray-800 rounded-3xl shadow-2xl">
        <div className="flex justify-between w-full items-center mb-6">
            <h1 className="text-3xl font-extrabold text-orange-400">Spin Berhadiah!</h1>
            <button
                onClick={() => setCurrentView('login')}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition duration-200 shadow-lg"
                title="Masuk sebagai Admin"
            >
                <LucideUser className="w-5 h-5" />
            </button>
        </div>
        
        {/* Pointer Penunjuk */}
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-red-500 mb-[-10px] z-10"></div>
        
        {/* Roda Putar */}
        <div className="relative w-72 h-72 rounded-full border-8 border-gray-900 overflow-hidden bg-gray-900 shadow-inner">
          <div 
            className="wheel w-full h-full relative" 
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            {prizes.map((prize, index) => (
              <div
                key={prize.id}
                className="absolute w-1/2 h-1/2 origin-bottom-right"
                style={{
                  transform: `rotate(${index * anglePerSegment}deg) skewY(-${90 - anglePerSegment}deg)`,
                  clipPath: `polygon(0% 0%, 100% 100%, 50% 100%, 0% 50%)`,
                  backgroundColor: index % 2 === 0 ? '#1f2937' : '#374151', // Warna segmentasi
                }}
              >
                <div 
                  className="absolute text-center text-xs font-semibold p-1 truncate"
                  style={{
                    transform: `rotate(${anglePerSegment / 2}deg) skewY(${90 - anglePerSegment}deg) rotate(90deg) translate(-20px, 0)`,
                    width: '100%',
                    color: index % 2 === 0 ? '#f0f8ff' : '#000',
                  }}
                >
                  {prize.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Spin */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`mt-6 w-full py-3 text-lg font-bold rounded-xl shadow-xl transition duration-300 ${
            isSpinning ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {isSpinning ? 'Memutar...' : 'PUTAR RODA'}
        </button>
        
        {/* Hasil Spin */}
        {spinResult && (
          <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded-lg w-full text-center">
            <p className="text-green-300 font-semibold">Selamat! Anda memenangkan:</p>
            <p className="text-xl font-extrabold text-green-200">{spinResult.name}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Komponen Helper untuk tampilan Login Admin
  const AdminLoginView = () => (
    <div className="p-8 w-full max-w-md bg-gray-800 rounded-3xl shadow-2xl">
      <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center">Login Admin</h2>
      <input
        type="password"
        placeholder="Masukkan Password Admin"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-orange-500 focus:border-orange-500"
      />
      <button 
        onClick={attemptAdminLogin}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition duration-200"
      >
        Login
      </button>
      <button 
        onClick={backToHome}
        className="mt-3 w-full py-3 bg-gray-600 hover:bg-gray-700 text-gray-300 font-bold rounded-xl shadow-lg transition duration-200"
      >
        Kembali ke Beranda
      </button>
    </div>
  );
  
  // Komponen Helper untuk tampilan Dashboard Admin
  const AdminDashboardView = () => (
    <div className="space-y-6 h-full flex flex-col w-full max-w-2xl p-6 bg-gray-800 rounded-3xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-orange-400">
          <LucideSettings className="w-5 h-5 text-orange-500" /> Dashboard Admin
        </h2>
        <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400">User ID: <span className="font-mono">{userId.substring(0, 8)}...</span></span>
            <button 
                onClick={handleAdminLogout}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition duration-200 shadow-md"
                title="Logout Admin"
            >
                <LucideLogOut className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'entries' ? 'bg-orange-600 text-white shadow-inner' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Pemenang
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'settings' ? 'bg-orange-600 text-white shadow-inner' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Pengaturan Hadiah ({prizes.length})
          </button>
      </div>

      {/* Konten Tab */}
      <div className="flex-grow bg-gray-900 p-4 rounded-xl overflow-y-auto">
        {activeTab === 'entries' && <p className="text-gray-400">-- Tampilan Daftar Pemenang (Belum Diimplementasikan) --</p>}
        
        {activeTab === 'settings' && (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Daftar Hadiah</h3>
                {prizes.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <span className="font-semibold text-orange-300">{p.name}</span>
                        <span className="text-sm text-gray-400">Bobot: {p.weight}</span>
                        {/* Di sini Anda bisa menambahkan tombol Edit/Hapus */}
                    </div>
                ))}
                {prizes.length === 0 && <p className="text-gray-500 text-center">Belum ada hadiah. Tambahkan di sini.</p>}
            </div>
        )}
      </div>

      <button onClick={backToHome} className="mt-4 w-full py-3 bg-gray-600 hover:bg-gray-700 text-gray-300 font-bold rounded-xl shadow-lg transition duration-200">
        Kembali ke Tampilan Utama
      </button>
    </div>
  );
  
  // --- RENDERING UTAMA ---
  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
        {currentView === 'home' && <GameHomeView />}
        {currentView === 'login' && <AdminLoginView />}
        {currentView === 'admin' && isAdminLoggedIn && <AdminDashboardView />}
      </div>
    </>
  );
}

