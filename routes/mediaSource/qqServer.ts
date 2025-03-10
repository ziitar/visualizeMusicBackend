import { NEMAPIFactory } from "../neteaseMusic/typing.d.ts";

export interface QResType<T extends Record<string | number, any>> {
    response: NEMAPIFactory<T>;
}

interface MusicInfo {
    albumid: number;
    albummid: string;
    albumname: string;
    albumname_hilight: string;
    alertid: number;
    belongCD: number;
    cdIdx: number;
    chinesesinger: number;
    docid: string;
    grp: any[];
    interval: number;
    isonly: number;
    lyric: string;
    lyric_hilight: string;
    media_mid: string;
    msgid: number;
    newStatus: number;
    nt: number;
    pay: PayInfo;
    preview: PreviewInfo;
    pubtime: number;
    pure: number;
    singer: Singer[];
    size128: number;
    size320: number;
    sizeape: number;
    sizeflac: number;
    sizeogg: number;
    songid: number;
    songmid: string;
    songname: string;
    songname_hilight: string;
    strMediaMid: string;
    stream: number;
    switch: number;
    t: number;
    tag: number;
    type: number;
    ver: number;
    vid: string;
}

interface PayInfo {
    payalbum: number;
    payalbumprice: number;
    paydownload: number;
    payinfo: number;
    payplay: number;
    paytrackmouth: number;
    paytrackprice: number;
}

interface PreviewInfo {
    trybegin: number;
    tryend: number;
    trysize: number;
}

interface Singer {
    id: number;
    mid: string;
    name: string;
    name_hilight: string;
}
export interface QSearchSongMsgType {
    data: {
        song: {
            curpage: number;
            list: MusicInfo[];
            totalnum: number;
        };
    };
}

interface Song {
    albumdesc: string;
    albumid: number;
    albummid: string;
    albumname: string;
    alertid: number;
    belongCD: number;
    cdIdx: number;
    interval: number;
    isonly: number;
    label: string;
    msgid: number;
    rate: number;
    singer: Singer[];
    size128: number;
    size320: number;
    size5_1: number;
    sizeape: number;
    sizeflac: number;
    sizeogg: number;
    songid: number;
    songmid: string;
    songname: string;
    songorig: string;
    songtype: number;
    strMediaMid: string;
    stream: number;
    switch: number;
    type: number;
    vid: string;
}

interface CompanyNew {
    brief: string;
    headPic: string;
    id: number;
    is_show: number;
    name: string;
}
export interface QAlbumMsgType {
    data: {
        aDate: string;
        albumTips: string;
        color: number;
        company: string;
        company_new: CompanyNew;
        cur_song_num: number;
        desc: string;
        genre: string;
        id: number;
        lan: string;
        list: Song[];
        mid: string;
        name: string;
        radio_anchor: number;
        singerid: number;
        singermblog: string;
        singermid: string;
        singername: string;
        song_begin: number;
        total: number;
        total_song_num: number;
    };
    message: string;
}
