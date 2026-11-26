import React, { Component } from "react";
import "./../styles/App.css";

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", totalTiles: 8, pairs: 4, columns: 4 },
  normal: { label: "Normal", totalTiles: 16, pairs: 8, columns: 4 },
  hard: { label: "Hard", totalTiles: 32, pairs: 16, columns: 8 },
};

function createShuffledDeck(pairCount) {
  const numbers = [];
  for (let i = 1; i <= pairCount; i += 1) {
    numbers.push(i, i);
  }

  for (let i = numbers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  return numbers.map((value, index) => ({
    id: `${pairCount}-${index}-${value}`,
    value,
    isFlipped: false,
    isMatched: false,
  }));
}

class App extends Component {
  constructor(props) {
    super(props);
    const initialLevel = "easy";
    this.state = {
      level: initialLevel,
      tiles: createShuffledDeck(DIFFICULTY_CONFIG[initialLevel].pairs),
      selectedIndices: [],
      attempts: 0,
      isChecking: false,
    };
    this.flipTimeout = null;
  }

  componentWillUnmount() {
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
    }
  }

  handleLevelChange = (level) => {
    if (!DIFFICULTY_CONFIG[level]) return;
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
      this.flipTimeout = null;
    }

    this.setState({
      level,
      tiles: createShuffledDeck(DIFFICULTY_CONFIG[level].pairs),
      selectedIndices: [],
      attempts: 0,
      isChecking: false,
    });
  };

  handleTileClick = (index) => {
    const { tiles, selectedIndices, isChecking } = this.state;
    const clickedTile = tiles[index];

    if (
      isChecking ||
      !clickedTile ||
      clickedTile.isFlipped ||
      clickedTile.isMatched ||
      selectedIndices.includes(index)
    ) {
      return;
    }

    const updatedTiles = tiles.map((tile, idx) =>
      idx === index ? { ...tile, isFlipped: true } : tile
    );
    const nextSelected = [...selectedIndices, index];

    if (nextSelected.length < 2) {
      this.setState({
        tiles: updatedTiles,
        selectedIndices: nextSelected,
      });
      return;
    }

    const [firstIdx, secondIdx] = nextSelected;
    const firstTile = updatedTiles[firstIdx];
    const secondTile = updatedTiles[secondIdx];
    const isMatch = firstTile.value === secondTile.value;

    if (isMatch) {
      const matchedTiles = updatedTiles.map((tile, idx) =>
        idx === firstIdx || idx === secondIdx
          ? { ...tile, isFlipped: true, isMatched: true }
          : tile
      );

      this.setState((prevState) => ({
        tiles: matchedTiles,
        selectedIndices: [],
        attempts: prevState.attempts + 1,
        isChecking: false,
      }));
      return;
    }

    this.setState((prevState) => ({
      tiles: updatedTiles,
      selectedIndices: nextSelected,
      attempts: prevState.attempts + 1,
      isChecking: true,
    }));

    this.flipTimeout = setTimeout(() => {
      this.setState((prevState) => ({
        tiles: prevState.tiles.map((tile, idx) =>
          idx === firstIdx || idx === secondIdx
            ? { ...tile, isFlipped: false }
            : tile
        ),
        selectedIndices: [],
        isChecking: false,
      }));
    }, 700);
  };

  handleRestart = () => {
    this.handleLevelChange(this.state.level);
  };

  render() {
    const { level, tiles, attempts } = this.state;
    const config = DIFFICULTY_CONFIG[level];
    const matchedCount = tiles.filter((tile) => tile.isMatched).length;
    const isGameWon = tiles.length > 0 && matchedCount === tiles.length;

    return (
      <div className="game_wrapper">
        <h1>Memory Matching Game</h1>

        <div className="levels_container" role="group" aria-label="Difficulty Levels">
          {Object.keys(DIFFICULTY_CONFIG).map((key) => {
            const item = DIFFICULTY_CONFIG[key];
            return (
              <label key={key} htmlFor={key} className="level_option">
                <input
                  id={key}
                  type="radio"
                  name="difficulty"
                  value={key}
                  checked={level === key}
                  onChange={() => this.handleLevelChange(key)}
                />
                <span>
                  {item.label} ({item.totalTiles} tiles)
                </span>
              </label>
            );
          })}
        </div>

        <div className="game_stats">
          <span>Attempts: {attempts}</span>
          <span>
            Matched: {matchedCount / 2} / {config.pairs}
          </span>
          <button type="button" onClick={this.handleRestart}>
            Restart
          </button>
        </div>

        {isGameWon && (
          <div className="game_status" role="status">
            Completed in {attempts} attempts!
          </div>
        )}

        <div
          className="cells_container"
          style={{
            gridTemplateColumns: `repeat(${config.columns}, minmax(60px, 1fr))`,
          }}
        >
          {tiles.map((tile, index) => {
            const revealed = tile.isFlipped || tile.isMatched;
            return (
              <button
                key={tile.id}
                type="button"
                className={`cell ${revealed ? "flipped" : ""} ${
                  tile.isMatched ? "matched" : ""
                }`}
                onClick={() => this.handleTileClick(index)}
                aria-label={`Tile ${index + 1}`}
              >
                {revealed ? tile.value : "?"}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

export default App;
