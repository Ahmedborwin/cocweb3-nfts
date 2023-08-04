const metadataTemplateArray = [
    {
        name: "Gun",
        description: "9 Millimiter Glock",
        image: "",
        attributes: {
            Damage: 15,
            Defence: 0,
            Special: "Mid Range Combat",
            Weakness: "Aikido",
        },
    },
    {
        name: "Shield",
        description: "Captians Americas Sheild",
        image: "",
        attributes: {
            Damage: 8,
            Defence: 80,
            Special: "Mid Range Combat",
            Weakness: "Thors Hammer",
        },
    },
    {
        name: "Grenade",
        description: "Cluster Bomb",
        image: "",
        attributes: {
            Damage: 120,
            Defence: 0,
            Special: "Group Damage",
            Weakness: "Difuse",
        },
    },
    {
        name: "Tank",
        description: "Leopard 9000",
        image: "",
        attributes: {
            Damage: 150,
            Defence: 200,
            Special: "Land Battles",
            Weakness: "Grenade",
        },
    },
    {
        name: "Plane",
        description: "F30 Fighter Plane",
        image: "",
        attributes: {
            Damage: 130,
            Defence: 250,
            Special: "Carpet Bomb",
            Weakness: "Lock Missles",
        },
    },
]

module.exports = { metadataTemplateArray }
