// ======================================
// PRODUCT ID FROM URL
// ======================================
const params = new URLSearchParams(window.location.search); //[cite: 1]
const productId = params.get("id"); //[cite: 1]

// ======================================
// HTML ELEMENTS
// ======================================
const mainImage = document.getElementById("mainImage"); //[cite: 1]
const thumbnailContainer = document.getElementById("thumbnailContainer"); //[cite: 1]
const productTitle = document.getElementById("productTitle"); //[cite: 1]
const productPrice = document.getElementById("productPrice"); //[cite: 1]
const productCondition = document.getElementById("productCondition"); //[cite: 1]
const deliveryDate = document.getElementById("deliveryDate"); //[cite: 1]
const warranty = document.getElementById("warranty"); //[cite: 1]
const paymentMethods = document.getElementById("paymentMethods"); //[cite: 1]
const productDescription = document.getElementById("productDescription"); //[cite: 1]
const sellerInfo = document.getElementById("sellerInfo"); //[cite: 1]
const reviewsContainer = document.getElementById("reviewsContainer"); //[cite: 1]
const reviewForm = document.getElementById("reviewForm"); //[cite: 1]
const verificationInfo = document.getElementById("verificationInfo"); //[cite: 1]

// Modal Elements
const contactSellerBtn = document.getElementById("contactSellerBtn"); //[cite: 1]
const contactModal = document.getElementById("contactModal"); //[cite: 1]
const closeModal = document.getElementById("closeModal"); //[cite: 1]
const modalSellerDetails = document.getElementById("modalSellerDetails"); //[cite: 1]

// Chat Popup Elements
const chatWithSellerBtn = document.getElementById("chatWithSellerBtn"); //[cite: 1]
const chatPopup = document.getElementById("chatPopup"); //[cite: 1]
const closeChatBtn = document.getElementById("closeChatBtn"); //[cite: 1]
const chatForm = document.getElementById("chatForm"); //[cite: 1]
const chatInput = document.getElementById("chatInput"); //[cite: 1]
const chatMessages = document.getElementById("chatMessages"); //[cite: 1]
const chatSellerName = document.getElementById("chatSellerName"); //[cite: 1]

// Cache targets for async operations
let currentProduct = null; //[cite: 1]
let currentSeller = null; //[cite: 1]

// ======================================
// LOAD PRODUCT & DATA
// ======================================
async function loadProduct() {
  try {
    const response = await fetch(`/api/products/${productId}`); //[cite: 1]
    const result = await response.json(); //[cite: 1]
    if (!result.success) throw new Error("Product not found"); //[cite: 1]

    currentProduct = result.product; //[cite: 1]
    productTitle.textContent = currentProduct.title; //[cite: 1]
    productPrice.textContent = `₹${Number(currentProduct.price).toLocaleString('en-IN')}`; //[cite: 1]
    productCondition.textContent = `Condition: ${currentProduct.condition}`; //[cite: 1]
    deliveryDate.textContent = currentProduct.delivery_date || "Not specified"; //[cite: 1]
    warranty.textContent = currentProduct.warranty || "No warranty"; //[cite: 1]
    paymentMethods.textContent = currentProduct.payment_methods || "UPI"; //[cite: 1]
    productDescription.textContent = currentProduct.description; //[cite: 1]

    // Show sold banner if sold
    if (currentProduct.is_sold) { //[cite: 1]
        const soldBanner = document.createElement('div'); //[cite: 1]
        soldBanner.style.cssText = "background:#ef4444;color:white;text-align:center;padding:12px;font-weight:700;font-size:1.1rem;letter-spacing:2px;margin-bottom:16px;border-radius:10px;"; //[cite: 1]
        soldBanner.textContent = "⚠️ THIS ITEM HAS BEEN SOLD"; //[cite: 1]
        document.querySelector('.details-section').prepend(soldBanner); //[cite: 1]
        document.getElementById('addCartBtn').disabled = true; //[cite: 1]
        document.getElementById('addCartBtn').style.opacity = '0.4'; //[cite: 1]
        document.getElementById('addCartBtn').style.cursor = 'not-allowed'; //[cite: 1]
    }

    // Show Mark as Sold button if current user is the owner
    const token = localStorage.getItem("unithrift_session_token"); //[cite: 1]
    if (token && !currentProduct.is_sold) { //[cite: 1]
        try {
            const r = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } }); //[cite: 1]
            const d = await r.json(); //[cite: 1]
            if (d.success && d.profile?.id === currentProduct.user_id) { //[cite: 1]
                const markSoldBtn = document.createElement('button'); //[cite: 1]
                markSoldBtn.textContent = 'Mark as Sold'; //[cite: 1]
                markSoldBtn.style.cssText = "width:100%;margin-top:10px;padding:13px;border:none;border-radius:12px;background:#f59e0b;color:white;font-weight:700;font-size:1rem;cursor:pointer;transition:.2s;"; //[cite: 1]
                markSoldBtn.addEventListener('click', async () => { //[cite: 1]
                    if (!confirm("Mark this listing as sold? This cannot be undone.")) return; //[cite: 1]
                    markSoldBtn.textContent = "Marking..."; //[cite: 1]
                    markSoldBtn.disabled = true; //[cite: 1]
                    try {
                        const res = await fetch(`/api/products/${productId}/sold`, { //[cite: 1]
                            method: 'PATCH', //[cite: 1]
                            headers: { 'Authorization': `Bearer ${token}` } //[cite: 1]
                        });
                        const data = await res.json(); //[cite: 1]
                        if (!data.success) throw new Error(data.message); //[cite: 1]
                        window.location.reload(); //[cite: 1]
                    } catch (err) {
                        alert("Failed: " + err.message); //[cite: 1]
                        markSoldBtn.textContent = "Mark as Sold"; //[cite: 1]
                        markSoldBtn.disabled = false; //[cite: 1]
                    }
                });
                document.querySelector('.action-buttons').appendChild(markSoldBtn); //[cite: 1]
            }
        } catch (_) {}
    }

    // Render AI Verification Results dynamically
    renderAIVerification(currentProduct.ai_verification_status); //[cite: 1]

    // Load secondary references
    loadSeller(currentProduct.seller_id); //[cite: 1]
    loadImages(currentProduct.id); //[cite: 1]
    loadReviews(currentProduct.id); //[cite: 1]
  } catch (err) {
    console.error(err); //[cite: 1]
    productTitle.textContent = "Product Not Found"; //[cite: 1]
  }
}

function renderAIVerification(statusText) {
  if (!statusText) { //[cite: 1]
    verificationInfo.innerHTML = `<p style="color: #b5b5b5;">No verification log data exists for this item.</p>`; //[cite: 1]
    return; //[cite: 1]
  }

  if (statusText === "VERIFIED") { //[cite: 1]
    verificationInfo.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: #10b981; color: white; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">VERIFIED</span>
        <p style="margin: 0; color: #e5e7eb;">Product layout passes description metrics. No physical flaws detected.</p>
      </div>
    `; //[cite: 1]
    verificationInfo.style.borderLeft = "5px solid #10b981"; //[cite: 1]
  } else {
    verificationInfo.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div>
          <span style="background: #ef4444; color: white; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">FLAGGED ISSUE</span>
        </div>
        <p style="margin: 5px 0 0 0; color: #fca5a5; font-weight: 500;">${statusText}</p>
      </div>
    `; //[cite: 1]
    verificationInfo.style.borderLeft = "5px solid #ef4444"; //[cite: 1]
  }
}

async function loadSeller(sellerId) {
  try {
    const response = await fetch(`/api/user/${sellerId}`); //[cite: 1]
    const { success, seller } = await response.json(); //[cite: 1]
    if (!success) return; //[cite: 1]

    currentSeller = seller; //[cite: 1]
    sellerInfo.innerHTML = `
      <h3>${seller.username || seller.full_name || "Unknown Seller"}</h3>
      <p>College: ${seller.college_name || seller.college || "Not Added"}</p>
      <p>Location: ${seller.location_name || seller.location || "Not Added"}</p>
      <p>Verified Student: ${seller.student_verified ? "✅" : "❌"}</p>
      <p>Verified Seller: ${seller.seller_verified ? "✅" : "❌"}</p>
    `; //[cite: 1]
  } catch (err) {
    console.error(err); //[cite: 1]
  }
}

async function loadImages(id) {
  try {
    const response = await fetch(`/api/products/${id}/images`); //[cite: 1]
    const { images } = await response.json(); //[cite: 1]

    if (images && images.length > 0) { //[cite: 1]
      mainImage.src = images[0].image_url; //[cite: 1]
      thumbnailContainer.innerHTML = ""; //[cite: 1]

      images.forEach(img => { //[cite: 1]
        const thumb = document.createElement("img"); //[cite: 1]
        thumb.src = img.image_url; //[cite: 1]
        thumb.classList.add("thumb"); //[cite: 1]
        thumb.addEventListener("click", () => mainImage.src = img.image_url); //[cite: 1]
        thumbnailContainer.appendChild(thumb); //[cite: 1]
      });
    }
  } catch (err) {
    console.error(err); //[cite: 1]
  }
}

async function loadReviews(id) {
  try {
    const response = await fetch(`/api/products/${id}/reviews`); //[cite: 1]
    const { reviews } = await response.json(); //[cite: 1]
    reviewsContainer.innerHTML = ""; //[cite: 1]

    if (!reviews || reviews.length === 0) { //[cite: 1]
      reviewsContainer.innerHTML = `<div class="review-card">No reviews yet.</div>`; //[cite: 1]
      return; //[cite: 1]
    }

    reviews.forEach(review => { //[cite: 1]
      reviewsContainer.innerHTML += `
        <div class="review-card">
          <h4>${"⭐".repeat(review.rating)}</h4>
          <p>${review.review_text}</p>
        </div>
      `; //[cite: 1]
    });
  } catch (err) {
    console.error(err); //[cite: 1]
  }
}

// ======================================
// SUBMIT REVIEW
// ======================================
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault(); //[cite: 1]
  const token = localStorage.getItem("unithrift_session_token"); //[cite: 1]
  if (!token) return alert("Please login first."); //[cite: 1]

  const rating = document.getElementById("rating").value; //[cite: 1]
  const review_text = document.getElementById("reviewText").value; //[cite: 1]

  try {
    const response = await fetch(`/api/products/${productId}/reviews`, { //[cite: 1]
      method: 'POST', //[cite: 1]
      headers: {
        'Content-Type': 'application/json', //[cite: 1]
        'Authorization': `Bearer ${token}` //[cite: 1]
      },
      body: JSON.stringify({ 
        rating: Number(rating),  //[cite: 1]
        review_text: review_text //[cite: 1]
      })
    });

    const result = await response.json(); //[cite: 1]

    if (!response.ok) { //[cite: 1]
      throw new Error(result.message || "Failed to post"); //[cite: 1]
    }

    alert("Review submitted successfully!"); //[cite: 1]
    reviewForm.reset(); //[cite: 1]
    loadReviews(productId); //[cite: 1]
  } catch (err) {
    console.error("Submission Error:", err); //[cite: 1]
    alert(`Failed to submit review: ${err.message}`); //[cite: 1]
  }
});

// ======================================
// CONTACT SELLER MODAL INTERACTION
// ======================================
contactSellerBtn.addEventListener("click", () => {
  if (!currentProduct) { //[cite: 1]
    alert("Product data is loading. Please wait a moment."); //[cite: 1]
    return; //[cite: 1]
  }

  const sellerData = currentSeller?.seller || currentSeller; //[cite: 1]

  if (!sellerData) { //[cite: 1]
    alert("Seller details are unavailable right now."); //[cite: 1]
    return; //[cite: 1]
  }

  const sellerName = sellerData.full_name || sellerData.username || "Registered Student"; //[cite: 1]
  const sellerCollege = sellerData.college_name || "UniThrift Verified College"; //[cite: 1]
  
  const contactNumber = currentProduct.contact_no || currentProduct.phone_number || "Provided upon request"; //[cite: 1]
  const collectionPoint = currentProduct.collection_point || currentProduct.location_name || sellerData.location_name || "Campus Main Gate"; //[cite: 1]

  modalSellerDetails.innerHTML = `
    <div class="modal-item"><strong>Name:</strong> ${sellerName}</div>
    <div class="modal-item"><strong>College:</strong> ${sellerCollege}</div>
    <div class="modal-item"><strong>Contact No:</strong> ${contactNumber}</div>
    <div class="modal-item"><strong>Collection Point:</strong> ${collectionPoint}</div>
  `; //[cite: 1]
  contactModal.style.display = "flex"; //[cite: 1]
});

if (closeModal) { //[cite: 1]
  closeModal.addEventListener("click", () => {
    contactModal.style.display = "none"; //[cite: 1]
  });
}

window.addEventListener("click", (e) => {
  if (e.target === contactModal) { //[cite: 1]
    contactModal.style.display = "none"; //[cite: 1]
  }
});

// ======================================
// CHAT POPUP INTERACTION
// ======================================
chatWithSellerBtn.addEventListener("click", () => {
    const token = localStorage.getItem("unithrift_session_token"); //[cite: 1]
    if (!token) return alert("Please login to chat with the seller."); //[cite: 1]

    if (!currentProduct) { //[cite: 1]
        alert("Product data is loading. Please wait a moment."); //[cite: 1]
        return; //[cite: 1]
    }

    const sellerData = currentSeller?.seller || currentSeller; //[cite: 1]
    const sellerName = sellerData?.full_name || sellerData?.username || "Seller"; //[cite: 1]
    
    chatSellerName.textContent = `Chat with ${sellerName}`; //[cite: 1]
    chatPopup.style.display = "flex"; //[cite: 1]
    chatInput.focus(); //[cite: 1]
});

closeChatBtn.addEventListener("click", () => {
    chatPopup.style.display = "none"; //[cite: 1]
});

// UPDATED: Dynamic Direct Routing + Safety Archiving Form Submit handler
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault(); //[cite: 1]
    const text = chatInput.value.trim(); //[cite: 1]
    if (!text) return; //[cite: 1]

    if (!currentProduct || !currentProduct.seller_id) {
        alert("Routing failure: Seller configuration missing.");
        return;
    }

    const sellerId = currentProduct.seller_id; //[cite: 1]

    // 1. Render message to sender UI immediately for hyper-responsive connection
    const msgDiv = document.createElement("div"); //[cite: 1]
    msgDiv.classList.add("message", "sent"); //[cite: 1]
    msgDiv.textContent = text; //[cite: 1]
    chatMessages.appendChild(msgDiv); //[cite: 1]
    chatMessages.scrollTop = chatMessages.scrollHeight; //[cite: 1]
    chatInput.value = ""; //[cite: 1]

    try {
        // 2. BACKUP LOG: Archive the payload data to Supabase database metrics for safety verification
        // Adjust endpoint routing depending on your custom API configuration setup
        const safetyLoggingResponse = await fetch('/api/chats/archive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("unithrift_session_token")}`
            },
            body: JSON.stringify({
                product_id: productId, //[cite: 1]
                seller_id: sellerId,
                message: text
            })
        });

        // 3. REAL-TIME DELIVERY: Direct real-time client pipeline dispatch
        // If frontend client includes standard Supabase client global wrapper setup:
        if (typeof supabase !== 'undefined') {
            const dynamicDirectChannel = supabase.channel(`direct:${sellerId}`);
            await dynamicDirectChannel.send({
                type: 'broadcast',
                event: 'dm',
                payload: { msg: text, from_product: productId }
            });
        }

    } catch (err) {
        console.error("Hybrid delivery transmission pipeline error: ", err);
    }
});

// Initializer execution check
if (typeof productId !== 'undefined' && productId) { //[cite: 1]
  loadProduct(); //[cite: 1]
} else if (productTitle) { //[cite: 1]
  productTitle.textContent = "Invalid Product ID"; //[cite: 1]
}