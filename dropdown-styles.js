// تنسيق القوائم المنسدلة
document.addEventListener('DOMContentLoaded', function() {
  // الحصول على جميع القوائم المنسدلة
  const selects = document.querySelectorAll('select');
  
  selects.forEach(select => {
    // إضافة حدث عند فتح القائمة
    select.addEventListener('click', function() {
      // تغيير خلفية القائمة المنسدلة
      const options = this.querySelectorAll('option');
      options.forEach(option => {
        option.style.backgroundColor = '#00008B';
        option.style.color = '#ffeb3b';
        option.style.padding = '10px';
      });
    });
    
    // إضافة حدث عند تغيير القيمة
    select.addEventListener('change', function() {
      // تحديث مظهر القائمة المنسدلة
      this.style.backgroundColor = 'linear-gradient(135deg, #00008B, #040720)';
      this.style.color = '#ffeb3b';
    });
  });
}); 