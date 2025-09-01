# 🌟 Planwise
> 🧰 Planwise is a shift scheduler for festivals

<p align="center">
  <img src="./public/whiteplanwise.svg" alt="Planwise Logo" width="96" height="96">
</p>

[⬇️ Download (Release)](./releases/latest) · [🐛 Report Bug](./issues/new?labels=bug) · [💡Suggest a feature](./issues/new?labels=enhancement)

---
### 🚧 Planwise is still in development

Planwise works, but it’s early. Expect rough edges. The database migration from **Supabase** to **MariaDB** is **ongoing**, so features touching data may be unstable. If something breaks, please open an issue.

---

### 📊 Status

- Core features exist: profiles & loadouts, website (Astro).
- Actively refactoring data access and schemas as part of the DB move.
- Breaking changes can happen without notice until the first stable release.

---

### ✈️ Supabase → MariaDB migration

I am replacing Supabase with MariaDB for local and self-hosted setups. The Compose stack ships a MariaDB instance and optional phpMyAdmin. Migration tasks still in progress:

- Finalize Prisma schema + migrations for all modules
- Migrate auth/session storage paths
- Data seeding and import/export docs
- Hardening & integrity checks against the new DB


## ✨ Features
- 🧩 Save profiles & loadouts
- 🔄 (Optional) Auto-Update & Integrity Checks
- 🖥️ Cross-Platform (Win/macOS/Linux)

---

## 🚀 Quick start

**Requirements:** Nodejs

```bash
# Clone
git clone https://github.com/Skeptic-systems/Planwise.git
cd Planwise
# Install modules
npm install
# DB Docker Compose is located in build
cd build
cp .env.example .env
docker compose up -d
cd ..
# Initialize DB
npm run db:push
npm run dev
```

.env (Example) -> Must be same values like ./build/.env
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=pass
DB_NAME=planwise
AUTH_COOKIE_SECURE=false
```
---

## 🏗️ Structure

apps/
  desktop/   # Tauri + React (Haupt-App)
  web/       # Astro (Website/Docs)
packages/
  core/      # Mod-Logik
  ui/        # UI-Komponenten
  types/     # Shared Types
docs/
  screenshots/

## 🛠️ Useful commands
```bash
npm run dev
npm run build
npm run db:push
npm run db:drop
http://localhost:4321
```

## 📸 Screenshots

🖼️ Landingpage
![Main](./public/mock1.png)

🧩 Login
![Mod Details](./public/mock2.png)

🧱 Dashboard
![Conflicts](./public/mock3.png)

📝 Editor
![Editor](./public/mock4.png)

## 🐋 Docker Compose 
```
services:
  db:
    image: mariadb:latest
    container_name: planwise-db
    restart: unless-stopped
    environment:
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - ./db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p$${MARIADB_ROOT_PASSWORD} || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - planwise-internal
      - planwise-external
    ports:
      - 3306:3306

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: planwise-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: db
      PMA_PORT: 3306
    ports:
      - "8080:80"
    depends_on:
      - db
    networks:
      - planwise-internal
      - planwise-external

#  planwise:
#    build:
#      context: .
#      dockerfile: ../dockerfile
#    container_name: planwise-app
#    restart: unless-stopped
#    environment:
#      DB_HOST: db
#      DB_PORT: 3306
#      DB_NAME: ${DB_NAME:-planwise}
#      DB_USER: ${DB_USER:-planwise}
#      DB_PASSWORD: ${DB_PASSWORD:-planwise}
#    depends_on:
#      - db
#    ports:
#      - "80:4321"
#    networks:
#      - planwise-internal
#      - planwise-external

networks:
  planwise-internal:
    internal: true
  planwise-external:
    external: true
```
## 🤝 Contribute
git checkout -b feature/<name>
git commit -m "feat: <short description>"
git push origin feature/<name>

## 📦 Build & Release
pnpm run build

## 🧾 License & Notice
GNU GENERAL PUBLIC LICENSE
