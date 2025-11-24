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
    // 1️⃣ Generate unique project ID
    const id = randomUUID();
    const projectRoot = path.join(process.cwd(), 'generated-sites', id);
    fs.mkdirSync(projectRoot, { recursive: true });

    // 2️⃣ Generate Next.js project using GPT
    const result = await generateText({
      model: openai('gpt-5.1'),
      prompt: `
Generate a complete Next.js 14 App Router project.

Format each file as:
\`\`\`file:path/to/file
<file content>
\`\`\`

Required files:
- package.json (with Next.js 14, React, TypeScript, Tailwind CSS dependencies)
- tsconfig.json (standalone config for Next.js with jsx: "preserve", do NOT extend any parent config)
- next.config.js (MUST include images configuration for external domains)
- tailwind.config.ts
- postcss.config.js
- app/layout.tsx
- app/page.tsx
- app/globals.css
- components/* (various React components)
- .gitignore

CRITICAL CONFIGURATION REQUIREMENTS:

1. For tsconfig.json:
- Must be a standalone configuration (no "extends" field)
- Must include: "jsx": "preserve", "module": "esnext", "target": "es5"
- Must include: "lib": ["dom", "dom.iterable", "esnext"]
- Must include: "moduleResolution": "bundler"

2. For next.config.js:
- MUST configure images.remotePatterns or images.domains for any external images used
- Common image domains to include: "images.pexels.com", "images.unsplash.com", "via.placeholder.com"
- Do NOT include deprecated "experimental.appDir" option
- Example structure:
  module.exports = {
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: 'images.pexels.com' },
        { protocol: 'https', hostname: 'images.unsplash.com' },
      ],
    },
  };

Website content: "${prompt}"
`,
    });

    const txt = result.text;

    // 3️⃣ Parse GPT output and write files
    // Improved regex to match code blocks: ```file:path followed by content and closing ```
    const codeBlockRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(txt)) !== null) {
      const filePath = match[1].trim();
      let content = match[2].trim();

      // Skip empty files
      if (!content) continue;

      // Optional: validate JSON files before writing
      if (filePath.endsWith('.json')) {
        try {
          JSON.parse(content);
        } catch (err) {
          console.error(`Invalid JSON from GPT for file: ${filePath}`);
          continue;
        }
      }

      const fullPath = path.join(projectRoot, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
    }

    // 4️⃣ Install dependencies
    await this.runCommand('pnpm install', projectRoot);

    // 5️⃣ Pick a free port
    const port = await getPort({ port: 3000 });

    // 6️⃣ Spawn pnpm next dev
    const child = spawn('pnpm', ['next', 'dev', '--port', port.toString()], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    this.runningProjects.push({ id, url: `/generated-sites/${id}`, port, process: child });

    // 7️⃣ Return live preview URL
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