# Sheet music — MusicXML files

The Sheet Music view in the app uses **OpenSheetMusicDisplay** to render
MusicXML files as live SVG notation with a tempo-controlled playback cursor.

## Where to put files

For Mozart Requiem, drop one file per movement into this folder, named by the
movement's number and Latin name (lowercase, hyphenated):

```
public/scores/mozart-requiem/
├── i-introitus.musicxml
├── ii-kyrie.musicxml
├── iii-dies-irae.musicxml
├── iv-tuba-mirum.musicxml
├── v-rex-tremendae.musicxml
├── vi-recordare.musicxml
├── vii-confutatis.musicxml
├── viii-lacrimosa.musicxml
├── ix-domine-jesu.musicxml
├── x-hostias.musicxml
├── xi-sanctus.musicxml
├── xii-benedictus.musicxml
├── xiii-agnus-dei.musicxml
├── xiv-lux-aeterna.musicxml
└── xv-cum-sanctis-tuis.musicxml
```

The app auto-derives this path from the movement's number + Latin name. If you
want a different file name or location, override it per movement by setting
the `musicXmlUrl` field on the movement object in `content/works/*.json`.

## Where to download Mozart Requiem MusicXML (free, public domain)

| Source | URL | Notes |
|---|---|---|
| **CPDL** | https://www.cpdl.org/wiki/index.php/Wolfgang_Amadeus_Mozart#Sacred_works | Choral Public Domain Library — multiple full SATB+piano editions, often direct MusicXML downloads |
| **IMSLP** | https://imslp.org/wiki/Requiem,_K.626_(Mozart,_Wolfgang_Amadeus) | Look for "MusicXML" or "XML" in the file list, or use the typeset editions |
| **MuseScore.com** | https://musescore.com/sheetmusic?text=mozart+requiem | Community uploads; quality varies. Right-click → "Download" → MusicXML format |

For a quick test before downloading the full Requiem, you can grab any small
public-domain MusicXML file (e.g. a Bach chorale) from MuseScore.com, rename it
to `i-introitus.musicxml`, drop it into `mozart-requiem/`, and the player will
render it.

## File format notes

- Both **`.musicxml`** (compressed, modern) and **`.xml`** (uncompressed) are
  accepted.
- **`.mxl`** is the zipped/compressed variant — OSMD supports those too;
  rename to `.mxl` and it works.
- Sibelius / Finale / MuseScore / Dorico all export MusicXML from their File →
  Export menu.

## Copyright

Public domain only. Mozart (d. 1791) — fine. Beethoven, Bach, Handel, all
Classical/Baroque/Renaissance — fine. **Samuel Barber (d. 1981)** and other
20th-century composers are typically still under copyright; their MusicXML
must be obtained through a paid digital edition from the publisher, not
downloaded for free.
