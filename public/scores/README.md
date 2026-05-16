# Sheet music — MusicXML files

The Sheet Music view uses OpenSheetMusicDisplay to render `.musicxml` / `.xml` / `.mxl` files
as live notation with a tempo-controlled cursor.

## Where to drop files

Naming pattern (auto-detected by the app):

```
public/scores/mozart-requiem/
├── i-introitus.musicxml
├── ii-kyrie.musicxml
├── iii-dies-irae.musicxml
└── ... (one per movement)
```

To override the file path for a movement, set the `musicXmlUrl` field on the
movement object in `content/works/*.json`.

## Where to get Mozart Requiem MusicXML (free, public domain)

CPDL and IMSLP both host community-typeset MusicXML editions of the Requiem.
Both sites block automated downloads, so you need to click through manually:

- **CPDL**: https://www.cpdl.org/wiki/index.php/Requiem,_KV_626_(Wolfgang_Amadeus_Mozart) — look under each movement for an editor offering "XML" or "MusicXML" alongside the PDF
- **IMSLP**: https://imslp.org/wiki/Requiem_in_D_minor,_K.626_(Mozart,_Wolfgang_Amadeus) — filter the file list by "XML" file extension
- **MuseScore.com** community uploads: free with account, right-click a score → Download → MusicXML

## Image → MusicXML (OMR) if you only have a scan

If you have PDF or image scans and no MusicXML version:
- **Audiveris** (free, open source, Java) — best free OMR; install locally, drag PDF in, exports MusicXML
- **PhotoScore** (paid, Neuratron) — much higher accuracy, often used by publishers
- **Soundslice** (subscription, web) — good OMR + interactive playback in one tool

OMR quality drops on dense choral scores; expect 10-30 min of manual cleanup per page even with the good tools.

## Copyright note

- Mozart Requiem (1791): firmly public domain. Free to use.
- Samuel Barber's *Agnus Dei* / Adagio for Strings: still under copyright until ~2051; MusicXML must come from a purchased digital edition.
- Most 20th-century composers: same — need legal source.
