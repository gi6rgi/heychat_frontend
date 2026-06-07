/**
 * UI string dictionaries. English is the source of truth; `de` is typed as
 * `Messages` (= typeof en) so a missing or extra key fails the build.
 *
 * Scenario content (titles, goals, loglines…) is NOT here — it arrives from
 * the backend already localized (?lang=). This module covers only the chrome:
 * buttons, labels, statuses, aria texts and the create-flow option cards.
 */

export const en = {
  brand: "HeyScenes",
  titles: {
    default: "HeyScenes · step into a scene with your AI companion",
    scene: (title: string) => `${title} · HeyScenes`,
    live: (character: string) => `${character} · Live`,
    debrief: (character: string) => `${character} · Debrief`,
    create: "Create your scene · HeyScenes",
  },
  common: {
    scenarios: "Scenarios",
    home: "Home",
    back: "Back",
    goal: "Goal",
    close: "Close",
    untitled: "Untitled",
  },
  /** Display labels for the library filter chips; keys are the API values. */
  genres: {
    ALL: "ALL",
    YOURS: "YOURS",
    DATING: "DATING",
    EVERYDAY: "EVERYDAY",
    WORK: "WORK",
    CHAOS: "CHAOS",
  } as Record<string, string>,
  library: {
    filterByGenre: "Filter scenarios by genre",
    filterScenes: "Filter scenes",
    loadingScenes: "Loading scenes",
    yoursEmpty: "Nothing of yours on the wall yet. Create your first scene below.",
    createYourOwn: "Create your own",
    newTag: "NEW",
    unlock: "UNLOCK",
    removing: "REMOVING…",
    deleteQuestion: "DELETE?",
    yes: "YES",
    no: "NO",
    paintingTag: "PAINTING…",
    yoursTag: "YOURS",
    customTag: "CUSTOM",
    deleteScene: (title: string) => `Delete ${title}`,
    posterAlt: (title: string) => `${title} poster`,
  },
  help: {
    button: "How it works",
    dialogLabel: "How HeyScenes works",
    kicker: "How it works",
    heading: "Step into a scene and talk your way through it.",
    steps: [
      "Pick a scene from the wall, or create your own.",
      "Press start, allow your mic, and just talk. Your partner answers out loud, in real time.",
      "End the scene for a debrief on what landed and what to work on.",
    ],
  },
  detail: {
    startScene: "Start Scene",
    paintingScene: "Painting the scene…",
  },
  live: {
    connecting: "CONNECTING…",
    retry: "RETRY",
    debrief: "DEBRIEF",
    end: "END",
    sceneSet: "The scene is set.",
    goalOpen: "Goal",
    goalSuccess: "Goal · ✓ Accomplished",
    goalFailure: "Goal · ✗ Failed",
    missionAccomplished: "Mission accomplished",
    missionFailed: "Mission failed",
    debriefAction: "Debrief",
    deviceSettings: "Audio device settings",
    microphone: "Microphone",
    speaker: "Speaker",
    micFallback: (n: number) => `Microphone ${n}`,
    speakerFallback: (n: number) => `Speaker ${n}`,
    speakerUnsupported: "Speaker choice isn't supported in this browser.",
    mute: "Mute microphone",
    unmute: "Unmute microphone",
    sessionLimit:
      "Time flies! This session reached its 10-minute limit. The conversation is saved to your history.",
    connectionLost: "Connection lost",
    micError: "Could not access the microphone",
  },
  debrief: {
    kicker: "Debrief",
    home: "HOME",
    reviewLines: [
      "Rolling the tape back…",
      "Reading your lines…",
      "Marking the moments that mattered…",
      "Writing the coach's note…",
    ],
    fallbackHeadline: "The scene is in the can.",
    lineCount: (n: number) => `${n} lines`,
    nothingOnTape:
      "Nothing on tape. Not a single line was spoken, so there is nothing to review.",
    coachLostNotes: "The coach lost their notes. Run the review again?",
    retryReview: "Retry review",
    verdict: "The Verdict",
    breakdown: "Breakdown",
    whatLanded: "What Landed",
    roughNight: "Rough night. The next run is where it turns.",
    whatToWorkOn: "What To Work On",
    sayItBetter: "Say It Better",
    retryScene: "Retry Scene",
    homeAction: "Home",
  },
  create: {
    whoTitle: "Who are they?",
    whoPlaceholder:
      "Calm, smart, a little playful. Someone I can talk to after work.",
    whereTitle: "Where are you?",
    wherePlaceholder: "A rainy bus stop at 2am. A starship bridge. Anywhere.",
    winTitle: "What's the win?",
    winPlaceholder: "Get the afterparty invite. Win the argument kindly.",
    continue: "Continue",
    backToOptions: "Back to options",
    skip: "Skip",
    writeYourOwn: "Write your own",
    writeYourOwnDescription: "Put it in your own words instead.",
    workingLines: [
      "Reading your brief…",
      "Imagining someone for you…",
      "Painting the scene…",
      "Writing their story…",
    ],
    dailyLimitKicker: "Daily limit",
    dailyLimitMessage: "Daily limit reached. Come back tomorrow.",
    browseScenes: "Browse scenes",
    genericError: "Something went wrong while creating your companion.",
    tryAgain: "Try again",
    startScene: "Start scene",
    paintingScene: "Painting the scene…",
    paintingPoster: "Painting the poster…",
  },
  /** Create-flow option cards, keyed by VibeCard id. */
  cards: {
    "warm-listener": {
      title: "Warm Listener",
      description: "Calm, present, easy to open up to.",
    },
    "playful-spark": {
      title: "Playful Spark",
      description: "Light teasing, fun, spontaneous energy.",
    },
    "deep-mind": {
      title: "Deep Mind",
      description: "Reflective questions, emotional depth.",
    },
    "mysterious-muse": {
      title: "Mysterious Muse",
      description: "Intriguing, cinematic, story-driven.",
    },
    "confident-coach": {
      title: "Confident Coach",
      description: "Motivating, direct, moves you forward.",
    },
    "rooftop-bar": {
      title: "Rooftop bar at sunset",
      description: "City lights, warm breeze, cold drinks.",
    },
    "night-train": {
      title: "Mountain sleeper train",
      description: "A rocking carriage, a stranger across.",
    },
    "rainy-cafe": {
      title: "Rainy day coffee shop",
      description: "Steamed-up windows, slow jazz, no rush.",
    },
    "beach-bonfire": {
      title: "Midnight beach bonfire",
      description: "Crackling fire, blankets, falling stars.",
    },
    "starship-lounge": {
      title: "Spaceship lounge",
      description: "Humming engines, nebulas past the glass.",
    },
    "get-number": {
      title: "Get their phone number",
      description: "Charm your way to those ten digits.",
    },
    "second-date": {
      title: "Land a second date",
      description: "Make tonight earn a next time.",
    },
    "better-price": {
      title: "Negotiate a better price",
      description: "Hold your ground, walk out with a deal.",
    },
    "firm-no": {
      title: "Say no without apologizing",
      description: "Set the boundary and keep it warm.",
    },
    "three-laughs": {
      title: "Make them laugh",
      description: "A real laugh. Corny counts.",
    },
  } as Record<string, { title: string; description: string }>,
};

export type Messages = typeof en;

export const de: Messages = {
  brand: "HeyScenes",
  titles: {
    default: "HeyScenes · tritt in eine Szene mit deinem KI-Partner ein",
    scene: (title) => `${title} · HeyScenes`,
    live: (character) => `${character} · Live`,
    debrief: (character) => `${character} · Auswertung`,
    create: "Erstelle deine Szene · HeyScenes",
  },
  common: {
    scenarios: "Szenarien",
    home: "Start",
    back: "Zurück",
    goal: "Ziel",
    close: "Schließen",
    untitled: "Ohne Titel",
  },
  genres: {
    ALL: "ALLE",
    YOURS: "DEINE",
    DATING: "DATING",
    EVERYDAY: "ALLTAG",
    WORK: "ARBEIT",
    CHAOS: "CHAOS",
  },
  library: {
    filterByGenre: "Szenarien nach Genre filtern",
    filterScenes: "Szenen filtern",
    loadingScenes: "Szenen werden geladen",
    yoursEmpty:
      "Noch nichts von dir an der Wand. Erstelle unten deine erste Szene.",
    createYourOwn: "Erstelle deine eigene",
    newTag: "NEU",
    unlock: "FREISCHALTEN",
    removing: "ENTFERNE…",
    deleteQuestion: "LÖSCHEN?",
    yes: "JA",
    no: "NEIN",
    paintingTag: "WIRD GEMALT…",
    yoursTag: "DEINE",
    customTag: "EIGENE",
    deleteScene: (title) => `${title} löschen`,
    posterAlt: (title) => `Poster zu ${title}`,
  },
  help: {
    button: "So funktioniert's",
    dialogLabel: "So funktioniert HeyScenes",
    kicker: "So funktioniert's",
    heading: "Tritt in eine Szene ein und rede dich durch.",
    steps: [
      "Wähl eine Szene von der Wand — oder erstelle deine eigene.",
      "Drück auf Start, erlaube dein Mikrofon und sprich einfach. Dein Gegenüber antwortet laut, in Echtzeit.",
      "Beende die Szene für eine Auswertung: was gut lief und woran du arbeiten kannst.",
    ],
  },
  detail: {
    startScene: "Szene starten",
    paintingScene: "Die Szene wird gemalt…",
  },
  live: {
    connecting: "VERBINDE…",
    retry: "ERNEUT VERSUCHEN",
    debrief: "AUSWERTUNG",
    end: "BEENDEN",
    sceneSet: "Die Szene ist bereit.",
    goalOpen: "Ziel",
    goalSuccess: "Ziel · ✓ Erreicht",
    goalFailure: "Ziel · ✗ Verfehlt",
    missionAccomplished: "Mission erfüllt",
    missionFailed: "Mission gescheitert",
    debriefAction: "Auswertung",
    deviceSettings: "Audiogeräte-Einstellungen",
    microphone: "Mikrofon",
    speaker: "Lautsprecher",
    micFallback: (n) => `Mikrofon ${n}`,
    speakerFallback: (n) => `Lautsprecher ${n}`,
    speakerUnsupported:
      "Die Lautsprecherauswahl wird in diesem Browser nicht unterstützt.",
    mute: "Mikrofon stummschalten",
    unmute: "Stummschaltung aufheben",
    sessionLimit:
      "Wie die Zeit vergeht! Diese Sitzung hat ihr 10-Minuten-Limit erreicht. Das Gespräch ist in deinem Verlauf gespeichert.",
    connectionLost: "Verbindung verloren",
    micError: "Kein Zugriff auf das Mikrofon",
  },
  debrief: {
    kicker: "Auswertung",
    home: "START",
    reviewLines: [
      "Wir spulen das Band zurück…",
      "Wir lesen deine Zeilen…",
      "Wir markieren die Momente, die zählten…",
      "Die Notiz des Coaches wird geschrieben…",
    ],
    fallbackHeadline: "Die Szene ist im Kasten.",
    lineCount: (n) => `${n} Zeilen`,
    nothingOnTape:
      "Nichts auf dem Band. Kein einziges Wort wurde gesprochen, also gibt es nichts auszuwerten.",
    coachLostNotes:
      "Der Coach hat seine Notizen verloren. Auswertung noch einmal starten?",
    retryReview: "Auswertung wiederholen",
    verdict: "Das Urteil",
    breakdown: "Aufschlüsselung",
    whatLanded: "Was gut lief",
    roughNight: "Harte Nacht. Beim nächsten Durchlauf dreht sich das Blatt.",
    whatToWorkOn: "Woran du arbeiten kannst",
    sayItBetter: "Sag es besser",
    retryScene: "Szene wiederholen",
    homeAction: "Startseite",
  },
  create: {
    whoTitle: "Wer ist die Person?",
    whoPlaceholder:
      "Ruhig, klug, ein bisschen verspielt. Jemand, mit dem ich nach der Arbeit reden kann.",
    whereTitle: "Wo seid ihr?",
    wherePlaceholder:
      "Eine verregnete Bushaltestelle um 2 Uhr nachts. Eine Raumschiffbrücke. Irgendwo.",
    winTitle: "Was ist der Sieg?",
    winPlaceholder:
      "Die Einladung zur Afterparty bekommen. Den Streit freundlich gewinnen.",
    continue: "Weiter",
    backToOptions: "Zurück zu den Optionen",
    skip: "Überspringen",
    writeYourOwn: "Schreib es selbst",
    writeYourOwnDescription: "Sag es stattdessen in deinen eigenen Worten.",
    workingLines: [
      "Wir lesen dein Briefing…",
      "Wir stellen uns jemanden für dich vor…",
      "Die Szene wird gemalt…",
      "Ihre Geschichte wird geschrieben…",
    ],
    dailyLimitKicker: "Tageslimit",
    dailyLimitMessage: "Tageslimit erreicht. Komm morgen wieder.",
    browseScenes: "Szenen ansehen",
    genericError: "Beim Erstellen deiner Szene ist etwas schiefgelaufen.",
    tryAgain: "Nochmal versuchen",
    startScene: "Szene starten",
    paintingScene: "Die Szene wird gemalt…",
    paintingPoster: "Das Poster wird gemalt…",
  },
  cards: {
    "warm-listener": {
      title: "Warme Zuhörerin",
      description: "Ruhig, präsent, leicht, sich zu öffnen.",
    },
    "playful-spark": {
      title: "Verspielter Funke",
      description: "Leichtes Necken, Spaß, spontane Energie.",
    },
    "deep-mind": {
      title: "Tiefer Geist",
      description: "Nachdenkliche Fragen, emotionale Tiefe.",
    },
    "mysterious-muse": {
      title: "Geheimnisvolle Muse",
      description: "Faszinierend, filmisch, von Geschichten getragen.",
    },
    "confident-coach": {
      title: "Selbstbewusster Coach",
      description: "Motivierend, direkt, bringt dich voran.",
    },
    "rooftop-bar": {
      title: "Rooftop-Bar bei Sonnenuntergang",
      description: "Stadtlichter, warme Brise, kalte Drinks.",
    },
    "night-train": {
      title: "Nachtzug durch die Berge",
      description: "Ein schaukelnder Waggon, eine Fremde gegenüber.",
    },
    "rainy-cafe": {
      title: "Café am Regentag",
      description: "Beschlagene Fenster, langsamer Jazz, keine Eile.",
    },
    "beach-bonfire": {
      title: "Mitternächtliches Lagerfeuer am Strand",
      description: "Knisterndes Feuer, Decken, Sternschnuppen.",
    },
    "starship-lounge": {
      title: "Raumschiff-Lounge",
      description: "Summende Triebwerke, Nebel hinter dem Glas.",
    },
    "get-number": {
      title: "Ihre Nummer bekommen",
      description: "Charm dich zu diesen Ziffern.",
    },
    "second-date": {
      title: "Ein zweites Date klarmachen",
      description: "Lass den Abend ein nächstes Mal verdienen.",
    },
    "better-price": {
      title: "Einen besseren Preis verhandeln",
      description: "Bleib standhaft, geh mit einem Deal raus.",
    },
    "firm-no": {
      title: "Nein sagen, ohne dich zu entschuldigen",
      description: "Setz die Grenze und bleib dabei warm.",
    },
    "three-laughs": {
      title: "Bring sie zum Lachen",
      description: "Ein echtes Lachen. Kalauer zählen.",
    },
  },
};
