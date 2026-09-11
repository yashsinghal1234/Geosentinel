import type { SupportedLanguage, AlertLevel } from '../types';

export interface LanguagePack {
  appName: string;
  publicSafetyTitle: string;
  statusLevels: Record<AlertLevel, {
    badge: string;
    label: string;
    action: string;
  }>;
  timeToCritical: string;
  imSafeBtn: string;
  needHelpBtn: string;
  safeAssembly: string;
  evacuationRoutes: string;
  emergencyGuideTitle: string;
  actionItems: string[];
  reportCrackBtn: string;
  callEmergency: string;
  offlineEdgeBadge: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, LanguagePack> = {
  en: {
    appName: 'GeoSentinel Public Safety',
    publicSafetyTitle: 'Village Ground Safety Status',
    statusLevels: {
      1: {
        badge: 'Level 1 · Normal',
        label: 'Ground is Stable & Safe',
        action: 'Normal daily activities permitted. All underground sensors report safe rock stability.',
      },
      2: {
        badge: 'Level 2 · Monitor',
        label: 'Low Movement Observed',
        action: 'Minor strata settling detected. No evacuation required. Stay tuned to village broadcasts.',
      },
      3: {
        badge: 'Level 3 · Advisory',
        label: 'Heavy Rain / Fissures Expanding',
        action: 'Avoid riverbank slopes and old mine galleries. Keep emergency kits and cattle ready.',
      },
      4: {
        badge: 'Level 4 · Warning',
        label: 'High Subsidence Risk - Prepare Evacuation',
        action: 'Move elderly, children, and essential belongings to designated high-ground community shelters.',
      },
      5: {
        badge: 'Level 5 · Evacuate Now',
        label: 'IMMEDIATE EVACUATION REQUIRED',
        action: 'DANGER OF CATASTROPHIC SLOPE COLLAPSE! Move immediately to High Ridge Community Center AP-01.',
      },
    },
    timeToCritical: 'Estimated Time to Critical Shear Event',
    imSafeBtn: "I'm Safe (Click to Register)",
    needHelpBtn: 'I Need Immediate Rescue',
    safeAssembly: 'Nearest High-Ground Assembly Shelters',
    evacuationRoutes: 'Direct Path: Follow High Ridge Road away from Sector 4 pit slope.',
    emergencyGuideTitle: 'What To Do Right Now',
    actionItems: [
      'Turn off household LPG gas cylinders and main power breakers before departing.',
      'Carry emergency drinking water, identity Aadhaar cards, and essential medications.',
      'Do not enter low-lying cracked courtyards or abandoned mine incline shafts.',
      'Help neighbors who require mobility assistance to reach Shelter AP-01.',
    ],
    reportCrackBtn: 'Report a Ground Crack in Your Village',
    callEmergency: 'Helpline: 1077 (District Disaster Command)',
    offlineEdgeBadge: 'Served directly from Local Solar Edge Gateway GW-01',
  },

  hi: {
    appName: 'जियो-सेंटिनल जन सुरक्षा',
    publicSafetyTitle: 'ग्राम भू-सतह सुरक्षा स्थिति',
    statusLevels: {
      1: {
        badge: 'स्तर 1 · सामान्य',
        label: 'जमीन पूरी तरह सुरक्षित और स्थिर है',
        action: 'दैनिक कार्य सामान्य रूप से जारी रखें। भूमिगत सेंसर स्थिर स्थिति दर्शा रहे हैं।',
      },
      2: {
        badge: 'स्तर 2 · निगरानी',
        label: 'मामूली हलचल दर्ज की गई',
        action: 'हल्का धंसान देखा गया है। घबराने की जरूरत नहीं है, गांव के सूचना बोर्ड पर नजर रखें।',
      },
      3: {
        badge: 'स्तर 3 · चेतावनी परामर्श',
        label: 'भारी बारिश / दरारें चौड़ी हो रही हैं',
        action: 'नदी किनारे के ढलानों और पुरानी खदान दीर्घाओं से दूर रहें। जरूरी सामान तैयार रखें।',
      },
      4: {
        badge: 'स्तर 4 · गंभीर चेतावनी',
        label: 'भू-धंसान का खतरा - सुरक्षित स्थान पर जाएं',
        action: 'बुजुर्गों और बच्चों को तत्काल ऊंचे सामुदायिक आश्रय स्थल (शेल्टर AP-01) में ले जाएं।',
      },
      5: {
        badge: 'स्तर 5 · तुरंत खाली करें',
        label: 'आपातकालीन खतरा: तत्काल सुरक्षित स्थान पर जाएं!',
        action: 'भू-स्खलन का गंभीर खतरा! तुरंत हाई रिज कम्युनिटी हॉल AP-01 की ओर प्रस्थान करें।',
      },
    },
    timeToCritical: 'संभावित खतरे का अनुमानित समय',
    imSafeBtn: 'मैं सुरक्षित हूँ (दर्ज करें)',
    needHelpBtn: 'मुझे तुरंत मदद चाहिए (SOS)',
    safeAssembly: 'निकटतम सुरक्षित राहत केंद्र',
    evacuationRoutes: 'निकास मार्ग: सेक्टर 4 खदान ढलान से दूर हाई रिज रोड का अनुसरण करें।',
    emergencyGuideTitle: 'तत्काल क्या करें?',
    actionItems: [
      'घर से निकलने से पहले गैस सिलेंडर और बिजली का मुख्य स्विच बंद करें।',
      'पीने का पानी, आधार कार्ड और जरूरी दवाएं साथ रखें।',
      'दरार वाले आंगनों और पुरानी खदान सुरंगों के पास न जाएं।',
      'बुजुर्गों और बच्चों को सुरक्षित राहत केंद्र तक पहुंचाने में मदद करें।',
    ],
    reportCrackBtn: 'जमीन में आई दरार की फोटो भेजें',
    callEmergency: 'आपातकालीन हेल्पलाइन: 1077 (जिला आपदा केंद्र)',
    offlineEdgeBadge: 'स्थानीय सौर एज गेटवे GW-01 से लाइव प्रसारित',
  },

  bn: {
    appName: 'জিও-সেন্টিনেল জননিরাপত্তা',
    publicSafetyTitle: 'গ্রামের ভূ-পৃষ্ঠ নিরাপত্তা স্থিতি',
    statusLevels: {
      1: {
        badge: 'স্তর ১ · স্বাভাবিক',
        label: 'মাটি সম্পূর্ণ নিরাপদ ও স্থিতিশীল',
        action: 'দৈনন্দিন কাজকর্ম স্বাভাবিকভাবে চলতে পারে। সেন্সরগুলি নিরাপদ ভূগর্ভস্থ অবস্থা নির্দেশ করছে।',
      },
      2: {
        badge: 'স্তর ২ · পর্যবেক্ষণ',
        label: 'সামান্য ভূগর্ভস্থ গতিবিধি লক্ষ্য করা গেছে',
        action: 'কোনো স্থানান্তরের প্রয়োজন নেই। গ্রামের মাইক এবং নোটিশ বোর্ডের নির্দেশ অনুসরণ করুন।',
      },
      3: {
        badge: 'স্তর ৩ · সতর্কতা পরামর্শ',
        label: 'ভারী বৃষ্টি / ফাটল বৃদ্ধি পাচ্ছে',
        action: 'নদীর তীরের ঢালু জমি এবং পুরানো খনির সুড়ঙ্গ থেকে দূরে থাকুন। শুকনো খাবার ও জল মজুত রাখুন।',
      },
      4: {
        badge: 'স্তর ৪ · উচ্চ সতর্কতা',
        label: 'ভূমিধসের ঝুঁকি - আশ্রয়ে যাওয়ার প্রস্তুতি নিন',
        action: 'বৃদ্ধ এবং শিশুদের অবিলম্বে উঁচু কমিউনিটি শেল্টারে (AP-01) স্থানান্তরিত করুন।',
      },
      5: {
        badge: 'স্তর ৫ · অবিলম্বে খালি করুন',
        label: 'জরুরী বিপদ: এখনই এলাকা ত্যাগ করুন!',
        action: 'মারাত্মক ভূমিধসের আশঙ্কা! এখনই হাই রিজ কমিউনিটি হলে আশ্রয় নিন।',
      },
    },
    timeToCritical: 'সম্ভাব্য বিপদের আনুমানিক সময়',
    imSafeBtn: 'আমি নিরাপদ আছি (ক্লিক করুন)',
    needHelpBtn: 'আমার জরুরী সাহায্য প্রয়োজন (SOS)',
    safeAssembly: 'নিকটতম নিরাপদ আশ্রয়স্থল',
    evacuationRoutes: 'নিরাপদ পথ: সেক্টর ৪ খনি এলাকা থেকে দূরে হাই রিজ রাস্তা ধরুন।',
    emergencyGuideTitle: 'এখনই কি করণীয়?',
    actionItems: [
      'ঘর ছাড়ার আগে রান্নার গ্যাস এবং বিদ্যুতের মেইন সুইচ বন্ধ করুন।',
      'পানীয় জল, পরিচয়পত্র এবং প্রয়োজনীয় ওষুধ সাথে নিন।',
      'ফাটলযুক্ত উঠোন বা পুরানো খনির মুখে যাবেন না।',
    ],
    reportCrackBtn: 'মাটিতে ফাটলের ছবি পাঠান',
    callEmergency: 'জরুরী হেল্পলাইন: ১০৭৭',
    offlineEdgeBadge: 'স্থানীয় সোলার এজ গেটওয়ে থেকে সরাসরি সম্প্রচারিত',
  },

  or: {
    appName: 'ଜିଓ-ସେଣ୍ଟିନେଲ୍ ଜନସୁରକ୍ଷା',
    publicSafetyTitle: 'ଗ୍ରାମ ଭୂ-ସ୍ଥିରତା ସୁରକ୍ଷା ସୂଚନା',
    statusLevels: {
      1: {
        badge: 'ସ୍ତର ୧ · ସ୍ୱାଭାବିକ',
        label: 'ଜମି ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ ଅଛି',
        action: 'ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟ ଜାରି ରଖନ୍ତୁ। ଭୂତଳ ସେନ୍ସର ସ୍ୱାଭାବିକ ସ୍ଥିତି ଦର୍ଶାଉଛି।',
      },
      2: {
        badge: 'ସ୍ତର ୨ · ନଜର ରଖନ୍ତୁ',
        label: 'ମାମୁଲି ଭୂ-ଗତି ଦେଖାଯାଇଛି',
        action: 'ଭୟଭୀତ ହେବାର ଆବଶ୍ୟକତା ନାହିଁ। ଗ୍ରାମ ସୂଚନା ଉପରେ ନଜର ରଖନ୍ତୁ।',
      },
      3: {
        badge: 'ସ୍ତର ୩ · ସତର୍କ ସୂଚନା',
        label: 'ଭାରୀ ବର୍ଷା / ଫାଟ ବଢୁଛି',
        action: 'ଖଣି କୂଳ ଏବଂ ପୁରୁଣା ସୁଡ଼ଙ୍ଗ ପାଖରୁ ଦୂରେଇ ରୁହନ୍ତୁ। ଜରୁରୀ ସାମଗ୍ରୀ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।',
      },
      4: {
        badge: 'ସ୍ତର ୪ · ଉଚ୍ଚ ସତର୍କତା',
        label: 'ଭୂ-ଧସିବା ଆଶଙ୍କା - ସୁରକ୍ଷିତ ସ୍ଥାନକୁ ଯାଆନ୍ତୁ',
        action: 'ବୟସ୍କ ଓ ପିଲାମାନଙ୍କୁ ତୁରନ୍ତ ଉଚ୍ଚ ଆଶ୍ରୟସ୍ଥଳକୁ (AP-01) ନେଇଯାଆନ୍ତୁ।',
      },
      5: {
        badge: 'ସ୍ତର ୫ · ତୁରନ୍ତ ଖାଲି କରନ୍ତୁ',
        label: 'ଜରୁରୀ ବିପଦ: ତୁରନ୍ତ ସୁରକ୍ଷିତ ସ୍ଥାନକୁ ଯାଆନ୍ତୁ!',
        action: 'ମାଟି ଧସିବାର ଭୟଙ୍କର ବିପଦ! ତୁରନ୍ତ ହାଇ ରିଜ୍ କମ୍ୟୁନିଟି ହଲ୍ AP-01 କୁ ଯାଆନ୍ତୁ।',
      },
    },
    timeToCritical: 'ସମ୍ଭାବ୍ୟ ବିପଦର ଆନୁମାନିକ ସମୟ',
    imSafeBtn: 'ମୁଁ ସୁରକ୍ଷିତ ଅଛି (ଦର୍ଜ କରନ୍ତୁ)',
    needHelpBtn: 'ମୋତେ ତୁରନ୍ତ ସାହାଯ୍ୟ ଦରକାର (SOS)',
    safeAssembly: 'ନିକଟତମ ସୁରକ୍ଷିତ ଆଶ୍ରୟସ୍ଥଳ',
    evacuationRoutes: 'ନିରାପଦ ରାସ୍ତା: ହାଇ ରିଜ୍ ରୋଡ୍ ଦେଇ ଆଶ୍ରୟସ୍ଥଳକୁ ଯାଆନ୍ତୁ।',
    emergencyGuideTitle: 'ତୁରନ୍ତ କଣ କରିବେ?',
    actionItems: [
      'ଘର ଛାଡିବା ପୂର୍ବରୁ ଗ୍ୟାସ ସିଲିଣ୍ଡର ଓ ବିଦ୍ୟୁତ ବନ୍ଦ କରନ୍ତୁ।',
      'ପିଇବା ପାଣି ଓ ଆବଶ୍ୟକ ଔଷଧ ସାଙ୍ଗରେ ନିଅନ୍ତୁ।',
    ],
    reportCrackBtn: 'ଫାଟର ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ',
    callEmergency: 'ହେଲ୍ପଲାଇନ୍: ୧୦୭୭',
    offlineEdgeBadge: 'ସ୍ଥାନୀୟ ସୌର ଗେଟୱେରୁ ସିଧାସଳଖ ସୂଚନା',
  },

  sat: {
    appName: 'ᱡᱤᱭᱳ-ᱥᱮᱱᱴᱤᱱᱮᱞ ᱦᱚᱲ ᱨᱩᱠᱷᱤᱭᱟᱹ',
    publicSafetyTitle: 'ᱟᱹᱛᱩ ᱦᱟᱥᱟ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱷᱟᱠ',
    statusLevels: {
      1: {
        badge: 'ᱛᱷᱟᱠ ᱑ · ᱴᱷᱤᱠ',
        label: 'ᱦᱟᱥᱟ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱜᱮᱭᱟ',
        action: 'ᱥᱟᱱᱟᱢ ᱠᱟᱹᱢᱤ ᱪᱟᱞᱟᱣ ᱤᱫᱤ ᱢᱮ। ᱥᱮᱱᱥᱚᱨ ᱠᱚ ᱴᱷᱤᱠ ᱜᱮ ᱢᱮᱱᱟᱜ-ᱟ।',
      },
      2: {
        badge: 'ᱛᱷᱟᱠ ᱒ · ᱧᱮᱞ',
        label: 'ᱠᱟᱹᱴᱤᱡ ᱦᱟᱥᱟ ᱞᱟᱲᱟᱣ ᱧᱮᱞ ᱟᱠᱟᱱᱟ',
        action: 'ᱵᱚᱛᱚᱨᱚᱜ ᱨᱮᱱᱟᱜ ᱪᱮᱫ ᱦᱚᱸ ᱵᱟᱹᱱᱩᱜ-ᱟ। ᱟᱹᱛᱩ ᱠᱷᱚᱵᱚᱨ ᱟᱸᱡᱚᱢ ᱢᱮ।',
      },
      3: {
        badge: 'ᱛᱷᱟᱠ ᱓ · ᱪᱮᱛᱟᱣᱱᱤ',
        label: 'ᱡᱟᱹᱯᱩᱫ ᱛᱮ ᱪᱮᱛᱟᱱ ᱦᱟᱥᱟ ᱯᱷᱟᱴᱟᱣᱜ ᱠᱟᱱᱟ',
        action: 'ᱢᱟᱨᱮ ᱠᱷᱟᱫᱟᱱ ᱠᱷᱚᱱ ᱥᱟᱦᱟ ᱨᱮ ᱛᱟᱦᱮᱸᱱ ᱢᱮ। ᱫᱟᱜ ᱟᱨ ᱡᱚᱢᱟᱜ ᱥᱟᱯᱲᱟᱣ ᱢᱮ।',
      },
      4: {
        badge: 'ᱛᱷᱟᱠ ᱔ · ᱢᱟᱨᱟᱝ ᱪᱮᱛᱟᱣᱱᱤ',
        label: 'ᱦᱟᱥᱟ ᱫᱷᱟᱥᱟᱣ ᱵᱚᱛᱚᱨ - ᱪᱮᱛᱟᱱ ᱡᱟᱭᱜᱟ ᱪᱟᱞᱟᱜ ᱢᱮ',
        action: 'ᱦᱟᱲᱟᱢ-ᱵᱩᱰᱷᱤ ᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ ᱩᱥᱩᱞ ᱟᱥᱨᱟ (AP-01) ᱤᱫᱤ ᱠᱚᱯᱮ।',
      },
      5: {
        badge: 'ᱛᱷᱟᱠ ᱕ · ᱞᱚᱜᱚᱱ ᱚᱪᱚᱜᱚᱜ ᱢᱮ',
        label: 'ᱟᱹᱰᱤ ᱢᱟᱨᱟᱝ ᱵᱚᱛᱚᱨ! ᱩᱥᱩᱞ ᱡᱟᱭᱜᱟ ᱫᱟᱹᱲ ᱯᱮ!',
        action: 'ᱞᱚᱜᱚᱱ ᱦᱟᱭ ᱨᱤᱡ ᱠᱚᱢᱤᱣᱱᱤᱴᱤ ᱦᱚᱞ AP-01 ᱛᱮ ᱪᱟᱞᱟᱣ ᱯᱮ।',
      },
    },
    timeToCritical: 'ᱵᱚᱛᱚᱨ ᱦᱤᱡᱩᱜ ᱨᱮᱱᱟᱜ ᱚᱠᱛᱚ',
    imSafeBtn: 'ᱤᱧ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱢᱮᱱᱟᱹᱧᱟ (ᱚᱞ ᱢᱮ)',
    needHelpBtn: 'ᱜᱚᱲᱚ ᱞᱟᱹᱠᱛᱤᱜ ᱠᱟᱱᱟ (SOS)',
    safeAssembly: 'ᱥᱩᱨ ᱨᱮᱱᱟᱜ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱟᱥᱨᱟ',
    evacuationRoutes: 'ᱩᱥᱩᱞ ᱰᱟᱦᱟᱨ ᱛᱮ ᱥᱮᱱᱚᱜ ᱯᱮ।',
    emergencyGuideTitle: 'ᱱᱤᱛᱚᱜ ᱪᱮᱫ ᱮᱢ ᱪᱤᱠᱟᱹᱭᱟ?',
    actionItems: [
      'ᱜᱮᱥ ᱟᱨ ᱵᱤᱡᱽᱞᱤ ᱵᱚᱸᱫᱽ ᱠᱟᱛᱮ ᱚᱸᱰᱚᱠᱚᱜ ᱢᱮ।',
      'ᱧᱩ ᱫᱟᱜ ᱟᱨ ᱨᱟᱱ ᱥᱟᱶᱛᱮ ᱤᱫᱤ ᱢᱮ।',
    ],
    reportCrackBtn: 'ᱦᱟᱥᱟ ᱯᱷᱟᱴᱟᱣ ᱨᱮᱱᱟᱜ ᱯᱷᱚᱴᱚ ᱠᱩᱞ ᱢᱮ',
    callEmergency: 'ᱜᱚᱲᱚ ᱱᱚᱢᱵᱚᱨ: ᱑᱐᱗᱗',
    offlineEdgeBadge: 'ᱥᱳᱞᱟᱨ ᱮᱡ ᱜᱮᱴᱣᱮ ᱠᱷᱚᱱ ᱥᱚᱡᱷᱮ ᱩᱪᱷᱟᱹᱱ',
  },
};
