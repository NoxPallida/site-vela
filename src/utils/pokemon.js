import dexData from '../data/dex_data.json';
import movepoolsData from '../data/movepools.json';
import movesData from '../data/moves.json';

function normalizeKey(str) {
	return String(str || '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');
}

export const TYPE_CHART = {
	Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
	Fighting: { Normal: 2, Flying: 0.5, Poison: 0.5, Rock: 2, Bug: 0.5, Ghost: 0, Steel: 2, Psychic: 0.5, Ice: 2, Dark: 2, Fairy: 0.5 },
	Flying:   { Fighting: 2, Rock: 0.5, Bug: 2, Steel: 0.5, Grass: 2, Electric: 0.5 },
	Poison:   { Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Grass: 2, Fairy: 2 },
	Ground:   { Flying: 0, Poison: 2, Rock: 2, Bug: 0.5, Steel: 2, Fire: 2, Grass: 0.5, Electric: 2 },
	Rock:     { Fighting: 0.5, Flying: 2, Ground: 0.5, Bug: 2, Steel: 0.5, Fire: 2, Ice: 2 },
	Bug:      { Fighting: 0.5, Flying: 0.5, Poison: 0.5, Ghost: 0.5, Steel: 0.5, Fire: 0.5, Grass: 2, Psychic: 2, Dark: 2, Fairy: 0.5 },
	Ghost:    { Normal: 0, Ghost: 2, Psychic: 2, Dark: 0.5 },
	Steel:    { Rock: 2, Steel: 0.5, Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Fairy: 2 },
	Fire:     { Rock: 0.5, Bug: 2, Steel: 2, Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Dragon: 0.5 },
	Water:    { Ground: 2, Rock: 2, Fire: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
	Grass:    { Flying: 0.5, Poison: 0.5, Ground: 2, Rock: 2, Bug: 0.5, Steel: 0.5, Fire: 0.5, Water: 2, Grass: 0.5, Dragon: 0.5 },
	Electric: { Flying: 2, Ground: 0, Water: 2, Grass: 0.5, Electric: 0.5, Dragon: 0.5 },
	Psychic:  { Fighting: 2, Poison: 2, Steel: 0.5, Psychic: 0.5, Dark: 0 },
	Ice:      { Flying: 2, Ground: 2, Steel: 0.5, Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Dragon: 2 },
	Dragon:   { Steel: 0.5, Dragon: 2, Fairy: 0 },
	Dark:     { Fighting: 0.5, Ghost: 2, Psychic: 2, Dark: 0.5, Fairy: 0.5 },
  Fairy:    { Fighting: 2, Poison: 0.5, Steel: 0.5, Fire: 0.5, Dragon: 2, Dark: 2 },
  Diamond:  { Steel: 2, Diamond: 0.5, Dragon: 0.5, Water: 0.5, Fairy: 0.5, Fire: 0.5, Ice: 2, Rock: 2, Ghost: 2, Dark: 2, Flying: 2 },
  Time:     {},
  Space:    {},
  Shadow:   {},
  Divine:   {}
};

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

export function getTypeEffectiveness(types = [], abilities = []) {
	const ALL_TYPES = [
		'Normal', 'Fighting', 'Flying', 'Poison', 'Ground', 'Rock',
		'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass',
    	'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark', 'Fairy',
    	'Diamond', 'Space', 'Time', 'Shadow', 'Divine'
	];

	const normAbilities = (abilities || []).map(a =>
		String(a).toLowerCase().replace(/[^a-z0-9]/g, '')
	);

	const hasAbility = (...names) => {
		return names.some(name => {
			const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
			return normAbilities.some(a => a.includes(norm));
		});
	};

	const effectiveness = {};

	ALL_TYPES.forEach((atkType) => {
		let mult = 1;
		(types || []).forEach((defType) => {
			const formattedDef = defType.charAt(0).toUpperCase() + defType.slice(1).toLowerCase();
			const formattedAtk = atkType.charAt(0).toUpperCase() + atkType.slice(1).toLowerCase();
			if (TYPE_CHART[formattedAtk] && TYPE_CHART[formattedAtk][formattedDef] !== undefined) {
				mult *= TYPE_CHART[formattedAtk][formattedDef];
			}
		});

		if (atkType === 'Ground' && hasAbility('Earth Eater', 'Absorbe-Terre', 'Eelevate', 'Lévitaboost', 'Levitate', 'Lévitation')) {
			mult = 0;
		}
		if (atkType === 'Water' && hasAbility('Dry Skin', 'Peau Sèche', 'Storm Drain', 'Lavabo', 'Water Absorb', 'Absorb Eau')) {
			mult = 0;
		}
		if (atkType === 'Fire' && hasAbility('Flash Fire', 'Torche', 'Well-Baked Body', 'Bien Cuit')) {
			mult = 0;
		}
		if (atkType === 'Electric' && hasAbility('Lightning Rod', 'Paratonnerre', 'Motor Drive', 'Motorisé', 'Volt Absorb', 'Absorb Volt')) {
			mult = 0;
		}
		if (atkType === 'Grass' && hasAbility('Sap Sipper', 'Herbivore')) {
			mult = 0;
		}

		if (atkType === 'Fire' && hasAbility('Heatproof', 'Ignifugé', 'Thick Fat', 'Isograisse', 'Water Bubble', 'Aquabulle')) {
			mult *= 0.5;
		}
		if (atkType === 'Ice' && hasAbility('Thick Fat', 'Isograisse')) {
			mult *= 0.5;
		}
		if (atkType === 'Ghost' && hasAbility('Purifying Salt', 'Sel Purificateur')) {
			mult *= 0.5;
		}
		if (atkType === 'Fire' && hasAbility('Fluffy', 'Boule de Poils')) {
			mult *= 2;
		}

		if (hasAbility('Wonder Guard', 'Garde Mystik') && mult <= 1) {
			mult = 0;
		}

		effectiveness[atkType] = mult;
	});

	return effectiveness;
}

export function formatMultiplier(mult) {
	if (mult === 0) return '0x';
	if (mult === 0.25) return '¼x';
	if (mult === 0.5) return '½x';
	if (mult === 1) return '1x';
	if (mult === 1.5) return '1½x';
	if (mult === 2) return '2x';
	if (mult === 4) return '4x';
	return `${mult}x`;
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
