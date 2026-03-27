import { get, post, patch } from './api.js';
import { t, setLanguage } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();

// Security Check
if (!user || role !== 'doctor') {
  location.href = 'auth.html';
}

const pendingList = document.getElementById('pending-consults');
const form = document.getElementById('prescribe-form');
const qrContainer = document.getElementById('qr-container');
const qrCanvas = document.getElementById('qr-code');

let selectedConsultation = null;

// Language Toggle
document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

// Load Consultations from Backend
async function loadPendingConsultations() {
  pendingList.innerHTML = '<p>Loading...</p>';
  try {
    const consultations = await get('/doctors/consultations');
    pendingList.innerHTML = '';
    
    if (!consultations || consultations.length === 0) {
      pendingList.innerHTML = `<p>${t('noConsultations') || 'No pending consultations.'}</p>`;
      return;
    }

    consultations.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card consult-item';
      div.dataset.id = c.id;
      div.innerHTML = `
        <strong>${c.patient_name || c.name || 'Patient'}</strong><br>
        ${t('symptoms') || 'Symptoms'}: ${c.symptoms || c.message || 'N/A'}<br>
        <button class="primary serve-btn">${t('serve') || 'Serve'}</button>
      `;
      
      // Store the consultation data on the button for easy access
      const btn = div.querySelector('.serve-btn');
      btn.onclick = () => selectPatient(c);
      
      pendingList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    pendingList.innerHTML = `<p>${t('error') || 'Failed to load consultations.'}</p>`;
  }
}

// Select a patient to prescribe for
function selectPatient(consultation) {
  selectedConsultation = consultation;
  document.getElementById('patient-id').value = consultation.user_id;
  document.getElementById('selected-patient').textContent = 
    `${t('prescribingFor') || 'Prescribing for'}: ${consultation.patient_name || consultation.name}`;
  
  // Smooth scroll to the form
  form.scrollIntoView({ behavior: 'smooth' });
}

// Add medicine rows
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

// Remove medicine rows
document.getElementById('medicines-list').addEventListener('click', e => {
  if (e.target.classList.contains('remove-med')) {
    const items = document.querySelectorAll('.medicine-item');
    if (items.length > 1) {
      e.target.closest('.medicine-item').remove();
    }
  }
});

// Handle Form Submission
form.addEventListener('submit', async e => {
  e.preventDefault();
  
  const patientId = document.getElementById('patient-id').value.trim();
  const medRows = document.querySelectorAll('.medicine-item');
  
  const meds = Array.from(medRows).map(row => ({
    name: row.querySelector('input[name="medicine"]').value.trim(),
    dosage: row.querySelector('input[name="dosage"]').value.trim(),
    instructions: row.querySelector('input[name="instructions"]').value.trim()
  })).filter(m => m.name !== "");

  if (!patientId || meds.length === 0) {
    alert(t('fillAllFields') || 'Please fill all fields');
    return;
  }

  try {
    // 1. Send to Backend
    const res = await post('/doctors/prescribe', {
      patientId,
      consultationId: selectedConsultation ? selectedConsultation.id : null,
      medicines: meds
    });

    // 2. Mark consultation as served if it exists
    if (selectedConsultation) {
      await patch(`/doctors/consultations/${selectedConsultation.id}/serve`, {});
    }

    // 3. Generate the QR Code using the backend data
    // res.qr_code now contains the full Doctor and Hospital JSON string
    if (res.qr_code) {
      new QRious({
        element: qrCanvas,
        size: 250,
        level: 'M',
        value: res.qr_code
      });
      qrContainer.style.display = 'block';
      qrContainer.scrollIntoView({ behavior: 'smooth' });
    }

    alert(t('success') || 'Prescription issued successfully');
    
    // 4. Reset for next patient
    form.reset();
    document.getElementById('selected-patient').textContent = '';
    selectedConsultation = null;
    loadPendingConsultations();

  } catch (err) {
    console.error(err);
    alert(t('error') || 'Failed to issue prescription');
  }
});

loadPendingConsultations();