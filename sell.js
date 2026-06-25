document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("unithrift_session_token");
    if (!token) { window.location.href = '/'; return; }

    // ======================================
    // IMAGE PREVIEW
    // ======================================
    const imageInput = document.getElementById("productImages");
    const previewContainer = document.getElementById("previewContainer");

    imageInput.addEventListener("change", () => {
        previewContainer.innerHTML = "";
        Array.from(imageInput.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.cssText = "width:100px;height:100px;object-fit:cover;border-radius:8px;margin:4px;";
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    // ======================================
    // FORM SUBMIT → UPLOAD IMAGES → CREATE LISTING WITH AI CHECK
    // ======================================
    const sellForm = document.getElementById("sellForm");
    const verificationStatus = document.getElementById("verificationStatus");

    sellForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = sellForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing & Running AI Checks...";
        verificationStatus.textContent = "Analyzing files and matching product characteristics...";

        const title           = document.getElementById("title").value.trim();
        const category        = document.getElementById("category").value;
        const price           = document.getElementById("price").value;
        const condition       = document.getElementById("condition").value;
        const description     = document.getElementById("description").value.trim();
        const collectionPoint = document.getElementById("collectionPoint").value.trim();
        const contactNo       = document.getElementById("contactNo").value.trim();
        const deliveryDate    = document.getElementById("deliveryDate").value;
        const paymentMethods  = document.getElementById("paymentMethods").value.trim();
        const files           = imageInput.files;

        try {
            // 1. Upload images via base64 stream
            let image_urls = [];

            if (files.length > 0) {
                verificationStatus.textContent = "Uploading images for model vision parsing...";

                const uploadPromises = Array.from(files).map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = async ev => {
                            try {
                                const res = await fetch('/api/listings/upload-image', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        name: file.name,
                                        type: file.type,
                                        data: ev.target.result.split(',')[1]
                                    })
                                });
                                const result = await res.json();
                                if (result.success) resolve(result.url);
                                else reject(result.message);
                            } catch (err) { reject(err); }
                        };
                        reader.readAsDataURL(file);
                    });
                });

                image_urls = await Promise.all(uploadPromises);
                verificationStatus.textContent = "🤖 Processing images through Gemini AI pipeline...";
            } else {
                throw new Error("You must upload at least one product picture for AI validation checks.");
            }

            // 2. Submit data to backend
            const res = await fetch('/api/listings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title, 
                    category, 
                    price, 
                    condition, 
                    description, 
                    collection_point: collectionPoint,
                    contact_no: contactNo,
                    delivery_date: deliveryDate, 
                    payment_methods: paymentMethods, 
                    image_urls 
                })
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            // Display verification results safely
            if (result.ai_status === "VERIFIED") {
                verificationStatus.innerHTML = "<span style='color: #10b981; font-weight:700;'>✅ VERIFIED: Passed validation!</span>";
                alert("Success! Your product passed AI verification and has been listed.");
                window.location.href = '/marketplace';
            } else {
                verificationStatus.innerHTML = `<span style='color: #ef4444; font-weight:700;'>⚠️ Issue Flagged: ${result.ai_status}</span>`;
                alert(`Listing created with issues flagged by AI:\n\n${result.ai_status}`);
                window.location.href = '/marketplace';
            }

        } catch (err) {
            console.error(err);
            verificationStatus.innerHTML = "❌ Failed: " + err.message;
            alert("Error: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Publish Listing";
        }
    });
});