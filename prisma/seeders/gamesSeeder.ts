import { ApprovalStatus, Role, type PrismaClient } from '@orm'

type GameData = {
  title: string
  systemName: string // We'll use this to look up the system ID
  imageUrl?: string
}

const games: GameData[] = [
  {
    title: "Luigi's Mansion",
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/screenshots/5ed/5ed02bf02c9d47fe2ef1af6b9b513b63.jpg',
  },
  {
    title: 'Animal Crossing',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/276/27688f45ec85b6847928b6e07494451e.jpg',
  },
  {
    title: 'Metroid Prime',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/c86/c86bc047ba949959a90fe24209d59439.jpg',
  },
  {
    title: 'Pikmin',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/screenshots/8d1/8d1c16a20bf0cd1e8d5e625b0b55ec09.jpg',
  },
  {
    title: 'Super Mario Sunshine',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/154/154fea9689109f26c49c6a2db6263ef9.jpg',
  },
  {
    title: 'Super Smash Bros. Melee',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/a00/a00c19dae42d87ca31d903d26761d335.jpg',
  },
  {
    title: 'The Legend of Zelda: Twilight Princess',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/dd1/dd167cf8753db3748a975d61cc926e54.jpg',
  },
  {
    title: 'The Legend of Zelda: Wind Waker',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/884/884d12f527a9a12b5e486ee1b79ecf7f.jpeg',
  },
  {
    title: "Luigi's Mansion: Dark Moon",
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/822/82258a58b8422bc004a1b8cabdf9b960.jpg',
  },
  {
    title: "The Legend of Zelda: Majora's Mask 3D",
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/5a7/5a776ec17c5e6247e0c3f61ee1ade097.jpg',
  },
  {
    title: 'Fire Emblem: Awakening',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/c43/c432339312ee5441edb081c05d2fa411.jpg',
  },
  {
    title: 'Mario Kart 7',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/f0d/f0dcecdb5cbd387bcb97587bb6ce3852.jpg',
  },
  {
    title: 'Mario Kart 8 Deluxe',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/6f8/6f846e941c78cfbabe53cd67e55ced83.jpg',
  },
  {
    title: 'New Super Mario Bros. 2',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/785/785b3279c7849b56e5055232fe94d5eb.jpg',
  },
  {
    title: 'Pokémon X/Y',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/753/753f5d584a5f7e69aa4c05dd3b6df7c9.jpg',
  },
  {
    title: 'Super Mario 3D Land',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/d9c/d9c8b7edc78391619566adfeb52b5a9a.jpg',
  },
  {
    title: 'Super Mario Maker for Nintendo 3DS',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/65f/65fd4a08569a15c03702316e729170d4.jpg',
  },
  {
    title: 'Super Mario Maker for Nintendo 3DS',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/65f/65fd4a08569a15c03702316e729170d4.jpg',
  },
  {
    title: 'The Legend of Zelda: A Link Between Worlds',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/ab1/ab1800c2f46aec115be6a716b1493f79.jpg',
  },
  {
    title: 'The Legend of Zelda: Ocarina of Time 3D',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/c91/c916af1fa182bc2d674b4d9270bb7713.jpg',
  },
  {
    title: 'The Legend of Zelda: Phantom Hourglass',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/063/063e24eb22d69c8d4febc5b938a50b57.jpg',
  },
  {
    title: 'The Legend of Zelda: Spirit Tracks',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/063/063e24eb22d69c8d4febc5b938a50b57.jpg',
  },
  {
    title: 'The Legend of Zelda: Tri Force Heroes',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/eb8/eb82c4b98dacb91d5a5834c7e5570883.jpg',
  },
  {
    title: 'Super Mario Galaxy 2',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/games/4e9/4e928ff4b4e3c3f5acfda38b98a4cf65.jpg',
  },
  {
    title: 'Super Mario Galaxy',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/games/4e9/4e928ff4b4e3c3f5acfda38b98a4cf65.jpg',
  },
  {
    title: 'The Legend of Zelda: Skyward Sword',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/games/884/884d12f527a9a12b5e486ee1b79ecf7f.jpeg',
  },
  {
    title: 'The Legend of Zelda: Twilight Princess',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/games/dd1/dd167cf8753db3748a975d61cc926e54.jpg',
  },
  {
    title: 'The Legend of Zelda: Wind Waker HD',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/screenshots/c75/c75f83d346ded0cb785e0649e0ac10cd.jpg',
  },
  {
    title: 'Mario Kart 8',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/7df/7dfbdcb58a03fcddc68479454fc1f7de.jpg',
  },
  {
    title: 'Splatoon',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/c2f/c2f94f3fefa98453f33f2b6abb6ae103.jpg',
  },
  {
    title: 'Super Mario 3D World',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/cb7/cb78e5b2ada0e38cafb14cd00cfafbd7.jpg',
  },
  {
    title: 'Super Mario Maker',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/c07/c076aa41a7debd35459406315403eccc.jpg',
  },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg',
  },
  {
    title: 'The Legend of Zelda: The Wind Waker HD',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/screenshots/c75/c75f83d346ded0cb785e0649e0ac10cd.jpg',
  },
  {
    title: 'The Legend of Zelda: Twilight Princess HD',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/screenshots/46e/46e49369d4a3d528db5216a5cadec38b.jpg',
  },
  {
    title: "Luigi's Mansion 2",
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/screenshots/86e/86e39dfe67534014c8cd1863469e55bd.jpg',
  },
  {
    title: "Luigi's Mansion 3",
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/3d9/3d972802b9ee793098b73ecf676b687e.jpeg',
  },
  {
    title: "Super Mario 3D World + Bowser's Fury",
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/cd2/cd22f0dcf8f080086c60f77eed7a8a93.jpg',
  },
  {
    title: 'Animal Crossing: New Horizons',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/42f/42fe1abd4d7c11ca92d93a0fb0f8662b.jpg',
  },
  {
    title: 'Bayonetta 3',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/c30/c30ac50cb13096f5402250bf666a321c.jpg',
  },
  {
    title: 'DAVE THE DIVER',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/1ee/1eec43616e3ff00a674124d746926b23.jpg',
  },
  {
    title: 'Fire Emblem: Three Houses',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/530/53081dbd5003f990fa5312404ac3d71a.jpg',
  },
  {
    title: 'Hades',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg',
  },
  {
    title: 'Mario Kart 8 Deluxe',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/6f8/6f846e941c78cfbabe53cd67e55ced83.jpg',
  },
  {
    title: 'Metroid Dread',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/c26/c262f8b54b46edc72594c4a9bb8ee13e.jpg',
  },
  {
    title: 'Monster Hunter Rise',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/dbb/dbba6100aae179b5f24052c9141d426d.jpg',
  },
  {
    title: 'Monster Hunter Rise: Sunbreak',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/b09/b09dca67cbd73300040728da3e30dc88.jpg',
  },
  {
    title: 'Octopath Traveler',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/e23/e2345c839b323a94b6811705fda5af73.jpg',
  },
  {
    title: 'Splatoon 2',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/24b/24b68f500fd138c3146d8856f0dd55b4.jpg',
  },
  {
    title: 'Splatoon 3',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/360/360ac0a839ab0f0d9a70b35d38264cb0.jpg',
  },
  {
    title: 'Super Mario Maker 2',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/25f/25f1b4a7b6ed811a5f6e34e43d6cc550.jpg',
  },
  {
    title: 'Super Mario Odyssey',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/267/267bd0dbc496f52692487d07d014c061.jpg',
  },
  {
    title: 'Super Mario Party',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/d8b/d8bfed2209bf96866506cca8022db5b7.jpg',
  },
  {
    title: 'Super Smash Bros. Ultimate',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/9f3/9f3c513b301d8d7250a64dd7e73c62df.jpg',
  },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg',
  },
  {
    title: 'The Legend of Zelda: Skyward Sword HD',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/624/624ee5ea783877a9ad8ccf68b8d8300b.jpg',
  },
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/556/55684bfd048706f4266d331d70050b37.jpg',
  },
  {
    title: 'Xenoblade Chronicles 2',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/a9a/a9a6055569c986a04d066b310ea57ebb.jpg',
  },
  {
    title: 'Xenoblade Chronicles 3',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/ae7/ae7cfc9a66232839112663899d2c8d8d.jpg',
  },
  {
    title: 'Final Fantasy VII',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/6c0/6c00ee85d1344f58c469e8e47fd8ae7c.jpg',
  },
  {
    title: 'Metal Gear Solid',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/bbc/bbce6f1659d35ffc16aed8b66e9990a1.jpg',
  },
  {
    title: 'Castlevania: Symphony of the Night',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/45d/45da4dc311d84b79230317d7b24a3dec.jpg',
  },
  {
    title: 'Resident Evil',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/510/51039d0ec5dc8c3e08ae4374dfceecec.jpg',
  },
  {
    title: 'Final Fantasy IX',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/826/82626e2d7ee7d96656fb9838c2ef7302.jpg',
  },
  {
    title: 'Tekken 3',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/4aa/4aa1440932f4a12d9d0ea70a5e2164f6.jpg',
  },
  {
    title: 'Crash Bandicoot',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/bc1/bc141ec3f4ca8d1d14f0ab4e4f9e654d.jpg',
  },
  {
    title: 'Spyro the Dragon',
    systemName: 'Sony PlayStation',
    imageUrl:
      'https://media.rawg.io/media/games/243/2434639122ce19d4811048cd11ab5ba0.jpg',
  },
  {
    title: 'Final Fantasy X',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/ddc/ddc65c56f16bc3effb8d2645b095a8c5.jpg',
  },
  {
    title: 'Final Fantasy XII',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/6f9/6f932bffab5e38f540e10bb026621b08.jpg',
  },
  {
    title: 'God of War II',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/615/615e9fc0a325e0d87b84dad029b8b7b9.jpg',
  },
  {
    title: 'Grand Theft Auto: San Andreas',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/960/960b601d9541cec776c5fa42a00bf6c4.jpg',
  },
  {
    title: 'Metal Gear Solid 2: Sons of Liberty',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/0f1/0f105a3d3ba6225269c4a08b43ecbb73.jpg',
  },
  {
    title: 'Shadow of the Colossus',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/8ea/8ea1e2850d7568bc9733d546c0ac6ce1.jpg',
  },
  {
    title: 'Call of Duty: Roads to Victory',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/games/14b/14b181fc3ce0a2e4999646064c42660a.jpg',
  },
  {
    title: 'Crisis Core: Final Fantasy VII',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/games/907/90749f6693d8b7e1a3c4ce8bfd44b80a.jpg',
  },
  {
    title: 'Daxter',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/games/6f8/6f8786dbcd9864f6123faeea9746e3fa.jpg',
  },
  {
    title: 'God of War: Ghost of Sparta',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/games/5c2/5c2aef36106ee4751cdfda8fd408aaf5.jpg',
  },
  {
    title: 'LocoRoco',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/games/062/062e951a10c30364f68a68f89443d9b9.jpg',
  },
  {
    title: 'Monster Hunter Freedom Unite',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/games/1ec/1ec37a0c002029d6c9fa59d3db2090ae.jpg',
  },
  {
    title: 'Patapon',
    systemName: 'Sony PlayStation Portable',
    imageUrl:
      'https://media.rawg.io/media/screenshots/a73/a73ce51bff960a92a7e810db7bf4fb89.jpeg',
  },
  {
    title: 'Persona 4 Golden',
    systemName: 'Sony PlayStation Vita',
    imageUrl:
      'https://media.rawg.io/media/games/b2c/b2c9c6115114c8f7d461b5430e8a7d4a.jpg',
  },
  {
    title: 'Uncharted: Golden Abyss',
    systemName: 'Sony PlayStation Vita',
    imageUrl:
      'https://media.rawg.io/media/games/b7f/b7ffc4c4776e61eca19d36d3c227f89a.jpg',
  },
  {
    title: 'Killzone: Mercenary',
    systemName: 'Sony PlayStation Vita',
    imageUrl:
      'https://media.rawg.io/media/games/bc0/bc0022da81ca13ab002062a685a54684.jpg',
  },
  {
    title: 'Gravity Rush',
    systemName: 'Sony PlayStation Vita',
    imageUrl:
      'https://media.rawg.io/media/games/086/086a471ca4fe42cf1002707caefa5e7a.jpg',
  },
  {
    title: 'Danganronpa: Trigger Happy Havoc',
    systemName: 'Sony PlayStation Vita',
    imageUrl:
      'https://media.rawg.io/media/games/2fb/2fb35e31727f7ebc1f00bf998d0e22a7.jpg',
  },
  {
    title: 'Tales of Hearts R',
    systemName: 'Sony PlayStation Vita',
    imageUrl:
      'https://media.rawg.io/media/screenshots/735/7353007e86c534969068074916d2214e.jpg',
  },
  {
    title: 'The Last of Us',
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/a5a/a5a7fb8d9cb8063a8b42ee002b410db6.jpg',
  },
  {
    title: 'Uncharted 2: Among Thieves',
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/74b/74b239f6ef0216a2f66e652d54abb2e6.jpg',
  },
  {
    title: 'Metal Gear Solid V: The Phantom Pain',
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/490/49016e06ae2103881ff6373248843069.jpg',
  },
  {
    title: 'Bloodborne',
    systemName: 'Sony PlayStation 4',
    imageUrl:
      'https://media.rawg.io/media/games/214/214b29aeff13a0ae6a70fc4426e85991.jpg',
  },
  {
    title: 'The Last of Us Part II',
    systemName: 'Sony PlayStation 4',
    imageUrl:
      'https://media.rawg.io/media/games/909/909974d1c7863c2027241e265fe7011f.jpg',
  },
  {
    title: 'God of War (2018)',
    systemName: 'Sony PlayStation 4',
    imageUrl:
      'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg',
  },
  {
    title: 'Halo 3',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/982/982ff61d574fed5e416cb1867b40d9b0.jpg',
  },
  {
    title: 'Gears of War',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/988/98834d39955e7f15d3717fac438128aa.jpg',
  },
  {
    title: 'Forza Horizon',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/994/99496806493c2f39b9f191923de2a63b.jpg',
  },
  {
    title: 'Half-Life',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/6c5/6c55e22185876626881b76c11922b073.jpg',
  },
  {
    title: 'Half-Life 2',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/b8c/b8c243eaa0fbac8115e0cdccac3f91dc.jpg',
  },
  {
    title: 'The Witcher 2: Assassins of Kings',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/bba/bba9dff323894856be2b2638f2b8aed0.jpg',
  },
  {
    title: 'The Witcher 3: Wild Hunt',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg',
  },
  {
    title: 'Dark Souls Remastered',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/29c/29c6c21cc0c78cff6f45d23631cc82f4.jpg',
  },
  {
    title: 'Dark Souls II',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/651/6512783a214618584d144d5d852ba595.jpg',
  },
  {
    title: 'Dark Souls III',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/da1/da1b267764d77221f07a4386b6548e5a.jpg',
  },
  {
    title: 'Sekiro: Shadows Die Twice',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/67f/67f62d1f062a6164f57575e0604ee9f6.jpg',
  },
  {
    title: 'Hades',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg',
  },
  {
    title: 'Hades II',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/8fd/8fd2e8317849fd265ad8781c324d4ec2.jpg',
  },
  {
    title: 'DAVE THE DIVER',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/1ee/1eec43616e3ff00a674124d746926b23.jpg',
  },
]

const pendingGames: GameData[] = [
  {
    title: "Baldur's Gate 3",
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/699/69907ecf13f172e9e144069769c3be73.jpg',
  },
  {
    title: 'Portal 2',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg',
  },
  {
    title: 'DOOM Eternal',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/3ea/3ea3c9bbd940b6cb7f2139e42d3d443f.jpg',
  },
  {
    title: 'Divinity: Original Sin 2',
    systemName: 'Microsoft Windows',
    imageUrl:
      'https://media.rawg.io/media/games/424/424facd40f4eb1f2794fe4b4bb28a277.jpg',
  },
  {
    title: 'Red Dead Redemption',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/686/686909717c3aa01518bc42ae2bf4259e.jpg',
  },
  {
    title: 'Mass Effect 2',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/3cf/3cff89996570cf29a10eb9cd967dcf73.jpg',
  },
  {
    title: 'Fable II',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/cec/cec82d526f9d056d426c985562963eec.jpg',
  },
  {
    title: 'Alan Wake',
    systemName: 'Microsoft Xbox 360',
    imageUrl:
      'https://media.rawg.io/media/games/5c0/5c0dd63002cb23f804aab327d40ef119.jpg',
  },
  {
    title: 'Halo: Combat Evolved',
    systemName: 'Microsoft Xbox',
    imageUrl:
      'https://media.rawg.io/media/games/abf/abffd94ed6fe34027c720bee593c06d2.jpg',
  },
  {
    title: 'Star Wars: Knights of the Old Republic',
    systemName: 'Microsoft Xbox',
    imageUrl:
      'https://media.rawg.io/media/games/6e0/6e0c19bb111bd4fa20cf0eb72a049519.jpg',
  },
  {
    title: 'Jet Set Radio Future',
    systemName: 'Microsoft Xbox',
    imageUrl:
      'https://media.rawg.io/media/screenshots/6f5/6f5dd05dde104f9b8b34eb6c057c8302.jpg',
  },
  {
    title: 'Ninja Gaiden Black',
    systemName: 'Microsoft Xbox',
    imageUrl:
      'https://media.rawg.io/media/screenshots/51f/51f5251163fc646e4f0230eb8eb7a795.jpg',
  },
  {
    title: 'Bravely Default',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/f42/f4233dab41a5e807b5689ed926efd685.jpg',
  },
  {
    title: 'Monster Hunter 4 Ultimate',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/9e9/9e997e95a2302da538f64a28c71fbe94.jpg',
  },
  {
    title: 'Kirby: Planet Robobot',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/5b9/5b9d36a817c8537e6b2722122b7878aa.jpg',
  },
  {
    title: 'Kid Icarus: Uprising',
    systemName: 'Nintendo 3DS',
    imageUrl:
      'https://media.rawg.io/media/games/2cd/2cd7c7db68c60d2e1dfb4e91d3d770bf.jpg',
  },
  {
    title: 'Super Mario 64',
    systemName: 'Nintendo 64',
    imageUrl:
      'https://media.rawg.io/media/games/1d5/1d565b99cad46c44b534d9803e27bd49.jpg',
  },
  {
    title: 'The Legend of Zelda: Ocarina of Time',
    systemName: 'Nintendo 64',
    imageUrl:
      'https://media.rawg.io/media/games/3a0/3a0c8e9ed3a711c542218831b893a0fa.jpg',
  },
  {
    title: 'GoldenEye 007',
    systemName: 'Nintendo 64',
    imageUrl:
      'https://media.rawg.io/media/games/5a1/5a145fe3002fc988140f7f00edcb9715.jpg',
  },
  {
    title: 'Banjo-Kazooie',
    systemName: 'Nintendo 64',
    imageUrl:
      'https://media.rawg.io/media/screenshots/f0d/f0da831778e57b58636ccaf20a7cc6e6.jpg',
  },
  {
    title: 'New Super Mario Bros.',
    systemName: 'Nintendo DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/ada/ada90672691bd75745ee88cd43d49657.jpg',
  },
  {
    title: 'Mario Kart DS',
    systemName: 'Nintendo DS',
    imageUrl:
      'https://media.rawg.io/media/screenshots/bc0/bc02ade70c7d92900b1f4950f4c845ba.jpg',
  },
  {
    title: 'Pokémon Black and White',
    systemName: 'Nintendo DS',
    imageUrl:
      'https://media.rawg.io/media/games/3dd/3ddf27683a9aecf1cf39605100651a99.jpg',
  },
  {
    title: 'The World Ends with You',
    systemName: 'Nintendo DS',
    imageUrl:
      'https://media.rawg.io/media/games/1a2/1a2f6667187d21dc97f267663f8b6dcf.jpg',
  },
  {
    title: 'Mario Kart: Double Dash!!',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/screenshots/b19/b196fdca25e4df755f6fafd02df158d9.jpg',
  },
  {
    title: 'Paper Mario: The Thousand-Year Door',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/screenshots/d35/d35fae8baf39ca7e2b3d825d6ecb21db.jpg',
  },
  {
    title: 'Resident Evil 4',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/fee/fee0100afd87b52bfbd33e26689fa26c.jpg',
  },
  {
    title: 'F-Zero GX',
    systemName: 'Nintendo GameCube',
    imageUrl:
      'https://media.rawg.io/media/games/628/628f219b556759a67365019347fceb6d.jpg',
  },
  {
    title: 'Super Mario Bros. Wonder',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/1fd/1fd3f030bee73452d46a0678084a7ed9.jpg',
  },
  {
    title: 'Pikmin 4',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/274/2740b879e28df2ac3cdbc929a553863d.jpg',
  },
  {
    title: 'Metroid Prime Remastered',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/f2f/f2f9f11997ee841550ba2b8ccf3c51e9.jpg',
  },
  {
    title: 'Fire Emblem Engage',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/4c4/4c41c96a4ecbbff9ed23f62590e9b720.jpg',
  },
  {
    title: 'Ring Fit Adventure',
    systemName: 'Nintendo Switch',
    imageUrl:
      'https://media.rawg.io/media/games/edf/edf0e3551971bcf668e27512eed199f8.jpg',
  },
  {
    title: 'Pikmin 3',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/screenshots/450/450788922a6ca76924fffd0f4daf363a.jpg',
  },
  {
    title: 'Super Smash Bros. for Wii U',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/f2a/f2a2fc10c284cb7d6c3bff1d4e01da51.jpg',
  },
  {
    title: 'Bayonetta 2',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/games/3d7/3d7c8e749b18cfc898c80016594981fe.jpg',
  },
  {
    title: 'Xenoblade Chronicles X',
    systemName: 'Nintendo Wii U',
    imageUrl:
      'https://media.rawg.io/media/screenshots/db8/db83a83c7fc09dca7d5357ed28d167dd.jpg',
  },
  {
    title: 'Mario Kart Wii',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/screenshots/b19/b196fdca25e4df755f6fafd02df158d9.jpg',
  },
  {
    title: 'Donkey Kong Country Returns',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/games/ccd/ccd36642cee0cbb95681a6e3b7715381.jpg',
  },
  {
    title: 'Metroid Prime Trilogy',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/screenshots/b86/b864ce981ace01517c6674723085a0bc.jpg',
  },
  {
    title: 'Wii Sports Resort',
    systemName: 'Nintendo Wii',
    imageUrl:
      'https://media.rawg.io/media/screenshots/f5c/f5c795e550f919f5e17b919cae2e8cdf.jpg',
  },
  {
    title: 'Sonic Adventure',
    systemName: 'Sega Dreamcast',
    imageUrl:
      'https://media.rawg.io/media/games/566/566b771293b3e8aee0c071a02e81d925.jpg',
  },
  {
    title: 'Shenmue',
    systemName: 'Sega Dreamcast',
    imageUrl:
      'https://media.rawg.io/media/games/c11/c1194278356d6ef0b65722610f618e5c.jpg',
  },
  {
    title: 'Skies of Arcadia',
    systemName: 'Sega Dreamcast',
    imageUrl:
      'https://media.rawg.io/media/games/673/6737ad0c3c7f70c07c871c6002e6aef8.jpg',
  },
  {
    title: 'Soulcalibur',
    systemName: 'Sega Dreamcast',
    imageUrl:
      'https://media.rawg.io/media/games/743/7430f1846ba6ce836f169d936c89819e.jpg',
  },
  {
    title: 'NiGHTS into Dreams…',
    systemName: 'Sega Saturn',
    imageUrl:
      'https://media.rawg.io/media/screenshots/fe0/fe0ccce931cdb5aaff9500a331e5c2eb.jpg',
  },
  {
    title: 'Panzer Dragoon Saga',
    systemName: 'Sega Saturn',
    imageUrl:
      'https://media.rawg.io/media/screenshots/cee/ceeb29cee75bf740356e089da94ebfbe.jpg',
  },
  {
    title: 'Virtua Fighter 2',
    systemName: 'Sega Saturn',
    imageUrl:
      'https://media.rawg.io/media/screenshots/b1e/b1e4596d5dd07e582d56b960f82ccc03.jpg',
  },
  {
    title: 'Radiant Silvergun',
    systemName: 'Sega Saturn',
    imageUrl:
      'https://media.rawg.io/media/screenshots/082/08204cebaa6276237d4ac940d3aea52d.jpg',
  },
  {
    title: 'Kingdom Hearts',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/bc3/bc3c433821089108642a41a3057f92c5.jpg',
  },
  {
    title: 'Okami',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/922/92244532ff3c3f277824c0cf8941f187.jpg',
  },
  {
    title: 'Devil May Cry 3',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/912/9128672600b6f23f28c438fc4963e042.jpg',
  },
  {
    title: 'Ratchet & Clank: Up Your Arsenal',
    systemName: 'Sony PlayStation 2',
    imageUrl:
      'https://media.rawg.io/media/games/d06/d06ba76b7383b5e6a9a3534d1dc7e754.jpg',
  },
  {
    title: "Demon's Souls",
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/ac3/ac3a89bfbda76082402e42b933c5825a.jpg',
  },
  {
    title: 'Red Dead Redemption',
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/686/686909717c3aa01518bc42ae2bf4259e.jpg',
  },
  {
    title: 'Ni no Kuni: Wrath of the White Witch',
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/95e/95ee6bf3accffaf3dc886a8e3ecc24d8.jpg',
  },
  {
    title: 'God of War III',
    systemName: 'Sony PlayStation 3',
    imageUrl:
      'https://media.rawg.io/media/games/289/289951d92239d05f2a663d632aa3888a.jpg',
  },
]

async function gamesSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding games...')

  // Get all systems first
  const systems = await prisma.system.findMany()
  const systemMap = new Map(systems.map((system) => [system.name, system.id]))

  // Get the 4 seeded users for submission tracking
  const seededUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'superadmin@emuready.com',
          'admin@emuready.com',
          'author@emuready.com',
          'user@emuready.com',
        ],
      },
    },
  })

  if (seededUsers.length === 0) {
    console.warn('No seeded users found, games will not have submitters')
  }

  const adminUsers = seededUsers.filter(
    (user) => user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN,
  )

  if (adminUsers.length === 0) {
    console.warn('No admin users found, approved games will not have approvers')
  }

  // Helper function to get random element from array
  const getRandomElement = <T>(array: T[]): T | undefined => {
    return array.length > 0
      ? array[Math.floor(Math.random() * array.length)]
      : undefined
  }

  // Helper function to get random date in the past (within last 90 days)
  const getRandomPastDate = (maxDaysAgo = 90): Date => {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo)
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  }

  // Process approved games
  console.info(`📝 Processing ${games.length} approved games...`)
  for (const game of games) {
    const systemId = systemMap.get(game.systemName)
    if (!systemId) {
      console.warn(
        `System "${game.systemName}" not found, skipping game "${game.title}"`,
      )
      continue
    }

    const submitter = getRandomElement(seededUsers)
    const approver = getRandomElement(adminUsers)
    const submittedAt = getRandomPastDate(90)
    const approvedAt = new Date(
      submittedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
    ) // Approved within 7 days of submission

    await prisma.game.upsert({
      where: { title_systemId: { title: game.title, systemId } },
      update: {
        imageUrl: game.imageUrl,
        status: ApprovalStatus.APPROVED,
        submittedBy: submitter?.id ?? null,
        submittedAt: submittedAt,
        approvedBy: approver?.id ?? null,
        approvedAt: approvedAt,
      },
      create: {
        title: game.title,
        imageUrl: game.imageUrl,
        systemId,
        status: ApprovalStatus.APPROVED,
        submittedBy: submitter?.id ?? null,
        submittedAt: submittedAt,
        approvedBy: approver?.id ?? null,
        approvedAt: approvedAt,
      },
    })
  }

  // Process pending games
  console.info(`📝 Processing ${pendingGames.length} pending games...`)
  for (const game of pendingGames) {
    const systemId = systemMap.get(game.systemName)
    if (!systemId) {
      console.warn(
        `System "${game.systemName}" not found, skipping pending game "${game.title}"`,
      )
      continue
    }

    const submitter = getRandomElement(seededUsers)
    const submittedAt = getRandomPastDate(30) // Pending games submitted more recently

    await prisma.game.upsert({
      where: { title_systemId: { title: game.title, systemId } },
      update: {
        imageUrl: game.imageUrl,
        status: ApprovalStatus.PENDING,
        submittedBy: submitter?.id ?? null,
        submittedAt: submittedAt,
        approvedBy: null,
        approvedAt: null,
      },
      create: {
        title: game.title,
        imageUrl: game.imageUrl,
        systemId,
        status: ApprovalStatus.PENDING,
        submittedBy: submitter?.id ?? null,
        submittedAt: submittedAt,
        approvedBy: null,
        approvedAt: null,
      },
    })
  }

  console.info('✅ Games seeded successfully')
  console.info(`📊 Summary:`)
  console.info(`   ✅ ${games.length} approved games processed`)
  console.info(`   ⏳ ${pendingGames.length} pending games processed`)
  console.info(`   👥 Using ${seededUsers.length} seeded users as submitters`)
  console.info(`   👨‍💼 Using ${adminUsers.length} admin users as approvers`)
}

export default gamesSeeder
