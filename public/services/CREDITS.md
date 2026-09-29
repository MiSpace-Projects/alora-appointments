# Service imagery

Illustrative images, not photos of Alora's own work. All 24 come from one studio session
(same model, backdrop and light) by the same photographer on Pexels (Pexels licence: free
for commercial use, no attribution required; credited anyway). Photo IDs 36288118 to
36288158, https://www.pexels.com/photo/<id>/

Built by `node scripts/imagery/build.mjs` from `scripts/imagery/manifest.json`:
Apple Vision person matte and face box, backdrop un-mixed from edge pixels, every portrait
framed to the same face size and eye line, fades that follow each photo's own edges, and a
capped skin-tone normalisation toward the group median. To use the salon's own photos,
point a manifest entry's `source` at a local file and rebuild; the same treatment applies.
