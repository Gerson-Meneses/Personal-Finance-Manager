import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'admin123',
  database: 'finance_manager',
  dropSchema: true,
  synchronize: true, // ❗ solo en desarrollo
  logging: ["error"],
  entities: ['src/entities/**/*.entity.ts'],
});
