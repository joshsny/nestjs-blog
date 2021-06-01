import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { LoginDto, RegisterDto } from '../models/user.model';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private JwtService: JwtService,
  ) {}

  async register(credentials: RegisterDto) {
    try {
      const user = this.userRepo.create(credentials);
      await user.save();
      const payload = { username: user.username };
      const token = this.JwtService.sign(payload);

      return { user: { ...user.toJSON(), token } };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Username has already been taemn');
      }
      throw new InternalServerErrorException();
    }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (user && (await user.comparePassword(password))) {
      const payload = { username: user.username };
      const token = this.JwtService.sign(payload);
      return {
        user: {
          ...user.toJSON(),
          token,
        },
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
