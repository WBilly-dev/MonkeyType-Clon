/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Toaster, toast } from "sonner";

function App() {
  // Variables Globales
  const INITIAL_TIME = 30;
  const TEXT = "The quick fox brown jumps over the lazy dog";

  const [currentTime, setCurrentTime] = useState<number>(INITIAL_TIME);
  const [startGame, setStartGame] = useState<boolean>(false);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const timeRef = useRef<HTMLTimeElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  // Funciones
  const initGame = useCallback(() => {
    const wordsFromText = TEXT.split(" ").slice(0, 32);
    setWords(wordsFromText);
    setCurrentWordIndex(0);
    setCurrentTime(INITIAL_TIME);
    setInputValue("");
    setCorrectCount(0);
    setIncorrectCount(0);

    if (intervalId.current) {
      clearInterval(intervalId.current);
    }
    intervalId.current = setInterval(() => {
      setCurrentTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalId.current!);
          setStartGame(false);
          const totalTyped = correctCount + incorrectCount;
          const accuracy =
            totalTyped === 0 ? 0 : (correctCount / totalTyped) * 100;
          if (inputRef.current) inputRef.current.value = "";
          toast.error("Time's Up! Game Over", {
            description: `You ran out of time. Your accuracy was ${accuracy}`,
          });
          return 0;
        } else {
          return prevTime - 1;
        }
      });
    }, 1000);
  }, []);

  const handleStart = () => {
    if (!startGame) {
      toast.success("Game Started", { description: "Type Fast!" });
      initGame();
    } else {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      toast.error("Game Over", { description: "See you soon!" });
      setCurrentTime(0);
      if (inputRef.current) inputRef.current.value = ""; // Limpiar input
    }
    setStartGame(!startGame);
  };

  const onKeyUp = useCallback(() => {
    if (inputRef.current) {
      const currentWord = words[currentWordIndex];
      inputRef.current.maxLength = currentWord.length;
      const value = inputRef.current ? inputRef.current.value.trim() : "";
      setInputValue(value);

      // Contar letras correctas e incorrectas
      let correctLetters = 0;
      let incorrectLetters = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === currentWord[i]) {
          correctLetters++;
        } else {
          incorrectLetters++;
        }
      }
      setCorrectCount(correctCount + correctLetters);
      setIncorrectCount(incorrectCount + incorrectLetters);

      if (value === currentWord) {
        if (currentWordIndex + 1 === words.length) {
          // Juego terminado, calcular y mostrar precisión
          setStartGame(false);
          const totalTyped = correctCount + incorrectCount;
          const accuracy =
            totalTyped === 0 ? 0 : (correctCount / totalTyped) * 100;
          toast.success("Congratulations!", {
            description: `You completed the game in ${
              INITIAL_TIME - currentTime
            }s with an accuracy of ${accuracy.toFixed(2)}%`,
          });
          setCurrentWordIndex(0);
          if (inputRef.current) inputRef.current.value = "";
          if (intervalId.current) {
            clearInterval(intervalId.current);
          }
        } else {
          // Avanzar al siguiente índice
          setCurrentWordIndex((prevIndex) => prevIndex + 1);
        }
        if (inputRef.current) inputRef.current.value = "";
      }
    }
  }, [words, currentWordIndex, currentTime, correctCount, incorrectCount]);

  // useEffects
  useEffect(() => {
    if (timeRef.current) {
      timeRef.current.textContent = currentTime.toString();
    }
  }, [currentTime]);

  useEffect(() => {
    initGame();
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [initGame]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener("keyup", onKeyUp);
    }
    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener("keyup", onKeyUp);
      }
    };
  }, [onKeyUp]);

  useEffect(() => {
    if (startGame && inputRef.current) {
      inputRef.current.focus();
    }
  }, [startGame]);

  const getLetterClass = (letter: string, index: number) => {
    if (!inputValue) return "letter";
    const currentWord = words[currentWordIndex];
    const isCorrect =
      index < inputValue.length && letter === currentWord[index];
    const isActive = index === inputValue.length && startGame;
    if (isCorrect) {
      return "correct";
    } else if (index < inputValue.length) {
      return "incorrect";
    } else if (isActive) {
      return "active letter";
    }
    return "letter";
  };

  return (
    <>
      <section
        id="game"
        style={{ fontFamily: "Menlo ,monospace" }}
        className="bg-[#222] gap-8 flex flex-col h-screen  items-center justify-center text-center p-16 "
      >
        {startGame && (
          <div>
            <input
              ref={inputRef}
              autoFocus={!startGame}
              placeholder="Type Play"
              aria-placeholder="monospace"
              className="text-center   "
              type="text"
            />
          </div>
        )}
        {!startGame && (
          <div>
            <h1 className="pointer-events-none text-center text-primary text-3xl">
              Will_Type.Fast<span className="animate-blink">_</span>
            </h1>
          </div>
        )}

        <Toaster closeButton richColors position="top-center" />
        <Button
          onClick={handleStart}
          variant="outline"
          className={`w-60 flex flex-wrap justify-center animate-pulse ${
            startGame ? "bg-red-500 border-red-500" : "bg-white"
          }`}
        >
          {startGame ? "Terminar Juego" : "Iniciar Juego"}
        </Button>

        {startGame && (
          <>
            <time
              ref={timeRef}
              className="text-primary pointer-events-none"
            ></time>
            <div className="flex gap-3 text-white">
              {words.map((word, index) => {
                const letters = word.split("");
                return (
                  <div>
                    <span key={index} className="word text-wrap break-words">
                      {letters.map((letter, i) => (
                        <span
                          key={i}
                          id="letter"
                          className={
                            index === currentWordIndex
                              ? getLetterClass(letter, i)
                              : "letter"
                          }
                        >
                          {letter}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default App;
