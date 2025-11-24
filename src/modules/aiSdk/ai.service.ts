// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { spawn, ChildProcess } from 'child_process';
import getPort from 'get-port';

interface GeneratedNextProject {
  id: string;
  url: string;
  port: number;
  process: ChildProcess;
}

@Injectable()
export class AiService {
  private runningProjects: GeneratedNextProject[] = [];

  async generateNextProject(prompt: string): Promise<{ url: string }> {
    // 1. Generate a unique project ID
    const id = randomUUID();
    const projectRoot = path.join(process.cwd(), 'generated-sites', id);
    fs.mkdirSync(projectRoot, { recursive: true });

    // 2. Ask GPT-5 to generate a full Next.js project (App Router)
    const result = await generateText({
      model: openai('gpt-5'),
      prompt: `
      Generate a complete Next.js 14 App Router project.

      Format each file as:
      \`\`\`file:path/to/file
      // content
      \`\`\`

      Required files:
      - package.json
      - tsconfig.json
      - next.config.js
      - app/layout.tsx
      - app/page.tsx
      - components/*
      - styles/globals.css

      Website content: "${prompt}"
      `,
    });

    const txt = result.text;

    // 3. Parse files from GPT output
    const blocks = txt.split('```file:').slice(1);
    for (const block of blocks) {
      const [header, ...bodyParts] = block.split('\n');
      const filePath = header.trim();
      const content = bodyParts.join('\n').replace(/```$/, '');
      const fullPath = path.join(projectRoot, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content.trim());
    }

    // 4. Install dependencies automatically
    await this.runCommand('pnpm install', projectRoot);

    // 5. Pick a free port
    const port = await getPort({ port: 3000 });

    // 6. Spawn pnpm next dev automatically
    const child = spawn('pnpm', ['next', 'dev', '--port', port.toString()], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    this.runningProjects.push({ id, url: `/generated-sites/${id}`, port, process: child });

    // 7. Return preview URL
    return { url: `http://localhost:${port}` };
  }

  private runCommand(cmd: string, cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, {
        cwd,
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', code => {
        if (code === 0) resolve();
        else reject(new Error(`Command "${cmd}" exited with code ${code}`));
      });
    });
  }
}
