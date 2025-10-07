// Mobile compatibility fixes
document.addEventListener('touchstart', function(){}, {passive: true});

if (window.location.protocol === 'https:' && typeof API_CONFIG !== 'undefined') {
  API_CONFIG.BASE_URL = API_CONFIG.BASE_URL.replace('http://', 'https://');
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('button, .btn, [onclick]').forEach(btn => {
    btn.style.cursor = 'pointer';
    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.click();
    }, {passive: false});
  });
});