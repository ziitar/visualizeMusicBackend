export type NEMAPIFactory<T> = T & {
  code: number;
};

export interface UserInfoType {
  loginType: number;
  account: {
    id: number;
    userName: string;
    type: number;
    status: number;
  };
  token: string;
  profile?: {
    nickname: string;
    userId: number;
    avatarUrl: string;
    defaultAvatar: boolean;
    playlistCount: number;
    playlistBeSubscribedCount: number;
  };
}
export interface NEMSongsMsgType {
  id: number;
  name: string;
  artists: {
    id: number;
    name: string;
    img1v1Url: string;
  }[];
  album: {
    id: number;
    name: string;
  };
  duration: number;
}
export interface SearchSongResultType {
  result: {
    songs: Array<NEMSongsMsgType>;
    hasMore: boolean;
    songCount: number;
  };
}

export interface SongResultType {
  data: {
    id: number;
    url: string;
    size: number;
    md5: string;
  }[];
}

export interface SongDetailResultType {
  songs: {
    name: string;
    id: number;
    ar: {
      id: number;
      name: string;
      alias: string[];
    }[];
    alia: string[];
    al: {
      id: number;
      name: string;
      picUrl: string;
      pic_str: string;
      pic: number;
    };
    no: number;
  }[];
}

export interface AlbumDetailMsgType extends SongDetailResultType {
  album: {
    name: string;
    size: number;
    type: string;
    transNames: string[];
    description: string;
    alias: string[];
    picUrl: string;
    company: string;
    publishTime: number;
    blurPicUrl: string;
    artist: {
      picUrl: string;
      alias: string[];
      name: string;
      //翻译用这个
      trans: string;
      transNames: string[];
    };
  };
}
