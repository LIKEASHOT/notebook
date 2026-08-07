import { defineStore } from 'pinia'
import { loadStorage, saveStorage } from '../utils/storage.js'

// ============================================================
//  从 1(1).doc 导出的最新数据（共 30 页，469 个单词及忘节点）
// ============================================================
const INITIAL_PAGES = [
  {
    "id": 1,
    "words": [
      {
        "text": "used to",
        "circles": 0
      },
      {
        "text": "expert",
        "circles": 0
      },
      {
        "text": "adventure",
        "circles": 0
      },
      {
        "text": "through",
        "circles": 0
      },
      {
        "text": "fruitful",
        "circles": 0
      },
      {
        "text": "cost",
        "circles": 0
      },
      {
        "text": "challenging",
        "circles": 2
      },
      {
        "text": "have done",
        "circles": 0
      },
      {
        "text": "repair",
        "circles": 0
      },
      {
        "text": "still",
        "circles": 0
      },
      {
        "text": "different",
        "circles": 0
      },
      {
        "text": "difficult",
        "circles": 0
      },
      {
        "text": "recognise",
        "circles": 0
      },
      {
        "text": "include",
        "circles": 2
      },
      {
        "text": "ocean",
        "circles": 0
      },
      {
        "text": "view",
        "circles": 0
      }
    ]
  },
  {
    "id": 2,
    "words": [
      {
        "text": "locate",
        "circles": 0
      },
      {
        "text": "block",
        "circles": 0
      },
      {
        "text": "resident",
        "circles": 0
      },
      {
        "text": "follow",
        "circles": 2
      },
      {
        "text": "tradition",
        "circles": 0
      },
      {
        "text": "against",
        "circles": 0
      },
      {
        "text": "reveal",
        "circles": 4
      },
      {
        "text": "area",
        "circles": 0
      },
      {
        "text": "design",
        "circles": 0
      },
      {
        "text": "well-being",
        "circles": 0
      },
      {
        "text": "connect",
        "circles": 0
      },
      {
        "text": "mental",
        "circles": 0
      },
      {
        "text": "preference",
        "circles": 0
      },
      {
        "text": "make sth. adj",
        "circles": 0
      },
      {
        "text": "demand",
        "circles": 0
      },
      {
        "text": "-ness",
        "circles": 0
      }
    ]
  },
  {
    "id": 3,
    "words": [
      {
        "text": "sense",
        "circles": 1
      },
      {
        "text": "list",
        "circles": 0
      },
      {
        "text": "lack",
        "circles": 0
      },
      {
        "text": "play on",
        "circles": 0
      },
      {
        "text": "while",
        "circles": 0
      },
      {
        "text": "pattern",
        "circles": 0
      },
      {
        "text": "consider",
        "circles": 0
      },
      {
        "text": "create",
        "circles": 4
      },
      {
        "text": "act",
        "circles": 0
      },
      {
        "text": "practical",
        "circles": 0
      },
      {
        "text": "melt",
        "circles": 0
      },
      {
        "text": "stress",
        "circles": 3
      },
      {
        "text": "emotion",
        "circles": 0
      },
      {
        "text": "impact",
        "circles": 0
      },
      {
        "text": "convince",
        "circles": 0
      },
      {
        "text": "since",
        "circles": 0
      }
    ]
  },
  {
    "id": 4,
    "words": [
      {
        "text": "energy",
        "circles": 2
      },
      {
        "text": "new energy",
        "circles": 0
      },
      {
        "text": "vehicle",
        "circles": 4
      },
      {
        "text": "establish",
        "circles": 0
      },
      {
        "text": "expert",
        "circles": 1
      },
      {
        "text": "battery",
        "circles": 0
      },
      {
        "text": "industry",
        "circles": 0
      },
      {
        "text": "reflect",
        "circles": 0
      },
      {
        "text": "electric",
        "circles": 0
      },
      {
        "text": "take advantage of",
        "circles": 0
      },
      {
        "text": "focus",
        "circles": 0
      },
      {
        "text": "truly",
        "circles": 0
      },
      {
        "text": "produce",
        "circles": 0
      },
      {
        "text": "production",
        "circles": 0
      },
      {
        "text": "commitment",
        "circles": 0
      },
      {
        "text": "sustain",
        "circles": 0
      }
    ]
  },
  {
    "id": 5,
    "words": [
      {
        "text": "sustainable development",
        "circles": 0
      },
      {
        "text": "front",
        "circles": 0
      },
      {
        "text": "fore-",
        "circles": 0
      },
      {
        "text": "revolution",
        "circles": 0
      },
      {
        "text": "invest",
        "circles": 0
      },
      {
        "text": "research",
        "circles": 0
      },
      {
        "text": "introduce",
        "circles": 0
      },
      {
        "text": "aim",
        "circles": 0
      },
      {
        "text": "performance",
        "circles": 0
      },
      {
        "text": "battery",
        "circles": 0
      },
      {
        "text": "so far",
        "circles": 0
      },
      {
        "text": "concern",
        "circles": 0
      },
      {
        "text": "major",
        "circles": 0
      },
      {
        "text": "market",
        "circles": 0
      },
      {
        "text": "present",
        "circles": 1
      },
      {
        "text": "presence",
        "circles": 0
      }
    ]
  },
  {
    "id": 6,
    "words": [
      {
        "text": "symbol",
        "circles": 0
      },
      {
        "text": "rise",
        "circles": 0
      },
      {
        "text": "rise-rose-risen",
        "circles": 0
      },
      {
        "text": "global",
        "circles": 0
      },
      {
        "text": "industry",
        "circles": 0
      },
      {
        "text": "used to do",
        "circles": 0
      },
      {
        "text": "be used to doing",
        "circles": 1
      },
      {
        "text": "be used to do",
        "circles": 0
      },
      {
        "text": "convince",
        "circles": 0
      },
      {
        "text": "shine-shone",
        "circles": 0
      },
      {
        "text": "connection",
        "circles": 0
      },
      {
        "text": "independence",
        "circles": 0
      },
      {
        "text": "work out",
        "circles": 0
      },
      {
        "text": "figure out",
        "circles": 3
      },
      {
        "text": "resist",
        "circles": 0
      },
      {
        "text": "release",
        "circles": 0
      }
    ]
  },
  {
    "id": 7,
    "words": [
      {
        "text": "work",
        "circles": 1
      },
      {
        "text": "source",
        "circles": 0
      },
      {
        "text": "milestone",
        "circles": 0
      },
      {
        "text": "towards",
        "circles": 0
      },
      {
        "text": "turn",
        "circles": 0
      },
      {
        "text": "head",
        "circles": 0
      },
      {
        "text": "divide",
        "circles": 0
      },
      {
        "text": "affect",
        "circles": 0
      },
      {
        "text": "desire",
        "circles": 2
      },
      {
        "text": "long for",
        "circles": 4
      },
      {
        "text": "pleasure",
        "circles": 1
      },
      {
        "text": "leave-left-left",
        "circles": 1
      },
      {
        "text": "replace",
        "circles": 0
      },
      {
        "text": "kill",
        "circles": 0
      },
      {
        "text": "offer",
        "circles": 0
      },
      {
        "text": "height",
        "circles": 0
      }
    ]
  },
  {
    "id": 8,
    "words": [
      {
        "text": "against",
        "circles": 2
      },
      {
        "text": "dull",
        "circles": 0
      },
      {
        "text": "even",
        "circles": 0
      },
      {
        "text": "match",
        "circles": 0
      },
      {
        "text": "calm",
        "circles": 0
      },
      {
        "text": "please",
        "circles": 0
      },
      {
        "text": "form",
        "circles": 0
      },
      {
        "text": "soil",
        "circles": 0
      },
      {
        "text": "close",
        "circles": 2
      },
      {
        "text": "provide",
        "circles": 1
      },
      {
        "text": "especially",
        "circles": 0
      },
      {
        "text": "protect",
        "circles": 0
      },
      {
        "text": "benefit",
        "circles": 0
      },
      {
        "text": "possible",
        "circles": 1
      },
      {
        "text": "possibility",
        "circles": 1
      },
      {
        "text": "beauty",
        "circles": 0
      }
    ]
  },
  {
    "id": 9,
    "words": [
      {
        "text": "bio-",
        "circles": 0
      },
      {
        "text": "ground",
        "circles": 0
      },
      {
        "text": "exist",
        "circles": 0
      },
      {
        "text": "treasure",
        "circles": 0
      },
      {
        "text": "ancient",
        "circles": 0
      },
      {
        "text": "be honored as",
        "circles": 0
      },
      {
        "text": "a series of",
        "circles": 0
      },
      {
        "text": "carry",
        "circles": 4
      },
      {
        "text": "closely",
        "circles": 0
      },
      {
        "text": "offer sth. to do sth.",
        "circles": 0
      },
      {
        "text": "envy + doing",
        "circles": 0
      },
      {
        "text": "resolution",
        "circles": 0
      },
      {
        "text": "sink",
        "circles": 0
      },
      {
        "text": "fail",
        "circles": 0
      },
      {
        "text": "fail to do",
        "circles": 0
      },
      {
        "text": "conflict",
        "circles": 0
      }
    ]
  },
  {
    "id": 10,
    "words": [
      {
        "text": "law",
        "circles": 0
      },
      {
        "text": "pass",
        "circles": 0
      },
      {
        "text": "identify as",
        "circles": 0
      },
      {
        "text": "circle",
        "circles": 0
      },
      {
        "text": "turn out to be",
        "circles": 0
      },
      {
        "text": "domestic",
        "circles": 0
      },
      {
        "text": "contribute",
        "circles": 0
      },
      {
        "text": "factor",
        "circles": 0
      },
      {
        "text": "worthwhile",
        "circles": 0
      },
      {
        "text": "raise",
        "circles": 0
      },
      {
        "text": "move",
        "circles": 2
      },
      {
        "text": "condition",
        "circles": 0
      },
      {
        "text": "climate",
        "circles": 0
      },
      {
        "text": "goods",
        "circles": 0
      },
      {
        "text": "meat",
        "circles": 0
      },
      {
        "text": "continue",
        "circles": 0
      }
    ]
  },
  {
    "id": 11,
    "words": [
      {
        "text": "entirely",
        "circles": 0
      },
      {
        "text": "rely on",
        "circles": 5
      },
      {
        "text": "gather",
        "circles": 3
      },
      {
        "text": "likely",
        "circles": 3
      },
      {
        "text": "farm",
        "circles": 0
      },
      {
        "text": "rather than",
        "circles": 1
      },
      {
        "text": "material",
        "circles": 0
      },
      {
        "text": "local",
        "circles": 0
      },
      {
        "text": "insight",
        "circles": 0
      },
      {
        "text": "promote",
        "circles": 0
      },
      {
        "text": "site",
        "circles": 0
      },
      {
        "text": "experience",
        "circles": 0
      },
      {
        "text": "spirit",
        "circles": 2
      },
      {
        "text": "warn",
        "circles": 0
      },
      {
        "text": "require",
        "circles": 0
      },
      {
        "text": "train",
        "circles": 2
      }
    ]
  },
  {
    "id": 12,
    "words": [
      {
        "text": "have to",
        "circles": 1
      },
      {
        "text": "wealth",
        "circles": 2
      },
      {
        "text": "labour",
        "circles": 0
      },
      {
        "text": "wisdom",
        "circles": 0
      },
      {
        "text": "hardly",
        "circles": 0
      },
      {
        "text": "flow",
        "circles": 0
      },
      {
        "text": "bug",
        "circles": 0
      },
      {
        "text": "skin",
        "circles": 0
      },
      {
        "text": "bite-bit-bitten",
        "circles": 0
      },
      {
        "text": "broad",
        "circles": 0
      },
      {
        "text": "drop",
        "circles": 0
      },
      {
        "text": "re-",
        "circles": 0
      },
      {
        "text": "as adj. as possible",
        "circles": 0
      },
      {
        "text": "patient",
        "circles": 0
      },
      {
        "text": "forward",
        "circles": 1
      },
      {
        "text": "pick",
        "circles": 0
      }
    ]
  },
  {
    "id": 13,
    "words": [
      {
        "text": "sow",
        "circles": 0
      },
      {
        "text": "by",
        "circles": 0
      },
      {
        "text": "judge",
        "circles": 0
      },
      {
        "text": "as long as",
        "circles": 0
      },
      {
        "text": "dependable",
        "circles": 0
      },
      {
        "text": "teach-taught-taught",
        "circles": 1
      },
      {
        "text": "common",
        "circles": 1
      },
      {
        "text": "free",
        "circles": 0
      },
      {
        "text": "restroom",
        "circles": 0
      },
      {
        "text": "rest",
        "circles": 1
      },
      {
        "text": "comfortable",
        "circles": 0
      },
      {
        "text": "pass away",
        "circles": 0
      },
      {
        "text": "hard",
        "circles": 2
      },
      {
        "text": "event",
        "circles": 2
      },
      {
        "text": "meaning",
        "circles": 0
      },
      {
        "text": "defeat",
        "circles": 2
      }
    ]
  },
  {
    "id": 14,
    "words": [
      {
        "text": "company",
        "circles": 0
      },
      {
        "text": "recover",
        "circles": 0
      },
      {
        "text": "will",
        "circles": 4
      },
      {
        "text": "patient",
        "circles": 4
      },
      {
        "text": "polite",
        "circles": 0
      },
      {
        "text": "heal",
        "circles": 0
      },
      {
        "text": "recently",
        "circles": 0
      },
      {
        "text": "gain",
        "circles": 0
      },
      {
        "text": "feature",
        "circles": 4
      },
      {
        "text": "important - importance",
        "circles": 0
      },
      {
        "text": "audience",
        "circles": 0
      },
      {
        "text": "appreciate",
        "circles": 0
      },
      {
        "text": "make it adj to sb",
        "circles": 0
      },
      {
        "text": "make",
        "circles": 1
      },
      {
        "text": "prove",
        "circles": 0
      },
      {
        "text": "therefore",
        "circles": 0
      }
    ]
  },
  {
    "id": 15,
    "words": [
      {
        "text": "direct",
        "circles": 0
      },
      {
        "text": "measure",
        "circles": 0
      },
      {
        "text": "probably",
        "circles": 0
      },
      {
        "text": "role",
        "circles": 1
      },
      {
        "text": "no longer",
        "circles": 0
      },
      {
        "text": "function",
        "circles": 0
      },
      {
        "text": "merely",
        "circles": 4
      },
      {
        "text": "active",
        "circles": 0
      },
      {
        "text": "as",
        "circles": 1
      },
      {
        "text": "gather",
        "circles": 0
      },
      {
        "text": "draw",
        "circles": 2
      },
      {
        "text": "tool",
        "circles": 0
      },
      {
        "text": "practical",
        "circles": 5
      },
      {
        "text": "practice",
        "circles": 1
      },
      {
        "text": "combine",
        "circles": 2
      },
      {
        "text": "theme",
        "circles": 0
      }
    ]
  },
  {
    "id": 16,
    "words": [
      {
        "text": "casual",
        "circles": 0
      },
      {
        "text": "distant",
        "circles": 0
      },
      {
        "text": "text",
        "circles": 0
      },
      {
        "text": "website",
        "circles": 0
      },
      {
        "text": "most",
        "circles": 0
      },
      {
        "text": "resist",
        "circles": 3
      },
      {
        "text": "evolution",
        "circles": 0
      },
      {
        "text": "powerful",
        "circles": 0
      },
      {
        "text": "power",
        "circles": 0
      },
      {
        "text": "journey",
        "circles": 0
      },
      {
        "text": "guide",
        "circles": 0
      },
      {
        "text": "hesitate",
        "circles": 1
      },
      {
        "text": "wear-wore-worn",
        "circles": 0
      },
      {
        "text": "remove",
        "circles": 6
      },
      {
        "text": "adventure",
        "circles": 0
      },
      {
        "text": "discover",
        "circles": 0
      }
    ]
  },
  {
    "id": 17,
    "words": [
      {
        "text": "lift",
        "circles": 0
      },
      {
        "text": "curious",
        "circles": 0
      },
      {
        "text": "get",
        "circles": 0
      },
      {
        "text": "tough",
        "circles": 0
      },
      {
        "text": "mystery",
        "circles": 0
      },
      {
        "text": "concern",
        "circles": 2
      },
      {
        "text": "imagine",
        "circles": 0
      },
      {
        "text": "fight",
        "circles": 0
      },
      {
        "text": "seek",
        "circles": 0
      },
      {
        "text": "connect",
        "circles": 0
      },
      {
        "text": "cover",
        "circles": 0
      },
      {
        "text": "environment",
        "circles": 0
      },
      {
        "text": "talent",
        "circles": 0
      },
      {
        "text": "imagination",
        "circles": 0
      },
      {
        "text": "serve",
        "circles": 0
      },
      {
        "text": "gain",
        "circles": 0
      }
    ]
  },
  {
    "id": 18,
    "words": [
      {
        "text": "communicate",
        "circles": 0
      },
      {
        "text": "emotional",
        "circles": 0
      },
      {
        "text": "focus on",
        "circles": 2
      },
      {
        "text": "service",
        "circles": 0
      },
      {
        "text": "remote",
        "circles": 0
      },
      {
        "text": "grow",
        "circles": 0
      },
      {
        "text": "reduce",
        "circles": 4
      },
      {
        "text": "benefit",
        "circles": 2
      },
      {
        "text": "beyond",
        "circles": 3
      },
      {
        "text": "dimension",
        "circles": 0
      },
      {
        "text": "forward",
        "circles": 0
      },
      {
        "text": "continue",
        "circles": 3
      },
      {
        "text": "challenge",
        "circles": 0
      },
      {
        "text": "rich",
        "circles": 0
      },
      {
        "text": "globe-global",
        "circles": 2
      },
      {
        "text": "pollution",
        "circles": 0
      }
    ]
  },
  {
    "id": 19,
    "words": [
      {
        "text": "climate",
        "circles": 0
      },
      {
        "text": "study",
        "circles": 0
      },
      {
        "text": "find",
        "circles": 1
      },
      {
        "text": "impact",
        "circles": 4
      },
      {
        "text": "ocean",
        "circles": 0
      },
      {
        "text": "risk",
        "circles": 5
      },
      {
        "text": "conservation",
        "circles": 0
      },
      {
        "text": "conversation",
        "circles": 1
      },
      {
        "text": "effort",
        "circles": 0
      },
      {
        "text": "effect",
        "circles": 0
      },
      {
        "text": "progress",
        "circles": 0
      },
      {
        "text": "improve",
        "circles": 0
      },
      {
        "text": "save",
        "circles": 0
      },
      {
        "text": "notice",
        "circles": 4
      },
      {
        "text": "speed",
        "circles": 0
      },
      {
        "text": "worthy",
        "circles": 0
      }
    ]
  },
  {
    "id": 20,
    "words": [
      {
        "text": "poetry",
        "circles": 0
      },
      {
        "text": "expect",
        "circles": 1
      },
      {
        "text": "shift",
        "circles": 0
      },
      {
        "text": "belong",
        "circles": 0
      },
      {
        "text": "realize",
        "circles": 2
      },
      {
        "text": "trust",
        "circles": 0
      },
      {
        "text": "respect",
        "circles": 0
      },
      {
        "text": "inspiration",
        "circles": 0
      },
      {
        "text": "fog",
        "circles": 0
      },
      {
        "text": "equation",
        "circles": 0
      },
      {
        "text": "require",
        "circles": 1
      },
      {
        "text": "curious",
        "circles": 0
      },
      {
        "text": "curiosity",
        "circles": 0
      },
      {
        "text": "reward",
        "circles": 3
      },
      {
        "text": "insight",
        "circles": 2
      },
      {
        "text": "far-farther",
        "circles": 0
      }
    ]
  },
  {
    "id": 21,
    "words": [
      {
        "text": "path",
        "circles": 6
      },
      {
        "text": "light",
        "circles": 0
      },
      {
        "text": "method",
        "circles": 2
      },
      {
        "text": "flow",
        "circles": 1
      },
      {
        "text": "direct",
        "circles": 5
      },
      {
        "text": "seem",
        "circles": 0
      },
      {
        "text": "create",
        "circles": 0
      },
      {
        "text": "meanwhile",
        "circles": 0
      },
      {
        "text": "mark",
        "circles": 0
      },
      {
        "text": "despite",
        "circles": 2
      },
      {
        "text": "memory",
        "circles": 2
      },
      {
        "text": "root",
        "circles": 0
      },
      {
        "text": "field",
        "circles": 0
      },
      {
        "text": "conclusion",
        "circles": 0
      },
      {
        "text": "threat",
        "circles": 3
      },
      {
        "text": "",
        "circles": 0
      }
    ]
  },
  {
    "id": 22,
    "words": [
      {
        "text": "evidence",
        "circles": 1
      },
      {
        "text": "planet",
        "circles": 0
      },
      {
        "text": "sensible",
        "circles": 0
      },
      {
        "text": "infer",
        "circles": 2
      },
      {
        "text": "logic",
        "circles": 0
      },
      {
        "text": "lead",
        "circles": 2
      },
      {
        "text": "lead to",
        "circles": 0
      },
      {
        "text": "alone",
        "circles": 0
      },
      {
        "text": "emotion",
        "circles": 0
      },
      {
        "text": "emotional",
        "circles": 0
      },
      {
        "text": "enhance",
        "circles": 0
      },
      {
        "text": "critical",
        "circles": 0
      },
      {
        "text": "mind",
        "circles": 3
      },
      {
        "text": "base",
        "circles": 0
      },
      {
        "text": "thought",
        "circles": 0
      },
      {
        "text": "observe",
        "circles": 3
      }
    ]
  },
  {
    "id": 23,
    "words": [
      {
        "text": "attitude",
        "circles": 0
      },
      {
        "text": "appreciate",
        "circles": 0
      },
      {
        "text": "significant",
        "circles": 0
      },
      {
        "text": "calm",
        "circles": 0
      },
      {
        "text": "fear",
        "circles": 1
      },
      {
        "text": "astronaut",
        "circles": 0
      },
      {
        "text": "decrease",
        "circles": 0
      },
      {
        "text": "explain",
        "circles": 1
      },
      {
        "text": "increase",
        "circles": 0
      },
      {
        "text": "fight",
        "circles": 0
      },
      {
        "text": "grow",
        "circles": 0
      },
      {
        "text": "normal",
        "circles": 0
      },
      {
        "text": "commit",
        "circles": 0
      },
      {
        "text": "guidance",
        "circles": 0
      },
      {
        "text": "give in",
        "circles": 0
      },
      {
        "text": "brain",
        "circles": 0
      }
    ]
  },
  {
    "id": 24,
    "words": [
      {
        "text": "fit",
        "circles": 2
      },
      {
        "text": "drop",
        "circles": 0
      },
      {
        "text": "lable",
        "circles": 0
      },
      {
        "text": "message",
        "circles": 1
      },
      {
        "text": "mystery",
        "circles": 0
      },
      {
        "text": "chance",
        "circles": 0
      },
      {
        "text": "fortune",
        "circles": 2
      },
      {
        "text": "fortunate",
        "circles": 1
      },
      {
        "text": "part",
        "circles": 0
      },
      {
        "text": "community",
        "circles": 1
      },
      {
        "text": "innovation",
        "circles": 1
      },
      {
        "text": "seek",
        "circles": 0
      },
      {
        "text": "hide",
        "circles": 0
      },
      {
        "text": "pride",
        "circles": 0
      },
      {
        "text": "catch",
        "circles": 1
      },
      {
        "text": "key",
        "circles": 1
      }
    ]
  },
  {
    "id": 25,
    "words": [
      {
        "text": "strength",
        "circles": 0
      },
      {
        "text": "foreign",
        "circles": 1
      },
      {
        "text": "a growing number of",
        "circles": 0
      },
      {
        "text": "style",
        "circles": 0
      },
      {
        "text": "trend",
        "circles": 0
      },
      {
        "text": "draw",
        "circles": 0
      },
      {
        "text": "describe",
        "circles": 0
      },
      {
        "text": "turst",
        "circles": 0
      },
      {
        "text": "date",
        "circles": 0
      },
      {
        "text": "depth",
        "circles": 0
      },
      {
        "text": "hear-heard",
        "circles": 0
      },
      {
        "text": "fact",
        "circles": 0
      },
      {
        "text": "laugh",
        "circles": 0
      },
      {
        "text": "observation",
        "circles": 1
      },
      {
        "text": "certain",
        "circles": 2
      },
      {
        "text": "dare to",
        "circles": 0
      }
    ]
  },
  {
    "id": 26,
    "words": [
      {
        "text": "embrace",
        "circles": 0
      },
      {
        "text": "even",
        "circles": 0
      },
      {
        "text": "serious",
        "circles": 2
      },
      {
        "text": "spring",
        "circles": 0
      },
      {
        "text": "differ",
        "circles": 0
      },
      {
        "text": "next",
        "circles": 0
      },
      {
        "text": "effort",
        "circles": 0
      },
      {
        "text": "trade",
        "circles": 0
      },
      {
        "text": "add",
        "circles": 0
      },
      {
        "text": "pressure",
        "circles": 3
      },
      {
        "text": "support",
        "circles": 0
      },
      {
        "text": "explore",
        "circles": 0
      },
      {
        "text": "whether",
        "circles": 1
      },
      {
        "text": "compare with",
        "circles": 0
      },
      {
        "text": "serve",
        "circles": 2
      },
      {
        "text": "point",
        "circles": 1
      }
    ]
  },
  {
    "id": 27,
    "words": [
      {
        "text": "participate",
        "circles": 0
      },
      {
        "text": "join",
        "circles": 0
      },
      {
        "text": "join jn",
        "circles": 0
      },
      {
        "text": "display",
        "circles": 0
      },
      {
        "text": "in place of",
        "circles": 0
      },
      {
        "text": "honor",
        "circles": 0
      },
      {
        "text": "organization",
        "circles": 0
      },
      {
        "text": "spread",
        "circles": 0
      },
      {
        "text": "unite-unity",
        "circles": 0
      },
      {
        "text": "divide",
        "circles": 0
      },
      {
        "text": "return",
        "circles": 0
      },
      {
        "text": "war",
        "circles": 0
      },
      {
        "text": "break",
        "circles": 0
      },
      {
        "text": "full",
        "circles": 0
      },
      {
        "text": "suffer",
        "circles": 0
      },
      {
        "text": "touch",
        "circles": 0
      }
    ]
  },
  {
    "id": 28,
    "words": [
      {
        "text": "fill",
        "circles": 0
      },
      {
        "text": "visible",
        "circles": 0
      },
      {
        "text": "manage",
        "circles": 0
      },
      {
        "text": "manage to",
        "circles": 0
      },
      {
        "text": "promise",
        "circles": 1
      },
      {
        "text": "bless",
        "circles": 0
      },
      {
        "text": "remain",
        "circles": 0
      },
      {
        "text": "cause",
        "circles": 1
      },
      {
        "text": "career",
        "circles": 0
      },
      {
        "text": "traditional",
        "circles": 0
      },
      {
        "text": "symbol",
        "circles": 0
      },
      {
        "text": "system",
        "circles": 0
      },
      {
        "text": "record",
        "circles": 0
      },
      {
        "text": "inspire",
        "circles": 0
      },
      {
        "text": "deliver",
        "circles": 0
      },
      {
        "text": "accessible",
        "circles": 0
      }
    ]
  },
  {
    "id": 29,
    "words": [
      {
        "text": "correct",
        "circles": 0
      },
      {
        "text": "process",
        "circles": 2
      },
      {
        "text": "wave",
        "circles": 0
      },
      {
        "text": "alone",
        "circles": 0
      },
      {
        "text": "heat",
        "circles": 0
      },
      {
        "text": "sensitive",
        "circles": 0
      },
      {
        "text": "mature",
        "circles": 0
      },
      {
        "text": "relate",
        "circles": 1
      },
      {
        "text": "response",
        "circles": 1
      },
      {
        "text": "harm",
        "circles": 0
      },
      {
        "text": "efficient",
        "circles": 0
      },
      {
        "text": "modern",
        "circles": 0
      },
      {
        "text": "mental",
        "circles": 0
      },
      {
        "text": "struggle",
        "circles": 0
      },
      {
        "text": "such",
        "circles": 0
      },
      {
        "text": "state",
        "circles": 0
      }
    ]
  },
  {
    "id": 30,
    "words": [
      {
        "text": "clear",
        "circles": 0
      },
      {
        "text": "task",
        "circles": 0
      },
      {
        "text": "matter",
        "circles": 0
      },
      {
        "text": "efficient",
        "circles": 1
      },
      {
        "text": "efficiency",
        "circles": 0
      },
      {
        "text": "put",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      },
      {
        "text": "",
        "circles": 0
      }
    ]
  }
]

function createEmptyPage(id) {
  return {
    id,
    words: Array.from({ length: 16 }, () => ({ text: '', circles: 0 }))
  }
}

function loadOrInitData() {
  const stored = loadStorage()
  if (stored && stored.pages && stored.pages.length > 0) return stored
  return { pages: JSON.parse(JSON.stringify(INITIAL_PAGES)) }
}

export const useNotebookStore = defineStore('notebook', {
  state: () => ({
    pages: [],
    searchTarget: null, // { pageIdx, slotIdx } — 统计页跳转
  }),

  actions: {
    init() {
      const data = loadOrInitData()
      this.pages = data.pages
    },

    save() {
      saveStorage({ pages: this.pages })
    },

    addNewPage() {
      const newPage = createEmptyPage(this.pages.length + 1)
      this.pages.push(newPage)
      this.save()
    },

    setWord(pageIdx, slotIdx, text) {
      this.pages[pageIdx].words[slotIdx].text = text.trim().toLowerCase()
      this.save()
    },

    deleteWord(pageIdx, slotIdx) {
      this.pages[pageIdx].words[slotIdx].text = ''
      this.pages[pageIdx].words[slotIdx].circles = 0
      this.save()
    },

    addCircle(pageIdx, slotIdx) {
      this.pages[pageIdx].words[slotIdx].circles++
      this.save()
    },

    removeCircle(pageIdx, slotIdx) {
      const c = this.pages[pageIdx]?.words[slotIdx]?.circles || 0
      if (c > 0) {
        this.pages[pageIdx].words[slotIdx].circles--
        this.save()
      }
    },

    addForgottenCircle(item) {
      item.circles++
      this.pages[item.pageIdx].words[item.slotIdx].circles = item.circles
      this.save()
    },

    addQuizCircle(item) {
      item.circles++
      this.pages[item.pageIdx].words[item.slotIdx].circles = item.circles
      this.save()
    },

    removeQuizCircle(item) {
      if (item.circles > 0) {
        item.circles--
        this.pages[item.pageIdx].words[item.slotIdx].circles = item.circles
        this.save()
      }
    }
  },

  getters: {
    totalWords: (state) =>
      state.pages.reduce((sum, p) => sum + p.words.filter(w => w.text).length, 0),

    totalCircles: (state) =>
      state.pages.reduce((sum, p) =>
        sum + p.words.reduce((s, w) => s + (w.circles || 0), 0), 0),

    allForgotten: (state) => {
      const list = []
      state.pages.forEach((p, pageIdx) => {
        p.words.forEach((w, slotIdx) => {
          if (w.text && w.circles > 0) {
            list.push({ text: w.text, circles: w.circles, pageIdx, slotIdx, pageId: p.id })
          }
        })
      })
      return list.sort((a, b) => b.circles - a.circles)
    }
  }
})
