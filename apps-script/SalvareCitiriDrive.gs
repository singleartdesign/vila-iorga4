// Vila Iorga 4: salveaza pozele citirilor din aplicatie in Google Drive
// Structura: Iorga 4 / Apa / AAAA / LL.AAAA (luna facturii = luna consumului + 1)
// Instalare: script.google.com -> Proiect nou -> lipeste codul -> pune parola de mai jos ->
//   Implementare -> Implementare noua -> Tip: Aplicatie web -> Executa ca: Eu -> Acces: Oricine -> Implementeaza
//   Copiaza URL-ul aplicatiei web si trimite-l lui Claude.

const APA_FOLDER_ID = '1ua2gKWB17jVh3NWAGGC3Ge86D9lBC8Sf'
const SECRET = 'PAROLA_SECRETA' // pune aici parola primita de la Claude (nu o publica in repo)

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents)
    if (d.secret !== SECRET) return raspuns({ ok: false, error: 'secret gresit' })
    const apa = DriveApp.getFolderById(APA_FOLDER_ID)
    const folderAn = gasesteSauCreeaza(apa, String(d.an_folder))
    const folderLuna = gasesteSauCreeaza(folderAn, d.folder)
    const vechi = folderLuna.getFilesByName(d.nume)
    while (vechi.hasNext()) vechi.next().setTrashed(true)
    const blob = Utilities.newBlob(Utilities.base64Decode(d.data), d.mimeType || 'image/jpeg', d.nume)
    const fisier = folderLuna.createFile(blob)
    return raspuns({ ok: true, fileId: fisier.getId(), folderId: folderLuna.getId() })
  } catch (err) {
    return raspuns({ ok: false, error: String(err) })
  }
}

function gasesteSauCreeaza(parinte, nume) {
  const it = parinte.getFoldersByName(nume)
  return it.hasNext() ? it.next() : parinte.createFolder(nume)
}

function raspuns(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
