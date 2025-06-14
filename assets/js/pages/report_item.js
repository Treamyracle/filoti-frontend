document.addEventListener("DOMContentLoaded", function () {
    console.log("REPORT_ITEM_JS: Script loaded and DOM ready.");

    // --- Ambil Referensi Elemen HTML ---
    const reportType = document.getElementById("report-type");
    const itemLabel = document.getElementById("item-label");
    const fileUpload = document.getElementById("file-upload");
    const fileInput = document.getElementById("file-input");
    const filePreview = document.getElementById("file-preview");
    const reportForm = document.getElementById("report-form");
    const itemNameInput = document.getElementById("item-name");
    const itemDescriptionInput = document.getElementById("item-description");
    const locationInput = document.getElementById("location");
    const errorMessageDiv = document.getElementById("error-message");
    const successMessageDiv = document.getElementById("success-message");
    const submitButton = reportForm.querySelector('button[type="submit"]');

    // Periksa keberadaan semua elemen penting
    const requiredElements = {
        "report-form": reportForm,
        "report-type": reportType,
        "item-label": itemLabel,
        "item-name": itemNameInput,
        "item-description": itemDescriptionInput,
        "location": locationInput,
        "file-upload": fileUpload,
        "file-input": fileInput,
        "file-preview": filePreview,
        "error-message": errorMessageDiv,
        "success-message": successMessageDiv,
        "submit-button": submitButton
    };

    let allElementsFound = true;
    for (const id in requiredElements) {
        if (!requiredElements[id]) {
            console.error(`REPORT_ITEM_JS: Elemen HTML dengan ID atau selektor '${id}' tidak ditemukan.`);
            allElementsFound = false;
        }
    }

    if (!allElementsFound) {
        const container = document.querySelector('main.container') || document.body;
        if (container) {
            const errorNotice = document.createElement('div');
            errorNotice.className = 'bg-red-100 text-red-700 p-4 rounded-lg text-center font-semibold mt-4';
            errorNotice.textContent = 'Terjadi kesalahan: Beberapa bagian form tidak dapat dimuat. Periksa konsol browser untuk detail.';
            container.prepend(errorNotice);
        }
        return;
    }

    // --- Fungsi Utilitas ---
    function showMessage(element, message, isSuccess) {
        element.textContent = message;
        element.classList.remove('hidden', 'text-red-500', 'text-green-600');
        if (isSuccess) {
            element.classList.add('text-green-600');
        } else {
            element.classList.add('text-red-500');
        }
        element.classList.remove('opacity-0', 'invisible');
        element.classList.add('opacity-100', 'visible');
    }

    function clearMessages() {
        errorMessageDiv.textContent = '';
        errorMessageDiv.classList.add('hidden', 'opacity-0', 'invisible');
        successMessageDiv.textContent = '';
        successMessageDiv.classList.add('hidden', 'opacity-0', 'invisible');
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Mengirim...';
            submitButton.classList.add('opacity-70', 'cursor-not-allowed');
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Report';
            submitButton.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    }

    // --- Validasi Sesi Saat Pemuatan Halaman ---
    async function validateSession() {
        try {
            console.log("REPORT_ITEM_JS: Memvalidasi sesi...");
            const response = await fetch('https://filoti-backend.vercel.app/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                console.warn("REPORT_ITEM_JS: Sesi tidak valid atau tidak ada, mengalihkan ke halaman login.");
                // Redirect ke halaman login jika sesi tidak valid
                window.location.href = 'login.html'; 
                return false;
            }
            console.log("REPORT_ITEM_JS: Sesi valid.");
            return true;
        } catch (error) {
            console.error("REPORT_ITEM_JS: Kesalahan saat memvalidasi sesi:", error);
            showMessage(errorMessageDiv, "Kesalahan jaringan saat memvalidasi sesi. Mohon coba lagi.", false);
            // Anda mungkin ingin tetap mengalihkan ke login jika ada kesalahan jaringan saat validasi sesi
            // window.location.href = 'login.html';
            return false;
        }
    }

    // --- Update item label based on report type ---
    reportType.addEventListener("change", function () {
        if (this.value === "lost") {
            itemLabel.textContent = "Apa yang hilang?";
        } else if (this.value === "found") {
            itemLabel.textContent = "Apa yang ditemukan?";
        }
    });

    // --- File upload functionality ---
    let uploadedFiles = [];
    fileUpload.addEventListener("click", () => fileInput.click());
    fileUpload.addEventListener("dragover", (e) => { e.preventDefault(); fileUpload.classList.add("dragover"); });
    fileUpload.addEventListener("dragleave", (e) => { e.preventDefault(); fileUpload.classList.remove("dragover"); });
    fileUpload.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUpload.classList.remove("dragover");
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
    function handleFiles(files) {
        uploadedFiles = Array.from(files);
        filePreview.innerHTML = "";
        if (uploadedFiles.length === 0) {
            filePreview.classList.add("hidden");
            return;
        }
        filePreview.classList.remove("hidden");
        uploadedFiles.forEach((file, index) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement("div");
                    div.className = "relative group";
                    div.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" class="w-full h-24 object-cover rounded-lg">
                        <button type="button" data-index="${index}" class="remove-file-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                    `;
                    filePreview.appendChild(div);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    filePreview.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-file-btn')) {
            const indexToRemove = parseInt(e.target.dataset.index, 10);
            uploadedFiles.splice(indexToRemove, 1);
            handleFiles(uploadedFiles);
        }
    });

    // --- Submit Form ke Backend ---
    reportForm.addEventListener("submit", async (e) => {
        console.log("REPORT_FORM: Submit event fired.");
        e.preventDefault();

        clearMessages();
        setLoadingState(true);

        // Validasi sesi lagi sebelum submit
        const isSessionValid = await validateSession();
        if (!isSessionValid) {
            setLoadingState(false);
            return; // validateSession akan mengalihkan ke login jika tidak valid
        }

        const reportTypeValue = reportType.value;
        const titleValue = itemNameInput.value.trim();
        const keteranganValue = itemDescriptionInput.value.trim();
        const ruanganValue = locationInput.value.trim();

        if (!reportTypeValue || !titleValue || !keteranganValue || !ruanganValue) {
            showMessage(errorMessageDiv, "Harap isi semua kolom yang diperlukan.", false);
            console.warn("REPORT_FORM: Validasi gagal, field kosong.");
            setLoadingState(false);
            return;
        }

        let imageUrl = "https://picsum.photos/600/400?random=" + Math.floor(Math.random() * 100000);

        const postData = {
            title: titleValue,
            keterangan: keteranganValue,
            ruangan: ruanganValue,
            image_url: imageUrl,
            itemType: reportTypeValue
        };

        console.log("REPORT_FORM: Mengirim data post:", postData);

        try {
            const response = await fetch('https://filoti-backend.vercel.app/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData),
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                showMessage(successMessageDiv, "Laporan berhasil dikirim!", true);
                console.log('REPORT_FORM: Post created successfully:', responseData);

                reportForm.reset();
                uploadedFiles = [];
                filePreview.innerHTML = "";
                filePreview.classList.add("hidden");
                itemLabel.textContent = "Apa yang hilang?";
                
                setTimeout(() => {
                    setLoadingState(false);
                    if (reportTypeValue === 'lost') {
                        window.location.href = 'lost_item.html';
                    } else {
                        window.location.href = 'find_item.html';
                    }
                }, 2000);

            } else {
                const errorData = await response.json().catch(() => ({error: 'Gagal memproses respons server.'}));
                showMessage(errorMessageDiv, errorData.error || 'Gagal mengirim laporan. Silakan coba lagi.', false);
                console.error('REPORT_FORM: Error submitting report:', response.status, errorData);
                setLoadingState(false);
            }
        } catch (error) {
            console.error('REPORT_FORM: Network error or server unavailable:', error);
            showMessage(errorMessageDiv, 'Terjadi kesalahan jaringan atau server tidak tersedia.', false);
            setLoadingState(false);
        }
    });

    // --- Panggil Validasi Sesi saat DOM siap ---
    // Ini adalah panggilan utama yang akan dijalankan saat halaman dimuat
    validateSession().then(isValid => {
        if (!isValid) {
            // Jika sesi tidak valid, validateSession sudah mengalihkan
            // Anda bisa melakukan hal lain di sini, misalnya menonaktifkan form
            console.log("REPORT_ITEM_JS: Sesi tidak valid saat halaman dimuat.");
        }
    });


    // --- Bagian NavbarLoader (tidak berubah) ---
    if (typeof NavbarLoader !== 'undefined') {
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar.html",
            onLoad: () => {
                if (typeof FilotiNavbar !== "undefined") {
                    new FilotiNavbar();
                } else {
                    console.warn("REPORT_ITEM_JS: FilotiNavbar class not found. Navbar functionality might be limited.");
                }
            },
            onError: function(error) {
                console.error('REPORT_ITEM_JS: Gagal memuat navbar:', error);
                const navbarContainer = document.querySelector('#navbar-container');
                if (navbarContainer) {
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                }
            }
        });
        loader.loadNavbarSimple();
    } else {
        console.warn("REPORT_ITEM_JS: NavbarLoader class not found. Navbar might not load.");
    }
});