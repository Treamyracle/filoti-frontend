// Variabel global untuk menyimpan username admin (jika diperlukan untuk konteks notifikasi)
let currentAdminUsername = "Memuat Admin..."; 

document.addEventListener("DOMContentLoaded", function () {
    // Fungsi untuk mendapatkan ikon SVG yang sesuai berdasarkan tipe notifikasi
    function getNotificationIcon(type) {
        switch (type) {
            case "new_post":
                return `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`; // Icon untuk postingan baru (pena/kertas)
            case "claim":
                return `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`; // Icon untuk klaim/selesai (centang)
            case "update":
                return `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5m0 0h5m-5 0l-1 1m0 0a9 9 0 0112.729 0l3.582 3.582m-3.582-3.582A9 9 0 015.271 20H4l1.588-1.588m0 0a9 9 0 01-12.729 0l-3.582-3.582m3.582 3.582A9 9 0 0118.729 4H20l-1.588 1.588"></path></svg>`; // Icon untuk update/perubahan
            case "info":
            default: // Default icon jika tipe tidak cocok
                return `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`; // Icon informasi
        }
    }

    // Fungsi untuk membuat elemen notifikasi di DOM
    function createNotificationElement(notification) {
        const iconSVG = getNotificationIcon(notification.type); // Mengambil SVG ikon
        
        // Tentukan warna ikon berdasarkan is_read atau type
        const defaultColor = "bg-blue-500";
        let iconColor = notification.iconColor || defaultColor; // Ambil dari backend jika ada
        if (notification.is_read) {
            iconColor = "bg-gray-400"; // Ubah warna jika sudah dibaca
        }

        return `
            <div class="flex items-start space-x-4 p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                <div class="w-10 h-10 ${iconColor} rounded-full flex-shrink-0 flex items-center justify-center text-white">
                    ${iconSVG}
                </div>
                <div class="flex-1">
                    <p class="text-gray-800">${notification.message}</p> <p class="text-sm text-gray-500 mt-1">${notification.time}</p> </div>
            </div>
        `;
    }

    // Fungsi untuk mengambil notifikasi dari backend
    async function fetchAndDisplayNotifications() {
        const container = document.getElementById("notifications-container");
        if (!container) {
            console.error("NOTIFICATION_JS: Elemen HTML dengan ID 'notifications-container' tidak ditemukan.");
            return;
        }

        // Tampilkan pesan loading saat memulai fetch
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner mx-auto mb-4"></div>
                <p class="text-gray-500">Memuat notifikasi...</p>
            </div>
        `;

        try {
            // Panggil fetchAdminUsername jika Anda perlu user yang login untuk notifikasi spesifik
            // await fetchAdminUsername(); // Opsional, tergantung apakah notifikasi spesifik user

            const response = await fetch('https://filoti-backend.vercel.app/notifications', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                throw new Error(`Failed to load notifications: ${response.status} - ${errorText}`);
            }
            
            const notifications = await response.json(); // Data respons adalah array notifikasi

            container.innerHTML = ''; // Kosongkan container setelah data diambil

            if (Array.isArray(notifications) && notifications.length > 0) {
                notifications.forEach((notif) => {
                    container.innerHTML += createNotificationElement(notif);
                });
            } else {
                // Tampilkan pesan jika tidak ada notifikasi
                container.innerHTML = `
                    <div class="text-center py-16">
                        <p class="text-gray-500">Tidak ada notifikasi saat ini.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (container) {
                container.innerHTML = `<div class="text-center py-16"><p class="text-red-500">Gagal memuat notifikasi. Error: ${error.message}.</p></div>`;
            }
        }
    }

    // Panggil fungsi untuk mengambil dan menampilkan notifikasi saat DOM siap
    fetchAndDisplayNotifications();

    // Bagian NavbarLoader (tetap sama)
    if (typeof NavbarLoader !== 'undefined') {
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar.html", // Sesuaikan path ini
            onLoad: function () {
                if (typeof FilotiNavbar !== "undefined") {
                    new FilotiNavbar();
                } else {
                    console.warn("NOTIFICATION_JS: FilotiNavbar class not found. Navbar functionality might be limited.");
                }
                document.body.classList.add("navbar-loaded");
            },
            onError: function(error) {
                console.error('NOTIFICATION_JS: Gagal memuat navbar:', error);
                const navbarContainer = document.querySelector('#navbar-container');
                if (navbarContainer) {
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                }
            }
        });
        loader.loadNavbarSimple();
    } else {
        console.warn("NOTIFICATION_JS: NavbarLoader class not found. Navbar might not load.");
    }
});