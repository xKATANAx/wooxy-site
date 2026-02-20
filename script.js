// --- GECE/GÜNDÜZ TEMA KONTROLÜ ---
const themeToggle = document.getElementById('theme-toggle'); // HTML'deki input ID'si ile uyumlu olmalı
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

// --- MEVCUT JS KODLARIN (BOZMADAN DEVAM) ---

// Hata gösterme yardımcısı
function triggerError(inputId, message) {
    const el = document.getElementById(inputId);
    el.value = ""; 
    el.placeholder = message; 
    el.classList.add("error-mode"); 
    
    el.onfocus = () => {
        el.classList.remove("error-mode");
        el.placeholder = (inputId === "username") ? "Kullanıcı Adı" : "Şifre";
    };
}

// Giriş Fonksiyonu
function login() {
    const nameInput = document.getElementById('loginUser').value;
    const passInput = document.getElementById('loginPass').value;
    
    // Kara Liste Kontrolü
    const blacklist = JSON.parse(localStorage.getItem('blacklist') || "[]");
    
    if (blacklist.includes(nameInput)) {
        // Eğer kullanıcı banlıysa modalı göster
        document.getElementById('banOverlay').style.display = 'flex';
        return; // İşlemi durdur
    }

    // Normal giriş kontrollerin burada devam eder...
    const users = JSON.parse(localStorage.getItem('userDB') || "[]");
    const user = users.find(u => u.name === nameInput && u.pass === passInput);

    if (user) {
        alert("Giriş Başarılı!");
        // Yönlendirme kodların...
    } else {
        alert("Hatalı kullanıcı adı veya şifre!");
    }
}

// Kayıt Fonksiyonu
function register() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');
    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if (user.length < 5) { triggerError("username", "En az 5 karakter!"); return; }
    if (pass.length < 10) { triggerError("password", "En az 10 karakter!"); return; }
    if (!/\d/.test(pass)) { triggerError("password", "En az 1 sayı lazım!"); return; }
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialChars.test(pass)) { triggerError("password", "Özel karakter lazım!"); return; }

    let users = JSON.parse(localStorage.getItem('userDB') || "[]");
    if (users.find(u => u.name === user)) {
        triggerError("username", "Bu isim alınmış!");
        return;
    }

    users.push({
        name: user,
        pass: pass,
        regDate: new Date().toLocaleString('tr-TR'),
        lastLogin: "Henüz Giriş Yapmadı"
    });

    localStorage.setItem('userDB', JSON.stringify(users));
    alert("Kayıt Başarılı!");
}
// Giriş anında zamanı kaydet
const now = new Date();
const timeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

let users = JSON.parse(localStorage.getItem('userDB') || "[]");
users = users.map(u => {
    if(u.name === loginUserValue) { // Giriş yapan kullanıcının adıyla eşleşen
        return { 
            ...u, 
            lastLogin: timeString, // Görünen zaman metni
            lastSeen: new Date().getTime() // Online kontrolü için sayısal değer
        };
    }
    return u;
});
localStorage.setItem('userDB', JSON.stringify(users));
// ... (mevcut kodların devamı)

function login() {
    const nameInput = document.getElementById('loginUser').value.trim();
    const passInput = document.getElementById('loginPass').value.trim();

    let users = JSON.parse(localStorage.getItem('userDB') || "[]");
    let blacklist = JSON.parse(localStorage.getItem('blacklist') || "[]");

    if (blacklist.includes(nameInput)) {
        alert("BU HESAP BANLANMIŞTIR!");
        return;
    }

    const user = users.find(u => u.name === nameInput && u.pass === passInput);

    if (user) {
        // --- HATA DÜZELTMESİ: Giriş yapanı kaydet ---
        localStorage.setItem('currentUser', nameInput); 
        
        // Son giriş zamanını güncelle
        const now = new Date();
        const timeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
        
        let updatedUsers = users.map(u => {
            if(u.name === nameInput) {
                return { ...u, lastLogin: timeString, lastSeen: new Date().getTime() };
            }
            return u;
        });
        localStorage.setItem('userDB', JSON.stringify(updatedUsers));

        alert("Giriş Başarılı! Hoş geldin " + nameInput);
        window.location.href = "dashboard.html";
    } else {
        alert("Kullanıcı adı veya şifre hatalı!");
    }
}