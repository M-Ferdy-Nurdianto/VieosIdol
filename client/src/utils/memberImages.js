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
    9: '/photo/members/Abel.webp',
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
    abel: '/photo/members/Abel.webp',
    abell: '/photo/members/Abel.webp',
    lynx: '/photo/members/Lynx.webp'
});

const LOCAL_MEMBER_CHEKI_IMAGE_BY_ID = Object.freeze({
    1: '/photo/cheki/Maru.webp',
    2: '/photo/cheki/Yomi.webp',
    3: '/photo/cheki/Nanda.webp',
    4: '/photo/cheki/Nana.webp',
    5: '/photo/cheki/Rian.webp',
    6: '/photo/cheki/Kanai.webp',
    7: '/photo/cheki/Celline.webp',
    8: '/photo/cheki/Axie.webp',
    9: '/photo/cheki/Abel.webp',
    10: '/photo/cheki/Lynx.webp'
});

const LOCAL_MEMBER_CHEKI_IMAGE_BY_NICKNAME = Object.freeze({
    maru: '/photo/cheki/Maru.webp',
    yomi: '/photo/cheki/Yomi.webp',
    nanda: '/photo/cheki/Nanda.webp',
    nana: '/photo/cheki/Nana.webp',
    rian: '/photo/cheki/Rian.webp',
    kanai: '/photo/cheki/Kanai.webp',
    celline: '/photo/cheki/Celline.webp',
    celin: '/photo/cheki/Celline.webp',
    axie: '/photo/cheki/Axie.webp',
    abel: '/photo/cheki/Abel.webp',
    abell: '/photo/cheki/Abel.webp',
    lynx: '/photo/cheki/Lynx.webp'
});

const normalizeNickname = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    const match = raw.match(/[a-z0-9]+/);
    return match ? match[0] : '';
};

export const getLocalMemberImage = (member) => {
    const id = Number(member?.id);
    if (LOCAL_MEMBER_IMAGE_BY_ID[id]) {
        return LOCAL_MEMBER_IMAGE_BY_ID[id];
    }

    const nickname = normalizeNickname(member?.nickname || member?.name || member?.fullname);
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

export const getMemberChekiImageSrc = (member) => {
    const id = Number(member?.id);
    const nickname = normalizeNickname(member?.nickname || member?.name || member?.fullname);
    
    // 1. Overrides for Cheki Folder (Abel, Celline)
    if (nickname === 'abel' || nickname === 'abell') return '/photo/cheki/Abel.webp';
    if (nickname === 'celline' || nickname === 'celin') return '/photo/cheki/Celline.webp';
    
    // 2. Try Nickname-based mapping for Cheki folder
    if (nickname && LOCAL_MEMBER_CHEKI_IMAGE_BY_NICKNAME[nickname]) {
        return LOCAL_MEMBER_CHEKI_IMAGE_BY_NICKNAME[nickname];
    }

    // 3. Try ID-based mapping for Cheki folder
    if (id && LOCAL_MEMBER_CHEKI_IMAGE_BY_ID[id]) {
        return LOCAL_MEMBER_CHEKI_IMAGE_BY_ID[id];
    }
    
    // 4. Construct path dynamically as fallback
    if (nickname) {
        const capNickname = nickname.charAt(0).toUpperCase() + nickname.slice(1);
        return `/photo/cheki/${capNickname}.webp`;
    }

    // 5. Ultimate Fallback to regular local member image
    return getLocalMemberImage(member) || DEFAULT_MEMBER_IMAGE;
};

export const LOCAL_MEMBER_IMAGES = Object.freeze(Object.values(LOCAL_MEMBER_IMAGE_BY_ID));
