export const members = [
    {
        id: 1,
        name: "Maru, Blissful Mint",
        nickname: "Maru",
        themeColor: "#AAF0D1",
        image: null,
        symbol: "M",
        vibe: "Blissful Mint",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 2,
        name: "Yomi, Sunny Yellow",
        nickname: "Yomi",
        themeColor: "#FFD700",
        image: null,
        symbol: "Y",
        vibe: "Sunny Yellow",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 3,
        name: "Nanda, Sparkling Magenta",
        nickname: "Nanda",
        themeColor: "#FF00FF",
        image: null,
        symbol: "N",
        vibe: "Sparkling Magenta",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 4,
        name: "Nana, Lovely Pink",
        nickname: "Nana",
        themeColor: "#FF1B8D",
        image: null,
        symbol: "N",
        vibe: "Lovely Pink",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 5,
        name: "Rian, Forest Green",
        nickname: "Rian",
        themeColor: "#228B22",
        image: null,
        symbol: "R",
        vibe: "Forest Green",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 6,
        name: "Kanai, Devilish Black",
        nickname: "Kanai",
        themeColor: "#1A1A1D",
        image: null,
        symbol: "K",
        vibe: "Devilish Black",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 7,
        name: "Celline, Crystal White",
        nickname: "Celline",
        themeColor: "#F8F9FA",
        image: null,
        symbol: "C",
        vibe: "Crystal White",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 8,
        name: "Axie, Baby Blue",
        nickname: "Axie",
        themeColor: "#89CFF0",
        image: null,
        symbol: "A",
        vibe: "Baby Blue",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 9,
        name: "Abel, Dazzling Purple",
        nickname: "Abel",
        themeColor: "#A020F0",
        image: null,
        symbol: "A",
        vibe: "Dazzling Purple",
        catchphrase: "-",
        highlight: false
    },
    {
        id: 10,
        name: "Lynx, Lucky Red",
        nickname: "Lynx",
        themeColor: "#FF0000",
        image: null,
        symbol: "L",
        vibe: "Lucky Red",
        catchphrase: "-",
        highlight: false
    }
];

export const PRICING = {
    SPECIAL_EVENT: 35000,
    REGULAR_GROUP: 35000,
    REGULAR_SOLO: 30000,
};

export const calculatePrice = (eventType, chekiType) => {
    if (eventType === 'special') {
        return PRICING.SPECIAL_EVENT;
    }
    if (eventType === 'regular') {
        return chekiType === 'group' ? PRICING.REGULAR_GROUP : PRICING.REGULAR_SOLO;
    }
    return 0;
};

export const events = [
    { id: 1, name: "Memoire Release Party", type: "special", date: "FEB 14", time: "19:00 WIB", location: "Galaxy Mall, Surabaya" },
    { id: 2, name: "Weekly Idol Show", type: "regular", date: "EVERY SUN", time: "15:00 WIB", location: "Tunjungan Plaza" },
    { id: 3, name: "Fan Meet & Cheki", type: "special", date: "MAR 01", time: "16:00 WIB", location: "Royal Plaza" },
];

export const DISCOGRAPHY = [
    {
        id: "memoire",
        title: "Memoire",
        subtitle: "The 3rd Single (Latest Release)",
        artistUrl: "https://open.spotify.com/embed/album/3CGS010Grxn84KWFtxyIqe?utm_source=generator",
        songs: [
            {
                id: "01",
                title: "Memoire",
                subtitle: "VIEOS",
                time: "04:11",
                lyrics: "Lyrics coming soon..."
            }
        ]
    },
    {
        id: "legacy",
        title: "Legacy Collection",
        subtitle: "Lagu-Lagu Sebelumnya",
        artistUrl: "https://open.spotify.com/embed/artist/31nPW3pzHgH3ROiGUFuKJm?utm_source=generator",
        songs: [] // Displayed as an artist embed without lyrics dropdown for now
    }
];
