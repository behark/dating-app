# Vercel AI Gateway Setup Guide

## What is Vercel AI Gateway?

Vercel AI Gateway is a service that lets you seamlessly integrate 100+ AI models into your application without managing rate limits or provider accounts. It's built on the AI SDK 5.

---

## ✅ Package Installed

- **Package**: `ai` (Vercel AI SDK)
- **Version**: Latest
- **Location**: `src/services/AIGatewayService.js`

---

## 🚀 Quick Start

### 1. Get Your API Key

1. Go to your Vercel Dashboard
2. Navigate to your project → **AI Gateway** tab
3. Click **"Create an API Key"**
4. Copy the API key

### 2. Set Environment Variable

Add to your `.env` file or Vercel environment variables:

```bash
EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY=your_api_key_here
```

### 3. Use in Your Code

```javascript
import AIGatewayService from './src/services/AIGatewayService';

// Simple question
const answer = await AIGatewayService.askQuestion(
  'What is the history of the San Francisco Mission-style burrito?',
  'google/gemini-3-flash'
);

// Stream text (for real-time responses)
const stream = await AIGatewayService.streamText({
  model: 'google/gemini-3-flash',
  prompt: 'Tell me about React Native',
});

for await (const chunk of stream.textStream) {
  console.log(chunk); // Real-time chunks
}
```

---

## 📝 Available Models

The AI Gateway supports 100+ models from various providers:

### Google

- `google/gemini-3-flash`
- `google/gemini-3-pro`
- `google/gemini-2.0-flash-exp`

### OpenAI

- `openai/gpt-4`
- `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo`

### Anthropic

- `anthropic/claude-3-opus`
- `anthropic/claude-3-sonnet`

### And many more...

See the full list in Vercel Dashboard → AI Gateway → Model List

---

## 💡 Example Use Cases for Dating App

### 1. Conversation Starters

```javascript
const starters = await AIGatewayService.generateConversationStarters(
  currentUserProfile,
  matchProfile
);
```

### 2. Bio Suggestions

```javascript
const bio = await AIGatewayService.generateBioSuggestion({
  interests: ['hiking', 'photography'],
  hobbies: ['cooking', 'travel'],
  job: 'Software Engineer',
});
```

### 3. Profile Matching Insights

```javascript
const insights = await AIGatewayService.askQuestion(
  `Analyze compatibility between these two profiles: ${JSON.stringify({ user1, user2 })}`,
  'google/gemini-3-flash'
);
```

### 4. Date Ideas

```javascript
const dateIdeas = await AIGatewayService.askQuestion(
  `Suggest 5 creative date ideas for someone who likes ${interests.join(', ')} in ${location}`,
  'google/gemini-3-flash'
);
```

---

## 🔧 Advanced Usage

### Streaming Responses

For real-time, streaming responses:

```javascript
const stream = await AIGatewayService.streamText({
  model: 'google/gemini-3-flash',
  prompt: 'Tell me a story',
  config: {
    temperature: 0.8, // Creativity (0-1)
    maxTokens: 1000,
  },
});

// Stream chunks in real-time
for await (const chunk of stream.textStream) {
  // Update UI with each chunk
  setResponse((prev) => prev + chunk);
}
```

### Custom Configuration

```javascript
const result = await AIGatewayService.getText({
  model: 'openai/gpt-4',
  prompt: 'Your prompt here',
  config: {
    temperature: 0.7, // 0-1, higher = more creative
    maxTokens: 500, // Maximum response length
    topP: 0.9, // Nucleus sampling
    frequencyPenalty: 0, // Reduce repetition
    presencePenalty: 0, // Encourage new topics
  },
});
```

---

## ⚠️ Important Notes

### Platform Support

- ✅ **Web**: Fully supported
- ❌ **iOS/Android**: Not directly supported (use API routes or backend)

### For React Native

If you need AI features in native apps, you have two options:

1. **Use Backend API Route** (Recommended)
   - Create API endpoints in your backend
   - Call those endpoints from React Native
   - Backend handles AI Gateway calls

2. **Use WebView** (Limited)
   - Embed web version in WebView
   - Less ideal for native experience

### API Key Security

- ⚠️ **Never commit API keys to git**
- ✅ Use environment variables
- ✅ Set in Vercel Dashboard → Settings → Environment Variables
- ✅ Use `EXPO_PUBLIC_` prefix for client-side access (web only)

---

## 🎯 Best Practices

1. **Error Handling**: Always wrap AI calls in try/catch
2. **Rate Limiting**: AI Gateway handles this, but be mindful of usage
3. **Cost Management**: Monitor usage in Vercel Dashboard
4. **Caching**: Cache common responses to reduce API calls
5. **User Experience**: Show loading states for AI responses

---

## 📊 Monitoring

View your AI Gateway usage in Vercel Dashboard:

- **Usage**: Number of requests
- **Spend**: Cost tracking
- **Average TTFT**: Time to first token
- **Requests**: Request breakdown
- **Tokens**: Token usage

---

## 🔗 Resources

- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Model List](https://vercel.com/docs/ai-gateway/models)

---

## ✅ Setup Checklist

- [x] Package installed (`ai`)
- [x] Service created (`AIGatewayService.js`)
- [ ] API key created in Vercel Dashboard
- [ ] Environment variable set (`EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY`)
- [ ] Tested with a simple query
- [ ] Integrated into your app

---

**Ready to use!** 🚀

Once you set your API key, you can start using AI features in your dating app!
