import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let httpServer: ReturnType<INestApplication['getHttpServer']>;

const issueToken = async (): Promise<string> => {
  const response = await request(httpServer).post('/v1/auth/token').send({ subject: 'operator_01' }).expect(201);
  return response.body.accessToken as string;
};

before(async () => {
  const storeDir = await mkdtemp(join(tmpdir(), 'control-plane-store-'));
  process.env.CONTROL_PLANE_STORE_PATH = join(storeDir, 'control-plane-store.json');
  process.env.AUTH_TOKEN_SECRET = 'test-secret';

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  httpServer = app.getHttpServer();
});

after(async () => {
  delete process.env.CONTROL_PLANE_STORE_PATH;
  delete process.env.AUTH_TOKEN_SECRET;
  await app.close();
});

test('issues a signed bearer token with explicit expiry metadata', async () => {
  const response = await request(httpServer).post('/v1/auth/token').send({ subject: 'operator_01' }).expect(201);

  assert.equal(response.body.tokenType, 'Bearer');
  assert.match(response.body.accessToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(typeof response.body.expiresAt, 'string');
});

test('rejects protected requests with an invalid signature', async () => {
  const response = await request(httpServer)
    .get('/v1/agents')
    .set('Authorization', 'Bearer invalid.payload')
    .expect(401);

  assert.match(response.body.message, /invalid/i);
});

test('lists agents from the durable control-plane store', async () => {
  const response = await request(httpServer)
    .get('/v1/agents')
    .set('Authorization', `Bearer ${await issueToken()}`)
    .expect(200);

  assert.deepEqual(response.body, [
    {
      id: 'planner',
      status: 'available',
      description: 'Primary planning agent for control-plane orchestrations.',
    },
  ]);
});

test('creates an execution and persists it for subsequent retrieval', async () => {
  const createResponse = await request(httpServer)
    .post('/v1/executions')
    .set('Authorization', `Bearer ${await issueToken()}`)
    .send({
      agentId: 'planner',
      prompt: 'Plan and execute a billing migration.',
    })
    .expect(201);

  assert.match(createResponse.body.id, /^exec_[a-f0-9]{32}$/);
  assert.equal(createResponse.body.agentId, 'planner');
  assert.equal(createResponse.body.requestedBy, 'operator_01');
  assert.equal(createResponse.body.state, 'PENDING');

  const getResponse = await request(httpServer)
    .get(`/v1/executions/${createResponse.body.id}`)
    .set('Authorization', `Bearer ${await issueToken()}`)
    .expect(200);

  assert.deepEqual(getResponse.body, createResponse.body);
});
