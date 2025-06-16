// Dosya yolu: c:\Users\PC\Desktop\trendyol-finance-integration\src\utils\validators.js
const validators = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidPassword: (password) => {
    // En az 8 karakter, en az bir büyük harf, bir küçük harf ve bir rakam
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  },
  
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },
  
  isDateRangeValid: (startDate, endDate, maxDays = 15) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }
    
    // Bitiş tarihi başlangıç tarihinden sonra mı?
    if (end <= start) {
      return false;
    }
    
    // Tarih aralığı maxDays günden fazla mı?
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= maxDays;
  }
};

module.exports = validators;