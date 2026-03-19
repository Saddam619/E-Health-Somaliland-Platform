# E‑Health Somaliland Platform

## Backend

```bash
cd backend
npm install
node db/init.js    # create sqlite file
npm run dev        # starts server on :3000
```

## Frontend

Serve `frontend` folder with any static server (e.g. `npx serve frontend`).
All API calls point at `http://localhost:3000/api`; adjust `API_BASE` if
needed.

## Deployment

- Put backend on Heroku/Render/DigitalOcean with a proper DB.
- Serve frontend from Netlify/Vercel or the same Node server.
- Use environment variables for secrets and API keys.