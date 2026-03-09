import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase.service';

declare const Buffer: any;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (_request, rawJwtToken, done) => {
        try {
          const jwtSecret = configService.get<string>('JWT_SECRET');
          const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

          let isSupabaseToken = false;

          try {
            const payloadBase64 = rawJwtToken?.split('.')?.[1];
            if (payloadBase64) {
              const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
              const payload = JSON.parse(payloadJson);
              isSupabaseToken =
                typeof payload?.iss === 'string' &&
                payload.iss.includes('supabase.co/auth/v1');
            }
          } catch {
            isSupabaseToken = false;
          }

          const selectedSecret =
            isSupabaseToken && supabaseJwtSecret ? supabaseJwtSecret : jwtSecret;

          if (!selectedSecret) {
            return done(new UnauthorizedException('JWT secret is not configured'), undefined);
          }

          return done(null, selectedSecret);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.supabaseService.db.user.findUnique({
        where: { id: payload.sub },
      });

      if (user) {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          creatorProfile: user.creatorProfile,
        };
      }
    } catch {
      // fallback to JWT payload identity
    }

    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? 'fan',
      fullName: payload.fullName ?? null,
      creatorProfile: null,
    };
  }
}
