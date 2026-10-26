import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger('RoomsService');

  async create(createRoomDto: CreateRoomDto) {
    try {
      this.logger.log(`Executing create()...`);
      return this.prisma.rooms.create({ data: createRoomDto });
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.toLowerCase().includes('unique')
      ) {
        this.logger.error(`Room with name ${createRoomDto.name} already exists!`);
        throw new BadRequestException(`Room with name ${createRoomDto.name} already exists`);
      }
      this.logger.error(`Error occurred while creating room: ${e?.message}`);
      throw new BadRequestException(e?.message ?? 'Create failed');
    } 
  }

  findAll() {
    this.logger.log(`Fetching all rooms`);
    return this.prisma.rooms.findMany();
  }

  async findOne(id: number) {
    this.logger.log(`Fetching room id=${id}`);
    const room = await this.prisma.rooms.findUnique({ where: { id } });
    if (!room) {
      this.logger.warn(`Room ${id} cannot be found!`);
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    return this.prisma.rooms.update({
      where: { id },
      data: updateRoomDto,
    });
  }
  
  async disable(id: number) {
    this.logger.log(`Disabling room id=${id}`);

    try {
      await this.findOne(id);
      return this.prisma.rooms.update({
        where: { id },
        data: { is_active: false },
    });
    } catch (error) {
      this.logger.error(`Room ${id} cannot be found!`);
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  async enable(id: number) {
    this.logger.log(`Enabling room id=${id}`);
    try {
      await this.findOne(id);
      return this.prisma.rooms.update({
        where: { id },
        data: { is_active: true },
      });
    } catch (error) {
      this.logger.error(`Room ${id} cannot be found!`);
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  remove(id: number) {
    return this.prisma.rooms.delete({ where: { id } });
  }
}
