# AccessKit Implementation Plan
## Website Accessibility Compliance Scanner SaaS

**Version:** 1.0  
**Last Updated:** 2024  
**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma + PostgreSQL, NextAuth.js, PayStack, Tailwind CSS + shadcn/ui, Resend

---

# Table of Contents

1. [Phase 1: Project Foundation](#phase-1-project-foundation)
2. [Phase 2: Website Management System](#phase-2-website-management-system)
3. [Phase 3: Accessibility Scanner Engine](#phase-3-accessibility-scanner-engine)
4. [Phase 4: Detailed Reporting System](#phase-4-detailed-reporting-system)
5. [Phase 5: Automated Scanning & Notifications](#phase-5-automated-scanning--notifications)
6. [Phase 6: Subscription Billing & Agency Features](#phase-6-subscription-billing--agency-features)

---

# Phase 1: Project Foundation

## Phase Overview

Phase 1 establishes the core infrastructure for AccessKit. We'll set up the Next.js 14 application with TypeScript, configure the database schema using Prisma, implement authentication with NextAuth.js (supporting Google OAuth and email/password), create a basic user dashboard, and build the foundation for subscription tier management. This phase ensures we have a secure, scalable base upon which all subsequent features will be built.

**Why this phase matters:** Without a solid foundation, subsequent phases will be built on unstable ground. Authentication and user management are prerequisites for all other features. The database schema must be designed to support all future requirements while remaining flexible.

**Estimated Duration:** 1-2 weeks  
**Dependencies:** None (this is the starting point)

---

## Detailed Requirements

### 1.1 Next.js 14 Setup with TypeScript

**Requirement:** Initialize a Next.js 14 project using the App Router with TypeScript, ESLint, and Tailwind CSS configured.

**Acceptance Criteria:**
- ✅ Next.js 14.2+ installed with App Router enabled
- ✅ TypeScript configured with strict mode enabled
- ✅ ESLint configured with Next.js recommended rules
- ✅ Tailwind CSS v3+ configured and working
- ✅ shadcn/ui installed and configured
- ✅ Project structure follows Next.js 14 App Router conventions
- ✅ Environment variables properly configured with `.env.example` file
- ✅ Git repository initialized with `.gitignore` for Node.js/Next.js

**User Stories:**
- As a developer, I want the project to use TypeScript so I can catch errors at compile time
- As a developer, I want Tailwind CSS configured so I can style components quickly
- As a developer, I want shadcn/ui installed so I can use pre-built accessible components

### 1.2 Database Schema (Prisma)

**Requirement:** Design and implement the complete database schema using Prisma ORM with PostgreSQL. The schema must support users, authentication, subscription tiers, and be extensible for future features.

**Acceptance Criteria:**
- ✅ Prisma installed and configured with PostgreSQL provider
- ✅ Database connection string configured via environment variables
- ✅ All models defined with proper relationships and constraints
- ✅ Migrations can be generated and applied successfully
- ✅ Prisma Client generated and importable
- ✅ Seed script created for development data

**User Stories:**
- As a developer, I want a well-structured database schema so I can store user and subscription data
- As a developer, I want Prisma migrations so I can version control database changes
- As a developer, I want a seed script so I can populate test data easily

### 1.3 Authentication (NextAuth.js)

**Requirement:** Implement authentication using NextAuth.js v5 (Auth.js) supporting Google OAuth and email/password authentication with email verification.

**Acceptance Criteria:**
- ✅ NextAuth.js v5 installed and configured
- ✅ Google OAuth provider configured and working
- ✅ Email/password authentication implemented
- ✅ Email verification flow (magic link or verification code)
- ✅ Password reset flow implemented
- ✅ Session management working correctly
- ✅ Protected routes redirect unauthenticated users
- ✅ User profile accessible after login
- ✅ Sign out functionality working

**User Stories:**
- As a user, I want to sign up with Google so I can use my existing account
- As a user, I want to sign up with email/password so I can create a new account
- As a user, I want to verify my email so I know my account is secure
- As a user, I want to reset my password if I forget it
- As a user, I want to sign out so I can secure my account

### 1.4 Basic User Dashboard

**Requirement:** Create a basic dashboard layout that authenticated users see after logging in, showing their subscription tier, account information, and navigation to future features.

**Acceptance Criteria:**
- ✅ Dashboard route protected (requires authentication)
- ✅ Responsive layout with sidebar navigation
- ✅ User profile information displayed
- ✅ Current subscription tier shown
- ✅ Navigation menu with placeholder links for future features
- ✅ Loading states implemented
- ✅ Error boundaries in place
- ✅ Accessible markup (ARIA labels, semantic HTML)

**User Stories:**
- As a user, I want to see my dashboard after logging in so I know I'm in the right place
- As a user, I want to see my subscription tier so I know what features I have access to
- As a user, I want to navigate to different sections so I can access features

### 1.5 Subscription Tier Management

**Requirement:** Implement the foundation for subscription tier management, including tier definitions, user tier assignment, and tier-based feature flags.

**Acceptance Criteria:**
- ✅ Three subscription tiers defined (Starter, Professional, Agency)
- ✅ Users can be assigned to tiers
- ✅ Tier limits stored and accessible (websites, scans, etc.)
- ✅ Helper functions to check tier permissions
- ✅ Tier upgrade/downgrade logic structure in place (UI not required yet)
- ✅ Tier information displayed on dashboard

**User Stories:**
- As a user, I want to see my subscription tier so I know my limits
- As a developer, I want tier checking functions so I can enforce limits
- As a user, I want to understand what features each tier includes

---

## Database Schema

### Prisma Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model - stores user account information
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Hashed password for email/password auth
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relationships
  accounts      Account[]
  sessions      Session[]
  websites      Website[]
  subscription  Subscription?
  teamMembers   TeamMember[] // For Agency tier team management

  @@map("users")
}

// NextAuth.js Account model
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

// NextAuth.js Session model
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// NextAuth.js VerificationToken model
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// Subscription tiers enum
enum SubscriptionTier {
  STARTER      // $49/month
  PROFESSIONAL // $149/month
  AGENCY       // $299/month
}

// Subscription status enum
enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
}

// Subscription model - stores user subscription information
model Subscription {
  id                String             @id @default(cuid())
  userId            String             @unique
  tier              SubscriptionTier   @default(STARTER)
  status            SubscriptionStatus @default(TRIALING)
  paystackCustomerId String?           // PayStack customer ID
  paystackSubscriptionId String?       // PayStack subscription ID
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean           @default(false)
  trialEndsAt        DateTime?         // 14-day free trial
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

// Website model - stores websites to be scanned (Phase 2)
model Website {
  id          String   @id @default(cuid())
  userId      String
  name        String
  url         String   // Full URL (e.g., https://example.com)
  verified    Boolean  @default(false)
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scans       Scan[]   // Scans performed on this website

  @@unique([userId, url]) // One user can't add the same URL twice
  @@map("websites")
}

// Scan model - stores scan results (Phase 3)
model Scan {
  id            String   @id @default(cuid())
  websiteId     String
  status        ScanStatus @default(PENDING)
  complianceScore Int?   // 0-100 score
  totalViolations Int?   // Total number of violations found
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  errorMessage  String?  @db.Text
  scanData      Json?    // Stores detailed scan results from axe-core/pa11y

  website Website @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@map("scans")
}

enum ScanStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

// TeamMember model - for Agency tier team management (Phase 6)
model TeamMember {
  id        String   @id @default(cuid())
  userId    String   // The team member's user ID
  ownerId   String   // The agency owner's user ID
  role      TeamRole @default(MEMBER)
  invitedBy String
  invitedAt DateTime @default(now())
  joinedAt  DateTime?

  user  User @relation(fields: [userId], references: [id], onDelete: Cascade)
  owner User @relation("TeamOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  @@unique([userId, ownerId])
  @@map("team_members")
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}
```

### Database Indexes

Add these indexes for performance:

```prisma
// Add to User model
@@index([email])

// Add to Website model
@@index([userId])
@@index([userId, verified])

// Add to Scan model
@@index([websiteId])
@@index([websiteId, status])
@@index([websiteId, completedAt(sort: Desc)])

// Add to Subscription model
@@index([userId])
@@index([status])
```

---

## File Structure

```
accesskit/
├── .env.example                    # Environment variables template
├── .env.local                      # Local environment variables (gitignored)
├── .gitignore
├── next.config.js                  # Next.js configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js               # Tailwind CSS PostCSS config
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.js                # ESLint configuration
├── prisma/
│   ├── schema.prisma               # Prisma schema (defined above)
│   └── seed.ts                     # Database seed script
├── public/
│   └── (static assets)
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Homepage (landing page)
│   │   ├── globals.css             # Global styles + Tailwind
│   │   ├── (auth)/
│   │   │   ├── layout.tsx         # Auth layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx       # Registration page
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx       # Email verification page
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx       # Password reset page
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           └── [...nextauth]/
│   │   │               └── route.ts # NextAuth.js API route
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Dashboard layout (with sidebar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Main dashboard page
│   │   │   ├── settings/
│   │   │   │   └── page.tsx        # User settings page
│   │   │   └── api/
│   │   │       └── (protected routes)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # NextAuth.js handler
│   │       └── (other API routes)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── (other shadcn components)
│   │   ├── auth/
│   │   │   ├── login-form.tsx      # Login form component
│   │   │   ├── register-form.tsx   # Registration form component
│   │   │   ├── reset-password-form.tsx
│   │   │   └── social-login.tsx    # Google OAuth button
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx          # Dashboard sidebar navigation
│   │   │   ├── user-menu.tsx       # User dropdown menu
│   │   │   ├── subscription-card.tsx # Subscription tier display
│   │   │   └── stats-card.tsx      # Stats display cards
│   │   └── layout/
│   │       ├── header.tsx           # Site header
│   │       └── footer.tsx           # Site footer
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth.ts                 # NextAuth.js configuration
│   │   ├── utils.ts                # Utility functions (cn, etc.)
│   │   ├── validations.ts          # Zod schemas for validation
│   │   ├── subscriptions.ts        # Subscription tier helpers
│   │   └── email.ts                # Email sending utilities (Resend)
│   ├── server/
│   │   ├── actions/
│   │   │   ├── auth.ts             # Auth server actions
│   │   │   └── user.ts             # User-related server actions
│   │   └── middleware.ts           # Next.js middleware (auth checks)
│   └── types/
│       ├── auth.ts                 # Auth-related types
│       ├── subscription.ts         # Subscription types
│       └── database.ts             # Database types (from Prisma)
├── middleware.ts                   # Root middleware file
└── README.md
```

---

## Implementation Steps

### Step 1: Initialize Next.js 14 Project

1. **Create Next.js project:**
   ```bash
   pnpm create next-app@latest accesskit --typescript --tailwind --eslint --app
   cd accesskit
   ```

2. **Install additional dependencies:**
   ```bash
   pnpm add @prisma/client bcryptjs zod
   pnpm add -D prisma @types/bcryptjs
   ```

3. **Install NextAuth.js v5:**
   ```bash
   pnpm add next-auth@beta
   ```

4. **Install shadcn/ui:**
   ```bash
   pnpm dlx shadcn@latest init
   # Follow prompts: TypeScript, Tailwind, Default style, App Router
   ```

5. **Install shadcn/ui components:**
   ```bash
   pnpm dlx shadcn@latest add button card input label sidebar
   ```

6. **Install Resend for emails:**
   ```bash
   pnpm add resend
   ```

7. **Create `.env.example` file:**
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/accesskit?schema=public"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Resend
   RESEND_API_KEY="re_your_resend_api_key"
   FROM_EMAIL="noreply@yourdomain.com"

   # PayStack (Phase 6, but add now)
   PAYSTACK_SECRET_KEY="sk_test_..."
   PAYSTACK_PUBLIC_KEY="pk_test_..."
   ```

### Step 2: Configure Prisma

1. **Initialize Prisma:**
   ```bash
   pnpm prisma init
   ```

2. **Create `prisma/schema.prisma`** with the schema defined above.

3. **Create initial migration:**
   ```bash
   pnpm prisma migrate dev --name init
   ```

4. **Generate Prisma Client:**
   ```bash
   pnpm prisma generate
   ```

5. **Create `src/lib/prisma.ts`:**
   ```typescript
   import { PrismaClient } from '@prisma/client'

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined
   }

   export const prisma = globalForPrisma.prisma ?? new PrismaClient({
     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
   })

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```

6. **Create seed script `prisma/seed.ts`:**
   ```typescript
   import { PrismaClient, SubscriptionTier } from '@prisma/client'
   import bcrypt from 'bcryptjs'

   const prisma = new PrismaClient()

   async function main() {
     // Create test user with email/password
     const hashedPassword = await bcrypt.hash('password123', 10)
     
     const user = await prisma.user.create({
       data: {
         email: 'test@example.com',
         name: 'Test User',
         password: hashedPassword,
         emailVerified: new Date(),
         subscription: {
           create: {
             tier: SubscriptionTier.PROFESSIONAL,
             status: 'ACTIVE',
             trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
           },
         },
       },
     })

     console.log('Seed data created:', user)
   }

   main()
     .catch((e) => {
       console.error(e)
       process.exit(1)
     })
     .finally(async () => {
       await prisma.$disconnect()
     })
   ```

7. **Add seed script to `package.json`:**
   ```json
   {
     "prisma": {
       "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
     }
   }
   ```

### Step 3: Configure NextAuth.js v5

1. **Create `src/lib/auth.ts`:**
   ```typescript
   import { NextAuthOptions } from 'next-auth'
   import GoogleProvider from 'next-auth/providers/google'
   import CredentialsProvider from 'next-auth/providers/credentials'
   import { PrismaAdapter } from '@auth/prisma-adapter'
   import { prisma } from './prisma'
   import bcrypt from 'bcryptjs'

   export const authOptions: NextAuthOptions = {
     adapter: PrismaAdapter(prisma) as any,
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       }),
       CredentialsProvider({
         name: 'Credentials',
         credentials: {
           email: { label: 'Email', type: 'email' },
           password: { label: 'Password', type: 'password' },
         },
         async authorize(credentials) {
           if (!credentials?.email || !credentials?.password) {
             throw new Error('Invalid credentials')
           }

           const user = await prisma.user.findUnique({
             where: { email: credentials.email },
           })

           if (!user || !user.password) {
             throw new Error('Invalid credentials')
           }

           const isPasswordValid = await bcrypt.compare(
             credentials.password,
             user.password
           )

           if (!isPasswordValid) {
             throw new Error('Invalid credentials')
           }

           if (!user.emailVerified) {
             throw new Error('Please verify your email before signing in')
           }

           return {
             id: user.id,
             email: user.email,
             name: user.name,
             image: user.image,
           }
         },
       }),
     ],
     pages: {
       signIn: '/login',
       error: '/login',
     },
     session: {
       strategy: 'jwt',
     },
     callbacks: {
       async jwt({ token, user }) {
         if (user) {
           token.id = user.id
         }
         return token
       },
       async session({ session, token }) {
         if (session.user) {
           session.user.id = token.id as string
         }
         return session
       },
     },
   }
   ```

2. **Install Prisma adapter:**
   ```bash
   pnpm add @auth/prisma-adapter
   ```

3. **Create `src/app/api/auth/[...nextauth]/route.ts`:**
   ```typescript
   import NextAuth from 'next-auth'
   import { authOptions } from '@/lib/auth'

   const handler = NextAuth(authOptions)

   export { handler as GET, handler as POST }
   ```

4. **Create `src/types/auth.ts`:**
   ```typescript
   import { DefaultSession } from 'next-auth'

   declare module 'next-auth' {
     interface Session {
       user: {
         id: string
       } & DefaultSession['user']
     }

     interface User {
       id: string
     }
   }
   ```

### Step 4: Create Authentication Pages

1. **Create `src/app/(auth)/login/page.tsx`:**
   ```typescript
   import { LoginForm } from '@/components/auth/login-form'

   export default function LoginPage() {
     return (
       <div className="container flex h-screen w-screen flex-col items-center justify-center">
         <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
           <div className="flex flex-col space-y-2 text-center">
             <h1 className="text-2xl font-semibold tracking-tight">
               Welcome back
             </h1>
             <p className="text-sm text-muted-foreground">
               Sign in to your account to continue
             </p>
           </div>
           <LoginForm />
         </div>
       </div>
     )
   }
   ```

2. **Create `src/components/auth/login-form.tsx`:**
   ```typescript
   'use client'

   import { signIn } from 'next-auth/react'
   import { useState } from 'react'
   import { useRouter } from 'next/navigation'
   import { Button } from '@/components/ui/button'
   import { Input } from '@/components/ui/input'
   import { Label } from '@/components/ui/label'
   import { SocialLogin } from './social-login'

   export function LoginForm() {
     const router = useRouter()
     const [email, setEmail] = useState('')
     const [password, setPassword] = useState('')
     const [isLoading, setIsLoading] = useState(false)
     const [error, setError] = useState('')

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault()
       setIsLoading(true)
       setError('')

       try {
         const result = await signIn('credentials', {
           email,
           password,
           redirect: false,
         })

         if (result?.error) {
           setError(result.error)
         } else {
           router.push('/dashboard')
           router.refresh()
         }
       } catch (err) {
         setError('An error occurred. Please try again.')
       } finally {
         setIsLoading(false)
       }
     }

     return (
       <form onSubmit={handleSubmit} className="space-y-4">
         {error && (
           <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
             {error}
           </div>
         )}
         <div className="space-y-2">
           <Label htmlFor="email">Email</Label>
           <Input
             id="email"
             type="email"
             placeholder="name@example.com"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             disabled={isLoading}
           />
         </div>
         <div className="space-y-2">
           <Label htmlFor="password">Password</Label>
           <Input
             id="password"
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             disabled={isLoading}
           />
         </div>
         <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? 'Signing in...' : 'Sign in'}
         </Button>
         <div className="relative">
           <div className="absolute inset-0 flex items-center">
             <span className="w-full border-t" />
           </div>
           <div className="relative flex justify-center text-xs uppercase">
             <span className="bg-background px-2 text-muted-foreground">
               Or continue with
             </span>
           </div>
         </div>
         <SocialLogin />
       </form>
     )
   }
   ```

3. **Create `src/components/auth/social-login.tsx`:**
   ```typescript
   'use client'

   import { signIn } from 'next-auth/react'
   import { Button } from '@/components/ui/button'

   export function SocialLogin() {
     const handleGoogleSignIn = () => {
       signIn('google', { callbackUrl: '/dashboard' })
     }

     return (
       <Button
         type="button"
         variant="outline"
         className="w-full"
         onClick={handleGoogleSignIn}
       >
         <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
           {/* Google icon SVG */}
         </svg>
         Google
       </Button>
     )
   }
   ```

4. **Create similar pages for register, verify-email, and reset-password** (follow same pattern).

### Step 5: Create Middleware for Route Protection

1. **Create `middleware.ts` in root:**
   ```typescript
   import { withAuth } from 'next-auth/middleware'
   import { NextResponse } from 'next/server'

   export default withAuth(
     function middleware(req) {
       return NextResponse.next()
     },
     {
       callbacks: {
         authorized: ({ token }) => !!token,
       },
     }
   )

   export const config = {
     matcher: ['/dashboard/:path*', '/settings/:path*'],
   }
   ```

### Step 6: Create Dashboard Layout and Page

1. **Create `src/app/(dashboard)/layout.tsx`:**
   ```typescript
   import { redirect } from 'next/navigation'
   import { getServerSession } from 'next-auth'
   import { authOptions } from '@/lib/auth'
   import { DashboardSidebar } from '@/components/dashboard/sidebar'

   export default async function DashboardLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     const session = await getServerSession(authOptions)

     if (!session) {
       redirect('/login')
     }

     return (
       <div className="flex min-h-screen">
         <DashboardSidebar />
         <main className="flex-1">{children}</main>
       </div>
     )
   }
   ```

2. **Create `src/components/dashboard/sidebar.tsx`:**
   ```typescript
   'use client'

   import Link from 'next/link'
   import { usePathname } from 'next/navigation'
   import { signOut } from 'next-auth/react'
   import { cn } from '@/lib/utils'

   const navigation = [
     { name: 'Dashboard', href: '/dashboard' },
     { name: 'Websites', href: '/dashboard/websites' },
     { name: 'Reports', href: '/dashboard/reports' },
     { name: 'Settings', href: '/dashboard/settings' },
   ]

   export function DashboardSidebar() {
     const pathname = usePathname()

     return (
       <aside className="w-64 border-r bg-background">
         <div className="flex h-full flex-col">
           <div className="flex h-16 items-center border-b px-6">
             <h1 className="text-xl font-bold">AccessKit</h1>
           </div>
           <nav className="flex-1 space-y-1 px-3 py-4">
             {navigation.map((item) => {
               const isActive = pathname === item.href
               return (
                 <Link
                   key={item.name}
                   href={item.href}
                   className={cn(
                     'block rounded-md px-3 py-2 text-sm font-medium',
                     isActive
                       ? 'bg-accent text-accent-foreground'
                       : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                   )}
                 >
                   {item.name}
                 </Link>
               )
             })}
           </nav>
           <div className="border-t p-4">
             <button
               onClick={() => signOut({ callbackUrl: '/login' })}
               className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent"
             >
               Sign out
             </button>
           </div>
         </div>
       </aside>
     )
   }
   ```

3. **Create `src/app/(dashboard)/dashboard/page.tsx`:**
   ```typescript
   import { getServerSession } from 'next-auth'
   import { authOptions } from '@/lib/auth'
   import { prisma } from '@/lib/prisma'
   import { redirect } from 'next/navigation'
   import { SubscriptionCard } from '@/components/dashboard/subscription-card'

   export default async function DashboardPage() {
     const session = await getServerSession(authOptions)

     if (!session) {
       redirect('/login')
     }

     const user = await prisma.user.findUnique({
       where: { id: session.user.id },
       include: { subscription: true },
     })

     if (!user) {
       redirect('/login')
     }

     return (
       <div className="container mx-auto p-6">
         <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           <SubscriptionCard subscription={user.subscription} />
           {/* Add more cards for stats in future phases */}
         </div>
       </div>
     )
   }
   ```

### Step 7: Create Subscription Helper Functions

1. **Create `src/lib/subscriptions.ts`:**
   ```typescript
   import { SubscriptionTier } from '@prisma/client'

   export const TIER_LIMITS = {
     [SubscriptionTier.STARTER]: {
       websites: 5,
       scansPerWeek: 5,
       reports: 'basic',
       support: 'email',
       price: 49,
     },
     [SubscriptionTier.PROFESSIONAL]: {
       websites: 25,
       scansPerWeek: 25,
       reports: 'detailed',
       support: 'priority',
       price: 149,
     },
     [SubscriptionTier.AGENCY]: {
       websites: 100,
       scansPerWeek: 100,
       reports: 'detailed',
       support: 'dedicated',
       price: 299,
     },
   } as const

   export function getTierLimits(tier: SubscriptionTier) {
     return TIER_LIMITS[tier]
   }

   export function canAddWebsite(
     currentCount: number,
     tier: SubscriptionTier
   ): boolean {
     const limits = getTierLimits(tier)
     return currentCount < limits.websites
   }

   export function getTierName(tier: SubscriptionTier): string {
     return tier.charAt(0) + tier.slice(1).toLowerCase()
   }
   ```

2. **Create `src/components/dashboard/subscription-card.tsx`:**
   ```typescript
   import { Subscription } from '@prisma/client'
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
   import { getTierLimits, getTierName } from '@/lib/subscriptions'

   interface SubscriptionCardProps {
     subscription: Subscription | null
   }

   export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
     if (!subscription) {
       return (
         <Card>
           <CardHeader>
             <CardTitle>No Subscription</CardTitle>
           </CardHeader>
           <CardContent>
             <p>Please subscribe to start using AccessKit.</p>
           </CardContent>
         </Card>
       )

     const limits = getTierLimits(subscription.tier)

     return (
       <Card>
         <CardHeader>
           <CardTitle>Current Plan</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-2">
             <p className="text-2xl font-bold">{getTierName(subscription.tier)}</p>
             <p className="text-sm text-muted-foreground">
               ${limits.price}/month
             </p>
             <div className="mt-4 space-y-1 text-sm">
               <p>• {limits.websites} websites</p>
               <p>• {limits.scansPerWeek} scans per week</p>
               <p>• {limits.reports} reports</p>
             </div>
           </div>
         </CardContent>
       </Card>
     )
   }
   ```

### Step 8: Create Server Actions for User Operations

1. **Create `src/server/actions/auth.ts`:**
   ```typescript
   'use server'

   import { prisma } from '@/lib/prisma'
   import bcrypt from 'bcryptjs'
   import { z } from 'zod'
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

   const registerSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     name: z.string().min(1),
   })

   export async function registerUser(data: unknown) {
     const validated = registerSchema.parse(data)

     const existingUser = await prisma.user.findUnique({
       where: { email: validated.email },
     })

     if (existingUser) {
       throw new Error('User already exists')
     }

     const hashedPassword = await bcrypt.hash(validated.password, 10)
     const verificationToken = crypto.randomUUID()

     const user = await prisma.user.create({
       data: {
         email: validated.email,
         name: validated.name,
         password: hashedPassword,
         // Store verification token (simplified - use proper token table in production)
       },
     })

     // Send verification email
     await resend.emails.send({
       from: process.env.FROM_EMAIL!,
       to: validated.email,
       subject: 'Verify your AccessKit account',
       html: `<p>Click <a href="${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}">here</a> to verify your email.</p>`,
     })

     return { success: true, userId: user.id }
   }
   ```

### Step 9: Update Root Layout and Global Styles

1. **Update `src/app/layout.tsx`:**
   ```typescript
   import type { Metadata } from 'next'
   import { Inter } from 'next/font/google'
   import './globals.css'
   import { Providers } from './providers'

   const inter = Inter({ subsets: ['latin'] })

   export const metadata: Metadata = {
     title: 'AccessKit - Website Accessibility Compliance Scanner',
     description: 'Scan your website for WCAG 2.1 compliance and avoid ADA lawsuits',
   }

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body className={inter.className}>
           <Providers>{children}</Providers>
         </body>
       </html>
     )
   }
   ```

2. **Create `src/app/providers.tsx`:**
   ```typescript
   'use client'

   import { SessionProvider } from 'next-auth/react'

   export function Providers({ children }: { children: React.ReactNode }) {
     return <SessionProvider>{children}</SessionProvider>
   }
   ```

3. **Update `src/app/globals.css`** to include Tailwind directives and shadcn/ui theme variables.

---

## Key Technical Decisions

### 1. NextAuth.js v5 (Auth.js) vs v4
**Decision:** Use NextAuth.js v5 (beta)  
**Rationale:** v5 is the future of NextAuth.js with better TypeScript support, improved API, and App Router optimization. While still in beta, it's stable enough for production and aligns with Next.js 14 best practices.

### 2. JWT vs Database Sessions
**Decision:** Use JWT sessions  
**Rationale:** JWT sessions are stateless, scale better, and reduce database load. For a SaaS application, this is the preferred approach. Database sessions would be used if we needed to revoke sessions immediately.

### 3. Prisma Adapter for NextAuth
**Decision:** Use Prisma adapter  
**Rationale:** The Prisma adapter automatically handles Account, Session, and VerificationToken models, reducing boilerplate and ensuring compatibility.

### 4. Server Actions vs API Routes
**Decision:** Use Server Actions for mutations, API Routes for external integrations  
**Rationale:** Server Actions are the Next.js 14 recommended approach for form submissions and mutations. They provide better type safety and simpler code. API Routes will be used for webhooks and external integrations (PayStack, etc.).

### 5. Subscription Tier Storage
**Decision:** Store tier limits in code (constants) rather than database  
**Rationale:** Tier limits are business logic that changes infrequently. Storing in code makes it easier to version control and deploy changes. If limits need to be dynamic per customer, we can add a `customLimits` JSON field later.

### 6. Email Verification Strategy
**Decision:** Use token-based email verification with expiration  
**Rationale:** Secure and standard approach. Tokens should expire after 24 hours. In production, store tokens in a separate table with expiration dates.

---

## Testing Checklist

### Authentication Testing
- [ ] User can register with email/password
- [ ] User receives verification email after registration
- [ ] User cannot login before verifying email
- [ ] User can verify email with valid token
- [ ] User cannot verify email with expired/invalid token
- [ ] User can login with Google OAuth
- [ ] User can login with verified email/password
- [ ] User cannot login with incorrect credentials
- [ ] User can reset password
- [ ] User receives password reset email
- [ ] User can change password with valid reset token
- [ ] User can sign out
- [ ] Protected routes redirect unauthenticated users

### Database Testing
- [ ] Prisma migrations run successfully
- [ ] Seed script creates test data
- [ ] User model relationships work (accounts, sessions, subscription)
- [ ] Unique constraints enforced (email, userId+url for websites)
- [ ] Cascade deletes work correctly

### Dashboard Testing
- [ ] Authenticated user can access dashboard
- [ ] Unauthenticated user redirected to login
- [ ] Subscription tier displayed correctly
- [ ] Navigation links work
- [ ] User menu displays correctly
- [ ] Sign out works from dashboard

### Subscription Tier Testing
- [ ] Tier limits returned correctly for each tier
- [ ] `canAddWebsite` function works correctly
- [ ] Tier names formatted correctly
- [ ] Default tier (STARTER) assigned to new users

### Security Testing
- [ ] Passwords are hashed (not stored in plain text)
- [ ] Environment variables not exposed to client
- [ ] CSRF protection enabled (NextAuth.js default)
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS protection (React default escaping)

### Performance Testing
- [ ] Page load times < 2 seconds
- [ ] Database queries optimized (check Prisma logs)
- [ ] No N+1 query problems
- [ ] Images optimized (if any)

---

## Before Next Phase

### Prerequisites for Phase 2

Before proceeding to Phase 2 (Website Management System), ensure:

1. **All Phase 1 tests pass** - Complete the testing checklist above
2. **Database is stable** - No pending migrations, seed data works
3. **Authentication is working** - Users can sign up, verify email, and log in
4. **Dashboard is accessible** - Authenticated users can see their dashboard
5. **Subscription tiers are functional** - Tier limits and checks work correctly
6. **Environment variables configured** - All required env vars set in `.env.local`
7. **Error handling in place** - Basic error boundaries and error states implemented
8. **TypeScript strict mode** - No `any` types, all types properly defined
9. **Code quality** - ESLint passes, code follows project conventions
10. **Git repository** - Code committed and pushed to version control

### Known Limitations After Phase 1

These will be addressed in later phases:
- No website management yet (Phase 2)
- No scanning functionality (Phase 3)
- No reports (Phase 4)
- No automated scans (Phase 5)
- No billing integration (Phase 6)
- Email verification token storage simplified (should use proper token table)
- No rate limiting yet
- No monitoring/logging beyond console

---

## Phase 1 Summary

**What we built:**
- ✅ Next.js 14 project with TypeScript, Tailwind, and shadcn/ui
- ✅ Prisma schema with User, Account, Session, Subscription, Website, Scan models
- ✅ NextAuth.js authentication (Google OAuth + Email/Password)
- ✅ Email verification and password reset flows
- ✅ Protected dashboard with sidebar navigation
- ✅ Subscription tier system with limits and helpers
- ✅ Basic server actions for user operations

**What's ready for Phase 2:**
- Users can authenticate and access their dashboard
- Database schema supports websites and scans
- Subscription tiers are defined and checkable
- Foundation is solid and extensible

---

**Ready for Phase 2?** Once you've completed Phase 1 and verified all tests pass, let me know and I'll provide the detailed Phase 2 implementation plan.

