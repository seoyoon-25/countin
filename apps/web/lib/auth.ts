import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@countin/database';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenants: {
              include: {
                tenant: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;

        // Get user's tenants
        const userWithTenants = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            tenants: {
              include: {
                tenant: true,
              },
            },
          },
        });

        if (userWithTenants?.tenants.length) {
          // Add first tenant info to session
          const firstTenantUser = userWithTenants.tenants[0];
          (session as any).tenantId = firstTenantUser.tenantId;
          (session as any).tenantName = firstTenantUser.tenant.name;
          (session as any).role = firstTenantUser.role;
        }
      }
      return session;
    },
  },
};

const nextAuth = NextAuth(authConfig);

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
