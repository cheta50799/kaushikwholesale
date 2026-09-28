# Market Counter

A realistic FMCG convenience-store portal built with React, TypeScript, and Vite. Customers can browse everyday products, place local delivery orders, receive a four-digit order code, and track delivery progress. Store staff can sign into a protected operations console to review orders and advance picking and delivery statuses.

## Run locally

1. Install Node.js 20 or newer.
2. From this folder, run `npm install`.
3. Start the app with `npm run dev`.

## Demo admin access

- ID: `admin@marketcounter.in`
- Password: `Store@1234`

Orders and customer history are persisted in browser `localStorage` for this front-end demo and automatically pruned to a rolling 30-day window on load and daily. A production deployment should replace the demo sign-in and local persistence with server-side authentication, order APIs, a database, and a scheduled retention job.

## Free GitHub Pages deployment

1. Create a public GitHub repository named `kaushikwholesale.github.io`.
2. From this folder, initialize Git and push the project to the `main` branch:

```bash
git init
git add .
git commit -m "Initial Market Counter portal"
git branch -M main
git remote add origin https://github.com/kaushikwholesale/kaushikwholesale.github.io.git
git push -u origin main
```

3. In GitHub, open **Settings → Pages** and set the source to **GitHub Actions**.
4. After the workflow completes, the site will be available at `https://kaushikwholesale.github.io`.

The deployment workflow is in `.github/workflows/deploy-pages.yml` and supports both a user site repository and a normal project repository.
