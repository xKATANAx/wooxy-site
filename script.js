// --- FIREBASE YAPILANDIRMASI (AYNEN EKLE) ---
const firebaseConfig = {
    apiKey: "AIzaSyB6XlCbPxs6I1jJThZ6OTiaJ-Xssw_mkbA",
    authDomain: "wooxyproject.firebaseapp.com",
    databaseURL: "https://wooxyproject-default-rtdb.firebaseio.com/",
    projectId: "wooxyproject",
    storageBucket: "wooxyproject.firebasestorage.app",
    messagingSenderId: "932458468968",
    appId: "1:932458468968:web:ca0e8230bfae415f3c8ddd"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

// --- GECE/GÜNDÜZ TEMA KONTROLÜ (Orijinal Kodun) ---
const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeToggle) themeToggle.checked = true;
}
if (themeToggle) {
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// --- HATA YARDIMCISI (Orijinal Kodun) ---
function triggerError(inputId, message) {
    const el = document.getElementById(inputId);
    if(!el) return;
    el.value = ""; 
    el.placeholder = message; 
    el.classList.add("error-mode"); 
    el.onfocus = () => {
        el.classList.remove("error-mode");
        el.placeholder = (inputId === "username") ? "Kullanıcı Adı" : "Şifre";
    };
}

// --- GİRİŞ FONKSİYONU (Firebase Entegreli) ---
function login() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;

    db.ref('users/' + user).once('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.pass === pass) {
            if (userData.status === 'banned') {
                alert("BU HESAP BANLANMIŞTIR!");
                return;
            }
            localStorage.setItem('currentUser', user);
            db.ref('users/' + user).update({
                lastLogin: new Date().toLocaleString('tr-TR'),
                lastSeen: Date.now()
            }).then(() => { window.location.href = "dashboard.html"; });
        } else {
            alert("Kullanıcı adı veya şifre hatalı!");
        }
    });
}

// --- KAYIT FONKSİYONU (Orijinal Şartların + Firebase) ---
function register() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user.length < 5) { triggerError("username", "En az 5 karakter!"); return; }
    if (pass.length < 10) { triggerError("password", "En az 10 karakter!"); return; }
    if (!/\d/.test(pass)) { triggerError("password", "En az 1 sayı lazım!"); return; }
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialChars.test(pass)) { triggerError("password", "Özel karakter lazım!"); return; }

    db.ref('users/' + user).once('value', (snapshot) => {
        if (snapshot.exists()) {
            triggerError("username", "Bu isim alınmış!");
        } else {
            const code = Math.floor(100000 + Math.random() * 900000);
            db.ref('users/' + user).set({
                name: user,
                pass: pass,
                role: 'user',
                status: 'active',
                recoveryCode: code,
                regDate: new Date().toLocaleString('tr-TR'),
                lastSeen: Date.now()
            }).then(() => {
                document.getElementById('generatedCode').innerText = code;
                document.getElementById('recoveryDisplayModal').style.display = 'flex';
            });
        }
    });
}