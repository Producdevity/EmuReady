import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "@prisma/client";

import { prisma } from "@/server/db";

// Extend the types to include our custom properties
declare module "next-auth" {
  interface User {
    role: Role;
  }
  
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// Simple password comparison - ONLY FOR DEVELOPMENT
// Replace with proper hashing in production
function verifyPassword(plainPassword: string, storedPassword: string): boolean {
  // For demo purposes, accept 'password123' for any user
  if (plainPassword === 'password123') {
    return true;
  }
  
  // Also support our simple hashing scheme from the users router
  if (storedPassword.startsWith('dev_hash_') && storedPassword === `dev_hash_${plainPassword}`) {
    return true;
  }
  
  return false;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          role: token.role,
        };
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          console.log("User not found:", credentials.email);
          throw new Error("Invalid credentials");
        }

        // Use our simple password verification instead of bcrypt
        const isPasswordValid = verifyPassword(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          console.log("Invalid password for user:", credentials.email);
          throw new Error("Invalid credentials");
        }

        console.log("User authenticated successfully:", user.email, "with role:", user.role);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}; 