const axios = require('axios');

async function testApiFormat(sellerId, apiKey, apiSecret) {
  const formats = [
    { name: "sellerId:apiKey", creds: `${sellerId}:${apiKey}` },
    { name: "apiKey:apiSecret", creds: `${apiKey}:${apiSecret}` },
    { name: "sellerId:apiSecret", creds: `${sellerId}:${apiSecret}` }
  ];
  
  console.log("Tüm format kombinasyonları test ediliyor...");
  
  for (const format of formats) {
    try {
      console.log(`\nTest edilen format: ${format.name} (${format.creds.substring(0, 10)}...)`);
      
      const encodedCredentials = Buffer.from(format.creds).toString('base64');
      console.log(`Base64 kodlanmış kimlik: ${encodedCredentials}`);
      
      const now = new Date().getTime();
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      const response = await axios.get(
        `https://apigw.trendyol.com/integration/finance/che/sellers/${sellerId}/settlements?startDate=${weekAgo}&endDate=${now}&transactionType=Sale&page=0&size=1`,
        {
          headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      console.log("✅ BAŞARILI! Doğru kimlik formatı: " + format.name);
      console.log(`Durum kodu: ${response.status}`);
      return format.name;
    } catch (error) {
      if (error.response) {
        console.log(`❌ BAŞARISIZ: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data && error.response.data.errors) {
          console.log(`Hata: ${error.response.data.errors[0]?.message || JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log(`❌ BAĞLANTI HATASI: ${error.message}`);
      }
    }
  }
  
  console.log("\n❌❌❌ Hiçbir format çalışmadı!");
  return null;
}

async function main() {
  const sellerId = process.argv[2];
  const apiKey = process.argv[3]; 
  const apiSecret = process.argv[4];
  
  if (!sellerId || !apiKey || !apiSecret) {
    console.log("Kullanım: node testAllApiFormats.js <sellerId> <apiKey> <apiSecret>");
    process.exit(1);
  }
  
  await testApiFormat(sellerId, apiKey, apiSecret);
}

main().catch(console.error);