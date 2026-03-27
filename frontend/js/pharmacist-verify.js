import { post } from './api.js';
import { t, setLanguage, } from './lang.js';

document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
 
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

let qrScanner;
const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'pharmacist') {
  location.href = 'auth.html';
}

document.getElementById('scan-qr').onclick = () => {
  const video = document.getElementById('qr-video');
  video.style.display = 'block';
  qrScanner = new Html5QrcodeScanner('qr-video', { fps: 10, qrbox: 250 });
  qrScanner.render(onScanSuccess, onScanError);
};

function onScanSuccess(decodedText) {
  try {
    const data = JSON.parse(decodedText);
    document.getElementById('rx-info').textContent = `ID: ${data.id}, Medicines: ${(data.medicines || []).map(m => m.medicine).join(', ')}`;
    document.getElementById('prescription-details').style.display = 'block';
    qrScanner.clear();
    document.getElementById('qr-video').style.display = 'none';
  } catch (e) {
    alert(t('invalidQR'));
  }
}

function onScanError(error) {
  console.log(error);
}

document.getElementById('verify-rx').onclick = async () => {
  const info = document.getElementById('rx-info').textContent;
  const match = info.match(/ID: (\d+)/);
  if (!match) {
    alert(t('invalidQR'));
    return;
  }
  const id = match[1];
  const res = await post('/pharmacists/verify', { id });
  if (res && res.valid) {
    const p = res.prescription;
    alert(t('validRx'));
    document.getElementById('prescription-details').style.display = 'none';
  } else {
    alert(t('invalidRx'));
  }
};

document.getElementById('verify-id').onclick = async () => {
  const id = document.getElementById('rx-id').value.trim();
  if (!id) {
    alert(t('fillAllFields'));
    return;
  }
  const res = await post('/pharmacists/verify', { id });
  if (res && res.valid) {
    alert(t('validRx'));
  } else {
    alert(t('invalidRx'));
  }
};