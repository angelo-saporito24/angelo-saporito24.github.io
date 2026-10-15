/* Light and dark modes.
   The page follows the reader's system setting until they press the switch;
   after that, their choice is remembered on this device. */
(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const system = matchMedia('(prefers-color-scheme: dark)');

  const stored = () => { try { return localStorage.getItem('theme'); } catch (e) { return null; } };
  const current = () => root.dataset.theme || (system.matches ? 'dark' : 'light');

  function label() {
    if (!button) return;
    const next = current() === 'dark' ? 'light' : 'dark';
    button.textContent = next === 'dark' ? 'Dark' : 'Light';
    button.setAttribute('aria-label', 'Switch to ' + next + ' mode');
  }

  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    });
  }
  if (system.addEventListener) system.addEventListener('change', () => { if (!stored()) label(); });
  label();
})();
