import { get, post, patch } from './api.js';
import { t, setLanguage, updateUI } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'doctor') {
  location.href = 'auth.html';
}

const pendingList = document.getElementById('pending-consults');
const form = document.getElementById('prescribe-form');
const qrContainer = document.getElementById('qr-container');
const qrCanvas = document.getElementById('qr-code');

let selectedConsultation = null;

document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  updateUI();
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

async function loadPendingConsultations() {
  pendingList.innerHTML = '';
  try {
    const consultations = await get('/doctors/consultations');
    if (!consultations || consultations.length === 0) {
      pendingList.innerHTML = `<p>${t('noConsultations') || 'No pending consultations.'}</p>`;
      return;
    }
    consultations.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card consult-item';
      div.dataset.id = c.id;
      div.innerHTML = `
        <strong>${c.name}</strong> (${c.age} ${t('yearsOld') || 'years old'})<br>
        ${t('location')}: ${c.location}<br>
        ${t('symptoms')}: ${c.symptoms}<br>
        <button class="primary serve-btn">${t('serve') || 'Serve'}</button>
      `;
      pendingList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    pendingList.innerHTML = `<p>${t('error') || 'Failed to load consultations.'}</p>`;
  }
}

pendingList.addEventListener('click', async e => {
  const btn = e.target.closest('.serve-btn');
  if (!btn) return;
  const card = btn.closest('.consult-item');
  if (!card) return;
  const id = card.dataset.id;
  const consultations = await get('/doctors/consultations');
  selectedConsultation = consultations.find(c => String(c.id) === String(id));
  if (!selectedConsultation) return;

  document.getElementById('patient-id').value = selectedConsultation.user_id;
  document.getElementById('selected-patient').textContent =
    `${selectedConsultation.name} (${selectedConsultation.age}) - ${selectedConsultation.symptoms}`;
});

// Add/remove medicine rows
document.getElementById('add-med').onclick = () => {
  const container = document.getElementById('medicines-list');
  const item = document.createElement('div');
  item.className = 'medicine-item';
  item.innerHTML = `
    <input type="text" name="medicine" placeholder="Medicine" required>
    <input type="text" name="dosage" placeholder="Dosage" required>
    <input type="text" name="instructions" placeholder="Instructions" required>
    <button type="button" class="remove-med">Remove</button>
  `;
  container.appendChild(item);
};

document.getElementById('medicines-list').addEventListener('click', e => {
  if (e.target.classList.contains('remove-med')) {
    const item = e.target.closest('.medicine-item');
    if (item && document.querySelectorAll('.medicine-item').length > 1) {
      item.remove();
    }
  }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  const patientId = form.patientId.value.trim();
  const meds = Array.from(document.querySelectorAll('.medicine-item')).map(row => ({
    medicine: row.querySelector('input[name="medicine"]').value.trim(),
    dosage: row.querySelector('input[name="dosage"]').value.trim(),
    instructions: row.querySelector('input[name="instructions"]').value.trim()
  })).filter(m => m.medicine && m.dosage);

  if (!patientId || meds.length === 0) {
    alert(t('fillAllFields'));
    return;
  }

  try {
    const res = await post('/doctors/prescribe', {
      patientId,
      consultationId: selectedConsultation ? selectedConsultation.id : null,
      medicines: meds
    });
    if (selectedConsultation) {
      // Mark consultation served on backend
      await patch(`/doctors/consultations/${selectedConsultation.id}/serve`, {});
      selectedConsultation = null;
      loadPendingConsultations();
    }
    alert(t('success') || 'Prescription issued');

    // Generate QR from server-provided qr_code payload
    const qrData = res.qr_code || JSON.stringify({ id: res.id, medicines: meds });
    const qr = new QRious({
      element: qrCanvas,
      size: 200,
      value: qrData
    });
    qrContainer.style.display = 'block';
  } catch (err) {
    console.error(err);
    alert(t('error') || 'Failed to issue prescription');
  }
});

loadPendingConsultations();