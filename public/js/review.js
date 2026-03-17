document.addEventListener('DOMContentLoaded', () => {
  const reviewForm = document.getElementById('reviewForm');
  const urlInput = document.getElementById('websiteUrl');
  const urlError = document.getElementById('urlError');
  const reviewResult = document.getElementById('reviewResult');

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check login
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // Reset error state
    urlError.textContent = '';
    urlError.classList.add('hidden');

    // Basic URL validation
    const url = urlInput.value.trim();
    try {
      new URL(url);
    } catch (e) {
      urlError.textContent = 'Please enter a valid URL (e.g., https://example.com)';
      urlError.classList.remove('hidden');
      return;
    }

    // Show loading state
    reviewResult.classList.remove('hidden');

    try {
      const response = await fetch('/api/v1/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          options: {
            skipImageExtraction: true,
            skipLinkExtraction: true,
            maxExtractedImages: 50,
            maxExtractedLinks: 50
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start review');
      }

      // Redirect to review page or show success message
      if (data.data?.id) {
        window.location.href = `/review/${data.data.id}`;
      }
    } catch (error) {
      urlError.textContent = error.message || 'An error occurred while processing your request';
      urlError.classList.remove('hidden');
    } finally {
      reviewResult.classList.add('hidden');
    }
  });
});
