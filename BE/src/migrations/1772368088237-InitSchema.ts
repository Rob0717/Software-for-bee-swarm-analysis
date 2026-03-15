import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1772368088237 implements MigrationInterface {
    name = 'InitSchema1772368088237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`apiary_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`apiaryName\` varchar(255) NOT NULL, \`apiaryRadius\` int NOT NULL, \`latitude\` double NOT NULL, \`longitude\` double NOT NULL, \`address\` varchar(255) NULL, \`createdById\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`report_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`description\` varchar(255) NOT NULL, \`photoUrl\` varchar(255) NULL, \`latitude\` double NOT NULL, \`longitude\` double NOT NULL, \`status\` enum ('new', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'new', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`assignedToId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`surname\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NULL, \`role\` enum ('admin', 'beekeeper') NOT NULL DEFAULT 'beekeeper', \`banned\` tinyint NOT NULL DEFAULT 0, \`verified\` tinyint NOT NULL DEFAULT 0, \`passwordChangeRequested\` tinyint NOT NULL DEFAULT 0, \`language\` varchar(255) NOT NULL DEFAULT 'cs', \`passwordChangeRequestedAt\` bigint NULL, \`address\` varchar(255) NULL, \`latitude\` double NOT NULL, \`longitude\` double NOT NULL, UNIQUE INDEX \`IDX_415c35b9b3b6fe45a3b065030f\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`apiary_entity\` ADD CONSTRAINT \`FK_81ff9858b348b63e2f8ec5ad98f\` FOREIGN KEY (\`createdById\`) REFERENCES \`user_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report_entity\` ADD CONSTRAINT \`FK_59a53b6a479f4bbd3a80028f186\` FOREIGN KEY (\`assignedToId\`) REFERENCES \`user_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`report_entity\` DROP FOREIGN KEY \`FK_59a53b6a479f4bbd3a80028f186\``);
        await queryRunner.query(`ALTER TABLE \`apiary_entity\` DROP FOREIGN KEY \`FK_81ff9858b348b63e2f8ec5ad98f\``);
        await queryRunner.query(`DROP INDEX \`IDX_415c35b9b3b6fe45a3b065030f\` ON \`user_entity\``);
        await queryRunner.query(`DROP TABLE \`user_entity\``);
        await queryRunner.query(`DROP TABLE \`report_entity\``);
        await queryRunner.query(`DROP TABLE \`apiary_entity\``);
    }

}
