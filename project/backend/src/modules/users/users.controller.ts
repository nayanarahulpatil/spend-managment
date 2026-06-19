import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Admin create a user' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      status: 201,
      data: { id: user._id },
      message: 'User created',
    };
  }

  @Get()
  @Roles('admin', 'finance', 'auditor')
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    const users = await this.usersService.findAll();
    const stats = await this.usersService.getStats();
    return {
      status: 200,
      data: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        costCenter: u.costCenter,
        managerId: u.managerId,
        isActive: u.isActive,
        isViolated: u.isViolated,
      })),
      stats,
      message: 'Users fetched',
    };
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin update a user profile' })
  async update(@Param('id') id: string, @Body() updates: UpdateUserDto) {
    await this.usersService.update(id, updates);
    return {
      status: 200,
      data: {},
      message: 'User updated',
    };
  }
}
