// Basit bir SPA (Single Page Application) router
const app = {
  currentPage: null,
  pages: {},
  
  init: function() {
    // Sayfa içeriklerini tanımla
    this.pages = {
      dashboard: {
        title: 'Dashboard',
        render: () => `
          <h1>Dashboard</h1>
          <div class="row mt-4">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Toplam Satış</h5>
                  <h2 class="card-text text-primary">₺12,450</h2>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Aktif Ürünler</h5>
                  <h2 class="card-text text-success">245</h2>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Bekleyen Siparişler</h5>
                  <h2 class="card-text text-warning">18</h2>
                </div>
              </div>
            </div>
          </div>
        `
      },
      stores: {
        title: 'Mağazalar',
        render: () => `
          <h1>Mağazalar</h1>
          <button class="btn btn-primary mb-3">Yeni Mağaza Ekle</button>
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mağaza Adı</th>
                  <th>API Anahtarı</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody id="stores-table">
                <tr>
                  <td colspan="5" class="text-center">Yükleniyor...</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
        afterRender: () => {
          // API'den mağaza verilerini çek
          fetch('/api/stores')
            .then(response => response.json())
            .then(stores => {
              const tableBody = document.getElementById('stores-table');
              if (stores.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Henüz mağaza bulunmuyor</td></tr>`;
                return;
              }
              
              tableBody.innerHTML = stores.map(store => `
                <tr>
                  <td>${store.id}</td>
                  <td>${store.name}</td>
                  <td>${store.api_key.substring(0, 8)}...</td>
                  <td>
                    <span class="badge ${store.active ? 'bg-success' : 'bg-danger'}">
                      ${store.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary">Düzenle</button>
                    <button class="btn btn-sm btn-danger">Sil</button>
                  </td>
                </tr>
              `).join('');
            })
            .catch(error => {
              console.error('Mağaza verileri yüklenirken hata:', error);
              document.getElementById('stores-table').innerHTML = 
                `<tr><td colspan="5" class="text-center text-danger">Veriler yüklenirken hata oluştu</td></tr>`;
            });
        }
      },
      login: {
        title: 'Giriş Yap',
        render: () => `
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h3 class="mb-0">Giriş Yap</h3>
                </div>
                <div class="card-body">
                  <form id="loginForm">
                    <div class="mb-3">
                      <label for="email" class="form-label">E-posta</label>
                      <input type="email" class="form-control" id="email" required>
                    </div>
                    <div class="mb-3">
                      <label for="password" class="form-label">Şifre</label>
                      <input type="password" class="form-control" id="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Giriş Yap</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `,
        afterRender: () => {
          document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // API'ye giriş isteği gönder
            fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
              if (data.error) {
                alert('Giriş başarısız: ' + data.error);
                return;
              }
              
              // Başarılı giriş
              localStorage.setItem('token', data.session.access_token);
              document.getElementById('loginBtn').classList.add('d-none');
              document.getElementById('logoutBtn').classList.remove('d-none');
              window.location.hash = '#/dashboard';
            })
            .catch(error => {
              console.error('Giriş hatası:', error);
              alert('Giriş yapılırken bir hata oluştu.');
            });
          });
        }
      }
    };
    
    // Hash değişikliklerini dinle
    window.addEventListener('hashchange', this.routeChange.bind(this));
    
    // Sayfa ilk yüklendiğinde
    this.routeChange();
    
    // Kullanıcı durumunu kontrol et
    this.checkAuthStatus();
  },
  
  routeChange: function() {
    let hash = window.location.hash.substring(2) || 'dashboard';
    
    // Eğer giriş yapılmamışsa ve korumalı bir sayfaya erişilmeye çalışılıyorsa
    const token = localStorage.getItem('token');
    if (!token && hash !== 'login') {
      window.location.hash = '#/login';
      return;
    }
    
    // Sayfa içeriğini yükle
    const page = this.pages[hash];
    if (page) {
      document.title = `Trendyol Entegrasyon - ${page.title}`;
      document.getElementById('app').innerHTML = page.render();
      
      // Sayfa yüklendikten sonra çalıştırılacak kodlar
      if (page.afterRender) {
        page.afterRender();
      }
      
      this.currentPage = hash;
    } else {
      // 404 sayfası
      document.getElementById('app').innerHTML = `
        <div class="text-center">
          <h1>404</h1>
          <p>Sayfa bulunamadı</p>
          <a href="#/dashboard" class="btn btn-primary">Ana Sayfaya Dön</a>
        </div>
      `;
    }
  },
  
  checkAuthStatus: function() {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Token varsa kullanıcı giriş yapmış demektir
      document.getElementById('loginBtn').classList.add('d-none');
      document.getElementById('logoutBtn').classList.remove('d-none');
      
      // Token'ın geçerliliğini kontrol et
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Token geçersiz');
        }
        return response.json();
      })
      .catch(error => {
        console.error('Token doğrulama hatası:', error);
        // Token geçersizse çıkış yap
        this.logout();
      });
    } else {
      document.getElementById('loginBtn').classList.remove('d-none');
      document.getElementById('logoutBtn').classList.add('d-none');
    }
    
    // Çıkış butonuna tıklanınca
    document.getElementById('logoutBtn').querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });
  },
  
  logout: function() {
    localStorage.removeItem('token');
    document.getElementById('loginBtn').classList.remove('d-none');
    document.getElementById('logoutBtn').classList.add('d-none');
    window.location.hash = '#/login';
  }
};

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', function() {
  app.init();
});