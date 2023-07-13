export function getRandomChoice<T>(list: T[]): T | undefined {
    if (list.length === 0) {
        return undefined; // Return undefined for an empty list
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

export interface WeightedElement<T> {
    element: T;
    weight: number;
}

export function getRandomChoiceWithWeights<T>(weightedElements: WeightedElement<T>[]): T | undefined {
    if (weightedElements.length === 0) {
        return undefined; // Return undefined for an empty list
    }

    const totalWeight = weightedElements.reduce((sum, { weight }) => sum + weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const { element, weight } of weightedElements) {
        randomNum -= weight;
        if (randomNum <= 0) {
            return element;
        }
    }

    return undefined; // Fallback if no element is selected
}