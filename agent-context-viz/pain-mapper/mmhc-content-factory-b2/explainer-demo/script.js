(() => {
  const countEl = document.getElementById('count');
  const incBtn = document.getElementById('increment');
  const decBtn = document.getElementById('decrement');

  if (!countEl || !incBtn || !decBtn) return;

  let count = 0;

  const render = () => {
    countEl.textContent = String(count);
  };

  incBtn.addEventListener('click', () => {
    count += 1;
    render();
  });

  decBtn.addEventListener('click', () => {
    count -= 1;
    render();
  });

  // Optional: keyboard support when buttons are focused (Enter/Space already works)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === '+') {
      count += 1;
      render();
    } else if (e.key === 'ArrowDown' || e.key === '-') {
      count -= 1;
      render();
    }
  });

  render();
})();
