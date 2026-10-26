import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

const mockPrismaService = {
  rooms: {
    create: jest.fn<() => Promise<any>>(),
    findMany: jest.fn<() => Promise<any[]>>(),
    findOne: jest.fn<() => Promise<any>>(),
    findUnique: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
    delete: jest.fn<() => Promise<any>>(),
  },
};

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();
    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create
  describe('create', () => {
    it('should create a room with the provided data', async () => {
      const dto: CreateRoomDto = {
        name: 'Room 1',
        description: 'A comfortable room',
        capacity: 2,
        price_per_night: 150,
        image_url: 'https://example.com/images/room1.jpg',
        is_active: true,
      };

      const result = { id: 1, ...dto };
      mockPrismaService.rooms.create.mockResolvedValue(result);

      expect(await service.create(dto)).toEqual(result);
      expect(prisma.rooms.create).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('should throw an error if creation fails', async () => {
      const dto: CreateRoomDto = {
        name: 'Room 1',
        description: 'A comfortable room',
        capacity: 2,
        price_per_night: 150,
        image_url: 'https://example.com/images/room1.jpg',
        is_active: true,
      };
      mockPrismaService.rooms.create.mockRejectedValue(new Error('Failed to create room.'));

      await expect(service.create(dto)).rejects.toThrow('Failed to create room.');
    });
  });

  // findAll
  describe('findAll', () => {
    it('should return an array of rooms', async () => {
      const result = [{ id: 1, name: 'Room 1' }];
      mockPrismaService.rooms.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(prisma.rooms.findMany).toHaveBeenCalled();
    });

    it('should throw an error if retrieval fails', async () => {
      mockPrismaService.rooms.findMany.mockRejectedValue(new Error('Failed to retrieve rooms.'));
      await expect(service.findAll()).rejects.toThrow('Failed to retrieve rooms.');
    });
  });

  // findOne
  describe('findOne', () => {
    it('should return a single room', async () => {
        const result = { id: 1, name: 'Room 1' };
        mockPrismaService.rooms.findUnique.mockResolvedValue(result);
  
        expect(await service.findOne(1)).toBe(result);
        expect(prisma.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw if room not found', async () => {
        mockPrismaService.rooms.findUnique.mockResolvedValue(null);
  
        await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        expect(prisma.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });
  // update
  describe('update', () => {
    it('should update a room', async () => {
      const dto: UpdateRoomDto = { name: 'Updated Room Name' };
      const result = { id: 1, ...dto };
      mockPrismaService.rooms.update.mockResolvedValue(result);

      expect(await service.update(1, dto)).toBe(result);
      expect(prisma.rooms.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ name: dto.name }),
      });
    });
    it('should throw if room not found', async () => {
      const dto: UpdateRoomDto = { name: 'Updated Room Name' };
      mockPrismaService.rooms.update.mockRejectedValue(new Error('Record to update not found.'));

      await expect(service.update(999, dto)).rejects.toThrow('Record to update not found.');
    });
  });

  // remove
  describe('remove', () => {
      it('should delete a room', async () => {
          const result = { id: 1, name: 'Room 1' };
          mockPrismaService.rooms.delete.mockResolvedValue(result);
          
          expect(await service.remove(1)).toBe(result);
          expect(prisma.rooms.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      });
    it('should throw if room not found', async () => {
        mockPrismaService.rooms.delete.mockRejectedValue(new Error('Record to delete not found.'));

        await expect(service.remove(999)).rejects.toThrow('Record to delete not found.');
    });
  });
});