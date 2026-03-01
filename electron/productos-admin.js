  function openModal(mode) {
    document.getElementById('modalTitle').textContent = mode === 'add' ? 'Nuevo Producto' : 'Editar Producto';
    document.getElementById('productModal').style.display = 'flex';
  }
  function closeModal() {
    document.getElementById('productModal').style.display = 'none';
  }
  window.onclick = function(e) {
    if (e.target.classList.contains('modal')) closeModal();
  }