Cari Hesap Ekstresi Entegrasyonu
Değişiklik yapılan tüm entegrasyon servislerine ise developers.tgoapps.com adresinden ulaşabilirsiniz. :::

Trendyol sisteminde oluşan muhasebesel kayıtlarınızı bu servis aracılığı ile entegrasyon üzerinden çekebilirsiniz.

Finansal kayıtlar sipariş teslim edildikten sonra oluşmaktadır.
transactionType girilmesi zorunludur. 1 istekte yalnızca 1 type girilebilir.
paymentOrderId siparişin ödemesi yapıldıktan sonra oluşmaktadır. İstisnalar hariç, her çarşamba, ilgili haftada vadesi gelen siparişler için ödeme emri oluşur.
paymentOrderId ile sipariş ve ödemelerinizi eşleştirebilirsiniz.
Başlangıç ve bitiş tarihi girilmesi zorunludur ve arasındaki süre 15 günden uzun olamaz.
Store bilgileri Marketplace satıcıları için "null" olarak dönecektir.
"affiliate" alanı "TRENDYOLTR" yada "TRENDYOLAZJV" dönebilir.
Kullanılacak olan 2 servis (settlements , otherfinancials) birbirinden ayrı işlem kayıtlarını vermektedir.

settlements servisinden satış, iade, indirim, kupon, provizyon işlemlerinin detaylarına ulaşabilirsiniz.
otherfinancial servisinden ise tedarikçi finansmanı, virman, ödemeler (hakediş), faturalar (Trendyoldan tedarikçiye) , tedarikçi faturaları (Tedarikçiden Trendyola), gelen havale, komisyon mutabakat faturaları işlemlerinin detaylarına ulaşabilirsiniz.
GET settlements (Satış, İade, İndirim, Kupon, Provizyon işlemlerinin detaylarını verir)
PROD
https://apigw.trendyol.com/integration/finance/che/sellers/{sellerId}/settlements
STAGE
https://stageapigw.trendyol.com/integration/finance/che/sellers/{sellerId}/settlements
Önerilen Endpoint

bilgi
https://apigw.trendyol.com/integration/finance/che/sellers/{sellerId}/settlements?endDate={endDate}&startDate={startDate}&transactionType={Type}&page=0&size=500
Parametre	Parametre Değer	Açıklama	Tip	Zorunlu
transactionType	Sale, Return, Discount, DiscountCancel, Coupon, CouponCancel, ProvisionPositive, ProvisionNegative	Finansal işlem türüdür.	string	Evet
startDate		Belirli bir tarihten sonraki işlem kayıtlarını getirir. Timestamp milisecond olarak gönderilmelidir.	int	Evet
endDate		Belirli bir tarihten sonraki işlem kayıtlarını getirir. Timestamp milisecond olarak gönderilmelidir.	int	Evet
page		Sadece belirtilen sayfadaki bilgileri döndürür	int	Hayır
size	500 ve 1000 değerlerini alabilir. (Default=500)	Bir sayfada listelenecek maksimum adeti belirtir.	int	Hayır
supplierId		İlgili tedarikçinin ID bilgisi gönderilmelidir	long	Evet
transactionType için kullanılabilecek işlem türlerinin açıklamaları aşağıdaki gibidir.
transactionType	Açıklama
Sale	Siparişlere ait satış kayıtlarını verir
Return	Siparişlere ait iade kayıtlarını verir
Discount	Tedarikçi tarafından karşılanan indirim tutarını gösterir.
DiscountCancel	Ürün iptal veya iade olduğunda atılan kayıttır. İndirim kaydının tersi olarak düşünülebilir
Coupon	Tedarikçi tarafından karşılanan kupon tutarını gösterir.
CouponCancel	Ürün iptal veya iade olduğunda atılan kayıttır. Kupon kaydının tersi olarak düşünülebilir
ProvisionPositive	Gramaj farkından dolayı oluşan tutarlar Provizyon kaydı olarak atılır. Sipariş iptal veya iade olduğunda birbirinin tersi olarak kayıt atılır.
ProvisionNegative	Gramaj farkından dolayı oluşan tutarlar Provizyon kaydı olarak atılır. Sipariş iptal veya iade olduğunda birbirinin tersi olarak kayıt atılır.
ManualRefund	Kısmi iade durumunda atılan kayıttır. Bir ürün için ürün tutarından daha az olacak şekilde iade kaydı oluşturuluyor ise bu kayıt atılmaktadır.
ManualRefundCancel	Kısmi iade olan bir ürün için ürün tamamen iade olduğunda, kısmi iadenin iptali amacıyla bu kayıt atılır. Böylece, daha önceden atılan kısmi iade tutarı için mahsuplaşılır.
TYDiscount	Kurumsal faturalı alışverişlerde, Trendyol’un karşıladığı indirimler için bu kayıt atılır. Bu tutar, ay sonlarında satıcıdan talep edilen fatura ile satıcıya ödenir.
TYDiscountCancel	Kurumsal faturalı alışverişlerde, Trendyol’un karşıladığı indirimler için atılan TYDiscount kaydına istinaden atılır. Ürünün iptal veya iade olması durumunda bu kayıt atılır.
TYCoupon	Kurumsal faturalı alışverişlerde, Trendyol’un karşıladığı kuponlar için bu kayıt atılır. Bu tutar, ay sonlarında satıcıdan talep edilen fatura ile satıcıya ödenir.
TYCouponCancel	Kurumsal faturalı alışverişlerde, Trendyol’un karşıladığı kuponlar için atılan TYCoupon kaydına istinaden atılır. Ürünün iptal veya iade olması durumunda bu kayıt atılır.
Örnek Servis Cevabı (transactionType=Sale kullanılmıştır)
{
    "page": 0,
    "size": 500,
    "totalPages": 878,
    "totalElements": 438974,
    "content": [
        {
            "id": "725041340",
            "transactionDate": 1613397671561,  // İşlem Tarihi
            "barcode": "8681385952874",
            "transactionType": "Satış",
            "receiptId": 48376618,             // Dekont No
            "description": "Satış",
            "debt": 0.0,                       // Borç
            "credit": 449.99,                  // Alacak
            "paymentPeriod": 30,               // Vade Süresi
            "commissionRate": 15.0,            // Siparişteki Ürüne Ait Komisyon Oranı
            "commissionAmount": 67.4985,       // Trendyol Komisyon Tutarı
            "commissionInvoiceSerialNumber": null,
            "sellerRevenue": 382.4915,         // Satıcı Hakediş Tutarı
            "orderNumber": "501915861",
            "paymentOrderId": 112360,          // Ödeme Numarası
            "paymentDate": 1615989671561,      // Ödeme Tarihi
            "sellerId": 123456,
            "storeId": null,
            "storeName": null,
            "storeAddress": null,
            "country": "Türkiye",
            "orderDate": 1720107451532,
            "affiliate": "TRENDYOLTR",
            "shipmentPackageId": 1111111111
        },
        {
            "id": "725041335",
            "transactionDate": 1613397671557,
            "barcode": "8681387147421",
            "transactionType": "Satış",
            "receiptId": 48376618,
            "description": "Satış",
            "debt": 0.0,
            "credit": 699.99,
            "paymentPeriod": 28,
            "commissionRate": 15.0,
            "commissionAmount": 104.9985,
            "commissionInvoiceSerialNumber": null,
            "sellerRevenue": 594.9915,
            "orderNumber": "501915861",
            "paymentOrderId": 112360,
            "paymentDate": 1615989671557,
            "sellerId": 123456,
            "storeId": null,
            "storeName": null,
            "storeAddress": null,
            "country": "Türkiye",
            "orderDate": 1720107451532,
            "affiliate": "TRENDYOLTR",
            "shipmentPackageId": 1111111111
        }
        ]
}

GET otherfinancials (Tedarikçi finansmanı, virman, ödemeler, faturalar, tedarikçi faturaları, gelen havale, komisyon mutabakat faturaları)
PROD
https://apigw.trendyol.com/integration/finance/che/sellers/{sellerId}/otherfinancials
STAGE
https://stageapigw.trendyol.com/integration/finance/che/sellers/{sellerId}/otherfinancials
Önerilen Endpoint

bilgi
https://apigw.trendyol.com/integration/finance/che/sellers/{sellerId}/otherfinancials?endDate={endDate}&startDate={startDate}&transactionType={Type}&page=0&size=500
Parametre	Parametre Değer	Açıklama	Tip	Zorunlu
transactionType	Stoppage, CashAdvance, WireTransfer, IncomingTransfer, ReturnInvoice, CommissionAgreementInvoice, PaymentOrder, DeductionInvoices	Finansal işlem türüdür.	string	Evet
startDate		Belirli bir tarihten sonraki işlem kayıtlarını getirir. Timestamp milisecond olarak gönderilmelidir.	int	Evet
endDate		Belirli bir tarihten sonraki işlem kayıtlarını getirir. Timestamp milisecond olarak gönderilmelidir.	int	Evet
page		Sadece belirtilen sayfadaki bilgileri döndürür	int	Hayır
size	500 ve 1000 değerlerini alabilir. (Default=500)	Bir sayfada listelenecek maksimum adeti belirtir.	int	Hayır
supplierId		İlgili tedarikçinin ID bilgisi gönderilmelidir	long	Evet
transactionType için kullanılabilecek işlem türlerinin açıklamaları aşağıdaki gibidir.
transactionType	Açıklama
CashAdvance	Vadesi henüz gelmemiş hakedişler için erken ödeme alındığında atılan kayıttır.
WireTransfer	Trendyol ile Tedarikçi arasında yapılan virman için atılan kayıttır.
IncomingTransfer	Borçlu durumundaki tedarikçiden, Trendyola yapılan ödemeler için atılan kayıttır
ReturnInvoice	Tedarikçiden Trendyola kesilen iade faturalarıdır. Bakiyeyi + olarak etkiler.
CommissionAgreementInvoice	Tedarikçinin mahsuplaşma yapılacak alacağı olmadığı durumda, iade gelen ürünler için tedarikçiden alınan komisyon mutabakat faturasıdır.
PaymentOrder	Vadesi gelen işlemlerden hesaplanarak tedarikçiye yapılan hakediş ödemesidir
DeductionInvoices	Trendyol tarafından sağlanan hizmetler için tedarikçiye kesilen faturadır.
Stoppage	Bu işlem tipiyle gelindiğinde ilgili tarih aralığındaki E-ticaret Stopajı ve E-ticaret Stopaj İptali kalemleri listelenecek.
Örnek Servis Cevabı (transactionType=PaymentOrder kullanılmıştır)
{
    "page": 0,
    "size": 500,
    "totalPages": 1,
    "totalElements": 2,
    "content": [
        {
            "id": "1639160",
            "transactionDate": 1613062815995,
            "barcode": null,
            "transactionType": "Ödeme",
            "receiptId": null,
            "description": null,
            "debt": 8754732.06,
            "credit": 0.0,
            "paymentPeriod": null,
            "commissionRate": null,
            "commissionAmount": null,
            "commissionInvoiceSerialNumber": null,
            "sellerRevenue": null,
            "orderNumber": null,
            "paymentOrderId": 112360,
            "paymentDate": null,
            "sellerId": 123456,
            "storeId": null,
            "storeName": null,
            "storeAddress": null,
            "country": "Türkiye",
            "orderDate": 1720107451532,
            "affiliate": "TRENDYOLTR",
            "shipmentPackageId": 1111111111

        },
        {
            "id": "1576967",
            "transactionDate": 1612458029832,
            "barcode": null,
            "transactionType": "Ödeme",
            "receiptId": null,
            "description": null,
            "debt": 5707246.85,
            "credit": 0.0,
            "paymentPeriod": null,
            "commissionRate": null,
            "commissionAmount": null,
            "commissionInvoiceSerialNumber": null,
            "sellerRevenue": null,
            "orderNumber": null,
            "paymentOrderId": 1576967,
            "paymentDate": null,
            "sellerId": 123456,
            "storeId": null,
            "storeName": null,
            "storeAddress": null,
            "country": "Türkiye",
            "orderDate": 1720107451532,
            "affiliate": "TRENDYOLTR",
            "shipmentPackageId": 1111111111
        }
    ]
}

TransactionType	MP	Türkçe	ÖdemeTipi
Sale	+	Satış	Alacak (+)
Return	+	İade	Borç (-)
Discount	+	İndirim	Borç (-)
Discount Cancel	+	İndirim İptal	Alacak (+)
Coupon	+	Kupon	Alacak (+)
Coupon Cancel	+	Kupon İptal	Borç (-)
Provision Positive	-	Provizyon +	Alacak (+)
Provision Negative	-	Provizyon -	Borç (-)
TYDiscount	+	Kurumsal Fatura - TY Promosyon	Borç (-)
TYDiscountCancel	+	Kurumsal Fatura - TY Promosyon İptali	Alacak (+)
TYCoupon	+	Kurumsal Fatura - TY Kupon	Borç (-)
TYCoupon Cancel	+	Kurumsal Fatura - TY Kupon İptali	Alacak (+)
ManuelRefund	-	Kısmi İade	Borç (-)
ManuelRefundCancel	-	Kısmi İade İptal	Alacak (+)
Parametre	comissionAmount	sellerRevenue
Sale	-	+
Return	+	-
Discount	+	-
Discount Cancel	-	+
Coupon	+	-
Coupon Cancel	-	+
Provision Positive	-	+
Provision Negative	+	-
TYDiscount	+	-
TYDiscountCancel	-	+
TYCoupon	+	-
TYCoupon Cancel	-	+
ManuelRefund	+	-
ManuelRefundCancel	-	+