import { get } from './api.js';
import { t, setLanguage } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();

if (!user || role !== 'patient') {
    location.href = 'auth.html';
}

const list = document.getElementById('prescriptions-list');

document.getElementById('lang-toggle').onclick = () => {
    const current = localStorage.getItem('lang') || 'en';
    const next = current === 'en' ? 'so' : 'en';
    setLanguage(next);
    document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

function statusLabel(p) {
    if (p.status === 'Verified') {
        return t('verifiedByPharmacist') || 'Verified by pharmacist';
    }
    if (p.status === 'Prescribed') {
        return t('prescribedNotVerified') || 'Prescribed but not yet verified';
    }
    return p.status || t('pending');
}

async function loadPrescriptions() {
    list.innerHTML = '';

    try {
        const items = await get('/patients/prescriptions');

        // ✅ FILTER LOGIC: Only show prescriptions that are NOT verified
        // This makes them "disappear" from the patient's view after the scan
        const activeItems = items.filter(p => p.status === 'Prescribed');

        if (!activeItems || activeItems.length === 0) {
            list.innerHTML = `<p>${t('noPrescriptions') || 'No active prescriptions to show.'}</p>`;
            return;
        }

        activeItems.forEach((p) => {
            let meds = [];
            try {
                meds = JSON.parse(p.medicines || '[]');
            } catch {
                meds = [];
            }

            const div = document.createElement('div');
            div.className = 'card';

            div.innerHTML = `
                <strong>${t('prescription')} #${p.id}</strong><br>
                <span class="badge">${statusLabel(p)}</span><br>
                <small>${new Date(p.created_at).toLocaleString()}</small>

                <ul>
                  ${meds.map(m => `
                    <li>
                      <b>${m.medicine || m.name || 'Medicine'}</b><br>
                      Dosage: ${m.dosage}<br>
                      Instructions: ${m.instructions}
                    </li>
                  `).join('')}
                </ul>

                ${
                  p.qr_code && p.qr_code.startsWith('data:image')
                    ? `
                      <div style="margin-top:10px;">
                        <p><b>Scan QR Code:</b></p>
                        <img src="${p.qr_code}" width="150" height="150" />
                      </div>
                    `
                    : `<p style="color:red;">QR Code not available</p>`
                }
            `;

            list.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = `<p>${t('error') || 'Failed to load prescriptions.'}</p>`;
    }
}

loadPrescriptions();