export interface Keyword {
    id: string;
    value: string;
    createdAt: string;
}

export interface User {
    id: string;
    nickname: string;
    universityId: string;
    keywords: Keyword[];
    pushEnabled: boolean;
}
