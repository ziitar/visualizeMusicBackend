# visualizeMusic

基于web audio api实现的音乐可视化项目，音乐源来自网易云。

### visualizeMusicBackend

visualizeMusic的后端项目。基于deno编写。

### feature

- 本地操作
  - [x] 登录
  - [x] 歌单操作
- ~~网易云操作~~
  - [ ] ~~网易云扫码登录~~
  - [ ] ~~关联网易云账号~~
  - [ ] ~~网易云歌单操作~~
  - [ ] ~~网易云cookie存储及失效重登~~
- 通用操作
  - [x] 搜索歌曲
  - [ ] 歌词api

## 使用

1. 安装[deno](https://www.denojs.cn/)
2. 下载本项目

   ```cmd
   > git clone https://github.com/ziitar/visualizeMusicBackend.git && cd visualizeMusicBackend
   ```

3. 在更目录下添加connect.json文件，文件内容如下

   ```json
   {
     "host": "xxx",
     "port": 3306, //defuat port
     "user": "xxx",
     "password": "xxx",
     "dataBase": "xxx"
   }
   ```
4. 执行初始化数据库命令

   ```shell
   # for linux
   $ deno run --allow-net --allow-read --allow-run ./dbs/init_database.ts
   ```
   ```cmd
   // for windows
   > deno run --allow-net --allow-read --allow-run .\dbs\init_database.ts
   ```
   执行完毕就可以关闭命令行或者断开连接了。
5. 运行程序

   ```cmd
   > deno run --allow-net --allow-read --allow-write --allow-run app.ts
   ```
