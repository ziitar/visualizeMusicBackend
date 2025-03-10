import {
    RouteParams,
    Router,
    RouterContext,
} from "https://deno.land/x/oak@v12.2.0/mod.ts";
import config from "../../config/config.json" with { type: "json" };
import { RouterState } from "../index.d.ts";
import { createRequest } from "../../utils/neteaseMusicAPI/util.ts";
import {
    AlbumDetailMsgType,
    NEMAPIFactory,
    NEMSongsMsgType,
    SearchSongResultType,
    SongDetailResultType,
} from "../neteaseMusic/typing.d.ts";
import request from "../../utils/request/index.ts";
import { QAlbumMsgType, QResType, QSearchSongMsgType } from "./qqServer.ts";
import { setResponseBody } from "../../utils/util.ts";

const router = new Router<RouterState>();

async function matchNEMSong(
    ctx: RouterContext<"/match", RouteParams<"/match">, RouterState>,
    songName: string,
    artists: string[],
    album: string,
    duration: number,
    page: number = 1,
): Promise<NEMSongsMsgType | undefined> {
    const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
    const { result, cookie } = await createRequest<
        NEMAPIFactory<SearchSongResultType>
    >(
        "music.163.com",
        "/weapi/search/get",
        {
            s: `${songName} ${artists.join(" ")} ${album}`,
            limit: 100,
            type: 1,
            offset: (page - 1) * 100,
        },
        NEM_cookie || "",
        "POST",
    );
    ctx.state.session.set("NEM_cookie", cookie);
    let songMsg;
    if (result.code === 200) {
        const songList = result.result.songs;
        for (const song of songList) {
            const songDuration = song.duration;
            if (
                song.name === songName &&
                song.album.name === album &&
                song.artists.every((artist) => artists.includes(artist.name)) &&
                Math.abs(songDuration - duration) <= 1000
            ) {
                songMsg = song;
                break;
            }
        }
        if (!songMsg && result.result.hasMore) {
            songMsg = await matchNEMSong(
                ctx,
                songName,
                artists,
                album,
                duration,
                page + 1,
            );
        }
        return songMsg;
    }
    return undefined;
}
const QPageSize = 20;
async function matchQQSong(
    ctx: RouterContext<"/match", RouteParams<"/match">, RouterState>,
    songName: string,
    artists: string[],
    album: string,
    duration: number,
    page: number = 1,
): Promise<QSearchSongMsgType["data"]["song"]["list"][0] | undefined> {
    const res = await request({
        url: `${config.qqServer}/getSearchByKey`,
        method: "get",
        body: {
            key: `${songName} ${artists.join(" ")} ${album}`,
            page,
            limit: QPageSize,
        },
    });
    const result: QResType<QSearchSongMsgType> = await res.json();
    let songMsg;
    if (result.response.code === 0) {
        const songList = result.response.data.song.list;
        for (const song of songList) {
            const songDuration = song.interval * 1000;
            if (
                song.songname === songName &&
                song.albumname === album &&
                song.singer.every((artist) => artists.includes(artist.name)) &&
                Math.abs(songDuration - duration) <= 1000
            ) {
                songMsg = song;
                break;
            }
        }
        if (!songMsg && result.response.data.song.totalnum > page * QPageSize) {
            songMsg = await matchQQSong(
                ctx,
                songName,
                artists,
                album,
                duration,
                page + 1,
            );
        }
        return songMsg;
    }
    return undefined;
}

export interface MusicDetailMsgType {
    NEMMusicId?: number;
    QQMusicId?: string;
    picUrl: string;
    name: string;
    artists: {
        name: string;
        alias: string;
    }[];
    trackNo: number;
    album: {
        name: string;
        picUrl: string;
        trackTotal: number;
        diskTotal?: number;
        diskNo?: number;
        company: string;
        publishTime: number;
        description: string;
        alias?: string[];
        tns?: string[];
        artist: {
            name: string;
            alias: string;
        };
    };
}

export async function getMusicDetailMsg(
    ctx: RouterContext<"/match", RouteParams<"/match">, RouterState>,
    songName: string,
    artists: string[],
    album: string,
    duration: number,
): Promise<MusicDetailMsgType | undefined> {
    const NEMSong = await matchNEMSong(ctx, songName, artists, album, duration);
    if (!NEMSong) {
        const QQSong = await matchQQSong(
            ctx,
            songName,
            artists,
            album,
            duration,
        );
        if (!QQSong) {
            return undefined;
        } else {
            const res = await request({
                url: `${config.qqServer}/getAlbumInfo`,
                method: "get",
                body: {
                    albummid: QQSong.albummid,
                },
            });
            const result: QResType<QAlbumMsgType> = await res.json();
            if (result.response.code === 0) {
                const songMsg = result.response.data.list.find((song) =>
                    song.songmid === QQSong.songmid
                );
                const albumMsg = result.response.data;
                if (!songMsg) {
                    return undefined;
                }
                return {
                    QQMusicId: QQSong.songmid,
                    picUrl:
                        `https://y.gtimg.cn/music/photo_new/T002R500x500M000${QQSong.albummid}.jpg`,
                    name: QQSong.songname,
                    artists: songMsg.singer.map((artist) => ({
                        name: artist.name,
                        alias: "",
                    })),
                    album: {
                        name: albumMsg.name,
                        picUrl:
                            `https://y.gtimg.cn/music/photo_new/T002R500x500M000${QQSong.albummid}.jpg`,
                        trackTotal: albumMsg.total_song_num,
                        artist: {
                            name: albumMsg.singername,
                            alias: "",
                        },
                        company: albumMsg.company,
                        publishTime: new Date(albumMsg.aDate).getTime(),
                        description: albumMsg.desc,
                    },
                    trackNo: songMsg.belongCD,
                };
            }
            return undefined;
        }
    } else {
        const NEM_cookie = ctx.state.session.get("NEM_cookie") as string;
        const { id, album } = NEMSong;
        const [songDetailRes, albumDetailRes] = await Promise.all([
            await createRequest<
                NEMAPIFactory<SongDetailResultType>
            >(
                "music.163.com",
                "/weapi/v3/song/detail",
                {
                    c: JSON.stringify([{ id: `${id}` }]),
                },
                NEM_cookie || "",
                "POST",
            ),
            await createRequest<
                NEMAPIFactory<AlbumDetailMsgType>
            >(
                "music.163.com",
                `/weapi/v1/album/${album.id}`,
                {},
                NEM_cookie || "",
                "POST",
            ),
        ]);
        if (
            songDetailRes.result.code === 200 &&
            albumDetailRes.result.code === 200
        ) {
            return {
                NEMMusicId: id,
                picUrl: albumDetailRes.result.album.picUrl,
                trackNo: songDetailRes.result.songs[0].no,
                album: {
                    name: albumDetailRes.result.album.name,
                    picUrl: albumDetailRes.result.album.picUrl,
                    trackTotal: albumDetailRes.result.album.size,
                    company: albumDetailRes.result.album.company,
                    alias: albumDetailRes.result.album.alias,
                    publishTime: albumDetailRes.result.album.publishTime,
                    description: albumDetailRes.result.album.description,
                    tns: albumDetailRes.result.album.transNames,
                    artist: {
                        name: albumDetailRes.result.album.artist.name,
                        alias: albumDetailRes.result.album.artist.trans,
                    },
                },
                artists: songDetailRes.result.songs[0].ar.map((artist) => {
                    return {
                        name: artist.name,
                        alias: artist.alias[0],
                    };
                }),
                name: songDetailRes.result.songs[0].name,
            };
        }
        return undefined;
    }
}
router.post("/match", async (ctx, next) => {
    const { songName, artists, album, duration } = await ctx.request.body({
        type: "json",
    }).value;
    try {
        const result = await getMusicDetailMsg(
            ctx,
            songName,
            artists,
            album,
            duration,
        );
        setResponseBody(
            ctx,
            200,
            result,
            result ? 1 : 0,
            result ? "" : "没有找到",
        );
    } catch (e) {
        setResponseBody(ctx, 500, e.message);
    }
    await next();
});

export default router;
