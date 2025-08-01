#!/bin/bash
# 도메인 구조 생성 스크립트

# Domain Layer
mkdir -p src/domain/auth/entities
mkdir -p src/domain/auth/value-objects
mkdir -p src/domain/auth/repositories
mkdir -p src/domain/auth/services
mkdir -p src/domain/user/entities
mkdir -p src/domain/user/value-objects
mkdir -p src/domain/user/repositories
mkdir -p src/domain/user/services
mkdir -p src/domain/mission/entities
mkdir -p src/domain/mission/value-objects
mkdir -p src/domain/mission/repositories
mkdir -p src/domain/mission/services
mkdir -p src/domain/carbon-credit/entities
mkdir -p src/domain/carbon-credit/value-objects
mkdir -p src/domain/carbon-credit/repositories
mkdir -p src/domain/carbon-credit/services
mkdir -p src/domain/reward/entities
mkdir -p src/domain/reward/value-objects
mkdir -p src/domain/reward/repositories
mkdir -p src/domain/reward/services
mkdir -p src/domain/ranking/entities
mkdir -p src/domain/ranking/value-objects
mkdir -p src/domain/ranking/repositories
mkdir -p src/domain/ranking/services
mkdir -p src/domain/location/entities
mkdir -p src/domain/location/value-objects
mkdir -p src/domain/location/repositories
mkdir -p src/domain/location/services
mkdir -p src/domain/ai-assistant/entities
mkdir -p src/domain/ai-assistant/value-objects
mkdir -p src/domain/ai-assistant/repositories
mkdir -p src/domain/ai-assistant/services
mkdir -p src/domain/notification/entities
mkdir -p src/domain/notification/value-objects
mkdir -p src/domain/notification/repositories
mkdir -p src/domain/notification/services

# Application Layer
mkdir -p src/application/auth/use-cases
mkdir -p src/application/auth/dto
mkdir -p src/application/user/use-cases
mkdir -p src/application/user/dto
mkdir -p src/application/mission/use-cases
mkdir -p src/application/mission/dto
mkdir -p src/application/carbon-credit/use-cases
mkdir -p src/application/carbon-credit/dto
mkdir -p src/application/reward/use-cases
mkdir -p src/application/reward/dto
mkdir -p src/application/ranking/use-cases
mkdir -p src/application/ranking/dto
mkdir -p src/application/location/use-cases
mkdir -p src/application/location/dto
mkdir -p src/application/ai-assistant/use-cases
mkdir -p src/application/ai-assistant/dto
mkdir -p src/application/notification/use-cases
mkdir -p src/application/notification/dto

# Infrastructure Layer
mkdir -p src/infrastructure/database/entities
mkdir -p src/infrastructure/database/repositories
mkdir -p src/infrastructure/database/migrations
mkdir -p src/infrastructure/external-apis/openai
mkdir -p src/infrastructure/external-apis/claude
mkdir -p src/infrastructure/external-apis/location
mkdir -p src/infrastructure/file-storage

# Presentation Layer
mkdir -p src/presentation/auth/controllers
mkdir -p src/presentation/auth/guards
mkdir -p src/presentation/user/controllers
mkdir -p src/presentation/mission/controllers
mkdir -p src/presentation/carbon-credit/controllers
mkdir -p src/presentation/reward/controllers
mkdir -p src/presentation/ranking/controllers
mkdir -p src/presentation/location/controllers
mkdir -p src/presentation/ai-assistant/controllers
mkdir -p src/presentation/notification/controllers

# Shared
mkdir -p src/shared/exceptions
mkdir -p src/shared/decorators
mkdir -p src/shared/interceptors
mkdir -p src/shared/pipes
mkdir -p src/shared/utils

# Config
mkdir -p src/config
