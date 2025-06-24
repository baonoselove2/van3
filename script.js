// 全域變數
let currentStep = 1;
let stream = null;
let signatureCanvas = null;
let signatureContext = null;
let isDrawing = false;
let photoTaken = false;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeForm();
    initializeSignature();
    initializeCamera();
});

// 初始化表單
function initializeForm() {
    // 表單提交事件
    document.getElementById('loanForm').addEventListener('submit', handleFormSubmit);
    
    // 即時驗證
    document.getElementById('name').addEventListener('input', validateStep1);
    document.getElementById('phone').addEventListener('input', validateStep1);
    document.getElementById('amount').addEventListener('input', validateStep1);
    
    // 更新合約金額
    document.getElementById('amount').addEventListener('input', updateContractAmount);
}

// 初始化簽名功能
function initializeSignature() {
    signatureCanvas = document.getElementById('signatureCanvas');
    signatureContext = signatureCanvas.getContext('2d');
    
    // 設定畫布樣式
    signatureContext.strokeStyle = '#2d3748';
    signatureContext.lineWidth = 2;
    signatureContext.lineCap = 'round';
    
    // 簽名事件
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
    
    // 觸控事件（手機支援）
    signatureCanvas.addEventListener('touchstart', handleTouch);
    signatureCanvas.addEventListener('touchmove', handleTouch);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    
    // 清除簽名按鈕
    document.getElementById('clearSignature').addEventListener('click', clearSignature);
}

// 初始化相機功能
function initializeCamera() {
    console.log('Initializing camera...');
    const startCameraBtn = document.getElementById('startCamera');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const retakePhotoBtn = document.getElementById('retakePhoto');
    
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', startCamera);
        console.log('Start camera button listener added');
    }
    
    if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', capturePhoto);
        console.log('Capture photo button listener added');
    }
    
    if (retakePhotoBtn) {
        retakePhotoBtn.addEventListener('click', retakePhoto);
        console.log('Retake photo button listener added');
    }
}

// 步驟導航
function nextStep() {
    console.log('Next step called, current step:', currentStep);
    if (validateCurrentStep()) {
        if (currentStep < 3) {
            currentStep++;
            updateStepDisplay();
        }
    }
}

function prevStep() {
    console.log('Prev step called, current step:', currentStep);
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

// 更新步驟顯示
function updateStepDisplay() {
    console.log('Updating step display to step:', currentStep);
    // 隱藏所有步驟
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 顯示當前步驟
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // 更新進度條
    updateProgressBar();
    
    // 特殊處理
    if (currentStep === 2) {
        // 步驟2：檢查相機狀態
        checkCameraStatus();
    } else if (currentStep === 3) {
        // 步驟3：更新合約內容
        updateContractContent();
    }
}

// 更新進度條
function updateProgressBar() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

// 驗證當前步驟
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

// 驗證步驟1
function validateStep1() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const amount = document.getElementById('amount').value;
    
    let isValid = true;
    
    // 清除之前的錯誤訊息
    clearErrors();
    
    // 驗證姓名
    if (!name) {
        showError('name', '請輸入姓名');
        isValid = false;
    } else if (name.length < 2) {
        showError('name', '姓名至少需要2個字元');
        isValid = false;
    }
    
    // 驗證電話
    if (!phone) {
        showError('phone', '請輸入聯絡電話');
        isValid = false;
    } else if (!/^09\d{8}$/.test(phone)) {
        showError('phone', '請輸入正確的手機號碼格式（09開頭，共10位數字）');
        isValid = false;
    }
    
    // 驗證金額
    if (!amount) {
        showError('amount', '請輸入期望借款金額');
        isValid = false;
    } else if (amount < 10000 || amount > 1000000) {
        showError('amount', '借款金額需在10,000元至1,000,000元之間');
        isValid = false;
    }
    
    return isValid;
}

// 驗證步驟2
function validateStep2() {
    console.log('Validating step 2, photoTaken:', photoTaken);
    if (photoTaken) {
        return true;
    } else {
        showNotification('請先開啟相機並拍攝照片', 'error');
        return false;
    }
}

// 驗證步驟3
function validateStep3() {
    // 檢查是否有簽名
    const canvas = document.getElementById('signatureCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let hasSignature = false;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
            hasSignature = true;
            break;
        }
    }
    
    if (!hasSignature) {
        showNotification('請在簽名區域簽署您的姓名', 'error');
        return false;
    }
    
    return true;
}

// 顯示錯誤訊息
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.fontSize = '0.9rem';
    errorDiv.style.color = '#e53e3e';
    errorDiv.style.marginTop = '5px';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#e53e3e';
}

// 清除錯誤訊息
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
    
    document.querySelectorAll('.form-group input, .form-group select').forEach(field => {
        field.style.borderColor = '#e2e8f0';
    });
}

// 顯示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = type === 'error' ? 'error-message' : 'success-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.3s ease';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 相機功能
async function startCamera() {
    console.log('Starting camera...');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user' // 使用前置鏡頭
            } 
        });
        
        const video = document.getElementById('video');
        const videoPlaceholder = document.getElementById('videoPlaceholder');
        const startCameraBtn = document.getElementById('startCamera');
        const capturePhotoBtn = document.getElementById('capturePhoto');
        
        if (video && videoPlaceholder && startCameraBtn && capturePhotoBtn) {
            video.srcObject = stream;
            video.style.display = 'block';
            videoPlaceholder.style.display = 'none';
            startCameraBtn.style.display = 'none';
            capturePhotoBtn.style.display = 'inline-flex';
            
            console.log('Camera started successfully');
            showNotification('相機已開啟，請調整角度準備拍照', 'success');
        } else {
            console.error('Some elements not found');
        }
        
    } catch (error) {
        console.error('無法開啟相機:', error);
        showNotification('無法開啟相機，請檢查權限設定或確認設備有相機', 'error');
    }
}

function capturePhoto() {
    console.log('Capturing photo...');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const capturedImage = document.getElementById('capturedImage');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const retakePhotoBtn = document.getElementById('retakePhoto');
    const nextStep2Btn = document.getElementById('nextStep2');
    
    if (!video || !canvas || !capturedImage) {
        console.error('Required elements not found');
        return;
    }
    
    try {
        // 設定畫布尺寸
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const context = canvas.getContext('2d');
        
        // 拍攝照片
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 停止相機串流
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        // 顯示拍攝的照片
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        capturedImage.src = imageData;
        capturedImage.style.display = 'block';
        video.style.display = 'none';
        
        // 更新按鈕狀態
        if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
        if (retakePhotoBtn) retakePhotoBtn.style.display = 'inline-flex';
        if (nextStep2Btn) nextStep2Btn.disabled = false;
        
        // 標記已拍照
        photoTaken = true;
        
        console.log('Photo captured successfully');
        showNotification('照片拍攝成功！', 'success');
        
    } catch (error) {
        console.error('Error capturing photo:', error);
        showNotification('拍照失敗，請重試', 'error');
    }
}

function retakePhoto() {
    console.log('Retaking photo...');
    const video = document.getElementById('video');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const capturedImage = document.getElementById('capturedImage');
    const startCameraBtn = document.getElementById('startCamera');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const retakePhotoBtn = document.getElementById('retakePhoto');
    const nextStep2Btn = document.getElementById('nextStep2');
    
    // 重置顯示
    if (video) video.style.display = 'none';
    if (capturedImage) capturedImage.style.display = 'none';
    if (videoPlaceholder) videoPlaceholder.style.display = 'flex';
    
    // 重置按鈕
    if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
    if (retakePhotoBtn) retakePhotoBtn.style.display = 'none';
    if (startCameraBtn) startCameraBtn.style.display = 'inline-flex';
    if (nextStep2Btn) nextStep2Btn.disabled = true;
    
    // 重置狀態
    photoTaken = false;
    
    // 重新開啟相機
    startCamera();
}

function checkCameraStatus() {
    console.log('Checking camera status, photoTaken:', photoTaken);
    const nextStep2Btn = document.getElementById('nextStep2');
    if (nextStep2Btn) {
        if (photoTaken) {
            nextStep2Btn.disabled = false;
        } else {
            nextStep2Btn.disabled = true;
        }
    }
}

// 簽名功能
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    signatureContext.lineTo(x, y);
    signatureContext.stroke();
    signatureContext.beginPath();
    signatureContext.moveTo(x, y);
}

function stopDrawing() {
    isDrawing = false;
    signatureContext.beginPath();
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
}

function clearSignature() {
    signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

// 更新合約內容
function updateContractAmount() {
    const amount = document.getElementById('amount').value;
    const contractAmount = document.getElementById('contractAmount');
    
    if (amount) {
        contractAmount.textContent = parseInt(amount).toLocaleString('zh-TW');
    } else {
        contractAmount.textContent = '_______';
    }
}

function updateContractContent() {
    updateContractAmount();
}

// 表單提交處理
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    // 顯示載入狀態
    const submitBtn = document.getElementById('submitForm');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> 處理中...';
    submitBtn.disabled = true;
    
    try {
        // 模擬API呼叫
        await simulateApiCall();
        
        // 顯示成功訊息
        document.getElementById('successMessage').style.display = 'flex';
        
    } catch (error) {
        showNotification('提交失敗，請稍後再試', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 模擬API呼叫
function simulateApiCall() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

// 重置表單
function resetForm() {
    // 重置步驟
    currentStep = 1;
    updateStepDisplay();
    
    // 重置表單資料
    document.getElementById('loanForm').reset();
    
    // 重置相機
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    const video = document.getElementById('video');
    const capturedImage = document.getElementById('capturedImage');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const startCameraBtn = document.getElementById('startCamera');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const retakePhotoBtn = document.getElementById('retakePhoto');
    const nextStep2Btn = document.getElementById('nextStep2');
    
    if (video) video.style.display = 'none';
    if (capturedImage) capturedImage.style.display = 'none';
    if (videoPlaceholder) videoPlaceholder.style.display = 'flex';
    if (startCameraBtn) startCameraBtn.style.display = 'inline-flex';
    if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
    if (retakePhotoBtn) retakePhotoBtn.style.display = 'none';
    if (nextStep2Btn) nextStep2Btn.disabled = true;
    
    // 重置狀態
    photoTaken = false;
    
    // 重置簽名
    clearSignature();
    
    // 隱藏成功訊息
    document.getElementById('successMessage').style.display = 'none';
    
    // 清除錯誤訊息
    clearErrors();
    
    showNotification('表單已重置', 'success');
}

// 添加CSS動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 