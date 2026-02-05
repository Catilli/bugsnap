import { FastifyInstance } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import { authService } from '../services/authService';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function oauthRoutes(fastify: FastifyInstance) {
  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    fastify.register(oauthPlugin, {
      name: 'googleOAuth2',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
        },
      },
      startRedirectPath: '/google',
      callbackUri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`,
      discovery: {
        issuer: 'https://accounts.google.com',
      },
    });

    fastify.get('/google/callback', async (request, reply) => {
      try {
        const { token } = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        const profile = (await userResponse.json()) as { id: string; email: string; name?: string };

        const user = await authService.findOrCreateOAuthUser(
          'google',
          profile.id,
          profile.email,
          profile.name || profile.email,
        );

        const jwtToken = fastify.jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          { expiresIn: '7d' },
        );

        return reply.redirect(`${FRONTEND_URL}/login?token=${jwtToken}`);
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }
    });
  }

  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    fastify.register(oauthPlugin, {
      name: 'githubOAuth2',
      scope: ['user:email'],
      credentials: {
        client: {
          id: process.env.GITHUB_CLIENT_ID,
          secret: process.env.GITHUB_CLIENT_SECRET,
        },
        auth: oauthPlugin.GITHUB_CONFIGURATION,
      },
      startRedirectPath: '/github',
      callbackUri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/github/callback`,
    });

    fastify.get('/github/callback', async (request, reply) => {
      try {
        const { token } = await (fastify as any).githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const profile = (await userResponse.json()) as { id: number; email?: string; name?: string; login: string };

        let email = profile.email;
        if (!email) {
          const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });
          const emails = (await emailResponse.json()) as { email: string; primary: boolean }[];
          const primary = emails.find((e) => e.primary) || emails[0];
          email = primary?.email;
        }

        if (!email) {
          return reply.redirect(`${FRONTEND_URL}/login?error=no_email`);
        }

        const user = await authService.findOrCreateOAuthUser(
          'github',
          String(profile.id),
          email,
          profile.name || profile.login,
        );

        const jwtToken = fastify.jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          { expiresIn: '7d' },
        );

        return reply.redirect(`${FRONTEND_URL}/login?token=${jwtToken}`);
      } catch (error) {
        fastify.log.error(error);
        return reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }
    });
  }
}
