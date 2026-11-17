// 内置示例简历：简历页 "Analyze a sample resume" 按钮使用
// 覆盖 5 类声明（技术选型/量化结果/架构/解决问题/职责），便于演示提取与出题效果

export const SAMPLE_RESUME = `JIAWEI CHEN
jiawei.chen@example.com | GitHub: github.com/jiawei-chen | Shanghai, China

EDUCATION
B.Eng. in Computer Science and Technology, Huadong University of Science and Technology
Expected June 2026 | GPA 3.6/4.0
Relevant coursework: Data Structures, Operating Systems, Computer Networks, Database Systems, Distributed Systems

PROJECT EXPERIENCE

Campus Food Delivery Platform — Backend Owner (course project, team of 4, 2025)
- Designed and built the order backend with Spring Boot and MySQL, serving 2,000+ registered students in a campus pilot.
- Chose Redis over a local in-memory cache for the shop menu cache because multiple backend instances needed a shared, consistent view; cache hit rate reached 92%.
- Prevented overselling during lunch-hour flash sales by implementing Redis distributed locks (SET NX PX + Lua script for safe unlock).
- Raised peak throughput from 400 QPS to 2,500 QPS in JMeter tests with 300 concurrent threads by adding the menu cache and rewriting two N+1 queries with batch fetches.
- Introduced RabbitMQ to decouple order placement from SMS/push notifications, cutting p95 order API latency from 900ms to 250ms.
- Personally responsible for the order module end to end; teammates built the rider dispatch and merchant pages.

Distributed URL Shortener — Solo Project (2024)
- Built a URL shortening service in Go with PostgreSQL; generated short codes with a base62-encoded auto-increment ID plus a Snowflake-style fallback for horizontal scaling.
- Added a token-bucket rate limiter per IP using Redis, blocking abusive clients while keeping p99 latency under 30ms.
- Wrote a cache-aside read path with Redis and handled cache penetration for non-existent short codes by caching empty results with a short TTL.
- Deployed two stateless instances behind Nginx on an Aliyun ECS server with Docker Compose; set up GitHub Actions CI to run tests on every push.

INTERNSHIP EXPERIENCE

Backend Development Intern, Xingtu Information Technology (Jun 2025 – Sep 2025)
- Maintained a Spring Cloud microservice handling merchant settlement for an e-commerce client.
- Fixed a race condition in the coupon deduction flow that caused double-spending under concurrent requests; reproduced it with a JMeter script and resolved it with optimistic locking on a version column plus a bounded retry.
- Found and fixed a slow SQL query (full table scan on the settlement table, 4s+) by adding a composite index on (merchant_id, status), reducing it to under 80ms.
- Wrote JUnit + Mockito unit tests for the settlement module, raising line coverage from 35% to 70%.

SKILLS
- Languages: Java, Go, Python, TypeScript
- Backend: Spring Boot, Spring Cloud, Gin, REST API design
- Data & Infra: MySQL, PostgreSQL, Redis, RabbitMQ, Docker, Nginx, basic Kubernetes
- Tools: Git, GitHub Actions, JMeter, Postman

EXTRAS
- Finalist (top 8/60 teams), University Hackathon 2024 — built a real-time study-room occupancy dashboard with WebSocket push.
- Teaching assistant for the undergraduate Data Structures course (2024-2025), leading weekly lab sessions for 30 students.
`;
