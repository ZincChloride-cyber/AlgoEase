# Deployment Guide for AxelarX

This guide covers deploying the AxelarX Next.js frontend to Vercel.

## Prerequisites

1. A GitHub account with the repository
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. Vercel CLI installed globally (optional but recommended):
   ```bash
   npm install -g vercel
   ```

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect your repository:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select "AxelarX"

2. **Configure the project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default for Next.js)
   - **Install Command:** `npm ci`

3. **Set environment variables:**
   Add the following in Vercel's environment variables section:
   ```
   NEXT_PUBLIC_APP_NAME=AxelarX
   NEXT_PUBLIC_APP_VERSION=1.0.0
   NEXT_PUBLIC_LINERA_NETWORK_URL=http://localhost:8080
   NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
   NEXT_PUBLIC_LINERA_FAUCET_URL=http://localhost:8080
   NEXT_PUBLIC_ENABLE_REAL_TRADING=false
   NEXT_PUBLIC_ENABLE_WALLET_CONNECT=true
   NEXT_PUBLIC_ENABLE_CROSS_CHAIN=true
   NEXT_PUBLIC_DEBUG=false
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll get a production URL (e.g., `your-app.vercel.app`)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

4. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your Vercel account
   - Link to existing project? **No** (for first deployment)
   - Project name? **axelarx** or your preferred name
   - Directory? **.** (current directory)
   - Override settings? **No**

5. **For production deployment:**
   ```bash
   vercel --prod
   ```

### Option 3: Monorepo Deployment (Advanced)

If you want to keep the current structure with `frontend/` as a subdirectory:

1. **Update `vercel.json`** (already created in root):
   The configuration is already set up for monorepo deployment.

2. **Deploy from root:**
   ```bash
   vercel
   ```

3. **Configure in Vercel Dashboard:**
   - Go to your project settings
   - Under "General", set "Root Directory" to `frontend`

## Environment Variables

### Development Environment
- Use the values from `frontend/env.local.example` for local development

### Production Environment
Update these variables in Vercel:
- Set `NEXT_PUBLIC_DEBUG=false`
- Update `NEXT_PUBLIC_LINERA_NETWORK_URL` to your production Linera network
- Set `NEXT_PUBLIC_ENABLE_REAL_TRADING=true` only when fully tested

## Post-Deployment

### 1. Custom Domain (Optional)
- Go to Project Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

### 2. Enable Analytics
- Go to Settings → Analytics
- Enable Web Analytics or Speed Insights

### 3. Set up Preview Deployments
- All pull requests automatically get preview deployments
- Preview URLs are added as comments on PRs

### 4. Configure Headers
- The Next.js config already includes CORS headers
- Additional security headers can be added in `next.config.js`

## Troubleshooting

### Build Fails
1. **Check Node version:** Ensure Node.js 18+ is used
   - In Vercel settings, set "Node.js Version" to 18

2. **Missing dependencies:** Verify `package.json` is correct
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Check build logs:** Vercel dashboard shows detailed build logs

### Environment Variables Not Working
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/updating variables
- Check spelling and values in Vercel dashboard

### Module Not Found Errors
1. Check `package.json` dependencies
2. Run `npm ci` to ensure clean install
3. Clear `.next` cache: `rm -rf frontend/.next`

## Continuous Deployment

Once connected to GitHub:
- Every push to `main/master` deploys to production
- Pull requests get preview deployments
- You can control this in Project Settings → Git

## Deployment URLs

After deployment, you'll have:
- **Production:** `https://your-project.vercel.app`
- **Preview:** `https://your-project-{hash}.vercel.app` (for PRs)
- **Staging:** Configure branch-based deployments

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## Notes

- The Rust smart contracts are **not** deployed to Vercel
- Only the Next.js frontend is deployed
- Smart contracts must be deployed separately to Linera network
- See `scripts/deploy-local.sh` for local contract deployment


