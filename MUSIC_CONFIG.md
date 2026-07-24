# 站点音乐配置指南

本指南说明 SAKURAIN 站点音乐播放器的资源组织方式、命名约定，以及如何通过构建前脚本自动生成播放列表。

## 一、目录结构

所有音乐资源都存放在 `public/music/` 下，歌词放在 `public/music/Lyric/` 下。站点不会直接提交封面图片，封面由构建脚本从 MP3 内置元数据中自动提取到 `public/image/music-covers/`。

```
public/music/
├── Lyric/
│   ├── 歌手名 - 歌名.lrc
│   └── ...
├── 歌手名 - 歌名.mp3
└── ...

public/image/music-covers/   # 构建时自动生成，勿手动修改
├── 歌手名 - 歌名.jpg
└── ...

content/data/playlist.json   # 构建时自动生成，勿手动修改
public/data/playlist.json    # 由 sync-content-to-public.js 同步，勿手动修改
```

## 二、文件命名约定

### 2.1 音频文件

音频文件统一使用如下命名格式：

```
歌手名 - 歌名.mp3
```

示例：

```
public/music/鞠婧祎 - 叹云兮.mp3
public/music/朱彦安、苏艺馨 - 散场.mp3
```

- 文件名中的 ` - `（空格、短横线、空格）是分隔符，分隔符前的部分会识别为歌手，分隔符后的部分会识别为歌名。
- 若 MP3 文件本身包含 ID3 标签（标题、艺术家），脚本会优先使用 ID3 标签；否则从文件名解析。

### 2.2 歌词文件

歌词文件与音频文件同名，扩展名为 `.lrc`，统一放在 `public/music/Lyric/` 目录下：

```
public/music/Lyric/鞠婧祎 - 叹云兮.lrc
public/music/Lyric/朱彦安、苏艺馨 - 散场.lrc
```

LRC 歌词文件示例：

```
[length:[04:15.00]]
[00:00.00]鞠婧祎 - 叹云兮
[00:02.00]作词：郭德紫毅
[00:15.00]若这个世界凋谢
[00:17.00]我会守在你身边
```

脚本会自动解析 `[mm:ss.xx]` 或 `[mm:ss.xxx]` 时间标签，转换为带 `time`（秒）的 JSON 数组。无时间标签的元数据行（如 `[length:...]`）会被忽略。

### 2.3 封面图片

封面图片**不需要**手动放置。构建脚本会读取每首 MP3 的内嵌封面（ID3 `APIC` 帧），并自动写入：

```
public/image/music-covers/歌手名 - 歌名.<ext>
```

其中 `<ext>` 根据图片格式自动判断（通常为 `jpg` 或 `png`）。若某首 MP3 没有内嵌封面，播放器会退化为像素风格占位图。

## 三、播放列表自动生成

播放列表 `content/data/playlist.json` **不需要手动编辑**，由 `scripts/generate-playlist.js` 在构建前自动生成。

生成逻辑如下：

1. 扫描 `public/music/` 下所有 `.mp3` 文件。
2. 读取每首 MP3 的 ID3 元数据，优先使用元数据中的标题和艺术家。
3. 从文件名解析歌手和歌名（作为元数据缺失时的回退）。
4. 提取 MP3 内嵌封面到 `public/image/music-covers/`。
5. 查找同名的 `.lrc` 歌词文件并解析为 JSON。
6. 将结果写入 `content/data/playlist.json`。

后续 `scripts/sync-content-to-public.js` 会把 `content/data/playlist.json` 同步到 `public/data/playlist.json`，供前端播放器读取。

## 四、添加一首新歌的步骤

1. 将音频文件放入 `public/music/`，确保命名为 `歌手名 - 歌名.mp3`，并确认文件已内嵌封面。
2. 将歌词文件放入 `public/music/Lyric/`，命名为 `歌手名 - 歌名.lrc`。
3. 运行构建命令：

```bash
npm run build
```

或单独运行播放列表生成脚本：

```bash
npm run generate-playlist
```

4. 构建完成后，`content/data/playlist.json` 和 `public/image/music-covers/` 会自动更新。

## 五、playlist.json 字段说明

自动生成的 `playlist.json` 中每条记录结构如下：

```json
{
  "id": "鞠婧祎 - 叹云兮",
  "title": "叹云兮",
  "artist": "鞠婧祎",
  "src": "/music/鞠婧祎 - 叹云兮.mp3",
  "cover": "/image/music-covers/鞠婧祎 - 叹云兮.jpg",
  "lyrics": [
    { "time": 0, "text": "鞠婧祎 - 叹云兮" },
    { "time": 2, "text": "作词：郭德紫毅" }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `id` | 歌曲唯一标识，与音频文件名（不含扩展名）一致 |
| `title` | 歌曲标题，优先来自 ID3 标签，否则来自文件名 |
| `artist` | 歌手名，优先来自 ID3 标签，否则来自文件名 |
| `src` | 音频文件在 `public/` 下的访问路径 |
| `cover` | 自动提取的封面路径；无封面时为空 |
| `lyrics` | 从 LRC 解析的歌词数组，带时间戳 |

## 六、注意事项

- `content/data/playlist.json` 和 `public/image/music-covers/` 均为生成产物，已加入 `.gitignore`，请勿手动修改或提交。
- 音频文件体积通常较大，建议将 `public/music/` 加入 `.gitignore`，实际部署时通过构建脚本或手动上传方式放到服务器。
- 若某首歌没有内嵌封面，播放器会自动生成像素风格占位图，不影响播放。
- 默认播放顺序为随机播放；右下角迷你播放器支持切换为单曲循环或顺序播放。
