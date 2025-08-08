# Project Specification: Admin Management System

## Project Overview

ระบบจัดการแอดมินสำหรับการบริหารจัดการข้อมูลต่างๆ ที่พัฒนาด้วย SvelteKit และ Supabase

## Technical Requirements

- ใน .env มีข้อมูลการเชื่อมต่อฐานข้อมูลทุกอย่าง

### Programming Languages & Frameworks

- **Frontend**: JavaScript (ES6+) เท่านั้น - ห้ามใช้ TypeScript
- **Framework**: SvelteKit
- **CSS**: Tailwind CSS - ใช้ utility-first approach สำหรับ styling
- **Database**: PostgreSQL ผ่าน Supabase โดยใช้ MCP server "@supabase/mcp-server-supabase@latest"

### Code Standards

#### JavaScript Standards

- ใช้ ES6+ syntax (const, let, arrow functions, destructuring)
- ใช้ async/await แทน Promise chains
- ใช้ template literals สำหรับ string interpolation
- ห้ามใช้ var - ใช้ const/let เท่านั้น
- Function naming: camelCase
- Variable naming: camelCase
- Constant naming: UPPER_SNAKE_CASE

#### File Structure Standards

```
src/
├── lib/                    # Shared utilities และ configurations
│   ├── supabase.js        # Supabase client
│   ├── utils.js           # Helper functions
│   └── constants.js       # Application constants
├── routes/                # SvelteKit routes
│   ├── admin/            # Admin pages
│   └── api/              # API endpoints (if needed)
├── components/           # Reusable Svelte components
└── styles/              # Global styles
```

#### Component Standards

- ใช้ Svelte components (.svelte files)
- Component naming: PascalCase สำหรับไฟล์ (UserCard.svelte)
- Props validation ด้วย JavaScript
- Event handling ด้วย Svelte directives
- State management ด้วย Svelte stores

### Responsive

- รองรับการแสดงผลได้ทั้ง Web PC และ Mobile
