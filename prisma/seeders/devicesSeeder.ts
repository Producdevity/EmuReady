import { type PrismaClient } from '@orm'

type DeviceData = {
  brandName: string
  modelName: string
  socName?: string
}

const devices: DeviceData[] = [
  // ASUS
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L', socName: 'AMD Z1 Extreme' },
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L-NH001W', socName: 'AMD Z1' },
  { brandName: 'ASUS', modelName: 'ROG Phone 5', socName: 'Snapdragon 888' },
  {
    brandName: 'ASUS',
    modelName: 'ROG Phone 6',
    socName: 'Snapdragon 8+ Gen 1',
  },
  {
    brandName: 'ASUS',
    modelName: 'ROG Phone 7',
    socName: 'Snapdragon 8 Gen 2',
  },

  // AYANEO
  { brandName: 'AYANEO', modelName: 'Air Plus', socName: 'AMD Ryzen 7 6800U' },
  { brandName: 'AYANEO', modelName: 'Air Pro', socName: 'AMD Ryzen 7 5825U' },
  { brandName: 'AYANEO', modelName: 'Air', socName: 'AMD Ryzen 5 5560U' },
  { brandName: 'AYANEO', modelName: 'Kun', socName: 'AMD Ryzen 7 7840U' },
  {
    brandName: 'AYANEO',
    modelName: 'Next Advance',
    socName: 'AMD Ryzen 7 5800U',
  },
  { brandName: 'AYANEO', modelName: 'Next Pro', socName: 'AMD Ryzen 7 5825U' },
  { brandName: 'AYANEO', modelName: 'Next', socName: 'AMD Ryzen 7 5825U' },

  // AYN
  { brandName: 'AYN', modelName: 'Odin 2 Max', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'AYN', modelName: 'Odin 2 Mini', socName: 'Snapdragon 8 Gen 2' },
  {
    brandName: 'AYN',
    modelName: 'Odin 2 Portal',
    socName: 'Snapdragon 8 Gen 2',
  },
  { brandName: 'AYN', modelName: 'Odin 2', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'AYN', modelName: 'Odin', socName: 'Snapdragon 845' },

  // Anbernic
  { brandName: 'Anbernic', modelName: 'RG505', socName: 'Tiger T618' },
  { brandName: 'Anbernic', modelName: 'RG406H', socName: 'Tiger T820' },
  { brandName: 'Anbernic', modelName: 'RG406V', socName: 'Tiger T820' },

  // GPD
  { brandName: 'GPD', modelName: 'Win 4', socName: 'AMD Ryzen 7 6800U' },
  { brandName: 'GPD', modelName: 'Win Max 2', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'GPD', modelName: 'XP Plus', socName: 'Dimensity 1200' },
  { brandName: 'GPD', modelName: 'XP', socName: 'Helio G95' },

  // Lenovo
  { brandName: 'Lenovo', modelName: 'Legion Go', socName: 'AMD Z1 Extreme' },
  {
    brandName: 'Lenovo',
    modelName: 'Legion Phone Duel 2',
    socName: 'Snapdragon 888',
  },
  {
    brandName: 'Lenovo',
    modelName: 'Legion Phone Duel',
    socName: 'Snapdragon 865+',
  },

  // Logitech
  { brandName: 'Logitech', modelName: 'G Cloud', socName: 'Snapdragon 720G' },

  // MSI
  { brandName: 'MSI', modelName: 'Claw', socName: 'Intel Core Ultra 7 155H' },

  // OnePlus
  { brandName: 'OnePlus', modelName: '10 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'OnePlus', modelName: '10T', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'OnePlus', modelName: '11', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'OnePlus', modelName: '11R', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'OnePlus', modelName: '12', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'OnePlus', modelName: '12R', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'OnePlus', modelName: '13', socName: 'Snapdragon 8 Elite' },
  { brandName: 'OnePlus', modelName: '13R', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'OnePlus', modelName: '9 Pro', socName: 'Snapdragon 888' },
  { brandName: 'OnePlus', modelName: 'Open', socName: 'Snapdragon 8 Gen 2' },

  // Pimax
  { brandName: 'Pimax', modelName: 'Portal', socName: 'Snapdragon 8 Gen 2' },

  // Razer
  { brandName: 'Razer', modelName: 'Edge 5G', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Razer', modelName: 'Edge', socName: 'Snapdragon 8 Gen 1' },

  // Realme

  { brandName: 'Realme', modelName: '10 Pro+', socName: 'Dimensity 1080' },
  { brandName: 'Realme', modelName: '11 Pro', socName: 'Dimensity 7050' },
  { brandName: 'Realme', modelName: '11 Pro+', socName: 'Dimensity 7050' },
  { brandName: 'Realme', modelName: '12 Pro', socName: 'Snapdragon 6 Gen 1' },
  { brandName: 'Realme', modelName: '12 Pro+', socName: 'Snapdragon 7s Gen 2' },
  { brandName: 'Realme', modelName: '12+ 5G', socName: 'Dimensity 7050' },
  { brandName: 'Realme', modelName: '8 Pro', socName: 'Snapdragon 720G' },
  { brandName: 'Realme', modelName: '9 Pro+', socName: 'Dimensity 920' },
  { brandName: 'Realme', modelName: '9i', socName: 'Snapdragon 680' },
  { brandName: 'Realme', modelName: 'C55', socName: 'Helio G88' },
  { brandName: 'Realme', modelName: 'C75', socName: 'Helio G92 Max' },
  { brandName: 'Realme', modelName: 'GT 2 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Realme', modelName: 'GT 2 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Realme', modelName: 'GT 3', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Realme', modelName: 'GT 5 Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'Realme', modelName: 'GT 5', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Realme', modelName: 'GT Neo 3', socName: 'Dimensity 8100' },
  {
    brandName: 'Realme',
    modelName: 'GT Neo 5 SE',
    socName: 'Snapdragon 7+ Gen 2',
  },
  {
    brandName: 'Realme',
    modelName: 'GT Neo 5',
    socName: 'Snapdragon 8+ Gen 1',
  },
  {
    brandName: 'Realme',
    modelName: 'GT Neo 6 SE',
    socName: 'Snapdragon 7+ Gen 2',
  },
  { brandName: 'Realme', modelName: 'GT Neo 6', socName: 'Snapdragon 8 Gen 2' },

  // RedMagic
  { brandName: 'RedMagic', modelName: '6R', socName: 'Snapdragon 888' },
  { brandName: 'RedMagic', modelName: '7', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'RedMagic', modelName: '7 Pro', socName: 'Snapdragon 8 Gen 1' },
  {
    brandName: 'RedMagic',
    modelName: '7S Pro',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'RedMagic', modelName: '8 Pro', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'RedMagic', modelName: '8S Pro', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'RedMagic', modelName: '9 Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'RedMagic', modelName: '9S Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'RedMagic', modelName: '10 Air', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'RedMagic', modelName: '10 Pro', socName: 'Snapdragon 8 Elite' },

  { brandName: 'Retroid', modelName: 'Pocket 3', socName: 'Tiger T618' },
  {
    brandName: 'Retroid',
    modelName: 'Pocket 4 Pro',
    socName: 'Dimensity 1100',
  },
  { brandName: 'Retroid', modelName: 'Pocket 4', socName: 'Dimensity 900' },
  { brandName: 'Retroid', modelName: 'Pocket 5', socName: 'Snapdragon 865' },
  {
    brandName: 'Retroid',
    modelName: 'Pocket Classic',
    socName: 'Allwinner H700',
  },
  {
    brandName: 'Retroid',
    modelName: 'Pocket Flip 2 - SD',
    socName: 'Snapdragon 865',
  },
  { brandName: 'Retroid', modelName: 'Pocket Flip', socName: 'Allwinner A133' },
  {
    brandName: 'Retroid',
    modelName: 'Pocket Mini V2',
    socName: 'Snapdragon 865',
  },
  { brandName: 'Retroid', modelName: 'Pocket Mini', socName: 'Snapdragon 865' },

  // Valve
  { brandName: 'Valve', modelName: 'Steam Deck', socName: 'AMD Custom APU' },

  // Xiaomi
  {
    brandName: 'Xiaomi',
    modelName: 'Black Shark 4',
    socName: 'Snapdragon 870',
  },
  {
    brandName: 'Xiaomi',
    modelName: 'Black Shark 5 Pro',
    socName: 'Snapdragon 8 Gen 1',
  },
  {
    brandName: 'Xiaomi',
    modelName: 'Black Shark 5',
    socName: 'Snapdragon 870',
  },

  // Samsung
  { brandName: 'Samsung', modelName: 'Galaxy S24', socName: 'Exynos 2400' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S24 Ultra',
    socName: 'Snapdragon 8 Gen 3',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S23',
    socName: 'Snapdragon 8 Gen 2',
  },
  { brandName: 'Samsung', modelName: 'Galaxy S22', socName: 'Exynos 2200' },
  { brandName: 'Samsung', modelName: 'Galaxy S21', socName: 'Exynos 2100' },
  { brandName: 'Samsung', modelName: 'Galaxy S20', socName: 'Exynos 990' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Fold5',
    socName: 'Snapdragon 8 Gen 2',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Fold4',
    socName: 'Snapdragon 8+ Gen 1',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Fold3',
    socName: 'Snapdragon 888',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Fold2',
    socName: 'Snapdragon 865+',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Flip5',
    socName: 'Snapdragon 8 Gen 2',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Flip4',
    socName: 'Snapdragon 8+ Gen 1',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Flip3',
    socName: 'Snapdragon 888',
  },
  { brandName: 'Samsung', modelName: 'Galaxy A55 5G', socName: 'Exynos 1480' },
  { brandName: 'Samsung', modelName: 'Galaxy A54 5G', socName: 'Exynos 1380' },
  { brandName: 'Samsung', modelName: 'Galaxy A53 5G', socName: 'Exynos 1280' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy A52s 5G',
    socName: 'Snapdragon 778G',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy A52 5G',
    socName: 'Snapdragon 750G',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy A34 5G',
    socName: 'Dimensity 1080',
  },

  // Google Pixel
  { brandName: 'Google', modelName: 'Pixel 9 Pro XL', socName: 'Tensor G4' },
  { brandName: 'Google', modelName: 'Pixel 9 Pro', socName: 'Tensor G4' },
  { brandName: 'Google', modelName: 'Pixel 9', socName: 'Tensor G4' },
  { brandName: 'Google', modelName: 'Pixel 8a', socName: 'Tensor G3' },
  { brandName: 'Google', modelName: 'Pixel 8 Pro', socName: 'Tensor G3' },
  { brandName: 'Google', modelName: 'Pixel 8', socName: 'Tensor G3' },
  { brandName: 'Google', modelName: 'Pixel 7a', socName: 'Tensor G2' },
  { brandName: 'Google', modelName: 'Pixel 7 Pro', socName: 'Tensor G2' },
  { brandName: 'Google', modelName: 'Pixel 7', socName: 'Tensor G2' },
  { brandName: 'Google', modelName: 'Pixel 6a', socName: 'Tensor G1' },
  { brandName: 'Google', modelName: 'Pixel 6 Pro', socName: 'Tensor G1' },
  { brandName: 'Google', modelName: 'Pixel 6', socName: 'Tensor G1' },
  { brandName: 'Google', modelName: 'Pixel 5a', socName: 'Snapdragon 765G' },
  { brandName: 'Google', modelName: 'Pixel 5', socName: 'Snapdragon 765G' },
  { brandName: 'Google', modelName: 'Pixel 4a 5G', socName: 'Snapdragon 765G' },
  { brandName: 'Google', modelName: 'Pixel 4a', socName: 'Snapdragon 730G' },
  { brandName: 'Google', modelName: 'Pixel 4 XL', socName: 'Snapdragon 855' },
  { brandName: 'Google', modelName: 'Pixel 4', socName: 'Snapdragon 855' },
  { brandName: 'Google', modelName: 'Pixel 3a XL', socName: 'Snapdragon 670' },
  { brandName: 'Google', modelName: 'Pixel 3a', socName: 'Snapdragon 670' },
  { brandName: 'Google', modelName: 'Pixel 3 XL', socName: 'Snapdragon 845' },
  { brandName: 'Google', modelName: 'Pixel 3', socName: 'Snapdragon 845' },

  // Additional Xiaomi devices
  { brandName: 'Xiaomi', modelName: '15 Pro', socName: 'Snapdragon 8 Elite' },
  { brandName: 'Xiaomi', modelName: '15', socName: 'Snapdragon 8 Elite' },
  { brandName: 'Xiaomi', modelName: '14 Ultra', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'Xiaomi', modelName: '14 Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'Xiaomi', modelName: '14', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'Xiaomi', modelName: '13T Pro', socName: 'Dimensity 9200+' },
  { brandName: 'Xiaomi', modelName: '13T', socName: 'Dimensity 8200' },
  { brandName: 'Xiaomi', modelName: '13 Ultra', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Xiaomi', modelName: '13 Pro', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Xiaomi', modelName: '13', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Xiaomi', modelName: '12T Pro', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Xiaomi', modelName: '12T', socName: 'Dimensity 8100' },
  {
    brandName: 'Xiaomi',
    modelName: '12S Ultra',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'Xiaomi', modelName: '12S Pro', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Xiaomi', modelName: '12S', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Xiaomi', modelName: '12 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Xiaomi', modelName: '12', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Xiaomi', modelName: '11T Pro', socName: 'Snapdragon 888' },
  { brandName: 'Xiaomi', modelName: '11T', socName: 'Dimensity 1200' },
  { brandName: 'Xiaomi', modelName: '11 Ultra', socName: 'Snapdragon 888' },
  { brandName: 'Xiaomi', modelName: '11 Pro', socName: 'Snapdragon 888' },
  { brandName: 'Xiaomi', modelName: '11', socName: 'Snapdragon 888' },
  { brandName: 'Xiaomi', modelName: '10T Pro', socName: 'Snapdragon 865' },
  { brandName: 'Xiaomi', modelName: '10T', socName: 'Snapdragon 865' },
  { brandName: 'Xiaomi', modelName: '10 Pro', socName: 'Snapdragon 865' },
  { brandName: 'Xiaomi', modelName: '10', socName: 'Snapdragon 865' },
  {
    brandName: 'Xiaomi',
    modelName: 'POCO F6 Pro',
    socName: 'Snapdragon 8 Gen 2',
  },
  { brandName: 'Xiaomi', modelName: 'POCO F6', socName: 'Snapdragon 8s Gen 3' },
  {
    brandName: 'Xiaomi',
    modelName: 'POCO F5 Pro',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'Xiaomi', modelName: 'POCO F5', socName: 'Snapdragon 7+ Gen 2' },
  {
    brandName: 'Xiaomi',
    modelName: 'POCO F4 GT',
    socName: 'Snapdragon 8 Gen 1',
  },
  { brandName: 'Xiaomi', modelName: 'POCO F4', socName: 'Snapdragon 870' },
  { brandName: 'Xiaomi', modelName: 'POCO F3', socName: 'Snapdragon 870' },
  { brandName: 'Xiaomi', modelName: 'POCO X6 Pro', socName: 'Dimensity 8300' },
  { brandName: 'Xiaomi', modelName: 'POCO X6', socName: 'Snapdragon 7s Gen 2' },
  { brandName: 'Xiaomi', modelName: 'POCO X5 Pro', socName: 'Snapdragon 778G' },
  { brandName: 'Xiaomi', modelName: 'POCO X5', socName: 'Snapdragon 695' },

  // Huawei
  { brandName: 'Huawei', modelName: 'Mate 60 Pro+', socName: 'Kirin 9000S' },
  { brandName: 'Huawei', modelName: 'Mate 60 Pro', socName: 'Kirin 9000S' },
  { brandName: 'Huawei', modelName: 'Mate 60', socName: 'Kirin 9000S' },
  { brandName: 'Huawei', modelName: 'P60 Pro', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Huawei', modelName: 'P60', socName: 'Snapdragon 8+ Gen 1' },
  {
    brandName: 'Huawei',
    modelName: 'Mate 50 Pro',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'Huawei', modelName: 'Mate 50', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Huawei', modelName: 'P50 Pro', socName: 'Kirin 9000' },
  { brandName: 'Huawei', modelName: 'P50', socName: 'Snapdragon 888' },
  { brandName: 'Huawei', modelName: 'Mate 40 Pro+', socName: 'Kirin 9000' },
  { brandName: 'Huawei', modelName: 'Mate 40 Pro', socName: 'Kirin 9000' },
  { brandName: 'Huawei', modelName: 'Mate 40', socName: 'Kirin 9000E' },
  { brandName: 'Huawei', modelName: 'P40 Pro+', socName: 'Kirin 990 5G' },
  { brandName: 'Huawei', modelName: 'P40 Pro', socName: 'Kirin 990 5G' },
  { brandName: 'Huawei', modelName: 'P40', socName: 'Kirin 990 5G' },
  { brandName: 'Huawei', modelName: 'Mate 30 Pro', socName: 'Kirin 990 5G' },
  { brandName: 'Huawei', modelName: 'Mate 30', socName: 'Kirin 990' },
  { brandName: 'Huawei', modelName: 'P30 Pro', socName: 'Kirin 980' },
  { brandName: 'Huawei', modelName: 'P30', socName: 'Kirin 980' },
  { brandName: 'Huawei', modelName: 'Mate 20 Pro', socName: 'Kirin 980' },
  { brandName: 'Huawei', modelName: 'Mate 20', socName: 'Kirin 980' },
  { brandName: 'Huawei', modelName: 'P20 Pro', socName: 'Kirin 970' },
  { brandName: 'Huawei', modelName: 'P20', socName: 'Kirin 970' },
  { brandName: 'Huawei', modelName: 'Mate 10 Pro', socName: 'Kirin 970' },
  { brandName: 'Huawei', modelName: 'Mate 10', socName: 'Kirin 970' },

  // Honor (spun off from Huawei)
  {
    brandName: 'Honor',
    modelName: 'Magic6 Pro',
    socName: 'Snapdragon 8 Gen 3',
  },
  { brandName: 'Honor', modelName: 'Magic6', socName: 'Snapdragon 8 Gen 3' },
  {
    brandName: 'Honor',
    modelName: 'Magic5 Pro',
    socName: 'Snapdragon 8 Gen 2',
  },
  { brandName: 'Honor', modelName: 'Magic5', socName: 'Snapdragon 8 Gen 2' },
  {
    brandName: 'Honor',
    modelName: 'Magic4 Pro',
    socName: 'Snapdragon 8 Gen 1',
  },
  { brandName: 'Honor', modelName: 'Magic4', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Honor', modelName: '90 Pro', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Honor', modelName: '90', socName: 'Snapdragon 7 Gen 1' },
  { brandName: 'Honor', modelName: '70 Pro', socName: 'Dimensity 8000' },
  { brandName: 'Honor', modelName: '70', socName: 'Snapdragon 778G+' },

  // Oppo
  { brandName: 'Oppo', modelName: 'Find X8 Pro', socName: 'Dimensity 9400' },
  { brandName: 'Oppo', modelName: 'Find X8', socName: 'Dimensity 9400' },
  {
    brandName: 'Oppo',
    modelName: 'Find X7 Ultra',
    socName: 'Snapdragon 8 Gen 3',
  },
  {
    brandName: 'Oppo',
    modelName: 'Find X7 Pro',
    socName: 'Snapdragon 8 Gen 3',
  },
  { brandName: 'Oppo', modelName: 'Find X7', socName: 'Dimensity 9300' },
  {
    brandName: 'Oppo',
    modelName: 'Find X6 Pro',
    socName: 'Snapdragon 8 Gen 2',
  },
  { brandName: 'Oppo', modelName: 'Find X6', socName: 'Dimensity 9200' },
  {
    brandName: 'Oppo',
    modelName: 'Find X5 Pro',
    socName: 'Snapdragon 8 Gen 1',
  },
  { brandName: 'Oppo', modelName: 'Find X5', socName: 'Snapdragon 888' },
  { brandName: 'Oppo', modelName: 'Find X3 Pro', socName: 'Snapdragon 888' },
  { brandName: 'Oppo', modelName: 'Find X3', socName: 'Snapdragon 870' },
  { brandName: 'Oppo', modelName: 'Find X2 Pro', socName: 'Snapdragon 865' },
  { brandName: 'Oppo', modelName: 'Find X2', socName: 'Snapdragon 865' },
  { brandName: 'Oppo', modelName: 'Reno12 Pro', socName: 'Dimensity 9200+' },
  { brandName: 'Oppo', modelName: 'Reno12', socName: 'Dimensity 8250' },
  {
    brandName: 'Oppo',
    modelName: 'Reno11 Pro',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'Oppo', modelName: 'Reno11', socName: 'Dimensity 8200' },
  {
    brandName: 'Oppo',
    modelName: 'Reno10 Pro+',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'Oppo', modelName: 'Reno10 Pro', socName: 'Snapdragon 778G' },
  { brandName: 'Oppo', modelName: 'Reno10', socName: 'Dimensity 7050' },

  // Vivo
  { brandName: 'Vivo', modelName: 'X200 Pro', socName: 'Dimensity 9400' },
  { brandName: 'Vivo', modelName: 'X200', socName: 'Dimensity 9400' },
  { brandName: 'Vivo', modelName: 'X100 Ultra', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'Vivo', modelName: 'X100 Pro', socName: 'Dimensity 9300' },
  { brandName: 'Vivo', modelName: 'X100', socName: 'Dimensity 9300' },
  { brandName: 'Vivo', modelName: 'X90 Pro+', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Vivo', modelName: 'X90 Pro', socName: 'Dimensity 9200' },
  { brandName: 'Vivo', modelName: 'X90', socName: 'Dimensity 9200' },
  { brandName: 'Vivo', modelName: 'X80 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Vivo', modelName: 'X80', socName: 'Dimensity 9000' },
  { brandName: 'Vivo', modelName: 'X70 Pro+', socName: 'Snapdragon 888+' },
  { brandName: 'Vivo', modelName: 'X70 Pro', socName: 'Dimensity 1200' },
  { brandName: 'Vivo', modelName: 'X70', socName: 'Dimensity 1200' },
  { brandName: 'Vivo', modelName: 'X60 Pro+', socName: 'Snapdragon 870' },
  { brandName: 'Vivo', modelName: 'X60 Pro', socName: 'Snapdragon 870' },
  { brandName: 'Vivo', modelName: 'X60', socName: 'Snapdragon 870' },
  { brandName: 'Vivo', modelName: 'V30 Pro', socName: 'Dimensity 8200' },
  { brandName: 'Vivo', modelName: 'V30', socName: 'Snapdragon 7 Gen 3' },
  { brandName: 'Vivo', modelName: 'V29 Pro', socName: 'Dimensity 8200' },
  { brandName: 'Vivo', modelName: 'V29', socName: 'Snapdragon 778G' },

  // Realme
  { brandName: 'Realme', modelName: 'GT 7 Pro', socName: 'Snapdragon 8 Elite' },
  { brandName: 'Realme', modelName: 'GT 6', socName: 'Snapdragon 8s Gen 3' },
  { brandName: 'Realme', modelName: 'GT 5 Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'Realme', modelName: 'GT 5', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Realme', modelName: 'GT Neo6', socName: 'Snapdragon 8s Gen 3' },
  { brandName: 'Realme', modelName: 'GT Neo5', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Realme', modelName: 'GT 3', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'Realme', modelName: 'GT 2 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Realme', modelName: 'GT 2', socName: 'Snapdragon 888' },
  { brandName: 'Realme', modelName: 'GT Master', socName: 'Snapdragon 778G' },
  { brandName: 'Realme', modelName: 'GT', socName: 'Snapdragon 888' },
  { brandName: 'Realme', modelName: '13 Pro+', socName: 'Snapdragon 7s Gen 2' },
  { brandName: 'Realme', modelName: '13 Pro', socName: 'Snapdragon 7s Gen 2' },
  { brandName: 'Realme', modelName: '12 Pro+', socName: 'Dimensity 7050' },
  { brandName: 'Realme', modelName: '12 Pro', socName: 'Snapdragon 6 Gen 1' },
  { brandName: 'Realme', modelName: '11 Pro+', socName: 'Dimensity 7050' },
  { brandName: 'Realme', modelName: '11 Pro', socName: 'Dimensity 7050' },

  // Nothing
  {
    brandName: 'Nothing',
    modelName: 'Phone (2a) Plus',
    socName: 'Dimensity 7350',
  },
  { brandName: 'Nothing', modelName: 'Phone (2a)', socName: 'Dimensity 7200' },
  {
    brandName: 'Nothing',
    modelName: 'Phone (2)',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'Nothing', modelName: 'Phone (1)', socName: 'Snapdragon 778G+' },

  // Sony
  {
    brandName: 'Sony',
    modelName: 'Xperia 1 VI',
    socName: 'Snapdragon 8 Gen 3',
  },
  {
    brandName: 'Sony',
    modelName: 'Xperia 10 VI',
    socName: 'Snapdragon 6 Gen 1',
  },
  { brandName: 'Sony', modelName: 'Xperia 1 V', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Sony', modelName: 'Xperia 5 V', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'Sony', modelName: 'Xperia 10 V', socName: 'Snapdragon 695' },
  {
    brandName: 'Sony',
    modelName: 'Xperia 1 IV',
    socName: 'Snapdragon 8 Gen 1',
  },
  {
    brandName: 'Sony',
    modelName: 'Xperia 5 IV',
    socName: 'Snapdragon 8 Gen 1',
  },
  { brandName: 'Sony', modelName: 'Xperia 10 IV', socName: 'Snapdragon 695' },
  { brandName: 'Sony', modelName: 'Xperia 1 III', socName: 'Snapdragon 888' },
  { brandName: 'Sony', modelName: 'Xperia 5 III', socName: 'Snapdragon 888' },
  { brandName: 'Sony', modelName: 'Xperia 10 III', socName: 'Snapdragon 690' },
  { brandName: 'Sony', modelName: 'Xperia 1 II', socName: 'Snapdragon 865' },
  { brandName: 'Sony', modelName: 'Xperia 5 II', socName: 'Snapdragon 865' },
  { brandName: 'Sony', modelName: 'Xperia 10 II', socName: 'Snapdragon 665' },

  // LG (discontinued but still relevant for past 10 years)
  { brandName: 'LG', modelName: 'Wing', socName: 'Snapdragon 765G' },
  { brandName: 'LG', modelName: 'V60 ThinQ', socName: 'Snapdragon 865' },
  { brandName: 'LG', modelName: 'V50 ThinQ', socName: 'Snapdragon 855' },
  { brandName: 'LG', modelName: 'G8 ThinQ', socName: 'Snapdragon 855' },
  { brandName: 'LG', modelName: 'V40 ThinQ', socName: 'Snapdragon 845' },
  { brandName: 'LG', modelName: 'G7 ThinQ', socName: 'Snapdragon 845' },
  { brandName: 'LG', modelName: 'V30', socName: 'Snapdragon 835' },
  { brandName: 'LG', modelName: 'G6', socName: 'Snapdragon 821' },
  { brandName: 'LG', modelName: 'V20', socName: 'Snapdragon 820' },
  { brandName: 'LG', modelName: 'G5', socName: 'Snapdragon 820' },

  // Additional OnePlus devices
  { brandName: 'OnePlus', modelName: 'Nord 4', socName: 'Snapdragon 7+ Gen 3' },
  {
    brandName: 'OnePlus',
    modelName: 'Nord CE4',
    socName: 'Snapdragon 7 Gen 3',
  },
  { brandName: 'OnePlus', modelName: 'Nord 3', socName: 'Dimensity 9000' },
  { brandName: 'OnePlus', modelName: 'Nord CE3', socName: 'Snapdragon 782G' },
  { brandName: 'OnePlus', modelName: 'Nord 2T', socName: 'Dimensity 1300' },
  { brandName: 'OnePlus', modelName: 'Nord 2', socName: 'Dimensity 1200' },
  { brandName: 'OnePlus', modelName: 'Nord CE2', socName: 'Dimensity 900' },
  { brandName: 'OnePlus', modelName: 'Nord CE', socName: 'Snapdragon 750G' },
  { brandName: 'OnePlus', modelName: 'Nord', socName: 'Snapdragon 765G' },
  { brandName: 'OnePlus', modelName: '9RT', socName: 'Snapdragon 888' },
  { brandName: 'OnePlus', modelName: '9', socName: 'Snapdragon 888' },
  { brandName: 'OnePlus', modelName: '8T', socName: 'Snapdragon 865' },
  { brandName: 'OnePlus', modelName: '8 Pro', socName: 'Snapdragon 865' },
  { brandName: 'OnePlus', modelName: '8', socName: 'Snapdragon 865' },
  { brandName: 'OnePlus', modelName: '7T Pro', socName: 'Snapdragon 855+' },
  { brandName: 'OnePlus', modelName: '7T', socName: 'Snapdragon 855+' },
  { brandName: 'OnePlus', modelName: '7 Pro', socName: 'Snapdragon 855' },
  { brandName: 'OnePlus', modelName: '7', socName: 'Snapdragon 855' },
  { brandName: 'OnePlus', modelName: '6T', socName: 'Snapdragon 845' },
  { brandName: 'OnePlus', modelName: '6', socName: 'Snapdragon 845' },

  // Additional Samsung devices
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S25 Ultra',
    socName: 'Snapdragon 8 Elite',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S25+',
    socName: 'Snapdragon 8 Elite',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S25',
    socName: 'Snapdragon 8 Elite',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S24+',
    socName: 'Snapdragon 8 Gen 3',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S23 Ultra',
    socName: 'Snapdragon 8 Gen 2',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S23+',
    socName: 'Snapdragon 8 Gen 2',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S22 Ultra',
    socName: 'Snapdragon 8 Gen 1',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S22+',
    socName: 'Snapdragon 8 Gen 1',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S21 Ultra',
    socName: 'Snapdragon 888',
  },
  { brandName: 'Samsung', modelName: 'Galaxy S21+', socName: 'Snapdragon 888' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy S20 Ultra',
    socName: 'Snapdragon 865',
  },
  { brandName: 'Samsung', modelName: 'Galaxy S20+', socName: 'Snapdragon 865' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Note 20 Ultra',
    socName: 'Snapdragon 865+',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Note 20',
    socName: 'Snapdragon 865',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Note 10+',
    socName: 'Snapdragon 855',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Note 10',
    socName: 'Snapdragon 855',
  },
  { brandName: 'Samsung', modelName: 'Galaxy S10+', socName: 'Snapdragon 855' },
  { brandName: 'Samsung', modelName: 'Galaxy S10', socName: 'Snapdragon 855' },
  { brandName: 'Samsung', modelName: 'Galaxy S10e', socName: 'Snapdragon 855' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Note 9',
    socName: 'Snapdragon 845',
  },
  { brandName: 'Samsung', modelName: 'Galaxy S9+', socName: 'Snapdragon 845' },
  { brandName: 'Samsung', modelName: 'Galaxy S9', socName: 'Snapdragon 845' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Fold6',
    socName: 'Snapdragon 8 Gen 3',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy Z Flip6',
    socName: 'Snapdragon 8 Gen 3',
  },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy A75 5G',
    socName: 'Snapdragon 6 Gen 1',
  },
  { brandName: 'Samsung', modelName: 'Galaxy A35 5G', socName: 'Exynos 1380' },
  { brandName: 'Samsung', modelName: 'Galaxy A25 5G', socName: 'Exynos 1280' },
  {
    brandName: 'Samsung',
    modelName: 'Galaxy A15 5G',
    socName: 'Dimensity 6100+',
  },

  // Additional PC Handhelds
  { brandName: 'Steam Deck', modelName: 'OLED', socName: 'AMD Custom APU' },
  { brandName: 'AYANEO', modelName: 'Slide', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'AYANEO', modelName: 'Flip KB', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'AYANEO', modelName: 'Flip DS', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'AYANEO', modelName: 'Geek 1S', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'AYANEO', modelName: 'Geek', socName: 'AMD Ryzen 7 6800U' },
  { brandName: 'GPD', modelName: 'Win Mini', socName: 'AMD Ryzen 7 8840U' },
  { brandName: 'GPD', modelName: 'Win 4 2024', socName: 'AMD Ryzen 7 8840U' },
  { brandName: 'GPD', modelName: 'Pocket 4', socName: 'AMD Ryzen 7 7840U' },
  {
    brandName: 'OneXPlayer',
    modelName: 'X1 Mini',
    socName: 'AMD Ryzen 7 8840U',
  },
  {
    brandName: 'OneXPlayer',
    modelName: 'X1',
    socName: 'Intel Core Ultra 7 155H',
  },
  { brandName: 'OneXPlayer', modelName: '2 Pro', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'OneXPlayer', modelName: '2', socName: 'AMD Ryzen 7 6800U' },
  {
    brandName: 'OneXPlayer',
    modelName: 'Mini Pro',
    socName: 'AMD Ryzen 7 6800U',
  },
  {
    brandName: 'OneXPlayer',
    modelName: 'Mini',
    socName: 'Intel Core i7-1260P',
  },
  { brandName: 'ONEXFLY', modelName: 'F1 Pro', socName: 'AMD Ryzen 7 8840U' },
  { brandName: 'ONEXFLY', modelName: 'F1', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'ROG', modelName: 'Ally X', socName: 'AMD Z1 Extreme' },
]

async function devicesSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding devices...')

  // Track created brands and get SoCs
  const brandMap = new Map<string, string>()
  const socMap = new Map<string, string>()

  // Load all SoCs into a map for quick lookup
  const socs = await prisma.soC.findMany()
  for (const soc of socs) {
    socMap.set(soc.name, soc.id)
  }

  for (const device of devices) {
    let brandId = brandMap.get(device.brandName)

    // Create brand if it doesn't exist yet
    if (!brandId) {
      const brand = await prisma.deviceBrand.upsert({
        where: { name: device.brandName },
        update: {},
        create: { name: device.brandName },
      })

      brandId = brand.id
      brandMap.set(device.brandName, brandId)
    }

    // Get SoC ID if specified
    const socId = device.socName ? socMap.get(device.socName) : undefined

    // Create the device with reference to brand and SoC if it doesn't exist
    await prisma.device.upsert({
      where: {
        brandId_modelName: {
          brandId,
          modelName: device.modelName,
        },
      },
      update: {
        socId: socId ?? null,
      },
      create: {
        brandId,
        modelName: device.modelName,
        socId: socId ?? null,
      },
    })
  }

  console.info('✅ Devices seeded successfully')
}

export default devicesSeeder
