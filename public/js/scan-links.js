document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('broken-links-form');
  const submitButton = form.querySelector('button[type="submit"]');
  const defaultText = submitButton.querySelector('.default-text');
  const loadingText = submitButton.querySelector('.loading-text');

  const toggleLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    defaultText.classList.toggle('hidden', isLoading);
    loadingText.classList.toggle('hidden', !isLoading);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const urlInput = form.querySelector('input[name="url"]');
    const url = urlInput.value.trim();

    if (!url) {
      alert('Please enter a valid URL');
      return;
    }

    toggleLoading(true);

    try {
      const response = await fetch(`/api/v1/scrape/links?url=${encodeURIComponent(url)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'all',
          getStatusCode: true,
          autoScrapeInternalLinks: true,
          maxLinks: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to scan links');
      }

      // Redirect to scan results page
      window.location.href = `/scan/${data.data.id}`;
    } catch (error) {
      console.error('Error scanning links:', error);
      alert(error.message || 'An error occurred while scanning links');
      toggleLoading(false);
    }
  });
});
