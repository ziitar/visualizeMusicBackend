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

```shell
> git clone https://github.com/ziitar/visualizeMusicBackend.git && cd visualizeMusicBackend
```

3. 运行程序

```
> deno run --allow-net --allow-read --allow-write --allow-run
```
