/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Toaster, toast } from "sonner";
import { Input } from "./components/ui/input";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
// import retryIcon from "../public/icons/retryIcon";

function App() {
  // Variables Globales
  const INITIAL_TIME = 30;
  const TEXT =
    "The quick fox brown jumps over the lazy dog and i will go tonight to your house to play some monopoly";

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [showChart, setShowChart] = useState<boolean>(false);

  // Funciones
  const initGame = useCallback(() => {
    const wordsFromText = TEXT.split(" ").slice(0, 32);
    setWords(wordsFromText);
    setCurrentWordIndex(0);
    setCurrentTime(INITIAL_TIME);
    setInputValue("");
    setCorrectCount(0);
    setIncorrectCount(0);
    setChartData([]);
    setShowChart(false);

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
          setShowChart(true);
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
      setShowChart(true);
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

      setChartData((prevData) => {
        const newData = [...prevData];
        if (newData[currentWordIndex]) {
          newData[currentWordIndex].correctLetters += correctLetters;
          newData[currentWordIndex].incorrectLetters += incorrectLetters;
        } else {
          newData[currentWordIndex] = {
            word: currentWord,
            correctLetters,
            incorrectLetters,
          };
        }
        return newData;
      });

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
          setCorrectCount(0); // Reiniciar correctCount
          setIncorrectCount(0); // Reiniciar incorrectCount
          if (inputRef.current) inputRef.current.value = "";
          if (intervalId.current) {
            clearInterval(intervalId.current);
          }
          setShowChart(true);
        } else {
          // Avanzar al siguiente índice
          setCurrentWordIndex((prevIndex) => prevIndex + 1);
          setCorrectCount(0); // Reiniciar correctCount
          setIncorrectCount(0); // Reiniciar incorrectCount
          setInputValue(""); // Reiniciar inputValue
        }
        if (inputRef.current) inputRef.current.value = "";
      }
    }
  }, [
    words,
    currentWordIndex,
    currentTime,
    correctCount,
    incorrectCount,
    inputValue,
  ]);

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
    // const currentWord = words[currentWordIndex];
    const isCorrect = index < inputValue.length && letter === inputValue[index];
    const isIncorrect =
      index < inputValue.length && letter !== inputValue[index];
    const isActive = index === inputValue.length && startGame;
    if (isCorrect) {
      return "correct";
    } else if (isIncorrect) {
      return "incorrect";
    } else if (isActive) {
      return "active letter";
    }
    return "letter";
  };

  // const resetChartsData = () => {
  //   chartData([]);
  // };

  //Chart config (Statistics)
  const chartConfig = {
    correctLetters: {
      label: "Corrects",
      color: "green",
    },
    incorrectLetters: {
      label: "Incorrects",
      color: "red",
    },
  } satisfies ChartConfig;

  return (
    <>
      <section
        id="game"
        style={{ fontFamily: "Menlo ,monospace" }}
        className="bg-[#222] gap-8 flex flex-col h-screen  items-center justify-center text-center p-16 "
      >
        {showChart && (
          <div>
            <div>
              <ChartContainer
                config={chartConfig}
                className="min-h-[200px] w-full"
              >
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="word"
                    tickLine={false}
                    tickMargin={15}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 10)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="correctLetters"
                    fill="var(--color-correctLetters)"
                    radius={8}
                  />
                  <Bar
                    dataKey="incorrectLetters"
                    fill="var(--color-incorrectLetters)"
                    radius={8}
                  />
                </BarChart>
              </ChartContainer>
            </div>
            <div>{<Button>Reset</Button>}</div>
          </div>
        )}
        {!startGame && (
          <div>
            <div>
              <h1 className="pointer-events-none text-center text-primary text-3xl">
                Will_Type.Fast<span className="animate-blink">_</span>
              </h1>
            </div>
          </div>
        )}

        <Toaster closeButton richColors position="top-center" />
        <div>
          <Button
            onClick={handleStart}
            variant="outline"
            className={`w-60 flex flex-wrap justify-center animate-pulse ${
              startGame ? "bg-red-500 border-red-500" : "bg-white"
            }`}
          >
            {startGame ? "Terminar Juego" : "Iniciar Juego"}
          </Button>
        </div>
        <div>
          {startGame && (
            <div>
              <Input
                ref={inputRef}
                autoFocus={!startGame}
                placeholder="Type Fast"
                aria-placeholder="monospace"
                className="text-center   "
                type="text"
              />
            </div>
          )}
        </div>
        <div>
          {startGame && (
            <>
              <time
                ref={timeRef}
                className="text-primary pointer-events-none"
              ></time>
              <div className="flex gap-3 " id="text-container">
                {words.map((word, index) => {
                  const letters = word.split("");
                  return (
                    <div className="text-wrap break-words ">
                      <span key={index}>
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
        </div>
      </section>
    </>
  );
}

export default App;
