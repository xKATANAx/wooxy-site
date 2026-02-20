// --- GECE/GÜNDÜZ TEMA KONTROLÜ ---
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

// --- HATA GÖSTERME YARDIMCISI ---
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

// --- KAYIT FONKSİYONU (FIREBASE VERSION) ---
function register() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    // Kontroller
    if (user.length < 5) { triggerError("username", "En az 5 karakter!"); return; }
    if (pass.length < 10) { triggerError("password", "En az 10 karakter!"); return; }
    if (!/\d/.test(pass)) { triggerError("password", "En az 1 sayı lazım!"); return; }
    
    const recoveryCode = Math.floor(100000 + Math.random() * 900000); // 6 Haneli kod

    // Firebase'de kontrol et ve kaydet
    db.ref('users/' + user).once('value', (snapshot) => {
        if (snapshot.exists()) {
            triggerError("username", "Bu isim alınmış!");
        } else {
            db.ref('users/' + user).set({
                name: user,
                pass: pass,
                role: 'user',
                recoveryCode: recoveryCode,
                regDate: new Date().toLocaleString('tr-TR'),
                lastLogin: "Henüz Giriş Yapmadı",
                lastSeen: 0
            }).then(() => {
                alert("Kayıt Başarılı! Kurtarma Kodun: " + recoveryCode);
                location.reload(); // Sayfayı yenile ki giriş ekranına dönsün
            });
        }
    });
}

// --- GİRİŞ FONKSİYONU (FIREBASE VERSION) ---
function login() {
    const nameInput = document.getElementById('loginUser').value.trim();
    const passInput = document.getElementById('loginPass').value.trim();

    if (!nameInput || !passInput) { alert("Boş alan bırakma!"); return; }

    // Önce banlı mı diye buluttaki 'blacklist'e bak (Eğer blacklist'i de Firebase'e taşıdıysan)
    // Şimdilik basit tutmak için direkt kullanıcıyı çekiyoruz
    db.ref('users/' + nameInput).once('value', (snapshot) => {
        const userData = snapshot.val();

        if (userData) {
            // Şifre Kontrolü
            if (userData.pass === passInput) {
                // Giriş yapanı yerel hafızaya not et (Dashboard'da lazım)
                localStorage.setItem('currentUser', nameInput);

                // Zamanları güncelle
                const now = new Date();
                const timeString = now.toLocaleString('tr-TR');

                db.ref('users/' + nameInput).update({
                    lastLogin: timeString,
                    lastSeen: now.getTime()
                }).then(() => {
                    alert("Giriş Başarılı! Hoş geldin " + nameInput);
                    window.location.href = "dashboard.html";
                });
            } else {
                alert("Şifre yanlış!");
            }
        } else {
            alert("Kullanıcı bulunamadı!");
        }
    });
}
