/**
 * shared-theme.js — Kora Luxe
 * Handles dark mode toggle persistence across all pages.
 * Include this script in every HTML page.
 */

(function() {
  // Apply saved theme on load
  const saved = localStorage.getItem('koraLuxe_theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark-theme');
    document.body && document.body.classList.add('dark-theme');
  }

  // Once DOM is ready, inject the toggle button and bind events
  function initThemeToggle() {
    const header = document.querySelector('header');
    if (!header) return;

    // Don't duplicate
    if (document.getElementById('themeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.title = 'Cambiar modo claro/oscuro';
    btn.innerHTML = localStorage.getItem('koraLuxe_theme') === 'dark'
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    btn.style.cssText = `
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      font-size: 1.1rem;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      margin-right: 8px;
      transition: background 0.2s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,0.25)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.15)');

    btn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      document.documentElement.classList.toggle('dark-theme', isDark);
      localStorage.setItem('koraLuxe_theme', isDark ? 'dark' : 'light');
      btn.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    });

    // Insert before the menu-toggle (last child) or as second-to-last
    const menuToggle = header.querySelector('.menu-toggle');
    if (menuToggle) {
      header.insertBefore(btn, menuToggle);
    } else {
      header.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }

  // Also apply body class once body is available
  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('koraLuxe_theme') === 'dark') {
      document.body.classList.add('dark-theme');
    }
  });
})();
