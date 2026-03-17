document.addEventListener('DOMContentLoaded', () => {
  // fetch "/api/v1/profile" to get auth user
  const getAuthUser = async () => {
    const response = await fetch('/api/v1/profile');
    const result = await response.json();
    return result.data;
  }
  window.getAuthUser = getAuthUser;

  // get products of auth user
  const getAuthUserProducts = async () => {
    const response = await fetch("/api/v1/profile/products");
    const result = await response.json();
    return result.data;
  }
  window.getAuthUserProducts = getAuthUserProducts;

  // get groupAds of auth user
  const getAuthUserGroupAds = async () => {
    const response = await fetch("/api/v1/profile/group-ads");
    const result = await response.json();
    return result.data;
  }
  window.getAuthUserGroupAds = getAuthUserGroupAds;
});
