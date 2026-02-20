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
    const userField = document.getElementById('username').value.trim();
    const passField = document.getElementById('password').value.trim();
    let users = JSON.parse(localStorage.getItem('userDB') || "[]");

    // ADMIN KONTROLÜ
    if (userField === "WOOXY" && passField === "ADMIN") {
        localStorage.setItem('last_admin_login', new Date().toLocaleString('tr-TR'));
        window.location.href = "admin.html";
        return;
    }

    // NORMAL KULLANICI KONTROLÜ
    let userIndex = users.findIndex(u => u.name === userField && u.pass === passField);

    if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toLocaleString('tr-TR');
        localStorage.setItem('userDB', JSON.stringify(users));
        // BURASI DEĞİŞTİ: Artık dashboard'a gidiyor
        window.location.href = "dashboard.html"; 
    } else {
        triggerError("username", "Hatalı Giriş!");
        triggerError("password", "Şifre Yanlış!");
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
