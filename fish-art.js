const SPECIMEN_SHEETS = [
  "멸치|정어리|망둑어|고등어|붕어|전갱이|청어|전어|빙어|송사리|피라미|미꾸라지|도루묵|학공치|볼락|황어|밴댕이|양미리|갈치|가자미",
  "오징어|잉어|광어|방어|우럭|농어|쥐치|노래미|숭어|꽃돔|꽁치|삼치|아귀|무지개송어|메기|참돔|연어|복어|문어|흰동가리",
  "쏠배감펭|나비고기|해마|가오리|쥐돔|돌돔|만새기|곰치|갑오징어|쏘가리|황새치|개복치|철갑상어|돛새치|귀상어|쥐가오리|독가시치|청새리상어|바라쿠다|투명머리물고기",
  "잎해룡|톱상어|실러캔스|참다랑어|산갈치|고래상어|대왕오징어|백상아리|대왕산갈치|황금도미|심해아귀|나폴레옹피시|심해의 연봉협상왕 고등어|은하계 무패 갈치장군|우주최강 퇴근문어|조석을 결재하는 복부장|별빛야근 거절한 해마법사|파도타는 망토가오리|벼락배송 번개장어|왕관 쓴 둥근달복어"
];
const specimenIndex = new Map();
SPECIMEN_SHEETS.forEach((names, sheet) => {
  names.split("|").forEach((name, cell) => specimenIndex.set(name, {sheet, cell}));
});

function fishArt(name, silhouette=false) {
  const art = specimenIndex.get(name);
  if (!art) return icon("fish");
  const x = (art.cell % 4) * 320;
  const y = Math.floor(art.cell / 4) * 218;
  const classes = silhouette ? "fish-plate undiscovered" : "fish-plate";
  return '<svg class="'+classes+'" viewBox="0 0 320 218" aria-hidden="true">'+
    '<svg width="320" height="218" viewBox="'+x+' '+y+' 320 218" overflow="hidden">'+
    '<image href="assets/fish-'+(art.sheet+1)+'.webp" width="1280" height="1090"/></svg></svg>';
}
