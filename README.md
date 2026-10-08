# CGT Starter

This folder contains a Laravel 11 + Inertia React + Tailwind + shadcn-style starter app.

## What is included

- Laravel-style `routes/web.php`
- Laravel 11 boot files: `artisan`, `bootstrap/app.php`, and `public/index.php`
- Inertia React entrypoint at `resources/js/app.tsx`
- Tailwind setup with shadcn-compatible CSS variables
- Basic UI components in `resources/js/Components/ui`
- Starter page at `resources/js/Pages/Home.tsx`
- Vite, TypeScript, PostCSS, and shadcn `components.json`

## Next steps

Install dependencies and start both servers:

```bash
composer install
npm install
npm run dev
php artisan serve
```

The `.env` file is already present and an app key has been generated locally.

## Main files to edit

- `resources/js/Pages/Home.tsx`
- `resources/js/Layouts/AppLayout.tsx`
- `resources/js/Components/ui/*`
- `resources/css/app.css`
- `routes/web.php`
# cgt
