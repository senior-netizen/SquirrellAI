import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDatabaseConfig } from './database.config';

@Module({
  imports: [TypeOrmModule.forRoot(createDatabaseConfig())]
})
export class DatabaseModule {}
