#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { InitializeRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';

class DocumentoryServer {
  constructor(docsPath, port = 3000) {
    this.server = new Server({
      name: 'Documentory',
      version: '1.0.0',
      description: 'Documentory ::: AI가 프로젝트 문서를 자율적으로 관리하는 MCP 서버'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.docsPath = docsPath || path.join(process.cwd(), 'docs');
    this.port = port;
    this.app = express();
    this.transports = {}; // 여러 클라이언트 연결 지원
    
    this.ensureDocsFolder();
    this.setupExpressApp();
    this.setupHandlers();
  }

  setupExpressApp() {
    // CORS 설정 - 모든 origin 허용 (개발용)
    this.app.use(cors({
      origin: true,
      credentials: true
    }));

    this.app.use(express.json());
    this.app.use(express.text());

    // Health check 엔드포인트
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'Documentory MCP Server',
        docsPath: this.docsPath,
        timestamp: new Date().toISOString()
      });
    });

    // SSE 연결 엔드포인트
    this.app.get('/sse', async (req, res) => {
      console.log(`📡 새로운 SSE 연결: ${req.ip}`);
      
      try {
        const transport = new SSEServerTransport('/messages', res);
        const sessionId = transport.sessionId;
        
        this.transports[sessionId] = transport;
        
        await this.server.connect(transport);
        
        console.log(`✅ MCP 서버 연결 완료 (세션: ${sessionId})`);
        
        // 연결 종료 시 정리
        req.on('close', () => {
          console.log(`🔌 SSE 연결이 종료되었습니다 (세션: ${sessionId})`);
          delete this.transports[sessionId];
        });
      } catch (error) {
        console.error('❌ SSE 연결 오류:', error.message);
        res.status(500).json({ error: 'SSE 연결 실패' });
      }
    });

    // 메시지 처리 엔드포인트
    this.app.post('/messages', (req, res) => {
      const sessionId = req.query.sessionId;
      
      if (typeof sessionId !== 'string') {
        res.status(400).json({ error: '잘못된 세션 ID' });
        return;
      }
      
      const transport = this.transports[sessionId];
      if (!transport) {
        res.status(400).json({ error: '세션을 찾을 수 없습니다' });
        return;
      }
      
      transport.handlePostMessage(req, res, req.body);
    });

    // 루트 경로 - 서버 정보
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Documentory MCP Server',
        version: '1.0.0',
        description: 'AI가 프로젝트 문서를 자율적으로 관리하는 서비스',
        endpoints: {
          sse: '/sse',
          messages: '/messages',
          health: '/health'
        },
        docsPath: this.docsPath,
        philosophy: '문서는 단순한 파일이 아닌, 프로젝트의 지식과 경험이 축적되는 이야기입니다.'
      });
    });
  }

  ensureDocsFolder() {
    try {
      if (!fs.existsSync(this.docsPath)) {
        fs.mkdirSync(this.docsPath, { recursive: true });
        console.log(`📁 docs 폴더가 생성되었습니다: ${this.docsPath}`);
      }
    } catch (error) {
      console.error(`❌ docs 폴더 생성 실패: ${error.message}`);
      console.error('기본 경로를 사용합니다.');
      this.docsPath = path.join(process.cwd(), 'docs');
      fs.mkdirSync(this.docsPath, { recursive: true });
    }
  }

  setupHandlers() {
    // 초기화 핸들러
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      console.log('🔌 MCP 초기화 요청 수신:', request.params);
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'Documentory',
          version: '1.0.0'
        }
      };
    });

    // 도구 목록 핸들러
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log('📋 도구 목록 요청 수신');
      return {
        tools: [
          {
            name: 'listDocuments',
            description: '##이것은 Documentory MCP 서버의 도구입니다## 프로젝트 문서 목록을 확인하고 싶을 때 사용합니다. docs 폴더의 모든 Markdown 문서 파일명과 간략한 정보를 제공합니다. 사용자가 "어떤 문서가 있나요?" 또는 "문서 목록을 보여주세요"라고 물어볼 때 이 도구를 사용하세요.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'readDocument',
            description: '##이것은 Documentory MCP 서버의 도구입니다## 특정 문서의 내용을 읽어야 할 때 사용합니다. 사용자가 특정 문서에 대해 질문하거나 문서 내용을 요청할 때 이 도구를 사용하세요. 예: "프로젝트 개요를 알려주세요" 또는 "API 문서를 읽어주세요"',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: '읽을 문서의 파일명 (.md 확장자 포함 또는 생략 가능, 예: project-overview.md 또는 project-overview)'
                }
              },
              required: ['filename']
            }
          },
          {
            name: 'writeDocument',
            description: '##이것은 Documentory MCP 서버의 도구입니다## 새로운 문서를 생성해야 할 때 사용합니다. 사용자가 새 문서 작성을 요청하거나 특정 주제에 대한 문서를 만들고 싶어할 때 이 도구를 사용하세요. 예: "새로운 기능 문서를 작성해주세요" 또는 "설치 가이드를 만들어주세요"',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: '생성할 문서의 파일명 (.md 확장자는 자동으로 추가됨, 예: new-feature)'
                },
                content: {
                  type: 'string',
                  description: '문서의 내용 (Markdown 형식으로 작성)'
                }
              },
              required: ['filename', 'content']
            }
          },
          {
            name: 'updateDocument',
            description: '##이것은 Documentory MCP 서버의 도구입니다## 기존 문서를 수정해야 할 때 사용합니다. 사용자가 문서 내용 변경, 정보 추가, 또는 업데이트를 요청할 때 이 도구를 사용하세요. 예: "문서를 업데이트해주세요" 또는 "새로운 정보를 추가해주세요"',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: '수정할 문서의 파일명'
                },
                content: {
                  type: 'string',
                  description: '새로운 내용 (Markdown 형식, 기존 내용을 완전히 대체)'
                }
              },
              required: ['filename', 'content']
            }
          },
          {
            name: 'deleteDocument',
            description: '##이것은 Documentory MCP 서버의 도구입니다## 문서를 삭제해야 할 때 사용합니다. 사용자가 특정 문서의 제거를 요청할 때만 이 도구를 사용하세요. 삭제는 되돌릴 수 없으므로 신중하게 사용해야 합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: '삭제할 문서의 파일명'
                }
              },
              required: ['filename']
            }
          },
          {
            name: 'searchDocuments',
            description: '##이것은 Documentory MCP 서버의 도구입니다## 문서에서 특정 정보를 찾아야 할 때 사용합니다. 사용자가 특정 키워드나 주제에 대한 정보를 찾고 있을 때 이 도구를 사용하세요. 예: "API 관련 문서를 찾아주세요" 또는 "설치 방법이 어디에 있나요?"',
            inputSchema: {
              type: 'object',
              properties: {
                keyword: {
                  type: 'string',
                  description: '검색할 키워드나 구문'
                }
              },
              required: ['keyword']
            }
          }
        ]
      };
    });

    // 도구 호출 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        console.log(`🔧 도구 호출: ${name}`, args);

        switch (name) {
          case 'listDocuments':
            return await this.listDocuments();
          case 'readDocument':
            return await this.readDocument(args.filename);
          case 'writeDocument':
            return await this.writeDocument(args.filename, args.content);
          case 'updateDocument':
            return await this.updateDocument(args.filename, args.content);
          case 'deleteDocument':
            return await this.deleteDocument(args.filename);
          case 'searchDocuments':
            return await this.searchDocuments(args.keyword);
          default:
            throw new Error(`알 수 없는 도구: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류 발생: ${error.message}\n경로: ${this.docsPath}`
            }
          ]
        };
      }
    });
  }

  async listDocuments() {
    try {
      const files = fs.readdirSync(this.docsPath)
        .filter(file => file.endsWith('.md'))
        .sort();

      return {
        content: [
          {
            type: 'text',
            text: files.length > 0 
              ? `📚 문서 목록 (${files.length}개) - ${this.docsPath}:\n${files.map(f => `• ${f}`).join('\n')}`
              : `📭 문서가 없습니다 - ${this.docsPath}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`문서 목록 조회 실패: ${error.message}`);
    }
  }

  async readDocument(filename) {
    try {
      if (!filename.endsWith('.md')) {
        filename += '.md';
      }

      const filePath = path.join(this.docsPath, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error(`문서를 찾을 수 없습니다: ${filename}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return {
        content: [
          {
            type: 'text',
            text: `📖 ${filename} - ${this.docsPath}\n\n${content}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`문서 읽기 실패: ${error.message}`);
    }
  }

  async writeDocument(filename, content) {
    try {
      if (!filename.endsWith('.md')) {
        filename += '.md';
      }

      const filePath = path.join(this.docsPath, filename);
      if (fs.existsSync(filePath)) {
        throw new Error(`문서가 이미 존재합니다: ${filename}. updateDocument를 사용하세요.`);
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return {
        content: [
          {
            type: 'text',
            text: `✅ 문서가 성공적으로 생성되었습니다: ${filename}\n경로: ${this.docsPath}\n내용 길이: ${content.length}자`
          }
        ]
      };
    } catch (error) {
      throw new Error(`문서 생성 실패: ${error.message}`);
    }
  }

  async updateDocument(filename, content) {
    try {
      if (!filename.endsWith('.md')) {
        filename += '.md';
      }

      const filePath = path.join(this.docsPath, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error(`문서를 찾을 수 없습니다: ${filename}. writeDocument를 사용하여 새로 생성하세요.`);
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return {
        content: [
          {
            type: 'text',
            text: `✅ 문서가 성공적으로 수정되었습니다: ${filename}\n경로: ${this.docsPath}\n내용 길이: ${content.length}자`
          }
        ]
      };
    } catch (error) {
      throw new Error(`문서 수정 실패: ${error.message}`);
    }
  }

  async deleteDocument(filename) {
    try {
      if (!filename.endsWith('.md')) {
        filename += '.md';
      }

      const filePath = path.join(this.docsPath, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error(`문서를 찾을 수 없습니다: ${filename}`);
      }

      fs.unlinkSync(filePath);
      return {
        content: [
          {
            type: 'text',
            text: `🗑️ 문서가 성공적으로 삭제되었습니다: ${filename}\n경로: ${this.docsPath}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`문서 삭제 실패: ${error.message}`);
    }
  }

  async searchDocuments(keyword) {
    try {
      const files = fs.readdirSync(this.docsPath)
        .filter(file => file.endsWith('.md'));

      const results = [];
      for (const file of files) {
        const filePath = path.join(this.docsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          const lines = content.split('\n');
          const matchingLines = lines
            .map((line, index) => ({ line, lineNumber: index + 1 }))
            .filter(({ line }) => line.toLowerCase().includes(keyword.toLowerCase()))
            .slice(0, 3); // 파일당 최대 3개 라인만

          results.push({
            filename: file,
            matches: matchingLines
          });
        }
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 키워드 "${keyword}"에 대한 검색 결과가 없습니다.\n경로: ${this.docsPath}`
            }
          ]
        };
      }

      const resultText = results.map(({ filename, matches }) => {
        const matchText = matches.map(({ line, lineNumber }) => 
          `  ${lineNumber}행: ${line.trim()}`
        ).join('\n');
        return `📄 ${filename}:\n${matchText}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🔍 키워드 "${keyword}" 검색 결과 (${results.length}개 문서):\n경로: ${this.docsPath}\n\n${resultText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`문서 검색 실패: ${error.message}`);
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.app.listen(this.port, '0.0.0.0', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('🚀 Documentory MCP 서버가 시작되었습니다!');
          console.log(`📡 SSE 엔드포인트: http://localhost:${this.port}/sse`);
          console.log(`💬 메시지 엔드포인트: http://localhost:${this.port}/messages`);
          console.log(`🏥 상태 확인: http://localhost:${this.port}/health`);
          console.log(`📁 문서 경로: ${this.docsPath}`);
          console.log(`📚 Documentory: 프로젝트의 지식이 쌓여가는 곳`);
          console.log('');
          resolve();
        }
      });
    });
  }
}

function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 Documentory MCP 서버 - 사용법

기본 사용:
  node server.js                        # 기본값: 현재 디렉토리/docs, 포트 3000
  node server.js [docs경로]              # 사용자 지정 docs 경로
  node server.js [docs경로] [포트]        # docs 경로와 포트 모두 지정

옵션:
  --help, -h                            # 이 도움말 표시
  --dev                                 # 개발 모드 (더 자세한 로그)

예시:
  node server.js                                    # 기본 설정
  node server.js ./my-docs                          # 사용자 지정 docs 폴더
  node server.js C:/MyProject/docs                  # Windows 절대 경로
  node server.js ./docs 8080                        # 포트 8080 사용
  node server.js /home/user/project/docs 3001       # Linux 절대 경로, 포트 3001

HTTP 엔드포인트:
  GET  /                                 # 서버 정보
  GET  /sse                              # SSE 연결 (MCP 클라이언트용)
  POST /messages                         # 메시지 전송
  GET  /health                           # 상태 확인

사용법 (클라이언트 설정):
  Claude Desktop이나 Cursor에서 SSE URL로 연결:
  http://localhost:3000/sse
`);
    process.exit(0);
  }

  let docsPath = null;
  let port = 3000;
  let devMode = false;

  if (args.includes('--dev')) {
    devMode = true;
  }

  // --dev 옵션을 제거한 나머지 인자들
  const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
  
  if (nonFlagArgs.length >= 1) {
    docsPath = nonFlagArgs[0];
  }
  
  if (nonFlagArgs.length >= 2) {
    const parsedPort = parseInt(nonFlagArgs[1]);
    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
      port = parsedPort;
    } else {
      console.error(`❌ 잘못된 포트 번호: ${nonFlagArgs[1]}`);
      process.exit(1);
    }
  }

  return { docsPath, port, devMode };
}

// 메인 실행 함수
async function main() {
  try {
    const { docsPath, port, devMode } = parseArguments();
    
    if (devMode) {
      console.log('🔧 개발 모드 활성화');
    }
    
    const server = new DocumentoryServer(docsPath, port);
    await server.start();
    
    // 종료 신호 처리
    process.on('SIGINT', () => {
      console.log('\n👋 Documentory MCP 서버를 종료합니다...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n👋 Documentory MCP 서버를 종료합니다...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error.message);
    process.exit(1);
  }
}

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ 예상치 못한 오류:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

// 서버 시작
main().catch(console.error); 