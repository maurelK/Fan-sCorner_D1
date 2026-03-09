import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from './supabase.service';
import { LoginDto, RegisterDto, BecomeCreatorDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async validateUser(userId: string) {
    const user = await this.supabaseService.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!data.user?.id) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.supabaseService.db.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { sub: data.user.id, email: data.user.email ?? loginDto.email };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        creatorProfile: user.creatorProfile,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getClient();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }

    if (!data.user?.id) {
      throw new UnauthorizedException('Supabase user creation failed');
    }

    let user = null as any;

    try {
      user = await this.supabaseService.db.user.create({
        data: {
          id: data.user.id,
          email: registerDto.email,
          fullName: registerDto.fullName,
          role: 'FAN',
        },
      });
    } catch (dbError) {
      this.logger.warn(
        `Unable to create users profile row during register: ${(dbError as Error)?.message ?? 'unknown error'}`,
      );
    }

    const payload = { sub: data.user.id, email: data.user.email ?? registerDto.email };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user?.id ?? data.user.id,
        email: user?.email ?? data.user.email ?? registerDto.email,
        fullName: user?.fullName ?? registerDto.fullName,
        role: user?.role ?? 'FAN',
      },
    };
  }

  async becomeCreator(userId: string, becomeCreatorDto: BecomeCreatorDto) {
    // Update user role to creator
    const user = await this.supabaseService.db.user.update({
      where: { id: userId },
      data: { role: 'CREATOR' },
    });

    // Create creator profile
    const creatorProfile = await this.supabaseService.db.creatorProfile.create({
      data: {
        userId: user.id,
        bio: becomeCreatorDto.bio,
        priceFcfa: becomeCreatorDto.priceFcfa || 500,
        category: becomeCreatorDto.category,
      },
    });

    return {
      user,
      creatorProfile,
    };
  }

  async getMe(userId: string) {
    const user = await this.supabaseService.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
