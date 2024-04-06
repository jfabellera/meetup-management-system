export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateMultipleRandomNumbers = (
  count: number,
  min: number,
  max: number
): number[] => {
  const picked: number[] = [];

  const available: number[] = [];
  for (let i = min; i <= max; i++) {
    available.push(i);
  }

  for (let i = 0; i < count; i++) {
    if (available.length === 0) break;
    const randomIndex = generateRandomNumber(0, available.length - 1);
    picked.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return picked;
};
