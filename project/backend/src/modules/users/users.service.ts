import { Injectable, ConflictException, NotFoundException, UnprocessableEntityException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { RedisService } from '../../database/redis.service';
import * as bcrypt from 'bcrypt';

const DEPARTMENT_COST_CENTER_MAP: Record<string, string[]> = {
  'Finance': ['CC-101', 'CC-99'],
  'Engineering': ['CC-101', 'PD-102'],
  'Sales': ['CC-103', 'GS-505'],
  'Marketing': ['CC-102', 'MKT-400'],
  'Compliance': ['CC-101'],
  'HR': ['CC-101'],
  'Executive Operations': ['CC-99']
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    const adminEmail = 'admin@company.com';
    const adminUser = await this.findByEmail(adminEmail);
    if (!adminUser) {
      const passwordHash = await bcrypt.hash('password123', 10);
      const newAdmin = new this.userModel({
        email: adminEmail,
        passwordHash,
        name: 'System Admin',
        role: 'admin',
        department: 'Executive Operations',
        costCenter: 'CC-99',
        isActive: true,
      });
      await newAdmin.save();
      console.log('Seeded Admin user: admin@company.com / password123');
    }
  }

  private validateDepartmentCostCenter(department: string, costCenter: string) {
    const allowedCcs = DEPARTMENT_COST_CENTER_MAP[department];
    if (!allowedCcs) {
      throw new UnprocessableEntityException(`Invalid department: ${department}`);
    }
    if (!allowedCcs.includes(costCenter)) {
      throw new UnprocessableEntityException(
        `Cost center ${costCenter} is not valid for department ${department}. Allowed: ${allowedCcs.join(', ')}`
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with duplicate email already exists');
    }

    const department = createUserDto.department || 'Engineering';
    const costCenter = createUserDto.costCenter || 'CC-101';
    
    // USR-06: Department/Cost-Center Mapping validation
    this.validateDepartmentCostCenter(department, costCenter);

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      email: createUserDto.email,
      passwordHash,
      name: createUserDto.name,
      role: createUserDto.role.toLowerCase(),
      department,
      costCenter,
      managerId: createUserDto.managerId || null,
    });
    return createdUser.save();
  }

  async update(id: string, updates: any): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // USR-06: Validate mapping on partial updates
    const updatedDept = updates.department !== undefined ? updates.department : user.department;
    const updatedCc = updates.costCenter !== undefined ? updates.costCenter : user.costCenter;
    
    if (updates.department !== undefined || updates.costCenter !== undefined) {
      this.validateDepartmentCostCenter(updatedDept, updatedCc);
    }

    // Hash new password if supplied
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    // Apply updates in MongoDB
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updates, { new: true }).exec();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // USR-07: soft-delete session invalidation in Redis
    if (updates.isActive === false) {
      await this.redisService.delPattern(`refresh:${id}:*`);
    }

    return updatedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
