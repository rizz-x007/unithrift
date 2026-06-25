// ======================================
// PRODUCT ID FROM URL
// ======================================
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// ======================================
// HTML ELEMENTS
// ======================================
const mainImage = document.getElementById("mainImage");
const thumbnailContainer = document.getElementById("thumbnailContainer");
const productTitle = document.getElementById("productTitle");
const productPrice = document.getElementById("productPrice");
const productCondition = document.getElementById("productCondition");
const deliveryDate = document.getElementById("deliveryDate");
const warranty = document.getElementById("warranty");
const paymentMethods = document.getElementById("paymentMethods");
const productDescription = document.getElementById("productDescription");
const sellerInfo = document.getElementById("sellerInfo");
const reviewsContainer = document.getElementById("reviewsContainer");
const reviewForm = document.getElementById("reviewForm");
const verificationInfo = document.getElementById("verificationInfo");

// Modal Elements
const contactSellerBtn = document.getElementById("contactSellerBtn");
const contactModal = document.getElementById("contactModal");
const closeModal = document.getElementById("closeModal");
const modalSellerDetails = document.getElementById("modalSellerDetails");

// Cache targets for async operations
let currentProduct = null;
let currentSeller = null;

// ======================================
// LOAD PRODUCT & DATA
// ======================================
async function loadProduct() {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const result = await response.json();
    if (!result.success) throw new Error("Product not found");

    currentProduct = result.product;
    productTitle.textContent = currentProduct.title;
    productPrice.textContent = `₹${currentProduct.price}`;
    productCondition.textContent = `Condition: ${currentProduct.condition}`;
    deliveryDate.textContent = currentProduct.delivery_date || "Not specified";
    warranty.textContent = currentProduct.warranty || "No warranty";
    paymentMethods.textContent = currentProduct.payment_methods || "UPI";
    productDescription.textContent = currentProduct.description;

    // Render AI Verification Results dynamically
    renderAIVerification(currentProduct.ai_verification_status);

    // Load secondary references
    loadSeller(currentProduct.seller_id);
    loadImages(currentProduct.id);
    loadReviews(currentProduct.id);
  } catch (err) {
    console.error(err);
    productTitle.textContent = "Product Not Found";
  }
}

function renderAIVerification(statusText) {
  if (!statusText) {
    verificationInfo.innerHTML = `<p style="color: #b5b5b5;">No verification log data exists for this item.</p>`;
    return;
  }

  if (statusText === "VERIFIED") {
    verificationInfo.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: #10b981; color: white; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">VERIFIED</span>
        <p style="margin: 0; color: #e5e7eb;">Product layout passes description metrics. No physical flaws detected.</p>
      </div>
    `;
    verificationInfo.style.borderLeft = "5px solid #10b981";
  } else {
    verificationInfo.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div>
          <span style="background: #ef4444; color: white; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">FLAGGED ISSUE</span>
        </div>
        <p style="margin: 5px 0 0 0; color: #fca5a5; font-weight: 500;">${statusText}</p>
      </div>
    `;
    verificationInfo.style.borderLeft = "5px solid #ef4444";
  }
}

async function loadSeller(sellerId) {
  try {
    const response = await fetch(`/api/user/${sellerId}`);
    const { success, seller } = await response.json();
    if (!success) return;

    currentSeller = seller;
    sellerInfo.innerHTML = `
      <h3>${seller.full_name}</h3>
      <p>College: ${seller.college || "Not Added"}</p>
      <p>Location: ${seller.location || "Not Added"}</p>
      <p>Verified Student: ${seller.student_verified ? "✅" : "❌"}</p>
      <p>Verified Seller: ${seller.seller_verified ? "✅" : "❌"}</p>
    `;
  } catch (err) {
    console.error(err);
  }
}

async function loadImages(id) {
  try {
    const response = await fetch(`/api/products/${id}/images`);
    const { images } = await response.json();

    if (images && images.length > 0) {
      mainImage.src = images[0].image_url;
      thumbnailContainer.innerHTML = "";

      images.forEach(img => {
        const thumb = document.createElement("img");
        thumb.src = img.image_url;
        thumb.classList.add("thumb");
        thumb.addEventListener("click", () => mainImage.src = img.image_url);
        thumbnailContainer.appendChild(thumb);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadReviews(id) {
  try {
    const response = await fetch(`/api/products/${id}/reviews`);
    const { reviews } = await response.json();
    reviewsContainer.innerHTML = "";

    if (!reviews || reviews.length === 0) {
      reviewsContainer.innerHTML = `<div class="review-card">No reviews yet.</div>`;
      return;
    }

    reviews.forEach(review => {
      reviewsContainer.innerHTML += `
        <div class="review-card">
          <h4>${"⭐".repeat(review.rating)}</h4>
          <p>${review.review_text}</p>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

// ======================================
// SUBMIT REVIEW (FIXED FRONTEND CODE)
// ======================================
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("unithrift_session_token");
  if (!token) return alert("Please login first.");

  const rating = document.getElementById("rating").value;
  const review_text = document.getElementById("reviewText").value; // Changed to match snake_case variables safely

  try {
    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        rating: Number(rating), 
        review_text: review_text // Cleanly passes down to your server.js req.body
      })
    });

    const result = await response.json(); // Read the server's response payload

    if (!response.ok) {
      // Instead of a generic alert, this alerts the EXACT error reason sent by your Express backend
      throw new Error(result.message || "Failed to post");
    }

    alert("Review submitted successfully!");
    reviewForm.reset();
    loadReviews(productId);
  } catch (err) {
    console.error("Submission Error:", err);
    alert(`Failed to submit review: ${err.message}`);
  }
});
// ======================================
// CONTACT SELLER MODAL INTERACTION
// ======================================
contactSellerBtn.addEventListener("click", () => {
  if (!currentProduct || !currentSeller) {
    alert("Seller data is loading. Please wait a moment.");
    return;
  }
  modalSellerDetails.innerHTML = `
    <div class="modal-item"><strong>Name:</strong> ${currentSeller.full_name}</div>
    <div class="modal-item"><strong>College:</strong> ${currentSeller.college || "Not Specified"}</div>
    <div class="modal-item"><strong>Contact No:</strong> ${currentProduct.contact_no || "Not Specified"}</div>
    <div class="modal-item"><strong>Collection Point:</strong> ${currentProduct.collection_point || "Not Specified"}</div>
  `;
  contactModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  contactModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === contactModal) {
    contactModal.style.display = "none";
  }
});

if (productId) loadProduct();
else productTitle.textContent = "Invalid Product ID";
