(() => {
  const decBtn = document.getElementById('decrement');
  const incBtn = document.getElementById('increment');
  const valueEl = document.getElementById('value');

  let count = 0;

  const render = () => {
    valueEl.textContent = String(count);
  };

  decBtn.addEventListener('click', () => {
    count -= 1;
    render();
  });

  incBtn.addEventListener('click', () => {
    count += 1;
    render();
  });

  render();
})();
