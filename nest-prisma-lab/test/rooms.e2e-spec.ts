/*
AI Declaration:
I used ChatGPT as an extra guide on how to implement each test (unit test, integration test, and e2e test) and help with debugging errors in this project.
I wrote all the other code, and I understand the entire implementation.


Reflection:
I learned how to write tests for a NestJS application using Jest and Supertest.
I also learned how to implement test cases for different scenarios, including successful operations and error handling.
*/



import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateRoomDto } from '../src/rooms/dto/create-room.dto';
import { UpdateRoomDto } from '../src/rooms/dto/update-room.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/roles/roles.enum';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('cache-manager-redis-yet', () => ({
  redisStore: () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }),
}));

describe('RoomsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let createdRoomId: number;
  let createdAdminUserId: number;
  let roomDeleted = false;
  let uniqueRoomName: string;

  beforeAll(async () => {
    // Initialize the full NestJS application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Seed Admin User
    const email = `test-admin-${Date.now()}@example.com`;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name: 'Test Admin',
        role: Role.ADMIN,
      },
    });
    createdAdminUserId = user.id;
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
      
    accessToken = loginResponse.body.access_token;
    uniqueRoomName = `E2E Test Room ${Date.now()}`;
  });

  afterAll(async () => {
    const cleanupOperations: Promise<unknown>[] = [];
    if (createdRoomId && !roomDeleted) {
      cleanupOperations.push(prisma.rooms.delete({ where: { id: createdRoomId } }));
    }
    if (createdAdminUserId) {
      cleanupOperations.push(prisma.user.delete({ where: { id: createdAdminUserId } }));
    }

    try {
      await Promise.all(cleanupOperations);
    } finally {
      await app.close();
    }
  });

  it('/rooms (POST) - Create Room', async () => {
    const createDto: CreateRoomDto = {
        name: uniqueRoomName,
        description: 'Room created by the E2E test',
        capacity: 10,
        price_per_night: 150,
        image_url: 'https://example.com/e2e-room.jpg',
    };

    const response = await request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

    expect(response.body).toHaveProperty('id');
    createdRoomId = response.body.id;
    expect(response.body.name).toBe(uniqueRoomName);
  });

  it('/rooms (GET) - Get All Rooms', async () => {
    const response = await request(app.getHttpServer())
        .get('/rooms')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    const found = response.body.find((r) => r.id === createdRoomId);
    expect(found).toBeDefined();
  });

  it('/rooms/:id (GET) - Get Room by ID', async () => {
    const response = await request(app.getHttpServer())
        .get(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    
    expect(response.body.id).toBe(createdRoomId);
    const found = response.body.name === uniqueRoomName;
    expect(found).toBe(true);
  });

  it('/rooms/:id (PUT) - Update Room', async () => {
      const updateDto: UpdateRoomDto = { name: 'Updated E2E Room' };
      
      const response = await request(app.getHttpServer())
        .put(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);
      
      expect(response.body.name).toBe('Updated E2E Room');
  });

  it('/rooms/:id (DELETE) - Delete Room', async () => {
      await request(app.getHttpServer())
        .delete(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200); // Controller returns 200 with { success: true }
      roomDeleted = true;

      // Verify it's gone
      await request(app.getHttpServer())
          .get(`/rooms/${createdRoomId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
  });

  it('/rooms (POST) - Fail Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/rooms')
        .send({})
        .expect(401);
  });
  
  it('/rooms/:id (PUT) - Fail Not Found', async () => {
      await request(app.getHttpServer())
        .put('/rooms/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Fail' })
        .expect(404);
  });
});