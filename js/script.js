// ===== MOBILE MENU =====
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('open');
}

// ===== LOGIN FORM VALIDATION =====
function handleLogin(e) {
  e.preventDefault();
  let valid = true;

  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  // Reset errors
  emailError.textContent = '';
  passwordError.textContent = '';

  // Validate email
  if (!email.value.includes('@') || !email.value.includes('.')) {
    emailError.textContent = 'Please enter a valid email address.';
    valid = false;
  }

  // Validate password
  if (password.value.length < 6) {
    passwordError.textContent = 'Password must be at least 6 characters.';
    valid = false;
  }

  if (valid) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('loginSuccess').style.display = 'block';

    // Simulate redirect after 2 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

// ===== CONTACT FORM VALIDATION =====
function handleContact(e) {
  e.preventDefault();
  let valid = true;

  const name = document.getElementById('cName');
  const email = document.getElementById('cEmail');
  const message = document.getElementById('cMessage');
  const nameError = document.getElementById('cNameError');
  const emailError = document.getElementById('cEmailError');
  const messageError = document.getElementById('cMessageError');

  // Reset errors
  nameError.textContent = '';
  emailError.textContent = '';
  messageError.textContent = '';

  // Validate name
  if (name.value.trim().length < 2) {
    nameError.textContent = 'Please enter your full name.';
    valid = false;
  }

  // Validate email
  if (!email.value.includes('@') || !email.value.includes('.')) {
    emailError.textContent = 'Please enter a valid email address.';
    valid = false;
  }

  // Validate message
  if (message.value.trim().length < 10) {
    messageError.textContent = 'Message must be at least 10 characters.';
    valid = false;
  }

  if (valid) {
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('contactSuccess').style.display = 'block';
  }
}

// ===== SCROLL ANIMATION (Intersection Observer) =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .team-card, .step, .info-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});
