import { post } from './api.js';
import { t } from './lang.js';

const form = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle').querySelector('a');
const title = document.getElementById('form-title');
const roleGroup = document.getElementById('role-group');

// Input Elements
const nameInput = form.querySelector('input[name="name"]');
const emailInput = form.querySelector('input[name="email"]');
const phoneInput = form.querySelector('input[name="phone"]');
const passwordInput = form.querySelector('input[name="password"]');
const roleSelect = form.querySelector('select[name="role"]');

// Hospital Elements
const hospitalGroup = document.getElementById('hospital-group');
const hospitalSelect = document.getElementById('hospital-select');

let isRegister = document.body.getAttribute('data-mode') === 'register';

/**
 * Updates UI for Login vs Register
 */
function updateUI() {
    title.textContent = t(isRegister ? 'register' : 'login');
    toggleLink.textContent = isRegister 
        ? t('login') + '? ' + t('login') 
        : t('register') + '? ' + t('register');
    
    const displayStyle = isRegister ? 'block' : 'none';
    roleGroup.style.display = displayStyle;
    
    if (nameInput) nameInput.parentElement.style.display = displayStyle;
    if (phoneInput) phoneInput.parentElement.style.display = displayStyle;
    
    // Always hide hospital group when switching modes
    if (hospitalGroup) hospitalGroup.style.display = 'none';

    emailInput.required = true;
    passwordInput.required = true;
    if (nameInput) nameInput.required = isRegister;
}

function toggleMode() {
    isRegister = !isRegister;
    document.body.setAttribute('data-mode', isRegister ? 'register' : 'login');
    updateUI();
}

// ✅ 1. FETCH HOSPITALS when Role is "Doctor" (During Registration)
roleSelect.addEventListener('change', async () => {
    if (isRegister && roleSelect.value === 'doctor') {
        if (hospitalGroup) hospitalGroup.style.display = 'block';
        try {
            const res = await fetch('http://localhost:5000/api/hospitals');
            const hospitals = await res.json();
            
            if (hospitalSelect) {
                hospitalSelect.innerHTML = `<option value="">-- ${t('selectHospital') || 'Select Hospital'} --</option>` + 
                    hospitals.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
            }
        } catch (err) {
            console.error("Failed to load hospitals:", err);
        }
    } else {
        if (hospitalGroup) hospitalGroup.style.display = 'none';
    }
});

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMode();
});

// ✅ 2. HANDLE SUBMISSION (Login & Registration)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
    };

    if (isRegister) {
        data.name = nameInput.value.trim();
        data.phone = phoneInput.value.trim();
        data.role = roleSelect.value;
        
        if (data.role === 'doctor' && hospitalSelect) {
            data.hospital_id = hospitalSelect.value;
        }

        if (!data.name || !data.password) {
            alert(t('fillAllFields'));
            return;
        }

        try {
            const res = await post('/auth/register', data);
            alert(res.message || t('success'));
            toggleMode(); 
        } catch (err) {
            alert(err.message || t('error'));
        }
    } else {
        // --- LOGIN LOGIC ---
        try {
            const res = await post('/auth/login', data);
            if (res.token && res.user) {
                // Save session data
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));

                // ✅ 3. REDIRECTION FIX:
                // We send EVERYONE to dashboard.html. 
                // We do NOT use role-based redirects here to avoid skipping the main menu.
                window.location.href = 'dashboard.html';
                
            } else {
                alert(t('error'));
            }
        } catch (err) {
            alert(err.message || t('error'));
        }
    }
});

// Initialize
updateUI();