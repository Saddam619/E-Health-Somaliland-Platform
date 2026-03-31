import { post } from './api.js';
import { setLanguage } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();

if (!user || role !== 'pharmacist') {
    window.location.href = 'auth.html';
}

let qrScanner;
let isVerifying = false;

// Language toggle
const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
    langBtn.onclick = () => {
        const current = localStorage.getItem('lang') || 'en';
        const next = current === 'en' ? 'so' : 'en';
        setLanguage(next);
        localStorage.setItem('lang', next);
        langBtn.textContent = next.toUpperCase();
    };
}

// Scan button
const scanBtn = document.getElementById('scan-qr');
if (scanBtn) {
    scanBtn.onclick = () => {
        const reader = document.getElementById('qr-reader');

        reader.style.display = 'block';
        scanBtn.style.display = 'none';

        qrScanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        qrScanner.render(onScanSuccess);
    };
}

// WHEN QR IS SCANNED
async function onScanSuccess(decodedText) {
    if (isVerifying) return;

    try {
        await qrScanner.clear();

        document.getElementById('qr-reader').style.display = 'none';
        document.getElementById('scan-qr').style.display = 'inline-block';

        const data = JSON.parse(decodedText);

        const meds = data.prescriptions
            ? data.prescriptions.map(m => m.medicine || m.name).join(', ')
            : "N/A";

        document.getElementById('rx-info').innerHTML = `
            <strong>Hospital:</strong> ${data.hospital_name}<br>
            <strong>Doctor:</strong> ${data.doctor_name}<br>
            <strong>Patient:</strong> ${data.patient_name}<br>
            <strong>Medicines:</strong> ${meds}
        `;

        document.getElementById('prescription-details').style.display = 'block';

        verifyPrescription(data.id);

    } catch (err) {
        console.error(err);
        alert("Invalid QR Code");
    }
}

// VERIFY FUNCTION
async function verifyPrescription(id) {
    if (isVerifying) return;
    isVerifying = true;

    try {
        const res = await post('/pharmacists/verify', { id: parseInt(id) });

        if (res.valid) {
            alert(res.message);

            document.getElementById('rx-info').innerHTML += `
                <p style="color:green;"><strong>✅ VERIFIED</strong></p>
            `;
        } else {
            alert("❌ " + res.error);
            isVerifying = false;
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
        isVerifying = false;
    }
}

// MANUAL VERIFY
const manualBtn = document.getElementById('verify-id');
if (manualBtn) {
    manualBtn.onclick = () => {
        const id = document.getElementById('rx-id').value.trim();
        if (id) verifyPrescription(id);
        else alert("Enter ID");
    };
}