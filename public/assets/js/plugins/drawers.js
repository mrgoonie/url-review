document.addEventListener('DOMContentLoaded', () => {
  // Drawer Management Functions
  function openDrawer(drawerId) {
    // Check for existing open drawers
    const existingOpenDrawer = document.querySelector('.drawer-container[data-drawer-open="true"]');
    const drawer = document.getElementById(drawerId);
    const drawerContent = drawer.querySelector('.drawer-content');
    const drawerMask = drawer.querySelector('.drawer-mask');
    const placement = drawer.getAttribute('data-drawer-placement');

    // Prevent scrolling on html when drawer is open
    document.documentElement.style.overflow = 'hidden';

    if (existingOpenDrawer) {
      // If there's an existing open drawer, set this as level 2
      drawer.dataset.drawerLevel = '2';
      existingOpenDrawer.dataset.drawerLevel = '1';

      // Translate the existing drawer using GSAP
      const existingDrawerContent = existingOpenDrawer.querySelector('.drawer-content');
      const existingPlacement = existingOpenDrawer.getAttribute('data-drawer-placement');

      gsap.to(existingDrawerContent, {
        x: existingPlacement === 'right' ? '-5%' : existingPlacement === 'left' ? '5%' : 0,
        y: existingPlacement === 'top' ? '5%' : existingPlacement === 'bottom' ? '-5%' : 0,
        duration: 0.3,
        ease: 'power1.out'
      });
    } else {
      // If no existing drawer is open, set this as level 1
      drawer.dataset.drawerLevel = '1';
    }

    // Open the new drawer
    drawer.classList.remove('invisible', 'opacity-0');
    drawer.dataset.drawerOpen = 'true';

    // GSAP animations for drawer and mask
    if (drawerMask) {
      gsap.to(drawerMask, {
        opacity: 1,
        duration: 0.3,
        ease: 'power1.out'
      });
    }

    gsap.to(drawerContent, {
      x: placement === 'right' ? 0 : placement === 'left' ? 0 : 0,
      y: placement === 'top' ? 0 : placement === 'bottom' ? 0 : 0,
      duration: 0.3,
      ease: 'power1.out'
    });
  }

  function closeDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    const drawerContent = drawer.querySelector('.drawer-content');
    const drawerMask = drawer.querySelector('.drawer-mask');
    const placement = drawer.getAttribute('data-drawer-placement');
    const drawerLevel = drawer.dataset.drawerLevel;

    // Animate mask
    if (drawerMask) {
      gsap.to(drawerMask, {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.out'
      });
    }

    // Animate drawer out
    gsap.to(drawerContent, {
      x: placement === 'right' ? '100%' : placement === 'left' ? '-100%' : 0,
      y: placement === 'top' ? '-100%' : placement === 'bottom' ? '100%' : 0,
      duration: 0.3,
      ease: 'power1.in',
      onComplete: () => {
        // Hide drawers after animation
        if (drawerLevel === '1') {
          drawer.classList.add('invisible', 'opacity-0');
        }

        drawer.dataset.drawerOpen = 'false';
        drawer.dataset.drawerLevel = '0';
        drawer.classList.add('invisible', 'opacity-0');

        // Check if all drawers are closed, then restore scrolling
        const openDrawers = document.querySelectorAll('.drawer-container[data-drawer-open="true"]');
        if (openDrawers.length === 0) {
          document.documentElement.style.overflow = '';
        }
      }
    });

    // If closing a level 2 drawer, restore the level 1 drawer
    if (drawerLevel === '2') {
      const levelOneDrawer = document.querySelector('.drawer-container[data-drawer-level="1"]');
      if (levelOneDrawer) {
        const levelOneDrawerContent = levelOneDrawer.querySelector('.drawer-content');

        gsap.to(levelOneDrawerContent, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power1.in'
        });
      }
    }
  }

  // Attach mask close functionality
  document.querySelectorAll('.drawer-mask').forEach(mask => {
    mask.addEventListener('click', () => {
      const drawer = mask.closest('.drawer-container');
      closeDrawer(drawer.id);
    });
  });

  // Expose global methods
  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
});