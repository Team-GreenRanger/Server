import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoutingAndCarbonSavingsTables1734350002000 implements MigrationInterface {
  name = 'CreateRoutingAndCarbonSavingsTables1734350002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create routing_sessions table
    await queryRunner.query(`
      CREATE TABLE \`tbl_routing_sessions\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`userId\` VARCHAR(36) NOT NULL,
        \`startLatitude\` DECIMAL(10,7) NOT NULL,
        \`startLongitude\` DECIMAL(10,7) NOT NULL,
        \`endLatitude\` DECIMAL(10,7) NOT NULL,
        \`endLongitude\` DECIMAL(10,7) NOT NULL,
        \`status\` enum('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
        \`totalDistanceMeters\` int NULL,
        \`straightLineDistanceMeters\` int NOT NULL,
        \`pointsEarned\` int NOT NULL DEFAULT 0,
        \`co2SavedKg\` DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`completedAt\` timestamp NULL,
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ROUTING_USER_ID\` (\`userId\`),
        INDEX \`IDX_ROUTING_STATUS\` (\`status\`),
        INDEX \`IDX_ROUTING_USER_STATUS\` (\`userId\`, \`status\`),
        CONSTRAINT \`FK_ROUTING_SESSION_USER\` FOREIGN KEY (\`userId\`) REFERENCES \`tbl_users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create carbon_savings table  
    await queryRunner.query(`
      CREATE TABLE \`tbl_carbon_savings\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`userId\` VARCHAR(36) NOT NULL,
        \`savingType\` enum('BIKE_ROUTING', 'PUBLIC_TRANSPORT', 'MISSION_COMPLETION', 'OTHER') NOT NULL DEFAULT 'BIKE_ROUTING',
        \`co2SavedKg\` DECIMAL(8,4) NOT NULL,
        \`distanceMeters\` int NULL,
        \`relatedId\` VARCHAR(36) NULL,
        \`description\` VARCHAR(500) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_CARBON_SAVINGS_USER_ID\` (\`userId\`),
        INDEX \`IDX_CARBON_SAVINGS_TYPE\` (\`savingType\`),
        INDEX \`IDX_CARBON_SAVINGS_USER_TYPE\` (\`userId\`, \`savingType\`),
        INDEX \`IDX_CARBON_SAVINGS_CREATED_AT\` (\`createdAt\`),
        CONSTRAINT \`FK_CARBON_SAVINGS_USER\` FOREIGN KEY (\`userId\`) REFERENCES \`tbl_users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE \`tbl_carbon_savings\``);
    await queryRunner.query(`DROP TABLE \`tbl_routing_sessions\``);
  }
}
