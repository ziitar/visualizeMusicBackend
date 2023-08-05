# visualizeMusic

基于deno的本地音乐流媒体服务，实现本地音乐管理，音乐tags爬取及格式化，并提供流媒体服务。

### feature
- [x] 使用网易云音乐信息源对本地音乐提供tags
- [x] 支持所有音频格式编解码，包括wav/ape等整轨分轨音频
- [x] 提供本地音乐的流媒体服务
- [x] 支持wav,ape整轨文件中的单曲单独获取
- [x] docker支持
- 本地操作
  - [x] 用户登录注册
  - [x] 歌单增删查改
  - [x] 本地歌曲录入数据库
- ~~网易云操作~~
  - [ ] ~~网易云扫码登录~~
  - [ ] ~~关联网易云账号~~
  - [ ] ~~网易云歌单操作~~
  - [ ] ~~网易云cookie存储及失效重登~~
- 通用操作
  - [x] 搜索本地歌曲
  - [ ] 歌词api

### 使用

1. 安装[deno](https://www.denojs.cn/)
2. 下载本项目

   ```cmd
   > git clone https://github.com/ziitar/visualizeMusicBackend.git && cd visualizeMusicBackend
   ```

3. 在config目录下添加connect.json文件和config.json文件，分别用于连接mysql数据库和运行配置，文件内容如下

   ```json
   {
     "host": "xxx", //数据库地址
     "port": 3306, //数据库端口
     "user": "xxx", //用户名
     "password": "xxx", //密码
     "dataBase": "xxx"  //数据库
   }
   ```
   ```json
   {
      "source": "path",  //本地音乐总目录路径
      "exclude": ["tmp"], //本地音乐入库时需要排除的目录，基于source路径下
      "ffmpegPath": "ffmpeg path", //本项目依赖ffmpeg，此处填写ffmpeg的可执行程序所在路径
      "allowedHost": [
        "http://localhost:4200",
      ]  // 前端跨域白名单
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
### docker

1. 
   ```cmd
   > git clone https://github.com/ziitar/visualizeMusicBackend.git && cd visualizeMusicBackend
   ```
2. 在config目录下添加connect.json文件和config.json文件,详见使用指南里的配置文件填写
3. 
   ```
   docker build -t app . && docker run -it --init -p 7000:7000 -v mediaPath:/etc/source configPath:/app/config app
   ```