# Emulator artwork

Icons are transparent 500 × 500 WebP files. Keep artwork attribution here when adding or replacing an icon. Review galleries, issue audits and verification results belong in the pull request.

## Existing artwork

The original 51 PNG icons came from the [existing asset collection](https://github.com/Producdevity/EmuReady/tree/da5e5cfb7d357b96d69cdfe2e3df10b02f2d2f91/public/assets/emulators). They were re-encoded as lossless WebP at effort 6, preserving visible pixels and alpha values. Their base filenames are unchanged.

Existing database records and cached clients may still request `.png` filenames. The rewrite in `next.config.ts` serves those requests from the corresponding WebP file. Catalog maintainers can retire it after persisted filenames and supported clients no longer need the old paths.

## Prepared project artwork

Sources were retrieved on 2026-11-12. Commit-pinned project assets are used where available. Marks remain owned by their respective projects.

| Output             | Source                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| droiddeck.webp     | [Project asset](https://raw.githubusercontent.com/Droid-Deck/DroidDeck/b1b6ab79317e6d752f3539863a214b1ca8cc65d8/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png)                      |
| hakux.webp         | [Project asset](https://raw.githubusercontent.com/rfandango/hakuX/a7cdb5a975e31730d488c47f6f10440b16c1e6f4/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png)                   |
| bannerhub.webp     | [Project asset](https://raw.githubusercontent.com/The412Banner/bannerhub-revanced/ebac0df01aaba9a3c05fae76fb9e7636fa9bdabc/patches/src/main/resources/bannerhub-icon/ic_launcher_foreground.png) |
| lemon.webp         | [Project asset](https://raw.githubusercontent.com/Ghael-V/Lemon-Project/b1482ae3d446dc17c5bd68e8ad41ca3ee7563c42/dist/lemon-logo.svg)                                                            |
| touchhle.webp      | [Project asset](https://raw.githubusercontent.com/touchHLE/touchHLE/ca1de89c578e79746f33c1332e28efd106c334ba/res/icon.png)                                                                       |
| wpr.webp           | [Project asset](https://raw.githubusercontent.com/8212369/WPR/8c52462b4e5af9fdd81e077f861b16135d1971b1/UI/WPR.UI.Android/Icon.png)                                                               |
| xendroid.webp      | [Project asset](https://raw.githubusercontent.com/rfandango/XenDroid/779680ade075d2d2a4c589c6a8d57a8e26c116c0/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp)                       |
| openmw-ds.webp     | [Project asset](https://raw.githubusercontent.com/Josh-Daniels/OpenMW-DS/857da9a372fce1a15102dd1148522ab5d76e2dcd/app/src/main/res/drawable/openmw_ds_logo.png)                                  |
| winnative.webp     | [Project asset](https://raw.githubusercontent.com/WinNative-Emu/WinNative/72d145bccff348f71b1c8baf90a180ccaa474464/app/src/standard/res/mipmap-xxxhdpi/ic_launcher_foreground.png)               |
| vita3k-plus.webp   | [Project asset](https://raw.githubusercontent.com/nckstwrt/Vita3K-Plus/10f932e93c724a8c66bebdb90a49149607262673/data/image/icon.png)                                                             |
| x1-box.webp        | [Project asset](https://raw.githubusercontent.com/WinDroidEmulation/x1-box/4eed5f7c840073e14bf46dcd49170a20b4d5d1d0/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp)         |
| astris.webp        | [Project asset](https://github.com/user-attachments/assets/3f4de9db-ce3f-4b5b-bcf6-5f344aba2f1b)                                                                                                 |
| rmg.webp           | [Project asset](https://raw.githubusercontent.com/Rosalie241/RMG/d16e25474dfc56787d82f02b0fb664def58b7f2a/Artwork/RMG.svg)                                                                       |
| lichii.webp        | [Project asset](https://raw.githubusercontent.com/zortos293/Lichii/88764523934ce327fe2d95e86a6e717cb345c451/dist/branding/lichii_icon.png)                                                       |
| melondualds.webp   | [Project asset](https://raw.githubusercontent.com/rafaelvcaetano/melonDS-android/aaf263d233e65c348d5830db32c593f8b7a8e4c9/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png)            |
| zomdroid.webp      | [Project asset](https://raw.githubusercontent.com/udarmolota/zomdroid/74991ab2399a52472bfb608e672ee8ac6f8f9939/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png)                       |
| watermelonds.webp  | [Project vector mark](https://github.com/SapphireRhodonite/WatermelonDS/blob/9bd6a0db59f944cda961e1df7f6e692eb6d4e65b/app/src/main/res/drawable/ic_watermelon_mark.xml)                          |
| armsx3.webp        | [Source artwork](https://github.com/ARMSX2/ARMSX3/blob/a2881a6069225d052131dd5c650796e2d9b792f1/assets/boot/armsx3-logo-source.png)                                                              |
| xendroid-plus.webp | [Project foreground](https://github.com/phforner0/Xendroid-Plus/blob/e4003ba664d6e625d49ace3aa7c74c38d748f61b/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp)                       |
| ax360e.webp        | [Project launcher](https://github.com/aenu1/ax360e/blob/1df063dfabd363bd082cff8501c8c78ee35851d4/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp)                                               |
| idtech4amm.webp    | [Project alternate icon](https://github.com/glKarin/com.n0n3m4.diii4a/blob/4a14e1ab186160394ed37dc8c204104bc725b218/idTech4Amm/src/main/res/drawable/icon_2025.png)                              |
| bizhawk.webp       | [Project ICO](https://github.com/TASEmulators/BizHawk/blob/d148601a4629c2c230e41647d7c94eee794011c7/src/BizHawk.Client.EmuHawk/images/logo.ico)                                                  |
| epsxe.webp         | [Official wordmark](https://www.epsxe.com/android/images/logo.png)                                                                                                                               |
| joiplay.webp       | [Official mark](https://joiplay.net/assets/images/icon.png)                                                                                                                                      |
| fin.webp           | [Developer's App Store listing](https://apps.apple.com/us/app/id6758910777)                                                                                                                      |
| manicemu.webp      | [Developer's App Store listing](https://apps.apple.com/us/app/id6743335790)                                                                                                                      |
| picpic.webp        | [Developer's Google Play listing](https://play.google.com/store/apps/details?id=com.sa_moo_rai.picpic)                                                                                           |
| x360mobile.webp    | [Project site logo](https://x360mobile.com/logo.png)                                                                                                                                             |
| nx.webp            | Local category wordmark: Helvetica Bold “NX”, #ef4444. NX is a collective category, not an upstream project identity.                                                                            |

Processing: use foreground layers where available, remove transparent padding, preserve aspect ratio, fit inside 460 × 460 with 20 px transparent margins, encode WebP at quality 90 with alpha quality 100 and strip metadata. Bitmap sources are conventionally resampled; no AI upscaling is used. The WatermelonDS vector was converted directly from Android paths. ARMSX3's “3” and Fin's fin were manually masked from their original artwork. White/dark launcher backgrounds were removed from HakuX, BannerHub, touchHLE and Astris; app tiles were removed from Manic EMU, aX360e, idTech4A++ and PicPic. Manic EMU and aX360e use their original brand colors for the isolated marks. Pixel art uses nearest-neighbor scaling. The Fritchii submission used Lichii's artwork; `lichii.webp` is shared.
