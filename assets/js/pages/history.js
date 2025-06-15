// Variabel global untuk menyimpan username admin
let currentAdminUsername = "Memuat Admin..."; // Default sementara saat memuat
let allHistoryItems = []; // Variabel untuk menyimpan semua item histori dari backend

document.addEventListener("DOMContentLoaded", function () {
    const filterBtn = document.getElementById('filter-location-btn');
    const dropdown = document.getElementById('location-dropdown');
    const filterLabel = document.getElementById('filter-label');
    const itemsContainerHistory = document.getElementById('history-items-container'); // Perhatikan ID container
    const loadingMessage = document.getElementById('loading-message-history'); // Tambahkan ID ini di HTML Anda

    // Pengecekan elemen penting di awal
    if (!filterBtn || !dropdown || !filterLabel || !itemsContainerHistory || !loadingMessage) {
        console.error("HISTORY_JS: Satu atau lebih elemen HTML penting untuk filter/kontainer tidak ditemukan.");
        if (itemsContainerHistory) {
            itemsContainerHistory.innerHTML = '<p class="text-red-500 text-center">Terjadi kesalahan saat memuat filter.</p>';
        }
        return; // Hentikan eksekusi jika elemen dasar tidak ada
    }

    // --- DAFTAR LOKASI UNIK YANG DI-HARDCODE ---
    const uniqueLocations = [
            "Gedung G",
    "Gedung F",
    "Gedung A",
    "Musholla",
    "GKM",
    "Kantin",
    "Junction",
    "Edutech",
    "Area Parkir"
    ];
    // ------------------------------------------

    function createHistoryItem(item) {
        const statusBadge = item.status === 0 // Filter di frontend: 0 = done
            ? `<div class="flex items-center space-x-2">
                   <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                   <span class="text-sm font-medium text-green-600">Done</span>
               </div>`
            : `<div class="flex items-center space-x-2">
                   <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                   <span class="text-sm font-medium text-red-600">Archived/Inactive</span>
               </div>`;

        const defaultAvatarColor = "bg-gray-500";
        const usernameDisplay = currentAdminUsername;


        return `
            <div class="bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                <div class="flex items-start space-x-3 flex-1">
                    <div class="w-10 h-10 ${defaultAvatarColor} rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-semibold text-sm"></span> </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3 class="font-semibold text-gray-800">${usernameDisplay}</h3>
                                <span class="text-sm text-gray-500">• ${item.timeAgo}</span>
                                <span class="text-sm text-gray-500">• ${item.ruangan}</span> </div>
                            ${statusBadge}
                        </div>
                        <p class="text-gray-800 font-medium">${item.title}</p>
                        <p class="text-gray-600 text-sm mb-3">Item Type: ${item.itemType}</p>
                        <a href="${item.detailsLink}?id=${item.id}" class="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors inline-block text-center">View Details</a>
                    </div>
                </div>
            </div>`;
    }

    // Fungsi untuk mengambil username dari backend
    async function fetchAdminUsername() {
        try {
            const response = await fetch('https://filoti-backend.vercel.app/me', {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();
                currentAdminUsername = userData.username || "Unknown Admin";
            } else {
                console.warn('Failed to fetch admin username for history page:', response.status);
                currentAdminUsername = "Admin (Belum Login)";
            }
        } catch (error) {
            console.error('Error fetching admin username for history page:', error);
            currentAdminUsername = "Admin (Kesalahan Jaringan)";
        }
    }

    // Fungsi untuk merender item ke DOM berdasarkan filter
    function renderItems(locationFilter = 'all') {
        itemsContainerHistory.innerHTML = ''; // Kosongkan container

        const itemsToRender = locationFilter === 'all'
            ? allHistoryItems.filter(post => post.status === 0) // Filter hanya status 0 (Done/Arsip)
            : allHistoryItems.filter(post =>
                post.status === 0 && // Filter status 0
                post.ruangan.toLowerCase().includes(locationFilter.toLowerCase()) // Filter berdasarkan 'ruangan'
            );

        if (itemsToRender.length === 0) {
            itemsContainerHistory.innerHTML = '<p class="text-center text-gray-500 py-10">Tidak ada item yang cocok dengan filter ini.</p>';
            return;
        }

        itemsToRender.forEach(post => {
            const item = {
                id: post.id,
                username: currentAdminUsername,
                timeAgo: new Date(post.created_at).toLocaleDateString("id-ID"),
                title: post.title,
                itemType: post.item_type,
                status: post.status,
                ruangan: post.ruangan, // Teruskan juga properti ruangan
                detailsLink: "history_details.html"
            };
            itemsContainerHistory.innerHTML += createHistoryItem(item);
        });
    }

    // Fungsi untuk mengisi dropdown filter dengan lokasi unik (HARDCODED)
    function populateLocationFilter() {
        dropdown.innerHTML = ''; // Kosongkan dropdown

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
    async function fetchAndDisplayHistoryItems() {
        loadingMessage.classList.remove('hidden'); // Tampilkan pesan loading
        itemsContainerHistory.innerHTML = ''; // Kosongkan kontainer

        try {
            await fetchAdminUsername(); // Ambil username admin dulu

            const response = await fetch('https://filoti-backend.vercel.app/posts', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                throw new Error(`Failed to load history items: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();

            if (!Array.isArray(data)) {
                console.error("Backend response for /posts is not an array:", data);
                throw new Error("Backend response is not an array. Please check API.");
            }

            allHistoryItems = data; // Simpan semua data post ke variabel global

            loadingMessage.classList.add('hidden'); // Sembunyikan pesan loading
            
            populateLocationFilter(); // Isi dropdown filter dengan lokasi unik (sekarang hardcoded)
            renderItems(); // Render semua item awalnya

        } catch (error) {
            console.error('Error fetching history items:', error);
            if (itemsContainerHistory) {
                itemsContainerHistory.innerHTML = `<p class="text-red-500 text-center">Gagal memuat riwayat item. Error: ${error.message}.</p>`;
            }
            loadingMessage.classList.add('hidden'); // Sembunyikan pesan loading
        }
    }

    // --- Event Listeners untuk Dropdown Filter ---
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

    // Panggil fungsi utama saat DOM siap
    fetchAndDisplayHistoryItems();

    // Bagian NavbarLoader tidak berubah
    if (typeof NavbarLoader !== 'undefined') {
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar_admin.html",
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