import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateBikeNetworkTables1734350001000 implements MigrationInterface {
  name = 'CreateBikeNetworkTables1734350001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bike networks table
    await queryRunner.createTable(
      new Table({
        name: 'tbl_bike_networks',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'externalId',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '2',
          },
          {
            name: 'companies',
            type: 'json',
          },
          {
            name: 'gbfsHref',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'system',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ebikes',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'tbl_bike_networks',
      new Index('IDX_bike_networks_country_city', ['country', 'city'])
    );

    // Create bike stations table
    await queryRunner.createTable(
      new Table({
        name: 'tbl_bike_stations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'networkId',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'externalId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
          },
          {
            name: 'capacity',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'availableBikes',
            type: 'int',
            default: 0,
          },
          {
            name: 'availableDocks',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['networkId'],
            referencedTableName: 'tbl_bike_networks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for bike stations
    await queryRunner.createIndex(
      'tbl_bike_stations',
      new Index('IDX_bike_stations_network', ['networkId'])
    );
    
    await queryRunner.createIndex(
      'tbl_bike_stations',
      new Index('IDX_bike_stations_location', ['latitude', 'longitude'])
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tbl_bike_stations');
    await queryRunner.dropTable('tbl_bike_networks');
  }
}
