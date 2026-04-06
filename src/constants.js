export const SECTORS = [
  { v: 'construction', he: 'בנייה',    en: 'Construction' },
  { v: 'industry',     he: 'תעשייה',   en: 'Industry'      },
  { v: 'commerce',     he: 'מסחר',     en: 'Commerce'      },
  { v: 'agriculture',  he: 'חקלאות',   en: 'Agriculture'   },
  { v: 'restaurant',   he: 'מסעדנות',  en: 'F&B / Restaurant' },
  { v: 'hospitality',  he: 'מלונאות',   en: 'Hospitality'    },
  { v: 'other',        he: 'אחר',       en: 'Other'          },
]

export const PROFESSIONS = {
  construction: ['נגר קופר / Formwork Carpenter','רצף / Tiler','צבעי / Painter','טייח / Plasterer','ברזלן / Iron Worker','חשמלאי / Electrician','אינסטלטור / Plumber','מסגר / Metal Worker','גבס / Plasterboard','פועל כללי / General Laborer','אחר / Other'],
  industry:     ['רתך / Welder','מפעיל מכונות / Machine Operator','עובד מחסן / Warehouse Worker','עובד ייצור / Production Worker','מנהל מחסן / Warehouse Manager','אחר / Other'],
  commerce:     ['מוכרן / Salesperson','קופאי / Cashier','מחסנאי / Stock Clerk','שליח / Delivery','אחר / Other'],
  agriculture:  ['קוטף / Picker','עובד חקלאי / Farm Worker','נהג טרקטור / Tractor Driver','אחר / Other'],
  restaurant: ['טבח / Cook','שף / Chef','מלצר / Waiter','ברמן / Bartender','עובד מטבח / Kitchen Worker','מנהל משמרת / Shift Manager','מארח/ת / Host','כלבן / Dishwasher','אחר / Other'],
  hospitality: ['קבלן / Front Desk','פקיד קבלה / Receptionist','מנקה / Cleaner','עובד חדרים / Housekeeping','מנהל קומה / Floor Manager','קונסיירז / Concierge','עובד ספא / Spa Staff','אחר / Other'],
  other:        ['אחר / Other'],
}

export const PERMITS = [
  { v: 'b1_construction', l: 'B/1 בנייה'                        },
  { v: 'b1_industry',     l: 'B/1 תעשייה'                       },
  { v: 'b1_commerce',     l: 'B/1 מסחר'                         },
  { v: 'b1_agriculture',  l: 'B/1 חקלאות'                       },
  { v: 'b1_nursing',      l: 'B/1 סיעוד'                        },
  { v: 'tourist_b2',      l: 'תייר B/2'                         },
  { v: 'a5',              l: 'A/5'                               },
  { v: 'asylum',          l: 'בקשת מקלט / Asylum Seeker'        },
  { v: 'no_permit',       l: 'ללא היתר תקף'                     },
  { v: 'other',           l: 'אחר'                              },
]

export const COUNTRIES = [
  'סין / China','אוזבקיסטן / Uzbekistan','מולדובה / Moldova',
  'הודו / India','נפאל / Nepal','סרי לנקה / Sri Lanka',
  'פיליפינים / Philippines','תאילנד / Thailand','אוקראינה / Ukraine',
  'רומניה / Romania','בולגריה / Bulgaria','טורקיה / Turkey',
  'מצרים / Egypt','ירדן / Jordan','אריתריאה / Eritrea',
  'רואנדה / Rwanda','סודן / Sudan','אתיופיה / Ethiopia',
  'ניגריה / Nigeria','גאנה / Ghana','קוט דיוואר / Ivory Coast',
  'קמרון / Cameroon','אחר / Other',
]

export const CITIES = [
  'תל אביב-יפו / Tel Aviv-Jaffa','ירושלים / Jerusalem','חיפה / Haifa',
  'ראשון לציון / Rishon LeZion','פתח תקווה / Petah Tikva','אשדוד / Ashdod',
  'נתניה / Netanya','באר שבע / Beer Sheva','בני ברק / Bnei Brak',
  'חולון / Holon','רמת גן / Ramat Gan','אשקלון / Ashkelon',
  'רחובות / Rehovot','בת ים / Bat Yam','בית שמש / Beit Shemesh',
  'קריית גת / Kiryat Gat','נצרת / Nazareth','אילת / Eilat',
  'הרצליה / Herzliya','חדרה / Hadera','מודיעין / Modi\'in',
  'לוד / Lod','רמלה / Ramla','ראש העין / Rosh HaAyin',
  'כפר סבא / Kfar Saba','נס ציונה / Nes Ziona','רעננה / Ra\'anana',
  'נהריה / Nahariya','טבריה / Tiberias','עכו / Akko',
  'גבעתיים / Givatayim','קריית אונו / Kiryat Ono','אור יהודה / Or Yehuda',
  'אלעד / Elad','גבעת שמואל / Givat Shmuel','קריית מוצקין / Kiryat Motzkin',
  'קריית ביאליק / Kiryat Bialik','קריית ים / Kiryat Yam','קריית אתא / Kiryat Ata',
  'מגדל העמק / Migdal HaEmek','יבנה / Yavne','נתיבות / Netivot',
  'אופקים / Ofakim','שדרות / Sderot','דימונה / Dimona',
  'מעלה אדומים / Maale Adumim','אריאל / Ariel','בית שאן / Beit She\'an',
  'זכרון יעקב / Zichron Yaakov','עפולה / Afula','ערד / Arad',
  'טירת כרמל / Tirat Carmel','קריית שמונה / Kiryat Shmona',
  'יהוד-מונוסון / Yehud','אבן יהודה / Even Yehuda',
  'קלנסווה / Qalansawe','טייבה / Tayibe','אום אל-פחם / Umm al-Fahm',
  'נוף הגליל / Nof HaGalil','שפרעם / Shfaram','סחנין / Sakhnin',
  'ירכא / Yarka','אחר / Other',
]

export const STATUSES = [
  { v: 'new',        he: 'חדש',    bg: '#E0F2FE', fg: '#0369A1' },
  { v: 'contacted',  he: 'בקשר',   bg: '#FEF9C3', fg: '#854D0E' },
  { v: 'in_process', he: 'בטיפול', bg: '#FFEDD5', fg: '#9A3412' },
  { v: 'placed',     he: 'הוצב',   bg: '#DCFCE7', fg: '#166534' },
  { v: 'rejected',   he: 'נדחה',   bg: '#FEE2E2', fg: '#991B1B' },
]

export const DOC_FIELDS = [
  { k: 'passport', he: 'דרכון / ת"ז',    en: 'Passport / ID'          },
  { k: 'permit',   he: 'היתר עבודה',     en: 'Work Permit / Visa'     },
  { k: 'license',  he: 'רישיון מקצועי',  en: 'Professional License'   },
  { k: 'other',    he: 'מסמך נוסף',      en: 'Additional Document'    },
]

export const EMPTY_FORM = {
  fullNameHe:'', fullNameEn:'', phone:'', email:'', dob:'',
  country:'', city:'', sector:'', profession:'', experience:'',
  permitType:'', permitNumber:'', permitExpiry:'', entryDate:'',
  currentEmployer:'', lastEmployer:'',
}
