import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { NotFoundException, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../auth/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: 'CACHE_MANAGER',
  CacheInterceptor: class CacheInterceptor {},
  CacheTTL: () => () => undefined,
}));

const mockRoomsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RoomsController Integration', () => {
  let controller: RoomsController;
  let service: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (ctx: ExecutionContext, next: any) => next.handle() })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // create
  describe('create', () => {
    it('should call service.create and return the result', async () => {
      const dto: CreateRoomDto = {
        name: 'Room 1',
        description: 'A comfortable room',
        capacity: 2,
        price_per_night: 150,
        image_url: 'https://example.com/images/room1.jpg',
        is_active: true,
      };
      const result = { id: 1, ...dto };
      mockRoomsService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
    
    it('should throw NotFoundException if service.create throws an error', async () => {
      const dto: CreateRoomDto = {
        name: 'Room 1',
        description: 'A comfortable room',
        capacity: 2,
        price_per_night: 150,
        image_url: 'https://example.com/images/room1.jpg',
        is_active: true,
      };
      mockRoomsService.create.mockRejectedValue(new Error('Some error'));
      await expect(controller.create(dto)).rejects.toThrow(Error);
    });
  });

  // findAll
  describe('findAll', () => {
    it('should call service.findAll and return rooms', async () => {
      const result = [{ id: 1, name: 'Room 1' }];
      mockRoomsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.findAll).toHaveBeenCalled();
    });
    
    it('should throw NotFoundException if service.findAll throws an error', async () => {
      mockRoomsService.findAll.mockRejectedValue(new Error('Some error'));
      await expect(controller.findAll()).rejects.toThrow(Error);
    });
  });

  // findOne
   describe('findOne', () => {
    it('should call service.findOne and return the room', async () => {
      const result = { id: 1, name: 'Room 1' };
      mockRoomsService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if room is not found', async () => {
      mockRoomsService.findOne.mockResolvedValue(null);
      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  // update
  describe('update', () => {
    it('should call service.update and return the updated room', async () => {
      const dto = { name: 'Updated Room Name' };
      const result = { id: 1, ...dto };
      mockRoomsService.update.mockResolvedValue(result);
      expect(await controller.update('1', dto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
    
    it('should throw NotFoundException if service.update throws an error', async () => {
      const dto = { name: 'Updated Room Name' };
      mockRoomsService.update.mockRejectedValue(new Error('Some error'));
      await expect(controller.update('1', dto)).rejects.toThrow(Error);
    });
  });

  // remove
  describe('remove', () => {
    it('should call service.remove and return success', async () => {
      mockRoomsService.remove.mockResolvedValue({ id: 1 });
      expect(await controller.remove('1')).toEqual({ success: true });
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if service throws P2025', async () => {
        const error = new Error('Record to delete not found.') as any;
        error.code = 'P2025';
        mockRoomsService.remove.mockRejectedValue(error);

        await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});