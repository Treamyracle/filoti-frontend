// Variabel global untuk menyimpan username dan status admin
let currentUsername = "admin"; // <-- Diubah menjadi statis "admin"
let currentIsAdmin = false; // Ini masih penting untuk menentukan apakah tombol "Edit" muncul
let allFoundItems = []; 

document.addEventListener("DOMContentLoaded", function () {
    const filterBtn = document.getElementById('filter-location-btn');
    const dropdown = document.getElementById('location-dropdown');
    const filterLabel = document.getElementById('filter-label');
    const itemsContainerFound = document.getElementById('found-items-container');
    const loadingMessage = document.getElementById('loading-message-found');

    if (!filterBtn || !dropdown || !filterLabel || !itemsContainerFound || !loadingMessage) {
        console.error("FIND_ITEM_JS: Satu atau lebih elemen HTML penting untuk filter/kontainer tidak ditemukan.");
        if (itemsContainerFound) {
            itemsContainerFound.innerHTML = '<p class="text-red-500 text-center">Terjadi kesalahan saat memuat filter.</p>';
        }
        return;
    }

    const uniqueLocations = [
        "Gedung G", "Gedung F", "Gedung A", "Musholla", "GKM", "Kantin", "Junction", "Edutech", "Area Parkir"
    ];

    // Fungsi untuk membuat satu elemen item
    function createItemFound(item, isAdminUser) { 
        let buttonHTML = '';
        let itemMainText = `<h3 class="font-semibold text-gray-800">${item.title}</h3>`; 

        if (isAdminUser) {
            buttonHTML = `
                <div class="flex items-center space-x-2">
                    <a href="details_item.html?id=${item.id}" class="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">View Details</a>
                    <a href="edit_item.html?id=${item.id}" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Edit</a>
                </div>
            `;
            itemMainText = `<h3 class="font-semibold text-gray-800">${item.title}</h3><p class="text-gray-600 text-sm mb-3">${item.keterangan}</p>`;
        } else {
            buttonHTML = ''; 
        }

        const defaultAvatarColor = "bg-gray-500";
        const usernameDisplay = "admin"; 

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

    function renderItems(locationFilter = 'all') {
        itemsContainerFound.innerHTML = '';

        const itemsToRender = locationFilter === 'all'
            ? allFoundItems.filter(post => post.item_type === 'found' && post.status === 1)
            : allFoundItems.filter(post =>
                post.item_type === 'found' && post.status === 1 &&
                post.ruangan.toLowerCase().includes(locationFilter.toLowerCase())
            );

        if (itemsToRender.length === 0) {
            itemsContainerFound.innerHTML = '<p class="text-center text-gray-500 py-10">Tidak ada item yang cocok dengan filter ini.</p>';
            return;
        }

        itemsToRender.forEach(post => {
            const item = {
                id: post.id,
                username: post.username, 
                timeAgo: new Date(post.created_at).toLocaleDateString("id-ID"),
                ruangan: post.ruangan,
                keterangan: post.keterangan,
                image_url: post.image_url,
                title: post.title,
            };
            itemsContainerFound.innerHTML += createItemFound(item, currentIsAdmin);
        });
    }

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

    async function fetchAndInitializeFoundItems() {
        loadingMessage.classList.remove('hidden');
        itemsContainerFound.innerHTML = '';

        try {
            await fetchCurrentUserDetails(); 

            const response = await fetch('https://filoti-backend.vercel.app/posts', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                throw new Error(`Failed to load items: ${response.status} - ${errorText}`);
            }
            
            let data = [];
            if (response.status === 200) { 
                data = await response.json();
            } else {
                console.warn(`Attempted to fetch posts, but got status ${response.status}. Displaying empty if no data.`)
            }

            if (!Array.isArray(data)) {
                console.error("Backend response for /posts is not an array:", data);
                throw new Error("Backend response is not an array. Please check API.");
            }

            allFoundItems = data;

            loadingMessage.classList.add('hidden');
            
            populateLocationFilter();
            renderItems();

        } catch (error) {
            console.error('Error fetching found items:', error);
            if (itemsContainerFound) {
                itemsContainerFound.innerHTML = `<p class="text-red-500 text-center">Gagal memuat item ditemukan. Error: ${error.message}.</p>`;
            }
            loadingMessage.classList.add('hidden');
        }
    }

    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && e.target !== filterBtn) {
            dropdown.classList.add('hidden');
        }
    });

    dropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedLocation = e.target.dataset.location;
        if (selectedLocation) {
            renderItems(selectedLocation);
            filterLabel.textContent = selectedLocation === 'all' ? 'Filter by Location' : selectedLocation;
            dropdown.classList.add('hidden');
        }
    });

    fetchAndInitializeFoundItems();

    // --- BAGIAN INI PERLU DIUBAH DI find_item.js ---
    // Pastikan NavbarLoader mengontrol visibilitas #navbar-container
    const navbarContainer = document.querySelector('#navbar-container'); 
    if (typeof NavbarLoader !== 'undefined' && navbarContainer) { 
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar_admin.html", // Ganti dengan path default yang diharapkan
            onLoad: function () {
                // Setelah navbar selesai dimuat oleh NavbarLoader, tampilkan kontainernya
                if (navbarContainer) {
                    navbarContainer.classList.add('loaded'); // Tambahkan class 'loaded'
                }
            },
            onError: function (error) {
                console.error('Gagal memuat navbar:', error);
                if (navbarContainer) {
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                    navbarContainer.classList.add('loaded'); // Tampilkan pesan error jika navbar gagal dimuat
                }
            }
        });
        loader.loadNavbarSimple(); 
    } else {
        console.log("NavbarLoader global mungkin sudah bekerja, atau #navbar-container tidak ditemukan.");
    }
});