# Service imagery

Illustrative images, not photos of Alora's own work. Each service uses a different person or
subject in dark-studio light, from Pexels and Unsplash (both free for commercial use, no
attribution required; credited anyway).

Built by `node scripts/imagery/build.mjs` from `scripts/imagery/manifest.json`: Apple Vision
person or subject matte, backdrop un-mixed from edge pixels, framing per family (tight beauty
crop for makeup, wider for hair, subject-fit for nails), fades that follow each photo's own
edges, content-hashed file names. The slug to file map is written to
`prisma/service-images.json` and read by the seed. To use the salon's own photos, point a
manifest `source` at a local file and rebuild.

| Service | Source | Photo |
|---|---|---|
| `wig-basic-wash` | Pexels | 17320165 |
| `wig-moisture-treatment` | Pexels | 36720078 |
| `wig-keratin-treatment` | Pexels | 33559315 |
| `wig-customization-basic` | Pexels | 30198184 |
| `wig-customization-advanced` | Pexels | 2331539 |
| `wig-customization-full` | Pexels | 16298178 |
| `wig-customization-glueless` | Pexels | 10305432 |
| `wig-styling` | Pexels | 11037450 |
| `wig-colouring` | Pexels | 32767443 |
| `wig-frontal-replacement` | Pexels | 8106142 |
| `nails-gelx-short` | Unsplash | photo-1677739424301-ba2cdf1631e9 |
| `nails-gelx-medium` | Unsplash | photo-1633955726992-2b7c0d2d2a69 |
| `nails-gelx-long` | Unsplash | photo-1690749072212-373daf1d58ca |
| `nails-gelx-refill` | Unsplash | photo-1663229050022-10896e8ea58a |
| `nails-soakoff-alora` | Unsplash | photo-1706040285481-28cc91e92c36 |
| `nails-soakoff-other` | Pexels | 7755285 |
| `nails-repair` | Unsplash | photo-1663229049340-fcd5212a1b13 |
| `makeup-soft-glam` | Pexels | 3973709 |
| `makeup-full-glam` | Pexels | 23158360 |
| `makeup-bridal` | Pexels | 6512263 |
| `makeup-bridesmaid` | Pexels | 7255250 |
| `makeup-strip-lashes` | Pexels | 19742921 |
| `makeup-travel` | Pexels | 11041338 |
| `matric-hair-makeup` | Pexels | 31610244 |
