// DOM Elements
const messageInput = document.getElementById('messageInput');
const createMessageBtn = document.getElementById('createMessage');
const messageLinkContainer = document.getElementById('messageLinkContainer');
const messageLink = document.getElementById('messageLink');
const copyLinkBtn = document.getElementById('copyLink');
const darkModeToggle = document.getElementById('darkModeToggle');
const themeButtons = document.querySelectorAll('.theme-btn');
const deleteSound = document.getElementById('deleteSound');
const countdownElement = document.getElementById('countdown');
const charCounter = document.querySelector('.char-counter');

messageInput.addEventListener('input', () => {
    const length = messageInput.value.length;
    charCounter.textContent = `${length}/500`;
});

const savedTheme = localStorage.getItem('theme') || 'default';
const savedDarkMode = localStorage.getItem('darkMode') === 'true';

document.body.setAttribute('data-theme', savedTheme);
if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
}

themeButtons.forEach(btn => {
    if (btn.dataset.theme === savedTheme) {
        btn.classList.add('active');
    }
});

darkModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
});

themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

createMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (!message) {
        alert('Please enter a message!');
        return;
    }

    const expiryMinutes = parseFloat(document.getElementById('expiryTime').value);
    const messageId = generateUniqueId();
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);

    const messageData = {
        content: message,
        expiryTime: expiryTime,
        read: false
    };

    localStorage.setItem(messageId, JSON.stringify(messageData));
    
    const shareLink = `${window.location.origin}${window.location.pathname}?id=${messageId}`;
    messageLink.value = shareLink;
    messageLinkContainer.style.display = 'block';
    
    messageInput.value = '';
    
    startCountdown(expiryTime);
});

copyLinkBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(messageLink.value);
        const originalContent = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyLinkBtn.classList.add('success');
        
        setTimeout(() => {
            copyLinkBtn.innerHTML = originalContent;
            copyLinkBtn.classList.remove('success');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy link. Please try again.');
    }
});

function checkForMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('id');

    if (messageId) {
        const messageData = localStorage.getItem(messageId);
        if (messageData) {
            const { content, expiryTime, read } = JSON.parse(messageData);
            
            if (read) {
                showMessage('This message has already been read and has self-destructed!');
                return;
            }

            if (Date.now() > expiryTime) {
                localStorage.removeItem(messageId);
                showMessage('This message has expired!');
                return;
            }

            showMessage(content);
            markMessageAsRead(messageId);
            startCountdown(expiryTime);
        } else {
            showMessage('Message not found or has expired.');
        }
    }
}

function showMessage(content) {
    const container = document.querySelector('.main-content');
    container.innerHTML = `
        <div class="message-display">
            <div class="message-header">
                <i class="fas fa-envelope-open-text"></i>
                <h2>Your Secret Message</h2>
            </div>
            <div class="message-content">${content}</div>
            <div class="countdown" id="countdown">
                <i class="fas fa-hourglass-half"></i>
                <span>Message expires in: 5m 0s</span>
            </div>
        </div>
    `;
}

function markMessageAsRead(messageId) {
    const messageData = JSON.parse(localStorage.getItem(messageId));
    messageData.read = true;
    localStorage.setItem(messageId, JSON.stringify(messageData));
    
    deleteSound.play().catch(err => console.log('Audio playback failed:', err));
    
    setTimeout(() => {
        const messageDisplay = document.querySelector('.message-display');
        messageDisplay.classList.add('fade-out');
        setTimeout(() => {
            localStorage.removeItem(messageId);
        }, 1000);
    }, 5000);
}

function startCountdown(expiryTime) {
    const updateCountdown = () => {
        const now = Date.now();
        const timeLeft = expiryTime - now;

        if (timeLeft <= 0) {
            countdownElement.textContent = 'Message has expired!';
            return;
        }

        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        let countdownText = 'Message expires in: ';
        if (minutes > 0) {
            countdownText += `${minutes}m `;
        }
        countdownText += `${seconds}s`;
        
        countdownElement.textContent = countdownText;
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    setTimeout(() => clearInterval(countdownInterval), expiryTime - Date.now());
}

function generateUniqueId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

checkForMessage(); 