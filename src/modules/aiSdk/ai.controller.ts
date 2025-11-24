// src/ai/ai.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  async generate(@Body('prompt') prompt: string) {
    return {
      result: await this.aiService.generateWebsiteContent(prompt),
    };
  }
}
