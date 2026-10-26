import { Controller, Get, Post, Body, Patch, Put, Param, ParseIntPipe, Delete, UseGuards, UseInterceptors, NotFoundException, Inject, Optional } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../roles/roles.enum';
import { Roles } from '../roles/roles.decorator';
import { CACHE_MANAGER, Cache, CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'

@ApiTags('rooms')
@ApiBearerAuth('access-token')
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  // Create new room
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // Swagger documentation
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully', type: CreateRoomDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async create(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomsService.create(createRoomDto);
    if(!room) {
      throw new NotFoundException('Failed to create room');
    }
    await this.invalidateRoomCache();
    return room;
  }

  // Get all rooms
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000) // Cache for 30 seconds
  @Get()
  @Throttle({ default: { limit: 10000, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  // Swagger documentation
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiResponse({
    status: 200,
    description: 'All rooms found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async findAll() {
    const room = await this.roomsService.findAll();
    if(!room) {
      throw new NotFoundException('No rooms found');
    }

    return room;
  }

  // Get room by ID
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000) // Cache for 30 seconds
  @Get(':id')
  @Throttle({ default: { limit: 10000, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  // Swagger documentation
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({
    status: 200,
    description: 'Room {id} found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async findOne(@Param('id', ParseIntPipe) id: string) {
    const room = await this.roomsService.findOne(+id);
    if(!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.updateRoomRecord(+id, updateRoomDto);
  }

  @Put(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  updateWithPut(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.updateRoomRecord(+id, updateRoomDto);
  }

  private async updateRoomRecord(id: number, updateRoomDto: UpdateRoomDto) {
    try {
      const room = await this.roomsService.update(id, updateRoomDto);
      await this.invalidateRoomCache(id);
      return room;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Room with ID ${id} not found`);
      }
      throw error;
    }
  }

  private async invalidateRoomCache(id?: number) {
    const cacheManager = this.cacheManager;
    if (!cacheManager) {
      return;
    }

    const keys = ['/rooms'];
    if (id !== undefined) {
      keys.push(`/rooms/${id}`);
    }
    await Promise.all(keys.map((key) => cacheManager.del(key)));
  }

  // Disable a room
  @Patch(':id/disable')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // Swagger documentation
  @ApiOperation({ summary: 'Disable a room' })
  @ApiOperation({ summary: 'Enable a room' })
  @ApiResponse({
    status: 200,
    description: 'Room disabled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  disable(@Param('id') id: string) {
    const room = this.roomsService.findOne(+id);
    if(!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  // Enable a room
  @Patch(':id/enable')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // Swagger documentation
  @ApiOperation({ summary: 'Enable a room' })
   @ApiResponse({
    status: 200,
    description: 'Room enabled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  enable(@Param('id') id: string) {
    const room = this.roomsService.findOne(+id);
    if(!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  // Delete a room
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // Swagger documentation
  @ApiOperation({ summary: 'Delete a room' })
  @ApiResponse({
    status: 200,
    description: 'Room deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async remove(@Param('id', ParseIntPipe) id: string) {
    try {
      await this.roomsService.remove(+id);
      await this.invalidateRoomCache(+id);
      return { success: true };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Room with ID ${id} not found`);
      }
      throw error;
    }
  }
}
