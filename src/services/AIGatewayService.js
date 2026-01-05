/**
 * AI Gateway Service
 * 
 * Uses Vercel AI SDK to interact with AI models via AI Gateway
 * Supports 100+ models including OpenAI, Google Gemini, Anthropic, etc.
 * 
 * Requires:
 * - Vercel AI Gateway API key (get from Vercel dashboard)
 * - 'ai' package installed
 */

import { streamText } from 'ai';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Note: AI SDK works on web platform
// For React Native, you'd need to use API routes or backend endpoints

class AIGatewayService {
  constructor() {
    // Get API key from environment or Vercel config
    // In production, this should come from Vercel environment variables
    this.apiKey = process.env.EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY || null;
    this.baseUrl = 'https://api.vercel.ai'; // Vercel AI Gateway endpoint
  }

  /**
   * Stream text from an AI model
   * @param {Object} options - Stream options
   * @param {string} options.model - Model identifier (e.g., 'google/gemini-3-flash', 'openai/gpt-4')
   * @param {string} options.prompt - The prompt/question to send
   * @param {Object} options.config - Additional configuration (temperature, maxTokens, etc.)
   * @returns {Promise<ReadableStream>} Stream of text chunks
   */
  async streamText({ model, prompt, config = {} }) {
    if (Platform.OS !== 'web') {
      throw new Error('AI Gateway Service is only available on web platform');
    }

    if (!this.apiKey) {
      logger.warn('AI Gateway API key not configured');
      throw new Error('AI Gateway API key is required. Set EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY');
    }

    try {
      const result = await streamText({
        model,
        prompt,
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
        ...config,
      });

      return result;
    } catch (error) {
      logger.error('Error streaming text from AI Gateway:', error);
      throw error;
    }
  }

  /**
   * Get complete text response (non-streaming)
   * @param {Object} options - Same as streamText
   * @returns {Promise<string>} Complete response text
   */
  async getText({ model, prompt, config = {} }) {
    const stream = await this.streamText({ model, prompt, config });
    let fullText = '';

    for await (const chunk of stream.textStream) {
      fullText += chunk;
    }

    return fullText;
  }

  /**
   * Example: Get AI response for a question
   * @param {string} question - The question to ask
   * @param {string} model - Model to use (default: google/gemini-3-flash)
   * @returns {Promise<string>} AI response
   */
  async askQuestion(question, model = 'google/gemini-3-flash') {
    try {
      const response = await this.getText({
        model,
        prompt: question,
      });
      return response;
    } catch (error) {
      logger.error('Error asking question:', error);
      throw error;
    }
  }

  /**
   * Example: Generate conversation starter suggestions
   * @param {Object} userProfile - User profile data
   * @param {Object} matchProfile - Match profile data
   * @returns {Promise<string[]>} Array of conversation starter suggestions
   */
  async generateConversationStarters(userProfile, matchProfile) {
    const prompt = `Generate 5 creative conversation starter messages for a dating app. 
    User profile: ${JSON.stringify(userProfile)}
    Match profile: ${JSON.stringify(matchProfile)}
    Make them friendly, engaging, and personalized. Return as a JSON array of strings.`;

    try {
      const response = await this.getText({
        model: 'google/gemini-3-flash',
        prompt,
        config: {
          temperature: 0.8, // More creative
          maxTokens: 500,
        },
      });

      // Parse JSON response
      const suggestions = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions : [response];
    } catch (error) {
      logger.error('Error generating conversation starters:', error);
      // Fallback to default suggestions
      return [
        "Hey! I noticed we have some things in common. How's your day going?",
        "Hi there! Your profile caught my attention. What's something you're passionate about?",
        "Hello! I'd love to learn more about you. What's the best part of your week been?",
      ];
    }
  }

  /**
   * Example: Generate bio suggestions
   * @param {Object} userData - User data (interests, hobbies, etc.)
   * @returns {Promise<string>} Bio suggestion
   */
  async generateBioSuggestion(userData) {
    const prompt = `Generate a short, engaging dating app bio (max 150 characters) based on:
    ${JSON.stringify(userData)}
    Make it authentic, positive, and interesting.`;

    try {
      const response = await this.getText({
        model: 'google/gemini-3-flash',
        prompt,
        config: {
          temperature: 0.7,
          maxTokens: 200,
        },
      });
      return response.trim();
    } catch (error) {
      logger.error('Error generating bio suggestion:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AIGatewayService();
