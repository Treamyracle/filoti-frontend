// Variabel global untuk menyimpan username dan status admin
let currentUsername = "Memuat User..."; // Default sementara saat memuat
let currentIsAdmin = false; // Default status admin, akan diisi dari backend
let allLostItems = []; // Variabel untuk menyimpan semua item yang hilang dari backend

document.addEventListener("DOMContentLoaded", function () {
    const filterBtn = document.getElementById('filter-location-btn');
    const dropdown = document.getElementById('location-dropdown');
    const filterLabel = document.getElementById('filter-label');
    const itemsContainerLost = document.getElementById('lost-items-container');
    const loadingMessage = document.getElementById('loading-message-lost');

    if (!filterBtn || !dropdown || !filterLabel || !itemsContainerLost || !loadingMessage) {
        console.error("LOST_ITEM_JS: Satu atau lebih elemen HTML penting untuk filter/kontainer tidak ditemukan.");
        if (itemsContainerLost) {
            itemsContainerLost.innerHTML = '<p class="text-red-500 text-center">Terjadi kesalahan saat memuat filter.</p>';
        }
        return;
    }

    const uniqueLocations = [
        "Gedung G", "Gedung F", "Gedung A", "Musholla", "GKM", "Kantin", "Junction", "Edutech", "Area Parkir"
    ];

    // Fungsi untuk membuat satu elemen item
    // Parameter `isAdminUser` ditambahkan untuk mengontrol tampilan tombol
    function createItemLost(item, isAdminUser) {
        let buttonHTML = `
            <div class="flex items-center space-x-2">
                <a href="details_item.html?id=${item.id}" class="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">View Details</a>
        `;

        // Logika kondisional: tampilkan tombol Edit hanya jika `isAdminUser` adalah true
        if (isAdminUser) {
            buttonHTML += `
                <a href="edit_item.html?id=${item.id}" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Edit</a>
            `;
        }
        buttonHTML += `</div>`; // Tutup div flex untuk tombol

        const defaultAvatarColor = "bg-gray-500";
        const usernameDisplay = currentUsername; // Gunakan variabel global `currentUsername`

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
                        <p class="text-gray-600 text-sm mb-3">${item.keterangan}</p>
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
                credentials: 'include' // Penting untuk mengirim cookie session
            });

            if (response.ok) {
                const userData = await response.json();
                currentUsername = userData.username || "Unknown User";
                currentIsAdmin = userData.is_admin || false; // Ambil status is_admin dari respons
                console.log(`User logged in: ${currentUsername}, IsAdmin: ${currentIsAdmin}`);
            } else if (response.status === 401 || response.status === 403) {
                // User tidak terautentikasi (mungkin belum login atau session kadaluarsa)
                console.warn('User is not logged in or session expired. Displaying as Guest.');
                currentUsername = "Guest";
                currentIsAdmin = false;
            } else {
                // Error lain dari backend
                console.error(`Failed to fetch current user details with status: ${response.status}`);
                currentUsername = "Guest (Error)";
                currentIsAdmin = false;
            }
        } catch (error) {
            // Kesalahan jaringan atau lainnya
            console.error('Network error fetching current user details:', error);
            currentUsername = "Guest (Network Error)";
            currentIsAdmin = false;
        }
    }

    // Fungsi untuk merender item ke DOM berdasarkan filter
    function renderItems(locationFilter = 'all') {
        itemsContainerLost.innerHTML = '';

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
                username: post.username, // Gunakan username dari post jika ada, atau bisa juga currentUsername
                timeAgo: new Date(post.created_at).toLocaleDateString("id-ID"),
                ruangan: post.ruangan,
                keterangan: post.keterangan,
                image_url: post.image_url,
                title: post.title,
            };
            // Lewatkan `currentIsAdmin` ke fungsi `createItemLost`
            itemsContainerLost.innerHTML += createItemLost(item, currentIsAdmin);
        });
    }

    // Fungsi untuk mengisi dropdown filter dengan lokasi unik
    function populateLocationFilter() {
        dropdown.innerHTML = '';

        const allOption = document.createElement('a');
        allOption.href = '#';
        allOption.className = 'block px-4 py-3 text-gray-700 hover:bg-blue-50 font-semibold';
        allOption.textContent = 'Tampilkan Semua Lokasi';
        allOption.dataset.location = 'all';
        dropdown.appendChild(allOption);

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
        loadingMessage.classList.remove('hidden');
        itemsContainerLost.innerHTML = '';

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
                // Hanya melempar error jika bukan 401/403, karena guest boleh melihat daftar
                if (response.status !== 401 && response.status !== 403) {
                    throw new Error(`Failed to load items: ${response.status} - ${errorText}`);
                }
            }
            
            let data = [];
            if (response.status === 200) { // Hanya coba parse JSON jika status 200 OK
                data = await response.json();
            } else {
                console.warn(`Attempted to fetch posts, but got status ${response.status}. Displaying empty if no data.`)
            }

            if (!Array.isArray(data)) {
                console.error("Backend response for /posts is not an array:", data);
                throw new Error("Backend response is not an array. Please check API.");
            }

            allLostItems = data;

            loadingMessage.classList.add('hidden');
            
            populateLocationFilter();
            renderItems(); // Render item dengan status admin yang sudah diperbarui

        } catch (error) {
            console.error('Error fetching lost items:', error);
            if (itemsContainerLost) {
                itemsContainerLost.innerHTML = `<p class="text-red-500 text-center">Gagal memuat item hilang. Error: ${error.message}.</p>`;
            }
            loadingMessage.classList.add('hidden');
        }
    }

    fetchAndInitializeLostItems();

    if (typeof NavbarLoader !== 'undefined') {
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar.html",
            onLoad: function () {
                if (typeof FilotiNavbar !== "undefined") {
                    new FilotiNavbar();
                }
                document.body.classList.add("navbar-loaded");
            },
            onError: function (error) {
                console.error('Gagal memuat navbar:', error);
                const navbarContainer = document.querySelector('#navbar-container');
                if (navbarContainer) {
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                }
            }
        });
        loader.loadNavbarSimple();
    }
});