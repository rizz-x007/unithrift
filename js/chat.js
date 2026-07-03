// 1. Declare the global states (Keys will be pulled dynamically from your .env via your API)
let supabase = null;
let currentUserId = null;

// Parse the unique Room ID parameter from the URL string
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room_id");

// 2. DOM Node Extractions
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const imageUpload = document.getElementById("imageUpload");
const voiceMemoBtn = document.getElementById("voiceMemoBtn");

const chatHeaderName = document.getElementById("chatHeaderName");
const chatProductBadge = document.getElementById("chatProductBadge");
const sidebarSellerName = document.getElementById("sidebarSellerName");
const sidebarProductTitle = document.getElementById("sidebarProductTitle");

let isRecording = false;

// 3. Workspace Core Initialization
async function initChatWorkspace() {
    if (!roomId) {
        chatHeaderName.textContent = "Error: Room ID Missing";
        return;
    }

    try {
        // Fetch environmental values securely from your Express server .env endpoint
        const configRes = await fetch('/api/supabase-config');
        const config = await configRes.json();
        
        // Initialize the browser client instance dynamically
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

        // Authenticate user session parameters
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            alert("Please log in to access your chat workspace.");
            window.location.href = "/login.html";
            return;
        }
        currentUserId = user.id;

        // Pull corresponding row record metadata from chat_rooms
        const { data: room, error: roomError } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('id', roomId)
            .single();

        if (roomError || !room) {
            console.error("Room missing or accessible validation failure:", roomError);
            chatHeaderName.textContent = "Error Loading Conversation";
            return;
        }

        // Determine who the incoming user is relative to the active student session
        const targetUserId = (currentUserId === room.buyer_id) ? room.seller_id : room.buyer_id;

        // Fetch user profiles and item descriptions using existing system routes
        await fetchContextData(room.product_id, targetUserId);

        // Populate historical messaging streams and activate live synchronization
        await loadMessageHistory();
        setupRealtimeSubscription();

    } catch (err) {
        console.error("Workspace boot sequence execution failure:", err);
    }
}

// Re-uses your established workspace data hooks to mount layout titles
async function fetchContextData(productId, targetUserId) {
    try {
        const prodRes = await fetch(`/api/products/${productId}`);
        const prodData = await prodRes.json();
        if (prodData.success) {
            chatProductBadge.textContent = prodData.product.title;
            sidebarProductTitle.textContent = prodData.product.title;
        }

        const userRes = await fetch(`/api/user/${targetUserId}`);
        const userData = await userRes.json();
        
        const profile = userData.seller?.seller || userData.seller || userData.profile;
        const targetName = profile?.username || profile?.full_name || "Verified Student";

        chatHeaderName.textContent = targetName;
        sidebarSellerName.textContent = targetName;

    } catch (err) {
        console.error("Error setting chat context parameters:", err);
        chatHeaderName.textContent = "Chat Workspace";
    }
}

// Queries database table historical logs
async function loadMessageHistory() {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Could not fetch log history rows:", error);
        return;
    }

    messages.forEach(msg => {
        const type = (msg.sender_id === currentUserId) ? 'outgoing' : 'incoming';
        appendMessage(type, msg.message_text, 'text');
    });
}

// Subscribes your browser tab to live database changes via Supabase Realtime Channels
function setupRealtimeSubscription() {
    supabase
        .channel(`room-${roomId}`)
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
            (payload) => {
                // If message row originates from external peer, append it immediately to UI view
                if (payload.new.sender_id !== currentUserId) {
                    appendMessage('incoming', payload.new.message_text, 'text');
                }
            }
        )
        .subscribe();
}

// Builds layout node architecture on the fly
function appendMessage(type, content, attachmentType = 'text') {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type);

    let bubbleContent = "";

    if (attachmentType === 'text') {
        bubbleContent = `<div class="msg-bubble">${content}</div>`;
    } else if (attachmentType === 'image') {
        bubbleContent = `
            <div class="msg-bubble" style="padding: 8px;">
                <img src="${content}" class="msg-img" alt="Shared Image Attachment">
            </div>`;
    } else if (attachmentType === 'voice') {
        bubbleContent = `
            <div class="msg-bubble">
                <div class="voice-memo-wrapper">
                    <button type="button" class="voice-play-btn">▶</button>
                    <div class="voice-wave-mock"></div>
                    <span style="font-size:0.75rem; color:var(--secondary); min-width:35px;">0:04</span>
                </div>
            </div>`;
    }

    msgDiv.innerHTML = bubbleContent;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Message submission handling intercept pipeline
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const textValue = messageInput.value.trim();
    if (!textValue || !currentUserId) return;

    // Append visually instantly for lag-free performance user validation feel
    appendMessage('outgoing', textValue, 'text');
    messageInput.value = "";

    // Transmit row record straight into your live Supabase database
    const { error } = await supabase
        .from('messages')
        .insert({
            room_id: roomId,
            sender_id: currentUserId,
            message_text: textValue
        });

    if (error) {
        console.error("Supabase live storage write exception occurred:", error);
    }
});

// Structural attachments file reference reads
imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        appendMessage('outgoing', event.target.result, 'image');
    };
    reader.readAsDataURL(file);
    imageUpload.value = "";
});

voiceMemoBtn.addEventListener("click", () => {
    if (!isRecording) {
        isRecording = true;
        voiceMemoBtn.classList.add("recording");
        messageInput.placeholder = "Recording audio note... click mic again to send";
        messageInput.disabled = true;
    } else {
        isRecording = false;
        voiceMemoBtn.classList.remove("recording");
        messageInput.placeholder = "Type your message here...";
        messageInput.disabled = false;
        
        appendMessage('outgoing', null, 'voice');
    }
});

document.addEventListener("DOMContentLoaded", initChatWorkspace);
// 1. Initialize Supabase with your PUBLIC Anon keys
// (It is safe for users to see these keys if your RLS policies are set up correctly)
const SUPABASE_URL = "https://ghqsxiuqbsiohsgdzjsn.supabase.co";
const SUPABASE_ANON_KEY = "your-public-anon-key-hereeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocXN4aXVxYnNpb2hzZ2R6anNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzQyMDAsImV4cCI6MjA5NzExMDIwMH0.HhtWjqTyglHEVvzedpITE9lyg-c9djNzbpdFOekGk4c";

// If you are using a bundler (like Vite/Webpack), you can use environment variables:
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// --- HELPER FUNCTION: Encrypts the raw file data ---
async function encryptFile(file, secretRoomKey) {
  const fileBuffer = await file.arrayBuffer();
  const enc = new TextEncoder();
  
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(secretRoomKey), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  
  const aesKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("fixed-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv }, aesKey, fileBuffer
  );

  const combinedBuffer = new Uint8Array(iv.length + ciphertext.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(ciphertext), iv.length);

  return new Blob([combinedBuffer]);
}

// --- MAIN FUNCTION: Formats path and uploads to Supabase ---
async function uploadChatFile(file, roomId, secretRoomKey) {
  try {
    // Dynamically load supabase from the global window object loaded via HTML script tag
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const uuid = window.crypto.randomUUID();
    const originalExtension = file.name.split('.').pop();
    const targetPath = `${roomId}/${uuid}.${originalExtension}.enc`;

    // Scramble file locally
    const encryptedBlob = await encryptFile(file, secretRoomKey);

    // Upload directly from browser to your private bucket
    const { data, error } = await supabaseClient.storage
      .from('chat-files')
      .upload(targetPath, encryptedBlob, {
        contentType: 'application/octet-stream',
        upsert: false
      });

    if (error) throw error;
    console.log("Uploaded successfully to:", data.path);
    return data.path;

  } catch (error) {
    console.error("Encryption/Upload failed:", error.message);
  }
}
