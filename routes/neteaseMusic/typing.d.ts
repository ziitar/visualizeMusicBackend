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

export interface SearchSongResultType {
  result: {
    songs: {
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
    }[];
    hasMore: boolean;
    songCount: number;
  };
}
