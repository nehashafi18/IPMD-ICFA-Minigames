import { useCallback, useEffect, useState } from "react";

import GalleryApp from "./routes/GalleryApp";
import { EnterPage } from "./routes/EnterPage";
import { HomePage } from "./routes/HomePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

function currentPath() {
  return window.location.pathname;
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
  const [cardTextColor, setCardTextColor] = useState<
    Record<string, "light" | "dark">
  >({});

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
        <div className="animatedBg">
          <div className="bgBlob bgBlobOne" />
          <div className="bgBlob bgBlobTwo" />

          <div className="particles">
            {Array.from({ length: 24 }).map((_, index) => (
              <span
                key={index}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${8 + Math.random() * 8}s`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="appShell">
          <h1 className="appTitle">Loading cards...</h1>
        </div>
      </div>
    );
  }
  function detectBrightness(
    image: HTMLImageElement,
    category: string,
    cardId: string
  ) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = 50;
    canvas.height = 50;

    ctx.drawImage(
      image,
      0,
      image.naturalHeight * 0.75,
      image.naturalWidth,
      image.naturalHeight * 0.25,
      0,
      0,
      50,
      50
    );

    const data = ctx.getImageData(
      0,
      0,
      50,
      50
    ).data;

    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      totalBrightness +=
        (r * 299 + g * 587 + b * 114) / 1000;
    }

    const average =
      totalBrightness / (data.length / 4);

    setCardTextColor((prev) => ({
      ...prev,
      [`${category}_${cardId}`]:
        average < 130 ? "light" : "dark",
    }));
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
    },
    {
      key: "specialEffect_card",
      title: "Choose a Special Effect",
      cards: buildCards(cardsData.specialEffect_cards, "specialEffect")
    }
  ];

  const currentStep = cardSteps[stepIndex];

  function handleCardClick(cardId: string) {
    setSelectedCards((prev) => ({
      ...prev,
      [currentStep.key]: cardId,
    }));
  }

  async function handleNext() {
    const selected = selectedCards[currentStep.key];

    if (!selected) {
      alert("Please select a card first");
      return;
    }

    if (stepIndex < cardSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      await generatePrompt(selectedCards);
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
  const [path, setPath] = useState(currentPath);

  const navigate = useCallback((nextPath: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, "", nextPath);
    } else {
      window.history.pushState({}, "", nextPath);
    }

    setPath(currentPath());
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (path === "/enter") {
    return <EnterPage navigate={navigate} />;
  }

  if (path === "/image-cards") {
    return (
      <div className="appPage">
        <div className="animatedBg">
          <div className="bgBlob bgBlobOne" />
          <div className="bgBlob bgBlobTwo" />

          <div className="particles">
            {Array.from({ length: 24 }).map((_, index) => (
              <span
                key={index}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${8 + Math.random() * 8}s`,
                }}
              />
            ))}
          </div>
        </div>
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
      <div className="animatedBg">
        <div className="bgBlob bgBlobOne" />
        <div className="bgBlob bgBlobTwo" />

        <div className="particles">
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              key={index}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 8}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="appShell">
        <div className="titleContainer">
          <h1 className="artTitle">
            Image Cards to Fine Art
          </h1>
          <div className="helpWrapper">
            <button className="helpButton" type="button">
              ?
            </button>
            <div className="helpTooltip">
              Upload an image or enter a subject if needed,
              choose an output size, then select one card
              from each category. You can skip a category
              or go back to change your previous choice.
            </div>
          </div>
        </div>

        <div className="controlPanel">
          <div className="uploadArea">
            <div className="fieldLabel">Upload Image</div>

            <label className="uploadButton">
              <div className="uploadContent">
                <svg
                  className="uploadIcon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 16.5A4.5 4.5 0 0 0 18 8h-1.3A7 7 0 1 0 4 14.3" />
                  <path d="M12 12V21" />
                  <path d="M8 16L12 12L16 16" />
                </svg>

                <span>Drag image here or browse</span>
              </div>

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

          </div>
          <div className="promptArea">
            <textarea
              className="subjectInput"
              placeholder="Describe your art prompt..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="sizeArea">
            <div className="fieldLabel">Size</div>

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
              className={`imageCard ${
                selectedCards[currentStep.key] === card.id
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              <img
                className="cardImage"
                src={`/cards/${card.image}`}
                alt={card.label}
              />

              <span
                className={`cardName ${
                  cardTextColor[
                    `${currentStep.key}_${card.id}`
                  ] === "dark"
                    ? "darkText"
                    : "lightText"
                }`}
              >
                {card.label}
              </span>
            </button>
          ))}
        </div>

        <div className="bottomActions">
          <button
            className="secondaryButton"
            onClick={handleBack}
            disabled={stepIndex === 0}
          >
            ← Back
          </button>

          <button
            className="secondaryButton"
            onClick={handleSkip}
          >
            Skip
          </button>

          <button
            className="primaryButton nextButton"
            onClick={handleNext}
            disabled={!selectedCards[currentStep.key]}
          >
            Next Step →
          </button>

          <button
            className="miniGameOpenButton"
            onClick={() => setShowMiniGame(true)}
          >
            🎮 Mini Game
          </button>
        </div>
      </div>

      {loading && (
        <div className="loadingScreen">
          <div className="miniGameWrapper">
            <MiniGame />
          </div>
        </div>
      )}

      {showMiniGame && (
        <div className="miniGameModal">
          <div className="miniGamePanel">
            <button
              className="closeMiniGameButton"
              onClick={() => setShowMiniGame(false)}
            >
              ✕
            </button>

            <MiniGame />
          </div>
        </div>
      )}
    </div>
  );
}
      <ProtectedRoute navigate={navigate}>
        <GalleryApp />
      </ProtectedRoute>
    );
  }

  return <HomePage />;
}
