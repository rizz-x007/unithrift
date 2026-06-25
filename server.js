const express = require('express');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// =========================================================================
// 1. SUPABASE CONFIGURATION
// =========================================================================
const SUPABASE_URL = 'https://ghqsxiuqbsiohsgdzjsn.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocXN4aXVxYnNpb2hzZ2R6anNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzQyMDAsImV4cCI6MjA5NzExMDIwMH0.HhtWjqTyglHEVvzedpITE9lyg-c9djNzbpdFOekGk4c'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================================================= 
// 2. MIDDLEWARE (Explicitly loaded first!) 
// ========================================================================= 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true })); 

// Force Express to serve these subfolders globally from the root 
app.use('/css', express.static(path.join(__dirname, 'css'))); 
app.use('/js', express.static(path.join(__dirname, 'js'))); 
app.use('/images', express.static(path.join(__dirname, 'images')));

// =========================================================================
// 3. FRONTEND ROUTES (Pointing cleanly to root files)
// =========================================================================
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

app.get('/marketplace', (req, res) => {
    res.sendFile(path.join(__dirname, 'marketplace.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'product.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/sell', (req, res) => {
    res.sendFile(path.join(__dirname, 'sell.html'));
});

// =========================================================================
// 4. BACKEND API ROUTES
// =========================================================================

// ---- SECURE PROFILE GET ----
app.get('/api/profile', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Invalid session");

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        return res.json({ 
            success: true, 
            username: user.user_metadata?.username || "User", 
            email: user.email, 
            profile: profile || {} 
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ---- GET SELLER INFORMATION (FIXED EXPLICIT RETURN) ----
app.get('/api/user/:id', async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.params.id)
            .maybeSingle();

        if (error) throw error;
        if (!profile) {
            return res.status(404).json({ success: false, message: "Seller profile not found" });
        }

        return res.json({ success: true, seller: profile });
    } catch (error) {
        console.error("GET User Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- REFRESH TOKEN ----
app.post('/api/auth/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ success: false, message: "No refresh token provided" });
    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });
        if (error || !data.session) throw new Error(error?.message || "Refresh failed");
        return res.json({
            success: true,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
});

// ---- SAVE PROFILE ----
app.post('/api/profile/save', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { college_name, location_name, address } = req.body;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ success: false, message: "Unauthorized" });
        
        const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id, 
                college_name, 
                location_name, 
                address,
                updated_at: new Date()
            });

        if (error) throw error;
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- AVATAR UPLOAD ----
app.post('/api/profile/avatar', upload.single('avatar'), async (req, res) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
        const fileName = `${user.id}_avatar_${Date.now()}_${req.file.originalname}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date() });
        if (updateError) throw updateError;

        return res.json({ success: true, url: publicUrl });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- STUDENT VERIFICATION UPLOAD ----
app.post('/api/profile/verify/student', upload.single('collegeId'), async (req, res) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
        const fileName = `${user.id}_college_id_${Date.now()}_${req.file.originalname}`;

        const { error: uploadError } = await supabase.storage
            .from('verification')
            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('verification').getPublicUrl(fileName);

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, college_id_url: publicUrl, student_verified: false, updated_at: new Date() });
        if (updateError) throw updateError;

        return res.json({ success: true, url: publicUrl });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- SELLER VERIFICATION UPLOAD ----
app.post('/api/profile/verify/seller', upload.fields([{ name: 'panCard', maxCount: 1 }, { name: 'paymentQr', maxCount: 1 }]), async (req, res) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!req.files || !req.files.panCard || !req.files.paymentQr) throw new Error("Missing files");

        const panFile = req.files.panCard[0];
        const panFileName = `${user.id}_pan_${Date.now()}_${panFile.originalname}`;
        const { error: panError } = await supabase.storage
            .from('verification')
            .upload(panFileName, panFile.buffer, { contentType: panFile.mimetype, upsert: true });
        if (panError) throw panError;

        const qrFile = req.files.paymentQr[0];
        const qrFileName = `${user.id}_qr_${Date.now()}_${qrFile.originalname}`;
        const { error: qrError } = await supabase.storage
            .from('verification')
            .upload(qrFileName, qrFile.buffer, { contentType: qrFile.mimetype, upsert: true });
        if (qrError) throw qrError;

        const { data: { publicUrl: panUrl } } = supabase.storage.from('verification').getPublicUrl(panFileName);
        const { data: { publicUrl: qrUrl  } } = supabase.storage.from('verification').getPublicUrl(qrFileName);

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, pan_url: panUrl, payment_qr_url: qrUrl, seller_verified: false, updated_at: new Date() });
        if (updateError) throw updateError;

        return res.json({ success: true, pan_url: panUrl, qr_url: qrUrl });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- MY LISTINGS ----
app.get('/api/profile/my-listings', async (req, res) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);

        const { data: products, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (productError) throw productError;

        const productIds = (products || []).map(p => p.id);
        let imageMap = {};
        if (productIds.length > 0) {
            const { data: images } = await supabase
                .from('product_images')
                .select('product_id, image_url')
                .in('product_id', productIds);
            (images || []).forEach(img => {
                if (!imageMap[img.product_id]) imageMap[img.product_id] = img.image_url;
            });
        }

        const productsWithImages = (products || []).map(p => ({
            ...p,
            image_url: imageMap[p.id] || "https://placehold.co/600x400?text=UniThrift"
        }));

        return res.json({ success: true, products: productsWithImages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- GOOGLE OAUTH INIT ----
app.post('/api/auth/google', async (req, res) => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'http://localhost:3000/marketplace', 
            },
        });
        if (error) throw error;
        return res.json({ success: true, url: data.url });
    } catch (error) {
        console.error("Google Auth Initialization Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- SIGNUP ----
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: { 
                    username: username.toLowerCase().trim() 
                }
            }
        });

        if (error) throw error;
        return res.status(201).json({ 
            success: true, 
            message: "Registration successful! You can now log in." 
        });
    } catch (error) {
        console.error("Supabase Signup Error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ---- DUAL LOGIN ENDPOINT ----
app.post('/api/login', async (req, res) => {
    const { loginIdentifier, password } = req.body;
    let targetEmail = loginIdentifier.trim();

    try {
        if (!targetEmail.includes('@')) {
            const { data: emailResult, error: searchError } = await supabase
                .rpc('get_email_by_username', { search_username: targetEmail.toLowerCase() });

            if (searchError || !emailResult) {
                return res.status(400).json({ success: false, message: "No account found matching that username." });
            }
            targetEmail = emailResult;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password,
        });

        if (error) throw error;

        const authToken = data.session?.access_token;

        if (!authToken) {
            return res.status(400).json({ 
                success: false, 
                message: "Login successful, but failed to generate a secure session token." 
            });
        }

        return res.json({ 
            success: true, 
            message: "Welcome back to UniThrift!", 
            token: authToken 
        });
    } catch (error) {
        console.error("Supabase Password Login Error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ---- FETCH SINGLE PRODUCT ----
app.get('/api/products/:id', async (req, res) => {
    try {
        const { data: product, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        return res.json({ success: true, product });
    } catch (error) { 
        return res.status(404).json({ success: false, message: error.message }); 
    }
});

// ---- FETCH PRODUCT IMAGES ----
app.get('/api/products/:id/images', async (req, res) => {
    try {
        const { data: images, error } = await supabase.from('product_images').select('*').eq('product_id', req.params.id);
        if (error) throw error;
        return res.json({ success: true, images: images || [] });
    } catch (error) { 
        return res.status(500).json({ success: false, message: error.message }); 
    }
});

// ---- FETCH PRODUCT REVIEWS ----
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', req.params.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return res.json({ success: true, reviews: reviews || [] });
    } catch (error) { 
        console.error("GET Reviews Error:", error.message);
        return res.status(500).json({ success: false, message: error.message }); 
    }
});

// ---- POST REVIEW (FIXED RESILIENT MUTATION) ----
app.post('/api/products/:id/reviews', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.split(' ')[1];
        
        if (!token) return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ success: false, message: "Invalid session token" });

        const { rating, review_text } = req.body;

        // Safer mutation design to avoid blocking foreign key constraints during immediate reads
        const { data: insertedData, error } = await supabase
            .from('reviews')
            .insert([
                { 
                    product_id: req.params.id, 
                    user_id: user.id, 
                    rating: Number(rating), 
                    review_text: review_text 
                }
            ])
            .select();

        if (error) throw error;

        const newReview = (insertedData && insertedData.length > 0) ? insertedData[0] : null;
        return res.json({ success: true, review: newReview });
    } catch (error) {
        console.error("POST Review Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ---- CREATE LISTING ----
app.post('/api/listings/create', async (req, res) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        const { title, category, price, condition, description, delivery_date, payment_methods, image_urls } = req.body;
        
        const { data: product, error } = await supabase
            .from('products')
            .insert({ user_id: user.id, title, category, price: Number(price), condition, description, delivery_date, payment_methods })
            .select()
            .single();
            
        if (error) throw error;
        if (image_urls && image_urls.length > 0) {
            await supabase.from('product_images').insert(image_urls.map(url => ({ product_id: product.id, image_url: url })));
        }
        return res.json({ success: true, product });
    } catch (error) { 
        return res.status(500).json({ success: false, message: error.message }); 
    }
});

// ---- UPLOAD LISTING IMAGE ----
app.post('/api/listings/upload-image', async (req, res) => {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        const { name, type, data } = req.body;
        const buffer = Buffer.from(data, 'base64');
        const fileName = `${user.id}_${Date.now()}_${name}`;
        
        const { error } = await supabase.storage.from('product-images').upload(fileName, buffer, { contentType: type, upsert: false });
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return res.json({ success: true, url: publicUrl });
    } catch (error) { 
        return res.status(500).json({ success: false, message: error.message }); 
    }
});

// =========================================================================
// 5. START SERVER (Kept strictly at the bottom)
// =========================================================================
app.listen(PORT, () => {
    console.log(`🚀 UniThrift Server running at http://localhost:${PORT}`);
});