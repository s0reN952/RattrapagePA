import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user === null ? undefined : user;
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    newUser.password = await bcrypt.hash(newUser.password, 10);
    return this.userRepository.save(newUser);
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user === null ? undefined : user;
  }

  async update(id: number, data: Partial<User>): Promise<User | undefined> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.userRepository.update({ id }, data);
    return this.findById(id);
  }
} 