
/**
 * Normalizes a string by removing accents and converting to lowercase.
 * @param str The string to normalize.
 * @returns The normalized string.
 */
export function normalizeString(str: string): string {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Calculates the Levenshtein distance between two strings.
 * This implementation is optimized for performance.
 * @param a First string.
 * @param b Second string.
 * @returns The edit distance.
 */
export function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Fuzzy matches a query against a text.
 * Checks for:
 * 1. Normalized exact inclusion (accent/case insensitive).
 * 2. If query length >= 3, checks if any word in the text is within a certain edit distance of the query.
 * 
 * @param text The text to search within (e.g., user name).
 * @param query The search query.
 * @param threshold Max allowed edit distance (default 2).
 * @returns boolean True if match found.
 */
export function fuzzyMatch(text: string, query: string, threshold: number = 2): boolean {
    if (!query) return true;
    if (!text) return false;

    const normText = normalizeString(text);
    const normQuery = normalizeString(query);

    // 1. Direct inclusion check (covers exact matches, partial matches without typos)
    if (normText.includes(normQuery)) {
        return true;
    }

    // 2. Fuzzy check for typos
    // Only apply fuzzy if query is substantive enough to avoid false positives on short strings
    if (normQuery.length < 3) {
        return false;
    }

    // Split text into words to check against query words or the whole query
    const textWords = normText.split(/\s+/);

    // Check if the query is close to any word in the text
    // This helps when searching for "Gabriel" in "Gabriel Silva" with a typo like "Garbiel"
    for (const word of textWords) {
        if (Math.abs(word.length - normQuery.length) > threshold) continue;

        if (levenshteinDistance(word, normQuery) <= threshold) {
            return true;
        }
    }

    // Also check against the full text if it's short enough, 
    // though typically splitting by words is better for names.
    // But let's say someone types "Gabriel Silva" as "Garbiel Silva", 
    // the distance might be 2 (swap r and b), so it should match.
    if (Math.abs(normText.length - normQuery.length) <= threshold) {
        if (levenshteinDistance(normText, normQuery) <= threshold) {
            return true;
        }
    }

    return false;
}
