<div align="center">

# 🛍️ UniThrift

### Buy Smart. Sell Smarter. Sustain Together.

**India's AI-Powered Student Marketplace**

*A secure, campus-exclusive platform where verified students buy and sell pre-owned items, backed by AI-generated product insights.*

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)]()
[![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)]()
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)]()
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=for-the-badge)]()

</div>

---

## Demo

| | |
|---|---|
| **Live Demo** | [Link](#) |
| **Demo Video** | [Link](#) |
| **Presentation** | [Link](#) |
| **Repository** | [github.com/Samriddha0207/UniThrift](https://github.com/Samriddha0207/UniThrift) |

## Project Highlights

- Student-only marketplace with college ID verification and verified seller profiles
- AI-generated product insights (Google Gemini) covering condition, damage, price fairness, and overall assessment
- Secure Supabase authentication with email/password and Google Sign-In
- Hybrid AI + human verification through a dedicated Admin Verification Panel
- Integrated buyer-seller chat linked directly to product listings
- Smart search, filters, and cart for a complete shopping flow
- Responsive, dark-themed interface built for desktop and mobile

## Table of Contents

- [Overview](#overview)
  - [The Problem](#the-problem)
  - [Our Solution](#our-solution)
  - [How UniThrift Compares](#how-unithrift-compares)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Security](#security)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Business Model](#business-model)
- [Impact](#impact)
- [Roadmap](#roadmap)
- [Team](#team)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [Support the Project](#support-the-project)

---

## Overview

Buying second-hand products is often difficult for students due to scams, fake listings, and the absence of a trusted, student-only platform. UniThrift addresses this by creating a secure ecosystem where verified college students can buy and sell products with confidence, giving unused items — textbooks, electronics, lab equipment, hostel essentials, furniture, bicycles, and gadgets — a second life.

### The Problem

Every academic year, students purchase products they only need temporarily, while seniors often struggle to resell or simply discard items still in good condition. Existing marketplaces make this worse:

- Anonymous sellers and unverified listings
- No student or identity verification
- Little trust between buyers and sellers
- No AI-assisted quality assessment
- High prices for essential items

The result: students overspend, usable products go to waste, and trust in online resale declines.

### Our Solution

UniThrift is a student-exclusive marketplace where trust is built through verification and AI:

- Verified student identities and a verified seller program
- Secure authentication via Supabase
- AI-generated product insights via Google Gemini
- Smart search and category filters
- Integrated buyer-seller communication
- A modern, responsive interface

### How UniThrift Compares

| Capability | Traditional Marketplace | UniThrift |
|---|:---:|:---:|
| Seller identity | Anonymous | ✅ Verified students |
| College verification | None | ✅ College ID verification |
| AI product assistance | None | ✅ Gemini AI insights |
| Seller trust | Limited | ✅ Verified seller badge |
| Platform scope | Generic, public | ✅ Student-only |
| Sustainability focus | None | ✅ Circular campus economy |
| Smart search | ✅ | ✅ |
| Modern UI | ⚠ Varies | ✅ |

---

## Features

UniThrift is organized around six pillars: authentication, discovery, AI-assisted trust, verification, communication, and checkout.

### Authentication & Registration

Sign-up and login are handled through **Supabase Authentication**, ensuring only registered users can access the platform.

- Email & password login, with Google Sign-In
- Registration via username, email, and password
- Secure session management and protected routes
- Password visibility toggle
- Foundation in place for future student ID verification at sign-up

<p align="center">
  <img src="screenshots/login.png" width="900" alt="Login Page">
</p>
<p align="center">
  <img src="screenshots/signup.png" width="900" alt="Signup Page">
</p>

### Marketplace & Product Pages

Once authenticated, students can browse a marketplace built specifically for campus needs, spanning books, electronics, hostel essentials, furniture, cycles, lab equipment, uniforms, and accessories.

- Smart search with category, condition, and price filters
- Responsive product cards with a dark-themed layout
- Add to cart directly from listings
- Detailed product pages with images, description, price, delivery date, warranty, payment details, seller information, verification status, buyer chat, and AI-generated insights

<p align="center">
  <img src="screenshots/marketplace.png" width="900" alt="Marketplace">
</p>
<p align="center">
  <img src="screenshots/product.png" width="900" alt="Product Page">
</p>

### AI Product Insights (Powered by Gemini)

Every listing is analyzed by **Google Gemini** to increase transparency and buyer confidence, generating an independent assessment rather than relying solely on the seller's own description.

```
Seller Uploads Product
         │
         ▼
Product Images + Description
         │
         ▼
   Google Gemini AI
         │
         ├──────────────► Product Summary
         ├──────────────► Condition Analysis
         ├──────────────► Damage Detection
         ├──────────────► Key Buying Points
         ├──────────────► Price Insights
         └──────────────► Overall Assessment
                      │
                      ▼
       AI Insights Displayed to Buyers
```

Gemini analyzes uploaded product images, the written description, visible damage, price reasonableness, and overall condition to produce an easy-to-understand assessment for buyers.

<p align="center">
  <img src="screenshots/ai-verification.png" width="900" alt="AI Product Insights">
</p>

### Profile, Verification & Admin Review

Every user has a personal dashboard for managing their identity, listings, and verification status — including college information, address, account status, and quick trading tips.

Through the **Verification Hub**, students upload a college ID card, PAN card, and payment QR code to become trusted, verified sellers. Because identity documents require oversight beyond automation, an **Admin Verification Panel** handles manual review when discrepancies are detected. Administrators can:

- Review College ID, PAN card, and payment QR submissions
- Approve or reject verification requests with remarks
- Request re-upload of unclear or invalid documents
- Flag suspicious documents and block fraudulent accounts from gaining seller privileges

This hybrid **AI + human verification** model minimizes fraud while ensuring genuine users aren't rejected due to image quality issues alone.

<p align="center">
  <img src="screenshots/profile.png" width="900" alt="Profile Dashboard">
</p>

### Buyer-Seller Communication

An integrated messaging system lets buyers and sellers communicate directly from the product page, with product-linked conversations and a verified-user indicator for added trust.

### Shopping Cart

A straightforward checkout flow: add or remove items, view shipping cost estimation and an order summary with total calculation, then proceed to checkout.

<p align="center">
  <img src="screenshots/cart.png" width="350" alt="Shopping Cart">
</p>

### User Experience & Design

The interface uses a dark, purple glassmorphism theme with smooth animations and clean navigation, fully responsive across desktop and mobile.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | Supabase |
| Artificial Intelligence | Google Gemini API |
| UI Design | Glassmorphism, responsive design |
| Version Control | Git & GitHub |
| Deployment | Vercel / Render *(planned)* |

## System Architecture

```
                        UniThrift
                             │
                             ▼
                  HTML • CSS • JavaScript
                             │
                             ▼
                    Node.js + Express.js
                             │
            ┌────────────────┴────────────────┐
            ▼                                  ▼
      MongoDB Database                Supabase Authentication
            │                                  │
            └────────────────┬─────────────────┘
                             ▼
                    Google Gemini API
                             │
                             ▼
             AI Product Insights & Verification
```

## Security

Security is addressed across three layers:

- **Authentication:** secure login, protected routes, session management, and Supabase-based access control
- **Seller verification:** college ID verification, PAN card upload, and payment QR verification
- **Marketplace safety:** AI-generated product insights, verified student profiles, verified seller badges, and secure buyer-seller communication

---

## Project Structure

```
UniThrift/
│
├── client/
│   ├── html/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── assets/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   └── server.js
│
├── screenshots/
│   ├── login.png
│   ├── signup.png
│   ├── marketplace.png
│   ├── product.png
│   ├── ai-verification.png
│   ├── profile.png
│   └── cart.png
│
├── package.json
├── .env
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Samriddha0207/UniThrift.git
cd UniThrift
```

### 2. Install dependencies

```bash
# Backend
npm install

# Frontend (if located in a separate folder)
cd client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and supply credentials for MongoDB, Supabase, and the Google Gemini API before starting the backend.

### 4. Run the backend

```bash
node server.js
```

### 5. Run the frontend

```bash
npm run dev
```

### 6. Access the application

With both servers running, open:

```
http://localhost:5173
```

*(or the port configured in your frontend setup)*

---

## Business Model

UniThrift is designed for multiple revenue streams while keeping the marketplace affordable for students.

- **Premium seller subscriptions:** priority listings, listing analytics, a seller dashboard, a featured badge, and unlimited product uploads
- **Featured listings:** paid promotion to the top of search results and category pages
- **Campus partnerships:** official campus marketplaces, hostel clearance sales, college merchandise, and student exchange or event marketplaces
- **Transaction services** *(future)*: a small convenience fee on successful transactions once secure online payments are integrated
- **Sponsored promotions:** targeted placements for electronics, books, stationery, coaching institutes, and student discounts
- **Future revenue opportunities:** AI-powered pricing recommendations, premium buyer memberships, campus ambassador programs, delivery partnerships, and subscription-based analytics

## Impact

- **Environmental:** reduces electronic waste and encourages reuse and sustainable consumption
- **Student:** lowers education and living costs, and improves access to study materials and electronics
- **Community:** enables trusted student-to-student transactions and stronger campus communities
- **Technological:** AI-assisted insights reduce fraud and improve trust in second-hand commerce

## Roadmap

### Phase 1 — Completed

Student marketplace, authentication, product listings, seller profiles, cart, and AI product insights.

### Phase 2 — In Progress

Online payments, real-time chat, push notifications, wishlist, and ratings & reviews.

### Phase 3 — Planned

Android and iOS apps, college-wise communities, delivery integration, a recommendation engine, and AI price prediction.

### Long-Term Vision

Expansion beyond individual campuses into a multi-college marketplace across India, with Razorpay/Stripe payment integration, location-based product discovery, personalized recommendations, delivery tracking, and real-time notifications.

---

## Team

- **Md Rizwaan Rahaman**
- **Samriddha Chaudhury**

## Acknowledgements

- **Google Gemini AI** for intelligent product analysis
- **Supabase** for secure authentication
- **MongoDB** for reliable data storage
- **Node.js & Express.js** for backend development
- Every student who inspired us to build a safer, more affordable marketplace

## License

**Copyright © 2026 Md Rizwaan Rahaman and Samriddha Chaudhury. All Rights Reserved.**

This repository and its contents — including source code, design assets, and documentation — are proprietary. No part of this project may be copied, modified, distributed, sublicensed, or used in any form without prior written permission from the copyright holders.

## Support the Project

If you found this project useful:

- Star this repository
- Fork the project
- Report issues
- Suggest improvements

---

<div align="center">

**Buy Smart. Sell Smarter. Sustain Together.**

Built by [Md Rizwaan Rahaman](#) and [Samriddha Chaudhury](#)

⭐ *If you liked this project, consider starring the repository* ⭐

</div>