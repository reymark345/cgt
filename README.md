# GRANTS (Grants Registry And Navigation Tracking System)

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-1.x-9553E9?style=flat&logo=inertia)](https://inertiajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PHP](https://img.shields.io/badge/PHP-%5E8.2-777BB4?style=flat&logo=php)](https://php.net)

**GRANTS** (**G**rants **R**egistry **A**nd **N**avigation **T**racking **S**ystem) is a web-based management and verification platform engineered for 4Ps (Pantawid Pamilyang Pilipino Program) operations. It delivers a consolidated 360° inquiry interface, high-volume database management (Grantee Master List, LandBank EMV Cash Cards, and Payroll Disbursals), transmittal printing with zoom/scale preview, and workflow tracking across 8 service request types.

---

## Table of Contents

- [Project Requirements](#project-requirements)
  - [Server & Runtime Environment](#server--runtime-environment)
  - [Required PHP Extensions](#required-php-extensions)
  - [Recommended php.ini Configuration](#recommended-phpini-configuration)
  - [Database Requirements](#database-requirements)
  - [Node.js & Frontend Tooling](#nodejs--frontend-tooling)
- [Technology Stack](#technology-stack)
- [System Architecture & Modules](#system-architecture--modules)
  - [1. Reference Databases](#1-reference-databases)
  - [2. 360° Household Record Inquiry](#2-360-household-record-inquiry)
  - [3. Request Management Modules (8 Workflows)](#3-request-management-modules-8-workflows)
  - [4. Transmittal Printing & Document Engine](#4-transmittal-printing--document-engine)
  - [5. Authentication & SSO Integration](#5-authentication--sso-integration)
- [Installation & Setup Guide](#installation--setup-guide)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Environment Configuration](#step-2-environment-configuration)
  - [Step 3: Install PHP Dependencies](#step-3-install-php-dependencies)
  - [Step 4: Install Node.js Dependencies](#step-4-install-nodejs-dependencies)
  - [Step 5: Generate Application Key](#step-5-generate-application-key)
  - [Step 6: Run Database Migrations](#step-6-run-database-migrations)
  - [Step 7: Storage Linking](#step-7-storage-linking)
  - [Step 8: Start the Application](#step-8-start-the-application)
- [Build & Deployment Commands](#build--deployment-commands)
- [Queue & Large Dataset Processing](#queue--large-dataset-processing)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Project Requirements

### Server & Runtime Environment

| Requirement | Minimum Version | Recommended Version | Notes |
| :--- | :--- | :--- | :--- |
| **PHP** | `8.2.0` | `8.2.x` or `8.3.x` | CLI and Web SAPI |
| **Composer** | `2.2.0` | `2.8.x+` | Dependency manager |
| **Node.js** | `18.20.0` (LTS) | `20.x` or `22.x` (LTS) | For Vite asset compilation |
| **npm** | `9.0.0` | `10.x+` | Bundled with Node.js |
| **MySQL / MariaDB** | MySQL `8.0+` / MariaDB `10.4+` | MySQL `8.4+` / MariaDB `10.11+` | With InnoDB engine & `utf8mb4` |
| **Web Server** | Any compatible | **Laragon** (Windows) / Nginx / Apache | Supports URL rewriting and HTTPS |

### Required PHP Extensions

The following PHP extensions must be enabled in your `php.ini`:

- `bcmath` &mdash; High-precision financial and amount calculations
- `ctype` &mdash; Character type checking
- `curl` &mdash; External API integration (Caraga SSO / Caraga Portal)
- `dom` &mdash; Document Object Model support
- `fileinfo` &mdash; MIME-type detection for spreadsheet/CSV uploads
- `filter` &mdash; Input validation and sanitization
- `gd` or `imagick` &mdash; Image processing for profile photos & signatures
- `intl` &mdash; Internationalization and date formatting
- `json` &mdash; JSON encoding and decoding
- `libxml` &mdash; XML document handling
- `mbstring` &mdash; Multi-byte string manipulation
- `openssl` &mdash; Encrypted HTTPS and SSO OAuth token handling
- `pcre` &mdash; Perl-compatible regular expressions
- `PDO` & `pdo_mysql` &mdash; Database connectivity
- `session` &mdash; Session management
- `tokenizer` &mdash; PHP script tokenizing
- `xml`, `xmlreader`, `xmlwriter` &mdash; Parsing large XML and spreadsheet datasets
- `zip` &mdash; Processing `.xlsx` archive formats

### Recommended php.ini Configuration

Because GRANTS handles large bulk data uploads (such as regional Grantee masterlists, EMV distribution registries, and payroll cycle files), ensure your `php.ini` has adequate limits:

```ini
; Maximum allowed size for uploaded files
upload_max_filesize = 512M

; Maximum size of POST data that PHP will accept
post_max_size = 512M

; Maximum amount of memory a script may consume
memory_limit = 1024M

; Maximum execution time of each script, in seconds
max_execution_time = 600

; Maximum amount of time each script may spend parsing request data
max_input_time = 600

; Maximum input variables (helps with wide batch forms)
max_input_vars = 10000
```

> **Laragon Note**: You can edit `php.ini` directly via **Laragon Menu &rarr; PHP &rarr; php.ini**, make the changes, and restart Apache/Nginx.

### Database Requirements

- **Database Engine**: InnoDB (required for transactions and foreign keys).
- **Default Charset**: `utf8mb4`
- **Default Collation**: `utf8mb4_unicode_ci` or `utf8mb4_0900_ai_ci`
- **Recommended Database Name**: `cgt` (configured in `.env`)
- **SQL Mode**: Standard Laravel 11 MySQL configuration (strict mode compatible).

### Node.js & Frontend Tooling

- Node.js LTS (`^18.20.0` or `^20.0.0+`)
- Vite `5.4.x` with `@vitejs/plugin-react` and `@tailwindcss/vite`
- Modern browser support: Chrome 90+, Edge 90+, Firefox 90+, Safari 15+

---

## Technology Stack

### Backend
- **Framework**: [Laravel 11.x](https://laravel.com/)
- **SPA Adapter**: [Inertia.js Laravel](https://inertiajs.com/) (`^1.3`)
- **Database Layer**: Eloquent ORM with batch/chunk import processing
- **Authentication**: DSWD Caraga Connect Single Sign-On (SSO / OAuth 2.0) and Caraga Portal Employee Directory API

### Frontend
- **UI Library**: [React 18.x](https://react.dev/) (`react`, `react-dom`)
- **Language**: [TypeScript 5.7+](https://www.typescriptlang.org/)
- **Routing & State**: [Inertia.js React](https://inertiajs.com/) (`@inertiajs/react`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables
- **UI Components**: shadcn/ui design patterns, Radix UI Primitives (`@radix-ui/react-slot`)
- **Icons**: [Lucide React](https://lucide.dev/) (`lucide-react`)
- **Bundler**: [Vite 5.x](https://vitejs.dev/) with Fast Refresh

---

## System Architecture & Modules

### 1. Reference Databases
- **Grantee Master Details**: Comprehensive registry with beneficiary demographics, addresses, client status, and entry IDs. Includes asynchronous batch import for `.csv`, `.xlsx`, `.xls`, `.txt`, `.xml` files.
- **EMV Database & Cash Cards**: Detailed LandBank cash card records. Supports multiple linked cards per household, servicing branches, run dates, claimed/unclaimed tracking, and action-taken logs.
- **Payroll & Disbursal History**: Complete disbursement tracking per period/cycle. Breaks down education, health, rice subsidy, and First 1,000 Days (F1KD) grants, payment modes, and account numbers.

### 2. 360° Household Record Inquiry
- Single-search cross-referencing across all 3 databases by `HH_ID`.
- Dynamic display field customizer dropdowns for each card.
- **Stretch to Full Width** (`Maximize2`/`Minimize2`) toggle with persistence in `localStorage`.
- **Fullscreen Modal Inspection** with column ordering, sorting, and CSV export.
- Real-time "Not Existed" verification and sample household switcher.

### 3. Request Management Modules (8 Workflows)
Tracks and logs status for 8 distinct household operations:
1. **Opening** &mdash; Account creation and unblocking.
2. **Distribution** &mdash; Card distribution scheduling and validation.
3. **OTC Withdrawal** &mdash; Over-the-counter withdrawal transmittals.
4. **Replacement** &mdash; Damaged, lost, or expired card replacements.
5. **Transfer of Fund** &mdash; Fund transfer requests across accounts.
6. **Force PIN** &mdash; PIN reset and force change authorizations.
7. **Locking** &mdash; Emergency and security account locking requests.
8. **Lifting** &mdash; Lifting of locks and hold-orders.

### 4. Transmittal Printing & Document Engine
- Standardized transmittal document generation.
- Interactive print preview with centered zoom lock/unlock controls (`ZoomIn`, `ZoomOut`, `RotateCcw`).
- Dynamic transmittal numbers, signature sections, and letterhead headers.

### 5. Authentication & SSO Integration
- Integrated with DSWD Caraga Connect OAuth 2.0 Single Sign-On.
- Automatically pulls and synchronizes employee information (name, email, designation) from Caraga Portal.

---

## Installation & Setup Guide

Follow these steps to set up the project on your local machine:

### Step 1: Clone the Repository

```bash
git clone <repository-url> cgt
cd cgt
```

### Step 2: Environment Configuration

Copy the example environment file and adjust the database credentials:

```bash
cp .env.example .env
```

Open `.env` and configure your database and app settings:

```env
APP_NAME=GRANTS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cgt
DB_USERNAME=root
DB_PASSWORD=

# DSWD Caraga SSO / Portal Configuration
SSO_BASE_URL=https://caraga-connect.dswd.gov.ph
SSO_CLIENT_ID=your_client_id
SSO_CLIENT_SECRET=your_client_secret
SSO_REDIRECT_URI="${APP_URL}/login-sso/callback"
```

### Step 3: Install PHP Dependencies

```bash
composer install
```

### Step 4: Install Node.js Dependencies

```bash
npm install
```

### Step 5: Generate Application Key

```bash
php artisan key:generate
```

### Step 6: Run Database Migrations

Ensure your MySQL server is running and the database (`cgt`) exists, then execute:

```bash
php artisan migrate
```

### Step 7: Storage Linking

Link the public storage folder for file uploads and transmittals:

```bash
php artisan storage:link
```

Ensure the imports storage directory exists:

```bash
mkdir -p storage/app/imports
```

### Step 8: Start the Application

You need both the PHP backend and the Vite asset server running:

#### Terminal 1: Vite Development Server
```bash
npm run dev
```

#### Terminal 2: Laravel Application Server
```bash
php artisan serve
```

> If you are using **Laragon**, open `http://cgt.test` in your browser.

---

## Build & Deployment Commands

### Production Build
To compile and minify frontend assets for production:

```bash
npm run build
```

This compiles React and Tailwind CSS into optimized chunks inside `public/build/`.

### Code Formatting
To format frontend TypeScript, React, and CSS files:

```bash
npm run format
```

To run Laravel Pint (PHP code style fixer):

```bash
vendor/bin/pint
```

### Cache Optimization (Production)
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Queue & Large Dataset Processing

For asynchronous large-file imports (e.g., hundreds of thousands of records in Grantee Master or EMV files):

1. Set `QUEUE_CONNECTION=database` (or `redis`) in your `.env`.
2. Run the queue worker in a dedicated process:

```bash
php artisan queue:work --timeout=600 --memory=1024
```

For local testing with direct execution, you may keep `QUEUE_CONNECTION=sync`.

---

## Troubleshooting & FAQs

### 1. File Upload Fails with "The uploaded file is too large"
- **Cause**: PHP's default `upload_max_filesize` or `post_max_size` is too low (often 2M or 8M).
- **Solution**: Update `php.ini` with `upload_max_filesize = 512M` and `post_max_size = 512M`, then restart your web server.

### 2. Vite Build Fails or Missing Modules
- **Solution**: Clear `node_modules` and re-install:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

### 3. Database Connection Error (`SQLSTATE[HY000] [1049] Unknown database`)
- **Solution**: Open your MySQL GUI (e.g. HeidiSQL, phpMyAdmin) and create a database named `cgt`, or run:
  ```sql
  CREATE DATABASE cgt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
  Then run `php artisan migrate`.

### 4. Caraga SSO Redirect Fails
- Verify that `APP_URL` in `.env` matches your browser URL (e.g., `http://localhost:8000` or `http://cgt.test`) and that `SSO_REDIRECT_URI="${APP_URL}/login-sso/callback"` is registered in the Caraga Connect portal client settings.

---

## License

This project is proprietary software developed for the Department of Social Welfare and Development (DSWD) Caraga Pantawid Pamilyang Pilipino Program (4Ps).
