import { post } from './api.js';
import { t } from './lang.js';

const form = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle').querySelector('a');
const title = document.getElementById('form-title');
const roleGroup = document.getElementById('role-group');
const nameInput = form.querySelector('input[name="name"]');
const emailInput = form.querySelector('input[name="email"]');
const phoneInput = form.querySelector('input[name="phone"]');
const passwordInput = form.querySelector('input[name="password"]');
const roleSelect = form.querySelector('select[name="role"]');

let isRegister = document.body.getAttribute('data-mode') === 'register';

function updateUI() {
  title.textContent = t(isRegister ? 'register' : 'login');
  toggleLink.textContent = isRegister ? t('login') + '? ' + t('login') : t('register') + '? ' + t('register');
  roleGroup.style.display = isRegister ? 'block' : 'none';
  nameInput.parentElement.style.display = isRegister ? 'block' : 'none';
  phoneInput.parentElement.style.display = isRegister ? 'block' : 'none';
  emailInput.required = !isRegister;
  nameInput.required = isRegister;
  passwordInput.required = true;
}

function toggleMode() {
  isRegister = !isRegister;
  document.body.setAttribute('data-mode', isRegister ? 'register' : 'login');
  updateUI();
}

toggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  toggleMode();
});

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
    if (!data.name || !data.password) {
      alert(t('fillAllFields'));
      return;
    }
    try {
      const res = await post('/auth/register', data);
      alert(res.message || t('success'));
      toggleMode(); // back to login
    } catch (err) {
      alert(err.message || t('error'));
    }
  } else {
    if (!data.email || !data.password) {
      alert(t('fillAllFields'));
      return;
    }
    try {
      const res = await post('/auth/login', data);
      if (res.token && res.user) {
        const normalizedUser = {
          ...res.user,
          role: (res.user.role || '').toLowerCase()
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        window.location.href = 'dashboard.html';
      } else {
        alert(t('error'));
      }
    } catch (err) {
      alert(err.message || t('error'));
    }
  }
});

updateUI();