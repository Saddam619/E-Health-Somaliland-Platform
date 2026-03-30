import { post } from './api.js';
import { t, setLanguage } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();

if (!user || role !== 'pharmacist') {
    window.location.href = 'auth.html';
}

let qrScanner;
let isVerifying = false; // Prevent double-triggering

const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
    langBtn.onclick = () => {
        const current = localStorage.getItem('lang') || 'en';
        const next = current === 'en' ? 'so' : 'en';
        setLanguage(next);
        langBtn.textContent = next.toUpperCase();
    };
}

const scanBtn = document.getElementById('scan-qr');
if (scanBtn) {
    scanBtn.onclick = () => {
        const readerElement = document.getElementById('qr-reader');
        if (!readerElement) return;

        readerElement.style.display = 'block';
        scanBtn.style.display = 'none'; 

        qrScanner = new Html5QrcodeScanner(
            "qr-reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        qrScanner.render(onScanSuccess, onScanError);
    };
}

async function onScanSuccess(decodedText) {
    if (isVerifying) return; // Stop if already processing
    
    try {
        if (qrScanner) {
            await qrScanner.clear();
            document.getElementById('qr-reader').style.display = 'none';
            scanBtn.style.display = 'inline-block';
        }

        const data = JSON.parse(decodedText);
        const infoBox = document.getElementById('rx-info');
        
        if (infoBox) {
            const meds = data.prescriptions ? data.prescriptions.map(m => m.name || m.medicine).join(', ') : "N/A";
            infoBox.innerHTML = `
                <div style="text-align: left; background: #f4f7f6; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
                    <h4 style="margin-top:0; color:#2c3e50;">Prescription Details</h4>
                    <strong>Hospital:</strong> ${data.hospital_name || 'N/A'}<br>
                    <strong>Doctor:</strong> ${data.doctor_name || 'N/A'}<br>
                    <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;">
                    <strong>Patient:</strong> ${data.patient_name || 'N/A'}<br>
                    <strong>Medicines:</strong> ${meds}
                </div>
            `;
        }

        document.getElementById('prescription-details').style.display = 'block';

        if (data.id) {
            verifyPrescription(data.id);
        }
    } catch (e) {
        console.error("Scan Error:", e);
        alert("Invalid QR format.");
    }
}

function onScanError(error) { }

async function verifyPrescription(id) {
    if (isVerifying) return;
    isVerifying = true;

    try {
        // ✅ The endpoint in server.js is /api/pharmacists/verify
        // api.js adds the /api, so we just need /pharmacists/verify
        const res = await post('/pharmacists/verify', { id: parseInt(id) });
        
        if (res && res.valid) {
            alert("✅ Prescription verified successfully!");
            location.reload(); 
        } else {
            alert("❌ Error: " + (res.error || "Invalid or already verified."));
            isVerifying = false;
        }
    } catch (err) {
        console.error("API Error:", err);
        alert("Failed to connect to server: " + err.message);
        isVerifying = false;
    }
}

const manualBtn = document.getElementById('verify-id');
if (manualBtn) {
    manualBtn.onclick = () => {
        const id = document.getElementById('rx-id').value.trim();
        if (id) verifyPrescription(id);
        else alert("Please enter an ID");
    };
}