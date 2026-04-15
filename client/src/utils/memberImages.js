export const DEFAULT_MEMBER_IMAGE = '/logos/vieos.webp';

const LOCAL_MEMBER_IMAGE_BY_ID = Object.freeze({
    1: '/photo/members/Maru.webp',
    2: '/photo/members/Yomi.webp',
    3: '/photo/members/Nanda.webp',
    4: '/photo/members/Nana.webp',
    5: '/photo/members/Rian.webp',
    6: '/photo/members/Kanai.webp',
    7: '/photo/members/Celin.webp',
    8: '/photo/members/Axie.webp',
    9: '/photo/members/Abell.webp',
    10: '/photo/members/Lynx.webp'
});

const LOCAL_MEMBER_IMAGE_BY_NICKNAME = Object.freeze({
    maru: '/photo/members/Maru.webp',
    yomi: '/photo/members/Yomi.webp',
    nanda: '/photo/members/Nanda.webp',
    nana: '/photo/members/Nana.webp',
    rian: '/photo/members/Rian.webp',
    kanai: '/photo/members/Kanai.webp',
    celline: '/photo/members/Celin.webp',
    celin: '/photo/members/Celin.webp',
    axie: '/photo/members/Axie.webp',
    abell: '/photo/members/Abell.webp',
    lynx: '/photo/members/Lynx.webp'
});

const normalizeNickname = (value) => String(value || '').trim().toLowerCase();

export const getLocalMemberImage = (member) => {
    const id = Number(member?.id);
    if (LOCAL_MEMBER_IMAGE_BY_ID[id]) {
        return LOCAL_MEMBER_IMAGE_BY_ID[id];
    }

    const nickname = normalizeNickname(member?.nickname);
    if (nickname && LOCAL_MEMBER_IMAGE_BY_NICKNAME[nickname]) {
        return LOCAL_MEMBER_IMAGE_BY_NICKNAME[nickname];
    }

    return null;
};

export const getMemberImageSrc = (member) => {
    return getLocalMemberImage(member) || member?.image || member?.image_url || DEFAULT_MEMBER_IMAGE;
};

export const getMemberFallbackImage = (member) => {
    return getLocalMemberImage(member) || DEFAULT_MEMBER_IMAGE;
};

export const LOCAL_MEMBER_IMAGES = Object.freeze(Object.values(LOCAL_MEMBER_IMAGE_BY_ID));
