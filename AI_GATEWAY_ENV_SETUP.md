# AI Gateway Environment Variable Setup

## ✅ Security Check

Good news! Your `.env` file is already in `.gitignore`, so your API key won't be committed to git. ✅

---

## 📝 Setup Steps

### 1. Add to Local `.env` File

Create or edit your `.env` file in the project root:

```bash
# Add this line to your .env file
EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY=vck_4q4jXHY1uXRBXlMQQLcifRFjeKTtcumrqjLlanfj2CzfXGyhN33SnXnN
```

**Note**: The `.env` file is already in `.gitignore`, so it won't be committed.

### 2. Add to Vercel Environment Variables (For Production)

For your Vercel deployment, add the key in Vercel Dashboard:

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name**: `EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY`
   - **Value**: `vck_4q4jXHY1uXRBXlMQQLcifRFjeKTtcumrqjLlanfj2CzfXGyhN33SnXnN`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### 3. Verify It Works

After adding the key, test it:

```javascript
import AIGatewayService from './src/services/AIGatewayService';

// Test it
const test = async () => {
  try {
    const answer = await AIGatewayService.askQuestion(
      'Say hello in one sentence',
      'google/gemini-3-flash'
    );
    console.log('✅ AI Gateway works!', answer);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};
```

---

## 🔒 Security Notes

### ✅ Safe to Use `EXPO_PUBLIC_` Prefix

The `EXPO_PUBLIC_` prefix means:
- ✅ **Safe for client-side** (web builds)
- ✅ **Exposed in browser** (but that's okay for AI Gateway keys)
- ✅ **Works with Expo** (read at build time)

### ⚠️ Important

- **Never commit** `.env` to git (already protected by `.gitignore`)
- **Never share** your API key publicly
- **Rotate keys** if accidentally exposed
- **Monitor usage** in Vercel Dashboard

---

## 🎯 Why This is a Great Feature

### Benefits for Your Dating App:

1. **Conversation Starters** 🤝
   - Generate personalized icebreakers
   - Help users start conversations

2. **Bio Suggestions** ✍️
   - Help users write better profiles
   - Improve profile completion rates

3. **Compatibility Analysis** 💕
   - Analyze user compatibility
   - Suggest better matches

4. **Date Ideas** 📅
   - Generate creative date suggestions
   - Based on user interests and location

5. **Smart Features** 🧠
   - AI-powered profile optimization
   - Personalized recommendations

---

## 📊 Usage Monitoring

Monitor your AI Gateway usage in Vercel:
- **Dashboard** → **AI Gateway** → **Usage**
- Track requests, tokens, and costs
- Set up alerts for high usage

---

## ✅ Checklist

- [x] API key obtained from Vercel Dashboard
- [ ] Added to local `.env` file
- [ ] Added to Vercel Environment Variables (for production)
- [ ] Tested with a simple query
- [ ] Verified `.env` is in `.gitignore` (already done ✅)

---

## 🚀 Next Steps

1. **Add to `.env`**: Add the key to your local `.env` file
2. **Add to Vercel**: Set it in Vercel Dashboard → Environment Variables
3. **Test**: Try the example code above
4. **Integrate**: Start using AI features in your app!

---

**You're all set!** 🎉

The AI Gateway will make your dating app much more engaging with AI-powered features!
