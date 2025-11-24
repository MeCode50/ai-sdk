// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

@Injectable()
export class AiService {
  async generateWebsiteContent(prompt: string) {
    const result = await generateText({
      model: openai('gpt-5.1'),  // ✅ update this to the exact GPT-5 model you use
      prompt: `
        You are an expert AI website generator.
        Generate complete website content based on the following request:

        "${prompt}"

        Return structured content including:
        - Hero section (headline, subheadline, CTA)
        - Features section
        - About section
        - Testimonials or social proof
        - Footer content
      `,
    });

    return result.text;
  }
}
