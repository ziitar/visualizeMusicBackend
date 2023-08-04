# 获取deno镜像

FROM denoland/deno:latest

# The port that your application listens to.
EXPOSE 7000

WORKDIR /app

VOLUME [ "/app/assets", "/app/config" ]

ENV TZ="Asia/shanghai"

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno run --allow-all --lock-write ./dbs/init_database.ts

CMD ["run", "--allow-all", "app.ts"]
