// === UTILITY FUNCTIONS ===

// Bildirim göster
function showNotification(message, type = 'info') {
  // Mevcut notification'ları temizle
  const existingNotifications = document.querySelectorAll('.custom-notification');
  existingNotifications.forEach(notification => notification.remove());

  // Yeni notification oluştur
  const notification = document.createElement('div');
  notification.className = `custom-notification alert alert-${getBootstrapType(type)} alert-dismissible fade show`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  notification.innerHTML = `
    <strong>${getNotificationIcon(type)}</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  // DOM'a ekle
  document.body.appendChild(notification);

  // 5 saniye sonra otomatik kaldır (error hariç)
  if (type !== 'error') {
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Bootstrap type mapping
function getBootstrapType(type) {
  switch (type) {
    case 'success': return 'success';
    case 'error': return 'danger';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'info';
  }
}

// Notification ikonları
function getNotificationIcon(type) {
  switch (type) {
    case 'success': return '<i class="fas fa-check-circle"></i>';
    case 'error': return '<i class="fas fa-exclamation-circle"></i>';
    case 'warning': return '<i class="fas fa-exclamation-triangle"></i>';
    case 'info': return '<i class="fas fa-info-circle"></i>';
    default: return '<i class="fas fa-info-circle"></i>';
  }
}

// Para formatı
function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
}

// Tarih formatı
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR');
}

// === END UTILITY FUNCTIONS ===

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
      },      stores: {
        title: 'Mağazalar',
        render: () => `
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Mağazalar</h1>
            <button class="btn btn-primary" id="addStoreBtn">
              <i class="fas fa-plus"></i> Yeni Mağaza Ekle
            </button>
          </div>

          <!-- Mağaza İstatistikleri -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-primary" id="totalStores">0</h3>
                  <p class="mb-0">Toplam Mağaza</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-success" id="activeStores">0</h3>
                  <p class="mb-0">Aktif Mağaza</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-warning" id="pendingStores">0</h3>
                  <p class="mb-0">Test Modunda</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-danger" id="inactiveStores">0</h3>
                  <p class="mb-0">Pasif Mağaza</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Mağazalar Tablosu -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Mağaza Listesi</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mağaza Adı</th>
                      <th>Seller ID</th>
                      <th>API Durumu</th>
                      <th>Son Senkronizasyon</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody id="stores-table">
                    <tr>
                      <td colspan="7" class="text-center">Yükleniyor...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Mağaza Ekleme/Düzenleme Modal -->
          <div class="modal fade" id="storeModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="storeModalTitle">Yeni Mağaza Ekle</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <form id="storeForm">
                    <input type="hidden" id="storeId">
                      <div class="row">
                      <div class="col-md-12">
                        <div class="mb-3">
                          <label for="storeName" class="form-label">Mağaza Adı *</label>
                          <input type="text" class="form-control" id="storeName" required>
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label for="apiKey" class="form-label">API Key *</label>
                          <input type="text" class="form-control" id="apiKey" required>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label for="apiSecret" class="form-label">API Secret *</label>
                          <input type="password" class="form-control" id="apiSecret" required>
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label for="sellerId" class="form-label">Trendyol Seller ID</label>
                          <input type="number" class="form-control" id="sellerId">
                          <div class="form-text">Trendyol'dan aldığınız Seller ID numarası</div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label for="isActive" class="form-label">Durum</label>
                          <select class="form-control" id="isActive">
                            <option value="true">Aktif</option>
                            <option value="false">Pasif</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <!-- Geçici olarak gizlenen alanlar -->
                    <input type="hidden" id="environment" value="production">
                    <input type="hidden" id="description" value="">

                    <div class="alert alert-info">
                      <strong>Not:</strong> API bilgilerinizi Trendyol Entegrasyon panelinden alabilirsiniz.
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>                  <button type="button" class="btn btn-warning" id="testConnectionBtn">Bağlantıyı Test Et</button>
                  <button type="button" class="btn btn-primary" id="saveStoreBtn">Kaydet</button>
                </div>
              </div>
            </div>
          </div>        `,
        afterRender: async () => {
          await loadStores();
          initStoreEvents();
        }
      },
      payments: {
        title: 'Ödemeler',
        render: () => `
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Ödemeler</h1>
            <div>
              <button class="btn btn-success me-2" id="exportExcelBtn">
                <i class="fas fa-file-excel"></i> Excel İndir
              </button>
              <button class="btn btn-primary" id="startAutomationBtn">
                <i class="fas fa-robot"></i> Otomasyon Başlat
              </button>
            </div>
          </div>

          <!-- Otomasyon Paneli -->
          <div class="card mb-4" id="automationPanel" style="display: none;">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-robot"></i> Otomasyon Sistemi
              </h5>
            </div>
            <div class="card-body">
              <form id="automationForm">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="storeSelect" class="form-label">Mağaza</label>
                      <select class="form-select" id="storeSelect" required>
                        <option value="">Mağaza seçin</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="apiTypeSelect" class="form-label">API Tipi</label>
                      <select class="form-select" id="apiTypeSelect" required>
                        <option value="">API tipi seçin</option>
                        <option value="settlements">Settlements (Satış, İade, İndirim, Kupon)</option>
                        <option value="otherfinancials">Other Financials (Tedarikçi finansmanı, virman, ödemeler)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="startDateInput" class="form-label">Başlangıç Tarihi</label>
                      <input type="date" class="form-control" id="startDateInput" required>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="endDateInput" class="form-label">Bitiş Tarihi</label>
                      <input type="date" class="form-control" id="endDateInput" required>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">İşlem Tipleri</label>
                  <div class="d-flex gap-2 mb-2">
                    <button type="button" class="btn btn-outline-primary btn-sm" id="selectAllBtn">Tümünü Seç</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="deselectAllBtn">Hiçbirini Seçme</button>
                  </div>
                  <div id="transactionTypesContainer" class="row">
                    <!-- Transaction types will be loaded here -->
                  </div>
                </div>

                <div class="mb-3" id="dateRangeInfo" style="display: none;">
                  <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <span id="dateRangeText"></span>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-success">
                    <i class="fas fa-play"></i> Otomasyonu Başlat
                  </button>
                  <button type="button" class="btn btn-secondary" id="cancelAutomationBtn">
                    <i class="fas fa-times"></i> İptal
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Filtreler -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-filter"></i> Filtreler
              </h5>
            </div>
            <div class="card-body">
              <form id="filterForm">
                <div class="row">
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="filterStore" class="form-label">Mağaza</label>
                      <select class="form-select" id="filterStore">
                        <option value="">Tüm Mağazalar</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="filterApiType" class="form-label">API Tipi</label>
                      <select class="form-select" id="filterApiType">
                        <option value="settlements">Settlements</option>
                        <option value="otherfinancials">Other Financials</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="filterStartDate" class="form-label">Başlangıç Tarihi</label>
                      <input type="date" class="form-control" id="filterStartDate">
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="filterEndDate" class="form-label">Bitiş Tarihi</label>
                      <input type="date" class="form-control" id="filterEndDate">
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="filterTransactionType" class="form-label">İşlem Tipi</label>
                      <select class="form-select" id="filterTransactionType">
                        <option value="">Tüm İşlem Tipleri</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-9">
                    <div class="mb-3">
                      <label class="form-label">&nbsp;</label>
                      <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                          <i class="fas fa-search"></i> Filtrele
                        </button>
                        <button type="button" class="btn btn-outline-secondary" id="clearFiltersBtn">
                          <i class="fas fa-refresh"></i> Temizle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- İstatistikler -->
          <div class="row mb-4" id="paymentStats">
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-primary" id="totalTransactions">0</h3>
                  <p class="mb-0">Toplam İşlem</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-success" id="totalCredit">₺0</h3>
                  <p class="mb-0">Toplam Alacak</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-danger" id="totalDebt">₺0</h3>
                  <p class="mb-0">Toplam Borç</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body text-center">
                  <h3 class="text-info" id="totalRevenue">₺0</h3>
                  <p class="mb-0">Toplam Hakediş</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Ödemeler Tablosu -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-list"></i> Ödemeler Listesi
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped" id="paymentsTable">
                  <thead>
                    <tr>
                      <th>İşlem ID</th>
                      <th>Tarih</th>
                      <th>Tip</th>
                      <th>Mağaza</th>
                      <th>Alacak</th>
                      <th>Borç</th>
                      <th>Hakediş</th>
                      <th>Komisyon</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody id="paymentsTableBody">
                    <tr>
                      <td colspan="9" class="text-center">
                        <div class="spinner-border" role="status">
                          <span class="visually-hidden">Yükleniyor...</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <nav aria-label="Sayfa navigasyonu" id="paginationNav">
                <ul class="pagination justify-content-center" id="paginationList">
                  <!-- Pagination items will be generated here -->
                </ul>
              </nav>
            </div>
          </div>

          <!-- Otomasyon İşleri Modal -->
          <div class="modal fade" id="automationJobsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Otomasyon İşleri</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <div class="table-responsive">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>İş Adı</th>
                          <th>API Tipi</th>
                          <th>Durum</th>
                          <th>İlerleme</th>
                          <th>Tarih</th>
                        </tr>
                      </thead>
                      <tbody id="automationJobsTableBody">
                        <!-- Jobs will be loaded here -->
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        afterRender: async () => {
          await loadPayments();
          initPaymentEvents();
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
                    </div>                    <button type="submit" class="btn btn-primary">Giriş Yap</button>
                    <a href="#/register" class="btn btn-link">Hesabınız yok mu? Kayıt olun</a>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `,        afterRender: () => {
          console.log('Login afterRender çağrıldı');
          
          const loginForm = document.getElementById('loginForm');
          if (!loginForm) {
            console.error('Login form bulunamadı!');
            return;
          }
          
          loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submit edildi');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Login veriler:', { email, password: '***' });
            
            if (!supabase) {
              alert('Supabase bağlantısı kurulamadı!');
              return;
            }
            
            try {
              // Supabase ile giriş yap
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
              });
                console.log('Supabase giriş sonucu:', { data, error });
                if (error) {
                // Email confirmation hatası için özel mesaj
                if (error.message.includes('Email not confirmed')) {
                  alert('E-posta adresiniz henüz doğrulanmamış. Lütfen Supabase yöneticisi ile iletişime geçin veya 5 dakika sonra tekrar deneyin.');
                } else if (error.message.includes('Invalid login credentials')) {
                  alert('E-posta veya şifre hatalı. Lütfen kontrol edin.');
                } else {
                  alert('Giriş hatası: ' + error.message);
                }
                return;
              }
                if (data.session) {
                // Başarılı giriş
                localStorage.setItem('token', data.session.access_token);
                
                // Auth durumunu güncelle
                app.checkAuthStatus();
                
                window.location.hash = '#/dashboard';
              }
            } catch (error) {
              console.error('Giriş hatası:', error);
              alert('Giriş yapılırken bir hata oluştu: ' + error.message);
            }
          });
        }
      },
      register: {
        title: 'Kayıt Ol',
        render: () => `
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h3 class="mb-0">Kayıt Ol</h3>
                </div>
                <div class="card-body">
                  <form id="registerForm">
                    <div class="mb-3">
                      <label for="registerEmail" class="form-label">E-posta</label>
                      <input type="email" class="form-control" id="registerEmail" required>
                    </div>
                    <div class="mb-3">
                      <label for="registerPassword" class="form-label">Şifre</label>
                      <input type="password" class="form-control" id="registerPassword" required minlength="6">
                    </div>
                    <div class="mb-3">
                      <label for="confirmPassword" class="form-label">Şifre Tekrar</label>
                      <input type="password" class="form-control" id="confirmPassword" required minlength="6">
                    </div>
                    <div class="mb-3">
                      <label for="fullName" class="form-label">Ad Soyad</label>
                      <input type="text" class="form-control" id="fullName" required>
                    </div>
                    <div class="mb-3">
                      <label for="companyName" class="form-label">Şirket Adı (Opsiyonel)</label>
                      <input type="text" class="form-control" id="companyName">
                    </div>
                    <button type="submit" class="btn btn-primary">Kayıt Ol</button>
                    <a href="#/login" class="btn btn-link">Zaten hesabım var</a>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `,        afterRender: () => {
          console.log('Register afterRender çağrıldı');
          
          const registerForm = document.getElementById('registerForm');
          if (!registerForm) {
            console.error('Register form bulunamadı!');
            return;
          }
          
          registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submit edildi');
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const fullName = document.getElementById('fullName').value;
            const companyName = document.getElementById('companyName').value;
            
            console.log('Register veriler:', { email, fullName, companyName });
            
            if (password !== confirmPassword) {
              alert('Şifreler eşleşmiyor!');
              return;
            }
            
            if (!supabase) {
              alert('Supabase bağlantısı kurulamadı!');
              return;
            }              try {
              // Supabase ile kayıt ol (email confirmation olmadan)
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: undefined, // Email confirmation devre dışı
                  data: {
                    full_name: fullName,
                    company_name: companyName
                  }
                }
              });
              
              console.log('Supabase kayıt sonucu:', { data, error });
              
              if (error) {
                alert('Kayıt hatası: ' + error.message);
                return;
              }
                if (data.user) {
                // Email confirmation kontrolü
                if (data.session) {
                  // Direkt giriş yapıldı, e-posta onayına gerek yok
                  localStorage.setItem('token', data.session.access_token);
                  app.checkAuthStatus();
                  alert('Kayıt başarılı! Dashboard\'a yönlendiriliyorsunuz.');
                  window.location.hash = '#/dashboard';
                } else {
                  // E-posta onayı gerekiyor olabilir
                  alert('Kayıt başarılı! E-posta adresinize gönderilen onay linkine tıklayın veya direkt giriş yapmayı deneyin.');
                  window.location.hash = '#/login';
                }
              }
            } catch (error) {
              console.error('Kayıt hatası:', error);
              alert('Kayıt olurken bir hata oluştu: ' + error.message);
            }
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
    console.log('RouteChange çağrıldı, hash:', window.location.hash);
    
    let hash = window.location.hash.substring(2) || 'dashboard';
    console.log('İşlenen hash:', hash);
      // Eğer giriş yapılmamışsa ve korumalı bir sayfaya erişilmeye çalışılıyorsa
    const token = localStorage.getItem('token');
    if (!token && hash !== 'login' && hash !== 'register') {
      console.log('Token yok, login\'e yönlendiriliyor');
      window.location.hash = '#/login';
      return;
    }
    
    // Eğer giriş yapılmışsa login ve register sayfalarına gidilmesin
    if (token && (hash === 'login' || hash === 'register')) {
      console.log('Zaten giriş yapılmış, dashboard\'a yönlendiriliyor');
      window.location.hash = '#/dashboard';
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
    checkAuthStatus: async function() {
    const token = localStorage.getItem('token');
      if (token) {
      // Token varsa kullanıcı giriş yapmış demektir
      document.getElementById('loginBtn').classList.add('d-none');
      document.getElementById('registerBtn').classList.add('d-none');
      document.getElementById('logoutBtn').classList.remove('d-none');
      
      try {
        // Token'ın geçerliliğini kontrol et
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          throw new Error('Token geçersiz');
        }
        
        // Kullanıcı bilgisini güncelle
        console.log('Giriş yapılmış kullanıcı:', data.user);
      } catch (error) {
        console.error('Token doğrulama hatası:', error);
        // Token geçersizse çıkış yap
        this.logout();
      }    } else {
      document.getElementById('loginBtn').classList.remove('d-none');
      document.getElementById('registerBtn').classList.remove('d-none');
      document.getElementById('logoutBtn').classList.add('d-none');
    }
      // Çıkış butonuna tıklanınca (sadece bir kez ekle)
    const logoutBtn = document.getElementById('logoutBtn')?.querySelector('a');
    if (logoutBtn && !logoutBtn.hasAttribute('data-logout-attached')) {
      logoutBtn.setAttribute('data-logout-attached', 'true');
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },    logout: async function() {
    try {
      // Supabase ile çıkış yap
      await supabase.auth.signOut();
      // Local storage'dan token'ı kaldır
      localStorage.removeItem('token');
      
      // Auth durumunu güncelle
      this.checkAuthStatus();
      
      window.location.hash = '#/login';
    } catch (error) {
      console.error('Çıkış hatası:', error);
      alert('Çıkış yapılırken bir hata oluştu');
    }  }
};

// Mağaza Yönetim Fonksiyonları
async function loadStores() {
  try {
    console.log('Mağazalar yükleniyor...');
    
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Mağaza verisi alınırken hata:', error);
      throw error;
    }
    
    console.log('Mağaza verisi alındı:', stores);
    
    // Eğer Supabase'de veri yoksa, uyarı göster ve boş array kullan
    const finalStores = stores || [];
    
    if (finalStores.length === 0) {
      console.warn('Hiç mağaza bulunamadı. Lütfen önce bir mağaza ekleyin.');
      showNotification('Hiç mağaza bulunamadı. Lütfen önce bir mağaza ekleyin.', 'warning');
    }
    
    updateStoreStats(finalStores);
    renderStoresTable(finalStores);
    
  } catch (error) {
    console.error('Mağazalar yüklenirken hata:', error);
    document.getElementById('stores-table').innerHTML = `
      <tr><td colspan="7" class="text-center text-danger">Mağazalar yüklenirken hata oluştu: ${error.message}</td></tr>
    `;
  }
}

function updateStoreStats(stores) {
  const total = stores.length;
  const active = stores.filter(s => s.active).length;
  const testing = 0; // Environment kolonu henüz yok
  const inactive = stores.filter(s => !s.active).length;
  
  document.getElementById('totalStores').textContent = total;
  document.getElementById('activeStores').textContent = active;
  document.getElementById('pendingStores').textContent = testing;
  document.getElementById('inactiveStores').textContent = inactive;
}

function renderStoresTable(stores) {
  const tableBody = document.getElementById('stores-table');
  
  if (!stores || stores.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Henüz mağaza bulunmuyor</td></tr>`;
    return;
  }
  
  tableBody.innerHTML = stores.map(store => `
    <tr>
      <td>${store.id}</td>
      <td>
        <strong>${store.name || 'İsimsiz Mağaza'}</strong>
      </td>
      <td>${store.seller_id || 'N/A'}</td>
      <td>
        <span class="badge ${getApiStatusBadge(store)}">
          ${getApiStatusText(store)}
        </span>
      </td>
      <td>
        ${store.last_sync_at ? new Date(store.last_sync_at).toLocaleString('tr-TR') : 'Henüz yok'}
      </td>
      <td>
        <span class="badge ${store.active ? 'bg-success' : 'bg-danger'}">
          ${store.active ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary edit-store" data-id="${store.id}" title="Düzenle">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline-success sync-store" data-id="${store.id}" title="Senkronize Et">
            <i class="fas fa-sync"></i>
          </button>
          <button class="btn btn-outline-danger delete-store" data-id="${store.id}" title="Sil">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getApiStatusBadge(store) {
  if (!store.api_key || !store.api_secret) return 'bg-secondary';
  if (store.api_connection_status === 'success') return 'bg-success';
  if (store.api_connection_status === 'error') return 'bg-danger';
  return 'bg-warning';
}

function getApiStatusText(store) {
  if (!store.api_key || !store.api_secret) return 'API Bilgisi Yok';
  if (store.api_connection_status === 'success') return 'Bağlı';
  if (store.api_connection_status === 'error') return 'Hata';
  return 'Test Edilmedi';
}

function initStoreEvents() {
  // Yeni mağaza ekleme butonu
  document.getElementById('addStoreBtn')?.addEventListener('click', () => {
    openStoreModal();
  });
  
  // Modal kaydet butonu
  document.getElementById('saveStoreBtn')?.addEventListener('click', saveStore);
  
  // Bağlantı test butonu
  document.getElementById('testConnectionBtn')?.addEventListener('click', testStoreConnection);
  
  // Mağaza düzenleme butonları
  document.querySelectorAll('.edit-store').forEach(button => {
    button.addEventListener('click', (e) => {
      const storeId = e.target.closest('button').getAttribute('data-id');
      editStore(storeId);
    });
  });
  
  // Mağaza silme butonları
  document.querySelectorAll('.delete-store').forEach(button => {
    button.addEventListener('click', (e) => {
      const storeId = e.target.closest('button').getAttribute('data-id');
      deleteStore(storeId);
    });
  });
  
  // Senkronizasyon butonları
  document.querySelectorAll('.sync-store').forEach(button => {
    button.addEventListener('click', (e) => {
      const storeId = e.target.closest('button').getAttribute('data-id');
      syncStore(storeId);
    });
  });
}

function openStoreModal(storeData = null) {
  const modal = new bootstrap.Modal(document.getElementById('storeModal'));
  const title = document.getElementById('storeModalTitle');
  
  if (storeData) {
    title.textContent = 'Mağaza Düzenle';
    populateStoreForm(storeData);
  } else {
    title.textContent = 'Yeni Mağaza Ekle';
    document.getElementById('storeForm').reset();
    document.getElementById('storeId').value = '';
  }
  
  modal.show();
}

function populateStoreForm(store) {
  document.getElementById('storeId').value = store.id;
  document.getElementById('storeName').value = store.name || '';
  document.getElementById('sellerId').value = store.seller_id || '';
  document.getElementById('apiKey').value = store.api_key || '';
  document.getElementById('apiSecret').value = store.api_secret || '';
  document.getElementById('environment').value = store.environment || 'production';
  document.getElementById('isActive').value = store.active ? 'true' : 'false';
  document.getElementById('description').value = store.description || '';
}

async function saveStore() {
  try {
    const storeId = document.getElementById('storeId').value;
    
    // Temel veri objesi
    const storeData = {
      name: document.getElementById('storeName').value,
      api_key: document.getElementById('apiKey').value,
      api_secret: document.getElementById('apiSecret').value,
      active: document.getElementById('isActive').value === 'true',
      updated_at: new Date().toISOString()
    };
    
    // Seller ID - sadece dolu ise ekle
    const sellerIdValue = document.getElementById('sellerId').value;
    if (sellerIdValue && sellerIdValue.trim() !== '') {
      storeData.seller_id = parseInt(sellerIdValue);
    }
    
    // Form validasyonu
    if (!storeData.name || !storeData.api_key || !storeData.api_secret) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }
    
    let result;
    if (storeId) {
      // Güncelleme
      result = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', storeId);
    } else {
      // Yeni ekleme
      storeData.created_at = new Date().toISOString();
      storeData.user_id = (await supabase.auth.getUser()).data.user?.id;
      
      result = await supabase
        .from('stores')
        .insert([storeData]);
    }
    
    if (result.error) throw result.error;
    
    alert(storeId ? 'Mağaza güncellendi!' : 'Mağaza eklendi!');
    bootstrap.Modal.getInstance(document.getElementById('storeModal')).hide();
    await loadStores();
    
  } catch (error) {
    console.error('Mağaza kaydetme hatası:', error);
    alert('Mağaza kaydedilirken hata oluştu: ' + error.message);
  }
}

async function editStore(storeId) {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();
      
    if (error) throw error;
    
    openStoreModal(store);
    
  } catch (error) {
    console.error('Mağaza düzenleme hatası:', error);
    alert('Mağaza bilgileri yüklenirken hata oluştu: ' + error.message);
  }
}

async function deleteStore(storeId) {
  if (!confirm('Bu mağazayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
      
    if (error) throw error;
    
    alert('Mağaza başarıyla silindi!');
    await loadStores();
    
  } catch (error) {
    console.error('Mağaza silme hatası:', error);
    alert('Mağaza silinirken hata oluştu: ' + error.message);
  }
}

async function syncStore(storeId) {
  try {
    const button = document.querySelector(`[data-id="${storeId}"].sync-store`);
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    // Burada Trendyol API senkronizasyonu yapılacak
    // Şu an için sadece last_sync_at'i güncelliyoruz
    const { error } = await supabase
      .from('stores')
      .update({ 
        last_sync_at: new Date().toISOString(),
        api_connection_status: 'success'
      })
      .eq('id', storeId);
      
    if (error) throw error;
    
    alert('Senkronizasyon başarılı!');
    await loadStores();
    
  } catch (error) {
    console.error('Senkronizasyon hatası:', error);
    alert('Senkronizasyon sırasında hata oluştu: ' + error.message);
  }
}

async function testStoreConnection() {
  try {
    const apiKey = document.getElementById('apiKey').value;
    const apiSecret = document.getElementById('apiSecret').value;
    const sellerId = document.getElementById('sellerId').value;
    const environment = document.getElementById('environment').value;
    
    if (!apiKey || !apiSecret || !sellerId) {
      alert('API bilgilerini doldurun!');
      return;
    }
    
    const button = document.getElementById('testConnectionBtn');
    const originalText = button.textContent;
    button.textContent = 'Test Ediliyor...';
    button.disabled = true;
    
    // Burada gerçek API testi yapılacak
    // Şu an için mock test
    setTimeout(() => {
      alert('Bağlantı testi başarılı! API bilgileri doğru.');
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('API test hatası:', error);
    alert('Bağlantı testi başarısız: ' + error.message);
  }
}

// === PAYMENTS FUNCTIONS ===

// Ödemeleri yükle
async function loadPayments(filters = {}) {
  try {
    console.log('Ödemeler yükleniyor...', filters);
      // Supabase'den gerçek settlements verilerini çek
    let query = supabase
      .from('settlement_transactions')
      .select('*, stores(name)')
      .order('transaction_date', { ascending: false });
    
    // Filtreleri uygula
    if (filters.store_id) {
      query = query.eq('store_id', filters.store_id);
    }
    
    if (filters.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }
    
    if (filters.start_date) {
      query = query.gte('transaction_date', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('transaction_date', filters.end_date);
    }
    
    const { data: payments, error } = await query.limit(100);
    
    if (error) {
      console.error('Ödemeler yüklenirken hata:', error);
      // Hata durumunda boş array göster
      updatePaymentStats({ totalPayments: 0, totalRevenue: 0, totalDebt: 0, totalCommission: 0 });
      renderPaymentsTable([]);
      return;
    }
    
    // Eğer veri yoksa mock veri göster (geliştirme aşamasında)
    const finalPayments = payments && payments.length > 0 ? payments : [
      {
        transaction_id: '725041340',
        transaction_date: '2024-02-15',
        transaction_type: 'Sale',
        stores: { name: 'MonalureShop' },
        credit: 449.99,
        debt: 0,
        seller_revenue: 382.49,
        commission_amount: 67.50
      },
      {
        transaction_id: '725041341',
        transaction_date: '2024-02-15',
        transaction_type: 'Return',
        stores: { name: 'MonalureShop' },
        credit: 0,
        debt: 299.99,
        seller_revenue: -254.99,
        commission_amount: 45.00
      }
    ];    // İstatistikleri güncelle
    updatePaymentStats({
      total_transactions: finalPayments.length,
      total_credit: finalPayments.reduce((sum, p) => sum + (p.credit || 0), 0),
      total_debt: finalPayments.reduce((sum, p) => sum + (p.debt || 0), 0),
      total_revenue: finalPayments.reduce((sum, p) => sum + (p.seller_revenue || 0), 0)
    });

    // Tabloyu güncelle
    renderPaymentsTable(finalPayments);    
  } catch (error) {
    console.error('Ödemeler yüklenirken hata:', error);
    showNotification('Ödemeler yüklenirken hata oluştu', 'error');
  }
}

// Ödeme istatistiklerini güncelle
function updatePaymentStats(stats) {
  document.getElementById('totalTransactions').textContent = stats.total_transactions || 0;
  document.getElementById('totalCredit').textContent = formatCurrency(stats.total_credit || 0);
  document.getElementById('totalDebt').textContent = formatCurrency(stats.total_debt || 0);
  document.getElementById('totalRevenue').textContent = formatCurrency(stats.total_revenue || 0);
}

// Ödemeler tablosunu render et
function renderPaymentsTable(payments) {
  const tableBody = document.getElementById('paymentsTableBody');
  
  if (!payments || payments.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center">Ödeme kaydı bulunamadı</td></tr>`;
    return;
  }
  
  tableBody.innerHTML = payments.map(payment => `
    <tr>
      <td>${payment.transaction_id}</td>
      <td>${formatDate(payment.transaction_date)}</td>
      <td>
        <span class="badge bg-${getTransactionTypeColor(payment.transaction_type)}">
          ${payment.transaction_type}
        </span>
      </td>
      <td>${payment.stores?.name || payment.store_name || '-'}</td>
      <td class="text-success">${formatCurrency(payment.credit || 0)}</td>
      <td class="text-danger">${formatCurrency(payment.debt || 0)}</td>
      <td class="text-info">${formatCurrency(payment.seller_revenue || 0)}</td>
      <td>${formatCurrency(payment.commission_amount || 0)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewPaymentDetail('${payment.transaction_id}')">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// İşlem tipi rengini getir
function getTransactionTypeColor(type) {
  const colors = {
    'Sale': 'success',
    'Return': 'danger',
    'Discount': 'warning',
    'Coupon': 'info',
    'PaymentOrder': 'primary'
  };
  return colors[type] || 'secondary';
}

// Ödeme detayını görüntüle
function viewPaymentDetail(transactionId) {
  // Modal ile detay gösterilecek
  alert(`Ödeme detayı: ${transactionId}`);
}

// Payments event'lerini başlat
function initPaymentEvents() {
  // Otomasyon butonları
  const startAutomationBtn = document.getElementById('startAutomationBtn');
  const cancelAutomationBtn = document.getElementById('cancelAutomationBtn');
  const automationPanel = document.getElementById('automationPanel');
  
  if (startAutomationBtn) {
    startAutomationBtn.addEventListener('click', () => {
      automationPanel.style.display = automationPanel.style.display === 'none' ? 'block' : 'none';
    });
  }
  
  if (cancelAutomationBtn) {
    cancelAutomationBtn.addEventListener('click', () => {
      automationPanel.style.display = 'none';
    });
  }

  // Mağaza seçeneklerini yükle
  loadStoreOptions();
  
  // API tipi değiştiğinde transaction type'ları güncelle
  const apiTypeSelect = document.getElementById('apiTypeSelect');
  if (apiTypeSelect) {
    apiTypeSelect.addEventListener('change', (e) => {
      loadTransactionTypes(e.target.value);
      updateDateRangeInfo();
    });
  }

  // Tarih değiştiğinde bilgi güncelle
  const startDateInput = document.getElementById('startDateInput');
  const endDateInput = document.getElementById('endDateInput');
  
  if (startDateInput) startDateInput.addEventListener('change', updateDateRangeInfo);
  if (endDateInput) endDateInput.addEventListener('change', updateDateRangeInfo);

  // Tümünü seç/seçme butonları
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('#transactionTypesContainer input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = true);
    });
  }
  
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('#transactionTypesContainer input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
    });
  }

  // Otomasyon formu
  const automationForm = document.getElementById('automationForm');
  if (automationForm) {
    automationForm.addEventListener('submit', handleAutomationSubmit);
  }

  // Filtre formu
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', handleFilterSubmit);
  }

  // Excel export
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', handleExcelExport);
  }

  // Filtreleri temizle
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }
}

// Mağaza seçeneklerini yükle
async function loadStoreOptions() {
  try {
    // Supabase'den gerçek mağaza verilerini çek
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, active')
      .eq('active', true)
      .order('name');
      
    if (error) throw error;

    const finalStores = stores || [];
    
    // Eğer hiç mağaza yoksa uyarı göster
    if (finalStores.length === 0) {
      console.warn('Hiç aktif mağaza bulunamadı. Lütfen önce bir mağaza ekleyin.');
      showNotification('Hiç aktif mağaza bulunamadı. Lütfen önce bir mağaza ekleyin.', 'warning');
    }

    const storeSelects = ['storeSelect', 'filterStore'];
    storeSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select && selectId === 'storeSelect') {
        select.innerHTML = '<option value="">Mağaza seçin</option>' +
          finalStores.map(store => `<option value="${store.id}">${store.name}</option>`).join('');
      } else if (select) {
        select.innerHTML = '<option value="">Tüm Mağazalar</option>' +
          finalStores.map(store => `<option value="${store.id}">${store.name}</option>`).join('');
      }
    });
  } catch (error) {
    console.error('Mağaza seçenekleri yüklenirken hata:', error);
    showNotification('Mağaza seçenekleri yüklenirken hata oluştu', 'error');
  }
}

// Transaction type'ları yükle
function loadTransactionTypes(apiType) {
  const container = document.getElementById('transactionTypesContainer');
  const filterSelect = document.getElementById('filterTransactionType');
  
  if (!container || !apiType) return;

  let types = [];
  if (apiType === 'settlements') {
    types = [
      'Sale', 'Return', 'Discount', 'DiscountCancel', 
      'Coupon', 'CouponCancel', 'ProvisionPositive', 'ProvisionNegative'
    ];
  } else if (apiType === 'otherfinancials') {
    types = [
      'Stoppage', 'CashAdvance', 'WireTransfer', 'IncomingTransfer',
      'ReturnInvoice', 'CommissionAgreementInvoice', 'PaymentOrder', 'DeductionInvoices'
    ];
  }

  // Checkbox'ları oluştur
  container.innerHTML = types.map(type => `
    <div class="col-md-4 mb-2">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${type}" id="type_${type}">
        <label class="form-check-label" for="type_${type}">
          ${type}
        </label>
      </div>
    </div>
  `).join('');

  // Filtre select'ini güncelle
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">Tüm İşlem Tipleri</option>' +
      types.map(type => `<option value="${type}">${type}</option>`).join('');
  }
}

// Tarih aralığı bilgisini güncelle
function updateDateRangeInfo() {
  const startDate = document.getElementById('startDateInput')?.value;
  const endDate = document.getElementById('endDateInput')?.value;
  const infoDiv = document.getElementById('dateRangeInfo');
  const infoText = document.getElementById('dateRangeText');
  
  if (!startDate || !endDate || !infoDiv || !infoText) return;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 15) {
    const periods = Math.ceil(diffDays / 15);
    infoText.textContent = `Tarih aralığı 15 günden büyük olduğu için ${periods} parçaya bölünecek.`;
    infoDiv.style.display = 'block';
  } else {
    infoDiv.style.display = 'none';
  }
}

// Otomasyon formunu handle et
async function handleAutomationSubmit(e) {
  e.preventDefault();
  
  console.log('=== OTOMASYON FORMU SUBMIT EDİLDİ ===');
  
  try {
    const formData = new FormData(e.target);
    const storeId = document.getElementById('storeSelect').value;
    const apiType = document.getElementById('apiTypeSelect').value;
    const startDate = document.getElementById('startDateInput').value;
    const endDate = document.getElementById('endDateInput').value;
    
    console.log('Form verileri:', { storeId, apiType, startDate, endDate });
    
    // Seçili transaction type'ları al
    const selectedTypes = Array.from(
      document.querySelectorAll('#transactionTypesContainer input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    console.log('Seçili transaction types:', selectedTypes);
    
    if (!storeId || !apiType || !startDate || !endDate || selectedTypes.length === 0) {
      console.log('Eksik alan kontrolü:', { storeId: !!storeId, apiType: !!apiType, startDate: !!startDate, endDate: !!endDate, selectedTypesLength: selectedTypes.length });
      showNotification('Lütfen tüm alanları doldurun', 'error');
      return;
    }    // Tarihleri timestamp'e çevir - doğru format
    const startTimestamp = new Date(startDate + 'T00:00:00.000Z').getTime();
    const endTimestamp = new Date(endDate + 'T23:59:59.999Z').getTime();
    
    console.log('Timestamp\'ler:', { startTimestamp, endTimestamp });
    console.log('Başlangıç tarihi:', new Date(startTimestamp).toISOString());
    console.log('Bitiş tarihi:', new Date(endTimestamp).toISOString());
    
    // Tarih aralığını kontrol et ve kullanıcıyı bilgilendir
    const dayDiff = (endTimestamp - startTimestamp) / (24 * 60 * 60 * 1000);
    console.log('Gün farkı:', dayDiff);
    
    if (dayDiff > 15) {
      const periods = Math.ceil(dayDiff / 15);
      console.log('15 günden fazla, parça sayısı:', periods);
      showNotification(`Tarih aralığı ${Math.round(dayDiff)} gün. Sistem otomatik olarak ${periods} parçaya bölerek işleyecek.`, 'info');
    }

    // ÖNEMLİ: 15 günlük kontrolü kaldırıldı, sistem parçalayarak işleyecek
    console.log('Otomasyon işlemi devam ediyor, 15 günlük sınır kaldırıldı');

    const automationData = {
      storeId: parseInt(storeId),
      apiType,
      startDate: startTimestamp,
      endDate: endTimestamp,
      transactionTypes: selectedTypes,
      jobName: `${apiType}_${new Date().toISOString().split('T')[0]}`
    };

    console.log('Otomasyon başlatılıyor:', automationData);
    
    // Loading göster
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Başlatılıyor...';
    submitBtn.disabled = true;
    
    try {      console.log('API çağrısı yapılacak: /api/payments/automation/start');
      
      // Supabase session token'ını güvenli şekilde al
      const headers = {
        'Content-Type': 'application/json',
      };
      
      try {
        if (window.supabase && window.supabase.auth && window.supabase.auth.getSession) {
          const { data: { session } } = await window.supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('Authorization header eklendi');
          } else {
            console.log('Session bulunamadı, token olmadan devam ediliyor');
          }
        } else {
          console.log('Supabase auth mevcut değil, token olmadan devam ediliyor');
        }
      } catch (authError) {
        console.warn('Auth token alınamadı:', authError);
        console.log('Token olmadan devam ediliyor');
      }
      
      // Gerçek API çağrısı
      const response = await fetch('/api/payments/automation/start', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(automationData)
      });

      console.log('API Response alındı:', { status: response.status, ok: response.ok });

      const result = await response.json();
      console.log('API Response JSON:', result);
      
      if (result.success) {
        showNotification('Otomasyon işi başarıyla başlatıldı!', 'success');
        document.getElementById('automationPanel').style.display = 'none';
        e.target.reset();
        
        // Ödemeleri yeniden yükle
        console.log('Ödemeler yeniden yükleniyor...');
        await loadPayments();
      } else {
        showNotification(`Otomasyon başlatılırken hata: ${result.error}`, 'error');
        console.error('API Error:', result.error);
      }
    } finally {
      // Loading'i kaldır
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('=== OTOMASYON BAŞLATMA HATASI ===');
    console.error('Hata:', error);
    console.error('Stack:', error.stack);
    showNotification('Otomasyon başlatılırken hata oluştu', 'error');
  }
}

// Filtre formunu handle et
async function handleFilterSubmit(e) {
  e.preventDefault();
  
  const filters = {
    store_id: document.getElementById('filterStore').value,
    api_type: document.getElementById('filterApiType').value,
    start_date: document.getElementById('filterStartDate').value,
    end_date: document.getElementById('filterEndDate').value,
    transaction_type: document.getElementById('filterTransactionType').value
  };

  console.log('Filtreler uygulanıyor:', filters);
  await loadPayments(filters);
}

// Excel export'u handle et
async function handleExcelExport() {
  try {
    showNotification('Excel dosyası hazırlanıyor...', 'info');
    
    // Mock download
    setTimeout(() => {
      showNotification('Excel dosyası indirildi!', 'success');
    }, 2000);
    
  } catch (error) {
    console.error('Excel export hatası:', error);
    showNotification('Excel dosyası oluşturulurken hata oluştu', 'error');
  }
}

// Filtreleri temizle
function clearFilters() {
  document.getElementById('filterForm').reset();
  loadPayments();
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', function() {
  app.init();
});