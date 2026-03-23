const modal = document.getElementById('LoveModal');
const openButton = document.getElementById('BVer');
const closeButton = document.getElementById('CerrarModal');

function openModal() {
    if (!modal) return;
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
}

openButton?.addEventListener('click', openModal);
closeButton?.addEventListener('click', closeModal);

modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});
