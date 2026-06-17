-- ==========================================
-- DATABASE SCHEMA FOR MYSQL / MARIADB
-- Can be imported via phpMyAdmin or MySQL Workbench
-- ==========================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(255) PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `packages` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `speed_limit` VARCHAR(255) NOT NULL,
    `price` INT NOT NULL,
    `duration_hours` INT NOT NULL,
    `description` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vouchers` (
    `id` VARCHAR(255) PRIMARY KEY,
    `code` VARCHAR(255) NOT NULL UNIQUE,
    `package_id` VARCHAR(255) NOT NULL,
    `package_name` VARCHAR(255) NOT NULL,
    `price` INT NOT NULL,
    `status` VARCHAR(255) NOT NULL,
    `created_at` VARCHAR(255) NOT NULL,
    `sold_to` VARCHAR(255) NULL,
    `activated_at` VARCHAR(255) NULL,
    `expires_at` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customers` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NOT NULL,
    `saldo` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(255) NOT NULL DEFAULT 'Active',
    `joined_date` VARCHAR(255) NOT NULL,
    `registered_via` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` VARCHAR(255) PRIMARY KEY,
    `transaction_id` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(255) NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `amount` INT NOT NULL,
    `unique_code` INT NOT NULL,
    `total_payment` INT NOT NULL,
    `status` VARCHAR(255) NOT NULL,
    `qris_payload` TEXT NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` VARCHAR(255) NOT NULL,
    `paid_at` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bots_config` (
    `provider` VARCHAR(255) PRIMARY KEY,
    `api_key` VARCHAR(255) NOT NULL,
    `bot_username` VARCHAR(255) NULL,
    `status` VARCHAR(255) NOT NULL,
    `welcome_message` TEXT NOT NULL,
    `auto_replies_enabled` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chat_logs` (
    `id` VARCHAR(255) PRIMARY KEY,
    `provider` VARCHAR(255) NOT NULL,
    `sender_phone_or_user` VARCHAR(255) NOT NULL,
    `sender_name` VARCHAR(255) NOT NULL,
    `message_text` TEXT NOT NULL,
    `reply_text` TEXT NULL,
    `timestamp` VARCHAR(255) NOT NULL,
    `is_incoming` TINYINT(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mikrotik_config` (
    `id` VARCHAR(255) PRIMARY KEY,
    `ip` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL DEFAULT '',
    `port` INT NOT NULL,
    `is_connected` TINYINT(1) NOT NULL DEFAULT 0,
    `active_hotspot_users_count` INT NOT NULL DEFAULT 0,
    `detected_profiles` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sanpay_config` (
    `id` VARCHAR(255) PRIMARY KEY,
    `api_key` VARCHAR(255) NOT NULL,
    `merchant_id` VARCHAR(255) NOT NULL,
    `secret_key` VARCHAR(255) NOT NULL,
    `mode` VARCHAR(255) NOT NULL,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `display_config` (
    `id` VARCHAR(255) PRIMARY KEY,
    `running_text` TEXT NOT NULL,
    `ads_images` JSON NOT NULL,
    `admin_password` VARCHAR(255) NOT NULL DEFAULT 'admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
