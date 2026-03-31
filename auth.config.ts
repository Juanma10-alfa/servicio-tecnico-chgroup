import type { NextAuthConfig } from 'next-auth';

const authConfig = {
  providers: [],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isLoginRoute = nextUrl.pathname === '/admin/login';

      if (!isAdminRoute || isLoginRoute) {
        return true;
      }

      return Boolean(auth?.user && auth.user.role === 'admin');
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
