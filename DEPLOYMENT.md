# 🚀 Deployment Guide - Poker Tournament DApp Demo

## 🌐 Making Your Demo Publicly Available

### Option 1: GitHub Pages (Recommended - Free)

#### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it `poker-tournament-dapp` (or any name you prefer)
3. Make it **public** (required for free GitHub Pages)
4. Don't initialize with README (we already have files)

#### Step 2: Push Your Code
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/poker-tournament-dapp.git

# Push your code
git branch -M main
git push -u origin main
```

#### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Select **main** branch and **/ (root)** folder
6. Click **Save**

#### Step 4: Access Your Demo
- Your demo will be available at: `https://YOUR_USERNAME.github.io/poker-tournament-dapp/working-demo.html`
- GitHub Pages may take 5-10 minutes to deploy

### Option 2: Netlify (Alternative - Free)

#### Step 1: Prepare for Netlify
1. Push your code to GitHub (follow Option 1, Steps 1-2)
2. Go to [Netlify.com](https://netlify.com)
3. Sign up with your GitHub account

#### Step 2: Deploy
1. Click **New site from Git**
2. Choose **GitHub** and select your repository
3. Set **Build command**: (leave empty)
4. Set **Publish directory**: `/` (root)
5. Click **Deploy site**

#### Step 3: Access Your Demo
- Netlify will give you a random URL like: `https://amazing-name-123456.netlify.app`
- You can customize the subdomain in site settings

### Option 3: Vercel (Alternative - Free)

#### Step 1: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click **New Project**
4. Import your GitHub repository
5. Click **Deploy**

#### Step 2: Access Your Demo
- Vercel will give you a URL like: `https://poker-tournament-dapp.vercel.app`

## 🔧 Important Notes

### HTTPS Requirement
- **Wallet connections require HTTPS** for security
- All deployment options above provide HTTPS automatically
- Local development (`http://localhost`) works for testing

### File Structure
- Main demo file: `working-demo.html`
- Direct access: `https://your-domain.com/working-demo.html`
- Or create an `index.html` that redirects to `working-demo.html`

### Custom Domain (Optional)
- You can use your own domain with any of these services
- Point your domain's DNS to the hosting service
- Configure custom domain in the hosting service settings

## 🧪 Testing Your Deployment

### Before Going Live
1. **Test wallet connections** on the deployed version
2. **Verify all features work** (create tokens, place orders, etc.)
3. **Check on different devices** (mobile, desktop)
4. **Test with different wallets** (MetaMask, Coinbase Wallet)

### Common Issues
- **Wallet not connecting**: Ensure HTTPS is enabled
- **CORS errors**: Most hosting services handle this automatically
- **File not found**: Check the exact URL path to your HTML file

## 📱 Sharing Your Demo

### Share Links
- **GitHub Pages**: `https://YOUR_USERNAME.github.io/poker-tournament-dapp/working-demo.html`
- **Netlify**: `https://your-site-name.netlify.app/working-demo.html`
- **Vercel**: `https://your-project.vercel.app/working-demo.html`

### QR Code
- Generate a QR code for easy mobile access
- Use services like [QR Code Generator](https://www.qr-code-generator.com/)

## 🔄 Updates

### Making Changes
1. Edit your local files
2. Commit changes: `git add . && git commit -m "Update demo"`
3. Push to GitHub: `git push origin main`
4. Your hosting service will automatically redeploy

### Version Control
- Use meaningful commit messages
- Tag important releases: `git tag v1.0 && git push origin v1.0`

## 🆘 Troubleshooting

### GitHub Pages Not Working
- Check repository is public
- Verify Pages is enabled in Settings
- Wait 10-15 minutes for deployment
- Check the Actions tab for deployment status

### Wallet Connection Issues
- Ensure you're using HTTPS
- Check browser console for errors
- Try different browsers
- Clear browser cache

### File Access Issues
- Verify the exact file path
- Check file permissions
- Ensure file is committed to repository

## 🔐 Authentication System

The demo now includes a complete authentication system:

### **Features:**
- ✅ **User Registration**: Name, username, password
- ✅ **User Login**: Username and password authentication
- ✅ **Session Management**: Automatic login persistence
- ✅ **User Dashboard**: Display user information
- ✅ **Logout Functionality**: Secure session termination

### **Current Implementation:**
- **Storage**: Uses browser localStorage (demo purposes)
- **Security**: Basic validation (passwords stored in plain text for demo)
- **Persistence**: Users stay logged in between sessions

### **Server Integration Options:**

#### **Option 1: Firebase (Recommended)**
```javascript
// Replace localStorage with Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

#### **Option 2: Supabase**
```javascript
// Replace localStorage with Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

// Register user
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      name: name,
      username: username
    }
  }
});
```

#### **Option 3: Custom Backend**
```javascript
// Replace localStorage with API calls
async function registerUser(name, username, password) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, username, password })
  });
  return response.json();
}

async function loginUser(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}
```

## 🎉 Success!

Once deployed, your demo will be publicly accessible and users can:
- **Create accounts** and log in securely
- **Connect their wallets** (MetaMask, Coinbase Wallet)
- **Create player tokens** for poker tournaments
- **Place buy/sell orders** with automatic execution
- **View their portfolio** with real-time updates
- **Experience the full poker tournament DApp demo**

### **Next Steps for Production:**
1. **Integrate with a real backend** (Firebase, Supabase, or custom API)
2. **Add password hashing** (bcrypt, Argon2)
3. **Implement JWT tokens** for secure sessions
4. **Add email verification** for account creation
5. **Add password reset** functionality
6. **Implement rate limiting** and security measures

Happy deploying! 🚀
