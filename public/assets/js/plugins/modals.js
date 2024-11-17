// Modal Management Functions
document.addEventListener('DOMContentLoaded', () => {
  function createModal(options = {}) {
    const {
      content = '',
      header = 'Modal Title',
      footer = '',
      actions = [],
      onClose = () => { },
      onOk = () => { },
      size = 'medium',
      maskCloseable = true
    } = options;

    // Create modal container
    const modal = document.createElement('div');
    modal.id = `modal-${Date.now()}`;
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
    `;
    modal.dataset.modalOpen = 'false';

    // Create modal mask
    const modalMask = document.createElement('div');
    modalMask.classList.add('modal-mask');
    modalMask.style.cssText = `
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s;
      cursor: pointer;
    `;

    // Create modal content wrapper
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    modalContent.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      width: ${size === 'small' ? '33.333%' : size === 'medium' ? '50%' : '66.667%'};
      max-width: 90%;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      transition: all 0.3s;
      opacity: 0;
    `;

    // Modal Header
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: ${!header ? 'none' : 'flex'};
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = `
      font-size: 2.5rem;
      font-weight: 600;
      flex-grow: 1;
    `;
    modalTitle.textContent = header;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      color: #6b7280;
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      background-color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `;
    closeButton.innerHTML = '<i class="ri-close-line text-2xl"></i>';

    // Modal Body
    const modalBody = document.createElement('div');
    modalBody.style.cssText = `
      padding: 1.5rem;
      flex-grow: 1;
      overflow-y: auto;
    `;
    modalBody.innerHTML = content;

    // Modal Footer
    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      display: ${!footer && !actions.length ? 'none' : 'flex'};
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
    `;

    // Footer content
    if (footer) {
      const footerContent = document.createElement('div');
      footerContent.innerHTML = footer;
      modalFooter.appendChild(footerContent);
    }

    // Action buttons
    actions.forEach(action => {
      const actionButton = document.createElement('button');
      actionButton.style.cssText = `
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        background-color: #3b82f6;
        color: white;
        font-weight: 500;
        transition: background-color 0.2s;
      `;
      actionButton.textContent = action.label;
      actionButton.addEventListener('click', () => {
        if (action.onClick) action.onClick();
        closeModal(modal);
      });
      modalFooter.appendChild(actionButton);
    });

    // Assemble modal
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);

    modal.appendChild(modalMask);
    modal.appendChild(modalContent);

    // Add to document
    document.body.appendChild(modal);

    // Open modal function
    function openModal() {
      // Prevent scrolling on html when modal is open
      document.documentElement.style.overflow = 'hidden';

      // Show modal
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.dataset.modalOpen = 'true';

      // GSAP animations for modal and mask
      gsap.to(modalMask, {
        opacity: 1,
        duration: 0.3,
        ease: 'power1.out'
      });

      gsap.to(modalContent, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });
    }

    // Close modal function
    function closeModal(modalElement) {
      // Re-enable scrolling
      document.documentElement.style.overflow = 'auto';

      // GSAP animations for closing
      gsap.to(modalElement.querySelector('.modal-mask'), {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.out'
      });

      gsap.to(modalElement.querySelector('.modal-content'), {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          modalElement.style.visibility = 'hidden';
          modalElement.style.opacity = '0';
          modalElement.dataset.modalOpen = 'false';

          // Call onClose callback
          onClose();

          // Remove modal from DOM after animation
          setTimeout(() => {
            modalElement.remove();
          }, 300);
        }
      });
    }

    // Event Listeners
    closeButton.addEventListener('click', () => closeModal(modal));

    // Mask close functionality
    if (maskCloseable) {
      modalMask.addEventListener('click', (e) => {
        if (e.target === modalMask) {
          closeModal(modal);
        }
      });
    }

    // Open the modal
    openModal();

    // Return modal methods
    return {
      close: () => closeModal(modal),
      getModalElement: () => modal
    };
  }

  // Expose createModal globally
  window.createModal = createModal;
});
