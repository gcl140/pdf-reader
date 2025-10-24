        document.addEventListener('DOMContentLoaded', function() {
            // Elements
            const fileInput = document.getElementById('pdfFile');
            const browseBtn = document.getElementById('browseBtn');
            const dropZone = document.getElementById('dropZone');
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');
            const removeFile = document.getElementById('removeFile');
            const readBtn = document.getElementById('readBtn');
            const stopBtn = document.getElementById('stopBtn');
            const startPage = document.getElementById('startPage');
            const endPage = document.getElementById('endPage');
            const readingSpeed = document.getElementById('readingSpeed');
            const voiceType = document.getElementById('voiceType');
            const loading = document.getElementById('loading');
            const progressBar = document.getElementById('progressBar');
            const progressPercent = document.getElementById('progressPercent');
            const successMessage = document.getElementById('successMessage');
            const errorMessage = document.getElementById('errorMessage');
            const successText = document.getElementById('successText');
            const errorText = document.getElementById('errorText');

            // File handling
            browseBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    handleFileSelection(this.files[0]);
                }
            });

            // Drag and drop functionality
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('file-drag-over');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('file-drag-over');
                }, false);
            });

            dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length > 0 && files[0].type === 'application/pdf') {
                    handleFileSelection(files[0]);
                } else {
                    showError('Please drop a valid PDF file.');
                }
            }, false);

            function handleFileSelection(file) {
                if (file.type !== 'application/pdf') {
                    showError('Please select a valid PDF file.');
                    return;
                }

                // Update file info
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                fileInfo.classList.remove('hidden');
                
                // Enable read button
                readBtn.disabled = false;
                
                hideMessages();
            }

            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            removeFile.addEventListener('click', () => {
                fileInput.value = '';
                fileInfo.classList.add('hidden');
                readBtn.disabled = true;
            });

            // Read PDF functionality
            readBtn.addEventListener('click', function() {
                if (!fileInput.files[0]) {
                    showError('Please select a PDF file first.');
                    return;
                }

                const formData = new FormData();
                formData.append('pdf_file', fileInput.files[0]);
                formData.append('start_page', startPage.value);
                formData.append('end_page', endPage.value);
                formData.append('reading_speed', readingSpeed.value);
                formData.append('voice_type', voiceType.value);

                showLoading();
                hideMessages();

                // Simulate progress for demo purposes
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 10;
                    if (progress > 90) {
                        clearInterval(progressInterval);
                    }
                    updateProgress(progress);
                }, 200);

                fetch('/read-pdf/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    clearInterval(progressInterval);
                    updateProgress(100);
                    
                    setTimeout(() => {
                        hideLoading();
                        if (data.success) {
                            showSuccess(data.message || 'Reading started successfully!');
                        } else {
                            showError(data.error || 'An error occurred while reading the PDF.');
                        }
                    }, 500);
                })
                .catch(error => {
                    clearInterval(progressInterval);
                    hideLoading();
                    showError('Network error: ' + error.message);
                });
            });

            // Stop reading functionality
            stopBtn.addEventListener('click', function() {
                // In a real implementation, this would stop the TTS engine
                fetch('/stop-reading/', {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                })
                .then(() => {
                    window.location.reload();
                    showSuccess('Reading stopped.');
                })
                .catch(error => {
                    showError('Error stopping reading: ' + error.message);
                });
            });

            // Progress functions
            function updateProgress(percent) {
                progressBar.style.width = `${percent}%`;
                progressPercent.textContent = `${Math.round(percent)}%`;
            }

            function showLoading() {
                loading.classList.remove('hidden');
                readBtn.disabled = true;
                updateProgress(0);
            }

            function hideLoading() {
                loading.classList.add('hidden');
                readBtn.disabled = false;
            }

            // Message functions
            function showSuccess(message) {
                successText.textContent = message;
                successMessage.classList.remove('hidden');
                errorMessage.classList.add('hidden');
            }

            function showError(message) {
                errorText.textContent = message;
                errorMessage.classList.remove('hidden');
                successMessage.classList.add('hidden');
            }

            function hideMessages() {
                successMessage.classList.add('hidden');
                errorMessage.classList.add('hidden');
            }
        });