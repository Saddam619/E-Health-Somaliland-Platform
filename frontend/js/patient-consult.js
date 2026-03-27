import { post, get } from './api.js';
import { t, setLanguage, } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'patient') {
  location.href = 'auth.html';
}

// Language toggle
document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  updateUI();
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

// Form submission
document.getElementById('consult-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    age: parseInt(form.age.value),
    phone: form.phone.value.trim(),
    location: form.location.value.trim(),
    address: form.address.value.trim(),
    symptoms: form.symptoms.value.trim(),
    explanation: form.explanation.value.trim()
  };
  if (!data.name || !data.age || !data.phone || !data.location || !data.address || !data.symptoms) {
    alert(t('fillAllFields'));
    return;
  }

  try {
    const res = await post('/patients/consult', data);
    if (res.success) {
      alert(t('requestSent'));        // Show alert
      form.reset();                    // Reset form
      loadPendingConsultations();      // Immediately update pending list
    } else {
      alert(t('error'));
    }
  } catch (err) {
    console.error(err);
    alert('Submission failed');
  }
});

// Load pending consultations
async function loadPendingConsultations() {
  const pendingDiv = document.getElementById('pending-consultations'); // make sure HTML ID matches
  pendingDiv.innerHTML = ''; 

  try {
    const consultations = await get('/patients/consultations');
    if (!consultations || consultations.length === 0) {
      pendingDiv.innerHTML = `<p>${t('noConsultations') || 'No consultation requests yet.'}</p>`;
      return;
    }

    consultations.forEach(c => {
      const div = document.createElement('div');
      div.className = 'consult-item';
      div.innerHTML = `
        <strong>${c.name}</strong> (${c.age} ${t('yearsOld') || 'years old'})<br>
        ${t('location')}: ${c.location}<br>
        ${t('symptoms')}: ${c.symptoms}<br>
        ${t('explanation')}: ${c.explanation}<br>
        <strong>Status:</strong> ${c.status || t('pending')}
      `;
      pendingDiv.appendChild(div);  // use prepend(div) if you want newest on top
    });
  } catch (err) {
    console.error(err);
    pendingDiv.innerHTML = `<p>Error loading consultations</p>`;
  }
}

// Load pending consultations on page load
loadPendingConsultations();