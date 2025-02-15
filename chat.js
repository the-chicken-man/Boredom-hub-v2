// Initialize Ably Chat
const ably = new Ably.Realtime('mGqA8g.tKm8cg:BXet5NQMtxfr8k8I4Ls0MEzeQxmsQHihc80xDsYd-Ko');
const channel = ably.channels.get('boredom-hub-chat');

const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const userTabs = document.getElementById('user-tabs');

let userEmail = "";
let username = "";
let mutedUsers = {};

const roles = {
    headDev: '856030@dpsk12.net',
    devs: ['866537@dpsk12.net', '871491@dpsk12.net'],
    mods: [] // Add mod emails here
};

// Login System
document.getElementById('login').addEventListener('submit', (e) => {
    e.preventDefault();
    userEmail = emailInput.value.trim();
    username = usernameInput.value.trim();
    if (!userEmail || !username) return alert('Enter valid email and username.');

    document.getElementById('login-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    setupUserBanner();
});

function setupUserBanner() {
    let banner = document.createElement('div');
    banner.classList.add('banner');
    if (userEmail === roles.headDev) {
        banner.textContent = 'HEAD DEV';
        banner.style.backgroundColor = 'green';
    } else if (roles.devs.includes(userEmail)) {
        banner.textContent = 'DEV';
        banner.style.backgroundColor = 'red';
    } else if (roles.mods.includes(userEmail)) {
        banner.textContent = 'MOD';
        banner.style.backgroundColor = 'yellow';
    }
    if (banner.textContent) document.body.prepend(banner);
}

// Send Messages
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
sendButton.addEventListener('click', sendMessage);

function sendMessage() {
    if (mutedUsers[userEmail]) return alert('You are muted!');
    const text = messageInput.value.trim();
    if (!text) return;

    channel.publish('message', {
        username, userEmail: shouldHideEmail(userEmail) ? 'Hidden' : userEmail, text
    });
    messageInput.value = '';
}

function shouldHideEmail(email) {
    return roles.headDev === email || roles.devs.includes(email) || roles.mods.includes(email);
}

// Receive Messages
channel.subscribe('message', (msg) => {
    if (!msg.data) return;
    displayMessage(msg.data);
});

function displayMessage({ username, userEmail, text }) {
    let div = document.createElement('div');
    div.classList.add('message');
    
    if (roles.headDev === userEmail || roles.devs.includes(userEmail) || roles.mods.includes(userEmail)) {
        div.innerHTML = `<b>${username}:</b> ${text}`;
    } else {
        div.innerHTML = `<b>${username} (${userEmail}):</b> ${text}`;
    }
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    checkForMentions(username, text);
}

// Private Messages with @username
function checkForMentions(sender, text) {
    const match = text.match(/@(\w+)/);
    if (match) {
        let targetUser = match[1];
        createPrivateTab(targetUser, sender, text);
    }
}

function createPrivateTab(user, sender, text) {
    let tab = document.getElementById(`tab-${user}`);
    if (!tab) {
        tab = document.createElement('div');
        tab.id = `tab-${user}`;
        tab.classList.add('private-tab');
        tab.innerHTML = `<h3>Private Chat with ${user}</h3><div class='private-messages'></div>`;
        userTabs.appendChild(tab);
    }
    tab.querySelector('.private-messages').innerHTML += `<p><b>${sender}:</b> ${text}</p>`;
}

// Mute System
channel.subscribe('mute', (msg) => {
    if (msg.data && msg.data.targetEmail) {
        mutedUsers[msg.data.targetEmail] = true;
        setTimeout(() => delete mutedUsers[msg.data.targetEmail], 20 * 60 * 1000);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && messageInput.value.startsWith('/mute ')) {
        let targetEmail = messageInput.value.split(' ')[1];
        if (userEmail === roles.headDev || roles.devs.includes(userEmail) || roles.mods.includes(userEmail)) {
            channel.publish('mute', { targetEmail });
            alert(`${targetEmail} has been muted for 20 minutes.`);
        } else {
            alert('You do not have permission to mute users.');
        }
        messageInput.value = '';
        e.preventDefault();
    }
});
