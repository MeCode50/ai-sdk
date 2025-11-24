import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', example: 'Build a SaaS landing page' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Generated website content',
  })
  async generate(@Body('prompt') prompt: string) {
    return {
      result: await this.aiService.generateWebsiteContent(prompt),
    };
  }
}
