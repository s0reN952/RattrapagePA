export const databaseConfig = {
  type: 'mysql' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'appuser',
  password: process.env.DB_PASSWORD || 'motdepasse',
  database: process.env.DB_DATABASE || 'appdb',
  autoLoadEntities: true,
  synchronize: true,
};
