// Group Ad Management Functions
document.addEventListener('DOMContentLoaded', () => {
  // get group ad by id
  const getGroupAdById = async (groupAdId) => {
    try {
      const response = await fetch(`/api/v1/group-ads/${groupAdId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 1) {
        throw new Error(result.message || 'Failed to fetch group ad');
      }

      return result.data;
    } catch (error) {
      console.error('group-ads.js > getGroupAdById() > error :>>', error);
      throw error;
    }
  }
  window.getGroupAdById = getGroupAdById;

  // get group ad participants
  const getGroupAdParticipants = async (groupAdId) => {
    try {
      const response = await fetch(`/api/v1/group-ads/${groupAdId}/participants`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 1) {
        throw new Error(result.message || 'Failed to fetch group ad participants');
      }

      return result.data;
    } catch (error) {
      console.error('group-ads.js > getGroupAdParticipants() > error :>>', error);
      throw error;
    }
  }
  window.getGroupAdParticipants = getGroupAdParticipants;

  // join group ad
  const joinGroupAd = async (groupAdId) => {
    // get auth user
    const user = await window.getAuthUser();
    console.log('joinGroupAd() > user :>>', user);
    // get user products
    const userProducts = await window.getAuthUserProducts();
    // get group ad by id
    const groupAd = await getGroupAdById(groupAdId);
    // get group ad participants
    const participants = groupAd.groupParticipants || [];

    console.log('joinGroupAd() > groupAd :>>', groupAd);

    // open drawer
    openDrawer('group-ad-preview');

    // set group ad data to drawer
    const groupAdPreviewDrawer = document.getElementById('group-ads-preview-container');
    // set group ad data & participants to drawer
    // Populate group ad preview drawer with group ad and participants data
    if (groupAdPreviewDrawer) {
      // Group Ad Information Section
      const groupAdCreatedBy = groupAdPreviewDrawer.querySelector('#group-ads-created-by');
      const groupAdCreatedAt = groupAdPreviewDrawer.querySelector('#group-ads-created-at');
      const groupAdCategory = groupAdPreviewDrawer.querySelector('#group-ads-category');
      const groupAdIndividualBudget = groupAdPreviewDrawer.querySelector('#group-ads-individual-budget');
      const groupAdDuration = groupAdPreviewDrawer.querySelector('#group-ads-duration');
      const groupAdCountries = groupAdPreviewDrawer.querySelector('#group-ads-countries');
      const groupAdAdvertisingPlatforms = groupAdPreviewDrawer.querySelector('#group-ads-advertising-platforms');

      // Group Ad Summary Section
      const summaryDuration = groupAdPreviewDrawer.querySelector('#summary-duration');
      const summaryDailyBudget = groupAdPreviewDrawer.querySelector('#summary-daily-budget');
      const summaryTotalSlots = groupAdPreviewDrawer.querySelector('#summary-total-slots');
      const summaryTotalBudget = groupAdPreviewDrawer.querySelector('#summary-total-budget');
      const summaryYourBudget = groupAdPreviewDrawer.querySelector('#summary-your-budget');
      const summaryServiceFee = groupAdPreviewDrawer.querySelector('#summary-service-fee');
      const summaryVat = groupAdPreviewDrawer.querySelector('#summary-vat');
      const summaryTotal = groupAdPreviewDrawer.querySelector('#summary-total');

      // Products Grid
      const productsGrid = groupAdPreviewDrawer.querySelector('.products-grid');

      // Set group ad ID and product ID for reference
      groupAdPreviewDrawer.dataset.groupAdId = groupAd.id;
      groupAdPreviewDrawer.dataset.productId = groupAd.productId;

      // Populate Group Ad Information
      if (groupAdCreatedBy) groupAdCreatedBy.textContent = groupAd.user?.name || 'Unknown';
      if (groupAdCreatedAt) groupAdCreatedAt.textContent = new Date(groupAd.createdAt).toLocaleDateString();

      // Category handling (assuming first category)
      if (groupAdCategory) {
        groupAdCategory.textContent = groupAd.product?.categories && groupAd.product.categories.length > 0
          ? groupAd.product.categories[0].name
          : 'N/A';
      }

      if (groupAdIndividualBudget) groupAdIndividualBudget.textContent = `$${groupAd.budget.toFixed(2)}`;

      // Parse performance metrics safely
      const campaignSettings = groupAd.campaignSettings || {};

      if (groupAdDuration) groupAdDuration.textContent = `${campaignSettings.duration || 0} days`;
      if (groupAdCountries) groupAdCountries.textContent = campaignSettings.countries?.join(', ') || 'N/A';
      if (groupAdAdvertisingPlatforms) groupAdAdvertisingPlatforms.textContent = campaignSettings.platforms?.join(', ') || 'N/A';

      // Populate Group Ad Summary
      if (summaryDuration) summaryDuration.textContent = `${campaignSettings.duration || 0} days`;
      if (summaryDailyBudget) summaryDailyBudget.textContent = `$${groupAd.budget.toFixed(2)}`;
      if (summaryTotalSlots) summaryTotalSlots.textContent = groupAd.totalSlots;

      const totalBudget = groupAd.budget * groupAd.totalSlots;
      if (summaryTotalBudget) summaryTotalBudget.textContent = `$${totalBudget.toFixed(2)}`;

      // Calculate service fee and VAT (matching group-ads-crud.ts)
      const serviceFeeRate = 0.15; // 15%
      const vatRate = 0.05; // 5%
      const serviceFee = totalBudget * serviceFeeRate;
      const vat = totalBudget * vatRate;
      const total = totalBudget * (1 + serviceFeeRate + vatRate);

      if (summaryYourBudget) summaryYourBudget.textContent = `$${groupAd.budget.toFixed(2)}`;
      if (summaryServiceFee) summaryServiceFee.textContent = `$${serviceFee.toFixed(2)}`;
      if (summaryVat) summaryVat.textContent = `$${vat.toFixed(2)}`;
      if (summaryTotal) summaryTotal.textContent = `$${total.toFixed(2)}`;

      // Populate Products Grid
      if (productsGrid) {
        // Clear existing product slots
        productsGrid.innerHTML = '';

        // Add initial product (group ad creator's product)
        const initialProductSlot = document.createElement('div');
        initialProductSlot.className = 'bg-gray-100 p-4 rounded-2xl flex gap-4';
        initialProductSlot.innerHTML = `
          <div class="size-[40px]">
            <img src="${groupAd.product.logoUrl || '/default-product-image.png'}" 
                 alt="${groupAd.product.name}" 
                 class="w-full h-full object-cover rounded">
          </div>
          <div class="flex flex-col gap-1 justify-center">
            <p class="font-semibold my-0">${groupAd.product.name}</p>
            <p class="text-xl text-gray-600 my-0">${groupAd.user.name}</p>
          </div>
        `;
        productsGrid.appendChild(initialProductSlot);

        // Add empty slots for remaining participants
        const remainingSlots = groupAd.totalSlots - 1;
        for (let i = 0; i < remainingSlots; i++) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'bg-gray-100 p-4 rounded-2xl flex gap-4';
          emptySlot.innerHTML = `
            <select name="product-slot" class="w-full p-2 rounded-lg border">
              <option value="">Select Your Product</option>
              ${userProducts.map(product => `
                <option value="${product.id}">
                  ${product.name}
                </option>
              `).join('')}
            </select >`;
          // append empty slot to products grid
          productsGrid.appendChild(emptySlot);
        }
      }
    }
  }
  window.joinGroupAd = joinGroupAd;

  // activate group ad api
  const activateGroupAd = async (groupAdId, groupAdPayment, userBalance) => {
    try {
      // Check if user has sufficient balance
      if (parseFloat(userBalance) < parseFloat(groupAdPayment)) {
        console.error('group-ads.js > activateGroupAd() > Insufficient balance :>>', userBalance);
        createModal({
          header: 'Insufficient Balance',
          content: 'You do not have enough balance to activate this group ad.',
          actions: [
            {
              label: 'Close',
              className: 'btn btn-secondary',
              onClick: () => { }
            }
          ]
        });
        return;
      }

      // Call API to pay for group ad
      const response = await fetch('/api/v1/group-ads/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupAdId: groupAdId
        })
      });

      const result = await response.json();

      if (result.status === 1) {
        // Payment successful
        createModal({
          header: 'Group Ad Activated',
          content: 'Your group ad has been successfully activated.',
          actions: [
            {
              label: 'Close',
              className: 'btn btn-primary',
              onClick: () => {
                // Optionally reload the page or update UI
                window.location.reload();
              }
            }
          ]
        });
      } else {
        // Handle payment failure
        createModal({
          header: 'Activation Failed',
          content: result.message || 'Unable to activate group ad. Please try again.',
          actions: [
            {
              label: 'Close',
              className: 'btn btn-secondary',
              onClick: () => { }
            }
          ]
        });
      }
    } catch (error) {
      console.error('group-ads.js > activateGroupAd() > error :>>', error);
      createModal({
        header: 'Error',
        content: 'An unexpected error occurred. Please try again.',
        actions: [
          {
            label: 'Close',
            className: 'btn btn-secondary',
            onClick: () => { }
          }
        ]
      });
    }
  }
  window.activateGroupAd = activateGroupAd;

  // activate group ad button
  document.querySelectorAll('.btn-activate-group-ad').forEach(button => {
    button.addEventListener('click', async () => {
      // get group ad info
      const groupAdId = button.getAttribute('data-id');
      const groupAdPayment = button.getAttribute('data-group-ad-payment');
      const userBalance = button.getAttribute('data-user-balance');

      // check enough balance
      if (parseFloat(userBalance) < parseFloat(groupAdPayment)) {
        window.location.href = `/payment-request?group_ad_id=${groupAdId}`;
        return;
      }

      const activateGroupAdModal = `<div>
        <h4>Your balance: <strong>$${userBalance}</strong></h4>
        <h4>Group Ad budget: <strong>$${groupAdPayment}</strong></h4>
        <h4>Remaining balance: <strong>$${userBalance - groupAdPayment}</strong></h4>
      </div>`;

      // confirm activate group ad
      createModal({
        header: 'Activate this Group Ad',
        content: activateGroupAdModal,
        actions: [
          {
            label: 'Activate',
            className: 'btn btn-primary',
            onClick: () => {
              activateGroupAd(groupAdId, groupAdPayment, userBalance);
            }
          }
        ]
      });
    });
  });
});