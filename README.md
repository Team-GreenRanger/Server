# EcoLife Server

🌱 Mission-based Carbon Credit Platform - Backend API Server

## 🏗️ Architecture

이 프로젝트는 **Clean Architecture**와 **Domain-Driven Design (DDD)**를 결합한 토스급 고급 아키텍처를 적용했습니다.

### 📁 Directory Structure

```
src/
├── domain/                     # 도메인 레이어 (비즈니스 로직)
│   ├── auth/
│   ├── user/
│   │   ├── entities/           # 도메인 엔티티
│   │   ├── value-objects/      # 값 객체
│   │   ├── repositories/       # 리포지토리 인터페이스
│   │   └── services/           # 도메인 서비스
│   ├── mission/
│   ├── carbon-credit/
│   ├── reward/
│   └── ...
├── application/                # 애플리케이션 레이어 (유스케이스)
│   ├── auth/
│   │   ├── use-cases/          # 비즈니스 유스케이스
│   │   └── dto/                # 데이터 전송 객체
│   ├── mission/
│   └── ...
├── infrastructure/             # 인프라스트럭처 레이어
│   ├── database/
│   │   ├── entities/           # TypeORM 엔티티
│   │   ├── repositories/       # 리포지토리 구현체
│   │   └── migrations/         # DB 마이그레이션
│   ├── external-apis/          # 외부 API 연동
│   └── file-storage/           # 파일 저장소
└── presentation/               # 프레젠테이션 레이어
    ├── auth/
    │   └── controllers/        # REST API 컨트롤러
    ├── mission/
    └── ...
```

### 🎯 Design Principles

- **단일 책임 원칙**: 각 클래스는 하나의 책임만 가집니다
- **의존성 역전**: 고수준 모듈이 저수준 모듈에 의존하지 않습니다
- **도메인 중심**: 비즈니스 로직이 기술적 세부사항과 분리됩니다
- **테스트 가능성**: 모든 레이어가 독립적으로 테스트 가능합니다

## 🗄️ Database Design

### ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    users ||--o{ user_missions : has
    users ||--|| carbon_credits : owns
    users ||--o{ user_rewards : receives
    users ||--o{ carbon_credit_transactions : makes
    users ||--o{ notifications : receives
    users ||--o{ ai_conversations : creates
    
    missions ||--o{ user_missions : assigned_to
    
    rewards ||--o{ user_rewards : purchased_as
    
    carbon_credits ||--o{ carbon_credit_transactions : tracks
    
    ai_conversations ||--o{ ai_messages : contains
    
    users {
        varchar id PK
        varchar email UK
        varchar name
        varchar hashed_password
        varchar profile_image_url
        boolean is_verified
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    missions {
        varchar id PK
        varchar title
        text description
        enum type
        enum difficulty
        decimal co2_reduction_amount
        int credit_reward
        varchar image_url
        json instructions
        json verification_criteria
        enum status
        datetime created_at
        datetime updated_at
    }
    
    user_missions {
        varchar id PK
        varchar user_id FK
        varchar mission_id FK
        enum status
        int current_progress
        int target_progress
        json submission_image_urls
        text submission_note
        text verification_note
        datetime submitted_at
        datetime verified_at
        datetime completed_at
        datetime assigned_at
        datetime updated_at
    }
    
    carbon_credits {
        varchar id PK
        varchar user_id FK
        int balance
        int total_earned
        int total_spent
        datetime created_at
        datetime updated_at
    }
    
    carbon_credit_transactions {
        varchar id PK
        varchar user_id FK
        enum type
        int amount
        varchar description
        varchar source_type
        varchar source_id
        enum status
        datetime created_at
        datetime updated_at
    }
    
    rewards {
        varchar id PK
        varchar title
        text description
        enum type
        int credit_cost
        decimal original_price
        varchar image_url
        varchar partner_name
        varchar partner_logo_url
        json terms_and_conditions
        int validity_days
        int total_quantity
        int remaining_quantity
        enum status
        datetime created_at
        datetime updated_at
    }
    
    user_rewards {
        varchar id PK
        varchar user_id FK
        varchar reward_id FK
        varchar transaction_id
        varchar coupon_code
        enum status
        datetime purchased_at
        datetime expires_at
        datetime used_at
        datetime updated_at
    }
    
    notifications {
        varchar id PK
        varchar user_id FK
        enum type
        varchar title
        text message
        json data
        boolean is_read
        datetime created_at
        datetime updated_at
    }
    
    eco_locations {
        varchar id PK
        varchar name
        text description
        enum type
        decimal latitude
        decimal longitude
        varchar address
        varchar phone_number
        varchar website
        json operating_hours
        json amenities
        decimal rating
        varchar image_url
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    ai_conversations {
        varchar id PK
        varchar user_id FK
        varchar title
        enum status
        datetime created_at
        datetime updated_at
    }
    
    ai_messages {
        varchar id PK
        varchar conversation_id FK
        enum role
        text content
        json metadata
        datetime created_at
    }
```

### 🔧 Database Features

- **정규화**: 모든 테이블이 3NF(제3정규형)를 만족합니다
- **인덱스 최적화**: 자주 조회되는 컬럼에 인덱스 적용
- **외래키 제약조건**: 데이터 무결성 보장
- **소프트 삭제**: 중요 데이터는 물리적 삭제 대신 상태 변경

## 🚀 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/login` | 로그인 |

### 👤 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | 사용자 프로필 조회 |
| PATCH | `/users/profile` | 사용자 프로필 수정 |
| POST | `/users/upload-avatar` | 프로필 이미지 업로드 |

### 🎯 Missions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/missions` | 미션 목록 조회 |
| GET | `/missions/:id` | 미션 상세 조회 |
| POST | `/missions/assign` | 미션 할당 |
| GET | `/missions/user/missions` | 사용자 미션 목록 |
| PATCH | `/missions/user-missions/:id/submit` | 미션 제출 |
| PATCH | `/missions/user-missions/:id/verify` | 미션 검증 (관리자) |

### 💰 Carbon Credits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/carbon-credits/balance` | 탄소크레딧 잔액 조회 |
| GET | `/carbon-credits/transactions` | 거래 내역 조회 |
| GET | `/carbon-credits/statistics` | 통계 조회 |

### 🎁 Rewards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rewards` | 리워드 상품 목록 |
| GET | `/rewards/:id` | 리워드 상품 상세 |
| POST | `/rewards/:id/purchase` | 리워드 구매 |
| GET | `/rewards/user/rewards` | 구매한 리워드 목록 |
| PATCH | `/rewards/user-rewards/:id/use` | 리워드 사용 |

### 🏆 Rankings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rankings/global` | 글로벌 랭킹 |
| GET | `/rankings/local` | 로컬 랭킹 |
| GET | `/rankings/user/:id` | 특정 사용자 랭킹 |

### 📍 Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/locations` | 친환경 장소 목록 |
| GET | `/locations/nearby` | 주변 친환경 장소 |
| GET | `/locations/:id` | 장소 상세 정보 |

### 🤖 AI Assistant

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | AI 채팅 |
| GET | `/ai/conversations` | 대화 목록 |
| POST | `/ai/image-verify` | 이미지 검증 |

### 🔔 Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | 알림 목록 |
| PATCH | `/notifications/:id/read` | 알림 읽음 처리 |
| POST | `/notifications/mark-all-read` | 모든 알림 읽음 처리 |

## 🛠️ Tech Stack

### Core Framework
- **NestJS**: Enterprise-grade Node.js framework
- **TypeScript**: Type-safe JavaScript
- **TypeORM**: Object-Relational Mapping

### Database
- **MySQL**: Primary database
- **Redis**: Caching and session storage

### Authentication & Security
- **JWT**: JSON Web Tokens
- **bcryptjs**: Password hashing
- **Passport**: Authentication middleware

### External APIs
- **OpenAI API**: ChatGPT integration (HTTP)
- **Claude API**: Image verification (HTTP)

### Documentation & Validation
- **Swagger**: API documentation
- **class-validator**: Request validation
- **class-transformer**: Data transformation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EcoLifeApplication_Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Database setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE ecolife;
   
   # Run migrations
   npm run migration:run
   ```

5. **Start development server**
   ```bash
   npm run start:dev
   ```

### 📚 API Documentation

서버 실행 후 다음 URL에서 Swagger 문서를 확인할 수 있습니다:
- **Local**: http://localhost:3000/api
- **Production**: https://your-domain.com/api

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/infrastructure/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🏗️ Project Philosophy

### Why This Architecture?

1. **확장성**: 새로운 기능 추가가 쉽습니다
2. **유지보수성**: 각 레이어가 독립적으로 변경 가능합니다
3. **테스트 용이성**: 의존성 주입으로 모든 컴포넌트가 테스트 가능합니다
4. **비즈니스 로직 보호**: 도메인 로직이 기술적 세부사항과 분리됩니다

### Code Quality Standards

- **SOLID 원칙** 준수
- **의존성 주입** 활용
- **타입 안정성** 보장
- **에러 핸들링** 표준화
- **로깅** 체계화

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ by EcoLife Team**
