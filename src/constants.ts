export const workTypes = ['Markarbete', 'Bergspräckning', 'Dränering', 'Poolgrävning', 'Grovplanering', 'Finplanering', 'Uppfart / infart', 'Stenläggning', 'Mur / trappa', 'L-stöd', 'VA-arbete', 'El & fiber', 'Trädfällning', 'Stubbfräsning', 'Annat']
export const excavatorSizes = ['Upp till 2 ton', 'Cirka 3,5 ton', 'Cirka 5–6 ton', 'Cirka 8 ton', 'Cirka 14–15 ton', 'Annan storlek']
export const equipmentTypes = ['Bergborrmaskin', 'Luftkompressor', 'Darda', 'Borrvagn', 'Bilmaskin', 'Bergsåg', 'Motorkap', 'Stenkap', 'Våtdammsugare', 'Länspump', 'Laser', 'Släp', 'Annat']
export const materialTypes = ['Bergkross 0/32', 'Bergkross 0/16', 'Makadam 8/16', 'Makadam 16/32', 'Stenmjöl', 'Sättsand', 'Fogsand', 'Jord', 'Gräsmattejord', 'Natursingel', 'Marksten', 'Kantsten', 'Annat']
export const massTypes = ['Jord', 'Lera', 'Schaktmassor', 'Berg', 'Spräckt berg', 'Betong', 'Asfalt', 'Blandmassor', 'Ris och trä', 'Annat']
export const otherMaterialTypes = ['N2-markduk', 'N3-markduk', 'Dräneringsrör', 'Dagvattenrör', 'Skyddsrör', 'Dräneringsbrunn', 'Dagvattenbrunn', 'Isolering', 'Gräsfrö', 'Annat']
export const units = ['Ton', 'kg', 'Kubikmeter', 'Kvadratmeter', 'Löpmeter', 'Styck', 'BigBag', 'Lass']
export const deliveryMethods = ['Massorna tippas', 'Flak ställs av med lastväxlare', 'Urlastning med grävmaskin', 'BigBag', 'Annat']
export const conditions = [
  ['access', 'Är framkomligheten till arbetsplatsen begränsad?'],
  ['machineLimits', 'Finns det begränsningar för maskinernas storlek eller vikt?'],
  ['utilities', 'Finns det ledningar eller kablar i arbetsområdet?'],
  ['utilitySurvey', 'Behövs ledningsanvisning?'],
  ['difficultArea', 'Är marken eller arbetsområdet svårtillgängligt?'],
  ['traffic', 'Behövs trafikanordning eller avspärrning?'],
  ['permits', 'Behövs tillstånd?'],
  ['visibleRock', 'Finns det synligt berg?'],
  ['hiddenRock', 'Finns det risk för berg under mark?'],
  ['subcontractor', 'Behövs extern underentreprenör?'],
  ['rental', 'Behövs hyrmaskin eller hyrutrustning?'],
  ['customerRequests', 'Finns det särskilda önskemål från kunden?'],
  ['surroundings', 'Finns det risk att omkringliggande byggnader eller anläggningar påverkas?'],
  ['timeFactors', 'Finns det andra förhållanden som kan påverka tidsåtgången?'],
] as const
