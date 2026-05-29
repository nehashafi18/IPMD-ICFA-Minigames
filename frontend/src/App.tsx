import { useEffect, useState } from "react";
import "./App.css";
import MiniGame from "./components/miniGames/src/MiniGames";

interface CardData {
  display_name: string;
  description: string;

  image?: string;
  images?: string[];

  prompt_hints?: string[];
  negative_prompt_hints?: string[];
}

interface CardsGroup {
  [key: string]: CardData;
}

interface CardsResponse {
  emotion_cards: CardsGroup;
  memory_cards: CardsGroup;
  imagination_cards: CardsGroup;
  style_cards: CardsGroup;
}

interface SelectedCards {
  [key: string]: string | null;
}

interface StepCard {
  id: string;
  label: string;
  image: string;
  description: string;
}

interface CardStep {
  key: string;
  title: string;
  cards: StepCard[];
}

interface GenerateResponse {
  data: {
    prompt: string;
    image_url: string;
  };
  error?: string;
}

function pickRandomImage(
  images: string[] = [],
  previousImage?: string
): string {
  if (!images.length) return "";

  const availableImages = images.filter(
    (img) => img !== previousImage
  );

  if (!availableImages.length) {
    return images[0];
  }

  return availableImages[
    Math.floor(Math.random() * availableImages.length)
  ];
}

function createRandomImageMap(
  data: CardsResponse,
  previousMap: Record<string, string> = {}
): Record<string, string> {
  const newMap: Record<string, string> = {};

  const categories: [string, CardsGroup][] = [
    ["emotion", data.emotion_cards],
    ["memory", data.memory_cards],
    ["imagination", data.imagination_cards],
    ["style", data.style_cards]
  ];

  categories.forEach(([categoryKey, cards]) => {
    if (!cards) {
      console.warn(`Missing category: ${categoryKey}`);
      return;
    }
    Object.entries(cards).forEach(([id, card]) => {
      const mapKey = `${categoryKey}_${id}`;

      const imageList =
        card.images && card.images.length > 0
          ? card.images
          : card.image
          ? [card.image]
          : [];

      newMap[mapKey] = pickRandomImage(
        imageList,
        previousMap[mapKey]
      );
    });
  });

  return newMap;
}

export default function App() {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [selectedCards, setSelectedCards] = useState<SelectedCards>({});
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState<string>("512x512");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [cardsData, setCardsData] = useState<CardsResponse | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showMiniGame, setShowMiniGame] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>("");

  const [cardImageMap, setCardImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch("http://localhost:5001/api/cards");

        if (!response.ok) {
          throw new Error("Failed to load cards from backend");
        }

        const data: CardsResponse = await response.json();

        setCardsData(data);

        setCardImageMap((previousMap) =>
          createRandomImageMap(data, previousMap)
        );
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        }
      }
    }

    loadCards();
  }, []);

  if (!cardsData) {
    return (
      <div className="appPage">
        <div className="appShell">
          <h1 className="appTitle">Loading cards...</h1>
        </div>
      </div>
    );
  }

  function buildCards(
    cardGroup: CardsGroup,
    categoryKey: string
  ): StepCard[] {
    return Object.entries(cardGroup).map(([id, card]) => {
      const mapKey = `${categoryKey}_${id}`;

      const image =
        cardImageMap[mapKey] ||
        card.images?.[0] ||
        card.image ||
        "";

      return {
        id,
        label: card.display_name,
        description: card.description,
        image
      };
    });
  }

  const cardSteps: CardStep[] = [
    {
      key: "emotion_card",
      title: "Choose an Emotion",
      cards: buildCards(cardsData.emotion_cards, "emotion")
    },
    {
      key: "memory_card",
      title: "Choose a memory",
      cards: buildCards(cardsData.memory_cards, "memory")
    },
    {
      key: "imagination_card",
      title: "Choose a imagination",
      cards: buildCards(
        cardsData.imagination_cards,
        "imagination"
      )
    },
    {
      key: "style_card",
      title: "Choose a Style",
      cards: buildCards(cardsData.style_cards, "style")
    }
  ];

  const currentStep = cardSteps[stepIndex];

  async function handleCardClick(cardId: string) {
    const updatedCards: SelectedCards = {
      ...selectedCards,
      [currentStep.key]: cardId,
    };

    setSelectedCards(updatedCards);

    if (stepIndex < cardSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      await generatePrompt(updatedCards);
    }
  }

  async function handleSkip() {
    const updatedCards: SelectedCards = {
      ...selectedCards,
      [currentStep.key]: null,
    };

    setSelectedCards(updatedCards);

    if (stepIndex < cardSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      await generatePrompt(updatedCards);
    }
  }

  function handleBack() {
    if (stepIndex === 0) return;

    setSelectedCards((prev) => {
      const updated = { ...prev };
      delete updated[cardSteps[stepIndex - 1].key];
      return updated;
    });

    setStepIndex((prev) => prev - 1);
  }

  async function generatePrompt(cards: SelectedCards) {
    const [width, height] = imageSize.split("x").map(Number);

    const formData = new FormData();

    formData.append("subject", subject || "");
    formData.append("language", "en");
    formData.append("width", width.toString());
    formData.append("height", height.toString());

    if (uploadedImage) {
      formData.append("image", uploadedImage);
    }

    Object.entries(cards).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/prompts/generate", {
        method: "POST",
        body: formData,
      });

      const result: GenerateResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate");
      }

      setGeneratedPrompt(result.data.prompt);
      setImageUrl(result.data.image_url);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStepIndex(0);
    setSelectedCards({});
    setGeneratedPrompt("");
    setImageUrl("");

    if (cardsData) {
      setCardImageMap((previousMap) =>
        createRandomImageMap(cardsData, previousMap)
      );
    }
  }

  if (generatedPrompt) {
    return (
      <div className="appPage">
        <div className="appShell">
          <h1 className="appTitle">Generated Prompt</h1>

          <textarea className="promptBox" value={generatedPrompt} readOnly />

          {imageUrl && (
            <img src={imageUrl} alt="Generated" className="generatedImage" />
          )}

          <button className="primaryButton" onClick={restart}>
            Create Another Prompt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appPage">
      <div className="appShell">
        <h1 className="artTitle">Image Cards to Fine Art</h1>

        <div className="instructionBox">
          <h2>How to use</h2>
          <p>
            Upload an image, enter a subject if needed, choose an output size,
            then select one card from each category. You can skip a category or
            go back to change your previous choice.
          </p>
        </div>

        <div className="controlPanel">
          <input
            className="subjectInput"
            type="text"
            placeholder="Optional subject, e.g. a cat, a castle, a robot..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div className="controlRow">
            <label className="uploadButton">
              Upload Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) return;

                  setUploadedImage(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }}
              />
            </label>

            <select
              className="selectBox"
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
            >
              <option value="512x512">512 × 512</option>
              <option value="384x384">384 × 384</option>
              <option value="256x256">256 × 256</option>
              <option value="512x768">512 × 768</option>
              <option value="768x512">768 × 512</option>
            </select>
          </div>
        </div>

        {previewUrl && (
          <img src={previewUrl} alt="Preview" className="previewImage" />
        )}

        <div className="stepHeader">
          <p className="stepText">
            Step {stepIndex + 1} of {cardSteps.length}
          </p>
          <h2>{currentStep.title}</h2>
        </div>

        <div className="cardGrid">
          {currentStep.cards.map((card) => (
            <button
              key={card.id}
              className="imageCard"
              onClick={() => handleCardClick(card.id)}
            >
              <img
                className="cardImage"
                src={`/cards/${card.image}`}
                alt={card.label}
              />

              <span className="cardName">{card.label}</span>
            </button>
          ))}
        </div>

        <div className="bottomActions">
          <button
            className="miniGameOpenButton"
            onClick={() => setShowMiniGame(true)}
          >
            🎮 Play Mini Game
          </button>

          <button
            className="secondaryButton"
            onClick={handleBack}
            disabled={stepIndex === 0}
          >
            ← Back
          </button>

          <button className="primaryButton" onClick={handleSkip}>
            Skip →
          </button>
        </div>
      </div>

      {(loading || showMiniGame) && (
        <div className="loadingScreen">
          {!loading && (
            <button
              className="closeMiniGameButton"
              onClick={() => setShowMiniGame(false)}
            >
              ✕
            </button>
          )}

          <div className="miniGameWrapper">
            <MiniGame />
          </div>
        </div>
      )}
    </div>
  );
}