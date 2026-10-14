import CredentialsModule from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const CredentialsProvider = typeof CredentialsModule === 'function' 
  ? CredentialsModule 
  : (typeof CredentialsModule.default === 'function' ? CredentialsModule.default : CredentialsModule.default?.default || CredentialsModule);

// In-memory rate limiting store for login attempts (5 attempts, 10-min lockout)
const loginAttempts = new Map();

function checkRateLimit(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(normalized);

  if (!record) return { allowed: true };

  // If lockout expired, reset
  if (record.lockedUntil && now > record.lockedUntil) {
    loginAttempts.delete(normalized);
    return { allowed: true };
  }

  // If currently locked
  if (record.lockedUntil && now <= record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { 
      allowed: false, 
      message: `Account temporarily locked due to multiple failed login attempts. Please wait ${remainingMinutes} minute(s) before trying again.` 
    };
  }

  return { allowed: true, record };
}

function recordFailedAttempt(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(normalized) || { count: 0, firstAttempt: now };

  record.count += 1;
  record.lastAttempt = now;

  // Lock out after 5 consecutive failed attempts for 10 minutes
  if (record.count >= 5) {
    record.lockedUntil = now + (10 * 60 * 1000); // 10 minutes
  }

  loginAttempts.set(normalized, record);
  return record;
}

function clearFailedAttempts(email) {
  loginAttempts.delete(String(email || '').trim().toLowerCase());
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const rawEmail = String(credentials.email).trim();

        // Strict Check 1: Reject any uppercase letters
        if (/[A-Z]/.test(rawEmail)) {
          throw new Error('Uppercase letters are not allowed in email addresses. Please enter a proper lowercase email address (e.g. admin@shortfundly.com).');
        }

        // Strict Check 2: Valid email syntax format
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        if (!emailRegex.test(rawEmail)) {
          throw new Error('Please enter a valid lowercase email address format (e.g. admin@shortfundly.com).');
        }

        // Strict Check 3: Brute-Force Rate Limiting Check
        const rateCheck = checkRateLimit(rawEmail);
        if (!rateCheck.allowed) {
          throw new Error(rateCheck.message);
        }

        const db = getDb();
        // Case-sensitive exact match
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(rawEmail);

        if (!user) {
          const attempt = recordFailedAttempt(rawEmail);
          const remaining = Math.max(0, 5 - attempt.count);
          if (attempt.lockedUntil) {
            throw new Error('Account locked due to 5 consecutive failed attempts. Please retry in 10 minutes.');
          }
          throw new Error(`Invalid email or password. (${remaining} attempt(s) remaining before temporary lockout)`);
        }

        const isValid = bcrypt.compareSync(credentials.password, user.password_hash);
        if (!isValid) {
          const attempt = recordFailedAttempt(rawEmail);
          const remaining = Math.max(0, 5 - attempt.count);
          if (attempt.lockedUntil) {
            throw new Error('Account locked due to 5 consecutive failed attempts. Please retry in 10 minutes.');
          }
          throw new Error(`Invalid email or password. (${remaining} attempt(s) remaining before temporary lockout)`);
        }

        // Clear failed attempts on successful authentication
        clearFailedAttempts(rawEmail);

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'shortfundly-super-secure-jwt-secret-key-2026',
};
