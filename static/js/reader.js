        // DOM Elements
        const pdfForm = document.getElementById('pdfForm');
        const fileInput = document.getElementById('fileInput');
        const dropArea = document.getElementById('dropArea');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const removeFile = document.getElementById('removeFile');
        const submitBtn = document.getElementById('submitBtn');
        const uploadSection = document.getElementById('uploadSection');
        const loadingSection = document.getElementById('loadingSection');
        const audioSection = document.getElementById('audioSection');
        const audioPlayer = document.getElementById('audioPlayer');
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        const stopBtn = document.getElementById('stopBtn');

        // File handling
        fileInput.addEventListener('change', handleFileSelect);
        removeFile.addEventListener('click', clearFileSelection);

        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.classList.add('file-drag-over');
        }

        function unhighlight() {
            dropArea.classList.remove('file-drag-over');
        }

        dropArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            handleFileSelect();
        }

        function handleFileSelect() {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                fileInfo.classList.remove('hidden');
                submitBtn.disabled = false;
            }
        }

        function clearFileSelection() {
            fileInput.value = '';
            fileInfo.classList.add('hidden');
            submitBtn.disabled = true;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Form submission
        pdfForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading state
            uploadSection.classList.add('hidden');
            loadingSection.classList.remove('hidden');
            audioSection.classList.add('hidden');
            errorSection.classList.add('hidden');
            
            const formData = new FormData(this);

            try {
                const response = await fetch('/read-pdf/', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                // Hide loading state
                loadingSection.classList.add('hidden');
                
                if (data.success) {
                    audioPlayer.src = data.audio_url;
                    audioSection.classList.remove('hidden');
                    audioPlayer.play();
                } else {
                    errorMessage.textContent = data.error || 'An unknown error occurred';
                    errorSection.classList.remove('hidden');
                    uploadSection.classList.remove('hidden');
                }
            } catch (error) {
                // Hide loading state
                loadingSection.classList.add('hidden');
                
                errorMessage.textContent = 'Network error: ' + error.message;
                errorSection.classList.remove('hidden');
                uploadSection.classList.remove('hidden');
            }
        });

        // Stop button functionality
        stopBtn.addEventListener('click', function() {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            
            // Send stop request to server
            fetch('/stop-reading/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            }).catch(error => {
                console.error('Error stopping audio:', error);
            });
        });

        // Helper function to get CSRF token
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }