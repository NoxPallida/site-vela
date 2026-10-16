import dexData from '../data/dex_data.json';
import movepoolsData from '../data/movepools.json';
import movesData from '../data/moves.json';

function normalizeKey(str) {
    return String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

export function extractStats(pokemon) {
    if (!pokemon) return {};
    return pokemon.attributes || pokemon.base || pokemon.stats || {};
}

export function getPokemonName(pokemon) {
    if (!pokemon) return 'Unknown';
    if (typeof pokemon.name === 'string') return pokemon.name;
    if (pokemon.name?.english) return pokemon.name.english;
    if (pokemon.name?.fr) return pokemon.name.fr;
    return 'Unknown';
}

export function getPokemonTypes(pokemon) {
    if (!pokemon) return [];
    return pokemon.types || pokemon.type || [];
}

export function getPokemonMovepool(pkmId) {
    const pkmMovepool = movepoolsData[pkmId] || movepoolsData[String(Number(pkmId))] || [];

    const normalizedMoves = {};
    Object.entries(movesData).forEach(([key, move]) => {
        normalizedMoves[normalizeKey(key)] = move;
        if (move.name) {
            normalizedMoves[normalizeKey(move.name)] = move;
        }
    });

    return pkmMovepool.map((entry) => {
        const moveRawName = entry.move || entry.name || entry.moveId;
        const lookupKey = normalizeKey(moveRawName);
        const moveDetails = normalizedMoves[lookupKey];

        return {
            level: entry.level ?? entry.lvl ?? 0,
            name: moveDetails?.name || moveRawName || 'Unknown Move',
            type: moveDetails?.type || 'Normal',
            category: moveDetails?.category || moveDetails?.damage_class || 'Physical',
            power: moveDetails?.power ?? moveDetails?.base_power ?? '-',
            accuracy: moveDetails?.accuracy ?? '-'
        };
    });
}

// Calcul des statistiques min et max (niveau 50 ou 100)
export function calcStat(base, isHP, level = 100) {
    const baseNum = Number(base) || 0;

    if (isHP) {
        if (baseNum === 1) {
            return { min: 1, max: 1 };
        }
        const min = Math.floor(((2 * baseNum) * level) / 100) + level + 10;
        const max = Math.floor(((2 * baseNum + 31 + 63) * level) / 100) + level + 10;
        return { min, max };
    } else {
        const min = Math.floor((Math.floor(((2 * baseNum) * level) / 100) + 5) * 0.9);
        const max = Math.floor((Math.floor(((2 * baseNum + 31 + 63) * level) / 100) + 5) * 1.1);
        return { min, max };
    }
}
