// Tarayıcı konsolunda çalıştırın
// Tüm DataTable örneklerini listele
$.fn.dataTable.tables().forEach(function(table) {
  console.log('DataTable ID:', $(table).attr('id'));
  console.log('Columns:', $(table).DataTable().columns().count());
});

// HTML tablo yapısını kontrol et
console.log('HTML Sütunlar:', $('#paymentsTable thead th').length);