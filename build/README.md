# Dev Setup

git clone https://github.com/J4ron/Planwise.git

cd Planwise/build

docker network create planwise-external

docker compose up -d


# Without Docker

npm install

npm run dev

http://localhost:80

Phpmyadmin http://localhost:8081