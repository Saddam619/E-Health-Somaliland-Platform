// Language
import { setLanguage } from './lang.js';
window.setLanguage = setLanguage;

// Check login only if we are on the main index page
const path = window.location.pathname;

const user = JSON.parse(localStorage.getItem('user'));

if (path.endsWith("index.html") || path === "/") {

  if (!user) {
    window.location.href = "pages/auth.html";
  } else {
    window.location.href = "pages/dashboard.html";
  }

}