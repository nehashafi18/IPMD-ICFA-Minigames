import { ART_STYLES } from '../../systems/artStyles';

export interface MemoryCard {
  id: number;
  symbolId: string;
  artStyleId: string;
  emoji: string;
  name: string;
  flipped: boolean;
  matched: boolean;
}

interface PoolItem {
  symbolId: string;
  emoji: string;
  name: string;
}

export const MEMORY_POOL: PoolItem[] = [
  // Animals
  { symbolId: 'lion',        emoji: '🦁', name: 'Lion' },
  { symbolId: 'tiger',       emoji: '🐯', name: 'Tiger' },
  { symbolId: 'bear',        emoji: '🐻', name: 'Bear' },
  { symbolId: 'panda',       emoji: '🐼', name: 'Panda' },
  { symbolId: 'fox',         emoji: '🦊', name: 'Fox' },
  { symbolId: 'wolf',        emoji: '🐺', name: 'Wolf' },
  { symbolId: 'cow',         emoji: '🐮', name: 'Cow' },
  { symbolId: 'pig',         emoji: '🐷', name: 'Pig' },
  { symbolId: 'frog',        emoji: '🐸', name: 'Frog' },
  { symbolId: 'monkey',      emoji: '🐵', name: 'Monkey' },
  { symbolId: 'chicken',     emoji: '🐔', name: 'Chicken' },
  { symbolId: 'penguin',     emoji: '🐧', name: 'Penguin' },
  { symbolId: 'duck',        emoji: '🦆', name: 'Duck' },
  { symbolId: 'eagle',       emoji: '🦅', name: 'Eagle' },
  { symbolId: 'owl',         emoji: '🦉', name: 'Owl' },
  { symbolId: 'bat',         emoji: '🦇', name: 'Bat' },
  { symbolId: 'horse',       emoji: '🐴', name: 'Horse' },
  { symbolId: 'unicorn',     emoji: '🦄', name: 'Unicorn' },
  { symbolId: 'turtle',      emoji: '🐢', name: 'Turtle' },
  { symbolId: 'lizard',      emoji: '🦎', name: 'Lizard' },
  { symbolId: 'snake',       emoji: '🐍', name: 'Snake' },
  { symbolId: 'trex',        emoji: '🦖', name: 'T-Rex' },
  { symbolId: 'sauropod',    emoji: '🦕', name: 'Dinosaur' },
  { symbolId: 'octopus',     emoji: '🐙', name: 'Octopus' },
  { symbolId: 'crab',        emoji: '🦀', name: 'Crab' },
  { symbolId: 'fish',        emoji: '🐟', name: 'Fish' },
  { symbolId: 'tropical',    emoji: '🐠', name: 'Tropical Fish' },
  { symbolId: 'whale',       emoji: '🐳', name: 'Whale' },
  { symbolId: 'dolphin',     emoji: '🐬', name: 'Dolphin' },
  { symbolId: 'shark',       emoji: '🦈', name: 'Shark' },
  { symbolId: 'elephant',    emoji: '🐘', name: 'Elephant' },
  { symbolId: 'rhino',       emoji: '🦏', name: 'Rhino' },
  { symbolId: 'hippo',       emoji: '🦛', name: 'Hippo' },
  { symbolId: 'giraffe',     emoji: '🦒', name: 'Giraffe' },
  { symbolId: 'zebra',       emoji: '🦓', name: 'Zebra' },
  { symbolId: 'kangaroo',    emoji: '🦘', name: 'Kangaroo' },
  { symbolId: 'koala',       emoji: '🐨', name: 'Koala' },
  { symbolId: 'llama',       emoji: '🦙', name: 'Llama' },
  { symbolId: 'otter',       emoji: '🦦', name: 'Otter' },
  { symbolId: 'sloth',       emoji: '🦥', name: 'Sloth' },
  { symbolId: 'hedgehog',    emoji: '🦔', name: 'Hedgehog' },
  { symbolId: 'rabbit',      emoji: '🐰', name: 'Rabbit' },
  { symbolId: 'chipmunk',    emoji: '🐿️', name: 'Chipmunk' },
  { symbolId: 'mouse',       emoji: '🐭', name: 'Mouse' },
  { symbolId: 'cat',         emoji: '🐱', name: 'Cat' },
  { symbolId: 'dog',         emoji: '🐶', name: 'Dog' },
  { symbolId: 'hamster',     emoji: '🐹', name: 'Hamster' },
  { symbolId: 'parrot',      emoji: '🦜', name: 'Parrot' },
  { symbolId: 'flamingo',    emoji: '🦩', name: 'Flamingo' },
  { symbolId: 'peacock',     emoji: '🦚', name: 'Peacock' },

  // Insects
  { symbolId: 'bee',         emoji: '🐝', name: 'Bee' },
  { symbolId: 'butterfly',   emoji: '🦋', name: 'Butterfly' },
  { symbolId: 'snail',       emoji: '🐌', name: 'Snail' },
  { symbolId: 'ant',         emoji: '🐜', name: 'Ant' },
  { symbolId: 'ladybug',     emoji: '🐞', name: 'Ladybug' },
  { symbolId: 'spider',      emoji: '🕷️', name: 'Spider' },
  { symbolId: 'scorpion',    emoji: '🦂', name: 'Scorpion' },

  // Fruit
  { symbolId: 'apple',       emoji: '🍎', name: 'Apple' },
  { symbolId: 'orange',      emoji: '🍊', name: 'Orange' },
  { symbolId: 'lemon',       emoji: '🍋', name: 'Lemon' },
  { symbolId: 'grapes',      emoji: '🍇', name: 'Grapes' },
  { symbolId: 'strawberry',  emoji: '🍓', name: 'Strawberry' },
  { symbolId: 'blueberry',   emoji: '🫐', name: 'Blueberry' },
  { symbolId: 'cherries',    emoji: '🍒', name: 'Cherries' },
  { symbolId: 'peach',       emoji: '🍑', name: 'Peach' },
  { symbolId: 'pineapple',   emoji: '🍍', name: 'Pineapple' },
  { symbolId: 'mango',       emoji: '🥭', name: 'Mango' },
  { symbolId: 'banana',      emoji: '🍌', name: 'Banana' },
  { symbolId: 'coconut',     emoji: '🥥', name: 'Coconut' },
  { symbolId: 'watermelon',  emoji: '🍉', name: 'Watermelon' },
  { symbolId: 'pear',        emoji: '🍐', name: 'Pear' },
  { symbolId: 'avocado',     emoji: '🥑', name: 'Avocado' },
  { symbolId: 'kiwi',        emoji: '🥝', name: 'Kiwi' },
  { symbolId: 'melon',       emoji: '🍈', name: 'Melon' },

  // Vegetables
  { symbolId: 'carrot',      emoji: '🥕', name: 'Carrot' },
  { symbolId: 'corn',        emoji: '🌽', name: 'Corn' },
  { symbolId: 'broccoli',    emoji: '🥦', name: 'Broccoli' },
  { symbolId: 'tomato',      emoji: '🍅', name: 'Tomato' },
  { symbolId: 'eggplant',    emoji: '🍆', name: 'Eggplant' },
  { symbolId: 'mushroom',    emoji: '🍄', name: 'Mushroom' },
  { symbolId: 'pepper',      emoji: '🌶️', name: 'Pepper' },
  { symbolId: 'potato',      emoji: '🥔', name: 'Potato' },
  { symbolId: 'garlic',      emoji: '🧄', name: 'Garlic' },
  { symbolId: 'onion',       emoji: '🧅', name: 'Onion' },

  // Food
  { symbolId: 'pizza',       emoji: '🍕', name: 'Pizza' },
  { symbolId: 'burger',      emoji: '🍔', name: 'Burger' },
  { symbolId: 'taco',        emoji: '🌮', name: 'Taco' },
  { symbolId: 'sushi',       emoji: '🍣', name: 'Sushi' },
  { symbolId: 'ramen',       emoji: '🍜', name: 'Ramen' },
  { symbolId: 'bread',       emoji: '🍞', name: 'Bread' },
  { symbolId: 'egg',         emoji: '🍳', name: 'Egg' },
  { symbolId: 'cheese',      emoji: '🧀', name: 'Cheese' },
  { symbolId: 'pancakes',    emoji: '🥞', name: 'Pancakes' },
  { symbolId: 'waffle',      emoji: '🧇', name: 'Waffle' },
  { symbolId: 'croissant',   emoji: '🥐', name: 'Croissant' },
  { symbolId: 'baguette',    emoji: '🥖', name: 'Baguette' },
  { symbolId: 'pretzel',     emoji: '🥨', name: 'Pretzel' },
  { symbolId: 'hotdog',      emoji: '🌭', name: 'Hot Dog' },
  { symbolId: 'sandwich',    emoji: '🥪', name: 'Sandwich' },
  { symbolId: 'burrito',     emoji: '🌯', name: 'Burrito' },

  // Sweets / Drinks
  { symbolId: 'icecream',    emoji: '🍦', name: 'Ice Cream' },
  { symbolId: 'cake',        emoji: '🎂', name: 'Cake' },
  { symbolId: 'donut',       emoji: '🍩', name: 'Donut' },
  { symbolId: 'cookie',      emoji: '🍪', name: 'Cookie' },
  { symbolId: 'chocolate',   emoji: '🍫', name: 'Chocolate' },
  { symbolId: 'candy',       emoji: '🍬', name: 'Candy' },
  { symbolId: 'lollipop',    emoji: '🍭', name: 'Lollipop' },
  { symbolId: 'cupcake',     emoji: '🧁', name: 'Cupcake' },
  { symbolId: 'pie',         emoji: '🥧', name: 'Pie' },
  { symbolId: 'coffee',      emoji: '☕', name: 'Coffee' },
  { symbolId: 'tea',         emoji: '🍵', name: 'Tea' },
  { symbolId: 'juice',       emoji: '🧃', name: 'Juice' },
  { symbolId: 'milk',        emoji: '🥛', name: 'Milk' },
  { symbolId: 'bubbletea',   emoji: '🧋', name: 'Bubble Tea' },

  // Flowers / Plants
  { symbolId: 'rose',        emoji: '🌹', name: 'Rose' },
  { symbolId: 'tulip',       emoji: '🌷', name: 'Tulip' },
  { symbolId: 'sunflower',   emoji: '🌻', name: 'Sunflower' },
  { symbolId: 'blossom',     emoji: '🌸', name: 'Blossom' },
  { symbolId: 'daisy',       emoji: '🌼', name: 'Daisy' },
  { symbolId: 'bouquet',     emoji: '💐', name: 'Bouquet' },
  { symbolId: 'seedling',    emoji: '🌱', name: 'Seedling' },
  { symbolId: 'herb',        emoji: '🌿', name: 'Herb' },
  { symbolId: 'leaves',      emoji: '🍃', name: 'Leaves' },
  { symbolId: 'maple',       emoji: '🍁', name: 'Maple Leaf' },
  { symbolId: 'shamrock',    emoji: '☘️', name: 'Shamrock' },
  { symbolId: 'bamboo',      emoji: '🎋', name: 'Bamboo' },
  { symbolId: 'cactus',      emoji: '🌵', name: 'Cactus' },
  { symbolId: 'palm',        emoji: '🌴', name: 'Palm Tree' },
  { symbolId: 'potted',      emoji: '🪴', name: 'Potted Plant' },

  // Weather / Nature
  { symbolId: 'sun',         emoji: '☀️', name: 'Sun' },
  { symbolId: 'moon',        emoji: '🌙', name: 'Moon' },
  { symbolId: 'star',        emoji: '⭐', name: 'Star' },
  { symbolId: 'rainbow',     emoji: '🌈', name: 'Rainbow' },
  { symbolId: 'snowflake',   emoji: '❄️', name: 'Snowflake' },
  { symbolId: 'snowman',     emoji: '⛄', name: 'Snowman' },
  { symbolId: 'cloud',       emoji: '☁️', name: 'Cloud' },
  { symbolId: 'lightning',   emoji: '⚡', name: 'Lightning' },
  { symbolId: 'wave',        emoji: '🌊', name: 'Wave' },
  { symbolId: 'fire',        emoji: '🔥', name: 'Fire' },
  { symbolId: 'droplet',     emoji: '💧', name: 'Droplet' },
  { symbolId: 'tornado',     emoji: '🌪️', name: 'Tornado' },
  { symbolId: 'comet',       emoji: '☄️', name: 'Comet' },
  { symbolId: 'volcano',     emoji: '🌋', name: 'Volcano' },

  // Space
  { symbolId: 'planet',      emoji: '🪐', name: 'Planet' },
  { symbolId: 'rocket',      emoji: '🚀', name: 'Rocket' },
  { symbolId: 'ufo',         emoji: '🛸', name: 'UFO' },
  { symbolId: 'earth',       emoji: '🌍', name: 'Earth' },
  { symbolId: 'galaxy',      emoji: '🌌', name: 'Galaxy' },
  { symbolId: 'satellite',   emoji: '🛰️', name: 'Satellite' },
  { symbolId: 'telescope',   emoji: '🔭', name: 'Telescope' },

  // Sports
  { symbolId: 'soccer',      emoji: '⚽', name: 'Soccer' },
  { symbolId: 'basketball',  emoji: '🏀', name: 'Basketball' },
  { symbolId: 'football',    emoji: '🏈', name: 'Football' },
  { symbolId: 'baseball',    emoji: '⚾', name: 'Baseball' },
  { symbolId: 'tennis',      emoji: '🎾', name: 'Tennis' },
  { symbolId: 'volleyball',  emoji: '🏐', name: 'Volleyball' },
  { symbolId: 'pingpong',    emoji: '🏓', name: 'Ping Pong' },
  { symbolId: 'badminton',   emoji: '🏸', name: 'Badminton' },
  { symbolId: 'boxing',      emoji: '🥊', name: 'Boxing' },
  { symbolId: 'trophy',      emoji: '🏆', name: 'Trophy' },
  { symbolId: 'medal',       emoji: '🥇', name: 'Medal' },
  { symbolId: 'skis',        emoji: '🎿', name: 'Skis' },
  { symbolId: 'bicycle',     emoji: '🚲', name: 'Bicycle' },
  { symbolId: 'archery',     emoji: '🏹', name: 'Bow & Arrow' },
  { symbolId: 'target',      emoji: '🎯', name: 'Target' },

  // Vehicles
  { symbolId: 'car',         emoji: '🚗', name: 'Car' },
  { symbolId: 'bus',         emoji: '🚌', name: 'Bus' },
  { symbolId: 'train',       emoji: '🚂', name: 'Train' },
  { symbolId: 'airplane',    emoji: '✈️', name: 'Airplane' },
  { symbolId: 'ship',        emoji: '🚢', name: 'Ship' },
  { symbolId: 'scooter',     emoji: '🛵', name: 'Scooter' },
  { symbolId: 'tractor',     emoji: '🚜', name: 'Tractor' },
  { symbolId: 'helicopter',  emoji: '🚁', name: 'Helicopter' },
  { symbolId: 'ambulance',   emoji: '🚑', name: 'Ambulance' },
  { symbolId: 'firetruck',   emoji: '🚒', name: 'Fire Truck' },
  { symbolId: 'taxi',        emoji: '🚕', name: 'Taxi' },
  { symbolId: 'submarine',   emoji: '🤿', name: 'Diving' },

  // Music
  { symbolId: 'guitar',      emoji: '🎸', name: 'Guitar' },
  { symbolId: 'piano',       emoji: '🎹', name: 'Piano' },
  { symbolId: 'trumpet',     emoji: '🎺', name: 'Trumpet' },
  { symbolId: 'drum',        emoji: '🥁', name: 'Drum' },
  { symbolId: 'violin',      emoji: '🎻', name: 'Violin' },
  { symbolId: 'microphone',  emoji: '🎤', name: 'Microphone' },
  { symbolId: 'headphones',  emoji: '🎧', name: 'Headphones' },
  { symbolId: 'notes',       emoji: '🎵', name: 'Music Notes' },
  { symbolId: 'saxophone',   emoji: '🎷', name: 'Saxophone' },
  { symbolId: 'accordion',   emoji: '🪗', name: 'Accordion' },

  // Objects / Activities
  { symbolId: 'gamepad',     emoji: '🎮', name: 'Gamepad' },
  { symbolId: 'dice',        emoji: '🎲', name: 'Dice' },
  { symbolId: 'puzzle',      emoji: '🧩', name: 'Puzzle' },
  { symbolId: 'palette',     emoji: '🎨', name: 'Palette' },
  { symbolId: 'camera',      emoji: '📷', name: 'Camera' },
  { symbolId: 'microscope',  emoji: '🔬', name: 'Microscope' },
  { symbolId: 'magnet',      emoji: '🧲', name: 'Magnet' },
  { symbolId: 'key',         emoji: '🔑', name: 'Key' },
  { symbolId: 'crown',       emoji: '👑', name: 'Crown' },
  { symbolId: 'diamond',     emoji: '💎', name: 'Diamond' },
  { symbolId: 'crystal',     emoji: '🔮', name: 'Crystal Ball' },
  { symbolId: 'magic-wand',  emoji: '🪄', name: 'Magic Wand' },
  { symbolId: 'teddy',       emoji: '🧸', name: 'Teddy Bear' },
  { symbolId: 'yoyo',        emoji: '🪀', name: 'Yo-Yo' },
  { symbolId: 'chess',       emoji: '♟️', name: 'Chess' },
  { symbolId: 'book',        emoji: '📚', name: 'Books' },
  { symbolId: 'pencil',      emoji: '✏️', name: 'Pencil' },
  { symbolId: 'lightbulb',   emoji: '💡', name: 'Light Bulb' },
  { symbolId: 'compass',     emoji: '🧭', name: 'Compass' },
  { symbolId: 'hourglass',   emoji: '⏳', name: 'Hourglass' },
  { symbolId: 'umbrella',    emoji: '☂️', name: 'Umbrella' },
  { symbolId: 'gift',        emoji: '🎁', name: 'Gift' },
  { symbolId: 'ribbon',      emoji: '🎀', name: 'Ribbon' },
  { symbolId: 'kite',        emoji: '🪁', name: 'Boomerang' },
  { symbolId: 'balloon',     emoji: '🎈', name: 'Balloon' },

  // Celebrations
  { symbolId: 'party',       emoji: '🎉', name: 'Party' },
  { symbolId: 'fireworks',   emoji: '🎆', name: 'Fireworks' },
  { symbolId: 'sparkler',    emoji: '🎇', name: 'Sparkler' },
  { symbolId: 'lantern',     emoji: '🏮', name: 'Lantern' },
  { symbolId: 'jackolantern',emoji: '🎃', name: 'Pumpkin' },
  { symbolId: 'xmastree',    emoji: '🎄', name: 'Christmas Tree' },
  { symbolId: 'pinata',      emoji: '🪅', name: 'Piñata' },
  { symbolId: 'matryoshka',  emoji: '🪆', name: 'Matryoshka' },

  // Fantasy / Characters
  { symbolId: 'ghost',       emoji: '👻', name: 'Ghost' },
  { symbolId: 'alien',       emoji: '👽', name: 'Alien' },
  { symbolId: 'robot',       emoji: '🤖', name: 'Robot' },
  { symbolId: 'skull',       emoji: '💀', name: 'Skull' },
  { symbolId: 'fairy',       emoji: '🧚', name: 'Fairy' },
  { symbolId: 'mermaid',     emoji: '🧜', name: 'Mermaid' },
  { symbolId: 'wizard',      emoji: '🧙', name: 'Wizard' },
  { symbolId: 'elf',         emoji: '🧝', name: 'Elf' },
  { symbolId: 'genie',       emoji: '🧞', name: 'Genie' },
  { symbolId: 'vampire',     emoji: '🧛', name: 'Vampire' },
  { symbolId: 'superhero',   emoji: '🦸', name: 'Superhero' },
  { symbolId: 'ninja',       emoji: '🥷', name: 'Ninja' },

  // Places / Structures
  { symbolId: 'castle',      emoji: '🏰', name: 'Castle' },
  { symbolId: 'tower',       emoji: '🗼', name: 'Tower' },
  { symbolId: 'shrine',      emoji: '⛩️', name: 'Shrine' },
  { symbolId: 'mountain',    emoji: '⛰️', name: 'Mountain' },
  { symbolId: 'island',      emoji: '🏝️', name: 'Island' },
  { symbolId: 'tent',        emoji: '⛺', name: 'Tent' },
  { symbolId: 'bridge',      emoji: '🌉', name: 'Bridge' },
  { symbolId: 'city',        emoji: '🌆', name: 'City' },

  // Symbols / Misc
  { symbolId: 'heart',       emoji: '❤️', name: 'Heart' },
  { symbolId: 'star2',       emoji: '🌟', name: 'Glowing Star' },
  { symbolId: 'sparkles',    emoji: '✨', name: 'Sparkles' },
  { symbolId: 'fourleaf',    emoji: '🍀', name: 'Four Leaf Clover' },
  { symbolId: 'anchor',      emoji: '⚓', name: 'Anchor' },
  { symbolId: 'lamp',        emoji: '🪔', name: 'Diya Lamp' },
  { symbolId: 'rainbow2',    emoji: '🌈', name: 'Rainbow Arc' },
  { symbolId: 'peace',       emoji: '☮️', name: 'Peace' },
];

export interface LevelConfig {
  cardCount: number;
  roundCount: number;
  cols: number;
  blankMs: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  { cardCount: 20,  roundCount: 4, cols: 5,  blankMs: 2000 },
  { cardCount: 30,  roundCount: 4, cols: 6,  blankMs: 3000 },
  { cardCount: 42,  roundCount: 5, cols: 7,  blankMs: 4000 },
  { cardCount: 56,  roundCount: 5, cols: 8,  blankMs: 5000 },
  { cardCount: 72,  roundCount: 5, cols: 9,  blankMs: 6000 },
  { cardCount: 90,  roundCount: 4, cols: 10, blankMs: 7000 },
  { cardCount: 110, roundCount: 4, cols: 11, blankMs: 8000 },
  { cardCount: 132, roundCount: 4, cols: 12, blankMs: 10000 },
  { cardCount: 156, roundCount: 3, cols: 13, blankMs: 12000 },
  { cardCount: 182, roundCount: 3, cols: 14, blankMs: 14000 },
  { cardCount: 225, roundCount: 3, cols: 15, blankMs: 16000 },
];

export function buildLevelDeck(level: number): MemoryCard[] {
  const config = LEVEL_CONFIGS[Math.min(level, LEVEL_CONFIGS.length - 1)];
  const pool = [...MEMORY_POOL].sort(() => Math.random() - 0.5).slice(0, config.cardCount);
  return pool.map((item, idx) => ({
    id: idx,
    symbolId: item.symbolId,
    artStyleId: ART_STYLES[idx % ART_STYLES.length].id,
    emoji: item.emoji,
    name: item.name,
    flipped: false,
    matched: false,
  }));
}

export function getMemoryItemById(symbolId: string, cards: MemoryCard[]): MemoryCard | undefined {
  return cards.find((c) => c.symbolId === symbolId);
}
