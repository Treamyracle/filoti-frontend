// Variabel global untuk menyimpan username dan status admin
let currentUsername = "admin"; // Statis "admin" untuk tampilan kartu item
let currentIsAdmin = false; // Digunakan untuk menentukan apakah tombol "Edit" muncul
let allLostItems = []; // Variabel untuk menyimpan semua item yang hilang dari backend

document.addEventListener("DOMContentLoaded", function () {
    // Mendapatkan referensi ke elemen-elemen DOM yang dibutuhkan
    const filterBtn = document.getElementById('filter-location-btn');
    const dropdown = document.getElementById('location-dropdown');
    const filterLabel = document.getElementById('filter-label');
    const itemsContainerLost = document.getElementById('lost-items-container');
    const loadingMessage = document.getElementById('loading-message-lost');

    // Daftar lokasi unik yang di-hardcode
    const uniqueLocations = [
        "Gedung G", "Gedung F", "Gedung A", "Musholla", "GKM", "Kantin", "Junction", "Edutech", "Area Parkir"
    ];

    // Fungsi untuk membuat satu elemen item yang akan ditampilkan
    function createItemLost(item, isAdminUser) {
        let buttonHTML = '';
        let itemMainText = `<h3 class="font-semibold text-gray-800">${item.title}</h3>`; // Default: Hanya judul

        // Logika kondisional: Tampilan berbeda untuk admin vs. guest/non-admin
        if (isAdminUser) {
            // Admin: Tampilkan tombol "View Details" dan "Edit", serta judul + deskripsi lengkap
            buttonHTML = `
                <div class="flex items-center space-x-2">
                    <a href="details_item?id=${item.id}" class="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">View Details</a>
                    <a href="edit_item?id=${item.id}" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Edit</a>
                </div>
            `;
            itemMainText = `<h3 class="font-semibold text-gray-800">${item.title}</h3><p class="text-gray-600 text-sm mb-3">${item.keterangan}</p>`;
        } else {
            // Guest/Non-Admin: Tidak ada tombol "View Details" atau "Edit", hanya judul
            buttonHTML = ''; // Tombol kosong
            // itemMainText sudah diset ke judul di awal fungsi, tidak perlu diubah lagi
        }

        const defaultAvatarColor = "bg-gray-500";
        const usernameDisplay = "admin"; // Selalu tampilkan "admin" di kartu item

        return `
            <div class="bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                <div class="flex items-start space-x-3 flex-1">
                    <div class="w-10 h-10 ${defaultAvatarColor} rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-semibold text-sm"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <h3 class="font-semibold text-gray-800">${usernameDisplay}</h3> 
                            <span class="text-sm text-gray-500">• ${item.timeAgo}</span>
                            <span class="text-sm text-gray-500">• ${item.ruangan}</span>
                        </div>
                        ${itemMainText} 
                        ${buttonHTML}
                    </div>
                </div>
                <div class="w-48 lg:w-24 h-36 lg:h-16 flex-shrink-0 m-12">
                    <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover rounded-lg bg-gray-200" />
                </div>
            </div>`;
    }

    // Fungsi untuk mengambil detail user yang sedang login dari backend
    async function fetchCurrentUserDetails() {
        try {
            const response = await fetch('https://filoti-backend.vercel.app/me', {
                method: 'GET',
                credentials: 'include' 
            });

            if (response.ok) {
                const userData = await response.json();
                currentIsAdmin = userData.is_admin || false; 
                console.log(`User logged in: ${userData.username}, IsAdmin: ${currentIsAdmin}`);
            } else if (response.status === 401 || response.status === 403) {
                console.warn('User is not logged in or session expired. Displaying as Guest.');
                currentIsAdmin = false;
            } else {
                console.error(`Failed to fetch current user details with status: ${response.status}`);
                currentIsAdmin = false;
            }
        } catch (error) {
            console.error('Network error fetching current user details:', error);
            currentIsAdmin = false;
        }
    }

    // Fungsi untuk merender item ke DOM berdasarkan filter
    function renderItems(locationFilter = 'all') {
        itemsContainerLost.innerHTML = ''; // Kosongkan container

        const itemsToRender = locationFilter === 'all'
            ? allLostItems.filter(post => post.item_type === 'lost' && post.status === 1)
            : allLostItems.filter(post =>
                post.item_type === 'lost' && post.status === 1 &&
                post.ruangan.toLowerCase().includes(locationFilter.toLowerCase())
            );

        if (itemsToRender.length === 0) {
            itemsContainerLost.innerHTML = '<p class="text-center text-gray-500 py-10">Tidak ada item yang cocok dengan filter ini.</p>';
            return;
        }

        itemsToRender.forEach(post => {
            const item = {
                id: post.id,
                username: post.username, // Username ini tidak digunakan lagi di createItemLost
                timeAgo: new Date(post.created_at).toLocaleDateString("id-ID"),
                ruangan: post.ruangan,
                keterangan: post.keterangan,
                image_url: post.image_url,
                title: post.title,
            };
            // Lewatkan `currentIsAdmin` ke fungsi `createItemLost` untuk menentukan tampilan
            itemsContainerLost.innerHTML += createItemLost(item, currentIsAdmin);
        });
    }

    // Fungsi untuk mengisi dropdown filter dengan lokasi unik
    function populateLocationFilter() {
        if (!dropdown) { // Pastikan elemen dropdown ada sebelum mencoba mengisinya
            console.error("Dropdown element not found for populating locations.");
            return;
        }
        dropdown.innerHTML = ''; // Kosongkan dropdown

        // Tambahkan opsi "Tampilkan Semua Lokasi"
        const allOption = document.createElement('a');
        allOption.href = '#';
        allOption.className = 'block px-4 py-3 text-gray-700 hover:bg-blue-50 font-semibold';
        allOption.textContent = 'Tampilkan Semua Lokasi';
        allOption.dataset.location = 'all';
        dropdown.appendChild(allOption);

        // Isi dropdown dengan lokasi dari array hardcode
        uniqueLocations.forEach(locName => {
            const option = document.createElement('a');
            option.href = '#';
            option.className = 'block px-4 py-3 text-gray-700 hover:bg-blue-50';
            option.textContent = locName;
            option.dataset.location = locName;
            dropdown.appendChild(option);
        });
    }

    // Fungsi utama untuk mengambil data post dan filter
    async function fetchAndInitializeLostItems() {
        if (loadingMessage) loadingMessage.classList.remove('hidden');
        if (itemsContainerLost) itemsContainerLost.innerHTML = '';

        try {
            // Panggil fetchCurrentUserDetails dulu untuk mendapatkan status user (termasuk isAdmin)
            await fetchCurrentUserDetails(); 

            const response = await fetch('https://filoti-backend.vercel.app/posts', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                if (response.status !== 401 && response.status !== 403) { // Izinkan 401/403 untuk guest melihat daftar
                    throw new Error(`Failed to load items: ${response.status} - ${errorText}`);
                }
            }
            
            let data = [];
            if (response.status === 200) { // Hanya coba parse JSON jika status 200 OK
                data = await response.json();
            } else {
                console.warn(`Attempted to fetch posts, but got status ${response.status}. Displaying empty if no data.`);
            }

            if (!Array.isArray(data)) {
                console.error("Backend response for /posts is not an array:", data);
                throw new Error("Backend response is not an array. Please check API.");
            }

            allLostItems = data; // Simpan semua data post ke variabel global

            if (loadingMessage) loadingMessage.classList.add('hidden');
            
            populateLocationFilter(); // Isi dropdown filter dengan lokasi unik
            renderItems(); // Render item dengan status admin yang sudah diperbarui

        } catch (error) {
            console.error('Error fetching lost items:', error);
            if (itemsContainerLost) {
                itemsContainerLost.innerHTML = `<p class="text-red-500 text-center">Gagal memuat item hilang. Error: ${error.message}.</p>`;
            }
            if (loadingMessage) loadingMessage.classList.add('hidden');
        }
    }

    // Panggil fungsi utama saat DOM siap
    fetchAndInitializeLostItems();

    // --- Event Listeners untuk Dropdown Filter ---
    // Pasang ini setelah fetchAndInitializeLostItems() selesai
    // untuk memastikan elemen-elemen filter sudah ada di DOM.
    // Lakukan pengecekan elemen di sini sebelum memasang event listener
    if (filterBtn && dropdown && filterLabel) { // Pastikan semua elemen filter yang diperlukan ada
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah event dari mencapai window
            dropdown.classList.toggle('hidden'); // Toggle visibilitas dropdown
        });

        // Menutup dropdown saat klik di luar area dropdown
        window.addEventListener('click', (e) => {
            if (dropdown && !dropdown.classList.contains('hidden') && 
                !dropdown.contains(e.target) && e.target !== filterBtn && 
                !filterBtn.contains(e.target)) { // Tambahkan juga cek apakah yang diklik bukan tombol filter itu sendiri
                dropdown.classList.add('hidden');
            }
        });

        // Menangani klik pada opsi dropdown
        dropdown.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah perilaku default tautan
            const selectedLocation = e.target.dataset.location; // Dapatkan nilai lokasi dari data-location
            if (selectedLocation) {
                renderItems(selectedLocation); // Render item berdasarkan lokasi yang dipilih
                filterLabel.textContent = selectedLocation === 'all' ? 'Filter by Location' : selectedLocation; // Ubah teks tombol filter
                dropdown.classList.add('hidden'); // Sembunyikan dropdown setelah pilihan
            }
        });
        console.log("Filter event listeners attached."); // Log untuk debugging
    } else {
        console.warn("Filter buttons or dropdown not found during final setup. Filter functionality may be inactive.");
    }

    // --- Bagian NavbarLoader: Pastikan ini ada di akhir DOMContentLoaded ---
    // Ini adalah bagian yang mengontrol visibilitas `#navbar-container` di HTML utama.
    const navbarContainer = document.querySelector('#navbar-container'); 
    if (typeof NavbarLoader !== 'undefined' && navbarContainer) { 
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar_admin.html", // Default path yang diharapkan, akan diganti oleh initDynamicNavbarLoad di navbar_loader.js
            onLoad: function () {
                // Callback ini dipanggil setelah konten navbar disuntikkan ke #navbar-container
                if (navbarContainer) {
                    navbarContainer.classList.add('loaded'); // Tampilkan navbar dengan transisi fade-in
                }
            },
            onError: function (error) {
                // Jika gagal memuat navbar, tampilkan pesan error dan tetap tampilkan kontainer
                console.error('Gagal memuat navbar:', error);
                if (navbarContainer) {
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                    navbarContainer.classList.add('loaded');
                }
            }
        });
        // Panggil loader.loadNavbarSimple(). Ini akan memicu fetch ke /me di navbar_loader.js
        // untuk menentukan navbar_admin atau navbar_guest yang akan dimuat.
        loader.loadNavbarSimple(); 
    } else {
        console.log("NavbarLoader global mungkin sudah bekerja, atau #navbar-container tidak ditemukan.");
    }
}); // Penutup DOMContentLoaded