/**
 * FILOTI Navbar Loader
 * Script untuk memuat navbar component ke dalam halaman
 */

class NavbarLoader {
    constructor(options = {}) {
        this.navbarPath = options.navbarPath || '../components/navbar_admin.html'; // Ini akan diset secara dinamis
        this.targetSelector = options.targetSelector || '#navbar-container';
        this.onLoad = options.onLoad || null;
        this.onError = options.onError || null;
    }

    // Metode loadNavbar() dan loadNavbarSimple() tidak ada perubahan
    // Kita akan fokus menggunakan loadNavbarSimple()

    async loadNavbar() {
        // Metode ini tetap seperti yang Anda miliki, tanpa perubahan
        try {
            const response = await fetch(this.navbarPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load navbar: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const desktopNav = doc.querySelector('nav');
            const mobileHeader = doc.querySelector('header');
            const sidebarOverlay = doc.querySelector('#sidebar-overlay');
            const styles = doc.querySelector('style');
            
            const container = document.querySelector(this.targetSelector);
            if (!container) {
                throw new Error(`Target container '${this.targetSelector}' not found`);
            }

            if (styles && !document.querySelector('style[data-navbar-styles]')) {
                const styleElement = document.createElement('style');
                styleElement.setAttribute('data-navbar-styles', 'true');
                styleElement.textContent = styles.textContent;
                document.head.appendChild(styleElement);
            }

            container.innerHTML = '';
            if (desktopNav) container.appendChild(desktopNav.cloneNode(true));
            if (mobileHeader) container.appendChild(mobileHeader.cloneNode(true));
            if (sidebarOverlay) container.appendChild(sidebarOverlay.cloneNode(true));

            const script = doc.querySelector('script');
            if (script) {
                const scriptElement = document.createElement('script');
                scriptElement.textContent = script.textContent;
                document.body.appendChild(scriptElement);
            }

            if (this.onLoad && typeof this.onLoad === 'function') {
                this.onLoad();
            }

            console.log('Navbar loaded successfully');
            return true;

        } catch (error) {
            console.error('Error loading navbar:', error);
            
            if (this.onError && typeof this.onError === 'function') {
                this.onError(error);
            }
            
            return false;
        }
    }

    // Metode loadNavbarSimple() tetap seperti yang Anda miliki, tanpa perubahan
    async loadNavbarSimple() {
        try {
            const response = await fetch(this.navbarPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load navbar: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bodyContent = doc.body.innerHTML;
            
            const container = document.querySelector(this.targetSelector);
            if (!container) {
                throw new Error(`Target container '${this.targetSelector}' not found`);
            }

            container.innerHTML = bodyContent;

            const styles = doc.querySelector('style');
            if (styles && !document.querySelector('style[data-navbar-styles]')) {
                const styleElement = document.createElement('style');
                styleElement.setAttribute('data-navbar-styles', 'true');
                styleElement.textContent = styles.textContent;
                document.head.appendChild(styleElement);
            }

            const scripts = doc.querySelectorAll('script');
            scripts.forEach(script => {
                if (script.textContent.trim()) {
                    const scriptElement = document.createElement('script');
                    scriptElement.textContent = script.textContent;
                    document.body.appendChild(scriptElement);
                }
            });

            if (this.onLoad && typeof this.onLoad === 'function') {
                this.onLoad();
            }

            console.log('Navbar loaded successfully (simple method)');
            return true;

        } catch (error) {
            console.error('Error loading navbar:', error);
            
            if (this.onError && typeof this.onError === 'function') {
                this.onError(error);
            }
            
            return false;
        }
    }
}

// Auto-load navbar if container exists
document.addEventListener('DOMContentLoaded', function() {
    const navbarContainer = document.querySelector('#navbar-container');
    
    if (navbarContainer) {
        async function initDynamicNavbarLoad() {
            let navbarPath = '../components/navbar_guest.html'; // Default ke Guest Navbar

            try {
                const response = await fetch('https://filoti-backend.vercel.app/me', { // Panggil endpoint /me
                    method: 'GET',
                    credentials: 'include'
                });

                if (response.ok) {
                    const userData = await response.json();
                    if (userData && userData.is_admin) {
                        navbarPath = '../components/navbar_admin.html'; // Jika admin, ganti path ke Admin Navbar
                        console.log('User is Admin. Loading navbar_admin');
                    } else {
                        console.log('User is not Admin. Loading navbar_guest');
                    }
                } else {
                    console.warn(`Failed to fetch user status (${response.status}). Loading navbar_guest as fallback.`);
                    // Tetap gunakan guest navbar jika ada masalah autentikasi/response tidak OK
                }
            } catch (error) {
                console.error('Network error fetching user status. Loading navbar_guest as fallback:', error);
                // Tetap gunakan guest navbar jika ada error jaringan
            }

            const loader = new NavbarLoader({
                navbarPath: navbarPath, // Gunakan path yang sudah ditentukan secara dinamis
                onLoad: function() {
                    // Setelah navbar dimuat dan FilotiNavbar class di dalamnya dieksekusi,
                    // ini akan menandakan bahwa navbar telah selesai diinisialisasi.
                    document.body.classList.add('navbar-loaded');
                },
                onError: function(error) {
                    console.warn('Navbar could not be loaded:', error.message);
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                }
            });
            
            await loader.loadNavbarSimple(); // Pastikan loading selesai sebelum melanjutkan
        }
        
        initDynamicNavbarLoad(); // Panggil fungsi untuk memulai proses loading dinamis
    }
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavbarLoader;
} else if (typeof window !== 'undefined') {
    window.NavbarLoader = NavbarLoader;
}