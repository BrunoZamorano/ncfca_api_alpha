-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `rg` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `roles` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `neighborhood` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `complement` VARCHAR(191) NULL,
    `zip_code` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_cpf_key`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Family` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_AFFILIATED', 'AFFILIATED', 'EXPIRED', 'PENDING_PAYMENT') NOT NULL,
    `holder_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `affiliated_at` DATETIME(3) NULL,
    `affiliation_expires_at` DATETIME(3) NULL,

    UNIQUE INDEX `Family_holder_id_key`(`holder_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dependant` (
    `id` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `relationship` ENUM('DAUGHTER', 'HUSBAND', 'CHILD', 'WIFE', 'SON', 'OTHER') NOT NULL,
    `sex` ENUM('FEMALE', 'MALE') NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `birthdate` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Club` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `principal_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Club_principal_id_key`(`principal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClubMembership` (
    `id` VARCHAR(191) NOT NULL,
    `club_id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnrollmentRequest` (
    `id` VARCHAR(191) NOT NULL,
    `club_id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `status` ENUM('REJECTED', 'APPROVED', 'PENDING') NOT NULL,
    `resolved_at` DATETIME(3) NULL,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rejection_reason` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('CANCELLED', 'REFUNDED', 'EXPIRED', 'PENDING', 'FAILED', 'PAID') NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `gateway` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount_cents` INTEGER NOT NULL,
    `context_type` ENUM('FAMILY_AFFILIATION', 'FAMILY_RENEWAL') NOT NULL,
    `payment_method` ENUM('CREDIT_CARD', 'PIX') NOT NULL,
    `gateway_payload` JSON NULL,
    `gateway_transaction_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Transaction_gateway_transaction_id_key`(`gateway_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Family` ADD CONSTRAINT `Family_holder_id_fkey` FOREIGN KEY (`holder_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dependant` ADD CONSTRAINT `Dependant_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `Family`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Club` ADD CONSTRAINT `Club_principal_id_fkey` FOREIGN KEY (`principal_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClubMembership` ADD CONSTRAINT `ClubMembership_club_id_fkey` FOREIGN KEY (`club_id`) REFERENCES `Club`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClubMembership` ADD CONSTRAINT `ClubMembership_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `Family`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClubMembership` ADD CONSTRAINT `ClubMembership_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `Dependant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnrollmentRequest` ADD CONSTRAINT `EnrollmentRequest_club_id_fkey` FOREIGN KEY (`club_id`) REFERENCES `Club`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnrollmentRequest` ADD CONSTRAINT `EnrollmentRequest_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `Family`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnrollmentRequest` ADD CONSTRAINT `EnrollmentRequest_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `Dependant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `Family`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
