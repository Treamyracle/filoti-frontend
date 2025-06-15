// edit_item.js
document.addEventListener("DOMContentLoaded", async function () { 

const navbarContainer = document.querySelector('#navbar-container'); 
    if (typeof NavbarLoader !== 'undefined' && navbarContainer) { 
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar.html", // Ganti dengan path default yang diharapkan
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

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id'); 

    if (!itemId) {
        document.getElementById('edit-content').innerHTML = '<p class="text-center text-red-500">ID Item tidak ditemukan di URL.</p>';
        return;
    }

    // --- DAFTAR LOKASI UNIK YANG DI-HARDCODE ---
    // Sesuaikan ini jika Anda ingin mengambil dari backend di masa depan (misal: /locations endpoint)
    const uniqueLocations = [
        "Gedung G", "Gedung F", "Gedung A", "Musholla", "GKM", "Kantin", "Junction", "Edutech", "Area Parkir"
    ];
    // ------------------------------------------

    // Get form elements
    const form = document.getElementById('edit-form');
    const titleInput = document.getElementById('item-title');
    const descriptionInput = document.getElementById('item-description');
    const locationSelect = document.getElementById('location'); // Ubah dari locationInput menjadi locationSelect
    const markDoneBtn = document.getElementById('mark-done-btn');
    const claimerForm = document.getElementById('claimer-form');
    const confirmDoneBtn = document.getElementById('confirm-done-btn');
    const deleteBtn = document.getElementById('delete-btn');

    let itemToEdit = null;

    // Fungsi untuk mengisi dropdown lokasi
    function populateLocationDropdown(selectedLocation = '') {
        locationSelect.innerHTML = ''; // Kosongkan opsi yang ada

        // Tambahkan opsi default
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Pilih Lokasi...';
        defaultOption.disabled = true;
        defaultOption.selected = true; // Set sebagai default terpilih
        locationSelect.appendChild(defaultOption);

        uniqueLocations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            if (loc === selectedLocation) {
                option.selected = true; // Pilih lokasi yang sesuai dengan itemToEdit
                defaultOption.selected = false; // Batalkan default terpilih jika ada yang cocok
            }
            locationSelect.appendChild(option);
        });
    }

    // Fungsi untuk memuat data item dari backend
    async function loadItemData() {
        try {
            const response = await fetch(`https://filoti-backend.vercel.app/posts/${itemId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Gagal memuat item: ${response.status}`);
            }

            itemToEdit = await response.json();
            
            if (itemToEdit) {
                titleInput.value = itemToEdit.title;
                descriptionInput.value = itemToEdit.keterangan; 
                populateLocationDropdown(itemToEdit.ruangan); // Panggil untuk mengisi dropdown dengan lokasi item
                
                if (itemToEdit.status === 0) { 
                    markDoneBtn.classList.add('hidden');
                    claimerForm.classList.add('hidden');
                    // Tampilkan info claimer_name dari itemToEdit.status jika ada
                    const claimerInfo = itemToEdit.status_detail && itemToEdit.status_detail.claimer_name ? itemToEdit.status_detail.claimer_name : 'Tidak Diketahui';
                    document.getElementById('edit-content').insertAdjacentHTML('beforeend', `
                        <p class="mt-4 text-center text-green-600 font-semibold">Laporan ini sudah diselesaikan pada ${new Date(itemToEdit.created_at).toLocaleDateString()} oleh ${claimerInfo}.</p>
                    `);
                    form.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(el => el.disabled = true); // Tambahkan 'select'
                }

            } else {
                document.getElementById('edit-content').innerHTML = '<p class="text-center text-red-500">Item tidak ditemukan di database.</p>';
                return;
            }

        } catch (error) {
            console.error('Error loading item data:', error);
            document.getElementById('edit-content').innerHTML = `<p class="text-center text-red-500">Gagal memuat data item: ${error.message}.</p>`;
            return;
        }
    }

    // Panggil fungsi untuk memuat data item saat halaman dimuat
    await loadItemData();

    // Handle "Update Informasi"
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const updatedData = {
            title: titleInput.value,
            keterangan: descriptionInput.value,
            ruangan: locationSelect.value, // Ambil nilai dari select
        };

        if (!updatedData.ruangan) {
            alert('Lokasi wajib dipilih!');
            return;
        }

        try {
            const response = await fetch(`https://filoti-backend.vercel.app/posts/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Gagal memperbarui item: ${response.status}`);
            }

            alert('Informasi berhasil diperbarui!');
            window.location.href = itemToEdit.item_type === 'lost' ? 'lost_item.html' : 'find_item.html';

        } catch (error) {
            console.error('Error updating item:', error);
            alert(`Gagal memperbarui informasi: ${error.message}`);
        }
    });

    // Handle "Tandai sebagai Selesai"
    markDoneBtn.addEventListener('click', function() {
        claimerForm.classList.toggle('hidden');
    });
    
    // Handle "Konfirmasi & Selesaikan"
    confirmDoneBtn.addEventListener('click', async function() {
        const claimerName = document.getElementById('claimer-name').value.trim();
        const claimerProofPhotoInput = document.getElementById('claimer-proof-photo');
        const claimerProofPhoto = claimerProofPhotoInput.files[0];

        if (!claimerName) {
            alert('Nama pengambil/penemu wajib diisi!');
            return;
        }

        let proofImageUrl = "";
        // Cek jika ada file yang diupload. Jika tidak, proofImageUrl akan tetap kosong
        if (claimerProofPhoto) {
            // Ini adalah bagian yang perlu diimplementasikan untuk UPLOAD GAMBAR.
            // Saat ini, kita hanya menggunakan placeholder URL.
            // Anda perlu API upload gambar terpisah yang menerima file dan mengembalikan URL.
            console.log("Mengupload gambar bukti...");
            proofImageUrl = "https://placehold.co/600x400?text=Bukti+Diserahkan"; // Placeholder untuk demo
            // Contoh alur upload sebenarnya (perlu API backend Anda):
            // const formData = new FormData();
            // formData.append('file', claimerProofPhoto);
            // const uploadResponse = await fetch('YOUR_UPLOAD_API_ENDPOINT', {
            //     method: 'POST',
            //     body: formData
            // });
            // if (uploadResponse.ok) {
            //     const uploadData = await uploadResponse.json();
            //     proofImageUrl = uploadData.url; // Asumsi API mengembalikan URL gambar
            // } else {
            //     console.error("Gagal upload gambar bukti");
            //     alert("Gagal mengupload gambar bukti. Coba lagi.");
            //     return;
            // }
        }


        const markDoneData = {
            claimer_name: claimerName,
            proof_image: proofImageUrl 
        };

        try {
            const response = await fetch(`https://filoti-backend.vercel.app/posts/${itemId}/done`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(markDoneData),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Gagal menyelesaikan laporan: ${response.status}`);
            }

            alert('Laporan berhasil diselesaikan dan dipindahkan ke histori.');
            window.location.href = 'history.html';

        } catch (error) {
            console.error('Error marking post as done:', error);
            alert(`Gagal menyelesaikan laporan: ${error.message}`);
        }
    });
    
    // Handle "Hapus Laporan Ini"
    deleteBtn.addEventListener('click', async function() {
        const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus laporan ini secara permanen?');

        if (isConfirmed) {
            try {
                const response = await fetch(`https://filoti-backend.vercel.app/posts/${itemId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Gagal menghapus laporan: ${response.status}`);
                }
                
                alert('Laporan berhasil dihapus.');
                window.location.href = 'lost_item.html'; 
                
            } catch (error) {
                console.error('Error deleting item:', error);
                alert(`Gagal menghapus laporan: ${error.message}`);
            }
        }
    });
});